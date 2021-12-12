use std::collections::HashMap;

use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct TSConfigurationReference {
    pub path: String,
}

#[derive(Deserialize, Debug)]
pub struct TSConfigurationCompilerOptions {
    #[serde(rename(deserialize = "outDir"))]
    pub out_dir: Option<String>,
    //
    #[serde(rename(deserialize = "rootDir"))]
    pub root_dir: Option<String>,
    //
    #[serde(rename(deserialize = "baseUrl"))]
    pub base_url: Option<String>,
    //
    pub lib: Option<Vec<String>>,
    // ES target, example: es2018
    pub target: Option<String>,
    //
    pub paths: Option<HashMap<String, Vec<String>>>,
}

#[derive(Deserialize, Debug)]
pub struct TSConfiguration {
    pub extends: Option<String>,
    pub references: Option<Vec<TSConfigurationReference>>,
    pub include: Option<Vec<String>>,
    #[serde(rename(deserialize = "compilerOptions"))]
    pub compiler_options: Option<TSConfigurationCompilerOptions>,
    pub exclude: Option<Vec<String>>,
    pub files: Option<Vec<String>>,
}
