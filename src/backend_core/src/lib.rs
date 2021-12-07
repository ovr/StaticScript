use swc_ecma_ast as ast;

#[derive(Debug)]
pub struct Session {
    pub modules: Vec<SessionModule>,
}

#[derive(Debug)]
pub struct SessionModule {
    pub functions: Vec<ast::FnDecl>,
}
