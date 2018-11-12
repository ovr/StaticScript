
import * as ts from 'typescript';
import {DiagnosticCategory} from 'typescript';

export default class UnsupportedError extends Error {
    protected node: ts.Node;

    constructor(node: ts.Node, message: string) {
        super(message);

        this.node = node;
    }

    public toDiagnostic(): ts.Diagnostic {
        return {
            category: DiagnosticCategory.Error,
            code: 1000000,
            file: this.node.getSourceFile(),
            start: this.node.getStart(),
            length: this.node.getWidth(),
            messageText: this.message
        }
    }
}
