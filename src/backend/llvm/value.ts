
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

export interface Value {
    getValue(): llvm.Value;
    getType(): ValueTypeEnum;

    toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value;
    isString(): boolean;
}

export class FunctionReference implements Value {
    public llvmValue: llvm.Function;

    constructor(llvmValue: llvm.Function) {
        this.llvmValue = llvmValue;
    }

    getValue(): llvm.Value {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is FunctionReference (=ↀωↀ=)');
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class ArrayReference implements Value {
    public elementType: llvm.Type;
    public llvmValue: llvm.AllocaInst;

    constructor(elementType: llvm.Type, llvmValue: llvm.AllocaInst) {
        this.elementType = elementType;
        this.llvmValue = llvmValue;
    }

    getValue(): llvm.AllocaInst {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is ArrayReference (=ↀωↀ=)');
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class ObjectReference implements Value {
    public classReference: ClassReference;
    public llvmValue: llvm.CallInst;

    constructor(classReference: ClassReference, llvmValue: llvm.CallInst) {
        this.classReference = classReference;
        this.llvmValue = llvmValue;
    }

    getValue(): llvm.CallInst {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is ObjectReference (=ↀωↀ=)');
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class ClassReference implements Value {
    public structType: llvm.StructType;

    getValue(): llvm.Value {
        throw new Error('It is not a real value, it is ClassReference (=ↀωↀ=)');
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is ClassReference (=ↀωↀ=)');
    }

    constructor(structType: llvm.StructType) {
        this.structType = structType;
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class Primitive implements Value {
    public llvmValue: llvm.Value;
    public type: ValueTypeEnum;

    getValue(): llvm.Value {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        return this.type;
    }

    constructor(llvmValue: llvm.Value, type?: ValueTypeEnum) {
        this.llvmValue = llvmValue;
        this.type = type || convertLLVMTypeToValueType(llvmValue.type);
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        if (this.type == ValueTypeEnum.BOOLEAN) {
            return this;
        }

        const value = loadIfNeeded(this, builder);

        if (value.type.isDoubleTy()) {
            return new Primitive(
                builder.createFCmpONE(
                    value,
                    llvm.ConstantFP.get(ctx.llvmContext, 0)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        if (value.type.isIntegerTy()) {
            if (value.type.isIntegerTy(1)) {
                return new Primitive(
                    value,
                    ValueTypeEnum.BOOLEAN
                );
            }

            return new Primitive(
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
