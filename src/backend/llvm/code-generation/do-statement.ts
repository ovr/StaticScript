
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passStatement} from "../index";

export class DoStatementGenerator implements NodeGenerateInterface<ts.DoStatement, void> {
    generate(node: ts.DoStatement, ctx: Context, builder: llvm.IRBuilder): void {
        const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "do.condition");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(conditionBlock);

        const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "do.body");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        ctx.scope.breakBlock = next;
        ctx.scope.continueBlock = conditionBlock;

        builder.createBr(positiveBlock);
        builder.setInsertionPoint(positiveBlock);

        passStatement(<any>node.statement, ctx, builder);

        ctx.scope.breakBlock = null;
        ctx.scope.continueBlock = null;

        builder.createBr(conditionBlock);
        builder.setInsertionPoint(conditionBlock);

        emitCondition(
            node.expression,
            ctx,
            builder,
            positiveBlock,
            next
        );

        builder.setInsertionPoint(next);
    }
}