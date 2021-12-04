#[macro_use]
extern crate swc_common;
extern crate swc_ecma_parser;

use backend_llvm::BackendError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("User: {0}")]
    User(String),
    #[error("Backend: {0}")]
    Backend(#[from] BackendError),
}

impl Error {}

pub mod binder;
pub mod frontend;
pub mod inference;
pub mod project;
pub mod tsconfig;
