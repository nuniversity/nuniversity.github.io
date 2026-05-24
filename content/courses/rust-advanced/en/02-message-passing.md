---
title: "Message Passing — Channels and Mutex Basics"
description: "Communicate between threads with mpsc channels, share state with Arc<Mutex<T>>, and understand Rust's concurrency primitives"
order: 2
duration: "90 minutes"
difficulty: advanced
---

# Message Passing — Channels and Mutex Basics

Rust follows the Go mantra: "Do not communicate by sharing memory; instead, share memory by communicating." Channels provide message-passing concurrency.

## mpsc Channels

`mpsc` stands for **Multiple Producer, Single Consumer**:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let val = String::from("hello from thread");
        tx.send(val).unwrap();
        // println!("{val}"); // ERROR: val was moved by send
    });
    
    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

### send and recv

| Method | Blocking? | Returns | Error When |
|--------|-----------|---------|------------|
| `send(val)` | No (bounded: yes) | `Result<(), SendError>` | Receiver dropped |
| `recv()` | Yes (blocks) | `Result<T, RecvError>` | All senders dropped |
| `try_recv()` | No | `Result<T, TryRecvError>` | Nothing yet / closed |

### try_recv — Non-Blocking Receive

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        tx.send("done").unwrap();
    });
    
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("{msg}");
                break;
            }
            Err(mpsc::TryRecvError::Empty) => {
                println!("waiting...");
                thread::sleep(Duration::from_millis(100));
            }
            Err(mpsc::TryRecvError::Disconnected) => {
                println!("channel closed");
                break;
            }
        }
    }
}
```

## Multiple Producers

Clone the sender for multiple producing threads:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    let tx1 = tx.clone();
    thread::spawn(move || {
        tx1.send("msg from thread 1").unwrap();
    });
    
    let tx2 = tx.clone();
    thread::spawn(move || {
        tx2.send("msg from thread 2").unwrap();
    });
    
    drop(tx); // Close the original sender
    
    for received in rx {
        println!("Got: {received}");
    }
}
```

> [!SUCCESS]
| Scenario | Pattern | Code |
|----------|---------|------|
| Single producer | Direct `tx` | `let (tx, rx) = channel()` |
| Multiple producers | `tx.clone()` | Clone sender for each thread |
| Multiple consumers | Not supported | Use `Mutex` or `broadcast` crate |

## Sending Multiple Messages

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let vals = vec![
            String::from("one"),
            String::from("two"),
            String::from("three"),
        ];
        
        for val in vals {
            tx.send(val).unwrap();
        }
    });
    
    for received in rx {
        println!("Got: {received}");
    }
}
```

> [!NOTE]
> Treating `rx` as an iterator (in `for`) is the most idiomatic way to receive multiple messages. It blocks on each message and stops when the channel closes.

## Sending Different Types

```rust
use std::sync::mpsc;

#[derive(Debug)]
enum Message {
    Text(String),
    Number(i32),
    Quit,
}

fn main() {
    let (tx, rx) = mpsc::channel::<Message>();
    
    let handle = std::thread::spawn(move || {
        tx.send(Message::Text("hello".into())).unwrap();
        tx.send(Message::Number(42)).unwrap();
        tx.send(Message::Quit).unwrap();
    });
    
    for msg in rx {
        match msg {
            Message::Text(t) => println!("text: {t}"),
            Message::Number(n) => println!("number: {n}"),
            Message::Quit => {
                println!("quitting");
                break;
            }
        }
    }
    
    handle.join().unwrap();
}
```

## Mutex Basics (Preview)

`Mutex` provides mutual exclusion — only one thread can access the data at a time:

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);
    
    {
        let mut num = m.lock().unwrap();
        *num = 6;
    } // Lock released when `num` goes out of scope
    
    println!("m = {m:?}"); // Mutex { data: 6, poisoned: false, .. }
}
```

> [!WARNING]
> `Mutex::lock()` returns a `MutexGuard` that implements `Deref` and `DerefMut`. The lock is released when the guard is dropped. Never hold a lock across an `.await` point!

### Sharing a Mutex Across Threads

```rust
use std::sync::{Mutex, Arc};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("Result: {}", *counter.lock().unwrap()); // 10
}
```

## Arc — Atomic Reference Counting

`Arc<T>` enables shared ownership across threads:

| Feature | <code>Rc&lt;T&gt;</code> | <code>Arc&lt;T&gt;</code> |
|---------|---------|----------|
| Thread-safe | No | Yes |
| Performance | Fast | Slower (atomic ops) |
| Clone behavior | Non-atomic increment | Atomic increment |
| Use case | Single-threaded | Multi-threaded |

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);
    
    let mut handles = vec![];
    for i in 0..5 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            println!("Thread {i}: {:?}", data);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
}
```

## Real-World: Worker Pool with Channels

```rust
use std::sync::mpsc;
use std::thread;

type Job = Box<dyn FnOnce() + Send + 'static>;

struct ThreadPool {
    sender: mpsc::Sender<Job>,
    workers: Vec<thread::JoinHandle<()>>,
}

impl ThreadPool {
    fn new(size: usize) -> Self {
        let (sender, receiver) = mpsc::channel();
        let receiver = std::sync::Arc::new(std::sync::Mutex::new(receiver));
        
        let mut workers = Vec::with_capacity(size);
        
        for id in 0..size {
            let receiver = Arc::clone(&receiver);
            let worker = thread::spawn(move || loop {
                let job = receiver.lock().unwrap().recv();
                match job {
                    Ok(job) => {
                        println!("Worker {id} executing job");
                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} shutting down");
                        break;
                    }
                }
            });
            workers.push(worker);
        }
        
        ThreadPool { sender, workers }
    }
    
    fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        self.sender.send(Box::new(f)).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in self.workers.drain(..) {
            worker.join().unwrap();
        }
    }
}

fn main() {
    let pool = ThreadPool::new(4);
    
    for i in 0..8 {
        pool.execute(move || {
            println!("Processing task {i}");
        });
    }
    
    drop(pool);
    println!("All tasks complete");
}
```

## Practice Questions

1. What does `mpsc` stand for and what does it imply?
2. How do you send a value through a channel?
3. How do you receive a value from a channel?
4. What's the difference between `recv()` and `try_recv()`?
5. How do you create multiple producers for one channel?
6. What happens to the channel when all senders are dropped?
7. How does `Mutex` ensure exclusive access?
8. Why do you need `Arc` to share a `Mutex` across threads?
9. What's the difference between `Rc` and `Arc`?
10. How do you send messages of different types through a single channel?
