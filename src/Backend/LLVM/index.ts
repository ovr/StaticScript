import * as llvm from "llvm-node";

import {
    BlockStatement,
    File,
    Statement,
    VariableDeclaration,
    BinaryExpression,
    Expression,
    CallExpression, SpreadElement, JSXNamespacedName,
} from '@babel/types';

export function passBlockStatement(parent: BlockStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of parent.body) {
        passStatement(stmt, ctx, builder);
    }
}

export function buildFromStringValue(ctx: Context, value: string, builder: llvm.IRBuilder): llvm.Value {
    return builder.createGlobalStringPtr(
        value,
        'tmp'
    );
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

function buildFromCallExpression(
    ctx: Context,
    expr: CallExpression,
    builder: llvm.IRBuilder
) {
    const callle = ctx.llvmModule.getFunction('puts');
    if (!callle) {
        throw new Error(
            `Unknown fn: "puts"`
        );
    }

    const args = expr.arguments.map((expr: Expression | SpreadElement | JSXNamespacedName) => {
        return buildFromExpression(<any>expr, ctx, builder);
    });

    return builder.createCall(
        callle,
        args,
        'putchar'
    );
}

function buildFromExpression(block: Expression, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    switch (block.type) {
        case 'NumericLiteral':
            return buildFromNumberValue(ctx, block.value, builder);
        case 'StringLiteral':
            return buildFromStringValue(ctx, block.value, builder);
        case 'BinaryExpression':
            return buildFromBinaryExpression(ctx, block, builder);
        case 'CallExpression':
            return <any>buildFromCallExpression(ctx, block, builder);
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
        case "ExpressionStatement":
            buildFromExpression(stmt.expression, ctx, builder);
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

    let putsFnType = llvm.FunctionType.get(llvm.Type.getInt32Ty(ctx.llvmContext), [
        llvm.Type.getInt8Ty(ctx.llvmContext)
    ], false);
    ctx.llvmModule.getOrInsertFunction('puts', putsFnType);

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