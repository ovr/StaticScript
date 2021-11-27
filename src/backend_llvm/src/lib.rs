// use inkwell::builder::Builder;
// use inkwell::context::Context;
// use inkwell::execution_engine::{ExecutionEngine, JitFunction};
// use inkwell::module::{Linkage, Module};
// use inkwell::passes::{PassManager, PassManagerBuilder, PassManagerSubType};
// use inkwell::targets::{InitializationConfig, Target};
// use inkwell::types::FunctionType;
// use inkwell::values::AggregateValue;
// use inkwell::{builder, OptimizationLevel};

use err_derive::Error;
use std::error::Error;

#[derive(Error, Debug)]
pub enum BackendError {
    #[error(display = "User: {:?}", _0)]
    User(String),
}

// Convenience type alias for the `sum` function.
//
// Calling this is innately `unsafe` because there's no guarantee it doesn't
// do `unsafe` operations internally.
// type SumFunc = unsafe extern "C" fn(u64, u64, u64) -> u64;

// struct CodeGen<'ctx> {
//     context: &'ctx Context,
//     module: Module<'ctx>,
//     builder: Builder<'ctx>,
// }

// impl<'ctx> CodeGen<'ctx> {
//     fn jit_compile_sum(&self) -> Result<(), dyn Error> {
//         let i64_type = self.context.i64_type();
//         let fn_type = i64_type.fn_type(&[i64_type.into(), i64_type.into(), i64_type.into()], false);
//         let function = self.module.add_function("sum", fn_type, None);
//         let basic_block = self.context.append_basic_block(function, "entry");

//         self.builder.position_at_end(basic_block);

//         let x = function.get_nth_param(0)?.into_int_value();
//         let y = function.get_nth_param(1)?.into_int_value();
//         let z = function.get_nth_param(2)?.into_int_value();

//         let sum = self.builder.build_int_add(x, y, "sum");
//         let sum = self.builder.build_int_add(sum, z, "sum");

//         self.builder.build_return(Some(&sum));
//     }
// }

// fn main() -> Result<(), Box<dyn Error>> {
//     let context = Context::create();
//     let module = context.create_module("main");
//     // // let execution_engine = module.create_jit_execution_engine(OptimizationLevel::None)?;
//     // let codegen = CodeGen {
//     //     context: &context,
//     //     module,
//     //     builder: context.create_builder(),
//     //     // execution_engine,
//     // };

//     // Target::initialize_aarch64();
//     // context.com

//     let builder = context.create_builder();

//     let i64_type = context.i64_type();
//     let fn_type = i64_type.fn_type(&[], false);

//     let main_fn = module.add_function("main", fn_type, Some(Linkage::External));
//     let block = context.append_basic_block(main_fn, "entry");

//     builder.position_at_end(block);
//     builder.build_return(
//         // None,
//         // context.i64_type()
//         Some(&i64_type.const_zero()),
//     );

//     // let mut ee = module.create_execution_engine().unwrap();
//     // ee.add_module(&module).unwrap();

//     module.verify().unwrap();
//     println!("Compiled IR {}", module.print_to_string().to_string());

//     let pass_manager_builder = PassManagerBuilder::create();
//     pass_manager_builder.set_optimization_level(OptimizationLevel::Default);

//     let fpm = PassManager::create(());
//     pass_manager_builder.populate_module_pass_manager(&fpm);

//     fpm.run_on(&module);

//     println!("Optimized IR {}", module.print_to_string().to_string());

//     // let memory_buffer = module.write_bitcode_to_memory();

//     Target::initialize_native(&InitializationConfig::default())
//         .expect("Failed to initialize native target");
//     // module.write_bitcode_to_file(file, should_close, unbuffered)

//     // let execution_engine = module.create_execution_engine().unwrap();
//     // let target_data = execution_engine.get_target_data();
//     // module.set

//     // println!("{:?}", memory_buffer.as_slice());

//     // let sum = codegen.jit_compile_sum().ok_or("Unable to JIT compile `sum`")?;

//     // let x = 1u64;
//     // let y = 2u64;
//     // let z = 3u64;

//     // unsafe {
//     //     println!("{} + {} + {} = {}", x, y, z, sum.call(x, y, z));
//     //     assert_eq!(sum.call(x, y, z), x + y + z);
//     // }

//     Ok(())
// }
