import {parse} from '@babel/parser'

const example = `
{
    const a = 1;
    const b = 2;
    const c = a + b;

    puts(c);
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
