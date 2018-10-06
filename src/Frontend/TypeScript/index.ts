import {parse} from '@babel/parser'

const example = `
{
    function getText(): string {
        return "Hello World";
    }

    console.log(getText());
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
