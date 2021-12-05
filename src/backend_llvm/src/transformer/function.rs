use crate::BackendError;

use super::Transformer;
use inkwell::module::Linkage;
use swc_ecma_ast as ast;

impl<'ctx> Transformer<'ctx> {
    pub fn compile_fn(&mut self, stmt: ast::FnDecl) -> Result<(), BackendError> {
        let f64_type = self.context.f64_type();
        let fn_type = f64_type.fn_type(&[], false);
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

        if let Some(block) = self.builder.get_insert_block() {
            if block.get_terminator().is_none() {
                self.builder.build_return(Some(&f64_type.const_zero()));
            }
        };

        Ok(())
    }
}
