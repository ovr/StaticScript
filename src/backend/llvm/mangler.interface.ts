
import * as ts from "typescript";

export interface ManglerInterface {
    getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string;
    getMethodName(parent: string, name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string;
}
