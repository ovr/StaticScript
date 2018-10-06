
import {BlockStatement, File, Statement} from '@babel/types';

export function passBlockStatement(block: BlockStatement) {
    for (const stmt of block.body) {
        console.log(stmt.type);
    }
}

export function passStatement(stmt: Statement) {
    switch (stmt.type) {
        case "BlockStatement":
            passBlockStatement(stmt);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.type}"`);
    }
}

export function generateFromFile(file: File) {
    for (const node of file.program.body) {
        passStatement(node);
    }
}