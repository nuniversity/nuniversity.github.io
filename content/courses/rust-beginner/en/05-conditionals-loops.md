---
title: "Conditionals and Loops"
description: "Learn program flow control with if/else, loop, while, for, and the match expression"
order: 5
duration: "30 minutes"
difficulty: "beginner"
---

# Conditionals and Loops

Rust provides familiar control flow with some unique twists. All control flow constructs are **expressions** that can return values.

## if / else if / else

Unlike C, conditions **don't need parentheses**:

```rust
fn main() {
    let number = 7;
    
    if number < 5 {
        println!("small");
    } else if number < 10 {
        println!("medium");
    } else {
        println!("large");
    }
}
```

### if is an Expression

Every `if`/`else` block returns a value — both arms must be the same type:

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };
    println!("{number}"); // 5
    
    // ERROR: arms must be same type
    // let bad = if condition { 5 } else { "six" };
}
```

> [!NOTE]
| Feature | Rust | C/Java |
|---------|------|--------|
| Parentheses | Optional | Required |
| Expression | Yes (returns value) | Statement only |
| Type checking | All arms must match | No such requirement |

```rust
fn main() {
    let x = 10;
    let result = if x > 5 {
        "greater"
    } else if x == 5 {
        "equal"
    } else {
        "less"
    };
    println!("{result}"); // "greater"
}
```

## loop — Infinite Loops

`loop` runs forever unless explicitly exited:

```rust
fn main() {
    let mut counter = 0;
    
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // Break with a value
        }
    };
    
    println!("result: {result}"); // 20
}
```

### Loop Labels

Labels allow breaking out of nested loops:

```rust
fn main() {
    'outer: for i in 1..=3 {
        for j in 1..=3 {
            if i == 2 && j == 2 {
                break 'outer; // Breaks both loops
            }
            println!("({i}, {j})");
        }
    }
}
```

| Feature | Syntax | Purpose |
|---------|--------|---------|
| Label | `'label:` | Name a loop |
| Break with value | `break value` | Exit and return value |
| Continue | `continue` | Skip to next iteration |
| Labeled break | `break 'label` | Exit outer loop |

> [!SUCCESS]
> Use `loop` when you need to "retry until success" patterns or break with a value. For counted iteration, prefer `for`.

## while — Conditional Loops

```rust
fn main() {
    let mut n = 3;
    while n > 0 {
        println!("{n}");
        n -= 1;
    }
    println!("liftoff!");
}
```

`while` can also be an expression with `break`:

```rust
fn main() {
    let mut n = 0;
    let result = while n < 10 {
        n += 1;
        if n == 7 {
            break n;
        }
    };
    println!("first >= 7: {result:?}"); // Some(7)
}
```

> [!WARNING]
> The break value from a `while` loop is `Option<T>` because the condition may never be true. In `loop`, the break value is `T` directly.

## for — Iteration

`for` is the preferred loop in Rust — it's safe, fast, and expressive:

```rust
fn main() {
    // Range syntax
    for i in 0..5 {        // 0, 1, 2, 3, 4
        print!("{i} ");
    }
    println!();
    
    // Inclusive range
    for i in 0..=5 {       // 0, 1, 2, 3, 4, 5
        print!("{i} ");
    }
    println!();
    
    // Iterate over collection
    let arr = [10, 20, 30];
    for element in arr {
        print!("{element} ");
    }
    println!();
    
    // With index (enumerate)
    for (index, value) in arr.iter().enumerate() {
        println!("arr[{index}] = {value}");
    }
}
```

### Iterating Patterns

```rust
fn main() {
    // Reverse range
    for i in (1..=5).rev() {
        print!("{i} "); // 5 4 3 2 1
    }
    println!();
    
    // Step by
    for i in (0..10).step_by(2) {
        print!("{i} "); // 0 2 4 6 8
    }
    println!();
    
    // Over characters of a string
    for ch in "hello".chars() {
        print!("{ch} ");
    }
    println!();
}
```

| Loop Type | When to Use | Break Returns |
|-----------|-------------|---------------|
| `loop` | Need to break with value, or indefinite | `T` |
| `while` | Condition-based, checked each iteration | `Option<T>` |
| `for` | Iterating over a collection or range | `Option<T>` |

## Match — Pattern Matching

`match` is Rust's powerful switch statement on steroids. It's **exhaustive** — every possible case must be handled:

```rust
fn main() {
    let number = 3;
    
    match number {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("other"), // Catch-all
    }
}
```

> [!NOTE]
> `_` is the catch-all pattern. It matches anything and is the default case. The compiler warns if you forget it and haven't covered all values.

### Match as an Expression

```rust
fn main() {
    let value = 7;
    
    let description = match value {
        0 => "zero",
        1..=3 => "small",         // Range pattern
        4..=6 => "medium",
        7..=9 => "large",
        _ if value > 100 => "huge", // Guard condition
        _ => "other",
    };
    
    println!("{description}"); // "large"
}
```

### Match with Enums

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### Match with Option

```rust
fn main() {
    let some_value: Option<i32> = Some(10);
    
    let doubled = match some_value {
        Some(x) => x * 2,
        None => 0,
    };
    
    println!("{doubled}"); // 20
}
```

## if let — Concise Matching

When you only care about one pattern:

```rust
fn main() {
    let config_max = Some(3u8);
    
    // Verbose match
    match config_max {
        Some(max) => println!("max: {max}"),
        _ => (),
    }
    
    // Concise if let
    if let Some(max) = config_max {
        println!("max: {max}");
    }
    
    // if let with else
    let value: Option<i32> = None;
    if let Some(x) = value {
        println!("got {x}");
    } else {
        println!("got nothing");
    }
}
```

| Construct | Best For |
|-----------|----------|
| `match` | Exhaustive checking, 3+ arms |
| `if let` | One pattern to match, ignore rest |
| `let else` | Unwrap or return/break early |

### let-else (Rust 1.65+)

```rust
fn main() {
    let value: Option<i32> = Some(42);
    
    let Some(x) = value else {
        println!("no value");
        return;
    };
    println!("got {x}");
}
```

## Real-World: Input Validation

```rust
use std::io;

fn main() {
    let mut input = String::new();
    
    println!("Enter a number between 1 and 10:");
    io::stdin().read_line(&mut input).unwrap();
    
    let number: i32 = match input.trim().parse() {
        Ok(n) => n,
        Err(_) => {
            println!("Invalid number!");
            return;
        }
    };
    
    match number {
        1..=5 => println!("{number} is in the lower half"),
        6..=10 => println!("{number} is in the upper half"),
        _ => println!("{number} is out of range"),
    }
}
```

## Practice Questions

1. Can you use `if` without `else` in Rust?
2. What does `break 42` do inside a `loop`?
3. What type does a `while` loop return when broken with a value?
4. How do you iterate over an array with index and value?
5. What happens if a `match` doesn't cover all possible values?
6. What's the difference between `0..5` and `0..=5`?
7. When should you use `if let` instead of `match`?
8. What does the `_` pattern do in a match expression?
9. How does `let-else` differ from `if let`?
10. Write a for loop that prints numbers 10 down to 1.
