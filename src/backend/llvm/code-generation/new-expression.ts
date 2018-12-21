
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ClassReference, ObjectReference, Value} from "../value";
import {buildCalleFromSignature, buildFromExpression, loadIfNeeded} from "../index";
import UnsupportedError from "../../error/unsupported.error";

export class NewExpressionGenerator implements NodeGenerateInterface<ts.NewExpression, Value> {
    generate(node: ts.NewExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        const signature = ctx.typeChecker.getResolvedSignature(node);

        const reference = buildFromExpression(node.expression, ctx, builder);
        if (reference instanceof ClassReference) {
            // @todo hacks...
            (<any>signature.declaration).name = 'constructor';

            const constructorFn = buildCalleFromSignature(signature, ctx, builder);
            if (!constructorFn) {
                throw new UnsupportedError(
                    node,
                    'Cannot build constructor to call new'
                );
            }

            const args = node.arguments.map((expr) => {
                return loadIfNeeded(
                    buildFromExpression(<any>expr, ctx, builder), builder
                );
            });

            return new ObjectReference(
                reference,
                builder.createCall(
                    constructorFn,
                    args,
                )
            );
        }

        throw new UnsupportedError(
            node,
            'Unsupported new operator on non class reference'
        );
    }
}