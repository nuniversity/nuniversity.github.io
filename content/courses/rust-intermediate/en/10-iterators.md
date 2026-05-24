---
title: "Iterators"
description: "Master the Iterator trait, adapters (map, filter, fold, collect), consuming adapters, and lazy evaluation"
order: 10
duration: "45 minutes"
difficulty: "intermediate"
---

# Iterators

Iterators are Rust's idiomatic way to process sequences of values. They're lazy, composable, and compile down to efficient machine code — often faster than hand-written loops.

## The Iterator Trait

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // Many default methods...
}
```

Any type implementing `Iterator` can be used with iterator adapters:

```rust
struct Counter {
    count: usize,
    max: usize,
}

impl Counter {
    fn new(max: usize) -> Self {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = usize;
    
    fn next(&mut self) -> Option<Self::Item> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new(3);
    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), None);
}
```

> [!NOTE]
> The `Iterator` trait only requires `next()`. All other methods are default implementations built on top of `next()`.

## Consuming Adapters

These call `next()` until `None`:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // collect — collect into a collection
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // sum — sum all values
    let sum: i32 = numbers.iter().sum();
    println!("{sum}"); // 15
    
    // count — count elements
    let count = numbers.iter().count();
    println!("{count}"); // 5
    
    // fold — accumulate with initial value
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("{product}"); // 120
    
    // reduce — accumulate without initial value
    let sum = numbers.iter().cloned().reduce(|a, b| a + b);
    println!("{:?}", sum); // Some(15)
    
    // for_each — side effects
    numbers.iter().for_each(|x| print!("{x} "));
    println!();
    
    // any / all — predicates
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    let all_positive = numbers.iter().all(|x| x > &0);
    println!("has_even: {has_even}, all_positive: {all_positive}");
}
```

## Iterator Adapters (Lazy)

Adapters transform an iterator into another iterator. They're **lazy** — nothing happens until a consuming adapter is called:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // map — transform each element
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]
    
    // filter — keep elements matching predicate
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4]
    
    // filter_map — filter and map in one pass
    let parsed: Vec<i32> = vec!["1", "two", "3", "four"]
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("{:?}", parsed); // [1, 3]
    
    // flat_map — flatten nested iterators
    let words: Vec<String> = vec!["hello world", "rust is great"]
        .iter()
        .flat_map(|s| s.split_whitespace())
        .map(String::from)
        .collect();
    println!("{:?}", words);
    
    // take / skip
    let first3: Vec<i32> = numbers.iter().take(3).cloned().collect();
    let after2: Vec<i32> = numbers.iter().skip(2).cloned().collect();
    println!("take: {first3:?}, skip: {after2:?}");
    
    // chain — combine iterators
    let combined: Vec<i32> = vec![1, 2].iter().chain(vec![3, 4].iter()).cloned().collect();
    println!("{combined:?}"); // [1, 2, 3, 4]
    
    // zip — pair elements from two iterators
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![90, 85, 95];
    let paired: Vec<(&str, i32)> = names.iter().zip(scores.iter()).map(|(n, s)| (*n, *s)).collect();
    println!("{paired:?}");
}
```

> [!SUCCESS]
| Adapter | Purpose | Example |
|---------|---------|---------|
| `map` | Transform | `iter.map(\|x\| x * 2)` |
| `filter` | Keep matches | `iter.filter(\|x\| x > 0)` |
| `filter_map` | Filter + transform | `iter.filter_map(\|x\| x.parse().ok())` |
| `flat_map` | Flatten nested | `iter.flat_map(\|x\| x.split())` |
| `take` | Limit | `iter.take(5)` |
| `skip` | Skip first N | `iter.skip(5)` |
| `zip` | Pair up | `a.iter().zip(b.iter())` |
| `chain` | Concatenate | `a.iter().chain(b.iter())` |
| `enumerate` | Add index | `iter.enumerate()` |
| `step_by` | Skip steps | `iter.step_by(2)` |

## IntoIterator Trait

`for` loops use `IntoIterator` to convert types into iterators:

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // IntoIterator::into_iter consumes self
    for x in v { // v is consumed
        print!("{x} ");
    }
    // println!("{:?}", v); // ERROR: v moved
    
    // &Vec implements IntoIterator → yields &i32
    let v = vec![1, 2, 3];
    for x in &v {
        print!("{x} "); // x: &i32
    }
    
    // &mut Vec implements IntoIterator → yields &mut i32
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
}
```

