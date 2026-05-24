---
title: "Procedural Macros"
description: "Build derive macros, attribute macros, and function-like macros using the syn and quote crates"
order: 8
duration: "90 minutes"
difficulty: advanced
---

# Procedural Macros

Procedural macros are functions that run at compile time, taking Rust code as input and producing Rust code as output. They're more powerful than `macro_rules!` but require a separate crate.

## Types of Procedural Macros

| Type | Syntax | Purpose |
|------|--------|---------|
| Derive | `#[derive(MyTrait)]` | Auto-implement traits |
| Attribute | `#[my_attribute]` | Custom annotations |
| Function-like | `my_macro!(...)` | General code generation |

## Project Setup

Procedural macros must be in a separate crate named `*_derive` or with `proc-macro = true`:

```toml
# Cargo.toml (macro crate)
[lib]
proc-macro = true

[dependencies]
syn = { version = "2", features = ["full"] }
quote = "1"
proc-macro2 = "1"
```

```toml
# Cargo.toml (main crate)
[dependencies]
my_macro = { path = "my_macro" }
# or: my_macro_derive = { path = "my_macro_derive" }
```

## A Simple Derive Macro

```rust
// my_macro_derive/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    
    let gen = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}", stringify!(#name));
            }
        }
    };
    
    gen.into()
}
```

```rust
// src/main.rs
use my_macro_derive::HelloMacro;

trait HelloMacro {
    fn hello_macro();
}

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro(); // "Hello, Macro! My name is Pancakes"
}
```

> [!NOTE]
> Proc macro crates can only export proc macros. They typically contain only the macro logic and depend on `syn`, `quote`, and `proc-macro2`.

## Parsing with syn

`syn` parses Rust code into an AST you can manipulate:

```rust
use syn::{
    parse_macro_input, DeriveInput, Data, Fields, 
    Lit, Meta, Expr, Token,
};

#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    
    // Inspect the struct/enum
    match &ast.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    for field in &fields.named {
                        let name = &field.ident;
                        let ty = &field.ty;
                        // ...
                    }
                }
                Fields::Unnamed(fields) => { /* tuple struct */ }
                Fields::Unit => { /* unit struct */ }
            }
        }
        Data::Enum(data) => { /* enum */ }
        Data::Union(data) => { /* union */ }
    }
    
    TokenStream::new()
}
```

### Custom Derive with Field Attributes

```rust
// Macro crate
#[proc_macro_derive(Builder)]
pub fn derive_builder(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    let builder_name = syn::Ident::new(&format!("{}Builder", name), name.span());
    
    let fields = match &ast.data {
        syn::Data::Struct(data) => &data.fields,
        _ => panic!("Builder only supports structs"),
    };
    
    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! { #name: Option<#ty> }
    });
    
    let setter_methods = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! {
            fn #name(mut self, value: #ty) -> Self {
                self.#name = Some(value);
                self
            }
        }
    });
    
    let build_fields = fields.iter().map(|f| {
        let name = &f.ident;
        quote! { #name: self.#name.clone().unwrap_or_default() }
    });
    
    let gen = quote! {
        struct #builder_name {
            #(#builder_fields),*
        }
        
        impl #builder_name {
            #(#setter_methods)*
            
            fn build(&self) -> #name {
                #name {
                    #(#build_fields),*
                }
            }
        }
        
        impl #name {
            fn builder() -> #builder_name {
                #builder_name {
                    #( #fields: None ),*
                }
            }
        }
    };
    
    gen.into()
}
```

## Attribute Macros

```rust
// Macro crate
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
    // attr: the attribute arguments (e.g., "GET /users")
    // item: the function or item the attribute is on
    let path = parse_macro_input!(attr as syn::LitStr);
    let input_fn = parse_macro_input!(item as syn::ItemFn);
    let fn_name = &input_fn.sig.ident;
    
    let gen = quote! {
        #input_fn
        
        // Register the route
        pub fn __register_routes() {
            ROUTES.insert(#path, Box::new(#fn_name));
        }
    };
    
    gen.into()
}
```

