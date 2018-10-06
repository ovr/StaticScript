
import {parseTypeScript} from './Frontend/TypeScript';
import {generateFromFile} from './Backend/LLVM';

const ast = parseTypeScript();

// console.log(ast);

const ir = generateFromFile(ast);

// console.log(ir);
