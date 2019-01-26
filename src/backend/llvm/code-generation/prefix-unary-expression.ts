
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Value} from "../value";
import UnsupportedError from "../../error";
import {buildFromExpression, loadIfNeeded} from "../index";

export class PrefixUnaryExpressionCodeGenerator implements NodeGenerateInterface<ts.PrefixUnaryExpression, Value> {
    generate(node: ts.PrefixUnaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken: {
                const left = buildFromExpression(node.operand, ctx, builder);

                const next = builder.createFAdd(
                    loadIfNeeded(left, builder),
                    llvm.ConstantFP.get(ctx.llvmContext, 1)
                );

                builder.createStore(
                    next,
                    left.getValue(),
                    false
                );

                return left;
            }
            case ts.SyntaxKind.MinusMinusToken: {
                const left = buildFromExpression(node.operand, ctx, builder);

                const next = builder.createFSub(
                    loadIfNeeded(left, builder),
                    llvm.ConstantFP.get(ctx.llvmContext, 1)
                );

                builder.createStore(
                    next,
                    left.getValue(),
                    false
                );

                return left;
            }
            default:
                throw new UnsupportedError(
                    node,
                    `Unsupported PostfixUnaryExpression.operator: "${node.operator}"`
                );
        }
    }
}
