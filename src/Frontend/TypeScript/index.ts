import {parse} from '@babel/parser'

const example = `
{
    function returnVoid(): void {
        return;
    }

    returnVoid();

    console.log("Hello World!");
}
`;

export function parseTypeScript() {
    const ast = parse(example, {
        plugins: [
            'typescript'
        ]
    });

    return ast;
}
