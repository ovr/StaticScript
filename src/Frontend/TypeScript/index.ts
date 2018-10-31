import {parse} from '@babel/parser'

const example = `
{
    function doMath(): number {
        const a = 5.5;
        const b = 14.5;

        return ((a + b) * 50) / 10;
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
