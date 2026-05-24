---
title: "Borrowing and References"
description: "Learn references, mutable references, borrowing rules, and slices — the key to using data without taking ownership"
order: 7
duration: "30 minutes"
difficulty: "beginner"
---

# Borrowing and References

Borrowing allows you to use a value without taking ownership. Instead of moving data, you pass a **reference** — a pointer that follows strict rules enforced at compile time.

## References (Immutable Borrowing)

A reference `&T` lets you read data without owning it:

```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);  // &s creates a reference
    println!("'{s}' is {len} chars"); // s still usable
}

fn calculate_length(s: &String) -> usize {
    s.len() // Read the string
    // s.push_str("!"); // ERROR: reference is immutable
}  // s is a reference, nothing is dropped
```

> [!NOTE]
> The opposite of referencing (`&`) is **dereferencing** (`*`). But Rust auto-dereferences in most situations, so you rarely need `*` explicitly.

### Memory View

```
Stack:
s (String) -> { ptr: 0x..., len: 5, cap: 5 }
                ^
                |
s_ref (&String) - points to s's stack data
```

## Mutable References

`&mut T` allows reading **and** writing:

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{s}"); // "hello, world"
}

fn change(s: &mut String) {
    s.push_str(", world");
}
```

> [!WARNING]
> You can only have **one** mutable reference to a value at a time. This prevents data races at compile time.

## The Borrowing Rules

Rust enforces two rules at compile time:

1. **At any time, you have either** one mutable reference **or** any number of immutable references.
2. **References must always be valid** (no dangling pointers).

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &s;    // OK: multiple immutable refs
    let r2 = &s;    // OK
    println!("{r1} {r2}");
    // r1 and r2 no longer used here
    
    let r3 = &mut s; // OK: no immutable refs in use
    println!("{r3}");
}
```

### Violations the Compiler Catches

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &s;      // immutable borrow starts
    let r2 = &s;      // immutable borrow starts
    // let r3 = &mut s; // ERROR: cannot borrow as mutable because also immutable
    println!("{r1} {r2}");
    // immutable borrows end here
    
    let r3 = &mut s;  // OK now
    println!("{r3}");
}
```

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &mut s;  // mutable borrow starts
    // let r2 = &s;   // ERROR: cannot borrow as immutable
    // println!("{r2}");
    
    r1.push_str("!");
    println!("{r1}");
    // mutable borrow ends here
}
```

> [!SUCCESS]
| Scenario | Allowed? | Why |
|----------|----------|-----|
| Multiple `&T` | Yes | Read-only, no conflict |
| One `&mut T` | Yes | Exclusive write access |
| `&T` + `&mut T` simultaneously | No | Could read while writing |
| Two `&mut T` simultaneously | No | Two writers = data race |

## Dangling References

Rust prevents dangling references at compile time:

```rust
// fn dangle() -> &String {  // ERROR: missing lifetime specifier
//     let s = String::from("hello");
//     &s
// } // s dropped, reference would be invalid

fn no_dangle() -> String {
    let s = String::from("hello");
    s  // Ownership moves out, no dangling
}
```

> [!NOTE]
> The borrow checker ensures references never outlive the data they point to. This eliminates use-after-free bugs entirely.

## The Rules in Practice

```rust
fn main() {
    let mut data = vec![1, 2, 3];
    
    // Immutable reference — fine
    let view = &data;
    println!("{:?}", view);
    
    // Mutable operations — fine (no references active)
    data.push(4);
    println!("{:?}", data);
    
    // Scope control
    let r1 = &data;
    let r2 = &data;
    println!("{r1:?} {r2:?}"); // Last use of immutable refs
    
    let r3 = &mut data;
    r3.push(5);
    println!("{r3:?}");
}
```

## Slices — References to Contiguous Elements

Slices are references to a contiguous sequence within a collection. They are **fat pointers** (pointer + length).

### String Slices

```rust
fn main() {
    let s = String::from("hello world");
    
    let hello = &s[0..5];  // "hello"
    let world = &s[6..11]; // "world"
    
    println!("'{hello}' '{world}'");
    
    // Shorthand syntax
    let whole = &s[..];    // "hello world"
    let from_start = &s[..5]; // "hello"
    let to_end = &s[6..];  // "world"
}
```

> [!WARNING]
> String slices must be on valid UTF-8 character boundaries. Slicing in the middle of a multi-byte character will panic.

### Array Slices

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..4];  // &[i32] — type is [2, 3, 4]
    
    for item in slice {
        println!("{item}");
    }
    
    println!("len: {}", slice.len()); // 3
}
```

### The Slice Type

```rust
fn first_word(s: &str) -> &str {  // &str is a string slice
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s);
    println!("{word}"); // "hello"
}
```

### &str vs String

| Type | Owned? | Mutable? | Memory |
|------|--------|----------|--------|
| `String` | Yes | Yes | Heap-allocated |
| `&str` | No | No | View into existing data |
| `&mut str` | No | Yes | Rarely used |

> [!SUCCESS]
> Use `&str` for function parameters when you only need to read string data. It's more flexible than `&String` because it accepts both `&String` and `&str`.

## Borrowing with Functions

```rust
// Prefer &str over &String for parameters
fn print_message(msg: &str) {
    println!("{msg}");
}

fn main() {
    let s = String::from("hello");
    print_message(&s);     // &String auto-coerces to &str
    print_message("world"); // &str literal works directly
}
```

## NLL (Non-Lexical Lifetimes)

Since Rust 2018, borrows live until their **last use**, not until the end of scope:

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r = &s;
    println!("{r}");   // Last use of immutable borrow
    // r is "done" here
    
    let m = &mut s;    // OK: immutable borrow ended
    m.push_str("!");
}
```

## Real-World: Safe CSV Line Parser

```rust
fn parse_csv_line(line: &str) -> Vec<&str> {
    line.split(',').map(|s| s.trim()).collect()
}

fn main() {
    let data = String::from("Alice,30,Engineer\nBob,25,Designer");
    
    for line in data.lines() {
        let fields = parse_csv_line(line);
        println!("Name: {}, Age: {}, Role: {}", fields[0], fields[1], fields[2]);
    }
}
```

## Practice Questions

1. What is the difference between a reference and ownership?
2. How many mutable references can exist at the same time?
3. How many immutable references can exist at the same time?
4. What rule prevents data races in Rust?
5. How does Rust prevent dangling references?
6. What is a string slice (`&str`)?
7. Why should you use `&str` instead of `&String` in function parameters?
8. What is a "fat pointer"?
9. How do NLL (Non-Lexical Lifetimes) improve ergonomics?
10. What happens if you slice a string at a non-UTF-8 boundary?
