---
title: "Functions, Methods, and impl Blocks"
description: "Write reusable code with functions, implement methods on types, and understand associated functions"
order: 9
duration: "30 minutes"
difficulty: "beginner"
---

# Functions, Methods, and impl Blocks

Functions are the building blocks of Rust programs. Methods are functions attached to types via `impl` blocks.

## Functions

Functions in Rust use `snake_case` naming:

```rust
fn main() {
    greet("World");
    let sum = add(5, 3);
    println!("{sum}");
}

fn greet(name: &str) {
    println!("Hello, {name}!");
}

fn add(x: i32, y: i32) -> i32 {
    x + y  // No semicolon = expression, returned
}
```

### Function Syntax

```rust
// Keyword name   params    return type
fn     name(param: Type) -> ReturnType {
    // Body — last expression is returned
    value  // Implicit return
}

fn explicit_return(x: i32) -> i32 {
    if x > 0 {
        return x;  // Early return with 'return'
    }
    0  // Default return
}
```

> [!NOTE]
| Syntax | Behavior | Example |
|--------|----------|---------|
| `expr;` (semicolon) | Statement, returns `()` | `let x = 5;` |
| `expr` (no semicolon) | Expression, returns value | `x + 1` |
| `return expr;` | Early return | `return Err(e);` |

### Functions with Multiple Returns

```rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err(String::from("division by zero"));
    }
    Ok(a / b)
}

// Multiple values via tuple
fn split_at(s: &str, mid: usize) -> (&str, &str) {
    (&s[..mid], &s[mid..])
}
```

## Methods

Methods are functions defined within an `impl` block. Their first parameter is always `self`, `&self`, or `&mut self`:

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // Method: borrows self immutably
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    // Method: borrows self mutably
    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }
    
    // Method: takes ownership (rare)
    fn consume(self) -> String {
        format!("{}x{}", self.width, self.height)
    }
}

fn main() {
    let mut rect = Rectangle { width: 30, height: 50 };
    
    println!("area: {}", rect.area());   // Method call
    rect.scale(2);                       // Mutable method call
    println!("now: {}x{}", rect.width, rect.height);
}
```

> [!SUCCESS]
| `self` Form | Access | Use Case |
|-------------|--------|----------|
| `&self` | Read-only | Most methods |
| `&mut self` | Read + Write | Methods that modify |
| `self` | Ownership | Consuming the value |

## Associated Functions

Functions in `impl` blocks that DON'T take `self` are called **associated functions**. They're called with `::` syntax:

```rust
impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    let square = Rectangle::square(10);
    println!("{} x {}", square.width, square.height);
}
```

> [!NOTE]
> `::` syntax is used for:
> - Associated functions: `Type::function()`
> - Namespace access: `std::collections::HashMap`
> - Enum variants: `Option::Some(5)`

### Common Associated Functions

```rust
// Constructors
let s = String::from("hello");     // &str -> String
let v = Vec::with_capacity(10);    // Pre-allocate
let n = "42".parse::<i32>().unwrap(); // Parse string
```

## Multiple impl Blocks

A type can have multiple `impl` blocks:

```rust
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }
}

impl Point {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

impl Point {
    fn distance(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}
```

This is useful for separating code into logical groups, especially when using `#[cfg]` attributes or feature gates.

## Method Chaining

Return `&mut self` or `Self` from methods to enable chaining:

```rust
struct Calculator {
    value: f64,
}

impl Calculator {
    fn new() -> Calculator {
        Calculator { value: 0.0 }
    }
    
    fn add(&mut self, x: f64) -> &mut Calculator {
        self.value += x;
        self
    }
    
    fn multiply(&mut self, x: f64) -> &mut Calculator {
        self.value *= x;
        self
    }
    
    fn result(&self) -> f64 {
        self.value
    }
}

fn main() {
    let result = Calculator::new()
        .add(10.0)
        .multiply(2.0)
        .add(5.0)
        .result();
    println!("{result}"); // 25.0
}
```

## Generic Functions (Preview)

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    println!("{}", largest(&[1, 3, 5, 2, 4])); // 5
    println!("{}", largest(&['a', 'z', 'm'])); // 'z'
}
```

## Functions as Values

Functions are first-class — they can be passed around:

```rust
fn add_one(x: i32) -> i32 { x + 1 }
fn double(x: i32) -> i32 { x * 2 }

fn apply(f: fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

fn main() {
    println!("{}", apply(add_one, 5));  // 6
    println!("{}", apply(double, 5));   // 10
}
```

## Function Attributes

```rust
#[inline]
fn small_hot_function(x: i32) -> i32 {
    x.wrapping_mul(2) + 1
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_add() {
        assert_eq!(super::add(2, 3), 5);
    }
}
```

## Real-World: A Builder Pattern

```rust
struct EmailBuilder {
    to: Option<String>,
    subject: Option<String>,
    body: Option<String>,
}

impl EmailBuilder {
    fn new() -> EmailBuilder {
        EmailBuilder { to: None, subject: None, body: None }
    }
    
    fn to(mut self, to: &str) -> EmailBuilder {
        self.to = Some(to.to_string());
        self
    }
    
    fn subject(mut self, subject: &str) -> EmailBuilder {
        self.subject = Some(subject.to_string());
        self
    }
    
    fn body(mut self, body: &str) -> EmailBuilder {
        self.body = Some(body.to_string());
        self
    }
    
    fn build(self) -> Result<Email, String> {
        Ok(Email {
            to: self.to.ok_or("Missing 'to'")?,
            subject: self.subject.unwrap_or_default(),
            body: self.body.unwrap_or_default(),
        })
    }
}

struct Email {
    to: String,
    subject: String,
    body: String,
}

fn main() {
    let email = EmailBuilder::new()
        .to("alice@example.com")
        .subject("Hello")
        .body("How are you?")
        .build()
        .unwrap();
    
    println!("Email to: {}", email.to);
}
```

## Practice Questions

1. What's the difference between a function and a method?
2. What does `&self` mean in a method signature?
3. When would you use `self` (with ownership) instead of `&self`?
4. What's an associated function? How is it called?
5. Can a struct have multiple `impl` blocks?
6. What's the difference between statements and expressions in function bodies?
7. How do you perform an early return from a function?
8. What is method chaining and how is it implemented?
9. How do you define a function that takes another function as a parameter?
10. When would you use an associated function vs a method?
