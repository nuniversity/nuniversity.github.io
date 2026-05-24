---
title: "Closures"
description: "Master closures in Rust: syntax, capturing modes (Fn, FnMut, FnOnce), move semantics, and patterns"
order: 9
duration: "45 minutes"
difficulty: "intermediate"
---

# Closures

Closures are anonymous functions that can capture variables from their environment. Rust's closure system is flexible and efficient — closures compile down to plain structs.

## Closure Syntax

```rust
fn main() {
    // Full syntax
    let add_one = |x: i32| -> i32 { x + 1 };
    
    // Type inference
    let add_two = |x| x + 2;
    
    // Block body
    let complex = |x: i32| {
        let y = x * 2;
        y + 1
    };
    
    // No parameters
    let hello = || println!("hello");
    
    // Multiple parameters
    let add = |a: i32, b: i32| a + b;
    
    println!("{}", add_one(5));  // 6
    println!("{}", add_two(5));  // 7
}
```

> [!NOTE]
| Pattern | Syntax | Example |
|---------|--------|---------|
| No params | `|| expr` | `|| 42` |
| One param | `|x| expr` | `|x| x + 1` |
| Typed params | `|x: i32| -> i32` | `|x: i32| -> i32 { x + 1 }` |
| Block body | `\|x\| { stmt; expr }` | `|x| { let y = x; y }` |

## Capturing Modes

Closures capture variables from their enclosing scope. The compiler chooses the least restrictive capture mode:

### FnOnce — Consumes captured values

```rust
fn main() {
    let s = String::from("hello");
    
    let consume = || {
        drop(s);  // s is moved into closure
    };
    
    consume();
    // consume(); // ERROR: closure can't be called twice
    // println!("{s}"); // ERROR: s was moved
}
```

> [!WARNING]
> `FnOnce` closures can only be called once because they consume captured values. They implement `FnOnce` but not `Fn` or `FnMut`.

### FnMut — Mutably borrows

```rust
fn main() {
    let mut count = 0;
    
    let mut increment = || {
        count += 1;  // Mutably borrows count
    };
    
    increment();
    increment();
    println!("{count}"); // 2
    
    // let shared = &count; // ERROR: can't borrow while mutably borrowed
    // increment(); // Would work if shared not used
}
```

### Fn — Immutably borrows

```rust
fn main() {
    let prefix = String::from("Hello, ");
    
    let greet = |name: &str| {
        println!("{prefix}{name}");  // Immutably borrows prefix
    };
    
    greet("Alice");
    greet("Bob");
    println!("prefix: {prefix}"); // Still accessible
}
```

| Trait | Capture | Callable | Used For |
|-------|---------|----------|----------|
| `Fn` | By reference | Multiple times | Read-only access |
| `FnMut` | By mutable ref | Multiple times | State mutation |
| `FnOnce` | By value (move) | Once | Consuming values |

> [!SUCCESS]
> Closures try to capture by the least restrictive mode. If a closure only reads, it's `Fn`. If it writes, it's `FnMut`. If it moves out, it's `FnOnce`.

## The move Keyword

Forces the closure to take ownership of captured variables:

```rust
fn main() {
    let data = vec![1, 2, 3];
    
    // Without move: closure borrows data
    let borrow = || println!("{:?}", data);
    
    // With move: closure takes ownership
    let owned = move || println!("{:?}", data);
    // println!("{:?}", data); // ERROR: data moved
    
    // Necessary for spawning threads
    let nums = vec![1, 2, 3];
    std::thread::spawn(move || {
        println!("{:?}", nums); // nums moved to thread
    }).join().unwrap();
}
```

### When move is Required

```rust
use std::thread;

fn main() {
    let message = String::from("hello from thread");
    
    // ERROR: closure may outlive the current function
    // thread::spawn(|| {
    //     println!("{message}");
    // });
    
    // Fix: move ownership to the closure
    thread::spawn(move || {
        println!("{message}");
    }).join().unwrap();
}
```

## Closures as Arguments

