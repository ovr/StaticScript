#[macro_use]
extern crate swc_common;
extern crate swc_ecma_parser;

use err_derive::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(display = "User: {:?}", _0)]
    User(String),
}

impl Error {}

pub mod binder;
pub mod frontend;
pub mod inference;
pub mod project;
pub mod tsconfig;
