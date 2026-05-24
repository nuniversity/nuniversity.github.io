---
title: "Match and Patterns"
description: "Master Rust's pattern matching: literals, ranges, destructuring, guards, and advanced match ergonomics"
order: 1
duration: "45 minutes"
difficulty: "intermediate"
---

# Match and Patterns

Pattern matching is one of Rust's most powerful features. It combines conditional logic with destructuring in a single, expressive syntax.

## Match Syntax Refresher

```rust
fn describe_number(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1 | 2 | 3 => "small",
        4..=10 => "medium",
        _ if n > 100 => "large",  // Guard
        _ => "other",
    }
}
```

## Pattern Types

### Literal Patterns

Match specific values:

```rust
fn is_weekend(day: &str) -> bool {
    match day {
        "saturday" | "sunday" => true,
        _ => false,
    }
}
```

### Range Patterns

```rust
fn score_grade(score: u8) -> &'static str {
    match score {
        90..=100 => "A",
        80..=89 => "B",
        70..=79 => "C",
        60..=69 => "D",
        0..=59 => "F",
    }
}

fn match_char(c: char) -> &'static str {
    match c {
        'a'..='z' => "lowercase",
        'A'..='Z' => "uppercase",
        '0'..='9' => "digit",
        _ => "other",
    }
}
```

> [!NOTE]
| Range Pattern | Syntax | Example |
|---------------|--------|---------|
| Inclusive | `..=` | `1..=5` matches 1,2,3,4,5 |
| Half-open | `..` | `1..5` matches 1,2,3,4 (not valid in match, only in for) |
| Open-ended | `..` | `..=5` or `5..` (in match, use guards) |

### Destructuring Patterns

#### Structs

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 10, y: 20 };
    
    match p {
        Point { x, y } => println!("({x}, {y})"),
    }
    
    // Partial destructuring with ..
    match p {
        Point { x, .. } => println!("x: {x}"),
    }
    
    // Rename fields
    match p {
        Point { x: a, y: b } => println!("({a}, {b})"),
    }
}
```

#### Enums

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn handle(msg: Message) {
    match msg {
        Message::Quit => println!("quit"),
        Message::Move { x, y } => println!("move to ({x}, {y})"),
        Message::Write(text) => println!("{text}"),
        Message::ChangeColor(r, g, b) => println!("RGB({r}, {g}, {b})"),
    }
}
```

#### Tuples

```rust
fn describe_point(p: (i32, i32, i32)) -> &'static str {
    match p {
        (0, 0, 0) => "origin",
        (0, 0, _) => "on z-axis",
        (0, _, _) => "on x=0 plane",
        (_, 0, _) => "on y=0 plane",
        (_, _, 0) => "on z=0 plane",
        _ => "in space",
    }
}
```

#### Arrays and Slices

```rust
fn first_and_last(arr: &[i32]) -> Option<(&i32, &i32)> {
    match arr {
        [first, .., last] => Some((first, last)),
        _ => None,
    }
}

fn sum_first_two(arr: &[i32]) -> i32 {
    match arr {
        [a, b, ..] => a + b,
        [a] => *a,
        [] => 0,
    }
}
```

> [!SUCCESS]
> Slice patterns with `..` (rest pattern) make it easy to match on the structure of collections. The compiler verifies exhaustiveness even with complex patterns.

### Guard Patterns

Add extra conditions with `if`:

```rust
fn classify_number(n: i32) -> &'static str {
    match n {
        x if x < 0 => "negative",
        x if x % 2 == 0 => "even positive",
        _ => "odd positive",
    }
}

fn match_pair(pair: (i32, i32)) -> &'static str {
    match pair {
        (x, y) if x == y => "equal",
        (x, y) if x + y == 0 => "negatives",
        (x, _) if x > 0 => "first positive",
        _ => "other",
    }
}
```

### @ Bindings

Bind the matched value to a name while destructuring:

```rust
fn inspect(value: Option<i32>) {
    match value {
        Some(x @ 0..=10) => println!("small positive: {x}"),
        Some(x @ 11..=100) => println!("medium positive: {x}"),
        Some(x) => println!("large positive: {x}"),
        None => println!("none"),
    }
}

// With nested destructuring
struct Person {
    name: String,
    age: u8,
}

fn greet(person: Person) {
    match person {
        Person { name, age: age @ 0..=12 } => {
            println!("Hi {name}, you're {age} — a kid!");
        }
        Person { name, age: age @ 13..=19 } => {
            println!("Hey {name}, you're {age} — a teen!");
        }
        Person { name, age } => {
            println!("Hello {name}, you're {age}.");
        }
    }
}
```

