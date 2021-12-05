use crate::BackendError;

use super::Transformer;
use inkwell::module::Linkage;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_fn(&mut self, stmt: ast::FnDecl) -> Result<(), BackendError> {
        let i64_type = self.context.i64_type();
        let fn_type = i64_type.fn_type(&[], false);
        let main_fn = self
            .module
            .add_function("main", fn_type, Some(Linkage::External));
        let block = self.context.append_basic_block(main_fn, "entry");

        self.builder.position_at_end(block);

        if let Some(body) = stmt.function.body {
            for stmt in body.stmts {
                self.compile_stmt(stmt)?;
            }
        }

        self.builder.build_return(Some(&i64_type.const_zero()));

        Ok(())
    }
}
