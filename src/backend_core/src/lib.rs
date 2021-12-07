use swc_ecma_ast as ast;

#[derive(Debug)]
pub struct Session {
    pub modules: Vec<SessionModule>,
}

#[derive(Debug)]
pub struct SessionModule {
    pub name: String,
    pub files: Vec<SessionFile>,
}

#[derive(Debug)]
pub struct SessionFile {
    pub filename: String,
    pub functions: Vec<ast::FnDecl>,
}

// https://llvm.org/doxygen/Triple_8h_source.html
#[derive(Debug)]
pub enum TargetArch {
    // Host arch
    Current,
    // X86-64: amd64, x86_64
    X86_64,
    // ARM: arm, armv.*, xscale
    ARM,
    // AArch64: aarch64
    AARCH64,
    // WebAssembly with 32-bit pointers
    WASM32,
    // WebAssembly with 64-bit pointers
    WASM64,
}

#[derive(Debug, PartialEq, Eq)]
pub enum OptimizationLevel {
    Default,
    Disabled,
}

pub struct BackendConfiguration {
    pub optimization_level: OptimizationLevel,
    pub target: TargetArch,
}
