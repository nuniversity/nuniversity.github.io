---
title: "panic! and Error Handling Strategies"
description: "Learn when to panic, how to propagate errors, and build robust error handling with anyhow and thiserror"
order: 3
duration: "45 minutes"
difficulty: "intermediate"
---

# panic! and Error Handling Strategies

Not all errors are recoverable. Rust provides `panic!` for unrecoverable errors and `Result` for recoverable ones. Choosing the right strategy is key to robust code.

## panic! — Unrecoverable Errors

`panic!` prints an error message, unwinds the stack (by default), and exits:

```rust
fn main() {
    panic!("crash and burn");
    // thread 'main' panicked at 'crash and burn', src/main.rs:2:5
}
```

### Common Panic Scenarios

```rust
fn main() {
    // Index out of bounds
    let v = vec![1, 2, 3];
    // v[10];  // panic: index out of bounds
    
    // Unwrap on None
    let x: Option<i32> = None;
    // x.unwrap();  // panic: called `Option::unwrap()` on a `None` value
    
    // Integer overflow (debug mode)
    let x: u8 = 255;
    // let y = x + 1;  // panic: attempt to add with overflow
    
    // Assertion failed
    // assert!(false);  // panic: assertion failed
}
```

> [!WARNING]
| Situation | Should You Panic? | Better Alternative |
|-----------|-------------------|--------------------|
| Array index out of bounds | Yes (bug) | Use `.get()` for safe access |
| User input invalid | No | Return `Result` |
| Config file missing | Maybe | Return `Result` or use `expect` |
| Network timeout | No | Return `Result` |
| Division by zero | Yes | Check before dividing |

### Custom Panic Messages

```rust
fn main() {
    let msg = String::from("custom error");
    panic!("something went wrong: {msg}");
}
```

### panic! Strategically

```rust
fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("division by zero");
    }
    a / b
}

// Better: return Result
fn safe_divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("division by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

## Unwrap vs Expect

```rust
fn main() {
    // unwrap: minimal, not descriptive
    let result: Result<i32, &str> = Err("error");
    // result.unwrap(); // panics with: called `Result::unwrap()` on an `Err` value: "error"
    
    // expect: descriptive message
    // result.expect("failed to get value");
    // panics with: failed to get value: "error"
}
```

> [!NOTE]
| Method | Message | Use Case |
|--------|---------|----------|
| `unwrap()` | Generic (shows value) | Quick prototypes |
| `expect(msg)` | Custom + value | Documenting assumptions |
| `unwrap_or(default)` | None | Safe default |

## Error Propagation with ?

The `?` operator propagates errors to the caller:

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

// Multiple error types = pain
fn read_and_parse(path: &str) -> Result<i32, ???> {
    let content = fs::read_to_string(path)?;        // io::Error
    let num = content.trim().parse::<i32>()?;       // ParseIntError
    Ok(num)
}
```

### Solution 1: Box\<dyn Error\>

```rust
use std::error::Error;

fn read_and_parse(path: &str) -> Result<i32, Box<dyn Error>> {
    let content = fs::read_to_string(path)?;
    let num = content.trim().parse::<i32>()?;
    Ok(num)
}
```

> [!SUCCESS]
> `Box<dyn Error>` is the simplest way to handle multiple error types. It's great for applications but loses type information.

### Solution 2: Custom Error Type

```rust
use std::fmt;
use std::fs;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "IO error: {e}"),
            AppError::Parse(e) => write!(f, "Parse error: {e}"),
        }
    }
}

impl From<io::Error> for AppError {
    fn from(e: io::Error) -> AppError {
        AppError::Io(e)
    }
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::Parse(e)
    }
}

fn read_and_parse(path: &str) -> Result<i32, AppError> {
    let content = fs::read_to_string(path)?; // Converted via From
    let num = content.trim().parse::<i32>()?; // Converted via From
    Ok(num)
}
```

## anyhow — Ergonomic Error Handling

`anyhow` provides `anyhow::Error` and the `Context` trait:

