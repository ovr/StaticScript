
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Value, ValueTypeEnum} from "../value";
import UnsupportedError from "../../error/unsupported.error";
import {buildFromExpression, loadIfNeeded} from "../index";

export class BinaryExpressionCodeGenerator implements NodeGenerateInterface<ts.BinaryExpression, Value> {
    generate(node: ts.BinaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.EqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createStore(
                        right.llvmValue,
                        left.llvmValue,
                        false
                    )
                );
            }
            case ts.SyntaxKind.PlusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createFAdd(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            case ts.SyntaxKind.MinusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createFSub(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a * b
            case ts.SyntaxKind.AsteriskToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createFMul(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a ^ b - XOR
            case ts.SyntaxKind.CaretToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createXor(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            case ts.SyntaxKind.SlashToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Value(
                    builder.createFDiv(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            case ts.SyntaxKind.GreaterThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
                // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

                // const leftInt = builder.createFPToSI(
                //     loadIfNeeded(left, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );
                // const rightInt = builder.createFPToSI(
                //     loadIfNeeded(right, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );

                return new Value(
                    builder.createFCmpOGT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpGT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );
            }
            case ts.SyntaxKind.LessThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
                // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

                // const leftInt = builder.createFPToSI(
                //     loadIfNeeded(left, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );
                //
                // const rightInt = builder.createFPToSI(
                //     loadIfNeeded(right, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );

                return new Value(
                    builder.createFCmpOLT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpLT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );
            }
            default:
                throw new UnsupportedError(
                    node,
                    `Unsupported BinaryExpression.operator: "${node.operatorToken.kind}"`
                );
        }
    }
}