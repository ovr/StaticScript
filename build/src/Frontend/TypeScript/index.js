"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("@babel/parser");
const example = `
{
    const a = 5;
    const b = 5;
    const c = a + b;
}
`;
function parseTypeScript() {
    const ast = parser_1.parse(example, {
        plugins: [
            'typescript'
        ]
    });
}
exports.parseTypeScript = parseTypeScript;
