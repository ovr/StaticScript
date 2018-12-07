
import * as llvm from 'llvm-node';
import * as ts from 'typescript';
import {Context} from "./context";
import UnsupportedError from "../error/unsupported.error";
import {loadIfNeeded} from "./index";

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

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        const value = loadIfNeeded(this, builder);

        if (value.type.isDoubleTy()) {
            return new Value(
                builder.createFCmpONE(
                    value,
                    llvm.ConstantFP.get(ctx.llvmContext, 0)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        if (value.type.isIntegerTy()) {
            if (value.type.isIntegerTy(1)) {
                return new Value(
                    value,
                    ValueTypeEnum.BOOLEAN
                );
            }

            return new Value(
                builder.createICmpNE(
                    value,
                    llvm.ConstantInt.get(ctx.llvmContext, 0)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        throw new UnsupportedError(
            node,
            `Unsupported cast ${this.llvmValue.type} to boolean`
        );
    }

    public isString(): boolean {
        return this.type === ValueTypeEnum.STRING;
    }
}
