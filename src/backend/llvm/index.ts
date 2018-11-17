
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {CPPMangler} from "./cpp.mangler";
import {Context} from "./context";
import {NativeTypeResolver} from "./native-type-resolver";
import UnsupportedError from "../error/unsupported.error";
import {NativeType} from "./native-type";
import {RUNTIME_DEFINITION_FILE} from "@static-script/runtime";
import {LANGUAGE_DEFINITION_FILE} from "../../constants";
import {CMangler} from "./c.mangler";
import {ManglerInterface} from "./mangler.interface";
import {SignatureDeclaration} from "typescript";

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

    throw new UnsupportedError(
        parent.expression,
        `Unsupported ReturnStatement, unexpected: "${parent.expression.kind}"`
    );
}

export function passIfStatement(parent: ts.IfStatement, ctx: Context, builder: llvm.IRBuilder) {
    const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.true");
    ctx.scope.currentFunction.addBasicBlock(positiveBlock);

    const negativeBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.false");
    ctx.scope.currentFunction.addBasicBlock(negativeBlock);

    const next = llvm.BasicBlock.create(ctx.llvmContext, "if.end");
    ctx.scope.currentFunction.addBasicBlock(next);

    emitCondition(
        parent.expression,
        ctx,
        builder,
        positiveBlock,
        negativeBlock
    );

    builder.setInsertionPoint(positiveBlock);
    passNode(parent.thenStatement, ctx, builder);

    builder.createBr(next);

    builder.setInsertionPoint(negativeBlock);
    passNode(parent.elseStatement, ctx, builder);

    builder.createBr(next);

    builder.setInsertionPoint(next);
}

export function passForStatement(parent: ts.ForStatement, ctx: Context, builder: llvm.IRBuilder) {
    if (parent.initializer) {
        passStatement(<any>parent.initializer, ctx, builder);
    }

    const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.condition");
    ctx.scope.currentFunction.addBasicBlock(conditionBlock);

    const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.true");
    ctx.scope.currentFunction.addBasicBlock(positiveBlock);

    const next = llvm.BasicBlock.create(ctx.llvmContext, "for.end");
    ctx.scope.currentFunction.addBasicBlock(next);

    if (parent.condition) {
        builder.createBr(conditionBlock);
        builder.setInsertionPoint(conditionBlock);

        emitCondition(
            parent.condition,
            ctx,
            builder,
            positiveBlock,
            next
        );
    } else {
        builder.createBr(next);
    }

    builder.setInsertionPoint(positiveBlock);
    passStatement(parent.statement, ctx, builder);

    if (parent.incrementor) {
        passStatement(<any>parent.incrementor, ctx, builder);
    }

    // jump again to condition
    builder.createBr(conditionBlock);

    builder.setInsertionPoint(next);
}

export function passDoStatement(parent: ts.DoStatement, ctx: Context, builder: llvm.IRBuilder) {
    const conditionBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.condition");
    ctx.scope.currentFunction.addBasicBlock(conditionBlock);

    const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "for.true");
    ctx.scope.currentFunction.addBasicBlock(positiveBlock);

    const next = llvm.BasicBlock.create(ctx.llvmContext, "for.end");
    ctx.scope.currentFunction.addBasicBlock(next);

    builder.createBr(positiveBlock);
    builder.setInsertionPoint(positiveBlock);

    passStatement(<any>parent.statement, ctx, builder);

    builder.createBr(conditionBlock);
    builder.setInsertionPoint(conditionBlock);

    emitCondition(
        parent.expression,
        ctx,
        builder,
        positiveBlock,
        next
    );

    builder.setInsertionPoint(next);
}

export function emitCondition(
    condition: ts.Expression,
    ctx: Context,
    builder: llvm.IRBuilder,
    positiveBlock: llvm.BasicBlock,
    negativeBlock: llvm.BasicBlock,
) {
    const left = buildFromExpression(condition, ctx, builder);

    const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));

    const conditionBoolValue = builder.createICmpNE(leftInt, llvm.ConstantInt.get(ctx.llvmContext, 0));
    builder.createCondBr(conditionBoolValue, positiveBlock, negativeBlock);
}

export function passFunctionDeclaration(parent: ts.FunctionDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (!parent.name || !parent.name.escapedText) {
        throw Error('Function must be declared with name');
    }

    if (!parent.type) {
        throw Error('Function must be declared with return type');
    }

    let returnType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parent.type), ctx).getType();
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

export function buildFromTrueKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantInt.get(
        ctx.llvmContext,
        1,
        1,
        false
    );
}

export function buildFromFalseKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantInt.get(
        ctx.llvmContext,
        0,
        1,
        false
    );
}

