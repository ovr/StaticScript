"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function passBlockStatement(block) {
    for (const stmt of block.body) {
        console.log(stmt.type);
    }
}
exports.passBlockStatement = passBlockStatement;
function passStatement(stmt) {
    switch (stmt.type) {
        case "BlockStatement":
            passBlockStatement(stmt);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.type}"`);
    }
}
exports.passStatement = passStatement;
function generateFromFile(file) {
    for (const node of file.program.body) {
        passStatement(node);
    }
}
exports.generateFromFile = generateFromFile;
