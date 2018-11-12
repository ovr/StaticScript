
import * as ts from 'typescript';

export class CMangler {
    static getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        return name;
    }
}
