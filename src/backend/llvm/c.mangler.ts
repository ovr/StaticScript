
import * as ts from 'typescript';

export class CMangler {
    static getMethodName(parent: string, name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        return name;
    }

    static getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        return name;
    }
}
