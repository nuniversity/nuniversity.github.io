---
title: "Compiled Programming Languages with Rust"
description: "Learn about compiled languages, memory safety, and systems programming using Rust"
order: 8
duration: "35 minutes"
difficulty: "intermediate"
---

# Compiled Programming Languages with Rust

JavaScript and Python are interpreted — an interpreter reads and executes your code line by line at runtime. Compiled languages like Rust work differently: a compiler translates your entire program into machine code before it runs.

## Interpreted vs Compiled

| Aspect | Interpreted (JS, Python) | Compiled (Rust, C, Go) |
|--------|--------------------------|------------------------|
| Execution | Read and run line by line | Translated to machine code first |
| Startup | Instant for small code | Slight delay during compilation |
| Performance | Slower at runtime | Faster execution |
| Error detection | Found at runtime | Many errors caught at compile time |
| Distribution | Need source code or runtime | Single binary executable |

## Hello World in Rust

```rust
fn main() {
    println!("Hello, World!");
}
```

- `fn` declares a function
- `main()` is the entry point of every Rust program
- `println!` is a macro (note the `!`) that prints to the console

## Rust's Type System

Rust is statically typed — the compiler knows the type of every variable:

```rust
fn main() {
    let age: i32 = 25;         // 32-bit integer
    let name: &str = "Alice";  // string slice
    let is_active: bool = true; // boolean
    let score: f64 = 95.5;     // 64-bit float
    
    println!("{} is {} years old", name, age);
}
```

Unlike JavaScript, Rust does not perform implicit type coercion.

## Variables and Mutability

Variables in Rust are **immutable by default**:

```rust
fn main() {
    let x = 5;
    // x = 6;  // Error: cannot assign twice to immutable variable
    
    let mut y = 10;  // `mut` makes it mutable
    y = 15;          // This is fine
    println!("y = {}", y);
}
```

This immutability-by-default is a deliberate design choice that prevents bugs.

## Ownership and Borrowing

Rust's most distinctive feature is its ownership system — it guarantees memory safety without a garbage collector.

### Ownership Rules

1. Each value has exactly one **owner**
2. When the owner goes out of scope, the value is dropped
3. A value can be **borrowed** without transferring ownership

```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);  // Borrow s1, don't take ownership
    println!("'{}' has length {}", s1, len);  // s1 is still usable
}

fn calculate_length(s: &String) -> usize {
    s.len()  // Return the length
}
```

The `&` symbol creates a **reference** — it borrows the value without taking ownership.

### Mutable References

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s);  // "hello, world"
}

fn change(s: &mut String) {
    s.push_str(", world");
}
```

> [!NOTE]
> Rust prevents data races at compile time: you can have either one mutable reference or any number of immutable references, but not both simultaneously.

## The match Expression

Rust's `match` is a powerful pattern-matching construct:

```rust
fn describe_number(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1..=9 => "small",
        10..=99 => "medium",
        _ => "large"  // default case
    }
}

fn main() {
    println!("{}", describe_number(42));   // "medium"
    println!("{}", describe_number(100));  // "large"
}
```

## Practice Exercise

Write a Rust program that checks if a number is even or odd:

```rust
fn is_even(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    let numbers = [1, 2, 3, 4, 5, 6];
    
    for num in numbers {
        if is_even(*num) {
            println!("{} is even", num);
        } else {
            println!("{} is odd", num);
        }
    }
}
```

## Summary

| Concept | Rust | JavaScript |
|---------|------|------------|
| Variable declaration | `let x = 5;` | `let x = 5;` |
| Mutable variable | `let mut x = 5;` | `let x = 5;` (all let are mutable) |
| Constant | `const X: i32 = 5;` | `const X = 5;` |
| Function | `fn add(a: i32) -> i32` | `function add(a) { return a; }` |
| Reference | `&x` | N/A (objects are reference types) |
| Pattern matching | `match x { ... }` | `switch (x) { ... }` |

## Next Steps

The next lesson introduces declarative programming — a different way of thinking where you describe what you want, not how to get it.
