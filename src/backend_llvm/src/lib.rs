use backend_core::{BackendConfiguration, Session};
use inkwell::{
    context::Context,
    module::{Linkage, Module},
    passes::{PassManager, PassManagerBuilder},
    support::LLVMString,
    targets::{CodeModel, FileType, InitializationConfig, RelocMode, Target, TargetMachine},
    OptimizationLevel,
};
use std::{env, fs, io, path::Path};

use thiserror::Error;
use transformer::Transformer;

#[derive(Error, Debug)]
pub enum BackendError {
    #[error("Backend: {0}")]
    User(String),
    #[error("Not implemented: {0}")]
    NotImplemented(String),
    #[error("LLVM: {0}")]
    LLVM(String),
    #[error("LLVM: {0}")]
    LLVMInternal(LLVMString),
    #[error("IO: {0}")]
    IO(#[from] io::Error),
}

mod transformer;
mod types;

pub struct LLVMBackend {
    configuration: BackendConfiguration,
    context: Context,
}

impl LLVMBackend {
    pub fn new(configuration: BackendConfiguration) -> Self {
        Self {
            configuration,
            context: Context::create(),
        }
    }

    pub fn init(&self) -> std::result::Result<(), BackendError> {
        Target::initialize_all(&InitializationConfig::default());
        // Target::initialize_native(&InitializationConfig::default()).map_err(BackendError::LLVM)?;
        // Target::initialize_aarch64(&InitializationConfig::default());

        Ok(())
    }

    pub fn compile_module<'ctx>(
        &self,
        module: Module<'ctx>,
    ) -> std::result::Result<Module<'ctx>, BackendError> {
        println!("Compiled IR {}", module.print_to_string().to_string());
        module.verify().unwrap();

        if self.configuration.optimization_level != backend_core::OptimizationLevel::Disabled {
            let pass_manager_builder = PassManagerBuilder::create();
            let opt_level = match self.configuration.optimization_level {
                backend_core::OptimizationLevel::Default => OptimizationLevel::Default,
                backend_core::OptimizationLevel::Disabled => unreachable!(),
            };
            pass_manager_builder.set_optimization_level(opt_level);

            let fpm = PassManager::create(());
            pass_manager_builder.populate_module_pass_manager(&fpm);

            fpm.run_on(&module);
            println!("Optimized IR {}", module.print_to_string().to_string());
        };

        Ok(module)
    }

    pub fn inject_main<'ctx>(
        &'ctx self,
        module: Module<'ctx>,
    ) -> std::result::Result<Module<'ctx>, BackendError> {
        let builder = self.context.create_builder();

        let i64_type = self.context.i64_type();
        let fn_type = i64_type.fn_type(&[], false);
        let main_fn = module.add_function("main", fn_type, Some(Linkage::External));
        let block = self.context.append_basic_block(main_fn, "entry");

        builder.position_at_end(block);
        builder.build_return(Some(&i64_type.const_int(0, false)));

        Ok(module)
    }

    pub fn compile(&self, session: Session) -> std::result::Result<(), BackendError> {
        let reloc = RelocMode::Default;
        let model = CodeModel::Default;
        let opt = match self.configuration.optimization_level {
            backend_core::OptimizationLevel::Default => OptimizationLevel::Default,
            backend_core::OptimizationLevel::Disabled => OptimizationLevel::None,
        };

        let triple = TargetMachine::get_default_triple();
        let target = Target::from_triple(&triple).unwrap();

        let target_machine = target
            .create_target_machine(
                &triple,
                TargetMachine::get_host_cpu_name().to_str().unwrap(),
                TargetMachine::get_host_cpu_features().to_str().unwrap(),
                opt,
                reloc,
                model,
            )
            .ok_or(BackendError::LLVM(format!(
                "Unable to init target machine: {}",
                triple
            )))?;

        let mut link = vec![];

        for session_module in session.modules {
            let pfm = env::current_dir()?.join("output").join(session_module.name);
            let path_for_module = Path::new(&pfm);
            fs::create_dir_all(path_for_module)?;

            for session_file in session_module.files {
                let mut transformer = Transformer::new(&self.context);

                for fun in session_file.functions {
                    transformer.transform_fn(fun)?;
                }

                let module = self.inject_main(transformer.module())?;
                let module = self.compile_module(module)?;

                let path = path_for_module.join(session_file.filename.clone() + ".asm");

                target_machine
                    .write_to_file(&module, FileType::Object, &path)
                    .map_err(BackendError::LLVMInternal)?;

                link.push(module);
            }
        }

        Ok(())
    }
}
