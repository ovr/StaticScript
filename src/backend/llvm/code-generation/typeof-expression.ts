import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Value, ValueTypeEnum} from "../value";
import {NativeType} from "../native-type";
import {buildFromExpression, buildFromString} from "../index";
import UnsupportedError from "../../error";

export class TypeOfExpressionCodeGenerator implements NodeGenerateInterface<ts.TypeOfExpression, Value> {
    generate(node: ts.TypeOfExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
        const right = buildFromExpression(node.expression, ctx, builder);
        switch (right.getType()) {
            case ValueTypeEnum.BOOLEAN:
                return buildFromString('boolean', ctx, builder);
            case ValueTypeEnum.STRING:
                return buildFromString('string', ctx, builder);
            case ValueTypeEnum.DOUBLE:
                return buildFromString('number', ctx, builder);
            case ValueTypeEnum.INT8:
                return buildFromString('int8', ctx, builder);
            case ValueTypeEnum.INT16:
                return buildFromString('int16', ctx, builder);
            case ValueTypeEnum.INT32:
                return buildFromString('int32', ctx, builder);
            case ValueTypeEnum.INT64:
                return buildFromString('int64', ctx, builder);
            case ValueTypeEnum.INT128:
                return buildFromString('int128', ctx, builder);
            default:
                throw new UnsupportedError(
                    node,
                    `Unsupported typeof call`,
                )
        }
    }
}
