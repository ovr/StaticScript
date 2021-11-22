use err_derive::Error;
use structopt::clap::AppSettings;
use structopt::StructOpt;

mod check;
mod compile;

use check::{run_check_command, CheckOptions};
use compile::{run_compile_command, CompileOptions};

#[derive(StructOpt, Debug)]
#[structopt(setting = AppSettings::InferSubcommands)]
enum Opt {
    #[structopt(alias = "tsc")]
    Check(CheckOptions),
    #[structopt()]
    Compile(CompileOptions),
}

#[derive(Debug, Error)]
pub enum CLIError {
    #[error(display = "err")]
    Frontend(#[error(source)] frontend::Error),
}

fn main() {
    let opt = Opt::from_args();
    let result = match opt {
        Opt::Check(opts) => run_check_command(opts),
        Opt::Compile(opts) => run_compile_command(opts),
    };
}
