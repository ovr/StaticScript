
import * as llvm from "llvm-node";

export class VariablesTable extends Map<string, llvm.Value> {

}

export class FunctionsTable extends Map<string, llvm.Function> {

}

export class Scope {
    public currentFunction: llvm.Function|null = null;
    public functions: FunctionsTable = new FunctionsTable();
    public variables: VariablesTable = new VariablesTable();
}
