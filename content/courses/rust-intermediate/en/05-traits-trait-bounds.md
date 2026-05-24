---
title: "Traits and Trait Bounds"
description: "Define shared behavior with traits, implement them on types, and constrain generics with trait bounds and where clauses"
order: 5
duration: "45 minutes"
difficulty: "intermediate"
---

# Traits and Trait Bounds

Traits are Rust's mechanism for defining shared behavior. They're similar to interfaces in other languages but with important differences.

## Defining and Implementing Traits

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    headline: String,
    content: String,
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.headline, &self.content[..20.min(self.content.len())])
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, &self.content[..20.min(self.content.len())])
    }
}

fn main() {
    let article = Article {
        headline: "Rust 2024 released".into(),
        content: "The Rust team announces edition 2024...".into(),
    };
    let tweet = Tweet {
        username: "rustlang".into(),
        content: "Edition 2024 is here!".into(),
    };
    
    println!("{}", article.summarize());
    println!("{}", tweet.summarize());
}
```

> [!NOTE]
> Traits and their implementations must be in the same crate (orphan rule). You can't implement `Display` on `Vec` because neither is yours.

## Default Implementations

```rust
trait Greeter {
    fn greet(&self) -> String;
    fn greet_formal(&self) -> String {
        format!("Greetings, {}", self.greet()) // Default
    }
}

struct Person { name: String }

impl Greeter for Person {
    fn greet(&self) -> String {
        format!("Hi, {}!", self.name)
    }
    // greet_formal uses default
}

fn main() {
    let p = Person { name: "Alice".into() };
    println!("{}", p.greet());        // "Hi, Alice!"
    println!("{}", p.greet_formal()); // "Greetings, Hi, Alice!!"
}
```

## Trait Bounds on Functions

```rust
use std::fmt::Display;

fn notify<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Multiple bounds
fn notify_display<T: Summary + Display>(item: &T) {
    println!("Display: {item}");
    println!("Summary: {}", item.summarize());
}

// Where clause (preferred for complex bounds)
fn notify_where<T>(item: &T)
where
    T: Summary + Display,
{
    println!("{item}");
    println!("{}", item.summarize());
}
```

### Returning Traits

```rust
fn make_summarizable() -> impl Summary {
    Tweet {
        username: "newsbot".into(),
        content: "Breaking news!".into(),
    }
}

// Note: impl Trait in return position means single concrete type
// For multiple types, use Box<dyn Trait>
fn make_summarizable_dyn(switch: bool) -> Box<dyn Summary> {
    if switch {
        Box::new(Article {
            headline: "News".into(),
            content: "Content".into(),
        })
    } else {
        Box::new(Tweet {
            username: "user".into(),
            content: "hello".into(),
        })
    }
}
```

> [!WARNING]
> `impl Trait` in return position requires a single concrete type. If you need to return different types conditionally, use `Box<dyn Trait>`.

## Trait Bounds on Structs

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T: PartialOrd> Pair<T> {
    fn larger(&self) -> &T {
        if self.x >= self.y { &self.x } else { &self.y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("larger: {}", self.x);
        } else {
            println!("larger: {}", self.y);
        }
    }
}
```

## Blanket Implementations

Implement a trait for all types that satisfy a bound:

```rust
use std::fmt::Display;

trait ToString {
    fn to_string(&self) -> String;
}

// Blanket: implement ToString for everything that implements Display
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
```

> [!SUCCESS]
> Blanket implementations are how Rust provides `.to_string()` on all Display types. They're powerful but use carefully to avoid conflicting implementations.

## Derive Macros

Common traits can be auto-derived:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
struct Config {
    host: String,
    port: u16,
}

// This generates implementations for all derived traits
```

| Trait | Purpose |
|-------|---------|
| `Debug` | `{:?}` formatting for debugging |
| `Clone` | `.clone()` for deep copy |
| `Copy` | Implicit bitwise copy (stack only) |
| `PartialEq` / `Eq` | `==` and `!=` comparison |
| `PartialOrd` / `Ord` | `<`, `>`, `<=`, `>=` ordering |
| `Hash` | Hashing for HashMap/HashSet |
| `Default` | `Type::default()` |

## Associated Types

Traits can have associated types:

```rust
trait Iterator {
    type Item;
    
    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: usize,
}

impl Iterator for Counter {
    type Item = usize;
    
    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        Some(self.count)
    }
}
```

## Supertraits

Traits can depend on other traits:

```rust
trait Printable: Display {  // Printable requires Display
    fn print(&self) {
        println!("{}", self); // uses Display
    }
}

// Or with where clause
trait Printable
where
    Self: Display,
{
    fn print(&self) {
        println!("{}", self);
    }
}
```

## Fully Qualified Syntax

When multiple traits have methods with the same name:

```rust
trait Pilot {
    fn fly(&self) -> String;
}

trait Wizard {
    fn fly(&self) -> String;
}

struct Human;

impl Pilot for Human {
    fn fly(&self) -> String { "pilot flying".into() }
}

impl Wizard for Human {
    fn fly(&self) -> String { "wizard flying".into() }
}

impl Human {
    fn fly(&self) -> String { "human walking".into() }
}

fn main() {
    let person = Human;
    println!("{}", person.fly());          // "human walking"
    println!("{}", Pilot::fly(&person));   // "pilot flying"
    println!("{}", Wizard::fly(&person));  // "wizard flying"
}
```

## Real-World: Serializable Config

```rust
use std::fmt;
use std::str::FromStr;

trait ConfigValue: fmt::Display + FromStr + Clone {}
impl<T: fmt::Display + FromStr + Clone> ConfigValue for T {}

#[derive(Debug, Clone)]
struct ConfigField<T: ConfigValue> {
    key: String,
    value: T,
    description: String,
}

impl<T: ConfigValue> ConfigField<T> {
    fn new(key: &str, value: T, description: &str) -> Self {
        ConfigField {
            key: key.into(),
            value,
            description: description.into(),
        }
    }
    
    fn update(&mut self, new_value: &str) -> Result<(), String> {
        self.value = T::from_str(new_value)
            .map_err(|_| format!("invalid value for {}", self.key))?;
        Ok(())
    }
}

fn main() {
    let mut port = ConfigField::new("port", 8080u16, "Server port");
    println!("{}: {} ({})", port.key, port.value, port.description);
    port.update("9090").unwrap();
    println!("Updated: {}", port.value);
}
```

## Practice Questions

1. What is a trait in Rust?
2. What's the orphan rule?
3. How do you provide a default implementation in a trait?
4. What's the difference between `impl Trait` and `Box<dyn Trait>`?
5. What is a blanket implementation?
6. What are derive macros and which common traits can be derived?
7. How are associated types different from generic parameters?
8. What's a supertrait and when would you use one?
9. How do you disambiguate between methods with the same name from different traits?
10. What's the `where` clause and why is it useful for complex bounds?
