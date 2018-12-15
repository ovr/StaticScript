
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ClassReference, ObjectReference , Value} from "../value";
import {buildFromExpression} from "../index";
import UnsupportedError from "../../error/unsupported.error";

export class NewExpressionGenerator implements NodeGenerateInterface<ts.NewExpression, Value> {
    generate(node: ts.NewExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        const reference = buildFromExpression(node.expression, ctx, builder);
        if (reference instanceof ClassReference) {
            const allocate = builder.createAlloca(
                reference.structType
            );

            return new ObjectReference(
                reference,
                allocate
            );
        }

        throw new UnsupportedError(
            node,
            'Unsupported new operator on non class reference'
        );
    }
}