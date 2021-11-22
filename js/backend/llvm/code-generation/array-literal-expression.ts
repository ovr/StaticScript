
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ArrayReference} from "../value";
import {NativeType} from "../native-type";
import UnsupportedError from "../../error";

export class ArrayLiteralExpressionCodeGenerator implements NodeGenerateInterface<ts.ArrayLiteralExpression, ArrayReference> {
    generate(node: ts.ArrayLiteralExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): ArrayReference {
        if (!nativeType) {
            throw new UnsupportedError(
                node,
                'NativeTypeResolver didnt resolve type of this array'
            );
        }

        const structType = ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            nativeType.getType(),
            ctx,
            `array<${nativeType.getType().toString()}>`
        );

        const allocate = builder.createAlloca(
            structType
        );

        return new ArrayReference(
            structType.getElementType(0),
            allocate
        );
    }

    static buildTypedArrayStructLLVMType(elementType: llvm.Type, ctx: Context, name: string): llvm.StructType {
        const structType = llvm.StructType.create(ctx.llvmContext, name);

        structType.setBody([
            elementType,
            // size
            llvm.Type.getInt32Ty(ctx.llvmContext),
            // capacity
            llvm.Type.getInt32Ty(ctx.llvmContext),
        ]);

        return structType;
    }
}
