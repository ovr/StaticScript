use std::{cell::RefCell, collections::HashMap, rc::Rc};

use crate::{types::CompiledExpression, BackendError};

#[derive(Debug)]
pub struct Scope<'ctx> {
    pub variables: RefCell<HashMap<String, CompiledExpression<'ctx>>>,
}

impl<'ctx> Scope<'ctx> {
    pub fn new() -> Self {
        Self {
            variables: RefCell::new(HashMap::new()),
        }
    }

    pub fn define_variable(&self, identifier: String, reference: CompiledExpression<'ctx>) {
        let mut variables = self.variables.borrow_mut();
        if variables.contains_key(&identifier) {
            panic!("Unable to define variable twice");
        } else {
            variables.insert(identifier, reference);
        }
    }

    pub fn get_variable(
        &self,
        identifier: String,
    ) -> Result<CompiledExpression<'ctx>, BackendError> {
        if let Some(reference) = self.variables.borrow().get(&identifier) {
            Ok(reference.clone())
        } else {
            panic!("Unknown variable: {}", identifier);
        }
    }
}

#[derive(Clone, Debug)]
pub struct ScopeStack<'ctx> {
    stack: RefCell<Vec<Rc<Scope<'ctx>>>>,
}

impl<'ctx> ScopeStack<'ctx> {
    pub fn new() -> Self {
        Self {
            stack: RefCell::new(Vec::new()),
        }
    }

    pub(crate) fn scope(&self) -> Rc<Scope<'ctx>> {
        self.stack.borrow().last().cloned().unwrap()
    }

    pub(crate) fn push(&self, scope: Rc<Scope<'ctx>>) {
        self.stack.borrow_mut().push(scope);
    }

    pub(crate) fn pop(&self) {
        self.stack.borrow_mut().pop();
    }
}
