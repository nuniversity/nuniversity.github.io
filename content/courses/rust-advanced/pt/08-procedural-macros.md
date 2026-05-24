---
title: "Macros Procedurais"
description: "Construa derive macros, attribute macros e function-like macros usando os crates syn e quote"
order: 8
duration: "90 minutos"
difficulty: advanced
---

# Macros Procedurais

Macros procedurais são funções que executam em tempo de compilação, recebendo código Rust como entrada e produzindo código Rust como saída. Elas são mais poderosas que `macro_rules!` mas requerem uma crate separada.

## Tipos de Macros Procedurais

| Tipo | Sintaxe | Propósito |
|------|--------|---------|
| Derive | `#[derive(MyTrait)]` | Auto-implementar traits |
| Attribute | `#[my_attribute]` | Anotações personalizadas |
| Function-like | `my_macro!(...)` | Geração de código geral |

## Configuração do Projeto

Macros procedurais devem estar em uma crate separada chamada `*_derive` ou com `proc-macro = true`:

```toml
# Cargo.toml (crate de macro)
[lib]
proc-macro = true

[dependencies]
syn = { version = "2", features = ["full"] }
quote = "1"
proc-macro2 = "1"
```

```toml
# Cargo.toml (crate principal)
[dependencies]
my_macro = { path = "my_macro" }
# ou: my_macro_derive = { path = "my_macro_derive" }
```

## Uma Derive Macro Simples

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
> Crates de proc macro só podem exportar proc macros. Elas tipicamente contêm apenas a lógica da macro e dependem de `syn`, `quote` e `proc-macro2`.

## Parsing com syn

`syn` analisa código Rust em uma AST que você pode manipular:

```rust
use syn::{
    parse_macro_input, DeriveInput, Data, Fields, 
    Lit, Meta, Expr, Token,
};

#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    
    // Inspecionar a struct/enum
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
                Fields::Unnamed(fields) => { /* struct tupla */ }
                Fields::Unit => { /* struct unitária */ }
            }
        }
        Data::Enum(data) => { /* enum */ }
        Data::Union(data) => { /* union */ }
    }
    
    TokenStream::new()
}
```

### Custom Derive com Atributos de Campo

```rust
// Crate de macro
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
// Crate de macro
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
    // attr: os argumentos do atributo (ex.: "GET /users")
    // item: a função ou item no qual o atributo está
    let path = parse_macro_input!(attr as syn::LitStr);
    let input_fn = parse_macro_input!(item as syn::ItemFn);
    let fn_name = &input_fn.sig.ident;
    
    let gen = quote! {
        #input_fn
        
        // Registrar a rota
        pub fn __register_routes() {
            ROUTES.insert(#path, Box::new(#fn_name));
        }
    };
    
    gen.into()
}
```

```rust
// Uso
#[route("GET /users")]
fn list_users() -> String {
    "user list".to_string()
}
```

## Function-Like Macros

```rust
// Crate de macro
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let sql_string = parse_macro_input!(input as syn::LitStr);
    let query = sql_string.value();
    
    // Analisar e validar em tempo de compilação
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
    // Validação básica
    query.to_uppercase().starts_with("SELECT")
        || query.to_uppercase().starts_with("INSERT")
        || query.to_uppercase().starts_with("UPDATE")
        || query.to_uppercase().starts_with("DELETE")
}

// Uso
let query = sql!("SELECT * FROM users WHERE id = 1");
```

> [!SUCCESS]
| Tipo de Macro | Use Quando |
|------------|----------|
| Derive | Precisar auto-implementar um trait |
| Attribute | Precisar criar anotações personalizadas |
| Function-like | Precisar processar sintaxe arbitrária |

## O Ecossistema proc_macro, proc_macro2 e quote

```rust
use proc_macro2::{TokenStream, TokenTree};
use quote::ToTokens;

// proc_macro2 lhe dá mais controle que proc_macro
fn process_tokens(input: proc_macro2::TokenStream) -> proc_macro2::TokenStream {
    let mut result = TokenStream::new();
    
    for token in input {
        match token {
            TokenTree::Ident(ident) => {
                let s = ident.to_string();
                if s.starts_with('_') {
                    // Pular identificadores privados
                } else {
                    ident.to_tokens(&mut result);
                }
            }
            other => other.to_tokens(&mut result),
        }
    }
    
    result
}

// quote! cria streams de token a partir de interpolação
fn make_getter(field_name: &syn::Ident, field_type: &syn::Type) -> proc_macro2::TokenStream {
    quote! {
        fn #field_name(&self) -> &#field_type {
            &self.#field_name
        }
    }
}
```

## Exemplo Real: Auto-Builder Derive

```rust
// Exemplo completo de macro builder:

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

## Perguntas de Prática

1. Quais são os três tipos de macros procedurais?
2. Por que proc macros devem estar em uma crate separada?
3. O que `syn` faz e o que `quote` faz?
4. Como uma derive macro recebe sua entrada?
5. Qual é a diferença entre `proc_macro` e `proc_macro2`?
6. Como attribute macros diferem de derive macros?
7. Como analisar atributos personalizados em campos de struct?
8. O que `quote!` gera?
9. Como lidar com campos opcionais em um builder derive?
10. Quais são as limitações das macros procedurais comparadas a `macro_rules!`?
