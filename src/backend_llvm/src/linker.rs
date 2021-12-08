use std::{path::Path, process::Command};

use inkwell::targets::TargetMachine;

use crate::BackendError;

pub trait Linker {
    fn add_object(&mut self, path: &Path) -> Result<(), BackendError>;
    fn finalize(&mut self, path: &Path) -> Result<(), BackendError>;
}

pub fn create_linker(target_machine: &TargetMachine) -> Box<dyn Linker> {
    let target = target_machine.get_target();
    match target.get_name().to_str().unwrap() {
        "aarch64" => Box::new(PlatformLd64Linker::new()),
        _ => Box::new(StaticLd64Linker::new()),
    }
}

#[derive(Debug)]
pub struct PlatformLd64Linker {
    command: Command,
}

impl PlatformLd64Linker {
    pub fn new() -> Self {
        let mut command = Command::new("ld64.lld");
        command.args(["-arch", "arm64"]);
        command.args(["-platform_version", "macos", "12.0", "12.0"]);

        PlatformLd64Linker { command }
    }
}

impl Linker for PlatformLd64Linker {
    fn add_object(&mut self, path: &Path) -> Result<(), BackendError> {
        let path_str = path
            .to_str()
            .ok_or_else(|| BackendError::LinkError(path.to_string_lossy().to_string()))?
            .to_owned();
        self.command.arg(path_str);
        Ok(())
    }

    fn finalize(&mut self, path: &Path) -> Result<(), BackendError> {
        let path_str = path
            .to_str()
            .ok_or_else(|| BackendError::LinkError(path.to_string_lossy().to_string()))?;

        // Specify output path
        self.command.args(["-o", path_str]);

        self.command
            .output()
            .map_err(|e| BackendError::LinkError(e.to_string()))?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct StaticLd64Linker {
    args: Vec<String>,
}

impl StaticLd64Linker {
    pub fn new() -> Self {
        StaticLd64Linker {
            args: vec![format!(
                "-arch {} -platform_version macos 12.0 12.0",
                "arm64"
            )],
        }
    }
}

impl Linker for StaticLd64Linker {
    fn add_object(&mut self, path: &Path) -> Result<(), BackendError> {
        let path_str = path
            .to_str()
            .ok_or_else(|| BackendError::LinkError(path.to_string_lossy().to_string()))?
            .to_owned();
        self.args.push(path_str);
        Ok(())
    }

    fn finalize(&mut self, path: &Path) -> Result<(), BackendError> {
        let path_str = path
            .to_str()
            .ok_or_else(|| BackendError::LinkError(path.to_string_lossy().to_string()))?;

        // Specify output path
        self.args.push("-o".to_owned());
        self.args.push(path_str.to_owned());

        println!("Linking {}", self.args.join(" "));

        mun_lld::link(mun_lld::LldFlavor::MachO, &self.args)
            .ok()
            .map_err(|e| BackendError::LinkError(e.to_string()))
    }
}
