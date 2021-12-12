
import * as ts from "typescript";
import * as llvm from 'llvm-node';

import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import UnsupportedError from "../../error/unsupported.error";
import {NativeTypeResolver} from "../native-type-resolver";

export class ClassDeclarationGenerator implements NodeGenerateInterface<ts.ClassDeclaration, void> {
    generate(node: ts.ClassDeclaration, ctx: Context, builder: llvm.IRBuilder): void {
        if (node.typeParameters) {
            throw new UnsupportedError(
                node,
                'Generic classes are unsupported'
            )
        }

        const classType = ctx.typeChecker.getTypeAtLocation(node);

        const properties = ctx.typeChecker.getPropertiesOfType(classType);

        const structName = node.name ? <string>node.name.escapedText : 'class_' + Math.random();
        const struct = llvm.StructType.create(ctx.llvmContext, structName);

        struct.setBody(properties.map(
            (property: ts.Symbol) => {
                const nativeType = NativeTypeResolver.getType(
                    ctx.typeChecker.getTypeOfSymbolAtLocation(property, node),
                    ctx
                );

                return nativeType.getType();
            }
        ));

        ctx.scope.classes.set(structName, struct);

        if (node.members) {
            node.members.forEach(
                (member) => {
                    if (!ts.isPropertyDeclaration(member)) {
                        throw new UnsupportedError(
                            node,
                            'Classes with methods are not supported'
                        )
                    }
                }
            );
        }
    }
}