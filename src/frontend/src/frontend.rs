use crate::binder::Binder;

use crate::project::Project;
use crate::Error;
use backend_core::{Session, SessionModule};
use backend_llvm::LLVMBackend;
use swc_common::sync::Lrc;
use swc_common::{
    errors::{ColorConfig, Handler},
    FileName, SourceMap,
};
use swc_ecma_ast as ast;
use swc_ecma_parser::TsConfig;
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax};

pub struct Frontend {}

impl Frontend {
    pub fn new() -> Self {
        Self {}
    }

    fn parse(&self, filename: FileName, src: String) -> ast::Module {
        let cm: Lrc<SourceMap> = Default::default();
        let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(cm.clone()));

        let fm = cm.new_source_file(filename, src);
        let lexer = Lexer::new(
            // We want to parse ecmascript
            Syntax::Typescript(TsConfig {
                tsx: false,
                decorators: false,
                dynamic_import: false,
                dts: false,
                no_early_errors: false,
                import_assertions: false,
            }),
            // EsVersion defaults to es5
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);

        for e in parser.take_errors() {
            e.into_diagnostic(&handler).emit();
        }

        parser
            .parse_module()
            .map_err(|e| {
                // Unrecoverable fatal error occurred
                e.into_diagnostic(&handler).emit()
            })
            .expect("failed to parser module")
    }

    pub fn compile_inline(&self, src: String) -> Result<(), Error> {
        let module = self.parse(FileName::Custom("test.js".into()), src);

        let binder = Binder::new();
        let binded_module = binder.bind(module);

        let llvm_backend = LLVMBackend::new();
        llvm_backend.init()?;

        let session = Session {
            modules: vec![SessionModule {
                functions: binded_module.functions,
            }],
        };
        llvm_backend.compile(session)?;

        Ok(())
    }

    pub fn compile(&self, _project: Project) {}
}
