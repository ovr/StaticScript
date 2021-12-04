use inkwell as llvm;
use swc_ecma_ast as ast;

use crate::{
    types::{CompiledExpression, NativeTypeId},
    BackendError,
};

#[derive(Debug)]
pub struct Transformer<'ctx> {
    context: &'ctx llvm::context::Context,
    module: llvm::module::Module<'ctx>,
    builder: llvm::builder::Builder<'ctx>,
}

impl<'ctx> Transformer<'ctx> {
    pub fn new(context: &'ctx llvm::context::Context) -> Self {
        Transformer {
            context,
            module: context.create_module("module"),
            builder: context.create_builder(),
        }
    }

    /// Transform module
    pub fn transform(
        mut self,
        fn_declr: ast::FnDecl,
    ) -> Result<llvm::module::Module<'ctx>, BackendError> {
        self.compile_fn(fn_declr)?;

        Ok(self.module)
    }

    fn declare_var(&mut self) -> Result<(), BackendError> {
        Ok(())
    }

    fn convert_pat_to_identifier(&mut self, pat: &ast::Pat) -> Result<String, BackendError> {
        Ok(match pat {
            ast::Pat::Ident(idnt) => idnt.id.sym.to_string(),
            _ => todo!(),
        })
    }

    fn compile_var_decl(&mut self, decl: ast::VarDecl) -> Result<(), BackendError> {
        for d in decl.decls {
            println!("{:?}", self.convert_pat_to_identifier(&d.name)?);

            if let Some(init) = d.init {
                self.compile_expr(init);
            };
        }

        Ok(())
    }

    fn compile_expr(&mut self, expr: Box<ast::Expr>) -> Result<CompiledExpression, BackendError> {
        let reference = match &*expr {
            ast::Expr::Lit(lit) => match lit {
                ast::Lit::Num(n) => {
                    let ptr = self.builder.build_alloca(self.context.f64_type(), "test");
                    let value = self.context.f64_type().const_float(n.value);
                    self.builder.build_store(ptr, value);

                    CompiledExpression::new(NativeTypeId::Float64)
                }
                _ => todo!(),
            },
            _ => todo!(),
        };

        Ok(reference)
    }

    fn compile_stmt(&mut self, stmt: ast::Stmt) -> Result<(), BackendError> {
        match stmt {
            ast::Stmt::Decl(ast::Decl::Var(d)) => self.compile_var_decl(d)?,
            _ => {}
        };

        Ok(())
    }
}

mod function;
