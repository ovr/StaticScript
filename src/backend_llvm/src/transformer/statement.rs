use crate::{
    BackendError,
};

use super::Transformer;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_return_statement(&mut self, _expr: ast::ReturnStmt) -> Result<(), BackendError> {
        Ok(())
    }
}
