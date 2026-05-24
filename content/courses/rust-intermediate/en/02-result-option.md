---
title: "Result and Option — Error Handling Combinators"
description: "Master Result and Option types with unwrap, expect, map, and_then, ok_or, and combinator chains"
order: 2
duration: "45 minutes"
difficulty: "intermediate"
---

# Result and Option — Error Handling Combinators

`Result<T, E>` and `Option<T>` are the two most important enums in Rust. They represent fallible computations and optional values, respectively.

## Quick Reference

| Type | Success | Failure | Use Case |
|------|---------|---------|----------|
| `Option<T>` | `Some(T)` | `None` | Value may be absent |
| `Result<T, E>` | `Ok(T)` | `Err(E)` | Operation may fail |

## Unwrapping — The Crutch

```rust
fn main() {
    let x = Some(42);
    println!("{}", x.unwrap()); // 42
    
    let y: Option<i32> = None;
    // println!("{}", y.unwrap()); // PANICS!
    
    // Better: custom message
    println!("{}", y.expect("expected a value")); // PANICS with message
}
```

> [!WARNING]
> `unwrap()` and `expect()` should only be used in:
> - Tests and examples
> - When you're absolutely certain the value is `Some`/`Ok`
> - Prototyping (replace with proper handling later)

## Safe Unwrapping

```rust
fn main() {
    let value: Option<i32> = Some(42);
    
    // Provide defaults
    println!("{}", value.unwrap_or(0)); // 42
    println!("{}", value.unwrap_or_else(|| compute_default()));
    
    let result: Result<i32, String> = Ok(42);
    println!("{}", result.unwrap_or(0));
    println!("{}", result.unwrap_or_else(|_| 0));
    
    // Unwrap with default from error
    println!("{}", result.unwrap_or_default()); // 42 (if E: Default)
}

fn compute_default() -> i32 {
    100
}
```

## Mapping — Transform the Inside

```rust
fn main() {
    // Option map
    let some: Option<i32> = Some(5);
    let doubled = some.map(|x| x * 2);
    println!("{:?}", doubled); // Some(10)
    
    let none: Option<i32> = None;
    println!("{:?}", none.map(|x| x * 2)); // None
    
    // Result map
    let ok: Result<i32, &str> = Ok(5);
    println!("{:?}", ok.map(|x| x * 2)); // Ok(10)
    
    let err: Result<i32, &str> = Err("failed");
    println!("{:?}", err.map(|x| x * 2)); // Err("failed")
    
    // Result map_err — transform error
    let err: Result<i32, &str> = Err("not found");
    let mapped = err.map_err(|e| format!("error: {e}"));
    println!("{mapped:?}"); // Err("error: not found")
}
```

| Function | Transforms | Skips When |
|----------|------------|------------|
| `map()` | `Some(T)` / `Ok(T)` | `None` / `Err(E)` |
| `map_err()` | `Err(E)` | `Ok(T)` |
| `map_or()` | `Some(T)` | `None` (with default) |

## Chaining with and_then

`and_then` (also called `flat_map`) chains operations that return `Option`/`Result`:

```rust
fn try_parse(s: &str) -> Option<i32> {
    s.parse().ok()
}

fn try_double(n: i32) -> Option<i32> {
    if n > 1000 { None } else { Some(n * 2) }
}

fn try_format(n: i32) -> Option<String> {
    if n < 0 { None } else { Some(format!("value: {n}")) }
}

fn main() {
    let result = Some("42")
        .and_then(try_parse)
        .and_then(try_double)
        .and_then(try_format);
    
    println!("{:?}", result); // Some("value: 84")
    
    // With Result
    let result: Result<i32, &str> = Ok(5);
    let chained = result
        .and_then(|x| -> Result<i32, &str> { Ok(x * 2) })
        .and_then(|x| -> Result<i32, &str> { Ok(x + 1) });
    println!("{:?}", chained); // Ok(11)
}
```

> [!SUCCESS]
| Combinator | Input → Output | Use Case |
|------------|----------------|----------|
| `map(f)` | `Option<T>` → `Option<U>` | Transform inside |
| `and_then(f)` | `Option<T>` → `Option<U>` | Chaining fallible steps |
| `or_else(f)` | `Option<T>` → `Option<T>` | Fallback on None/Err |

## Converting Between Option and Result

```rust
fn main() {
    // Option -> Result
    let some: Option<i32> = Some(42);
    let result: Result<i32, &str> = some.ok_or("missing value");
    println!("{:?}", result); // Ok(42)
    
    let none: Option<i32> = None;
    let result: Result<i32, &str> = none.ok_or("missing value");
    println!("{:?}", result); // Err("missing value")
    
    // ok_or_else — lazy evaluation
    let result: Result<i32, String> = none.ok_or_else(|| format!("error at line {}", line!()));
    println!("{result:?}");
    
    // Result -> Option
    let ok: Result<i32, &str> = Ok(42);
    println!("{:?}", ok.ok()); // Some(42)
    
    let err: Result<i32, &str> = Err("failed");
    println!("{:?}", err.ok()); // None
}
```

