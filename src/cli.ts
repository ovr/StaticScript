
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';
import * as cli from "commander";

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';
import DiagnosticHostInstance from "./diagnostic.host";
import UnsupportedError from "./backend/error/unsupported.error";

interface CommandLineArguments {
    args: string[];
    printIR?: boolean;
}

function parseCommandLine(): CommandLineArguments {
    cli
        .version('next')
        .option('-ir, --printIR', 'Print IR')
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
} catch (e) {
    if (e instanceof UnsupportedError) {
        console.log(ts.formatDiagnostic(e.toDiagnostic(), DiagnosticHostInstance));

        process.exit(1);
    }

    throw e;
}
