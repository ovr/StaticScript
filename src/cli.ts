
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';
import * as cli from "commander";

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';

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

const compilerOptions = parseCommandLine();

const options = {
    lib: [
        path.join(__dirname, '..', 'packages', 'runtime', 'lib.runtime.d.ts'),
        path.join(__dirname, '..', 'staticscript.d.ts')
    ],
    types: []
};

const files = [
    'sandbox/do-simple-math.ts'
];

const host = ts.createCompilerHost(options);
const program = ts.createProgram(files, options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);

if (diagnostics.length) {
    const format = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getNewLine(): string {
            return '\n';
        },
        getCurrentDirectory(): string {
            return __dirname;
        },
        getCanonicalFileName(fileName: string): string {
            return fileName;
        }
    });
    console.log(format);

    process.exit(1);
}

initializeLLVM();

const llvmModule = generateModuleFromProgram(program);

llvm.verifyModule(llvmModule);

if (compilerOptions.printIR) {
    console.log(llvmModule.print());
}
