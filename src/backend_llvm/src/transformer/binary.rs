use core::panic;

use crate::{types::CompiledExpression, BackendError};

use super::Transformer;

use inkwell::FloatPredicate;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_assign_expr(
        &mut self,
        _expr: ast::AssignExpr,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        Ok(CompiledExpression::Unknown())
    }

    fn generate_compare(
        &mut self,
        predicate: FloatPredicate,
        left: CompiledExpression<'ctx>,
        right: CompiledExpression<'ctx>,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        match (left, right) {
            (CompiledExpression::Float64(l), CompiledExpression::Float64(r)) => {
                let result = self.builder.build_float_compare(predicate, l, r, "result");
                return Ok(CompiledExpression::Boolean(result));
            }
            _ => Err(BackendError::NotImplemented(
                "Unable to find coerce type".to_string(),
            )),
        }
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
                Ok(CompiledExpression::Float64(result))
            }
            ast::BinaryOp::EqEq => self.generate_compare(FloatPredicate::OEQ, left, right),
            ast::BinaryOp::NotEq => self.generate_compare(FloatPredicate::ONE, left, right),
            ast::BinaryOp::Gt => self.generate_compare(FloatPredicate::OGT, left, right),
            ast::BinaryOp::GtEq => self.generate_compare(FloatPredicate::OGE, left, right),
            ast::BinaryOp::LtEq => self.generate_compare(FloatPredicate::OLE, left, right),
            ast::BinaryOp::Lt => self.generate_compare(FloatPredicate::OLT, left, right),
            _ => Err(BackendError::NotImplemented(format!(
                "Operator {}",
                expr.op
            )))
        }
    }
}
