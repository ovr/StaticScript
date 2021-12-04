use std::path::Path;

use structopt::StructOpt;

use crate::CLIError;

#[derive(StructOpt, Debug)]
pub struct CompileOptions {
    #[structopt(short)]
    verbose: bool,

    #[structopt(default_value = "", long)]
    path: String,
}

pub fn run_compile_command(options: CompileOptions) -> Result<(), CLIError> {
    let mut project = frontend::project::Project::new();
    project.scan(&Path::new(&options.path))?;

    let frontend = frontend::frontend::Frontend::new();
    frontend.compile_inline("function sum() { let a = 5; b = 4; return a + b; }".to_string())?;

    Ok(())
}
