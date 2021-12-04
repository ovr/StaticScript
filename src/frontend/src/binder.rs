use swc_ecma_ast::{Decl, FnDecl, Module, Stmt};

#[derive(Debug)]
pub enum TypeKind {
    Any,
    Boolean,
    Unknown,
    Object,
    Null,
    Undefined,
}

pub struct BindedFn {
    pub node: FnDecl,
    pub return_type: Option<TypeKind>,
}

pub struct Binder {
    functions: Vec<BindedFn>,
}

pub struct BindedModule {
    pub(crate) functions: Vec<BindedFn>,
}

impl Binder {
    pub fn new() -> Self {
        Self { functions: vec![] }
    }

    fn bind_function_declaration(&mut self, node: FnDecl) {
        self.functions.push(BindedFn {
            node,
            return_type: None,
        });
    }

    fn bind_statement_declaration(&mut self, decl: Decl) {
        match decl {
            swc_ecma_ast::Decl::Fn(f) => self.bind_function_declaration(f),
            _ => todo!(),
        }
    }

    fn bind_statement(&mut self, stmt: Stmt) {
        match stmt {
            swc_ecma_ast::Stmt::Decl(decl) => self.bind_statement_declaration(decl),
            _ => todo!(),
        }
    }

    pub fn bind(mut self, module: Module) -> BindedModule {
        for module_item in module.body {
            match module_item {
                swc_ecma_ast::ModuleItem::ModuleDecl(_mdec) => {}
                swc_ecma_ast::ModuleItem::Stmt(stmt) => self.bind_statement(stmt),
            }
        }

        BindedModule {
            functions: self.functions,
        }
    }
}
