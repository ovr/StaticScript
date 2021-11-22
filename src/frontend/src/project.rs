use std::{
    collections::HashMap,
    fs::{self, read_dir},
    path::Path,
};

use swc_common::FileLoader;

use crate::{
    tsconfig::{self, TSConfiguration},
    Error,
};

pub struct ProjectState {
    files: Option<HashMap<String, String>>,
}

impl ProjectState {
    pub fn new() -> Self {
        Self { files: None }
    }
}

pub struct Project {
    state: ProjectState,
    subproject: Vec<ProjectState>,
}

impl Project {
    pub fn new() -> Self {
        Self {
            state: ProjectState::new(),
            subproject: vec![],
        }
    }

    pub fn load_project(&mut self, path: &Path) -> Result<(), Error> {
        let buff = fs::read_to_string(path).unwrap();
        // println!("{}", buff);

        let tsconfig = serde_jsonrc::from_str::<TSConfiguration>(&buff).unwrap();
        println!("{:?}", tsconfig);

        self.state.files = Some(self.load_files(&tsconfig, path)?);

        if let Some(references) = tsconfig.references {
            for reference in references {
                println!("Reference {}", reference.path);

                let p = reference.path.clone() + &"/tsconfig.json".to_string();
                let reference_path = Path::new(&p);

                self.load_subproject(reference_path)?;
            }
        }

        Ok(())
    }

    pub fn load_subproject(&self, tsconfig_path: &Path) -> Result<(), Error> {
        if tsconfig_path.exists() {
            if tsconfig_path.is_file() {
                let buff = fs::read_to_string(tsconfig_path).unwrap();
                // println!("{}", buff);

                let tsconfig = serde_jsonrc::from_str::<TSConfiguration>(&buff).unwrap();
                println!("Subproject {:?}", tsconfig);

                if let Some(extends) = &tsconfig.extends {
                    // let tsconfig_extends_path = tsconfig_path.parent().unwrap().join(extends);
                    // if !tsconfig_extends_path.exists() {
                    //     return Err(Error::User(format!(
                    //         "Reference file doesnt exist: {}",
                    //         tsconfig_extends_path.to_string_lossy()
                    //     )));
                    // }

                    // if !tsconfig_extends_path.is_file() {
                    //     return Err(Error::User("Reference configuration must be a file".to_string()));
                    // }

                    // let buff = fs::read_to_string(tsconfig_extends_path).unwrap();

                    // let baseconfig = serde_jsonrc::from_str::<TSConfiguration>(&buff).unwrap();
                    // println!("Extending {:?}", baseconfig);
                };

                self.load_files(&tsconfig, &tsconfig_path)?;
            }
        };

        Ok(())
    }

    pub fn load_files(
        &self,
        tsconfig: &TSConfiguration,
        base_path: &Path,
    ) -> Result<HashMap<String, String>, Error> {
        let mut files: HashMap<String, String> = HashMap::new();

        if let Some(include) = &tsconfig.include {
            for include_subdir in include {
                let include_subdir_path = base_path.parent().unwrap().join(include_subdir);
                if include_subdir_path.exists() && include_subdir_path.is_dir() {
                    println!("Subdir {}", include_subdir_path.to_string_lossy());

                    for entry_res in read_dir(include_subdir_path).unwrap() {
                        match entry_res {
                            Ok(entry) => {
                                let file_name_buf = entry.file_name();
                                let file_name = file_name_buf.to_str().unwrap();

                                println!("File {}", &file_name);

                                if file_name.ends_with(".ts") {
                                    files.insert(
                                        file_name.to_string(),
                                        fs::read_to_string(entry.path()).unwrap(),
                                    );
                                };
                            }
                            Err(_) => todo!(),
                        }
                    }
                }
            }
        } else {
            println!("No include");
        }

        Ok(files)
    }

    pub fn scan(&mut self, base_path: &Path) -> Result<(), Error> {
        let tsconfig_path = Path::new("./tsconfig.json");

        if tsconfig_path.exists() {
            if tsconfig_path.is_file() {
                let tsconfig = self.load_project(&tsconfig_path)?;
            }
        };

        Ok(())
    }
}
