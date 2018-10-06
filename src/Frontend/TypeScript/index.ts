import {parse} from '@babel/parser'

const example = `
{
    const a = 5;
    const b = 5;
    const c = a + b;
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
