---
title: "Lifetime Annotations"
description: "Understand Rust's lifetime system: annotations, elision rules, struct lifetimes, and the 'static lifetime"
order: 7
duration: "45 minutes"
difficulty: "intermediate"
---

# Lifetime Annotations

Lifetimes ensure references are always valid. The borrow checker tracks them implicitly most of the time, but you need explicit annotations when Rust can't figure it out.

## Why Lifetimes?

Every reference has a **lifetime** — the scope for which the reference is valid. Most of the time, lifetimes are implicit (elided). But sometimes the compiler needs help:

```rust
// ERROR: missing lifetime specifier
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// Fixed with lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

> [!NOTE]
> The `'a` annotation says: "the returned reference lives at least as long as both `x` and `y`."

## Lifetime Annotation Syntax

```rust
// Single reference
fn foo<'a>(x: &'a i32) -> &'a i32 { x }

// Two references with same lifetime
fn bar<'a>(x: &'a str, y: &'a str) -> &'a str { x }

// Two references with different lifetimes
fn baz<'a, 'b>(x: &'a str, y: &'b str) -> &'a str { x }
```

### Lifetime Naming Convention

| Name | Convention | Example |
|------|------------|---------|
| `'a` | First lifetime | `fn foo<'a>(x: &'a str)` |
| `'b` | Second lifetime | `fn bar<'a, 'b>(x: &'a str, y: &'b str)` |
| `'static` | Special: entire program | `&'static str` |

## Lifetime Annotations in Functions

```rust
// Input lifetimes: 'a and 'b are independent
fn first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    x
}

// Return lifetime tied to first parameter
fn longer<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

// Multiple input lifetimes, output tied to both
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    announcement: &'b str,
) -> &'a str {
    println!("ANNOUNCEMENT: {announcement}");
    if x.len() > y.len() { x } else { y }
}
```

> [!SUCCESS]
| Pattern | Meaning |
|---------|---------|
| `<'a>(x: &'a str) -> &'a str` | Output lives as long as input |
| `<'a, 'b>(x: &'a str, _: &'b str) -> &'a str` | Output tied to first input |
| `<'a>(_: &str, y: &'a str) -> &'a str` | Output tied to second input |

## Lifetime Annotations in Structs

Structs can hold references, but they need lifetime annotations:

```rust
struct Excerpt<'a> {
    part: &'a str,  // Excerpt can't outlive its part
}

impl<'a> Excerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("{announcement}");
        self.part
    }
    // Returns &str with elided lifetime = &'a str
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    
    let excerpt = Excerpt { part: first_sentence };
    println!("{}", excerpt.part);
    
    // excerpt can't outlive novel
}
```

### Struct with Multiple References

```rust
struct MultiRef<'a, 'b> {
    x: &'a str,
    y: &'b str,
}

impl<'a, 'b> MultiRef<'a, 'b> {
    fn longer(&self) -> &str
    where
        'a: 'b,  // 'a outlives 'b
    {
        if self.x.len() > self.y.len() { self.x } else { self.y }
    }
}
```

## The 'static Lifetime

`'static` means the reference is valid for the **entire program**:

```rust
// String literals are &'static str
let s: &'static str = "hello";

// Static variables
static MAX_ITEMS: u32 = 100;
static GREETING: &str = "Hello, world!";

// Trait objects with 'static bound
fn handle<T: 'static>(t: T) { /* T has no non-'static references */ }
```

> [!WARNING]
> `'static` doesn't mean "lives forever at runtime" — it means "valid for the entire program's execution." Stack-allocated values with `'static` bounds can still be freed, just not while borrowed.

### Common Misconception

```rust
// This is often NOT what you want
fn returns_str() -> &'static str {
    let s = String::from("hello");
    // &s // ERROR: s doesn't live long enough
    "static literal" // OK: string literals are 'static
}
```

## Lifetime Elision Rules

Rust automatically adds lifetime annotations following three rules:

1. Each input reference gets its own lifetime.
2. If there's exactly one input lifetime, it's assigned to all outputs.
3. If there's `&self` or `&mut self`, its lifetime is assigned to all outputs.

```rust
// Rule 1: inputs get lifetimes
fn foo(x: &str)     → fn foo<'a>(x: &'a str)

// Rule 2: one input → same for output
fn bar(x: &str) -> &str  → fn bar<'a>(x: &'a str) -> &'a str

// Rule 2 applies:
fn first_word(s: &str) -> &str
// = fn first_word<'a>(s: &'a str) -> &'a str

// Rule 3: &self → same for output
impl Person {
    fn get_name(&self) -> &str
    // = fn get_name<'a>(&'a self) -> &'a str
    
    fn longest<'b>(&self, other: &'b str) -> &'b str
    // &self gets 'a, other gets 'b, return is 'b
}
```

### When Elision Fails

```rust
// Two inputs, no self → ambiguous
// fn compare(x: &str, y: &str) -> &str
// = fn compare<'a, 'b>(x: &'a str, y: &'b str) -> &??? 
// ERROR: can't infer which lifetime to return

// Fix: annotate
fn compare<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

## Lifetime Bounds

```rust
// T: 'a means T outlives 'a
struct Ref<'a, T: 'a> {
    data: &'a T,
}

// T: 'static means T has no non-'static references
fn process<T: 'static>(value: T) {
    // T can be safely stored forever
}
```

## Lifetime Subtyping

One lifetime can outlive another (variance):

```rust
// 'a: 'b means 'a outlives 'b (lifetime subtyping)
fn longer<'a, 'b>(x: &'a str, y: &'b str) -> &'a str
where
    'a: 'b,  // 'a lives at least as long as 'b
{
    if x.len() > y.len() { x } else { y }
}
```

## Real-World: String Parser with Lifetimes

```rust
#[derive(Debug)]
struct Parser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, pos: 0 }
    }
    
    fn next_word(&mut self) -> Option<&'a str> {
        let rest = &self.input[self.pos..];
        let trimmed = rest.trim_start();
        self.pos = rest.len() - trimmed.len(); // simplified
        
        if let Some(end) = trimmed.find(char::is_whitespace) {
            self.pos += rest.len() - trimmed.len() + end;
            Some(&trimmed[..end])
        } else if !trimmed.is_empty() {
            self.pos = self.input.len();
            Some(trimmed)
        } else {
            None
        }
    }
}

fn main() {
    let data = String::from("hello world rust");
    let mut parser = Parser::new(&data);
    
    while let Some(word) = parser.next_word() {
        println!("{word}");
    }
}
```

## Practice Questions

1. What problem do lifetime annotations solve?
2. What does `<'a>` mean in a function signature?
3. What are the three lifetime elision rules?
4. When must you write explicit lifetime annotations?
5. How do lifetimes work in struct definitions?
6. What is the `'static` lifetime?
7. What does `T: 'a` mean as a trait bound?
8. What is lifetime subtyping?
9. How does the compiler determine a reference's lifetime?
10. What happens if a reference outlives the data it points to?
