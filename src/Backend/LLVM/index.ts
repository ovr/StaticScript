import * as llvm from "llvm-node";

import {BlockStatement, File, Statement, VariableDeclaration} from '@babel/types';

export function passBlockStatement(parent: BlockStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of parent.body) {
        passStatement(stmt, ctx, builder);
    }
}

function buildFromNumberValue(ctx: Context, value: number, builder: llvm.IRBuilder): llvm.Value {
    return llvm.ConstantInt.get(ctx.llvmContext, 0, 32, true);
}

export function passVariableDeclaration(block: VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    buildFromNumberValue(ctx, 0, builder);

    // const intType = llvm.Type.getInt32Ty(ctx.llvmContext);
    //
    // const globalVariable = new llvm.GlobalVariable(
    //     ctx.llvmModule,
    //     intType,
    //     true,
    //     llvm.LinkageTypes.InternalLinkage,
    //     llvm.ConstantInt.get(ctx.llvmContext, 0)
    // );
}

export function passStatement(stmt: Statement, ctx: Context, builder: llvm.IRBuilder) {
    switch (stmt.type) {
        case "BlockStatement":
            passBlockStatement(stmt, ctx, builder);
            break;
        case "VariableDeclaration":
            passVariableDeclaration(stmt, ctx, builder);
            break;
        default:
            throw new Error(`Unsupported statement: "${stmt.type}"`);
    }
}

class Context {
    public llvmContext: llvm.LLVMContext;
    public llvmModule: llvm.Module;

    public constructor() {
        this.llvmContext = new llvm.LLVMContext();
        this.llvmModule = new llvm.Module("test", this.llvmContext);
    }
}

export function generateFromFile(file: File) {
    const ctx = new Context();

    let mainFnType = llvm.FunctionType.get(llvm.Type.getInt32Ty(ctx.llvmContext), false);
    let mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, "main", ctx.llvmModule);

    let block = llvm.BasicBlock.create(ctx.llvmContext, "Entry", mainFn);
    let irBuilder = new llvm.IRBuilder(block);

    for (const node of file.program.body) {
        passStatement(node, ctx, irBuilder);
    }

    const ll = ctx.llvmModule.print();
    console.log(ll);
}