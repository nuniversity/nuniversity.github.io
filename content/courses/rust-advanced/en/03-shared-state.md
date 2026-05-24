---
title: "Shared State — Mutex, RwLock, Arc, and Atomics"
description: "Master shared-state concurrency with Mutex, RwLock, Arc, and atomic types for lock-free programming"
order: 3
duration: "90 minutes"
difficulty: advanced
---

# Shared State — Mutex, RwLock, Arc, and Atomics

While message passing is great, shared state is sometimes the right tool. Rust's type system ensures shared state is accessed safely.

## Mutex\<T\> — Mutual Exclusion

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(42);
    
    // Lock to access data
    {
        let mut guard = mutex.lock().unwrap();
        *guard += 1;
        println!("Inside lock: {guard}");
    } // Lock released here
    
    println!("{:?}", mutex); // Mutex { data: 43, ... }
}
```

### Mutex Internals

```
Mutex<T> {
    data: T,          // Protected data
    inner: {          // OS-level mutex
        locked: AtomicBool,
        queue: WaitQueue,
    },
}
```

### Poisoning

When a thread panics while holding a lock, the mutex is **poisoned**:

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(10);
    
    // Thread panics while holding lock
    let handle = std::thread::spawn(move || {
        let guard = mutex.lock().unwrap();
        panic!("panic while holding lock");
        drop(guard); // Never reached
    });
    
    assert!(handle.join().is_err());
    // mutex is now poisoned
}
```

| Method | Behavior on Poison |
|--------|-------------------|
| `lock().unwrap()` | Panics if poisoned |
| `lock().unwrap_or_else(poisoned)` | Can recover with `.into_inner()` |
| `.into_inner()` | Consumes mutex, returns data |

> [!WARNING]
> A poisoned mutex means the protected data may be in an inconsistent state. Use `lock().unwrap_or_else(|e| e.into_inner())` to recover if you're sure it's safe.

### MutexGuard — RAII Lock

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(vec![1, 2, 3]);
    
    // MutexGuard implements Deref and DerefMut
    let mut guard = mutex.lock().unwrap();
    guard.push(4);
    
    // With map — access a field inside the lock
    let first: std::sync::MutexGuard<'_, i32> = std::sync::MutexGuard::map(guard, |v| &mut v[0]);
    *first = 10;
    // guard is no longer valid, first holds lock
    drop(first); // Lock released
}
```

## RwLock\<T\> — Read-Write Lock

Multiple readers OR one writer:

```rust
use std::sync::RwLock;

fn main() {
    let rwlock = RwLock::new(42);
    
    // Multiple concurrent readers
    {
        let r1 = rwlock.read().unwrap();
        let r2 = rwlock.read().unwrap(); // OK: multiple readers
        println!("{r1} {r2}");
    } // Readers released
    
    // Exclusive writer
    {
        let mut w = rwlock.write().unwrap();
        *w += 1;
    }
}
```

| Lock | Readers | Writers | Use Case |
|------|---------|---------|----------|
| <code>Mutex&lt;T&gt;</code> | 1 at a time | 1 at a time | Simple exclusive access |
| <code>RwLock&lt;T&gt;</code> | Unlimited | 1 at a time | Read-heavy workloads |

> [!SUCCESS]
> Use `RwLock` when reads vastly outnumber writes. For workloads with frequent writes, `Mutex` is usually faster due to lower overhead.

### RwLock Starvation

```rust
use std::sync::RwLock;
use std::thread;

fn main() {
    let lock = RwLock::new(0);
    let lock = std::sync::Arc::new(lock);
    
    // Writer may starve if readers are continuous
    // Use RwLock::try_read() and RwLock::try_write() for non-blocking
    // Use parking_lot::RwLock for fair locking
}
```

| Method | Blocking? | Returns |
|--------|-----------|---------|
| `read()` | Yes | <code>RwLockReadGuard&lt;T&gt;</code> |
| `try_read()` | No | `Result<RwLockReadGuard<T>, TryLockError>` |
| `write()` | Yes | <code>RwLockWriteGuard&lt;T&gt;</code> |
| `try_write()` | No | `Result<RwLockWriteGuard<T>, TryLockError>` |

## Arc — Atomic Reference Counting

`Arc<T>` enables shared ownership across threads:

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);
    let mut handles = vec![];
    
    for _ in 0..5 {
        let data = Arc::clone(&data); // Atomic increment
        handles.push(thread::spawn(move || {
            println!("{:?}", data);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    // All clones dropped, data freed
}
```

### Arc Internals

