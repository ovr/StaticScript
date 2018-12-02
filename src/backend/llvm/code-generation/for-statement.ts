
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passStatement} from "../index";

export class ForStatementGenerator implements NodeGenerateInterface<ts.ForStatement, void> {
    generate(node: ts.ForStatement, ctx: Context, builder: llvm.IRBuilder): void {
        if (node.initializer) {
            passStatement(<any>node.initializer, ctx, builder);
        }

        const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.condition", ctx.scope.enclosureFunction.llvmFunction);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(conditionBlock);

        const bodyBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.body");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(bodyBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        if (node.condition) {
            builder.createBr(conditionBlock);
            builder.setInsertionPoint(conditionBlock);

            emitCondition(
                node.condition,
                ctx,
                builder,
                bodyBlock,
                next
            );
        } else {
            builder.createBr(next);
        }

        builder.setInsertionPoint(bodyBlock);
        passStatement(node.statement, ctx, builder);

        if (node.incrementor) {
            const incrementer = llvm.BasicBlock.create(ctx.llvmContext, "for.inc");
            ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(incrementer);

            // jump from bodyBlock to incrementer
            builder.createBr(incrementer);
            builder.setInsertionPoint(incrementer);

            passStatement(<any>node.incrementor, ctx, builder);
        }

        // jump again to condition
        builder.createBr(conditionBlock);

        builder.setInsertionPoint(next);
    }
}