
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {Value} from "../value";
import UnsupportedError from "../../error";
import {buildFromExpression} from "../index";

export class PropertyAccessExpressionCodeGenerator implements NodeGenerateInterface<ts.PropertyAccessExpression, Value> {
    generate(node: ts.PropertyAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
        const object = buildFromExpression(node.expression, ctx, builder);
        if (object) {
            return object;
        }

        throw new UnsupportedError(
            node,
            'Unsupported...'
        );
    }
}
