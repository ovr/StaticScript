
import * as ts from 'typescript';

export class CPPMangler {
    static getFunctionName(name: string, parameters: ts.NodeArray<ts.ParameterDeclaration>): string {
        if (name === 'puts') {
            return name;
        }

        return '_Z13number2stringd';
    }
}
