---
title: "Why Rust?"
description: "Discover Rust's core strengths: memory safety without garbage collection, zero-cost abstractions, and fearless concurrency"
order: 1
duration: "30 minutes"
difficulty: "beginner"
---

# Why Rust?

Rust is a systems programming language focused on safety, speed, and concurrency. Created by Mozilla and now stewarded by the Rust Foundation, it has been voted the "most loved language" on Stack Overflow surveys for years running.

## Memory Safety Without Garbage Collection

Languages fall into two camps:

| Approach | Examples | Trade-off |
|----------|----------|-----------|
| Manual memory | C, C++ | Full control, but bugs (use-after-free, buffer overflows) |
| Garbage collected | Java, Go, Python | Safe, but unpredictable pauses and overhead |
| **Ownership-based** | **Rust** | **Safe at compile time, zero runtime overhead** |

Rust guarantees memory safety at **compile time** through its ownership system. No null pointer dereferences, no dangling pointers, no buffer overflows — without needing a garbage collector.

> [!SUCCESS]
> Rust's ownership model catches memory bugs at compile time. If it compiles, it's memory-safe — no runtime surprises.

## Zero-Cost Abstractions

A zero-cost abstraction means you don't pay for what you don't use, and what you do use couldn't be written faster by hand. Rust's iterators, closures, and generics all compile down to the same efficient machine code as manual implementations.

```rust
// This high-level iterator chain...
let sum: i32 = (0..100).filter(|x| x % 2 == 0).map(|x| x * 2).sum();

// ...compiles to the same assembly as this hand-written loop
let mut sum = 0;
let mut i = 0;
while i < 100 {
    if i % 2 == 0 {
        sum += i * 2;
    }
    i += 1;
}
```

> [!NOTE]
| Concept | Meaning |
|---------|---------|
| Zero-cost | Abstractions have no runtime overhead |
| Compile-time | The cost is paid during compilation, not execution |
| Predictable | No hidden allocations, no garbage collection pauses |

## Comparison with C/C++

| Aspect | Rust | C/C++ |
|--------|------|-------|
| Memory safety | Guaranteed by compiler | Manual (developer responsibility) |
| Build system | Cargo (built-in) | CMake, Make, etc. (external) |
| Package manager | crates.io (official) | vcpkg, Conan (community) |
| Learning curve | Steep (ownership) | Steep (pointers, UB) |
| Null | `Option<T>` (no null) | `NULL` / `nullptr` |
| Error handling | `Result<T, E>` | Return codes / exceptions |
| Concurrency | Data-race free by default | Manual (pthreads, mutexes) |

```rust
// C: int* ptr = malloc(sizeof(int)); free(ptr);
// Rust: no manual free needed
let ptr = Box::new(42);
// Automatically freed when ptr goes out of scope
```

## Comparison with Go

| Aspect | Rust | Go |
|--------|------|----|
| Memory management | Ownership (compile-time) | GC (runtime) |
| Abstraction cost | Zero-cost | Some GC overhead |
| Concurrency model | Ownership + Send/Sync traits | Goroutines + channels |
| Compilation speed | Slower | Fast |
| Binary size | Small, no runtime | Static binary, includes GC |
| Use case | Systems, embedded, WASM | Web services, CLI tools |

## The Rust Ecosystem

### Rustup — Toolchain Manager
```bash
rustup update   # Update Rust
rustup default nightly  # Switch to nightly
```

### Cargo — Build System and Package Manager
```bash
cargo new my_project
cargo build
cargo run
cargo test
cargo doc --open
```

### Crates.io
The Rust package registry hosts over 150,000 crates:

- **serde** — Serialization/deserialization
- **tokio** — Async runtime
- **rayon** — Data parallelism
- **clap** — CLI argument parsing
- **reqwest** — HTTP client

## Fearless Concurrency

Rust's type system prevents data races at compile time. The `Send` and `Sync` traits (auto-derived when safe) ensure you can't accidentally share mutable state across threads.

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];
    
    // This won't compile — trying to share non-Sync data
    // thread::spawn(|| println!("{:?}", data));
    
    // Move ownership to the closure
    thread::spawn(move || println!("{:?}", data)).join().unwrap();
}
```

## Where Rust Excels

- **WebAssembly** — Compile to WASM for near-native speed in the browser
- **Embedded systems** — No runtime, predictable performance
- **CLI tools** — Fast, small binaries (bat, ripgrep, fd, alacritty)
- **Web backends** — Actix-web, Axum, Rocket frameworks
- **Game engines** — Bevy, Godot bindings
- **Operating systems** — Redox, kernel modules
- **Blockchain** — Solana, Polkadot, Near

> [!WARNING]
> Rust has a steep learning curve. The ownership system and borrow checker will feel restrictive at first. Persist through the first few weeks — the compiler errors are actually excellent teaching tools.

## Companies Using Rust

| Company | Use Case |
|---------|----------|
| Mozilla | Firefox CSS engine (Servo/Quantum) |
| Microsoft | Windows kernel components |
| Google | Android (AOSP), Fuchsia OS |
| Amazon | AWS infrastructure (Firecracker VMs) |
| Meta | Source control (Mononoke), Diem blockchain |
| Discord | Backend services, client performance |
| Figma | Real-time collaboration engine |
| Cloudflare | Pingora, edge compute infrastructure |

## Practice Questions

1. What three guarantees does Rust's ownership system provide at compile time?
2. What does "zero-cost abstraction" mean in Rust?
3. How is Rust's memory management different from Java's GC and C's manual management?
4. What command creates a new Rust project?
5. What is `crates.io`?
6. Compare Rust's error handling with C++ exceptions.
7. What does "fearless concurrency" mean?
8. Name three companies using Rust in production.
9. What problem does Rust solve that C/C++ have struggled with for decades?
10. How does Rust's approach to null differ from most languages?
