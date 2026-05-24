---
title: "FFI and C Interop"
description: "Call C from Rust with FFI, use extern blocks, manage memory across languages, and automate bindings with bindgen"
order: 6
duration: "90 minutes"
difficulty: advanced
---

# FFI and C Interop

Rust makes it easy to interoperate with C through a well-defined Foreign Function Interface (FFI). This enables using existing C libraries and exposing Rust code to other languages.

## The extern Keyword

```rust
// Declare external C functions
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
| ABI | When to Use |
|-----|-------------|
| `"C"` | C interop (most common) |
| `"stdcall"` | Windows API (32-bit) |
| `"rust"` | Default Rust ABI (unstable) |
| `"system"` | Platform default (C on Unix, stdcall on Win32) |

## Safe Wrapper Pattern

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_int;

// Unsafe FFI declaration
extern "C" {
    fn abs(x: c_int) -> c_int;
}

// Safe wrapper
fn safe_abs(x: i32) -> i32 {
    unsafe { abs(x) }
}

// String example
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
> `CString::new()` returns an error if the input contains a null byte. C strings are null-terminated, so interior nulls would truncate the string.

## Linking to C Libraries

### Static Linking

```rust
// Link to libm statically
#[link(name = "m", kind = "static")]
extern "C" {
    fn sqrt(x: f64) -> f64;
    fn pow(x: f64, y: f64) -> f64;
}
```

### Dynamic Linking

```rust
// Link to libm dynamically (default)
#[link(name = "m")]
extern "C" {
    fn sin(x: f64) -> f64;
    fn cos(x: f64) -> f64;
}
```

### Build Script

```rust
// build.rs — runs before cargo build
fn main() {
    // Link to a C library
    println!("cargo:rustc-link-search=/path/to/lib");
    println!("cargo:rustc-link-lib=my_c_lib");
    
    // Re-run if library source changes
    println!("cargo:rerun-if-changed=src/c_library.c");
    
    // Compile C code alongside Rust
    cc::Build::new()
        .file("src/c_helper.c")
        .compile("c_helper");
}
```

```toml
# Cargo.toml
[build-dependencies]
cc = "1.0"  # For compiling C code
```

## Memory Management Across FFI

### Ownership Rules

```rust
use std::ffi::CString;

extern "C" {
    // Returns an allocated string — Rust must free it
    fn get_message() -> *mut u8;
    
    // Takes ownership of allocated string
    fn free_message(ptr: *mut u8);
}

fn safe_get_message() -> String {
    let ptr = unsafe { get_message() };
    if ptr.is_null() {
        return String::new();
    }
    
    // Convert to Rust string
    let c_str = unsafe { CStr::from_ptr(ptr as *const i8) };
    let result = c_str.to_string_lossy().into_owned();
    
    // Free the C-allocated memory
    unsafe { free_message(ptr) };
    
    result
}
```

> [!SUCCESS]
| Source | Allocator | Must Free With |
|--------|-----------|----------------|
| Rust code | Rust allocator | Rust `drop` / dealloc |
| C library | `malloc` | `free` |
| Your C code | Must match | Free with matching allocator |

### Passing Rust Allocations to C

```rust
use std::mem;

extern "C" fn callback(data: *mut u8, len: usize) {
    // Called from C — we need to reconstruct a Rust slice
    let slice = unsafe { std::slice::from_raw_parts(data, len) };
    println!("C passed: {:?}", slice);
}

fn main() {
    let mut data = vec![1u8, 2, 3, 4];
    let ptr = data.as_mut_ptr();
    let len = data.len();
    
    // Prevent Rust from dropping the data while C uses it
    mem::forget(data); // DO NOT drop — C will free
    
    unsafe {
        callback(ptr, len);
    }
}
```

## Representing C Structs

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
    name: *const i8,  // C string
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
> `#[repr(C)]` guarantees C-compatible layout. Without it, Rust may reorder fields. Always use `#[repr(C)]` for FFI structs.

## Callbacks — Rust to C

```rust
// Define callback type
type Callback = unsafe extern "C" fn(i32) -> i32;

extern "C" {
    fn register_callback(cb: Option<Callback>);
    fn trigger_callback(x: i32) -> i32;
}

// Rust function that C can call
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

### Closure-Based Callbacks

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

## bindgen — Automatic Bindings

For large C headers, use `bindgen` to generate bindings automatically:

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

## Real-World: Using libcurl

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

## Practice Questions

1. What does `extern "C"` do in Rust?
2. How do you pass strings between Rust and C safely?
3. What's the purpose of `#[repr(C)]`?
4. How do you link a C library in a Rust project?
5. What's the difference between static and dynamic linking?
6. How do you safely wrap an unsafe FFI function?
7. What is `bindgen` and when would you use it?
8. How does memory ownership work across FFI boundaries?
9. What's a callback in FFI context and how is it registered?
10. How do you prevent Rust from dropping data that C still references?
