---
title: "Async/Await and Tokio"
description: "Master Rust's async/await syntax, the Tokio runtime, async tasks, and building concurrent async applications"
order: 4
duration: "90 minutes"
difficulty: advanced
---

# Async/Await and Tokio

Async Rust enables concurrent I/O with minimal overhead. Unlike OS threads, async tasks are lightweight and multiplexed onto a few threads.

## Why Async?

| Approach | Per-task Cost | Max Tasks | CPU Utilization |
|----------|---------------|-----------|-----------------|
| OS thread | ~2 MB stack | Thousands | Preemptive |
| Green thread | Variable | Many | Preemptive |
| **Rust async** | **~few bytes** | **Millions** | **Cooperative** |

```rust
// Threads — heavy per-task cost
use std::thread;
fn thread_example() {
    for i in 0..100 {
        thread::spawn(move || {
            // Each thread: ~2 MB stack, syscall overhead
            println!("{i}");
        });
    }
}

// Async — lightweight
async fn async_example(i: usize) {
    // Each task: small state machine, no stack
    println!("{i}");
}
```

> [!NOTE]
> Async is ideal for I/O-bound workloads (web servers, databases, network services). For CPU-bound work, use threads instead.

## Async/Await Syntax

```rust
use std::time::Duration;

// Define an async function
async fn do_something() -> u32 {
    42
}

// Await inside an async function
async fn process() {
    let result = do_something().await;
    println!("{result}");
}

// Read a file asynchronously
async fn read_file(path: &str) -> String {
    tokio::fs::read_to_string(path).await.unwrap()
}
```

### What Async Functions Really Are

```rust
// This async function:
async fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Desugars to:
fn add(a: i32, b: i32) -> impl Future<Output = i32> {
    async move { a + b }
}
```

## The Tokio Runtime

Tokio is the de facto async runtime for Rust:

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main]
async fn main() {
    println!("Hello from Tokio!");
}

// Equivalent to:
fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        println!("Hello from Tokio!");
    });
}
```

> [!SUCCESS]
| Attribute | What It Does |
|-----------|-------------|
| `#[tokio::main]` | Wraps main with Tokio runtime |
| `#[tokio::test]` | Runs test on Tokio runtime |
| `#[tokio::main(flavor = "current_thread")]` | Single-threaded runtime |
| `#[tokio::main(worker_threads = 4)]` | Multi-threaded, 4 workers |

## tokio::spawn — Concurrent Tasks

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        sleep(Duration::from_secs(1)).await;
        "world"
    });
    
    println!("hello ");
    let result = handle.await.unwrap();
    println!("{result}"); // "hello world"
}
```

### Multiple Concurrent Tasks

```rust
use tokio::time::{sleep, Duration};

async fn task(name: &str, secs: u64) {
    println!("{name} starting");
    sleep(Duration::from_secs(secs)).await;
    println!("{name} done");
}

#[tokio::main]
async fn main() {
    let mut handles = vec![];
    
    for i in 0..5 {
        handles.push(tokio::spawn(task(&format!("task-{i}"), i)));
    }
    
    // Wait for all tasks
    for handle in handles {
        handle.await.unwrap();
    }
    
    // Or use join! macro:
    tokio::join! {
        task("a", 1),
        task("b", 2),
        task("c", 3),
    };
}
```

## Async Networking with Tokio

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    
    loop {
        let (mut socket, addr) = listener.accept().await?;
        println!("New connection from {addr}");
        
        tokio::spawn(async move {
            let mut buf = [0; 1024];
            
            match socket.read(&mut buf).await {
                Ok(n) if n == 0 => return,
                Ok(n) => {
                    if let Err(e) = socket.write_all(&buf[..n]).await {
                        eprintln!("write error: {e}");
                    }
                }
                Err(e) => eprintln!("read error: {e}"),
            }
        });
    }
}
```

## Channels in Tokio

Tokio provides async channels:

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32); // Buffered channel
    
    let producer = tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).await.unwrap();
        }
    });
    
    let consumer = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("Got: {msg}");
        }
    });
    
    producer.await.unwrap();
    consumer.await.unwrap();
}
```

| Channel | Bounded? | Use Case |
|---------|----------|----------|
| `mpsc` | Both | Multiple producer, single consumer |
| `oneshot` | No (one value) | One-shot communication |
| `broadcast` | Yes | Fan-out to many receivers |
| `watch` | Yes | State change notifications |

## Async Mutex

**Never hold a `std::sync::Mutex` across `.await`!** Use `tokio::sync::Mutex` instead:

```rust
use tokio::sync::Mutex;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let counter = Arc::new(Mutex::new(0u32));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(tokio::spawn(async move {
            let mut val = counter.lock().await;
            *val += 1;
        }));
    }
    
    for handle in handles {
        handle.await.unwrap();
    }
    
    println!("Result: {}", *counter.lock().await); // 10
}
```

> [!WARNING]
| Mutex | Held Across `.await`? | Reason |
|-------|----------------------|--------|
| `std::sync::Mutex` | No | Can deadlock or block worker thread |
| `tokio::sync::Mutex` | Yes | Async-aware, releases task while waiting |

## Cancellation and Timeouts

```rust
use tokio::time::{sleep, timeout, Duration};

#[tokio::main]
async fn main() {
    // Timeout
    let result = timeout(Duration::from_secs(1), async {
        sleep(Duration::from_secs(2)).await;
        "done"
    }).await;
    
    match result {
        Ok(val) => println!("{val}"),
        Err(_) => println!("timed out"),
    }
    
    // Select — first to complete wins
    tokio::select! {
        _ = sleep(Duration::from_secs(1)) => println!("one second"),
        _ = sleep(Duration::from_secs(2)) => println!("two seconds"),
    }
}
```

## Real-World: Async HTTP Client

```rust
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;

async fn fetch_url(host: &str, path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let mut stream = TcpStream::connect(format!("{host}:80")).await?;
    
    let request = format!("GET {path} HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n");
    stream.write_all(request.as_bytes()).await?;
    
    let mut reader = BufReader::new(stream);
    let mut response = String::new();
    reader.read_line(&mut response).await?;
    
    Ok(response)
}

async fn fetch_all() -> Result<(), Box<dyn std::error::Error>> {
    let urls = vec![
        ("example.com", "/"),
        ("httpbin.org", "/get"),
    ];
    
    let mut handles = vec![];
    for (host, path) in urls {
        handles.push(tokio::spawn(async move {
            match fetch_url(host, path).await {
                Ok(body) => println!("{host}: {body}"),
                Err(e) => eprintln!("{host} error: {e}"),
            }
        }));
    }
    
    for handle in handles {
        handle.await?;
    }
    
    Ok(())
}

#[tokio::main]
async fn main() {
    fetch_all().await.unwrap();
}
```

## Practice Questions

1. What's the difference between async tasks and OS threads?
2. How does `async fn` differ from a regular function?
3. What role does Tokio play in async Rust?
4. How do you spawn a concurrent async task?
5. What's the difference between `tokio::join!` and `tokio::spawn`?
6. Why should you not hold a `std::sync::Mutex` across an `.await`?
7. How does `tokio::select!` work?
8. What is the `#[tokio::main]` attribute sugar for?
9. How do you handle timeouts in async code?
10. What tokio channel types exist and when would you use each?
