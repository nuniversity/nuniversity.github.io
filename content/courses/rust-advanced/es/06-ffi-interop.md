---
title: "FFI e Interoperabilidad con C"
description: "Llame a C desde Rust con FFI, use bloques extern, administre memoria entre lenguajes y automatice bindings con bindgen"
order: 6
duration: "90 minutos"
difficulty: advanced
---

# FFI e Interoperabilidad con C

Rust hace fácil interoperar con C a través de una Interfaz de Función Extranjera (FFI) bien definida. Esto permite usar bibliotecas C existentes y exponer código Rust a otros lenguajes.

## La Palabra clave extern

```rust
// Declarar funciones C externas
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
| ABI | Cuándo Usar |
|-----|-------------|
| `"C"` | Interoperabilidad con C (más común) |
| `"stdcall"` | API de Windows (32-bit) |
| `"rust"` | ABI por defecto de Rust (inestable) |
| `"system"` | Por defecto de la plataforma (C en Unix, stdcall en Win32) |

## Patrón de Wrapper Seguro

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_int;

// Declaración FFI insegura
extern "C" {
    fn abs(x: c_int) -> c_int;
}

// Wrapper seguro
fn safe_abs(x: i32) -> i32 {
    unsafe { abs(x) }
}

// Ejemplo con string
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
> `CString::new()` retorna un error si la entrada contiene un byte nulo. Las strings C están terminadas en nulo, así que los nulls internos truncarían la string.

## Vinculando a Bibliotecas C

### Enlace Estático

```rust
// Enlazar a libm estáticamente
#[link(name = "m", kind = "static")]
extern "C" {
    fn sqrt(x: f64) -> f64;
    fn pow(x: f64, y: f64) -> f64;
}
```

### Enlace Dinámico

```rust
// Enlazar a libm dinámicamente (por defecto)
#[link(name = "m")]
extern "C" {
    fn sin(x: f64) -> f64;
    fn cos(x: f64) -> f64;
}
```

### Script de Build

```rust
// build.rs — se ejecuta antes de cargo build
fn main() {
    // Enlazar a una biblioteca C
    println!("cargo:rustc-link-search=/path/to/lib");
    println!("cargo:rustc-link-lib=my_c_lib");
    
    // Re-ejecutar si el código fuente de la biblioteca cambia
    println!("cargo:rerun-if-changed=src/c_library.c");
    
    // Compilar código C junto con Rust
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

## Gestión de Memoria entre FFI

### Reglas de Propiedad

```rust
use std::ffi::CString;

extern "C" {
    // Retorna una string asignada — Rust debe liberarla
    fn get_message() -> *mut u8;
    
    // Toma propiedad de la string asignada
    fn free_message(ptr: *mut u8);
}

fn safe_get_message() -> String {
    let ptr = unsafe { get_message() };
    if ptr.is_null() {
        return String::new();
    }
    
    // Convertir a string Rust
    let c_str = unsafe { CStr::from_ptr(ptr as *const i8) };
    let result = c_str.to_string_lossy().into_owned();
    
    // Liberar la memoria asignada por C
    unsafe { free_message(ptr) };
    
    result
}
```

> [!SUCCESS]
| Origen | Asignador | Debe Liberar Con |
|--------|-----------|----------------|
| Código Rust | Asignador Rust | `drop` / dealloc de Rust |
| Biblioteca C | `malloc` | `free` |
| Tu código C | Debe coincidir | Libera con el asignador correspondiente |

### Pasando Asignaciones Rust a C

```rust
use std::mem;

extern "C" fn callback(data: *mut u8, len: usize) {
    // Llamado desde C — necesitamos reconstruir un slice Rust
    let slice = unsafe { std::slice::from_raw_parts(data, len) };
    println!("C passed: {:?}", slice);
}

fn main() {
    let mut data = vec![1u8, 2, 3, 4];
    let ptr = data.as_mut_ptr();
    let len = data.len();
    
    // Evitar que Rust dropee los datos mientras C los usa
    mem::forget(data); // NO dropear — C liberará
    
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
> `#[repr(C)]` garantiza diseño compatible con C. Sin él, Rust puede reordenar campos. Siempre usa `#[repr(C)]` para structs FFI.

## Callbacks — Rust a C

```rust
// Definir tipo de callback
type Callback = unsafe extern "C" fn(i32) -> i32;

extern "C" {
    fn register_callback(cb: Option<Callback>);
    fn trigger_callback(x: i32) -> i32;
}

// Función Rust que C puede llamar
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

### Callbacks Basadas en Closure

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

Para cabeceras C grandes, usa `bindgen` para generar bindings automáticamente:

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

## Ejemplo Real: Usando libcurl

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

## Preguntas de Práctica

1. ¿Qué hace `extern "C"` en Rust?
2. ¿Cómo pasar strings entre Rust y C de forma segura?
3. ¿Cuál es el propósito de `#[repr(C)]`?
4. ¿Cómo enlazar una biblioteca C en un proyecto Rust?
5. ¿Cuál es la diferencia entre enlace estático y dinámico?
6. ¿Cómo crear un wrapper seguro para una función FFI insegura?
7. ¿Qué es `bindgen` y cuándo usarlo?
8. ¿Cómo funciona la propiedad de memoria a través de fronteras FFI?
9. ¿Qué es un callback en contexto FFI y cómo se registra?
10. ¿Cómo evitar que Rust dropee datos que C todavía referencia?
