
import * as ts from 'typescript';
import * as llvm from 'llvm-node';

import {NodeGenerateInterface} from '../node-generate.interface';
import {Context} from '../context';
import UnsupportedError from "../../error";

export class TryStatementGenerator implements NodeGenerateInterface<ts.TryStatement, void> {
    generate(node: ts.TryStatement, ctx: Context, builder: llvm.IRBuilder): void {
        // https://llvm.org/docs/ExceptionHandling.html#try-catch

        throw new UnsupportedError(node, 'Try/Catch is unsupported');
    }
}