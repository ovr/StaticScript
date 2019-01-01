
import * as ts from 'typescript';

class DiagnosticHost implements ts.FormatDiagnosticsHost {
    public getNewLine(): string {
        return ts.sys.newLine;
    };

    public getCurrentDirectory(): string {
        return ts.sys.getCurrentDirectory();
    }

    public getCanonicalFileName(fileName: string): string {
        return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
    }
}

const DiagnosticHostInstance = new DiagnosticHost();

export default DiagnosticHostInstance;
