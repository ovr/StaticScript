#[derive(Debug)]
pub enum NativeTypeId {
    Float64,
    Float32,
    Int64,
    Uint64,
    String,
    Dynamic,
}

#[derive(Debug)]
pub struct CompiledExpression {
    native_tid: NativeTypeId,
}

impl CompiledExpression {
    pub fn new(native_tid: NativeTypeId) -> Self {
        Self { native_tid }
    }
}
