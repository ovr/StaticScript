
import * as ts from 'typescript';
import * as llvm from 'llvm-node';
import {Context} from "./context";

export class NativeTypeResolver {
    static getType(type: ts.Type, ctx: Context): llvm.Type {
        if (type.isLiteral()) {
            if (type.isNumberLiteral()) {
                return llvm.Type.getDoubleTy(
                    ctx.llvmContext
                );
            }

            if (type.isStringLiteral()) {
                return llvm.Type.getInt8PtrTy(
                    ctx.llvmContext
                );
            }

            throw new Error(
                `Unsupported literal type`
            );
        }

        throw new Error(
            `Unsupported type, it's to dynamic`
        );
    }
}