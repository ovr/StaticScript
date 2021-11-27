use structopt::StructOpt;

use crate::CLIError;

#[derive(StructOpt, Debug)]
pub struct CheckOptions {
    #[structopt(short)]
    verbose: bool,
}

pub fn run_check_command(_options: CheckOptions) -> Result<(), CLIError> {
    unimplemented!();
}
