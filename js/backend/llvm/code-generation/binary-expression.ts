
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, Value, ValueTypeEnum} from "../value";
import UnsupportedError from "../../error/unsupported.error";
import {buildFromExpression, loadIfNeeded} from "../index";

export class BinaryExpressionCodeGenerator implements NodeGenerateInterface<ts.BinaryExpression, Value> {
    generate(node: ts.BinaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.EqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                builder.createStore(
                    right.getValue(),
                    left.getValue(),
                    false
                );

                return left;
            }
            /**
             * This section resolve exression with equals operator
             * Example: a += 1;
             */
            case ts.SyntaxKind.PercentEqualsToken:
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            case ts.SyntaxKind.CaretEqualsToken:
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.MinusEqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = this.doExpression(node, ctx, builder);

                builder.createStore(
                    right.getValue(),
                    left.getValue(),
                    false
                );

                return left;
            }
            default:
                return this.doExpression(node, ctx, builder);
        }
    }

    doExpression(node: ts.BinaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFAdd(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFSub(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a * b
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFMul(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a == b
            case ts.SyntaxKind.EqualsEqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFCmpOEQ(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a ** b
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskAsteriskToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createCall(
                        ctx.getIntrinsic('llvm.pow.f64'),
                        [
                            loadIfNeeded(left, builder),
                            loadIfNeeded(right, builder)
                        ]
                    )
                );
            }
            // a ^ b
            case ts.SyntaxKind.CaretEqualsToken:
            case ts.SyntaxKind.CaretToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createXor(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a >> b
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            case ts.SyntaxKind.GreaterThanGreaterThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createAShr(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a << b
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
            case ts.SyntaxKind.LessThanLessThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createShl(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a / b
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFDiv(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a % b
            case ts.SyntaxKind.PercentEqualsToken:
            case ts.SyntaxKind.PercentToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFRem(
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

                return new Primitive(
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

                return new Primitive(
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
