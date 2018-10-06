"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("@babel/parser");
var example = "\n{\n    const a = 5;\n    const b = 5;\n    const c = a + b;\n}\n";
function parseTypeScript() {
    var ast = parser_1.parse(example, {
        plugins: [
            'typescript'
        ]
    });
}
exports.parseTypeScript = parseTypeScript;
