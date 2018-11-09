
import {FormatDiagnosticsHost} from 'typescript';

class DiagnosticHost implements FormatDiagnosticsHost {
    public getNewLine(): string {
        return '\n';
    };

    public getCurrentDirectory(): string {
        return __dirname;
    }

    public getCanonicalFileName(fileName: string): string {
        return fileName;
    }
}

const DiagnosticHostInstance = new DiagnosticHost();

export default DiagnosticHostInstance;
