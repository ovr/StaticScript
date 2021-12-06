mod tests {
    #[test]
    fn test_var_number_sum() {
        let frontend = frontend::frontend::Frontend::new();
        frontend
            .compile_inline(
                "function sum() { let a = 1; let b = 2; let c = 3; return a + b + c; }".to_string(),
            )
            .unwrap();
    }

    #[test]
    fn test_var_number_compare() {
        let frontend = frontend::frontend::Frontend::new();
        frontend
            .compile_inline(
                r#"
                function f64_gt_compare() { let a = 1; let b = 2; return a > b; }
                function f64_gte_compare() { let a = 1; let b = 2; return a >= b; }
                function f64_lte_compare() { let a = 1; let b = 2; return a <= b; }
                function f64_le_compare() { let a = 1; let b = 2; return a <= b; }
                function f64_eq_compare() { let a = 1; let b = 2; return a == b; }
                function f64_neq_compare() { let a = 1; let b = 2; return a != b; }
            "#
                .to_string(),
            )
            .unwrap();
    }
}
