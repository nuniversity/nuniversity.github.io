---
title: "Threading — spawn, join, and Send + Sync"
description: "Master OS threads in Rust: spawn, join, move closures, scoped threads, and the Send + Sync traits for data-race freedom"
order: 1
duration: "90 minutes"
difficulty: advanced
---

# Threading — spawn, join, and Send + Sync

Rust provides OS threads through `std::thread`. Combined with the ownership system, it guarantees **data-race freedom** at compile time — no other language offers this without a runtime or garbage collector.

## Basic Threading

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("child: {i}");
            thread::sleep(Duration::from_millis(1));
        }
    });
    
    for i in 1..5 {
        println!("main: {i}");
        thread::sleep(Duration::from_millis(1));
    }
    
    handle.join().unwrap(); // Wait for child to finish
}
```

> [!NOTE]
> When the main thread exits, all child threads are terminated regardless of their state. Always `join()` threads if you need them to complete.

### Thread Handle API

```rust
use std::thread;

fn main() {
    let handle: thread::JoinHandle<i32> = thread::spawn(|| {
        // Do work
        42  // Return value from thread
    });
    
    // Block until thread finishes, get the result
    match handle.join() {
        Ok(result) => println!("Thread returned: {result}"),
        Err(e) => eprintln!("Thread panicked: {:?}", e),
    }
    
    // Non-blocking check (thread is detached if dropped)
    let handle = thread::spawn(|| {});
    let is_finished = handle.is_finished(); // Check without blocking
}
```

## Move Closures with Threads

Threads can outlive their spawning scope. The `move` keyword transfers ownership:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    
    // ERROR: closure may outlive the enclosing function
    // thread::spawn(|| {
    //     println!("{:?}", v);
    // });
    
    // FIX: move ownership to the thread
    let handle = thread::spawn(move || {
        println!("{:?}", v);
    });
    
    handle.join().unwrap();
    // println!("{:?}", v); // ERROR: v was moved
}
```

> [!WARNING]
> `move` forces the closure to take ownership of all captured variables. If you need to share access (not move), use `Arc` (covered in shared state).

### Partial Move with Threads

```rust
use std::thread;

fn main() {
    let name = String::from("worker");
    let data = vec![1, 2, 3];
    
    // Can't selectively move — all captured variables are moved
    let handle = thread::spawn(move || {
        println!("{name} processing: {:?}", data);
    });
    
    handle.join().unwrap();
}
```

## Thread Builder — Customizing Threads

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new()
        .name("worker-1".into())
        .stack_size(1024 * 1024); // 1 MB stack
    
    let handle = builder.spawn(|| {
        println!("Running in: {:?}", thread::current().name());
        42
    }).unwrap();
    
    println!("Result: {}", handle.join().unwrap());
}
```

| Builder Method | Purpose |
|----------------|---------|
| `.name(name)` | Set thread name (useful for debugging) |
| `.stack_size(size)` | Set stack size (default: 2MB) |
| `.spawn(f)` | Create the thread |

## Scoped Threads

`thread::scope` allows borrowing data without `move`:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let mut results = vec![];
    
    // Scoped threads can borrow from the parent
    thread::scope(|s| {
        s.spawn(|| {
            // Can borrow v without move
            results.push(v.iter().sum::<i32>());
        });
        s.spawn(|| {
            results.push(v.iter().product::<i32>());
        });
    }); // All threads join here
    
    println!("{results:?}"); // [6, 6]
    println!("{v:?}"); // v still accessible
}
```

> [!SUCCESS]
| Feature | `thread::spawn` | `thread::scope` |
|---------|-----------------|-----------------|
| Captures | Must be `'static` | Can borrow locally |
| Auto-join | No | Yes (at scope end) |
| Return values | Via JoinHandle | Via spawned handle |

## Thread Communication — Basic Patterns

```rust
use std::thread;

fn main() {
    // Compute in parallel, collect results
    let mut handles = vec![];
    
    for i in 0..5 {
        let handle = thread::spawn(move || {
            i * i
        });
        handles.push(handle);
    }
    
    let results: Vec<i32> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();
    
    println!("{results:?}"); // [0, 1, 4, 9, 16]
}
```