```toml
[dependencies]
anyhow = "1.0"
```

```rust
use anyhow::{Context, Result};
use std::fs;

fn read_config(path: &str) -> Result<String> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {path}"))?;
    Ok(content)
}

fn parse_port(content: &str) -> Result<u16> {
    content.trim().parse::<u16>()
        .with_context(|| format!("invalid port number: {content}"))?
}

fn main() -> Result<()> {
    let config = read_config("config.toml")?;
    let port = parse_port(&config)?;
    println!("Port: {port}");
    Ok(())
}
```

> [!NOTE]
| Feature | `Box<dyn Error>` | `anyhow` |
|---------|-------------------|----------|
| Type erased | Yes | Yes |
| Context attachment | Manual | `.with_context()` |
| Downcasting | Possible | Possible |
| Popularity | Stdlib | Community standard |
| When to use | Libraries | Applications |

## thiserror — Library Error Types

`thiserror` derives `Display` and `Error` for custom error types:

```toml
[dependencies]
thiserror = "2"
```

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DataError {
    #[error("data store disconnected")]
    Disconnect(#[from] io::Error),
    
    #[error("invalid header (expected {expected:?}, got {found:?})")]
    InvalidHeader {
        expected: String,
        found: String,
    },
    
    #[error("unknown data store error")]
    Unknown,
}

fn process_data() -> Result<(), DataError> {
    // io::Error automatically converts via #[from]
    let _content = fs::read_to_string("data.txt")?;
    Err(DataError::Unknown)
}
```

> [!SUCCESS]
| Crate | Purpose | When to Use |
|-------|---------|-------------|
| `anyhow` | Application error handling | Binary projects, CLIs |
| `thiserror` | Library error types | Library crates |
| Both | Define types with thiserror, use anyhow in apps | Large projects |

## Panic or Not?

### When to panic:

```rust
// Invariant violation — this should never happen
fn month_name(month: u8) -> &'static str {
    match month {
        1 => "January",
        2 => "February",
        // ...
        12 => "December",
        _ => panic!("invalid month: {month}"), // Programming bug
    }
}

// Unwrap on infallible operations
fn main() {
    let parsed: i32 = "42".parse().unwrap(); // Parse always succeeds here
    // Better: use expect
    let parsed: i32 = "42".parse().expect("hardcoded literal must parse");
}
```

### When NOT to panic:

```rust
// User input — never panic
fn process_user_input(input: &str) -> Result<i32, String> {
    input.trim().parse::<i32>().map_err(|_| format!("'{input}' is not a number"))
}
```

## Real-World: Error Handling in a CLI

```rust
use anyhow::{Context, Result};
use std::path::Path;
use std::fs;

#[derive(Debug)]
struct UserData {
    name: String,
    age: u8,
}

fn load_user_data(path: &Path) -> Result<UserData> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("cannot read {}", path.display()))?;
    
    let lines: Vec<&str> = content.lines().collect();
    if lines.len() < 2 {
        anyhow::bail!("file must have at least 2 lines");
    }
    
    let name = lines[0].to_string();
    let age = lines[1].parse::<u8>()
        .with_context(|| format!("invalid age: '{}'", lines[1]))?;
    
    Ok(UserData { name, age })
}

fn main() -> Result<()> {
    let data = load_user_data(Path::new("user.txt"))?;
    println!("Loaded: {} (age {})", data.name, data.age);
    Ok(())
}
```

## Practice Questions

1. What happens when `panic!` is called?
2. When is it appropriate to panic in Rust?
3. What's the difference between `unwrap()` and `expect()`?
4. How does the `?` operator propagate errors?
5. What's the advantage of `Box<dyn Error>` for error handling?
6. How does `anyhow` improve error handling ergonomics?
7. What does `thiserror`'s `#[from]` attribute do?
8. When should you use `anyhow` vs `thiserror`?
9. What does `with_context()` add to an error?
10. How do you decide between a panic and a Result?
