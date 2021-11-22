
import * as llvm from 'llvm-node';

export class NativeType {
    protected llvmType: llvm.Type;
    protected signed: boolean;

    public constructor(llvmType: llvm.Type, signed: boolean = false) {
        this.llvmType = llvmType;
        this.signed = signed;
    }

    public getType(): llvm.Type {
        return this.llvmType;
    }

    public isSigned(): boolean {
        return this.signed;
    }
}
