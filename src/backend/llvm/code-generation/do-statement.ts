
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passStatement} from "../index";

export class DoStatementGenerator implements NodeGenerateInterface<ts.DoStatement, void> {
    generate(node: ts.DoStatement, ctx: Context, builder: llvm.IRBuilder): void {
        const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.condition");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(conditionBlock);

        const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.true");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext, "for.end");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        builder.createBr(positiveBlock);
        builder.setInsertionPoint(positiveBlock);

        passStatement(<any>node.statement, ctx, builder);

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