
import * as llvm from 'llvm-node';

export enum ValueTypeEnum {
    STRING = 'STRING',
    DOUBLE = 'DOUBLE',
    BOOLEAN = 'BOOLEAN',
    //
    UNKNOWN = 'UNKNOWN',
    //
    INT8 = 'INT8',
    INT16 = 'INT16',
    INT32 = 'INT32',
    INT64 = 'INT64',
    INT128 = 'INT128',
}

export function convertLLVMTypeToValueType(type: llvm.Type) {
    switch (type.typeID) {
        case llvm.Type.TypeID.DoubleTyID:
            return ValueTypeEnum.DOUBLE;
        default:
            return ValueTypeEnum.UNKNOWN;
    }
}

export class Value {
    public llvmValue: llvm.Value;
    public type: ValueTypeEnum;

    constructor(llvmValue: llvm.Value, type?: ValueTypeEnum) {
        this.llvmValue = llvmValue;
        this.type = type || convertLLVMTypeToValueType(llvmValue.type);
    }

    public isString(): boolean {
        return this.type === ValueTypeEnum.STRING;
    }
}
