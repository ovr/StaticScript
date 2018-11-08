
import * as ts from 'typescript';
import * as path from 'path';
import * as llvm from 'llvm-node';

import {initializeLLVM, generateModuleFromProgram} from './backend/llvm';

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

console.log(llvmModule.print());
