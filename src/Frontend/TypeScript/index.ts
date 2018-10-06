import {parse} from '@babel/parser'

const example = `
{
    function returnVoid(): void {
        return;
    }

    returnVoid();

    puts("Hello World!");
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
