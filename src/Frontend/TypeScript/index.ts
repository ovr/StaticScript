import {parse} from '@babel/parser'

const example = `
{
    const a = 1 + 5;
    console.log(5);
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
