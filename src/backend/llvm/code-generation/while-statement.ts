
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passStatement} from "../index";

export class WhileStatementGenerator implements NodeGenerateInterface<ts.WhileStatement, void> {
    generate(node: ts.WhileStatement, ctx: Context, builder: llvm.IRBuilder): void {
        const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "while.condition");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(conditionBlock);

        const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "while.body");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        builder.createBr(conditionBlock);
        builder.setInsertionPoint(conditionBlock);

        emitCondition(
            node.expression,
            ctx,
            builder,
            positiveBlock,
            next
        );

        builder.setInsertionPoint(positiveBlock);
        passStatement(<any>node.statement, ctx, builder);

        // jump again to condition
        builder.createBr(conditionBlock);

        builder.setInsertionPoint(next);
    }
}