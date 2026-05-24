---
title: "FFI e Interoperabilidade com C"
description: "Chame C a partir de Rust com FFI, use blocos extern, gerencie memória entre linguagens e automatize bindings com bindgen"
order: 6
duration: "90 minutos"
difficulty: advanced
---

# FFI e Interoperabilidade com C

Rust torna fácil interoperar com C através de uma Interface de Função Estrangeira (FFI) bem definida. Isso permite usar bibliotecas C existentes e expor código Rust para outras linguagens.

## A Palavra-chave extern

```rust
// Declarar funções C externas
extern "C" {
    fn puts(s: *const u8) -> i32;
    fn strlen(s: *const u8) -> usize;
}

fn main() {
    let msg = b"Hello from Rust\0";
    unsafe {
        puts(msg.as_ptr());
        let len = strlen(msg.as_ptr());
        println!("length: {len}");
    }
}
```

> [!NOTE]
| ABI | Quando Usar |
|-----|-------------|
| `"C"` | Interoperabilidade com C (mais comum) |
| `"stdcall"` | API do Windows (32-bit) |
| `"rust"` | ABI padrão do Rust (instável) |
| `"system"` | Padrão da plataforma (C no Unix, stdcall no Win32) |

## Padrão de Wrapper Seguro

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_int;

// Declaração FFI insegura
extern "C" {
    fn abs(x: c_int) -> c_int;
}

// Wrapper seguro
fn safe_abs(x: i32) -> i32 {
    unsafe { abs(x) }
}

// Exemplo com string
extern "C" {
    fn strlen(s: *const u8) -> usize;
}

fn safe_strlen(s: &str) -> usize {
    let c_string = CString::new(s).expect("null byte in string");
    unsafe { strlen(c_string.as_ptr()) }
}

fn main() {
    println!("abs(-5): {}", safe_abs(-5));
    println!("len('hello'): {}", safe_strlen("hello"));
}
```

> [!WARNING]
> `CString::new()` retorna um erro se a entrada contém um byte nulo. Strings C são terminadas em nulo, então nulls internos truncariam a string.

## Vinculando a Bibliotecas C

### Ligação Estática

```rust
// Ligar a libm estaticamente
#[link(name = "m", kind = "static")]
extern "C" {
    fn sqrt(x: f64) -> f64;
    fn pow(x: f64, y: f64) -> f64;
}
```

### Ligação Dinâmica

```rust
// Ligar a libm dinamicamente (padrão)
#[link(name = "m")]
extern "C" {
    fn sin(x: f64) -> f64;
    fn cos(x: f64) -> f64;
}
```

### Script de Build

```rust
// build.rs — executado antes de cargo build
fn main() {
    // Ligar a uma biblioteca C
    println!("cargo:rustc-link-search=/path/to/lib");
    println!("cargo:rustc-link-lib=my_c_lib");
    
    // Re-executar se o código-fonte da biblioteca mudar
    println!("cargo:rerun-if-changed=src/c_library.c");
    
    // Compilar código C junto com Rust
    cc::Build::new()
        .file("src/c_helper.c")
        .compile("c_helper");
}
```

```toml
# Cargo.toml
[build-dependencies]
cc = "1.0"  // Para compilar código C
```

## Gerenciamento de Memória entre FFI

### Regras de Ownership

```rust
use std::ffi::CString;

extern "C" {
    // Retorna uma string alocada — Rust deve liberá-la
    fn get_message() -> *mut u8;
    
    // Assume ownership da string alocada
    fn free_message(ptr: *mut u8);
}

fn safe_get_message() -> String {
    let ptr = unsafe { get_message() };
    if ptr.is_null() {
        return String::new();
    }
    
    // Converter para string Rust
    let c_str = unsafe { CStr::from_ptr(ptr as *const i8) };
    let result = c_str.to_string_lossy().into_owned();
    
    // Liberar a memória alocada por C
    unsafe { free_message(ptr) };
    
    result
}
```

> [!SUCCESS]
| Origem | Alocador | Deve Liberar Com |
|--------|-----------|----------------|
| Código Rust | Alocador Rust | `drop` / dealloc do Rust |
| Biblioteca C | `malloc` | `free` |
| Seu código C | Deve corresponder | Libere com o alocador correspondente |

### Passando Alocações Rust para C

```rust
use std::mem;

extern "C" fn callback(data: *mut u8, len: usize) {
    // Chamado de C — precisamos reconstruir uma slice Rust
    let slice = unsafe { std::slice::from_raw_parts(data, len) };
    println!("C passed: {:?}", slice);
}

fn main() {
    let mut data = vec![1u8, 2, 3, 4];
    let ptr = data.as_mut_ptr();
    let len = data.len();
    
    // Impedir Rust de dropar os dados enquanto C os usa
    mem::forget(data); // NÃO dropar — C liberará
    
    unsafe {
        callback(ptr, len);
    }
}
```

## Representando Structs C

```rust
use std::ffi::CStr;

