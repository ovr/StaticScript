#[macro_use]
extern crate swc_common;
extern crate swc_ecma_parser;

#[derive(Debug)]
pub enum Error {
    User(String),
}

impl Error {}

pub mod binder;
pub mod frontend;
pub mod inference;
pub mod project;
pub mod tsconfig;

fn main() {
    let mut project = project::Project::new();
    project.scan().unwrap();

    let frontend = frontend::Frontend::new();
    frontend.compile_inline("function sum(a: number, b: number) { return a + b; }".to_string());
}