## Filter and Flatten

```rust
fn main() {
    // filter — keep Some values matching predicate
    let items = vec![Some(1), Some(2), None, Some(4)];
    let filtered: Vec<_> = items.into_iter()
        .filter_map(|x| x.filter(|n| n % 2 == 0))
        .collect();
    println!("{:?}", filtered); // [2, 4]
    
    // flatten — collapse nested Options
    let nested: Option<Option<i32>> = Some(Some(42));
    println!("{:?}", nested.flatten()); // Some(42)
    
    let flat: Option<Option<Option<i32>>> = Some(Some(Some(5)));
    println!("{:?}", flat.flatten().flatten()); // Some(5)
}
```

## The ? Operator

The `?` operator is syntactic sugar for early return on error:

```rust
use std::fs::File;
use std::io::{self, Read};

// Verbose version:
fn read_username_verbose(path: &str) -> Result<String, io::Error> {
    let file_result = File::open(path);
    let mut file = match file_result {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    let mut username = String::new();
    match file.read_to_string(&mut username) {
        Ok(_) => Ok(username.trim().to_string()),
        Err(e) => Err(e),
    }
}

// With ? operator:
fn read_username(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username.trim().to_string())
}

// Even shorter:
fn read_username_short(path: &str) -> Result<String, io::Error> {
    let mut username = String::new();
    File::open(path)?.read_to_string(&mut username)?;
    Ok(username.trim().to_string())
}
```

> [!NOTE]
> The `?` operator can be used in functions returning `Result`, `Option`, or any type implementing `FromResidual`. It converts the error type automatically using `From`.

### ? with Option

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}

fn parse_first_number(lines: &[String]) -> Option<i32> {
    let line = lines.first()?;
    line.split_whitespace().next()?.parse().ok()
}
```

### Mixing Result and ? — The Problem

```rust
// This won't compile — Result and Option don't mix with ?
// fn mixed() -> Option<i32> {
//     let file = File::open("foo.txt")?; // Error: can't use ? in Option fn
//     Some(42)
// }
```

Use conversions:

```rust
fn mixed() -> Option<i32> {
    let file = File::open("foo.txt").ok()?; // Convert Err to None
    Some(42)
}
```

## Combining Operators

```rust
use std::num::ParseIntError;

fn parse_and_process(input: &str) -> Result<i32, ParseIntError> {
    input
        .parse::<i32>()       // Result<i32, ParseIntError>
        .map(|x| x * 2)       // Result<i32, ParseIntError>
        .map_err(|e| e)       // Result<i32, ParseIntError>
}

fn process_text(input: &str) -> Option<i32> {
    let trimmed = input.trim();
    if trimmed.is_empty() { return None; }
    
    trimmed
        .parse::<i32>()       // Result<i32, ParseIntError>
        .ok()                  // Option<i32>
        .map(|x| x * 3)       // Option<i32>
        .filter(|x| *x > 0)   // Option<i32>
}

fn main() {
    println!("{:?}", process_text("  42  ")); // Some(126)
    println!("{:?}", process_text(""));       // None
    println!("{:?}", process_text("abc"));    // None
}
```

## Real-World: Configuration Parser

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
    timeout: u64,
}

#[derive(Debug)]
enum ConfigError {
    MissingField(String),
    InvalidValue { field: String, value: String },
    ParseError(String),
}

fn parse_config(map: &HashMap<String, String>) -> Result<Config, ConfigError> {
    let host = map
        .get("host")
        .ok_or_else(|| ConfigError::MissingField("host".into()))?
        .clone();
    
    let port_str = map
        .get("port")
        .ok_or_else(|| ConfigError::MissingField("port".into()))?;
    
    let port = port_str
        .parse::<u16>()
        .map_err(|_| ConfigError::InvalidValue {
            field: "port".into(),
            value: port_str.clone(),
        })?;
    
    let timeout_str = map
        .get("timeout")
        .unwrap_or(&String::from("30"));
    
    let timeout = timeout_str
        .parse::<u64>()
        .unwrap_or(30);
    
    Ok(Config { host, port, timeout })
}

fn main() {
    let map = HashMap::from([
        ("host".into(), "localhost".into()),
        ("port".into(), "8080".into()),
    ]);
    
    match parse_config(&map) {
        Ok(config) => println!("Config: {config:?}"),
        Err(e) => eprintln!("Config error: {e:?}"),
    }
}
```

## Practice Questions

1. What's the difference between `unwrap()` and `expect()`?
2. When is it acceptable to use `unwrap()` in production code?
3. What does `map()` do on a `Result` type?
4. How does `and_then()` differ from `map()`?
5. What does `ok_or()` convert and what's the lazy version?
6. How does the `?` operator work with different error types?
7. What's the difference between `filter_map` and `map` followed by `filter`?
8. When would you use `unwrap_or_else` instead of `unwrap_or`?
9. Can you use `?` in `main`? What return type must main have?
10. How do you convert an `Option` to a `Result` with a custom error message?
