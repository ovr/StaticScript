import {parse} from '@babel/parser'

const example = `
{
    function doMath(): number {
        const a = 1.2;
        const b = 2.5;

        return a + b;
    }

    doMath();
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