function buildFromNumericLiteral(
    value: ts.NumericLiteral,
    ctx: Context,
    builder: llvm.IRBuilder,
    nativeType?: NativeType
): llvm.Value {
    if (!nativeType || nativeType.getType().isDoubleTy()) {
        return llvm.ConstantFP.get(ctx.llvmContext, parseFloat(value.text));
    }

    return llvm.ConstantInt.get(
        ctx.llvmContext,
        parseInt(value.text),
        (<llvm.IntegerType>nativeType.getType()).getBitWidth(),
        nativeType.isSigned()
    );
}

function buildFromBinaryExpression(
    expr: ts.BinaryExpression,
    ctx: Context,
    builder: llvm.IRBuilder
): llvm.Value {
    switch (expr.operatorToken.kind) {
        case ts.SyntaxKind.EqualsToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            builder.createStore(
                right,
                left,
                false
            );
        }
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
        case ts.SyntaxKind.GreaterThanToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
            // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

            // const leftInt = builder.createFPToSI(
            //     loadIfNeeded(left, builder, ctx),
            //     llvm.Type.getInt32Ty(ctx.llvmContext)
            // );
            // const rightInt = builder.createFPToSI(
            //     loadIfNeeded(right, builder, ctx),
            //     llvm.Type.getInt32Ty(ctx.llvmContext)
            // );

            return builder.createFCmpOGT(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx),
                'cmpGT'
            );
        }
        case ts.SyntaxKind.LessThanToken: {
            const left = buildFromExpression(expr.left, ctx, builder);
            const right = buildFromExpression(expr.right, ctx, builder);

            // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
            // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

            // const leftInt = builder.createFPToSI(
            //     loadIfNeeded(left, builder, ctx),
            //     llvm.Type.getInt32Ty(ctx.llvmContext)
            // );
            //
            // const rightInt = builder.createFPToSI(
            //     loadIfNeeded(right, builder, ctx),
            //     llvm.Type.getInt32Ty(ctx.llvmContext)
            // );

            return builder.createFCmpOLT(
                loadIfNeeded(left, builder, ctx),
                loadIfNeeded(right, builder, ctx),
                'cmpLT'
            );
        }
        default:
            throw new UnsupportedError(
                expr,
                `Unsupported BinaryExpression.operator: "${expr.operatorToken.kind}"`
            );
    }
}

function buildFromPostfixUnaryExpression(
    expr: ts.PostfixUnaryExpression,
    ctx: Context,
    builder: llvm.IRBuilder
): llvm.Value {
    switch (expr.operator) {
        case ts.SyntaxKind.PlusPlusToken: {
            const left = buildFromExpression(expr.operand, ctx, builder);

            const next = builder.createFAdd(
                loadIfNeeded(left, builder, ctx),
                llvm.ConstantFP.get(ctx.llvmContext, 1)
            );

            return builder.createStore(
                next,
                left,
                false
            );
        }
        case ts.SyntaxKind.MinusMinusToken: {
            const left = buildFromExpression(expr.operand, ctx, builder);

            const next = builder.createFSub(
                loadIfNeeded(left, builder, ctx),
                llvm.ConstantFP.get(ctx.llvmContext, 1)
            );

            return builder.createStore(
                next,
                left,
                false
            );
        }
        default:
            throw new UnsupportedError(
                expr,
                `Unsupported PostfixUnaryExpression.operator: "${expr.operator}"`
            );
    }
}


function mangleNameFromDecleration(
    declaration: ts.SignatureDeclaration,
    ctx: Context,
    mangler: ManglerInterface
) {
    if (declaration.kind === ts.SyntaxKind.MethodDeclaration) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            <string>left.symbol.escapedName,
            <string>(<ts.Identifier>declaration.name).escapedText,
            declaration.parameters
        );
    }

    return mangler.getFunctionName(
        <string>(<ts.Identifier>declaration.name).escapedText,
        declaration.parameters
    );
}


function buildCalleFromCallExpression(
    expr: ts.CallExpression,
    ctx: Context,
    builder: llvm.IRBuilder
) {
    const calleSignature = ctx.typeChecker.getResolvedSignature(expr);
    if (calleSignature) {
        if (ctx.signature.has(calleSignature)) {
            return ctx.signature.get(calleSignature);
        }

        const declaration = <ts.SignatureDeclaration>calleSignature.declaration;
        if (declaration.name) {
            const sourceFile = declaration.getSourceFile();

            if (sourceFile.fileName === RUNTIME_DEFINITION_FILE) {
                const llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    mangleNameFromDecleration(declaration, ctx, CPPMangler)
                );

                ctx.signature.set(calleSignature, llvmFunction);

                return llvmFunction;
            }

            if (sourceFile.fileName === LANGUAGE_DEFINITION_FILE) {
                const llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    mangleNameFromDecleration(declaration, ctx, CMangler)
                );


                ctx.signature.set(calleSignature, llvmFunction);

                return llvmFunction;
            }
        }
    }

    return buildFromExpression(expr.expression, ctx, builder);
}

