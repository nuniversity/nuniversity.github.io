---
title: "Structs and Enums"
description: "Define custom data types with structs, enums, Option, and Result for safe and expressive code"
order: 8
duration: "30 minutes"
difficulty: "beginner"
---

# Structs and Enums

Structs and enums let you create custom types that model your domain precisely. They're the foundation of Rust's type-driven design.

## Defining Structs

A `struct` bundles related data into one type:

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let user = User {
        active: true,
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        sign_in_count: 1,
    };
    
    println!("{}", user.email);
}
```

> [!NOTE]
> Struct fields are private by default to the module they're defined in. Use `pub` to make them public (covered in modules).

### Mutable Structs

```rust
fn main() {
    let mut user = User {
        active: true,
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        sign_in_count: 1,
    };
    
    user.email = String::from("alice@newdomain.com");
}
```

> [!WARNING]
> Mutability applies to the entire struct instance, not individual fields. You can't have some mutable fields and some immutable (unless using interior mutability via `Cell`/`RefCell`).

### Field Init Shorthand

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username, // shorthand: field = variable with same name
        email,
        sign_in_count: 1,
    }
}
```

### Struct Update Syntax

```rust
fn main() {
    let user1 = User {
        email: String::from("alice@example.com"),
        username: String::from("alice"),
        active: true,
        sign_in_count: 1,
    };
    
    let user2 = User {
        email: String::from("bob@example.com"),
        ..user1 // Fill remaining fields from user1
    };
    // Note: username and email were moved (String), user1 is no longer valid
}
```

## Tuple Structs

Named tuples with field names:

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
    
    // Different types even though same fields
    // black = origin; // ERROR: mismatched types
    
    // Destructure
    let Color(r, g, b) = black;
    println!("{r} {g} {b}");
}
```

## Unit Structs

Structs with no fields (like the unit type `()`):

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

Useful for:
- Marker types (implementing traits on them)
- State machine states with no data

## Enums

An enum represents data that can be one of several variants:

```rust
enum IpAddrKind {
    V4,
    V6,
}

fn main() {
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
    
    route(four);
    route(six);
    route(IpAddrKind::V4);
}

fn route(ip_kind: IpAddrKind) {}
```

### Enums with Data

```rust
enum IpAddr {
    V4(String),  // Each variant can hold data
    V6(String),
}

fn main() {
    let home = IpAddr::V4(String::from("127.0.0.1"));
    let loopback = IpAddr::V6(String::from("::1"));
}
```

### Enums with Different Data Per Variant

```rust
enum Message {
    Quit,                           // No data
    Move { x: i32, y: i32 },       // Named fields (like struct)
    Write(String),                  // Tuple variant
    ChangeColor(i32, i32, i32),     // Tuple variant
}

impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("Quitting"),
            Message::Move { x, y } => println!("Move to ({x}, {y})"),
            Message::Write(text) => println!("{text}"),
            Message::ChangeColor(r, g, b) => println!("Color RGB({r}, {g}, {b})"),
        }
    }
}
```

> [!SUCCESS]
| Struct vs Enum | Use When |
|----------------|----------|
| Struct | Data always has all fields |
| Enum | Data can be one of several shapes |
| Enum with data | Each variant carries different data |

## Option — Safe Null Handling

Rust has no `null`. Instead, use `Option<T>`:

```rust
enum Option<T> {
    Some(T),
    None,
}

fn main() {
    let some_number = Some(5);       // Option<i32>
    let some_char = Some('a');       // Option<char>
    let absent_number: Option<i32> = None; // Must specify type
    
    // Option<T> and T are different types
    let x: i32 = 5;
    let y: Option<i32> = Some(10);
    // let sum = x + y; // ERROR: can't add i32 and Option<i32>
    
    // Must extract the value first
    let sum = x + y.unwrap_or(0);
    println!("{sum}");
}
```

### Common Option Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `unwrap()` | Get value or panic | `T` |
| `unwrap_or(default)` | Get value or default | `T` |
| `unwrap_or_else(fn)` | Get value or call fn | `T` |
| `is_some()` | Check if Some | `bool` |
| `is_none()` | Check if None | `bool` |
| `map(fn)` | Transform Some value | `Option<U>` |
| `expect(msg)` | Unwrap with custom panic message | `T` |

## Result — Error Handling

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Used for operations that can fail:

```rust
use std::fs::File;

fn main() {
    let file_result = File::open("hello.txt");
    
    let file = match file_result {
        Ok(f) => f,
        Err(e) => panic!("File open failed: {e}"),
    };
}
```

| Aspect | `Option<T>` | `Result<T, E>` |
|--------|-------------|----------------|
| Meaning | Value may be absent | Operation may fail |
| Success | `Some(T)` | `Ok(T)` |
| Failure | `None` | `Err(E)` |
| Error info | None | Yes (the `E` type) |

## Pattern Matching with Enums

```rust
enum Status {
    Active,
    Inactive,
    Pending { since: String },
}

fn describe(status: Status) -> String {
    match status {
        Status::Active => String::from("active"),
        Status::Inactive => String::from("inactive"),
        Status::Pending { since } => format!("pending since {since}"),
    }
}
```

## if let / while let with Enums

```rust
fn main() {
    let mut stack = Vec::new();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    while let Some(top) = stack.pop() {
        println!("{top}");
    }
    
    // Destructure enum variants
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("max: {max}");
    }
}
```

## Real-World: State Machine

```rust
#[derive(Debug)]
enum OrderState {
    New,
    Paid,
    Shipped { tracking: String },
    Delivered,
    Cancelled { reason: String },
}

impl OrderState {
    fn transition(self, action: &str) -> Result<OrderState, String> {
        match (&self, action) {
            (OrderState::New, "pay") => Ok(OrderState::Paid),
            (OrderState::Paid, "ship") => Ok(OrderState::Shipped {
                tracking: format!("TRACK-{}", rand::random::<u16>()),
            }),
            (OrderState::Shipped { .. }, "deliver") => Ok(OrderState::Delivered),
            (s, "cancel") => Ok(OrderState::Cancelled {
                reason: format!("Cancelled in state {:?}", s),
            }),
            _ => Err(format!("Can't '{action}' in state {:?}", self)),
        }
    }
}
```

## Practice Questions

1. How do you create a new struct instance?
2. What's the difference between a struct and a tuple struct?
3. What is a unit struct used for?
4. How do enums differ from structs?
5. Why doesn't Rust have `null`?
6. What is `Option<T>` and when would you use it?
7. How does `Result<T, E>` differ from `Option<T>`?
8. What does the struct update syntax `..` do?
9. Can a struct have mutable fields?
10. How do you extract data from an enum variant with different data shapes?
