use crate::BackendError;

use super::Transformer;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_return_statement(&mut self, stmt: ast::ReturnStmt) -> Result<(), BackendError> {
        if let Some(return_expr) = stmt.arg {
            let result_value = self.compile_expr(return_expr)?;
            match &result_value {
                crate::types::CompiledExpression::Float64(n) => {
                    self.builder.build_return(Some(n));
                }
                _ => {
                    return Err(BackendError::NotImplemented(format!(
                        "Unable to return value: {:?}",
                        result_value
                    )));
                }
            };
        };

        Ok(())
    }
}
