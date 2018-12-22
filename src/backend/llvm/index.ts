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
import {
    ArrayReference,
    ClassReference,
    FunctionReference,
    ObjectReference,
    Primitive,
    Value,
    ValueTypeEnum
} from "./value";
import {BinaryExpressionCodeGenerator} from "./code-generation/binary-expression";
import {ReturnStatementCodeGenerator} from "./code-generation/return-statement";
import {ForStatementGenerator} from "./code-generation/for-statement";
import {DoStatementGenerator} from "./code-generation/do-statement";
import {WhileStatementGenerator} from "./code-generation/while-statement";
import {BreakStatementGenerator} from "./code-generation/break-statement";
import {ContinueStatementGenerator} from "./code-generation/continue-statement";
import {ClassDeclarationGenerator} from "./code-generation/class-statement";
import {NewExpressionGenerator} from "./code-generation/new-expression";
import {ArrayLiteralExpressionCodeGenerator} from "./code-generation/array-literal-expression";
import {ArrayLiteralExpression} from "typescript";
import {IfStatementCodeGenerator} from "./code-generation/if-statement";
import {CallExpressionCodeGenerator} from "./code-generation/call-expression";
import {PropertyAccessExpressionCodeGenerator} from "./code-generation/property-access-expression";

export function emitCondition(
    condition: ts.Expression,
    ctx: Context,
    builder: llvm.IRBuilder,
    positiveBlock: llvm.BasicBlock,
    negativeBlock: llvm.BasicBlock,
) {
    const left = buildFromExpression(condition, ctx, builder);

    const conditionBoolValue = left.toBoolean(ctx, builder, condition);
    builder.createCondBr(conditionBoolValue.getValue(), positiveBlock, negativeBlock);
}

export function passFunctionDeclaration(parent: ts.FunctionDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (!parent.name || !parent.name.escapedText) {
        throw Error('Function must be declared with name');
    }

    if (!parent.type) {
        throw Error('Function must be declared with return type');
    }

    let returnType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parent.type), ctx).getType();
    let fnType = llvm.FunctionType.get(
        returnType,
        parent.parameters.map((parameter) => {
            if (parameter.type) {
                const nativeType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parameter.type), ctx);
                if (nativeType) {
                    return nativeType.getType();
                }
            }

            throw new UnsupportedError(
                parameter,
                `Unsupported parameter`
            );
        }),
        false
    );
    let fn = llvm.Function.create(fnType, llvm.LinkageTypes.ExternalLinkage, <string>parent.name.escapedText, ctx.llvmModule);


    let block = llvm.BasicBlock.create(ctx.llvmContext, 'Entry', fn);
    let irBuilder = new llvm.IRBuilder(block);

    for (const argument of fn.getArguments()) {
        const parameter = parent.parameters[argument.argumentNumber];
        if (parameter) {
            ctx.scope.variables.set(<string>(<ts.Identifier>parameter.name).escapedText, new Primitive(argument));
        } else {
            throw new UnsupportedError(
                parameter,
                `Unsupported parameter`
            );
        }
    }


    // Store to return back
    const enclosureFnStore = ctx.scope.enclosureFunction;

    ctx.scope.enclosureFunction = {
        llvmFunction: fn,
        declaration: parent
    };

    if (parent.body) {
        for (const stmt of parent.body.statements) {
            passStatement(stmt, ctx, irBuilder);
        }
    }

    // store back
    ctx.scope.enclosureFunction = enclosureFnStore;

    if (returnType.isVoidTy()) {
        if (!block.getTerminator()) {
            irBuilder.createRetVoid();
        }

        const nextBlock = irBuilder.getInsertBlock();
        if (!nextBlock.getTerminator()) {
            irBuilder.createRetVoid();
        }
    }
}

export function buildFromStringValue(node: ts.StringLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        builder.createGlobalStringPtr(
            node.text,
        ),
        ValueTypeEnum.STRING
    );
}

export function buildFromTrueKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            1,
            1,
            false
        ),
        ValueTypeEnum.BOOLEAN
    );
}

export function buildFromFalseKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            0,
            1,
            false
        ),
        ValueTypeEnum.BOOLEAN
    );
}

function buildFromNumericLiteral(
    value: ts.NumericLiteral,
    ctx: Context,
    builder: llvm.IRBuilder,
    nativeType?: NativeType
): Value {
    if (!nativeType || nativeType.getType().isDoubleTy()) {
        return new Primitive(
            llvm.ConstantFP.get(ctx.llvmContext, parseFloat(value.text)),
            ValueTypeEnum.DOUBLE
        );
    }

    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            parseInt(value.text),
            (<llvm.IntegerType>nativeType.getType()).getBitWidth(),
            nativeType.isSigned()
        ),
    );
}

