
import * as ts from 'typescript';

export class CPPMangler {
    static getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        return '_Z' + name.length + name + parameters.map(
            (parameter) => {
                if (parameter.type) {
                    switch (parameter.type.kind) {
                        case ts.SyntaxKind.NumberKeyword:
                            return 'd';
                        default:
                            throw new Error(
                                `Unsupported mangling parameter type: ${parameter.type.kind}`
                            );
                    }
                }

                throw new Error('Unsupported mangling without type');
            }
        );
    }
}
