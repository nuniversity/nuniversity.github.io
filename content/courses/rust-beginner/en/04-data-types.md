---
title: "Data Types"
description: "Master Rust's scalar types, compound types, type inference, and explicit type annotations"
order: 4
duration: "30 minutes"
difficulty: "beginner"
---

# Data Types

Rust is a **statically typed** language — every variable must have a known type at compile time. The compiler is smart about inferring types, but you can always annotate them explicitly.

## Two Categories of Types

| Category | Description | Examples |
|----------|-------------|----------|
| **Scalar** | Single value | integers, floats, bool, char |
| **Compound** | Group of values | tuples, arrays, structs, enums |

## Scalar Types

### Integer Types

Rust offers signed (`i`) and unsigned (`u`) integers in various sizes:

| Size | Signed | Unsigned | Range (signed) |
|------|--------|----------|----------------|
| 8-bit | `i8` | `u8` | -128 to 127 |
| 16-bit | `i16` | `u16` | -32,768 to 32,767 |
| 32-bit | `i32` | `u32` | -2³¹ to 2³¹ -1 |
| 64-bit | `i64` | `u64` | -2⁶³ to 2⁶³ -1 |
| 128-bit | `i128` | `u128` | -2¹²⁷ to 2¹²⁷ -1 |
| arch | `isize` | `usize` | depends on platform (32/64-bit) |

```rust
fn main() {
    let a = 42;        // i32 (default)
    let b: u8 = 255;   // Explicit unsigned byte
    let c = 100_000;   // Underscore separators for readability
    let d = 0xff;      // Hexadecimal
    let e = 0o77;      // Octal
    let f = 0b1111;    // Binary
    let g = b'A';      // Byte literal (u8, ASCII)
    
    // usize/isize for indexing collections
    let arr = [1, 2, 3];
    let index: usize = 1;
    println!("{0}", &arr[index]); // 2
}
```

> [!NOTE]
> `i32` is the default integer type because it's fast on modern CPUs and avoids overflow issues common with smaller types.

### Integer Overflow

```rust
fn main() {
    let mut x: u8 = 255;
    // x = x + 1; // PANICS in debug mode (overflow check)
    
    // Explicit wrapping:
    let y = x.wrapping_add(1); // 0 (wraps around)
    let z = x.saturating_add(1); // 255 (saturates at max)
    println!("wrapping: {y}, saturating: {z}");
}
```

| Method | Behavior |
|--------|----------|
| `wrapping_add` | Wraps around (two's complement) |
| `saturating_add` | Stops at min/max value |
| `overflowing_add` | Returns (result, overflowed bool) |
| `checked_add` | Returns `Option` (None on overflow) |

> [!WARNING]
> In debug mode, integer overflow panics. In release mode, it wraps silently. Never rely on overflow behavior — use explicit methods.

### Floating-Point Types

```rust
fn main() {
    let x = 2.0;       // f64 (default, double precision)
    let y: f32 = 3.0;  // f32 (single precision)
    
    // f64 operations
    let squared = x.powi(2);      // 4.0
    let sqrt = x.sqrt();          // 1.414...
    let remainder = 5.0 % 2.0;   // 1.0
}
```

| Type | Precision | Size | Use Case |
|------|-----------|------|----------|
| `f32` | ~7 decimal digits | 4 bytes | Graphics, GPUs |
| `f64` | ~15 decimal digits | 8 bytes | General computation |

> [!WARNING]
> Floats do not implement `Eq` or `Ord` — NaN and precision issues make comparison unreliable. Use `f64::EPSILON` for approximate comparison:
> ```rust
> fn approx_eq(a: f64, b: f64) -> bool {
>     (a - b).abs() < f64::EPSILON
> }
> ```

### The Boolean Type

```rust
fn main() {
    let is_rust_fun = true;
    let is_hard: bool = false;
    
    if is_rust_fun {
        println!("Rust is fun!");
    }
    
    // Conversion to integer
    println!("{}", true as u8); // 1
    println!("{}", false as u8); // 0
}
```

### The Character Type

`char` is 4 bytes and represents a Unicode Scalar Value:

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ';
    let heart_eyed_cat = '😻';
    
    println!("{c} {z} {heart_eyed_cat}");
    
    // char as number
    println!("{}", 'A' as u8); // 65
    println!("{}", '😻' as u32); // 128571
}
```

> [!NOTE]
> `char` is 4 bytes (not 1 like C char). It supports full Unicode but is not ASCII — use `u8` or `&[u8]` for byte-level data.

## Compound Types

### Tuples

Tuples group values of **different types**. Fixed length, known at compile time.

```rust
fn main() {
    let tup: (i32, f64, char) = (500, 6.4, 'x');
    
    // Destructuring
    let (x, y, z) = tup;
    println!("{x}, {y}, {z}");
    
    // Dot notation (0-indexed)
    println!("{}", tup.0); // 500
    println!("{}", tup.1); // 6.4
    
    // Unit tuple (empty tuple)
    let unit: () = ();
}
```

| Pattern | Example | When to Use |
|---------|---------|-------------|
| Destructure | `let (a, b) = tup` | Extract all values |
| Dot access | `tup.0` | Extract one value |
| Ignore | `let (a, _, _) = tup` | Extract some values |

### Arrays

Arrays are **fixed length**, all elements **same type**, stored on **stack**:

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    
    // Type annotation: [type; length]
    let typed: [i32; 5] = [1, 2, 3, 4, 5];
    
    // Repeat expression: [value; count]
    let zeros = [0; 10];      // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    
    // Access
    let first = arr[0];
    let second = arr[1];
    
    // Bounds-checked at runtime
    // let oops = arr[10]; // Panics: index out of bounds
}
```

