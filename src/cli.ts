
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {generateModuleFromFile} from './Backend/LLVM';

const options = {
    lib: [],
    types: []
};

const files = [
    'sandbox/do-simple-math.ts'
];
const host = ts.createCompilerHost(options);
const program = ts.createProgram(files, options, host);

// console.log(ast);

llvm.initializeAllTargetInfos();
llvm.initializeAllTargets();
llvm.initializeAllTargetMCs();
llvm.initializeAllAsmParsers();
llvm.initializeAllAsmPrinters();

const llvmModule = generateModuleFromFile(program);

llvm.verifyModule(llvmModule);

console.log(llvmModule.print());

