use std::{cell::RefCell, collections::HashMap, rc::Rc};

use inkwell as llvm;
use swc_ecma_ast as ast;

use crate::{types::CompiledExpression, BackendError};

#[derive(Debug)]
pub struct Scope<'ctx> {
    pub variables: RefCell<HashMap<String, CompiledExpression<'ctx>>>,
}

impl<'ctx> Scope<'ctx> {
    pub fn new() -> Self {
        Self {
            variables: RefCell::new(HashMap::new()),
        }
    }

    pub fn define_variable(&self, identifier: String, reference: CompiledExpression<'ctx>) {
        let mut variables = self.variables.borrow_mut();
        if variables.contains_key(&identifier) {
            panic!("Unable to define variable twice");
        } else {
            variables.insert(identifier, reference);
        }
    }

    pub fn get_variable(
        &self,
        identifier: String,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        if let Some(reference) = self.variables.borrow().get(&identifier) {
            Ok(reference.clone())
        } else {
            panic!("Unknown variable: {}", identifier);
        }
    }
}

#[derive(Debug)]
pub struct Transformer<'ctx> {
    // Our context
    scope: Rc<Scope<'ctx>>,
    // LLVM context
    context: &'ctx llvm::context::Context,
    module: llvm::module::Module<'ctx>,
    builder: llvm::builder::Builder<'ctx>,
}

impl<'ctx> Transformer<'ctx> {
    pub fn new(context: &'ctx llvm::context::Context) -> Self {
        Transformer {
            // our
            scope: Rc::new(Scope::new()),
            // llvm
            context,
            module: context.create_module("module"),
            builder: context.create_builder(),
        }
    }

    /// Transform module
    pub fn transform_fn(&mut self, fn_declr: ast::FnDecl) -> Result<(), BackendError> {
        self.compile_fn(fn_declr)?;

        Ok(())
    }

    pub fn module(self) -> llvm::module::Module<'ctx> {
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

                self.scope.define_variable(identifier, default);
            };
        }

        Ok(())
    }

    fn compile_ident_expr(
        &mut self,
        ident: ast::Ident,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        self.scope.get_variable(ident.sym.to_string())
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
mod statement;
