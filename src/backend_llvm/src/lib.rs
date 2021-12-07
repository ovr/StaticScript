// use inkwell::builder::Builder;
// use inkwell::context::Context;
// use inkwell::execution_engine::{ExecutionEngine, JitFunction};
// use inkwell::module::{Linkage, Module};
// use inkwell::passes::{PassManager, PassManagerBuilder, PassManagerSubType};
// use inkwell::targets::{InitializationConfig, Target};
// use inkwell::types::FunctionType;
// use inkwell::values::AggregateValue;
// use inkwell::{builder, OptimizationLevel};

use backend_core::Session;
use inkwell as llvm;
use llvm::{
    context::Context,
    module::{Linkage, Module},
    passes::{PassManager, PassManagerBuilder},
    targets::{InitializationConfig, Target},
    OptimizationLevel,
};

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
}

mod transformer;
mod types;

pub struct LLVMBackend {
    context: Context,
}

impl LLVMBackend {
    pub fn new() -> Self {
        Self {
            context: Context::create(),
        }
    }

    pub fn init(&self) -> std::result::Result<(), BackendError> {
        Target::initialize_native(&InitializationConfig::default()).map_err(BackendError::LLVM)?;
        Target::initialize_aarch64(&InitializationConfig::default());

        Ok(())
    }

    pub fn compile_module<'ctx>(
        &self,
        module: Module<'ctx>,
    ) -> std::result::Result<Module<'ctx>, BackendError> {
        println!("Compiled IR {}", module.print_to_string().to_string());
        module.verify().unwrap();

        let pass_manager_builder = PassManagerBuilder::create();
        pass_manager_builder.set_optimization_level(OptimizationLevel::Default);

        let fpm = PassManager::create(());
        pass_manager_builder.populate_module_pass_manager(&fpm);

        fpm.run_on(&module);
        println!("Optimized IR {}", module.print_to_string().to_string());

        Ok(module)
    }

    pub fn inject_main<'ctx>(&'ctx self, module: Module<'ctx>) -> std::result::Result<Module<'ctx>, BackendError> {
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
        let mut link = vec![];

        for session_module in session.modules {
            let mut transformer = Transformer::new(&self.context);

            for fun in session_module.functions {
                transformer.transform_fn(fun)?;
            }

            let module = self.inject_main(transformer.module())?;
            let module = self.compile_module(module)?;

            link.push(module);
        }

        Ok(())
    }
}