```
Arc<T> {
    ptr: NonNull<ArcInner<T>>,
}

ArcInner<T> {
    strong: AtomicUsize,  // Reference count
    weak: AtomicUsize,    // Weak reference count
    data: T,
}
```

### Weak — Breaking Cycles

```rust
use std::sync::{Arc, Weak};

fn main() {
    let shared: Arc<String> = Arc::new("hello".to_string());
    let weak: Weak<String> = Arc::downgrade(&shared);
    
    // Upgrade to check if still alive
    match weak.upgrade() {
        Some(data) => println!("Still alive: {data}"),
        None => println!("Data was dropped"),
    }
    
    drop(shared);
    assert!(weak.upgrade().is_none());
}
```

## Atomics — Lock-Free Programming

Atomic types provide lock-free, thread-safe operations:

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;

fn main() {
    let flag = AtomicBool::new(false);
    let counter = AtomicUsize::new(0);
    
    let flag = std::sync::Arc::new(flag);
    let counter = std::sync::Arc::new(counter);
    
    let mut handles = vec![];
    for _ in 0..10 {
        let flag = Arc::clone(&flag);
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            counter.fetch_add(1, Ordering::SeqCst);
            flag.store(true, Ordering::SeqCst);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("counter: {}", counter.load(Ordering::SeqCst));
    println!("flag: {}", flag.load(Ordering::SeqCst));
}
```

### Atomic Types

| Type | Size | Use Case |
|------|------|----------|
| `AtomicBool` | 1 byte | Flags, control signals |
| `AtomicI32` / `AtomicU32` | 4 bytes | Counters, state |
| `AtomicI64` / `AtomicU64` | 8 bytes | Larger counters |
| `AtomicUsize` | arch bytes | Pointer-sized counters |
| <code>AtomicPtr&lt;T&gt;</code> | arch bytes | Lock-free data structures |

### Ordering

Memory ordering controls visibility of atomic operations:

```rust
use std::sync::atomic::Ordering;

// Relaxed — no ordering guarantees (fastest)
x.store(5, Ordering::Relaxed);
y.load(Ordering::Relaxed);

// Acquire — subsequent reads see the write
// Release — previous writes are visible to acquire
x.store(5, Ordering::Release);
y.load(Ordering::Acquire); // Sees x = 5

// SeqCst — strongest guarantee
// All threads see operations in the same order
x.store(5, Ordering::SeqCst);
y.load(Ordering::SeqCst);
```

> [!WARNING]
| Ordering | Guarantee | Cost |
|----------|-----------|------|
| `Relaxed` | No ordering | Zero |
| `Acquire`/`Release` | happens-before | Moderate |
| `AcqRel` | Acquire + Release | Moderate |
| `SeqCst` | Sequential consistency | Highest (but usually fine) |

### Atomic Operations

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let counter = AtomicUsize::new(0);
    
    // Fetch-and-modify
    counter.fetch_add(5, Ordering::SeqCst);
    counter.fetch_sub(3, Ordering::SeqCst);
    
    // Compare-and-swap (CAS)
    let mut current = counter.load(Ordering::SeqCst);
    loop {
        let new = current + 1;
        match counter.compare_exchange(
            current,
            new,
            Ordering::SeqCst,
            Ordering::SeqCst,
        ) {
            Ok(_) => break,
            Err(actual) => current = actual, // Retry with updated value
        }
    }
    
    // Swap
    let old = counter.swap(100, Ordering::SeqCst);
    
    println!("Final: {}", counter.load(Ordering::SeqCst)); // 100
}
```

## Real-World: Concurrent Counter

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

struct ConcurrentCounter {
    value: AtomicUsize,
}

impl ConcurrentCounter {
    fn new() -> Self {
        ConcurrentCounter { value: AtomicUsize::new(0) }
    }
    
    fn increment(&self) -> usize {
        self.value.fetch_add(1, Ordering::SeqCst)
    }
    
    fn get(&self) -> usize {
        self.value.load(Ordering::SeqCst)
    }
}

fn main() {
    let counter = Arc::new(ConcurrentCounter::new());
    let mut handles = vec![];
    
    for _ in 0..100 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                counter.increment();
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("Final count: {}", counter.get()); // 100000
}
```

## Practice Questions

1. What's the difference between `Mutex` and `RwLock`?
2. What does it mean when a mutex is poisoned?
3. How do you recover from a poisoned mutex?
4. What's the difference between `Arc` and `Rc`?
5. When should you use `Weak` instead of `Arc`?
6. What are atomic types and when are they useful?
7. What do the different memory orderings mean?
8. How does compare-and-swap (CAS) work?
9. What's the advantage of `RwLock` over `Mutex` for read-heavy workloads?
10. How do you atomically increment a shared counter?
