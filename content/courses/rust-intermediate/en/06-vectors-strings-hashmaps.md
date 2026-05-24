---
title: "Vectors, Strings, and HashMaps"
description: "Master Rust's standard collection types with common operations, iterating, and the Entry API"
order: 6
duration: "45 minutes"
difficulty: "intermediate"
---

# Vectors, Strings, and HashMaps

Rust's standard library provides powerful, efficient collections. Understanding their internals and APIs is essential for productive Rust development.

## Vec\<T\> — Growable Arrays

Vectors store elements of the same type in contiguous heap memory:

```rust
fn main() {
    // Creation
    let mut v1: Vec<i32> = Vec::new();
    let v2 = vec![1, 2, 3];
    let v3 = vec![0; 5]; // [0, 0, 0, 0, 0]
    
    // Adding and removing
    v1.push(10);
    v1.push(20);
    v1.push(30);
    
    let last = v1.pop(); // Some(30)
    let first = v1.remove(0); // 10
    
    // Access
    let third = &v2[2]; // 3 — panics if out of bounds
    let safe = v2.get(2); // Some(&3) — returns Option
    let out = v2.get(100); // None — safe
    
    // Update
    if let Some(x) = v1.get_mut(0) {
        *x = 42;
    }
}
```

> [!NOTE]
| Operation | Returns | Panics? | Cost |
|-----------|---------|---------|------|
| `vec[i]` | `&T` | Yes (OOB) | O(1) |
| `vec.get(i)` | `Option<&T>` | No | O(1) |
| `vec.push(x)` | `()` | No (may realloc) | O(1) amortized |
| `vec.pop()` | `Option<T>` | No | O(1) |
| `vec.insert(i, x)` | `()` | Yes (OOB) | O(n) |
| `vec.remove(i)` | `T` | Yes (OOB) | O(n) |

### Iterating

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // Immutable iteration
    for x in &v {
        println!("{x}");
    }
    
    // Mutable iteration
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
    
    // Consuming iteration
    for x in v { // v is moved
        println!("{x}");
    }
    // println!("{:?}", v); // ERROR: v moved
    
    // Various adapters
    let doubled: Vec<i32> = vec![1, 2, 3].iter().map(|x| x * 2).collect();
    let evens: Vec<&i32> = vec![1, 2, 3, 4].iter().filter(|x| *x % 2 == 0).collect();
    let sum: i32 = vec![1, 2, 3].iter().sum();
}
```

### Vector Capacity

```rust
fn main() {
    let mut v = Vec::with_capacity(100);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 0, 100
    
    v.push(1);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 100
    
    v.shrink_to_fit();
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 1
    
    // Reserve more
    v.reserve(1000);
    println!("cap: {}", v.capacity()); // 1001
}
```

> [!SUCCESS]
> Pre-allocate with `Vec::with_capacity(n)` when you know the expected size. This avoids repeated reallocations.

## String — UTF-8 Text

`String` is a `Vec<u8>` that guarantees valid UTF-8:

```rust
fn main() {
    // Creation
    let mut s = String::new();
    let s1 = String::from("hello");
    let s2 = "world".to_string();
    let s3 = format!("{s1} {s2}");
    
    // Appending
    s.push('!');        // Single character
    s.push_str(" world"); // String slice
    
    // Concatenation
    let combined = s1 + &s2; // s1 moved, &s2 borrowed
    // println!("{s1}"); // ERROR: moved
    let combined = format!("{} {}", "hello", "world"); // No move
    
    // Indexing — NOT supported by char index
    // let c = s[0]; // ERROR: String doesn't support index
}
```

> [!WARNING]
> Strings don't support O(1) indexing because UTF-8 is variable-width. `s[i]` would be O(n) and could split a character. Use `.chars()` or `.bytes()` instead.

### String Operations

```rust
fn main() {
    let s = "hello world".to_string();
    
    // Iteration
    for c in s.chars() {         // Unicode graphemes
        print!("{c} ");
    }
    println!();
    
    for b in s.bytes() {         // Raw bytes
        print!("{b} ");
    }
    println!();
    
    // Slicing (careful!)
    let hello = &s[0..5]; // "hello"
    // let bad = &s[0..4]; // PANICS: not on char boundary
    
    // Searching and replacing
    println!("contains 'world': {}", s.contains("world"));
    let replaced = s.replace("world", "Rust");
    println!("{replaced}");
    
    // Splitting
    let words: Vec<&str> = s.split(' ').collect();
    println!("{:?}", words);
    
    // Trimming
    let padded = "  hello  ".to_string();
    println!("'{}'", padded.trim());
}
```

### String vs &str

| Aspect | `String` | `&str` |
|--------|----------|--------|
| Owned | Yes | No (borrowed) |
| Mutable | Yes | No |
| Heap allocated | Yes | Points to existing memory |
| Length | `len()` in bytes | `len()` in bytes |
| Use in params | Prefer `&str` | Prefer `&str` |

### Building Strings Efficiently

```rust
fn main() {
    // Bad: many allocations
    let mut s = String::new();
    for i in 0..100 {
        s = s + &i.to_string(); // New allocation each time!
    }
    
    // Good: pre-allocate
    let mut s = String::with_capacity(300);
    for i in 0..100 {
        s.push_str(&i.to_string());
    }
    
    // Best: use collect
    let s: String = (0..100).map(|i| i.to_string()).collect();
}
```

## HashMap\<K, V\> — Key-Value Store

```rust
use std::collections::HashMap;

