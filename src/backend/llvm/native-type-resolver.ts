
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

        const aliasSymbol = type.aliasSymbol;
        if (aliasSymbol) {
            switch (aliasSymbol.escapedName) {
                case 'int8':
                    return llvm.Type.getInt8Ty(
                        ctx.llvmContext
                    );
                case 'int16':
                    return llvm.Type.getInt16Ty(
                        ctx.llvmContext
                    );
                case 'int32':
                    return llvm.Type.getInt32Ty(
                        ctx.llvmContext
                    );
                case 'int64':
                    return llvm.Type.getInt64Ty(
                        ctx.llvmContext
                    );
                case 'int128':
                    return llvm.Type.getInt128Ty(
                        ctx.llvmContext
                    );
                default:
                    throw new Error(
                        `Unsupported type, "${<string>aliasSymbol.escapedName}"`
                    );
            }
        }

        throw new Error(
            `Unsupported type, it's to dynamic`
        );
    }
}