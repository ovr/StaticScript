
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ArrayReference} from "../value";

export class ArrayLiteralExpressionCodeGenerator implements NodeGenerateInterface<ts.ArrayLiteralExpression, ArrayReference> {
    generate(node: ts.ArrayLiteralExpression, ctx: Context, builder: llvm.IRBuilder): ArrayReference {
        // const type = ctx.typeChecker.getTypeAtLocation(node);
        // const elementType = NativeTypeResolver.getType(type, ctx);

        // @todo Fix this hardcore...
        const elementType = llvm.Type.getDoublePtrTy(ctx.llvmContext);

        const structType = llvm.StructType.create(ctx.llvmContext, 'array<int>');
        structType.setBody([
            elementType,
            llvm.Type.getInt32Ty(ctx.llvmContext),
        ]);

        const allocate = builder.createAlloca(
            structType
        );

        return new ArrayReference(
            elementType,
            allocate
        );
    }
}
