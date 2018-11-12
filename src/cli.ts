
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';
import * as cli from "commander";
import {RUNTIME_ARCHIVE_FILE} from "@static-script/runtime";

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';
import DiagnosticHostInstance from "./diagnostic.host";
import UnsupportedError from "./backend/error/unsupported.error";
import {existsSync, mkdirSync, unlinkSync} from "fs";
import {execFileSync} from "child_process";

interface CommandLineArguments {
    args: string[];
    printIR?: boolean;
    outputFile?: boolean;
}

function parseCommandLine(): CommandLineArguments {
    cli
        .version('next')
        .option('-ir, --printIR', 'Print IR')
        .option('-o, --outputFile', 'Name of the executable file')
        .parse(process.argv);

    return cli as any as CommandLineArguments;
}

const cliOptions = parseCommandLine();

const options = {
    lib: [
        path.join(__dirname, '..', 'packages', 'runtime', 'lib.runtime.d.ts'),
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

    try {
        llvm.writeBitcodeToFile(llvmModule, path.join(outputPath, 'main.ll'));

        const optimizationLevel = "-O3";

        execFileSync('llc', [
            optimizationLevel,
            '-filetype=obj', path.join(outputPath, 'main.ll'),
            '-o', path.join(outputPath, 'main.o')
        ]);
        execFileSync("cc", [
            optimizationLevel,
            path.join(outputPath, 'main.o'),
            RUNTIME_ARCHIVE_FILE,
            '-o', path.join(outputPath, 'main'),
            '-lstdc++',
            '-std=c++11',
            '-Werror',
            '-v',
        ]);
    } finally {
        // unlinkSync(outputPath);
    }
} catch (e) {
    if (e instanceof UnsupportedError) {
        console.log(ts.formatDiagnostic(e.toDiagnostic(), DiagnosticHostInstance));

        process.exit(1);
    }

    throw e;
}

