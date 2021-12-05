use inkwell::values::FloatValue;

#[derive(Debug, Clone)]
pub enum CompiledExpression<'ctx> {
    Float64(FloatValue<'ctx>),
    Unknown(),
}

impl<'ctx> CompiledExpression<'ctx> {}