function buildFromPostfixUnaryExpression(
    expr: ts.PostfixUnaryExpression,
    ctx: Context,
    builder: llvm.IRBuilder
): Value {
    switch (expr.operator) {
        case ts.SyntaxKind.PlusPlusToken: {
            const left = buildFromExpression(expr.operand, ctx, builder);

            const next = builder.createFAdd(
                loadIfNeeded(left, builder),
                llvm.ConstantFP.get(ctx.llvmContext, 1)
            );

            builder.createStore(
                next,
                left.getValue(),
                false
            );

            return left;
        }
        case ts.SyntaxKind.MinusMinusToken: {
            const left = buildFromExpression(expr.operand, ctx, builder);

            const next = builder.createFSub(
                loadIfNeeded(left, builder),
                llvm.ConstantFP.get(ctx.llvmContext, 1)
            );

            builder.createStore(
                next,
                left.getValue(),
                false
            );

            return left;
        }
        default:
            throw new UnsupportedError(
                expr,
                `Unsupported PostfixUnaryExpression.operator: "${expr.operator}"`
            );
    }
}

function extractNameFromObjectType(
    type: ts.ObjectType
): string {
    const name = <string>type.symbol.escapedName;

    if (type.isClassOrInterface() && type.typeParameters) {
        return name + type.typeParameters.map((typeParameter: ts.TypeParameter) => {
            return <string>typeParameter.symbol.escapedName;
        }).join('');
    }

    return name;
}

function mangleNameFromDeclaration(
    declaration: ts.SignatureDeclaration,
    ctx: Context,
    mangler: ManglerInterface
) {
    if (declaration.kind === ts.SyntaxKind.MethodDeclaration || declaration.kind === ts.SyntaxKind.MethodSignature) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            extractNameFromObjectType(left),
            <string>(<ts.Identifier>declaration.name).escapedText,
            declaration.parameters
        );
    }

    if (declaration.kind === ts.SyntaxKind.ConstructSignature) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            extractNameFromObjectType(left),
            <string>(<any>declaration.name),
            declaration.parameters
        );
    }

    return mangler.getFunctionName(
        <string>(<ts.Identifier>declaration.name).escapedText,
        declaration.parameters
    );
}


export function buildCalleFromSignature(
    signature: ts.Signature,
    ctx: Context,
    builder: llvm.IRBuilder
): llvm.Function|null {
    if (ctx.signature.has(signature)) {
        return ctx.signature.get(signature);
    }

    const declaration = <ts.SignatureDeclaration>signature.declaration;
    if (declaration.name) {
        const sourceFile = declaration.getSourceFile();

        if (sourceFile.fileName === RUNTIME_DEFINITION_FILE) {
            const llvmFunction = declareFunctionFromDefinition(
                <ts.FunctionDeclaration>declaration,
                ctx,
                builder,
                mangleNameFromDeclaration(declaration, ctx, CPPMangler)
            );

            ctx.signature.set(signature, llvmFunction);

            return llvmFunction;
        }

        if (sourceFile.fileName === LANGUAGE_DEFINITION_FILE) {
            const llvmFunction = declareFunctionFromDefinition(
                <ts.FunctionDeclaration>declaration,
                ctx,
                builder,
                mangleNameFromDeclaration(declaration, ctx, CMangler)
            );


            ctx.signature.set(signature, llvmFunction);

            return llvmFunction;
        }
    }

    return null;
}


export function buildCalleFromCallExpression(
    expr: ts.CallExpression,
    ctx: Context,
    builder: llvm.IRBuilder
) {
    const signature = ctx.typeChecker.getResolvedSignature(expr);
    if (signature) {
        const callSignature = buildCalleFromSignature(signature, ctx, builder);
        if (callSignature) {
            return callSignature;
        }
    }

    return buildFromExpression(expr.expression, ctx, builder).getValue();
}

