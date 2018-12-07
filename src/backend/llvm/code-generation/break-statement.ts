
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import UnsupportedError from "../../error/unsupported.error";

export class BreakStatementGenerator implements NodeGenerateInterface<ts.BreakStatement, void> {
    generate(node: ts.BreakStatement, ctx: Context, builder: llvm.IRBuilder): void {
        if (node.label) {
            throw new UnsupportedError(
                node,
                'Break with label is unsupported'
            );
        }

        if (!ctx.scope.breakBlock) {
            throw new UnsupportedError(
                node,
                'There is no pointer to jump outside this block to break'
            );
        }

        builder.createBr(ctx.scope.breakBlock);
    }
}