```rust
// Function taking a closure
fn apply<F>(f: F, x: i32) -> i32
where
    F: Fn(i32) -> i32,
{
    f(x)
}

// With FnMut
fn apply_mut<F>(mut f: F, x: i32) -> i32
where
    F: FnMut(i32) -> i32,
{
    f(x)
}

// With FnOnce
fn apply_once<F>(f: F, x: i32) -> i32
where
    F: FnOnce(i32) -> i32,
{
    f(x)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5)); // 10
    
    let mut total = 0;
    let add_to_total = |x| { total += x; total };
    println!("{}", apply_mut(add_to_total, 5)); // 5
}
```

## Closures as Return Values

```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y  // Must capture by value
}

fn make_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || { count += 1; count }
}

fn main() {
    let add_five = make_adder(5);
    println!("{}", add_five(3)); // 8
    
    let mut counter = make_counter();
    println!("{}", counter()); // 1
    println!("{}", counter()); // 2
}
```

> [!WARNING]
> When returning closures, use `move` to capture by value. Otherwise the closure borrows local variables that go out of scope.

## Closures and Iterators

Closures are the foundation of iterator adapters:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // Closure in map
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // Closure in filter
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    
    // Closure with captured variable
    let threshold = 3;
    let above: Vec<&i32> = numbers.iter().filter(|x| **x > threshold).collect();
    
    // Closure in fold
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    
    println!("{doubled:?} {evens:?} {above:?} {sum}");
}
```

## Comparing Closures and Functions

```rust
fn add_one(x: i32) -> i32 { x + 1 }

fn main() {
    let closure = |x| x + 1;
    let closure_annotated = |x: i32| -> i32 { x + 1 };
    
    // Functions coerce to closures
    let mapped: Vec<i32> = vec![1, 2, 3].iter().map(add_one).collect();
    let mapped2: Vec<i32> = vec![1, 2, 3].iter().map(|x| x + 1).collect();
    
    // Function pointers
    let fp: fn(i32) -> i32 = add_one;
    let fp_caller: fn(i32) -> i32 = |x| x + 1; // Doesn't capture
    
    // Closure with capture — NOT a function pointer
    let y = 5;
    let captures = |x| x + y; // Can't coerce to fn pointer
}
```

| Type | Captures? | Size | Use Case |
|------|-----------|------|----------|
| `fn(i32) -> i32` | No | Pointer | Callback APIs |
| `impl Fn(i32) -> i32` | Yes | Closure size | Generic functions |
| `Box<dyn Fn(i32) -> i32>` | Yes | Heap-allocated | Dynamic dispatch |

## Real-World: Configuration Builder

```rust
struct Config {
    transformers: Vec<Box<dyn Fn(String) -> String>>,
}

impl Config {
    fn new() -> Self {
        Config { transformers: Vec::new() }
    }
    
    fn add<F>(&mut self, f: F)
    where
        F: Fn(String) -> String + 'static,
    {
        self.transformers.push(Box::new(f));
    }
    
    fn process(&self, input: String) -> String {
        self.transformers.iter().fold(input, |acc, f| f(acc))
    }
}

fn main() {
    let mut config = Config::new();
    
    let prefix = "LOG: ".to_string();
    config.add(move |s| format!("{prefix}{s}"));
    config.add(|s| s.to_uppercase());
    config.add(|s| s.trim().to_string());
    
    let result = config.process("  hello world  ".to_string());
    println!("{result}"); // "LOG:   HELLO WORLD  "
}
```

## Practice Questions

1. What are the three closure traits in Rust?
2. How does the compiler decide which trait a closure implements?
3. What does the `move` keyword do for closures?
4. When is `move` required on a closure?
5. How do you accept a closure as a function parameter?
6. How do you return a closure from a function?
7. What's the difference between `fn` (function pointer) and `Fn` (closure trait)?
8. Why can't closures that capture variables coerce to function pointers?
9. What happens if you call a FnOnce closure twice?
10. How do closures work with iterator adapters like `map` and `filter`?