function declareFunctionFromDefinition(
    stmt: ts.FunctionDeclaration,
    ctx: Context,
    builder: llvm.IRBuilder,
    name: string
): llvm.Function {
    let fnType = llvm.FunctionType.get(
        stmt.type ? NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(stmt.type), ctx).getType() : llvm.Type.getVoidTy(ctx.llvmContext),
        stmt.parameters.map((parameter) => {
            if (parameter.type) {
                const nativeType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parameter.type), ctx);
                if (nativeType) {
                    return nativeType.getType();
                }
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

export function buildFromIdentifier(identifier: ts.Identifier, ctx: Context, builder: llvm.IRBuilder): Value {
    const variable = ctx.scope.variables.get(<string>identifier.escapedText);
    if (variable) {
        return variable;
    }

    const clazz = ctx.scope.classes.get(<string>identifier.escapedText);
    if (clazz) {
        return new ClassReference(clazz);
    }

    const fn = ctx.llvmModule.getFunction(<string>identifier.escapedText);
    if (fn) {
        return new FunctionReference(fn);
    }

    throw new UnsupportedError(
        identifier,
        `Unknown Identifier: "${<string>identifier.escapedText}"`
    );
}


export function buildFromExpression(block: ts.Expression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
    switch (block.kind) {
        case ts.SyntaxKind.NewExpression:
            return new NewExpressionGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.PropertyAccessExpression:
            return new PropertyAccessExpressionCodeGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.Identifier:
            return buildFromIdentifier(<any>block, ctx, builder);
        case ts.SyntaxKind.NumericLiteral:
            return buildFromNumericLiteral(<any>block, ctx, builder, nativeType);
        case ts.SyntaxKind.ArrayLiteralExpression:
            return new ArrayLiteralExpressionCodeGenerator().generate(block as ArrayLiteralExpression, ctx, builder, nativeType);
        case ts.SyntaxKind.StringLiteral:
            return buildFromStringValue(<any>block, ctx, builder);
        case ts.SyntaxKind.TrueKeyword:
            return buildFromTrueKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.FalseKeyword:
            return buildFromFalseKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.BinaryExpression:
            return new BinaryExpressionCodeGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.PostfixUnaryExpression:
            return buildFromPostfixUnaryExpression(<any>block, ctx, builder);
        case ts.SyntaxKind.CallExpression:
            return new CallExpressionCodeGenerator().generate(<any>block, ctx, builder);
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
    if (block.initializer && block.name.kind == ts.SyntaxKind.Identifier) {
        const nativeTypeForDefaultValue = NativeTypeResolver.getType(
            ctx.typeChecker.getTypeFromTypeNode(block.type),
            ctx
        );

        const defaultValue = buildFromExpression(block.initializer, ctx, builder, nativeTypeForDefaultValue);
        if (defaultValue instanceof Primitive) {
            const value = builder.createAlloca(
                defaultValue.getValue().type,
                undefined,
                <string>block.name.escapedText
            );

            builder.createStore(
                defaultValue.getValue(),
                value,
                false
            );

            ctx.scope.variables.set(<string>block.name.escapedText, new Primitive(value, defaultValue.getType()));
        } else {
            ctx.scope.variables.set(<string>block.name.escapedText, defaultValue);
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
            passBlockStatement(stmt as ts.Block, ctx, builder);
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
            passFunctionDeclaration(stmt as ts.FunctionDeclaration, ctx, builder);
            break;
        case ts.SyntaxKind.ReturnStatement:
            new ReturnStatementCodeGenerator().generate(stmt as ts.ReturnStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ClassDeclaration:
            new ClassDeclarationGenerator().generate(stmt as ts.ClassDeclaration, ctx, builder);
            break;
        case ts.SyntaxKind.BreakStatement:
            new BreakStatementGenerator().generate(stmt as ts.BreakStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ContinueStatement:
            new ContinueStatementGenerator().generate(stmt as ts.ContinueStatement, ctx, builder);
            break;
        case ts.SyntaxKind.IfStatement:
            new IfStatementCodeGenerator().generate(stmt as ts.IfStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ForStatement:
            new ForStatementGenerator().generate(stmt as ts.ForStatement, ctx, builder);
            break;
        case ts.SyntaxKind.DoStatement:
            new DoStatementGenerator().generate(stmt as ts.DoStatement, ctx, builder);
            break;
        case ts.SyntaxKind.WhileStatement:
            new WhileStatementGenerator().generate(stmt as ts.WhileStatement, ctx, builder);
            break;
        case ts.SyntaxKind.BinaryExpression:
            new BinaryExpressionCodeGenerator().generate(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.PostfixUnaryExpression:
            buildFromPostfixUnaryExpression(<any>stmt, ctx, builder);
            break;
        default:
            throw new UnsupportedError(
                stmt,
                `Unsupported statement: "${stmt.kind}"`
            );
    }
}

export function loadIfNeeded(value: Value, builder: llvm.IRBuilder): llvm.Value {
    if (value.getValue().type.isPointerTy() && !value.isString()) {
        return builder.createLoad(value.getValue());
    }

    return value.getValue();
}

function passBlockStatement(node: ts.Block, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of node.statements) {
        passStatement(stmt, ctx, builder);
    }
}

export function passNode(node: ts.Node, ctx: Context, builder: llvm.IRBuilder) {
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

    const mainFnType = llvm.FunctionType.get(llvm.Type.getInt64Ty(ctx.llvmContext), false);
    const mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    const block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    const builder = new llvm.IRBuilder(block);

    ctx.scope.enclosureFunction = {
        llvmFunction: mainFn,
        declaration: null
    };

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            sourceFile.forEachChild((node: ts.Node) => passNode(node, ctx, builder))
        }
    }

    builder.createRet(
        llvm.ConstantInt.get(ctx.llvmContext, 0, 64)
    );

    return ctx.llvmModule;
}
