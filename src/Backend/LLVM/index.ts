import * as assert from 'assert';
import * as llvm from "llvm-node";

import {
    BlockStatement,
    File,
    Statement,
    VariableDeclaration,
    BinaryExpression,
    Expression,
    CallExpression,
    SpreadElement,
    JSXNamespacedName,
    FunctionDeclaration,
    Identifier,
    ReturnStatement,
} from '@babel/types';
import {IRBuilder} from "llvm-node";

export function passBlockStatement(parent: BlockStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of parent.body) {
        passStatement(stmt, ctx, builder);
    }
}

export function passReturnStatement(parent: ReturnStatement, ctx: Context, builder: llvm.IRBuilder) {
    if (parent.argument === null) {
        return builder.createRetVoid();
    }

    if (parent.argument.type === 'Identifier') {
        return builder.createRet(
            buildFromIdentifier(parent.argument, ctx, builder)
        );
    }

    if (parent.argument.type === 'BinaryExpression') {
        return builder.createRet(
            buildFromBinaryExpression(ctx, parent.argument, builder)
        );
    }

    throw new Error(
        `Unsupported ReturnStatement, unexpected: "${parent.argument.type}"`
    );
}

export function passFunctionDeclaration(parent: FunctionDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    assert.ok(parent.id !== null, 'Function must be declared with name');

    if (!parent.returnType) {
        throw Error('Function must be declared with return type');
    }

    if (parent.returnType.type !== 'TSTypeAnnotation') {
        throw Error(
            `Function must be declared with TypeAnnotation return type, unexpected: "${parent.returnType.type}"`
        );
    }

    let returnType = llvm.Type.getVoidTy(ctx.llvmContext);

    switch (parent.returnType.typeAnnotation.type) {
        case 'TSNumberKeyword':
            returnType = llvm.Type.getDoubleTy(ctx.llvmContext);
            break;
        default:
            throw Error(
                `Function declared with unsupported return type, unexpected "${parent.returnType.typeAnnotation.type}"`
            );
    }

    let fnType = llvm.FunctionType.get(returnType, false);
    let fn = llvm.Function.create(fnType, llvm.LinkageTypes.ExternalLinkage, (<Identifier>parent.id).name, ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, 'Entry', fn);
    let irBuilder = new llvm.IRBuilder(block);

    for (const stmt of parent.body.body) {
        passStatement(stmt, ctx, irBuilder);
    }
}

export function buildFromStringValue(ctx: Context, value: string, builder: llvm.IRBuilder): llvm.Value {
    return builder.createGlobalStringPtr(
        value,
        'tmp'
    );
}

function buildFromNumberValue(ctx: Context, value: number, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantFP.get(ctx.llvmContext, value);
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

            return builder.createFAdd(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx)
            );
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
    const callle = buildFromExpression(expr.callee, ctx, builder);
    if (!callle) {
        throw new Error(
            `We cannot prepare expression to call this function`
        );
    }

    const args = expr.arguments.map((expr: Expression | SpreadElement | JSXNamespacedName) => {
        return buildFromExpression(<any>expr, ctx, builder);
    });

    return builder.createCall(
        callle,
        args,
    );
}

function buildFromIdentifier(block: Identifier, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    const variable = ctx.variables.get(block.name);
    if (variable) {
        return variable;
    }

    return ctx.llvmModule.getFunction(block.name);
}

function buildFromExpression(block: Expression, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    switch (block.type) {
        case 'Identifier':
            return buildFromIdentifier(block, ctx, builder);
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
        const defaultValue = buildFromExpression(declaration.init, ctx, builder);

        if (declaration.id.type === 'Identifier') {
            const allocate = builder.createAlloca(
                llvm.Type.getDoubleTy(ctx.llvmContext),
                undefined,
                declaration.id.name
            );

            builder.createStore(
                defaultValue,
                allocate,
                false
            );

            ctx.variables.set(declaration.id.name, allocate);
        }

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
        case "FunctionDeclaration":
            passFunctionDeclaration(stmt, ctx, builder);
            break;
        case "ReturnStatement":
            passReturnStatement(stmt, ctx, builder);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.type}"`);
    }
}

function loadIfNeeded(value: llvm.Value, builder: IRBuilder, ctx: Context): llvm.Value {
    if (value.type.isPointerTy()) {
        return builder.createLoad(value);
    }

    return value;
}

class SymbolTable extends Map<string, llvm.Value> {

}

class Context {
    public llvmContext: llvm.LLVMContext;
    public llvmModule: llvm.Module;
    public variables: SymbolTable = new SymbolTable();

    public constructor() {
        this.llvmContext = new llvm.LLVMContext();
        this.llvmModule = new llvm.Module("test", this.llvmContext);
    }
}

export function generateModuleFromFile(file: File): llvm.Module {
    const ctx = new Context();

    let putsFnType = llvm.FunctionType.get(llvm.Type.getInt32Ty(ctx.llvmContext), [
        llvm.Type.getInt8PtrTy(ctx.llvmContext)
    ], false);
    ctx.llvmModule.getOrInsertFunction('puts', putsFnType);

    let mainFnType = llvm.FunctionType.get(llvm.Type.getVoidTy(ctx.llvmContext), false);
    let mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    let irBuilder = new llvm.IRBuilder(block);

    for (const node of file.program.body) {
        passStatement(node, ctx, irBuilder);
    }

    irBuilder.createRetVoid();

    return ctx.llvmModule;
}
