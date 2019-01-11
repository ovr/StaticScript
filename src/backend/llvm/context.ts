
import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Scope} from "./scope";
import {ArrayLiteralExpressionCodeGenerator} from "./code-generation/array-literal-expression";

export class SignatureToFunctionTable extends Map<ts.Signature, llvm.Function> {

}

export class Context {
    public typeChecker: ts.TypeChecker;

    public llvmContext: llvm.LLVMContext;
    public llvmModule: llvm.Module;

    public signature: SignatureToFunctionTable = new SignatureToFunctionTable();
    public scope: Scope = new Scope();

    public constructor(typeChecker: ts.TypeChecker) {
        this.typeChecker = typeChecker;
        this.llvmContext = new llvm.LLVMContext();
        this.llvmModule = new llvm.Module("test", this.llvmContext);

        this.scope.classes.set('Uint8Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt8Ty(this.llvmContext),
            this,
            'array<uint8>'
        ));

        this.scope.classes.set('Int8Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt8Ty(this.llvmContext),
            this,
            'array<int8>'
        ));

        this.scope.classes.set('Int16Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt16Ty(this.llvmContext),
            this,
            'array<int16>'
        ));

        this.scope.classes.set('Uint16Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt16Ty(this.llvmContext),
            this,
            'array<uint16>'
        ));

        this.scope.classes.set('Int32Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt32Ty(this.llvmContext),
            this,
            'array<int32>'
        ));

        this.scope.classes.set('Uint32Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getInt32Ty(this.llvmContext),
            this,
            'array<uint32>'
        ));

        this.scope.classes.set('Float32Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getFloatTy(this.llvmContext),
            this,
            'array<float32>'
        ));

        this.scope.classes.set('Float64Array', ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            llvm.Type.getDoubleTy(this.llvmContext),
            this,
            'array<float64>'
        ));
    }

    getIntrinsic(functionName: string): llvm.Function {
        const moduleFn = this.llvmModule.getFunction(functionName);
        if (moduleFn) {
            return moduleFn;
        }

        switch (functionName) {
            case 'llvm.pow.f64':
                const intrinsicType = llvm.FunctionType.get(
                    llvm.Type.getDoubleTy(this.llvmContext),
                    [
                        llvm.Type.getDoubleTy(this.llvmContext),
                        llvm.Type.getDoubleTy(this.llvmContext),
                    ],
                    false
                );

                return llvm.Function.create(
                    intrinsicType,
                    llvm.LinkageTypes.ExternalLinkage,
                    functionName,
                    this.llvmModule
                );
            default:
                throw new Error(`Unknown intrinsic: "${functionName}"`);
        }
    }
}
