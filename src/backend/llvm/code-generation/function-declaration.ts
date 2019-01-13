
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {FunctionReference, Primitive} from "../value";
import {NativeTypeResolver} from "../native-type-resolver";
import UnsupportedError from "../../error";
import {passStatement} from "../index";

export class FunctionDeclarationCodeGenerator implements NodeGenerateInterface<ts.FunctionDeclaration, FunctionReference> {
    generate(node: ts.FunctionDeclaration, ctx: Context, builder: llvm.IRBuilder): FunctionReference {
        if (!node.name || !node.name.escapedText) {
            throw Error('Function must be declared with name');
        }

        if (!node.type) {
            throw Error('Function must be declared with return type');
        }

        let returnType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(node.type), ctx).getType();
        let fnType = llvm.FunctionType.get(
            returnType,
            node.parameters.map((parameter) => {
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
        let fn = llvm.Function.create(fnType, llvm.LinkageTypes.ExternalLinkage, <string>node.name.escapedText, ctx.llvmModule);

        let block = llvm.BasicBlock.create(ctx.llvmContext, 'Entry', fn);
        let irBuilder = new llvm.IRBuilder(block);

        for (const argument of fn.getArguments()) {
            const parameter = node.parameters[argument.argumentNumber];
            if (parameter) {
                argument.name = <string>(<ts.Identifier>parameter.name).escapedText;
                ctx.scope.variables.set(argument.name, new Primitive(argument));
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
            declaration: node
        };

        if (node.body) {
            for (const stmt of node.body.statements) {
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

        return new FunctionReference(fn);
    }
}
