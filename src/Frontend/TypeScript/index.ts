import {parse} from '@babel/parser'

const example = `
{
    function doMath(): number {
        const a = 1;
        const b = 2;
        const c = a + b;
        
        return c;
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
