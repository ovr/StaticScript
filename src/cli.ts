
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';
import * as cli from "commander";
import {RUNTIME_ARCHIVE_FILE, RUNTIME_DEFINITION_FILE} from "@static-script/runtime";

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';
import DiagnosticHostInstance from "./diagnostic.host";
import UnsupportedError from "./backend/error/unsupported.error";
import {existsSync, mkdirSync, unlinkSync} from "fs";
import {execFileSync} from "child_process";
import {executeLLCSync} from "./utils";

interface CommandLineArguments {
    args: string[];
    printIR?: boolean;
    outputFile?: string;
    optimizationLevel?: string;
}

function parseCommandLine(): CommandLineArguments {
    cli
        .version('next')
        .option('-ir, --printIR', 'Print IR', false)
        .option('-f, --outputFile <n>', 'Name of the executable file', 'main')
        .option('-o, --optimizationLevel <n>', 'Optimization level', 3)
        .parse(process.argv);

    return cli as any as CommandLineArguments;
}

const cliOptions = parseCommandLine();

const options = {
    lib: [
        RUNTIME_DEFINITION_FILE,
        path.join(__dirname, '..', 'staticscript.d.ts')
    ],
    types: []
};

const files = cliOptions.args;

const host = ts.createCompilerHost(options);
const program = ts.createProgram(files, options, host);

const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
    const format = ts.formatDiagnosticsWithColorAndContext(diagnostics, DiagnosticHostInstance);
    console.log(format);

    process.exit(1);
}

initializeLLVM();

try {
    const llvmModule = generateModuleFromProgram(program);

    llvm.verifyModule(llvmModule);

    if (cliOptions.printIR) {
        console.log(llvmModule.print());
    }

    const outputPath = path.join(process.cwd(), 'output');

    if (!existsSync(outputPath)) {
        mkdirSync(outputPath);
    }

    llvm.writeBitcodeToFile(llvmModule, path.join(outputPath, 'main.bc'));

    const optimizationLevel = `-O${cliOptions.optimizationLevel}`;

    executeLLCSync([
        optimizationLevel,
        // Fully relocatable, position independent code
        '-relocation-model=pic',
        '-filetype=obj', path.join(outputPath, 'main.bc'),
        '-o', path.join(outputPath, 'main.o'),
    ]);
    execFileSync("c++", [
        optimizationLevel,
        path.join(outputPath, 'main.o'),
        RUNTIME_ARCHIVE_FILE,
        '-o', path.join(outputPath, cliOptions.outputFile),
        '-lstdc++',
        '-std=c++11',
        '-Werror',
        '-pthread',
        '-v',
    ]);
} catch (e) {
    if (e instanceof UnsupportedError) {
        console.log(ts.formatDiagnostic(e.toDiagnostic(), DiagnosticHostInstance));

        process.exit(1);
    }

    throw e;
}

