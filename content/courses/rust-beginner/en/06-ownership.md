---
title: "Ownership"
description: "Master Rust's most unique feature: ownership rules, move semantics, the Copy trait, and Clone"
order: 6
duration: "35 minutes"
difficulty: "beginner"
---

# Ownership

Ownership is Rust's most distinctive feature. It enables memory safety without a garbage collector by enforcing strict rules at compile time.

## The Ownership Rules

1. **Each value has exactly one owner.**
2. **There can only be one owner at a time.**
3. **When the owner goes out of scope, the value is dropped.**

```rust
fn main() {
    {                           // s is not valid here
        let s = String::from("hello"); // s becomes valid
        // use s
    }                           // s goes out of scope, memory freed
}
```

> [!NOTE]
> When `s` goes out of scope, Rust calls `drop()` automatically — like C++ RAII but without the manual destructor management.

## Move Semantics

When you assign or pass a value, the ownership **moves**:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // s1 is MOVED to s2
    
    // println!("{s1}"); // ERROR: borrow of moved value
    println!("{s2}"); // OK: s2 owns the string
}
```

After the move, `s1` is **invalidated**. The compiler prevents use-after-move.

> [!SUCCESS]
> Moves are cheap — just copying a pointer, length, and capacity. No heap data is copied. The old owner is simply marked invalid at compile time.

### What Happens in Memory

```
Before move:
s1 -> { ptr: "hello", len: 5, cap: 5 }
         |
         v
      [h][e][l][l][o]  (heap)

After move:
s1 -> INVALID (compiler-enforced)
s2 -> { ptr: "hello", len: 5, cap: 5 }
         |
         v
      [h][e][l][l][o]  (same heap memory)
```

## Move in Functions

```rust
fn take_ownership(s: String) {  // s takes ownership
    println!("{s}");
}  // s dropped here, heap freed

fn make_copy(i: i32) {  // i is copied (Copy trait)
    println!("{i}");
}  // i goes out of scope, nothing special

fn main() {
    let s = String::from("hello");
    take_ownership(s);
    // println!("{s}"); // ERROR: moved
    
    let x = 42;
    make_copy(x);
    println!("{x}"); // OK: x is Copy
}
```

### Returning Ownership

```rust
fn give_ownership() -> String {
    let s = String::from("hello");
    s  // Ownership moves to caller
}

fn take_and_give(s: String) -> String {
    s  // Ownership moves out again
}

fn main() {
    let s1 = give_ownership();
    let s2 = take_and_give(s1);
    // s1 is now invalid
    println!("{s2}");
}
```

## The Copy Trait

Simple types stored entirely on the stack implement `Copy`. Assignment **copies** instead of moving:

```rust
fn main() {
    // Copy types: assignment = copy
    let x = 5;
    let y = x;  // x is still valid — i32 is Copy
    println!("{x} {y}"); // Both work
    
    let a = true;
    let b = a;  // bool is Copy
    println!("{a} {b}"); // Both work
}
```

### Types That Are Copy

| Type | Examples |
|------|----------|
| Integers | `i32`, `u64`, `i8`, etc. |
| Floats | `f32`, `f64` |
| Boolean | `bool` |
| Character | `char` |
| Tuples of Copy | `(i32, i32)`, `(bool, char)` |
| References | `&T`, `&mut T` (always Copy) |

### Types That Are NOT Copy

| Type | Reason |
|------|--------|
| `String` | Owns heap memory |
| `Vec<T>` | Owns heap memory |
| `&mut T` | Unique access (moved, not Copy) |
| `Box<T>` | Owns heap memory |

> [!WARNING]
> If a type or any of its fields implements `Drop`, it cannot implement `Copy`. This prevents double-free errors.

## Clone — Explicit Deep Copy

When you want a deep copy of heap data, call `.clone()`:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();  // Deep copy: heap data is duplicated
    
    println!("s1: {s1}"); // Still valid
    println!("s2: {s2}"); // Separate copy
    
    // With Copy types, clone isn't needed
    let x = 5;
    let y = x.clone(); // Works, but redundant for Copy types
}
```

> [!NOTE]
| Operation | Stack Data | Heap Data | Cost |
|-----------|------------|-----------|------|
| Move | Copied | Not copied (owner changes) | Pointer size |
| Clone | Copied | Deep copied | Heap allocation + copy |
| Copy | Copied | N/A (no heap data) | Trivial |

## Ownership and Scope

```rust
fn main() {
    let s = String::from("outside");
    {
        let inner = String::from("inside");
        println!("{inner}"); // OK
    }
    // inner was dropped here
    
    println!("{s}"); // OK
    // s is dropped here
}
```

### Drop Order

Variables are dropped in **reverse declaration order**:

```rust
fn main() {
    let a = String::from("a");
    let b = String::from("b");
    // b dropped first, then a
}
```

## Partial Moves

Structs can be partially moved out of:

```rust
struct Person {
    name: String,
    age: u8,
}

fn main() {
    let person = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let name = person.name; // Move name out
    // println!("{}", person.name); // ERROR: partially moved
    println!("{}", person.age); // OK: age is Copy, still accessible
}
```

## Ownership in Practice

```rust
// Bad: ownership moved in, but we want to use it after
fn bad_length(s: String) -> usize {
    s.len()
} // s dropped

// Good: return ownership
fn ok_length(s: String) -> (String, usize) {
    let len = s.len();
    (s, len)
}

// Best: borrow instead of taking ownership (next lesson)
fn best_length(s: &String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hello");
    let len = bad_length(s);
    // println!("{s}"); // ERROR
    
    let s = String::from("hello");
    let (s, len) = ok_length(s);
    println!("{s} is {len} chars"); // OK
    
    let s = String::from("hello");
    let len = best_length(&s);
    println!("{s} is {len} chars"); // OK
}
```

## Ownership with Custom Types

```rust
#[derive(Debug)]
struct File {
    name: String,
    data: Vec<u8>,
}

fn main() {
    let file = File {
        name: String::from("data.txt"),
        data: vec![1, 2, 3],
    };
    
    let file2 = file; // Move! File is NOT Copy
    // println!("{:?}", file); // ERROR
    
    // Use clone if you want both
    let file3 = file2.clone();
    println!("{:?}", file2);
    println!("{:?}", file3);
}
```

> [!SUCCESS]
> Ownership is the foundation of Rust's safety guarantees. Once it clicks, you'll understand how Rust eliminates whole categories of bugs (use-after-free, double-free, dangling pointers) at compile time.

## Practice Questions

1. What are the three ownership rules?
2. What happens to memory when the owner goes out of scope?
3. What's the difference between move and copy?
4. Which types implement the `Copy` trait?
5. What does `.clone()` do?
6. Why can't a type with `Drop` implement `Copy`?
7. What happens if you try to use a value after moving it?
8. What determines the order in which variables are dropped?
9. What is a partial move?
10. How do you return ownership from a function while also returning computed data?
