import {parse} from '@babel/parser'

const example = `
{
    console.log('Hello world!');
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
