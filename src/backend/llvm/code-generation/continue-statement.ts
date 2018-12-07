
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import UnsupportedError from "../../error/unsupported.error";

export class ContinueStatementGenerator implements NodeGenerateInterface<ts.ContinueStatement, void> {
    generate(node: ts.ContinueStatement, ctx: Context, builder: llvm.IRBuilder): void {
        if (node.label) {
            throw new UnsupportedError(
                node,
                'Continue with label is unsupported'
            );
        }

        if (!ctx.scope.continueBlock) {
            throw new UnsupportedError(
                node,
                'There is no pointer to jump outside this block to continue'
            );
        }

        builder.createBr(ctx.scope.continueBlock);
    }
}