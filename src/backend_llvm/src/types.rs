use inkwell::values::{FloatValue, IntValue};

#[derive(Debug, Clone)]
pub enum CompiledExpression<'ctx> {
    Float64(FloatValue<'ctx>),
    Boolean(IntValue<'ctx>),
    Unknown(),
}

impl<'ctx> CompiledExpression<'ctx> {}
