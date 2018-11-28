
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeTypeResolver} from "../native-type-resolver";
import UnsupportedError from "../../error/unsupported.error";
import {buildFromExpression, buildFromIdentifier, loadIfNeeded} from "../index";

export class ReturnStatementCodeGenerator implements NodeGenerateInterface<ts.ReturnStatement, any> {
    generate(node: ts.ReturnStatement, ctx: Context, builder: llvm.IRBuilder): any {
        if (!node.expression) {
            return builder.createRetVoid();
        }

        if (node.expression.kind === ts.SyntaxKind.Identifier) {
            return builder.createRet(
                loadIfNeeded(
                    buildFromIdentifier(<any>node.expression, ctx, builder),
                    builder,
                    ctx
                )
            );
        }

        const left = buildFromExpression(
            node.expression,
            ctx,
            builder,
            ctx.scope.enclosureFunction.declaration ? (
                NativeTypeResolver.getType(
                    ctx.typeChecker.getTypeFromTypeNode(ctx.scope.enclosureFunction.declaration.type),
                    ctx
                )
            ) : undefined
        );
        if (left) {
            return builder.createRet(
                loadIfNeeded(left, builder, ctx)
            );
        }

        throw new UnsupportedError(
            node.expression,
            `Unsupported ReturnStatement, unexpected: "${node.expression.kind}"`
        );
    }
}