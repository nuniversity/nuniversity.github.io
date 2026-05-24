---
title: "Variables and Mutability"
description: "Understand Rust's variable naming, shadowing, constants, and how immutability prevents entire classes of bugs"
order: 3
duration: "25 minutes"
difficulty: "beginner"
---

# Variables and Mutability

Variables in Rust are **immutable by default**. This is one of the language's core design decisions — it pushes you toward safer, more predictable code.

## Immutable Variables

```rust
fn main() {
    let x = 5;
    // x = 6; // ERROR: cannot assign twice to immutable variable
    println!("x is {x}");
}
```

> [!NOTE]
> Immutability by default removes an entire category of bugs: unintended mutation. If a value doesn't need to change, the compiler enforces it.

## Mutable Variables

Use `mut` to make a variable mutable:

```rust
fn main() {
    let mut y = 10;
    println!("y is {y}");
    y = 15;
    println!("now y is {y}");
}
```

| Declaration | Can Reassign? | Can Modify? | Use Case |
|-------------|---------------|-------------|----------|
| `let x = 5;` | No | No | Constants, read-only data |
| `let mut x = 5;` | Yes | Yes | Counters, accumulators, state |

## Constants

Constants are **always immutable**, must have **explicit type annotations**, and can be declared at any scope (including global):

```rust
const MAX_SPEED: u32 = 120;  // Type annotation required
const APP_NAME: &str = "MyApp";

fn main() {
    println!("{APP_NAME} max speed: {MAX_SPEED}");
}
```

| Feature | `let` | `const` |
|---------|-------|---------|
| Mutable? | Only with `mut` | Never |
| Type annotation | Optional | Required |
| Scope | Block | Any scope (including global) |
| Computed at | Runtime | Compile time |
| Inlined? | No | Yes (value copied everywhere used) |

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3; // Compile-time expression
```

> [!WARNING]
> `const` values are inlined at every use site. This means if you use a const in many places, it's duplicated. For a single memory location, use `static` instead.

## Shadowing

Rust allows you to **shadow** a variable by redeclaring it with `let`:

```rust
fn main() {
    let x = 5;
    let x = x + 1;    // Shadow: new variable, new type possible
    let x = x * 2;
    println!("x is {x}"); // 12
    
    // Shadowing lets us change type
    let spaces = "   ";
    let spaces = spaces.len(); // Now spaces is a number
}
```

### Shadowing vs Mutability

| Aspect | `let mut x` | `let x` (shadowing) |
|--------|-------------|---------------------|
| Changes value | Yes | Yes (new variable) |
| Changes type | No | Yes |
| Memory location | Same | New |
| Scope | Same block | Old binding shadowed |

```rust
fn main() {
    // Mutability: same type, same memory
    let mut count = 0;
    count += 1;
    count += 1;
    println!("{count}"); // 2
    
    // Shadowing: new variable, can change type
    let value = "hello";
    let value = value.len();
    println!("{value}"); // 5
}
```

> [!SUCCESS]
> Shadowing is useful for transforming values while keeping the same name. Use it when you need to change type or when the old value should no longer be accessible.

## Variable Scope

Variables exist only within the block they're declared in (usually `{}`):

```rust
fn main() {
    let outer = 10;
    {
        let inner = 20;
        println!("inner: {inner}, outer: {outer}"); // Both accessible
    }
    // println!("{inner}"); // ERROR: not found in scope
    println!("outer: {outer}"); // Still accessible
}
```

### Variable Initialization

Variables must be initialized before use:

```rust
fn main() {
    let x: i32;
    // println!("{x}"); // ERROR: used before initialization
    x = 5;
    println!("{x}"); // OK
}
```

> [!WARNING]
> Rust won't let you use an uninitialized variable. This prevents undefined behavior common in C/C++ where reading uninitialized memory produces garbage values.

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Variables | `snake_case` | `user_name`, `max_count` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_SPEED`, `API_KEY` |
| Functions | `snake_case` | `calculate_area()` |
| Types | `PascalCase` | `UserProfile`, `String` |

```rust
const DEFAULT_TIMEOUT_MS: u64 = 5000;

fn main() {
    let user_age: u8 = 25;
    let is_active: bool = true;
}
```

## Underscore Patterns

```rust
fn main() {
    let _unused = 42;      // Suppresses unused variable warning
    let _ = 100;           // Completely discard — no binding at all
    let _x = 10;           // Underscore prefix = "intentionally unused"
}
```

## Destructuring Assignment

Rust supports destructuring with `let`:

```rust
fn main() {
    let (x, y, z) = (1, 2, 3);
    println!("{x}, {y}, {z}"); // 1, 2, 3
    
    // Underscore to discard parts
    let (a, _, b) = (10, 20, 30);
    println!("{a}, {b}"); // 10, 30
}
```

## Real-World Patterns

```rust
// Safe state machine: immutable enum states
enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
}

fn main() {
    let state = ConnectionState::Disconnected;
    // state = ConnectionState::Connected; // Must use 'mut' or shadow
    
    let state = ConnectionState::Connected; // Shadow: new state
    
    // Use shadowing for type conversion
    let input = "  Hello World  ";
    let input = input.trim();       // &str -> &str (trimmed)
    let input = input.to_string();  // &str -> String
    let input = input.as_bytes();   // String -> &[u8]
}
```

## Practice Questions

1. Why are variables immutable by default in Rust?
2. What keyword makes a variable mutable?
3. What is the difference between `const` and `let`?
4. What does shadowing allow that `mut` does not?
5. Can a constant be declared inside a function?
6. What happens when a variable goes out of scope?
7. Why must variables be initialized before use?
8. What naming convention is used for Rust constants?
9. How do you suppress an unused variable warning?
10. What does `let (x, _, z) = (1, 2, 3);` do?