#[repr(C)]
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

#[repr(C)]
struct Person {
    name: *const i8,  // String C
    age: u32,
}

impl Person {
    fn safe_name(&self) -> &str {
        unsafe { CStr::from_ptr(self.name) }
            .to_str()
            .unwrap_or("<invalid utf8>")
    }
}

extern "C" {
    fn make_point(x: f64, y: f64) -> Point;
    fn print_person(p: *const Person);
}

fn main() {
    unsafe {
        let p = make_point(3.0, 4.0);
        println!("Point: {:?}", p); // Point { x: 3.0, y: 4.0 }
    }
}
```

> [!WARNING]
> `#[repr(C)]` garante layout compatível com C. Sem ele, Rust pode reordenar campos. Sempre use `#[repr(C)]` para structs FFI.

## Callbacks — Rust para C

```rust
// Definir tipo de callback
type Callback = unsafe extern "C" fn(i32) -> i32;

extern "C" {
    fn register_callback(cb: Option<Callback>);
    fn trigger_callback(x: i32) -> i32;
}

// Função Rust que C pode chamar
unsafe extern "C" fn my_callback(x: i32) -> i32 {
    x * 2
}

fn main() {
    unsafe {
        register_callback(Some(my_callback));
        let result = trigger_callback(21);
        println!("result: {result}"); // 42
    }
}
```

### Callbacks Baseadas em Closure

```rust
use std::ffi::c_void;

extern "C" {
    fn register_handler(ctx: *mut c_void, cb: unsafe extern "C" fn(*mut c_void, i32));
}

unsafe extern "C" fn handler_callback<F: FnMut(i32)>(ctx: *mut c_void, val: i32) {
    let handler = &mut *(ctx as *mut F);
    handler(val);
}

struct Handler<F: FnMut(i32)> {
    callback: F,
}

fn main() {
    let mut handler = Handler {
        callback: |x| println!("callback: {x}"),
    };
    
    let ctx = &mut handler as *mut Handler<_> as *mut c_void;
    unsafe {
        register_handler(ctx, handler_callback::<Box<dyn FnMut(i32)>>);
    }
}
```

## bindgen — Bindings Automáticos

Para cabeçalhos C grandes, use `bindgen` para gerar bindings automaticamente:

```toml
[build-dependencies]
bindgen = "0.70"
```

```rust
// build.rs
fn main() {
    let bindings = bindgen::Builder::default()
        .header("wrapper.h") // #include <my_lib.h>
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("unable to generate bindings");
    
    bindings
        .write_to_file("src/bindings.rs")
        .expect("couldn't write bindings");
}
```

```rust
// src/lib.rs
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!("bindings.rs");
```

## Exemplo Real: Usando libcurl

```rust
use std::ffi::{CStr, CString};

#[repr(C)]
struct curl_slist {
    data: *const i8,
    next: *mut curl_slist,
}

extern "C" {
    fn curl_global_init(flags: i64) -> i32;
    fn curl_easy_init() -> *mut std::ffi::c_void;
    fn curl_easy_setopt(handle: *mut std::ffi::c_void, opt: i32, param: ...) -> i32;
    fn curl_easy_perform(handle: *mut std::ffi::c_void) -> i32;
    fn curl_easy_cleanup(handle: *mut std::ffi::c_void);
    fn curl_global_cleanup();
}

const CURLOPT_URL: i32 = 10002;
const CURLOPT_FOLLOWLOCATION: i32 = 52;

fn fetch_url(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    unsafe {
        curl_global_init(3); // CURL_GLOBAL_ALL
        let handle = curl_easy_init();
        
        if handle.is_null() {
            curl_global_cleanup();
            return Err("curl init failed".into());
        }
        
        let c_url = CString::new(url)?;
        curl_easy_setopt(handle, CURLOPT_URL, c_url.as_ptr());
        curl_easy_setopt(handle, CURLOPT_FOLLOWLOCATION, 1i64);
        
        let res = curl_easy_perform(handle);
        curl_easy_cleanup(handle);
        curl_global_cleanup();
        
        if res != 0 {
            return Err(format!("curl error: {res}").into());
        }
    }
    
    Ok(())
}
```

## Perguntas de Prática

1. O que `extern "C"` faz em Rust?
2. Como passar strings entre Rust e C com segurança?
3. Qual é o propósito de `#[repr(C)]`?
4. Como vincular uma biblioteca C em um projeto Rust?
5. Qual é a diferença entre ligação estática e dinâmica?
6. Como criar um wrapper seguro para uma função FFI insegura?
7. O que é `bindgen` e quando usá-lo?
8. Como funciona a propriedade de memória através de fronteiras FFI?
9. O que é um callback em contexto FFI e como é registrado?
10. Como impedir Rust de dropar dados que C ainda referencia?