## Send and Sync Traits

These marker traits are at the heart of Rust's thread safety:

| Trait | Meaning | Auto-implemented? |
|-------|---------|-------------------|
| `Send` | Ownership can be transferred between threads | Yes (unless `Rc`, raw pointers, etc.) |
| `Sync` | Shared reference `&T` can be sent between threads | Yes (unless `Cell`, `RefCell`, etc.) |

```rust
use std::thread;
use std::rc::Rc;

fn main() {
    // Rc is NOT Send — can't move between threads
    // let rc = Rc::new(5);
    // thread::spawn(move || { println!("{rc}"); });
    
    // Arc IS Send — can be moved between threads
    let arc = std::sync::Arc::new(5);
    let arc_clone = arc.clone();
    thread::spawn(move || {
        println!("{}", arc_clone);
    }).join().unwrap();
}
```

### How the Compiler Enforces Thread Safety

```rust
use std::cell::Cell;
use std::thread;

struct NotSync {
    cell: Cell<i32>,
}

// NotSync is !Sync because Cell is !Sync

fn main() {
    let ns = NotSync { cell: Cell::new(42) };
    
    // ERROR: NotSync cannot be shared between threads safely
    // thread::scope(|s| {
    //     s.spawn(|| {
    //         println!("{}", ns.cell.get());
    //     });
    // });
}
```

> [!WARNING]
| Type | Send? | Sync? | Reason |
|------|-------|-------|--------|
| <code>Rc&lt;T&gt;</code> | No | No | Non-atomic ref counting |
| <code>Arc&lt;T&gt;</code> | Yes | Yes | Atomic ref counting |
| <code>Cell&lt;T&gt;</code> | Yes | No | Interior mutability, no sync |
| <code>RefCell&lt;T&gt;</code> | Yes | No | Interior mutability, no sync |
| <code>Mutex&lt;T&gt;</code> | Yes | Yes | Provides Sync |
| `AtomicBool` | Yes | Yes | Atomic operations |

## Thread-Local Storage

```rust
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<u32> = RefCell::new(0);
}

fn main() {
    // Each thread gets its own COUNTER
    let h1 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            *c.borrow_mut() = 42;
            println!("Thread 1: {}", c.borrow());
        });
    });
    
    let h2 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            println!("Thread 2: {}", c.borrow()); // 0, not 42
        });
    });
    
    h1.join().unwrap();
    h2.join().unwrap();
}
```

## Real-World: Parallel Image Processing

```rust
use std::thread;

fn process_pixel(pixel: u8) -> u8 {
    // Simulate expensive computation
    pixel.saturating_mul(2)
}

fn process_image_parallel(image: Vec<u8>, num_threads: usize) -> Vec<u8> {
    let chunk_size = (image.len() + num_threads - 1) / num_threads;
    let mut handles = vec![];
    
    for chunk in image.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        handles.push(thread::spawn(move || {
            chunk.into_iter().map(process_pixel).collect::<Vec<_>>()
        }));
    }
    
    let mut result = Vec::with_capacity(image.len());
    for handle in handles {
        result.extend(handle.join().unwrap());
    }
    result
}

fn main() {
    let image: Vec<u8> = (0..100).collect();
    let processed = process_image_parallel(image.clone(), 4);
    println!("Original: {:?}", &image[..10]);
    println!("Processed: {:?}", &processed[..10]);
}
```

## Practice Questions

1. How do you create a thread and wait for it to finish?
2. Why must closures passed to `thread::spawn` use `move`?
3. What's the difference between `thread::spawn` and scoped threads?
4. What does `handle.join()` return?
5. What are the `Send` and `Sync` traits?
6. Which standard types are NOT `Send`? Why?
7. What is scoped threading (`thread::scope`) and when is it useful?
8. How do you customize a thread's name and stack size?
9. How does the compiler prevent data races in threaded code?
10. What is thread-local storage and how is it used?
