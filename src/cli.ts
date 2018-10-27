
import * as llvm from 'llvm-node';
import {parseTypeScript} from './Frontend/TypeScript';
import {generateModuleFromFile} from './Backend/LLVM';

const ast = parseTypeScript();

// console.log(ast);

llvm.initializeAllTargetInfos();
llvm.initializeAllTargets();
llvm.initializeAllTargetMCs();
llvm.initializeAllAsmParsers();
llvm.initializeAllAsmPrinters();

const llvmModule = generateModuleFromFile(ast);

console.log(llvm.verifyModule(llvmModule));
console.log(llvmModule.print());
