
import * as assert from 'assert';
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {IRBuilder} from "llvm-node";

// export function passBlockStatement(parent: BlockStatement, ctx: Context, builder: llvm.IRBuilder) {
//     for (const stmt of parent.body) {
//         passStatement(stmt, ctx, builder);
//     }
// }
//
export function passReturnStatement(parent: ts.ReturnStatement, ctx: Context, builder: llvm.IRBuilder) {
    if (!parent.expression) {
        return builder.createRetVoid();
    }

    //
    // if (parent.argument.type === 'Identifier') {
    //     return builder.createRet(
    //         buildFromIdentifier(parent.argument, ctx, builder)
    //     );
    // }
    //
    // if (parent.argument.type === 'BinaryExpression') {
    //     return builder.createRet(
    //         buildFromBinaryExpression(ctx, parent.argument, builder)
    //     );
    // }

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

//
// export function buildFromStringValue(ctx: Context, value: string, builder: llvm.IRBuilder): llvm.Value {
//     return builder.createGlobalStringPtr(
//         value,
//         'tmp'
//     );
// }
//
// function buildFromNumberValue(ctx: Context, value: number, builder: llvm.IRBuilder): llvm.Value {
//     return llvm.ConstantFP.get(ctx.llvmContext, value);
// }
//
// function buildFromBinaryExpression(
//     ctx: Context,
//     expr: BinaryExpression,
//     builder: llvm.IRBuilder
// ): llvm.Value {
//     switch (expr.operator) {
//         case '+': {
//             const left = buildFromExpression(expr.left, ctx, builder);
//             const right = buildFromExpression(expr.right, ctx, builder);
//
//             return builder.createFAdd(
//                 loadIfNeeded(left, builder, ctx),
//                 loadIfNeeded(right, builder, ctx)
//             );
//         }
//         case '-': {
//             const left = buildFromExpression(expr.left, ctx, builder);
//             const right = buildFromExpression(expr.right, ctx, builder);
//
//             return builder.createFSub(
//                 loadIfNeeded(left, builder, ctx),
//                 loadIfNeeded(right, builder, ctx)
//             );
//         }
//         case '*': {
//             const left = buildFromExpression(expr.left, ctx, builder);
//             const right = buildFromExpression(expr.right, ctx, builder);
//
//             return builder.createFMul(
//                 loadIfNeeded(left, builder, ctx),
//                 loadIfNeeded(right, builder, ctx)
//             );
//         }
//         case '/': {
//             const left = buildFromExpression(expr.left, ctx, builder);
//             const right = buildFromExpression(expr.right, ctx, builder);
//
//             return builder.createFDiv(
//                 loadIfNeeded(left, builder, ctx),
//                 loadIfNeeded(right, builder, ctx)
//             );
//         }
//         default:
//             throw new Error(
//                 `Unsupported BinaryExpression.operator: "${expr.type}"`
//             );
//     }
// }
//
// function buildFromCallExpression(
//     ctx: Context,
//     expr: CallExpression,
//     builder: llvm.IRBuilder
// ) {
//     const callle = buildFromExpression(expr.callee, ctx, builder);
//     if (!callle) {
//         throw new Error(
//             `We cannot prepare expression to call this function, ${expr.callee.type}`
//         );
//     }
//
//     const args = expr.arguments.map((expr: Expression | SpreadElement | JSXNamespacedName) => {
//         return buildFromExpression(<any>expr, ctx, builder);
//     });
//
//     return builder.createCall(
//         callle,
//         args,
//     );
// }
//
// function buildFromIdentifier(block: Identifier, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
//     const variable = ctx.variables.get(block.name);
//     if (variable) {
//         return variable;
//     }
//
//     return ctx.llvmModule.getFunction(block.name);
// }
//
// function buildFromExpression(block: Expression, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
//     switch (block.type) {
//         case 'Identifier':
//             return buildFromIdentifier(block, ctx, builder);
//         case 'NumericLiteral':
//             return buildFromNumberValue(ctx, block.value, builder);
//         case 'StringLiteral':
//             return buildFromStringValue(ctx, block.value, builder);
//         case 'BinaryExpression':
//             return buildFromBinaryExpression(ctx, block, builder);
//         case 'CallExpression':
//             return <any>buildFromCallExpression(ctx, block, builder);
//         default:
//             throw new Error(
//                 `Unsupported Expression.type: "${block.type}"`
//             );
//     }
// }
//
// export function passVariableDeclaration(block: VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
//     const declaration = block.declarations[0];
//
//     if (declaration.init) {
//         const defaultValue = buildFromExpression(declaration.init, ctx, builder);
//
//         if (declaration.id.type === 'Identifier') {
//             const allocate = builder.createAlloca(
//                 llvm.Type.getDoubleTy(ctx.llvmContext),
//                 undefined,
//                 declaration.id.name
//             );
//
//             builder.createStore(
//                 defaultValue,
//                 allocate,
//                 false
//             );
//
//             ctx.variables.set(declaration.id.name, allocate);
//         }
//
//         return;
//     }
//
//     throw new Error('Unsupported variable declaration block');
// }
//
//
export function passStatement(stmt: ts.Statement, ctx: Context, builder: llvm.IRBuilder) {
    switch (stmt.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(<any>stmt, ctx, builder);
            break;
        // case ts.SyntaxKind.VariableDeclaration:
        //     passVariableDeclaration(stmt, ctx, builder);
        //     break;
        // case ts.SyntaxKind.ExpressionStatement:
        //     buildFromExpression(stmt.expression, ctx, builder);
        //     break;
        case ts.SyntaxKind.FunctionDeclaration:
            passFunctionDeclaration(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.ReturnStatement:
            passReturnStatement(<any>stmt, ctx, builder);
            break;
        default:
            // throw new Error(`Unsupported statement: "${stmt.kind}"`);
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

function passBlockStatement(node: ts.Block, ctx: Context, builder: IRBuilder) {
    for (const stmt of node.statements) {
        passStatement(stmt, ctx, builder);
    }
}

function passNode(node: ts.Node, ctx: Context, builder: IRBuilder) {
    switch (node.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(<any>node, ctx, builder);
            break;
    }
}

export function generateModuleFromFile(program: ts.Program): llvm.Module {
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
