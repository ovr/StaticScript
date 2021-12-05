use crate::{
    types::{CompiledExpression, NativeTypeId},
    BackendError,
};

use super::Transformer;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_assign_expr(
        &mut self,
        _expr: ast::AssignExpr,
    ) -> Result<CompiledExpression, BackendError> {
        Ok(CompiledExpression::new(NativeTypeId::Float64))
    }

    pub fn compile_binary_expr(
        &mut self,
        expr: ast::BinExpr,
    ) -> Result<CompiledExpression, BackendError> {
        let _left = self.compile_expr(expr.left)?;
        let _right = self.compile_expr(expr.right)?;

        match expr.op {
            ast::BinaryOp::Add => {
                // self.builder.build_float_add(lhs, rhs, name)
            }
            _ => unimplemented!(),
        };

        Ok(CompiledExpression::new(NativeTypeId::Float64))
    }
}