function buildFromCallExpression(
    expr: ts.CallExpression,
    ctx: Context,
    builder: llvm.IRBuilder
) {
    const callle = buildCalleFromCallExpression(expr, ctx, builder);
    if (!callle) {
        throw new UnsupportedError(
            expr,
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

function declareFunctionFromDefinition(
    stmt: ts.FunctionDeclaration,
    ctx: Context,
    builder: llvm.IRBuilder,
    name: string
): llvm.Function {
    let fnType = llvm.FunctionType.get(
        stmt.type ? NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(stmt.type), ctx).getType() : llvm.Type.getVoidTy(ctx.llvmContext),
        stmt.parameters.map((parameters) => {
            if (parameters.type) {
                return NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parameters.type), ctx).getType()
            }

            throw new UnsupportedError(
                stmt,
                `Unsupported parameter`
            );
        }),
        false
    );

    return llvm.Function.create(
        fnType,
        llvm.LinkageTypes.ExternalLinkage,
        name,
        ctx.llvmModule
    );
}

function buildFromIdentifier(identifier: ts.Identifier, ctx: Context, builder: llvm.IRBuilder): llvm.Value {
    const variable = ctx.scope.variables.get(<string>identifier.escapedText);
    if (variable) {
        return variable;
    }

    const fn = ctx.llvmModule.getFunction(<string>identifier.escapedText);
    if (fn) {
        return fn;
    }

    throw new UnsupportedError(
        identifier,
        `Unknown Identifier: "${<string>identifier.escapedText}"`
    );
}


function buildFromExpression(block: ts.Expression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): llvm.Value {
    switch (block.kind) {
        case ts.SyntaxKind.Identifier:
            return buildFromIdentifier(<any>block, ctx, builder);
        case ts.SyntaxKind.NumericLiteral:
            return buildFromNumericLiteral(<any>block, ctx, builder, nativeType);
        case ts.SyntaxKind.StringLiteral:
            return buildFromStringValue(<any>block, ctx, builder);
        case ts.SyntaxKind.TrueKeyword:
            return buildFromTrueKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.FalseKeyword:
            return buildFromFalseKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.BinaryExpression:
            return buildFromBinaryExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.PostfixUnaryExpression:
            return buildFromPostfixUnaryExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.CallExpression:
            return <any>buildFromCallExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.ExpressionStatement:
            return <any>buildFromExpression((<any>block).expression, ctx, builder);
        case ts.SyntaxKind.ParenthesizedExpression: {
            return buildFromExpression((<ts.ParenthesizedExpression>block).expression, ctx, builder);
        }
        default:
            throw new UnsupportedError(
                block,
                `Unsupported Expression.type: "${block.kind}"`
            );
    }
}

export function passVariableDeclaration(block: ts.VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (block.initializer) {
        const type = ctx.typeChecker.getTypeAtLocation(block);

        const nativeType = NativeTypeResolver.getType(
            type,
            ctx
        );

        const defaultValue = buildFromExpression(block.initializer, ctx, builder, nativeType);

        if (block.name.kind == ts.SyntaxKind.Identifier) {
            const allocate = builder.createAlloca(
                nativeType.getType(),
                undefined,
                <string>block.name.escapedText
            );

            builder.createStore(
                defaultValue,
                allocate,
                false
            );

            ctx.scope.variables.set(<string>block.name.escapedText, allocate);
        }

        return;
    }

    throw new UnsupportedError(
        block,
        'Unsupported variable declaration block'
    );
}

export function passVariableDeclarationList(block: ts.VariableDeclarationList, ctx: Context, builder: llvm.IRBuilder) {
    for (const variableDeclaration of block.declarations) {
        passVariableDeclaration(variableDeclaration, ctx, builder);
    }
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
        case ts.SyntaxKind.VariableDeclarationList:
            passVariableDeclarationList(<any>stmt, ctx, builder);
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
        case ts.SyntaxKind.IfStatement:
            passIfStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.ForStatement:
            passForStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.DoStatement:
            passDoStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.BinaryExpression:
            buildFromBinaryExpression(<any>stmt, ctx, builder);
            break;
        default:
            throw new UnsupportedError(
                stmt,
                `Unsupported statement: "${stmt.kind}"`
            );
    }
}

function loadIfNeeded(value: llvm.Value, builder: llvm.IRBuilder, ctx: Context): llvm.Value {
    if (value.type.isPointerTy()) {
        return builder.createLoad(value);
    }

    return value;
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
    const ctx = new Context(
        program.getTypeChecker()
    );

    const mainFnType = llvm.FunctionType.get(llvm.Type.getVoidTy(ctx.llvmContext), false);
    const mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    const block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    const builder = new llvm.IRBuilder(block);

    ctx.scope.currentFunction = mainFn;

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            sourceFile.forEachChild((node: ts.Node) => passNode(node, ctx, builder))
        }
    }

    builder.createRetVoid();

    return ctx.llvmModule;
}