```rust
// Usage
#[route("GET /users")]
fn list_users() -> String {
    "user list".to_string()
}
```

## Function-Like Macros

```rust
// Macro crate
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let sql_string = parse_macro_input!(input as syn::LitStr);
    let query = sql_string.value();
    
    // Parse and validate at compile time
    let validated = validate_sql(&query);
    
    let gen = quote! {
        SqlQuery {
            query: #sql_string.to_string(),
            validated: true,
        }
    };
    
    gen.into()
}

fn validate_sql(query: &str) -> bool {
    // Basic validation
    query.to_uppercase().starts_with("SELECT")
        || query.to_uppercase().starts_with("INSERT")
        || query.to_uppercase().starts_with("UPDATE")
        || query.to_uppercase().starts_with("DELETE")
}

// Usage
let query = sql!("SELECT * FROM users WHERE id = 1");
```

> [!SUCCESS]
| Macro Type | Use When |
|------------|----------|
| Derive | Need to auto-implement a trait |
| Attribute | Need to create custom annotations |
| Function-like | Need to process arbitrary syntax |

## The proc_macro, proc_macro2, and quote Ecosystem

```rust
use proc_macro2::{TokenStream, TokenTree};
use quote::ToTokens;

// proc_macro2 gives you more control than proc_macro
fn process_tokens(input: proc_macro2::TokenStream) -> proc_macro2::TokenStream {
    let mut result = TokenStream::new();
    
    for token in input {
        match token {
            TokenTree::Ident(ident) => {
                let s = ident.to_string();
                if s.starts_with('_') {
                    // Skip private identifiers
                } else {
                    ident.to_tokens(&mut result);
                }
            }
            other => other.to_tokens(&mut result),
        }
    }
    
    result
}

// quote! creates token streams from interpolation
fn make_getter(field_name: &syn::Ident, field_type: &syn::Type) -> proc_macro2::TokenStream {
    quote! {
        fn #field_name(&self) -> &#field_type {
            &self.#field_name
        }
    }
}
```

## Real-World: Auto-Builder Derive

```rust
// Complete builder macro example:

#[proc_macro_derive(Builder)]
pub fn derive_builder(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let builder_name = syn::Ident::new(&format!("{}Builder", name), name.span());
    
    let data = match &input.data {
        Data::Struct(d) => d,
        _ => panic!("Builder only supports structs"),
    };
    
    let fields: Vec<_> = match &data.fields {
        Fields::Named(f) => f.named.iter().collect(),
        _ => panic!("Builder requires named fields"),
    };
    
    let field_names: Vec<_> = fields.iter()
        .map(|f| f.ident.as_ref().unwrap())
        .collect();
    
    let field_types: Vec<_> = fields.iter()
        .map(|f| &f.ty)
        .collect();
    
    let expanded = quote! {
        impl #name {
            fn builder() -> #builder_name {
                #builder_name::default()
            }
        }
        
        #[derive(Default)]
        struct #builder_name {
            #( #field_names: Option<#field_types> ),*
        }
        
        impl #builder_name {
            #(
                fn #field_names(mut self, value: impl Into<#field_types>) -> Self {
                    self.#field_names = Some(value.into());
                    self
                }
            )*
            
            fn build(&self) -> Result<#name, String> {
                Ok(#name {
                    #(
                        #field_names: self.#field_names.clone()
                            .ok_or_else(|| format!("field {} is missing", stringify!(#field_names)))?
                    ),*
                })
            }
        }
    };
    
    expanded.into()
}
```

## Practice Questions

1. What are the three types of procedural macros?
2. Why must proc macros be in a separate crate?
3. What does `syn` do and what does `quote` do?
4. How does a derive macro receive its input?
5. What's the difference between `proc_macro` and `proc_macro2`?
6. How do attribute macros differ from derive macros?
7. How do you parse custom attributes on struct fields?
8. What does `quote!` generate?
9. How do you handle optional fields in a builder derive?
10. What are the limitations of procedural macros compared to `macro_rules!`?
