
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, Value} from "../value";
import {NativeType} from "../native-type";
import UnsupportedError from "../../error";
import {buildCalleFromCallExpression, buildFromExpression, loadIfNeeded} from "../index";

export class CallExpressionCodeGenerator implements NodeGenerateInterface<ts.CallExpression, Value> {
    generate(node: ts.CallExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
        const callle = buildCalleFromCallExpression(node, ctx, builder);
        if (!callle) {
            throw new UnsupportedError(
                node,
                `We cannot prepare expression to call this function, ${node.expression}`
            );
        }

        const args = node.arguments.map((expr) => {
            return loadIfNeeded(
                buildFromExpression(<any>expr, ctx, builder), builder
            );
        });

        return new Primitive(
            builder.createCall(
                callle,
                args,
            )
        );
    }
}
