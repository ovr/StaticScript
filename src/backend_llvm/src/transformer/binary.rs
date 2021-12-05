use core::panic;

use crate::{types::CompiledExpression, BackendError};

use super::Transformer;

use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_assign_expr(
        &mut self,
        _expr: ast::AssignExpr,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        Ok(CompiledExpression::Unknown())
    }

    pub fn compile_binary_expr(
        &mut self,
        expr: ast::BinExpr,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        let left = self.compile_expr(expr.left)?;
        let right = self.compile_expr(expr.right)?;

        match expr.op {
            ast::BinaryOp::Add => {
                let l_float = match left {
                    CompiledExpression::Float64(n) => n,
                    _ => panic!(),
                };

                let r_float = match right {
                    CompiledExpression::Float64(n) => n,
                    _ => panic!(),
                };

                let result = self.builder.build_float_add(l_float, r_float, "result");
                return Ok(CompiledExpression::Float64(result));
            }
            _ => unimplemented!(),
        };

        Ok(CompiledExpression::Unknown())
    }
}
