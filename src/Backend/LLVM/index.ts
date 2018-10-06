import * as llvm from "llvm-node";

import {BlockStatement, File, Statement, VariableDeclaration, BinaryExpression, Expression} from '@babel/types';

export function passBlockStatement(parent: BlockStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of parent.body) {
        passStatement(stmt, ctx, builder);
    }
}

function buildFromNumberValue(ctx: Context, value: number, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantInt.get(ctx.llvmContext, 0, 32, true);
}

function buildFromBinaryExpression(
    ctx: Context,
    expr: BinaryExpression,
    builder: llvm.IRBuilder
): llvm.Value {
    switch (expr.operator) {
        case '+':
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            return builder.createFAdd(left, right);
        default:
            throw new Error(
                `Unsupported BinaryExpression.operator: "${expr.type}"`
            );
    }
}

function buildFromExpression(block: Expression, ctx: Context, builder: llvm.IRBuilder) {
    switch (block.type) {
        case 'NumericLiteral':
            return buildFromNumberValue(ctx, block.value, builder);
        case 'BinaryExpression':
            return buildFromBinaryExpression(ctx, block, builder);
        default:
            throw new Error(
                `Unsupported Expression.type: "${block.type}"`
            );
    }
}

export function passVariableDeclaration(block: VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    const declaration = block.declarations[0];

    if (declaration.init) {
        const right = buildFromExpression(declaration.init, ctx, builder);

        return;
    }

    throw new Error('Unsupported variable declaration block');
}

export function passStatement(stmt: Statement, ctx: Context, builder: llvm.IRBuilder) {
    switch (stmt.type) {
        case "BlockStatement":
            passBlockStatement(stmt, ctx, builder);
            break;
        case "VariableDeclaration":
            passVariableDeclaration(stmt, ctx, builder);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.type}"`);
    }
}

class Context {
    public llvmContext: llvm.LLVMContext;
    public llvmModule: llvm.Module;

    public constructor() {
        this.llvmContext = new llvm.LLVMContext();
        this.llvmModule = new llvm.Module("test", this.llvmContext);
    }
}

export function generateFromFile(file: File) {
    const ctx = new Context();

    let mainFnType = llvm.FunctionType.get(llvm.Type.getInt32Ty(ctx.llvmContext), false);
    let mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    let irBuilder = new llvm.IRBuilder(block);

    for (const node of file.program.body) {
        passStatement(node, ctx, irBuilder);
    }

    const ll = ctx.llvmModule.print();
    console.log(ll);
}