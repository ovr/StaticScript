
import * as llvm from "llvm-node";
import {FunctionDeclaration} from "typescript";
import {Value} from "./value";

export class VariablesTable extends Map<string, Value> {

}

export class FunctionsTable extends Map<string, llvm.Function> {

}

export class ClassesTable extends Map<string, llvm.StructType> {

}

export class EnclosureFunction {
    public llvmFunction: llvm.Function;
    public declaration: FunctionDeclaration|null = null;
}

export class Scope {
    public enclosureFunction: EnclosureFunction;
    public functions: FunctionsTable = new FunctionsTable();
    public variables: VariablesTable = new VariablesTable();
    public classes: ClassesTable = new ClassesTable();
    public breakBlock: llvm.BasicBlock|null = null;
    public continueBlock: llvm.BasicBlock|null = null;
}
