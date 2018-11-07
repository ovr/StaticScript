
import * as ts from "typescript";
import * as llvm from 'llvm-node';

export function passReturnStatement(parent: ts.ReturnStatement, ctx: Context, builder: llvm.IRBuilder) {
    if (!parent.expression) {
        return builder.createRetVoid();
    }

    if (parent.expression.kind === ts.SyntaxKind.Identifier) {
        return builder.createRet(
            buildFromIdentifier(<any>parent.expression, ctx, builder)
        );
    }

    if (parent.expression.kind === ts.SyntaxKind.BinaryExpression) {
        return builder.createRet(
            buildFromBinaryExpression(<any>parent.expression, ctx, builder)
        );
    }

    throw new Error(
        `Unsupported ReturnStatement, unexpected: "${parent.expression.kind}"`
    );
}

export function passFunctionDeclaration(parent: ts.FunctionDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (!parent.name || !parent.name.escapedText) {
        throw Error('Function must be declared with name');
    }

    if (!parent.type) {
        throw Error('Function must be declared with return type');
    }

    let returnType = llvm.Type.getVoidTy(ctx.llvmContext);

    switch (parent.type.kind) {
        case ts.SyntaxKind.NumberKeyword:
            returnType = llvm.Type.getDoubleTy(ctx.llvmContext);
            break;
        default:
            throw Error(
                `Function declared with unsupported return type, unexpected "${parent.type.kind}"`
            );
    }

    let fnType = llvm.FunctionType.get(returnType, false);
    let fn = llvm.Function.create(fnType, llvm.LinkageTypes.ExternalLinkage, <string>parent.name.escapedText, ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, 'Entry', fn);
    let irBuilder = new llvm.IRBuilder(block);

    if (parent.body) {
        for (const stmt of parent.body.statements) {
            passStatement(stmt, ctx, irBuilder);
        }
    }
}

export function buildFromStringValue(node: ts.StringLiteral, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    return builder.createGlobalStringPtr(
        node.text,
        'tmp'
    );
}

function buildFromNumberValue(value: ts.NumericLiteral, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantFP.get(ctx.llvmContext, parseFloat(value.text));
}

function buildFromBinaryExpression(
    expr: ts.BinaryExpression,
    ctx: Context,
    builder: llvm.IRBuilder
): llvm.Value {
    switch (expr.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            return builder.createFAdd(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx)
            );
        }
        case ts.SyntaxKind.MinusToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            return builder.createFSub(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx)
            );
        }
        case ts.SyntaxKind.AsteriskToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            return builder.createFMul(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx)
            );
        }
        case ts.SyntaxKind.SlashToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            return builder.createFDiv(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx)
            );
        }
        default:
            throw new Error(
                `Unsupported BinaryExpression.operator: "${expr.kind}"`
            );
    }
}

function buildFromCallExpression(
    expr: ts.CallExpression,
    ctx: Context,
    builder: llvm.IRBuilder
) {
    const callle = buildFromExpression(expr.expression, ctx, builder);
    if (!callle) {
        throw new Error(
            `We cannot prepare expression to call this function, ${expr.expression}`
        );
    }

    const args = expr.arguments.map((expr) => {
        return buildFromExpression(<any>expr, ctx, builder);
    });

    return builder.createCall(
        callle,
        args,
    );
}

function buildFromIdentifier(block: ts.Identifier, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    const variable = ctx.variables.get(<string>block.escapedText);
    if (variable) {
        return variable;
    }

    const fn = ctx.llvmModule.getFunction(<string>block.escapedText);
    if (fn) {
        return fn;
    }

    throw new Error(
        `Unknown Identifier: "${<string>block.escapedText}"`
    );
}


function buildFromExpression(block: ts.Expression, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    switch (block.kind) {
        case ts.SyntaxKind.Identifier:
            return buildFromIdentifier(<any>block, ctx, builder);
        case ts.SyntaxKind.NumericLiteral:
            return buildFromNumberValue(<any>block, ctx, builder);
        case ts.SyntaxKind.StringLiteral:
            return buildFromStringValue(<any>block, ctx, builder);
        case ts.SyntaxKind.BinaryExpression:
            return buildFromBinaryExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.CallExpression:
            return <any>buildFromCallExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.ExpressionStatement:
            return <any>buildFromExpression((<any>block).expression, ctx, builder);
        case ts.SyntaxKind.ParenthesizedExpression: {
            return buildFromExpression((<ts.ParenthesizedExpression>block).expression, ctx, builder);
        }
        default:
            throw new Error(
                `Unsupported Expression.type: "${block.kind}"`
            );
    }
}

export function passVariableDeclaration(block: ts.VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (block.initializer) {
        const defaultValue = buildFromExpression(block.initializer, ctx, builder);

        if (block.name.kind == ts.SyntaxKind.Identifier) {
            const allocate = builder.createAlloca(
                llvm.Type.getDoubleTy(ctx.llvmContext),
                undefined,
                <string>block.name.escapedText
            );

            builder.createStore(
                defaultValue,
                allocate,
                false
            );

            ctx.variables.set(<string>block.name.escapedText, allocate);
        }

        return;
    }

    throw new Error('Unsupported variable declaration block');
}

export function passVariableStatement(block: ts.VariableStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const declaration of block.declarationList.declarations) {
        passStatement(<any>declaration, ctx, builder);
    }
}

export function passStatement(stmt: ts.Statement, ctx: Context, builder: llvm.IRBuilder) {
    switch (stmt.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.VariableDeclaration:
            passVariableDeclaration(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.VariableStatement:
            passVariableStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.ExpressionStatement:
            buildFromExpression(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.FunctionDeclaration:
            passFunctionDeclaration(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.ReturnStatement:
            passReturnStatement(<any>stmt, ctx, builder);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.kind}"`);
    }
}

function loadIfNeeded(value: llvm.Value, builder: llvm.IRBuilder, ctx: Context): llvm.Value {
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

function passBlockStatement(node: ts.Block, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of node.statements) {
        passStatement(stmt, ctx, builder);
    }
}

function passNode(node: ts.Node, ctx: Context, builder: llvm.IRBuilder) {
    switch (node.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(<any>node, ctx, builder);
            break;
    }
}

export function initializeLLVM() {
    llvm.initializeAllTargetInfos();
    llvm.initializeAllTargets();
    llvm.initializeAllTargetMCs();
    llvm.initializeAllAsmParsers();
    llvm.initializeAllAsmPrinters();
}

export function generateModuleFromProgram(program: ts.Program): llvm.Module {
    const ctx = new Context();

    let putsFnType = llvm.FunctionType.get(llvm.Type.getInt32Ty(ctx.llvmContext), [
        llvm.Type.getInt8PtrTy(ctx.llvmContext)
    ], false);
    ctx.llvmModule.getOrInsertFunction('puts', putsFnType);

    let number2stringFnType = llvm.FunctionType.get(llvm.Type.getInt8PtrTy(ctx.llvmContext), [
        llvm.Type.getDoubleTy(ctx.llvmContext)
    ], false);
    llvm.Function.create(number2stringFnType, llvm.LinkageTypes.ExternalLinkage, "_Z13number2stringd", ctx.llvmModule);
    // ctx.llvmModule.getOrInsertFunction();

    let mainFnType = llvm.FunctionType.get(llvm.Type.getVoidTy(ctx.llvmContext), false);
    let mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    let builder = new llvm.IRBuilder(block);

    for (const sourceFile of program.getSourceFiles()) {
        sourceFile.forEachChild((node: ts.Node) => passNode(node, ctx, builder))
    }

    builder.createRetVoid();

    return ctx.llvmModule;
}
