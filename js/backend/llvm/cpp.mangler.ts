
import * as ts from 'typescript';

function mangleParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
    if (parameters.length > 0) {
        return parameters.map(
            (parameter) => {
                if (parameter.type) {
                    switch (parameter.type.kind) {
                        case ts.SyntaxKind.NumberKeyword:
                            return 'd';
                        case ts.SyntaxKind.StringKeyword:
                            return 'PKc';
                        case ts.SyntaxKind.BooleanKeyword:
                            return 'b';
                        default:
                            throw new Error(
                                `Unsupported mangling parameter type: ${parameter.type.kind}`
                            );
                    }
                }

                throw new Error('Unsupported mangling without type');
            }
        ).join('');
    }

    return 'v';
}

export class CPPMangler {
    static getMethodName(clazz: string, method: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        const name = clazz + '__' + method;

        return '_Z' + name.length + name + mangleParameters(parameters);
    }

    static getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        return '_Z' + name.length + name + mangleParameters(parameters);
    }
}
