
import * as ts from 'typescript';
import {Context} from './context';
import {Value} from "./value";

interface NodeGenerateInterface<N extends ts.Node, R extends Value | void> {
    generate(node: N, ctx: Context): R;
}
