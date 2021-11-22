
import * as ts from 'typescript';
import * as llvm from 'llvm-node';
import {Context} from './context';
import {Value} from "./value";
import {NativeType} from "./native-type";

export interface NodeGenerateInterface<N extends ts.Node, R extends Value | void> {
    generate(node: N, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): R;
}