| Feature | Array | Tuple |
|---------|-------|-------|
| Same type? | Yes | No |
| Fixed length? | Yes | Yes |
| Default type | `[T; N]` | `(T1, T2, ...)` |
| Access | `arr[i]` (runtime-checked) | `tup.i` (compile-time) |

### Vectors (Preview)

Vectors are heap-allocated, growable arrays:

```rust
fn main() {
    let mut vec = vec![1, 2, 3];
    vec.push(4);  // Now [1, 2, 3, 4]
    println!("{vec:?}");
}
```

## Type Inference and Annotations

Rust infers types in most situations:

```rust
fn main() {
    // Inference works
    let x = 42;        // i32
    let y = 3.14;      // f64
    let cond = true;   // bool
    
    // Annotations clarify intent
    let port: u16 = 8080;
    let pi: f32 = 3.14159;
    
    // Sometimes required (type ambiguity)
    let ambiguous = "hello".parse(); // ERROR: can't infer type
    let parsed: u32 = "42".parse().unwrap(); // OK with annotation
    
    // Turbofish syntax
    let n = "100".parse::<i32>().unwrap();
}
```

> [!SUCCESS]
| Situation | Example |
|-----------|---------|
| `parse()` needs annotation | `"42".parse::<i32>()` or `let x: i32 = "42".parse()?` |
| Integer default | `let x = 42` → `i32` |
| Float default | `let x = 3.14` → `f64` |
| Collection generic | `Vec::new()` needs type context |

## Type Aliases

```rust
type Kilometers = i32;
type Thunk = Box<dyn FnOnce() + Send>;

fn main() {
    let distance: Kilometers = 100;
    println!("{distance} km");
}
```

## Sized and Unsized Types

| Category | Examples | Size at Compile Time? |
|----------|----------|----------------------|
| Sized | `i32`, `f64`, `[i32; 5]`, `String` | Yes |
| Unsized | `str`, `[i32]`, `dyn Trait` | No (behind pointer) |

Unsized types must always be behind a pointer: `&str`, `Box<dyn Trait>`.

## Practice Questions

1. What is the default integer type in Rust? What about float?
2. How many bytes is a `char` in Rust? How is this different from C?
3. What's the difference between a tuple and an array?
4. Why can't you compare two `f64` values with `==` directly?
5. What happens if you access an array index out of bounds?
6. When must you annotate a variable's type explicitly?
7. What is the unit type `()` used for?
8. How do you parse a string into an integer?
9. What's the difference between `usize` and `u64`?
10. What methods can you use to handle integer overflow safely?
