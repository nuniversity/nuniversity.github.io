---
title: "Generics"
description: "Write reusable, type-safe code with generic functions, structs, enums, constraints, and the turbofish syntax"
order: 4
duration: "45 minutes"
difficulty: "intermediate"
---

# Generics

Generics allow you to write code that works with multiple types while maintaining Rust's strong type safety. They're the foundation of Rust's standard library and ecosystem.

## Generic Functions

```rust
// Works with any type T
fn identity<T>(value: T) -> T {
    value
}

fn main() {
    let x = identity(42);
    let y = identity("hello");
    let z = identity(vec![1, 2, 3]);
}
```

### Multiple Type Parameters

```rust
fn swap<A, B>(pair: (A, B)) -> (B, A) {
    (pair.1, pair.0)
}

fn main() {
    let result = swap((1, "hello"));
    println!("{:?}", result); // ("hello", 1)
}
```

> [!NOTE]
> Generic type parameters are conventionally single uppercase letters: `T` (type), `E` (error), `K` (key), `V` (value), `N` (number), `A, B` (generic ordering).

## Generic Structs

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    
    // Both fields must be same type T
    // let mixed = Point { x: 5, y: 4.0 }; // ERROR: mismatched types
}
```

### Multiple Type Parameters in Structs

```rust
struct Pair<A, B> {
    first: A,
    second: B,
}

fn main() {
    let mixed = Pair { first: 42, second: "hello" };
}
```

## Generic Enums

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}

enum Either<L, R> {
    Left(L),
    Right(R),
}
```

## Generic Methods

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
    
    fn new(x: T, y: T) -> Point<T> {
        Point { x, y }
    }
}

// Method only available for specific type
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let p = Point::new(3, 4);
    println!("x: {}", p.x());
    
    let f = Point::new(3.0, 4.0);
    println!("distance: {}", f.distance_from_origin());
}
```

> [!SUCCESS]
> `impl<T>` makes the implementation generic over T. Without `<T>`, you're implementing for a concrete `Point<SomeType>`.

## Generic Constraints (Trait Bounds)

```rust
use std::fmt::Display;

// T must implement Display
fn print_value<T: Display>(value: T) {
    println!("{value}");
}

// Multiple bounds
fn compare_and_print<T: Display + PartialOrd>(a: T, b: T) {
    println!("{a} vs {b}");
    if a > b {
        println!("first wins");
    } else if a < b {
        println!("second wins");
    } else {
        println!("tie");
    }
}
```

### Where Clauses

Cleaner syntax for complex bounds:

```rust
use std::fmt::Display;

// Without where
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 { 0 }

// With where — more readable
fn some_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{ 0 }
```

## The Turbofish Syntax

When Rust can't infer generic types, use `::<>` (turbofish):

```rust
fn main() {
    // Parse needs explicit type
    let n = "42".parse::<i32>().unwrap();
    
    // Collect needs type hint
    let nums: Vec<i32> = (0..10).collect();
    // Or turbofish:
    let nums = (0..10).collect::<Vec<i32>>();
    
    // Generic function call
    let x = identity::<i32>(42);
}
```

> [!WARNING]
> Turbofish is needed when the compiler can't infer a generic type. If you see "type annotations needed", add a turbofish or type annotation.

## Const Generics

Rust supports compile-time constant generics for array sizes and values:

```rust
// Const generic: N is a compile-time constant
fn array_sum<T, const N: usize>(arr: &[T; N]) -> &T
where
    T: std::ops::Add<Output = T> + Default + Copy,
{
    let mut sum = T::default();
    for item in arr {
        sum = sum + *item;
    }
    &sum // simplified; actually returns &T
}

fn main() {
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let sum = array_sum(&arr);
    
    // const N is inferred: N = 5
}
```

### Useful Const Generic Patterns

```rust
struct Matrix<T, const ROWS: usize, const COLS: usize> {
    data: [[T; COLS]; ROWS],
}

impl<T: Default + Copy, const R: usize, const C: usize> Matrix<T, R, C> {
    fn new() -> Self {
        Matrix { data: [[T::default(); C]; R] }
    }
}

fn main() {
    let m: Matrix<i32, 3, 4> = Matrix::new();
    println!("{}x{} matrix", ROWS, COLS); // won't compile directly
}
```

## Generic Type Inference

```rust
use std::collections::HashMap;

fn main() {
    // Infer from use
    let mut map = HashMap::new();
    map.insert(1, "one");
    
    // Infer from return type
    fn make_vec() -> Vec<i32> {
        vec![1, 2, 3]
    }
    
    // Turbofish when inference fails
    let chars = "hello".chars().collect::<Vec<char>>();
}
```

## Default Generic Parameters

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Add for Point {
    type Output = Point;
    
    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}
```

## Real-World: Generic Cache

```rust
use std::collections::HashMap;
use std::hash::Hash;
use std::time::{Duration, Instant};

struct Cache<K, V> {
    map: HashMap<K, (V, Instant)>,
    ttl: Duration,
}

impl<K: Eq + Hash, V: Clone> Cache<K, V> {
    fn new(ttl: Duration) -> Cache<K, V> {
        Cache { map: HashMap::new(), ttl }
    }
    
    fn get(&self, key: &K) -> Option<V> {
        self.map.get(key).and_then(|(value, inserted)| {
            if inserted.elapsed() < self.ttl {
                Some(value.clone())
            } else {
                None
            }
        })
    }
    
    fn set(&mut self, key: K, value: V) {
        self.map.insert(key, (value, Instant::now()));
    }
    
    fn cleanup(&mut self) {
        self.map.retain(|_, (_, inserted)| inserted.elapsed() < self.ttl);
    }
}

fn main() {
    let mut cache: Cache<String, i32> = Cache::new(Duration::from_secs(60));
    cache.set("counter".into(), 42);
    println!("{:?}", cache.get(&"counter".into())); // Some(42)
}
```

## Practice Questions

1. What are generics useful for?
2. How do you declare a generic function with one type parameter?
3. How do you write generic implementations for a struct?
4. What's the purpose of the `where` clause?
5. When do you need turbofish syntax?
6. What are const generics and when would you use them?
7. Can a generic struct have methods specific to a concrete type?
8. How does Rust infer generic types?
9. What's the difference between `impl<T> Foo<T>` and `impl Foo<T>`?
10. How do you constrain a generic type to support addition?
