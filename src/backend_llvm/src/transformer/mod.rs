use std::rc::Rc;

use inkwell as llvm;
use llvm::debug_info::{DICompileUnit, DWARFEmissionKind, DWARFSourceLanguage, DebugInfoBuilder};
use swc_ecma_ast as ast;

use crate::{types::CompiledExpression, BackendError};

use self::scope::{Scope, ScopeStack};

#[derive(Debug)]
pub struct Transformer<'ctx> {
    // Our context
    scope_stack: ScopeStack<'ctx>,
    // LLVM context
    context: &'ctx llvm::context::Context,
    module: llvm::module::Module<'ctx>,
    builder: llvm::builder::Builder<'ctx>,
    // LLVM Debug
    di_builder: DebugInfoBuilder<'ctx>,
    di_compile_unit: DICompileUnit<'ctx>,
}

impl<'ctx> Transformer<'ctx> {
    pub fn new(context: &'ctx llvm::context::Context) -> Self {
        let module = context.create_module("module");
        let (di_builder, di_compile_unit) = module.create_debug_info_builder(
            true,
            DWARFSourceLanguage::C,
            "filename",
            "dirname",
            "staticscript",
            true,
            "",
            0,
            "",
            DWARFEmissionKind::Full,
            0,
            false,
            false,
            "",
            "",
        );

        Transformer {
            // our
            scope_stack: ScopeStack::new(),
            // LLVM Context
            context,
            module,
            builder: context.create_builder(),
            // LLVM Debug
            di_builder,
            di_compile_unit,
        }
    }

    /// Transform module
    pub fn transform_fn(&mut self, fn_declr: ast::FnDecl) -> Result<(), BackendError> {
        self.scope_stack.push(Rc::new(Scope::new()));
        self.compile_fn(fn_declr)?;
        self.scope_stack.pop();

        Ok(())
    }

    pub fn module(self) -> llvm::module::Module<'ctx> {
        self.di_builder.finalize();

        self.module
    }

    fn convert_pat_to_identifier(&mut self, pat: &ast::Pat) -> Result<String, BackendError> {
        Ok(match pat {
            ast::Pat::Ident(idnt) => idnt.id.sym.to_string(),
            _ => todo!(),
        })
    }

    fn compile_var_decl(&mut self, decl: ast::VarDecl) -> Result<(), BackendError> {
        for d in decl.decls {
            let identifier = self.convert_pat_to_identifier(&d.name)?;
            if let Some(init) = d.init {
                let default = self.compile_expr(init)?;

                self.scope_stack
                    .scope()
                    .define_variable(identifier, default);
            };
        }

        Ok(())
    }

    fn compile_ident_expr(
        &mut self,
        ident: ast::Ident,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        self.scope_stack.scope().get_variable(ident.sym.to_string())
    }

    fn compile_expr(
        &mut self,
        expr: Box<ast::Expr>,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        let reference = match *expr {
            ast::Expr::Bin(expr) => self.compile_binary_expr(expr)?,
            ast::Expr::Assign(expr) => self.compile_assign_expr(expr)?,
            ast::Expr::Ident(expr) => self.compile_ident_expr(expr)?,
            ast::Expr::Lit(lit) => match lit {
                ast::Lit::Num(n) => {
                    let ptr = self.builder.build_alloca(
                        self.context.f64_type(),
                        format!("test{}", n.value as i64).as_str(),
                    );
                    let value = self.context.f64_type().const_float(n.value);
                    self.builder.build_store(ptr, value);

                    CompiledExpression::Float64(value)
                }
                _ => todo!(),
            },
            _ => {
                return Err(BackendError::NotImplemented(format!(
                    "Unsupported expression {:?}",
                    expr
                )));
            }
        };

        Ok(reference)
    }

    fn compile_stmt(&mut self, stmt: ast::Stmt) -> Result<(), BackendError> {
        match stmt {
            ast::Stmt::Decl(ast::Decl::Var(d)) => {
                self.compile_var_decl(d)?;
            }
            ast::Stmt::Expr(ast::ExprStmt { expr, .. }) => {
                self.compile_expr(expr)?;
            }
            ast::Stmt::Return(stmt) => {
                self.compile_return_statement(stmt)?;
            }
            _ => {
                return Err(BackendError::NotImplemented(format!(
                    "Unsupported statement {:?}",
                    stmt
                )));
            }
        };

        Ok(())
    }
}

mod binary;
mod function;
mod scope;
mod statement;
