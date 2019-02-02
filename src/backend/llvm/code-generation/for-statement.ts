
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

        const bodyBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.body");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(bodyBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        /**
         * Pointer to block where cycle iteration start
         * if there is condition inside for, this will point to condition block (body -> condition -> body/next)
         * else this will point to bodyBlock (body -> body), it's inifinity cycle due there is not condition
         */
        let startBlock: llvm.BasicBlock = bodyBlock;

        if (node.condition) {
            const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.condition", ctx.scope.enclosureFunction.llvmFunction);
            ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(conditionBlock);

            startBlock = conditionBlock;

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
            builder.createBr(bodyBlock);
            builder.setInsertionPoint(bodyBlock);
        }

        /**
         * Continue block can be incrementer block: for (i = 0; i < 100; i++)
         * or next block: for (i = 0; i < 100; )
         */
        let continueBlock: llvm.BasicBlock = startBlock;

        if (node.incrementor) {
            const incrementer = llvm.BasicBlock.create(ctx.llvmContext, "for.inc");
            ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(incrementer);

            builder.setInsertionPoint(incrementer);
            passStatement(<any>node.incrementor, ctx, builder);

            builder.createBr(startBlock);

            continueBlock = incrementer;
        }

        ctx.scope.breakBlock = next;
        ctx.scope.continueBlock = continueBlock;

        builder.setInsertionPoint(bodyBlock);
        passStatement(node.statement, ctx, builder);

        // next iteration of cycle
        builder.createBr(continueBlock);

        ctx.scope.breakBlock = null;
        ctx.scope.continueBlock = null;

        builder.setInsertionPoint(next);
    }
}
