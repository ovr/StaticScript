
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';
import * as cli from "commander";
import {RUNTIME_ARCHIVE_FILE, RUNTIME_DEFINITION_FILE} from "@static-script/runtime";

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';
import DiagnosticHostInstance from "./diagnostic.host";
import UnsupportedError from "./backend/error/unsupported.error";
import {existsSync, mkdirSync} from "fs";
import {execFileSync} from "child_process";
import {executeLLCSync, executeOptSync} from "./utils";

interface CommandLineArguments {
    args: string[];
    debug: boolean;
    printIR: boolean;
    outputFile: string;
    optimizationLevel: string;
}

function parseCommandLine(): CommandLineArguments {
    cli
        .version('next')
        .option('--debug', 'Show all debug information', false)
        .option('-ir, --printIR', 'Print IR', false)
        .option('-f, --outputFile <n>', 'Name of the executable file', 'main')
        .option('-o, --optimizationLevel <n>', 'Optimization level', 3)
        .parse(process.argv);

    return cli as any as CommandLineArguments;
}

const cliOptions = parseCommandLine();

const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2018,
    jsx: ts.JsxEmit.None,
    lib: [
        path.join(__dirname, '..', 'staticscript.d.ts'),
        RUNTIME_DEFINITION_FILE,
    ],
    types: []
};

const files = cliOptions.args;

const host = ts.createCompilerHost(options);
const program = ts.createProgram(files, options, host);

const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
    ts.sys.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, DiagnosticHostInstance));
    ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
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

    if (cliOptions.debug) {
        ts.sys.write('Executing llvm-opt');
    }

    {
        const output = executeOptSync([
            optimizationLevel,
            path.join(outputPath, 'main.bc'),
            '-o', path.join(outputPath, 'main.bc')
        ]);

        if (cliOptions.debug) {
            ts.sys.write(output.toString());
        }
    }

    if (cliOptions.debug) {
        ts.sys.write('Executing llvm-llc');
    }

    {
        const output = executeLLCSync([
            optimizationLevel,
            // Fully relocatable, position independent code
            '-relocation-model=pic',
            '-filetype=obj', path.join(outputPath, 'main.bc'),
            '-o', path.join(outputPath, 'main.o'),
        ]);

        if (cliOptions.debug) {
            ts.sys.write(output.toString());
        }
    }

    if (cliOptions.debug) {
        ts.sys.write('Executing c++ compiler');
    }

    {
        const output = execFileSync("c++", [
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

        if (cliOptions.debug) {
            ts.sys.write(output.toString());
        }
    }
} catch (e) {
    if (e instanceof UnsupportedError) {
        ts.sys.write(ts.formatDiagnosticsWithColorAndContext([e.toDiagnostic()], DiagnosticHostInstance));
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    throw e;
}

