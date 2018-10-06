"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript_1 = require("./Frontend/TypeScript");
const LLVM_1 = require("./Backend/LLVM");
const ast = TypeScript_1.parseTypeScript();
// console.log(ast);
const ir = LLVM_1.generateFromFile(ast);
console.log(ir);
