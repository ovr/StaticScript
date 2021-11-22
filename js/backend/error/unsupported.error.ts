
import * as ts from 'typescript';

export default class UnsupportedError extends Error {
    protected node: ts.Node;

    constructor(node: ts.Node, message: string) {
        super(message);

        this.node = node;
    }

    public toDiagnostic(): ts.Diagnostic {
        return {
            category: ts.DiagnosticCategory.Error,
            code: 1000,
            file: this.node.getSourceFile(),
            start: this.node.getFullStart(),
            length: this.node.getFullWidth(),
            messageText: this.message
        }
    }
}