### Multiple Patterns with |

```rust
fn is_vowel(c: char) -> bool {
    matches!(c, 'a' | 'e' | 'i' | 'o' | 'u' | 'A' | 'E' | 'I' | 'O' | 'U')
}

fn describe_day(n: u8) -> &'static str {
    match n {
        1 | 7 => "weekend",
        2..=6 => "weekday",
        _ => "invalid",
    }
}
```

## The matches! Macro

For simple boolean pattern checks:

```rust
fn main() {
    let foo = Some(42);
    assert!(matches!(foo, Some(x) if x > 0));
    
    let arr = [1, 2, 3];
    assert!(matches!(arr, [1, _, _]));
}
```

## Match Ergonomics

Rust automatically dereferences in match patterns:

```rust
fn main() {
    let x = &Some(42);
    
    // Without ergonomics (pre-2018):
    match x {
        &Some(ref y) => println!("{y}"),
        &None => (),
    }
    
    // With ergonomics (2018+):
    match x {
        Some(y) => println!("{y}"),
        None => (),
    }
}
```

### Ref Patterns

Use `ref` and `ref mut` to borrow matched values:

```rust
fn main() {
    let s = Some(String::from("hello"));
    
    match s {
        Some(ref s) => println!("borrowed: {s}"),  // s is &String
        None => (),
    }
    
    println!("still owned: {:?}", s); // s wasn't moved
    
    let mut t = Some(String::from("world"));
    match t {
        Some(ref mut s) => *s = String::from("changed"),
        None => (),
    }
    println!("{:?}", t); // Some("changed")
}
```

## Pattern Matching in Other Contexts

### let Statements

```rust
let (x, y, z) = (1, 2, 3);
let Point { x: a, y: b } = Point { x: 10, y: 20 };
```

### Function Parameters

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("({x}, {y})");
}

fn sum_coordinates(Point { x, y }: &Point) -> i32 {
    x + y
}
```

### if let / while let

```rust
fn main() {
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("{top}");
    }
    
    let coords = (0, 5);
    if let (0, y) = coords {
        println!("on y-axis at {y}");
    }
}
```

### for loops

```rust
fn main() {
    let pairs = [(1, 2), (3, 4), (5, 6)];
    for (a, b) in &pairs {
        println!("{a} + {b} = {}", a + b);
    }
    
    let map = std::collections::HashMap::from([("a", 1), ("b", 2)]);
    for (key, value) in &map {
        println!("{key}: {value}");
    }
}
```

## Matching Reference and Pointer Types

```rust
fn main() {
    let x = 42;
    let y = &x;
    let z = Box::new(x);
    
    match y {
        42 => println!("matches value (auto-deref)"),
        _ => println!("no match"),
    }
    
    match &z {
        42 => println!("Box matches too"),
        _ => println!("no match"),
    }
}
```

## Real-World: Expression Evaluator

```rust
#[derive(Debug)]
enum Expr {
    Lit(i32),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

fn eval(expr: &Expr) -> Option<i32> {
    match expr {
        Expr::Lit(n) => Some(*n),
        Expr::Add(l, r) => Some(eval(l)? + eval(r)?),
        Expr::Sub(l, r) => Some(eval(l)? - eval(r)?),
        Expr::Mul(l, r) => Some(eval(l)? * eval(r)?),
        Expr::Div(l, r) => {
            let r_val = eval(r)?;
            if r_val == 0 {
                None
            } else {
                Some(eval(l)? / r_val)
            }
        }
    }
}

fn main() {
    let expr = Expr::Add(
        Box::new(Expr::Lit(10)),
        Box::new(Expr::Mul(
            Box::new(Expr::Lit(3)),
            Box::new(Expr::Lit(5)),
        )),
    );
    println!("{:?}", eval(&expr)); // Some(25)
}
```

## Practice Questions

1. What does the `..` pattern mean when destructuring a struct?
2. How do you match a range of values in match?
3. What's the difference between `|` and `..=` in patterns?
4. When would you use a match guard instead of a nested match?
5. What does the `@` binding do?
6. How does pattern matching in `if let` differ from `match`?
7. What are ref patterns and when are they needed?
8. How does the `matches!` macro simplify pattern matching?
9. Can you destructure a slice with patterns? Give an example.
10. How does Rust handle automatically dereferencing in match patterns?