fn main() {
    // Creation
    let mut scores: HashMap<String, i32> = HashMap::new();
    
    // Insert
    scores.insert(String::from("Alice"), 100);
    scores.insert(String::from("Bob"), 90);
    
    // Access
    let alice = scores.get("Alice"); // Some(&100)
    let charlie = scores.get("Charlie"); // None
    
    // Iterate
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
    
    // Check existence
    if scores.contains_key("Alice") {
        println!("Alice is in the map");
    }
    
    // Remove
    scores.remove("Bob");
}
```

### The Entry API

The most idiomatic way to work with HashMaps:

```rust
use std::collections::HashMap;

fn main() {
    let mut word_count = HashMap::new();
    let text = "hello world hello Rust hello";
    
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    
    println!("{:?}", word_count);
    // {"hello": 3, "world": 1, "Rust": 1}
}
```

| Entry Method | Behavior |
|-------------|----------|
| `or_insert(v)` | Insert v if absent, return &mut V |
| `or_insert_with(fn)` | Insert fn() result if absent |
| `or_default()` | Insert V::default() if absent |
| `and_modify(fn)` | Modify existing value if present |

### HashMap Performance Tips

```rust
use std::collections::HashMap;

fn main() {
    // Pre-allocate capacity
    let mut map: HashMap<&str, i32> = HashMap::with_capacity(1000);
    
    // Use entry API for insert-or-modify
    map.entry("key").and_modify(|v| *v += 1).or_insert(1);
    
    // Custom hasher (for performance)
    use std::collections::hash_map::RandomState;
    let fast_map: HashMap<&str, i32, RandomState> = HashMap::default();
}
```

## Other Useful Collections

| Collection | Description | Use Case |
|------------|-------------|----------|
| `VecDeque<T>` | Double-ended queue | FIFO, push/pop both ends |
| `LinkedList<T>` | Doubly-linked list | Rare, heavy fragmentation |
| `HashSet<T>` | Set of unique values | Deduplication, membership |
| `BTreeMap<K, V>` | Sorted key-value | Ordered iteration |
| `BTreeSet<T>` | Sorted set | Sorted unique values |
| `BinaryHeap<T>` | Priority queue | Max-heap, priority processing |

```rust
use std::collections::{VecDeque, HashSet, BTreeMap, BinaryHeap};

fn main() {
    // VecDeque — efficient queue
    let mut queue = VecDeque::new();
    queue.push_back(1);
    queue.push_front(0);
    assert_eq!(queue.pop_front(), Some(0));
    
    // HashSet — fast membership test
    let mut seen = HashSet::new();
    seen.insert("hello");
    assert!(seen.contains("hello"));
    
    // BTreeMap — sorted keys
    let mut sorted = BTreeMap::new();
    sorted.insert("b", 2);
    sorted.insert("a", 1);
    for (k, v) in &sorted {
        println!("{k}: {v}"); // a: 1, b: 2 (sorted)
    }
    
    // BinaryHeap — max heap
    let mut heap = BinaryHeap::new();
    heap.push(3);
    heap.push(1);
    heap.push(5);
    assert_eq!(heap.pop(), Some(5)); // Largest first
}
```

## Real-World: Word Frequency Analyzer

```rust
use std::collections::HashMap;

fn word_frequency(text: &str) -> Vec<(String, usize)> {
    let mut freq: HashMap<String, usize> = HashMap::new();
    
    for word in text
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| !w.is_empty())
    {
        *freq.entry(word.to_string()).or_insert(0) += 1;
    }
    
    let mut result: Vec<_> = freq.into_iter().collect();
    result.sort_by(|a, b| b.1.cmp(&a.1));
    result.truncate(10);
    result
}

fn main() {
    let text = "The quick brown fox jumps over the lazy dog. The dog slept. The fox jumped again.";
    let top_words = word_frequency(text);
    
    for (word, count) in top_words {
        println!("{word}: {count}");
    }
}
```

## Practice Questions

1. What's the difference between `Vec::new()` and `vec![]`?
2. How do you safely access a vector element without panicking?
3. What's the capacity of a vector and why does it matter?
4. Why doesn't `String` support indexing by character position?
5. How do you iterate over the characters of a String?
6. When should you use `&str` vs `String` in function parameters?
7. What does the Entry API provide that direct insert doesn't?
8. How do you update a value in a HashMap if it exists, or insert if it doesn't?
9. What collections would you use for a priority queue?
10. How do you pre-allocate a HashMap for better performance?