| IntoIterator on | Yields | Effect |
|----------------|--------|--------|
| `Vec<T>` | `T` | Consumes vector |
| `&Vec<T>` | `&T` | Borrows |
| `&mut Vec<T>` | `&mut T` | Mutable borrow |

## Custom Iterator Methods

```rust
fn main() {
    // Chunked processing
    let data = vec![1, 2, 3, 4, 5, 6];
    
    for chunk in data.chunks(2) {
        println!("{:?}", chunk); // [1,2], [3,4], [5,6]
    }
    
    for window in data.windows(2) {
        println!("{:?}", window); // [1,2], [2,3], [3,4], [4,5], [5,6]
    }
}

// Custom iterator — Fibonacci
struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Iterator for Fibonacci {
    type Item = u64;
    
    fn next(&mut self) -> Option<Self::Item> {
        let current = self.curr;
        self.curr = self.next;
        self.next = current + self.next;
        Some(current)
    }
}

fn fibonacci() -> Fibonacci {
    Fibonacci { curr: 0, next: 1 }
}

fn main() {
    let fib: Vec<u64> = fibonacci().take(10).collect();
    println!("{:?}", fib); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
}
```

## Performance — Iterators vs Loops

Rust's iterators compile to the same machine code as hand-written loops:

```rust
// These compile to IDENTICAL assembly:
fn sum_with_loop(v: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..v.len() {
        sum += v[i];
    }
    sum
}

fn sum_with_iter(v: &[i32]) -> i32 {
    v.iter().sum()
}
```

> [!NOTE]
> Iterators are zero-cost abstractions. The compiler inlines and optimizes them away, producing code equivalent to the hand-written version.

## Real-World: Data Processing Pipeline

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Sale {
    product: String,
    amount: f64,
    quantity: u32,
}

fn analyze_sales(sales: Vec<Sale>) -> HashMap<String, f64> {
    sales
        .into_iter()
        .map(|s| (s.product, s.amount * s.quantity as f64))
        .fold(HashMap::new(), |mut acc, (product, total)| {
            *acc.entry(product).or_insert(0.0) += total;
            acc
        })
}

fn process_log(lines: Vec<String>) -> Vec<(usize, String)> {
    lines
        .into_iter()
        .enumerate()
        .filter(|(_, line)| !line.trim().is_empty())
        .filter(|(_, line)| !line.starts_with('#'))
        .map(|(i, line)| (i + 1, line))
        .collect()
}

fn main() {
    let sales = vec![
        Sale { product: "Widget".into(), amount: 10.0, quantity: 3 },
        Sale { product: "Gadget".into(), amount: 25.0, quantity: 2 },
        Sale { product: "Widget".into(), amount: 10.0, quantity: 1 },
        Sale { product: "Gizmo".into(), amount: 15.0, quantity: 5 },
    ];
    
    let revenue = analyze_sales(sales);
    for (product, total) in &revenue {
        println!("{product}: ${total:.2}");
    }
    
    let log = vec![
        "# Comment".into(),
        "INFO: started".into(),
        "".into(),
        "INFO: processing".into(),
        "ERROR: failed".into(),
    ];
    
    let cleaned = process_log(log);
    println!("{:?}", cleaned);
}
```

## Practice Questions

1. What's the only required method on the Iterator trait?
2. What's the difference between consuming and lazy adapters?
3. How does `collect` know what type to collect into?
4. What does `filter_map` do that separate `filter` and `map` can't?
5. How does `IntoIterator` enable `for` loops?
6. What's the difference between `fold` and `reduce`?
7. Are iterators slower than hand-written loops in Rust?
8. How do you create a custom iterator type?
9. What does `flat_map` do?
10. How would you process items in chunks using iterators?
