use std::{collections::HashMap, result::Result};

use swc_ecma_ast::FnDecl;

use crate::{
    binder::{BindedModule, TypeKind},
    Error,
};

pub struct Inference {}

#[derive(Debug)]
struct Symbol {}

#[derive(Debug)]
struct BasicBlockState {
    symbols: HashMap<String, Symbol>,
}

impl BasicBlockState {
    fn new() -> Self {
        Self {
            symbols: HashMap::new(),
        }
    }
}

impl Inference {
    pub fn new() -> Self {
        Self {}
    }

    pub fn inference(&self, module: &mut BindedModule) -> Result<bool, Error> {
        // Step 1
        for function in module.functions.iter_mut() {
            if function.return_type.is_none() {
                function.return_type = self.inference_function_body(&function.node)?;
            }
        }

        Ok(true)
    }

    fn inference_function_body(&self, f: &FnDecl) -> Result<Option<TypeKind>, Error> {
        if let Some(block) = &f.function.body {
            for stmt in &block.stmts {
                match stmt {
                    swc_ecma_ast::Stmt::Return(rs) => {
                        if let Some(_arg) = &rs.arg {
                        } else {
                            return Ok(Some(TypeKind::Undefined));
                        }
                    }
                    _ => {}
                };
            }
        };

        Ok(None)
    }
}
