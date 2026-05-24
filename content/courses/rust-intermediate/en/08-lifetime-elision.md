---
title: "Lifetime Elision and Advanced Lifetime Patterns"
description: "Master lifetime elision rules, input/output lifetime patterns, lifetime bounds, and variance"
order: 8
duration: "45 minutes"
difficulty: "intermediate"
---

# Lifetime Elision and Advanced Lifetime Patterns

Rust's lifetime elision rules make most lifetime annotations unnecessary. Understanding exactly when and how elision works is key to writing ergonomic Rust.

## The Three Elision Rules

The compiler applies these rules automatically:

### Rule 1 — Input Lifetimes

Each elided reference in function parameters gets a **distinct** lifetime:

```rust
// fn foo(x: &i32, y: &str)
// becomes:
fn foo<'a, 'b>(x: &'a i32, y: &'b str) {}
```

### Rule 2 — Single Input Lifetime

If there's exactly one input lifetime, it's assigned to all output references:

```rust
// fn first_word(s: &str) -> &str
// becomes:
fn first_word<'a>(s: &'a str) -> &'a str { unimplemented!() }
```

### Rule 3 — Method Receiver

If there's `&self` or `&mut self`, its lifetime is assigned to all output references:

```rust
impl Widget {
    // fn get_name(&self) -> &str
    // becomes:
    fn get_name<'a>(&'a self) -> &'a str { unimplemented!() }
}
```

> [!NOTE]
> Rule 2 and 3 only apply when there are **no explicit output lifetimes**. If you write a lifetime on the output, the rules don't apply.

## Input vs Output Lifetimes

### Input Lifetimes

Lifetimes on function parameters:

```rust
// 'a and 'b are input lifetimes
fn process<'a, 'b>(x: &'a str, y: &'b str) {}
```

### Output Lifetimes

Lifetimes on return values:

```rust
// 'a is an output lifetime (on the return type)
fn select<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### Lifetimes in Return Position Only

```rust
// Lifetime on return only — rare and usually wrong
// fn foo() -> &'static str { "static" }  // OK — 'static works
// fn bar() -> &i32 { /* where does it point? */ }  // Error
```

## Elision in Method Signatures

```rust
struct Container<'a> {
    data: &'a str,
}

impl<'a> Container<'a> {
    // Elided: &self → output
    fn get_data(&self) -> &str {
        // Expanded: fn get_data<'b>(&'b self) -> &'b str
        self.data
    }
    
    // Two input refs → no auto-output elision
    // fn longer(&self, other: &str) -> &str {
    // Expanded: fn longer<'b, 'c>(&'b self, other: &'c str) -> &'b str
    fn longer<'b>(&'b self, other: &'b str) -> &'b str {
        if self.data.len() > other.len() {
            self.data
        } else {
            other
        }
    }
}
```

## Lifetime Elision and Generics

```rust
use std::fmt::Display;

// Elision works with generics
fn announce_and_return<'a>(announcement: &str, x: &'a str) -> &'a str {
    println!("{announcement}");
    x
}

// With trait bounds
fn longest_with_display<'a, T: Display + ?Sized>(
    x: &'a T,
    y: &'a T,
) -> &'a T
where
    T: PartialOrd,
{
    if x > y { x } else { y }
}
```

## Lifetime Bounds on Generic Types

```rust
// T must outlive 'a
struct Wrapper<'a, T: 'a> {
    value: &'a T,
}

// T must be 'static (no non-static references)
fn process_static<T: 'static>(value: T) {
    std::mem::drop(value);
}

// Higher-ranked trait bounds: for any lifetime
fn with_hrtb<F>(f: F)
where
    F: for<'a> Fn(&'a str) -> &'a str,
{
    println!("{}", f("hello"));
}
```

> [!SUCCESS]
| Bound | Meaning |
|-------|---------|
| `T: 'a` | T outlives 'a |
| `T: 'static` | T has no non-'static references |
| `for<'a> F: Fn(&'a str)` | F works for any lifetime |

## Lifetime Subtyping (Variance)

Lifetimes can be in subtyping relationships:

```rust
// Covariant: &'a T is a subtype of &'b T if 'a: 'b
// Invariant: &'a mut T — must be exact
// Contravariant: fn(T) — reverse

struct Covariant<'a>(&'a str);     // Covariant in 'a
struct Invariant<'a>(Cell<&'a str>); // Invariant in 'a

fn main() {
    let long = String::from("long lived");
    let short = String::from("short");
    
    let cov: Covariant = Covariant(&long);
    // Can assign to shorter lifetime:
    let _: Covariant<'_> = cov; // OK: covariant
    
    // Invariant would fail:
    // let inv: Invariant = Invariant(Cell::new(&long));
    // let _: Invariant<'_> = inv; // ERROR: invariant
}
```

## Lifetime Capture

```rust
// The impl Trait captures lifetimes from the function
fn make_debug<'a>(x: &'a str) -> impl std::fmt::Debug + 'a {
    x
}

// Multiple lifetimes in impl Trait
fn make_cloneable<'a, 'b>(x: &'a str, y: &'b str) -> impl Clone + 'a + 'b {
    (x, y)
}
```

## Common Elision Patterns

```rust
// Pattern 1: Reader
fn read(&self) -> &str { /* elided to &self lifetime */ }

// Pattern 2: Predicate
fn contains(&self, other: &str) -> bool { /* no output refs */ }

// Pattern 3: Factory
fn new(value: &str) -> Self { /* elided by rule 2 */ }

// Pattern 4: Multiple returns
fn parts(&self) -> (&str, &str) { /* all get &self lifetime */ }
```

## The Anonymous Lifetime

Use `'_` to explicitly indicate elided lifetime:

```rust
struct Foo<'a> {
    x: &'a str,
}

impl Foo<'_> {  // '_ means the elided lifetime from impl
    fn get(&self) -> &str { self.x }
}

// In function signatures
fn foo(x: &'_ str) -> &'_ str { x }
```

## Real-World: Lifetimes in a Cache

```rust
use std::collections::HashMap;

struct Index<'a> {
    data: &'a str,
    positions: HashMap<&'a str, usize>,
}

impl<'a> Index<'a> {
    fn new(data: &'a str) -> Self {
        let mut positions = HashMap::new();
        for (i, line) in data.lines().enumerate() {
            for word in line.split_whitespace() {
                positions.entry(word).or_insert(i);
            }
        }
        Index { data, positions }
    }
    
    fn find(&self, word: &str) -> Option<&'a str> {
        // No explicit lifetime needed — elision works
        self.positions.get(word).map(|&line| {
            self.data.lines().nth(line).unwrap_or("")
        })
    }
}

fn main() {
    let text = String::from("apple banana\ncherry date");
    let index = Index::new(&text);
    
    if let Some(line) = index.find("cherry") {
        println!("Found: {line}"); // "cherry date"
    }
}
```

## Practice Questions

1. What are the three lifetime elision rules?
2. When does Rule 2 NOT apply?
3. What's the difference between input and output lifetimes?
4. How are lifetimes elided in method signatures?
5. What does `T: 'static` mean as a bound?
6. What's a higher-ranked trait bound (HRTB)?
7. What's the difference between covariance and invariance for lifetimes?
8. What does the `'_` lifetime mean?
9. Why can't lifetimes be elided in `fn longest(x: &str, y: &str) -> &str`?
10. How do you express "this function works for any lifetime" with a bounds?
