---
title: "Macros Procedurales"
description: "Construya derive macros, attribute macros y function-like macros usando los crates syn y quote"
order: 8
duration: "90 minutos"
difficulty: advanced
---

# Macros Procedurales

Las macros procedurales son funciones que se ejecutan en tiempo de compilación, tomando código Rust como entrada y produciendo código Rust como salida. Son más poderosas que `macro_rules!` pero requieren un crate separado.

## Tipos de Macros Procedurales

| Tipo | Sintaxis | Propósito |
|------|--------|---------|
| Derive | `#[derive(MyTrait)]` | Auto-implementar traits |
| Attribute | `#[my_attribute]` | Anotaciones personalizadas |
| Function-like | `my_macro!(...)` | Generación de código general |

## Configuración del Proyecto

Las macros procedurales deben estar en un crate separado llamado `*_derive` o con `proc-macro = true`:

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
# o: my_macro_derive = { path = "my_macro_derive" }
```

## Una Derive Macro Simple

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
> Los crates de proc macro solo pueden exportar proc macros. Típicamente contienen solo la lógica de la macro y dependen de `syn`, `quote` y `proc-macro2`.

## Parsing con syn

`syn` analiza código Rust en un AST que puedes manipular:

```rust
use syn::{
    parse_macro_input, DeriveInput, Data, Fields, 
    Lit, Meta, Expr, Token,
};

#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    
    // Inspeccionar la struct/enum
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
                Fields::Unit => { /* struct unitaria */ }
            }
        }
        Data::Enum(data) => { /* enum */ }
        Data::Union(data) => { /* union */ }
    }
    
    TokenStream::new()
}
```

### Custom Derive con Atributos de Campo

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
    // attr: los argumentos del atributo (ej.: "GET /users")
    // item: la función o elemento en el que está el atributo
    let path = parse_macro_input!(attr as syn::LitStr);
    let input_fn = parse_macro_input!(item as syn::ItemFn);
    let fn_name = &input_fn.sig.ident;
    
    let gen = quote! {
        #input_fn
        
        // Registrar la ruta
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
    
    // Analizar y validar en tiempo de compilación
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
    // Validación básica
    query.to_uppercase().starts_with("SELECT")
        || query.to_uppercase().starts_with("INSERT")
        || query.to_uppercase().starts_with("UPDATE")
        || query.to_uppercase().starts_with("DELETE")
}

// Uso
let query = sql!("SELECT * FROM users WHERE id = 1");
```

> [!SUCCESS]
| Tipo de Macro | Úsalo Cuando |
|------------|----------|
| Derive | Necesites auto-implementar un trait |
| Attribute | Necesites crear anotaciones personalizadas |
| Function-like | Necesites procesar sintaxis arbitraria |

## El Ecosistema proc_macro, proc_macro2 y quote

```rust
use proc_macro2::{TokenStream, TokenTree};
use quote::ToTokens;

// proc_macro2 te da más control que proc_macro
fn process_tokens(input: proc_macro2::TokenStream) -> proc_macro2::TokenStream {
    let mut result = TokenStream::new();
    
    for token in input {
        match token {
            TokenTree::Ident(ident) => {
                let s = ident.to_string();
                if s.starts_with('_') {
                    // Saltar identificadores privados
                } else {
                    ident.to_tokens(&mut result);
                }
            }
            other => other.to_tokens(&mut result),
        }
    }
    
    result
}

// quote! crea streams de token a partir de interpolación
fn make_getter(field_name: &syn::Ident, field_type: &syn::Type) -> proc_macro2::TokenStream {
    quote! {
        fn #field_name(&self) -> &#field_type {
            &self.#field_name
        }
    }
}
```

## Ejemplo Real: Auto-Builder Derive

```rust
// Ejemplo completo de macro builder:

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

## Preguntas de Práctica

1. ¿Cuáles son los tres tipos de macros procedurales?
2. ¿Por qué las proc macros deben estar en un crate separado?
3. ¿Qué hace `syn` y qué hace `quote`?
4. ¿Cómo recibe su entrada una derive macro?
5. ¿Cuál es la diferencia entre `proc_macro` y `proc_macro2`?
6. ¿Cómo difieren las attribute macros de las derive macros?
7. ¿Cómo analizar atributos personalizados en campos de struct?
8. ¿Qué genera `quote!`?
9. ¿Cómo manejar campos opcionales en un builder derive?
10. ¿Cuáles son las limitaciones de las macros procedurales comparadas con `macro_rules!`?
