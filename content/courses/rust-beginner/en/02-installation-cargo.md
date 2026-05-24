---
title: "Installation and Cargo Basics"
description: "Install Rust with rustup, master Cargo commands, and write your first Hello World program"
order: 2
duration: "25 minutes"
difficulty: "beginner"
---

# Installation and Cargo Basics

Before writing Rust code, you need the Rust toolchain. Rust makes this easy with `rustup`, the official installer and toolchain manager.

## Installing Rust with rustup

### Linux / macOS / Windows (WSL)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

This installs:
- **rustup** — The toolchain manager
- **rustc** — The Rust compiler
- **cargo** — The build system and package manager
- **rustdoc** — The documentation generator

### Windows (Standalone)

Download the installer from [rustup.rs](https://rustup.rs) and run it. You'll also need the **Visual Studio C++ Build Tools** for linking.

### Verify the Installation

```bash
rustc --version   # rustc 1.85.0 (or later)
cargo --version   # cargo 1.85.0
rustup --version  # rustup 1.28.0
```

> [!NOTE]
> Rust guarantees forward compatibility: code written for Rust 1.0 still compiles on the latest version. This is called "edition stability."

## Managing Toolchains with rustup

```bash
# List installed toolchains
rustup toolchain list

# Switch to nightly (for experimental features)
rustup default nightly

# Install a specific version
rustup toolchain install 1.75.0

# Add the WebAssembly target
rustup target add wasm32-unknown-unknown
```

### Rust Channels

| Channel | Use Case | Stability Guarantee |
|---------|----------|-------------------|
| **stable** (default) | Production | Fully stable, every 6 weeks |
| **beta** | Testing upcoming features | Mostly stable |
| **nightly** | Experimental features | May break |

## Your First Rust Project with Cargo

Cargo is Rust's build system and package manager. It handles:
- Creating new projects
- Building and compiling code
- Running tests
- Fetching dependencies
- Building documentation

### cargo new

```bash
cargo new hello_rust
cd hello_rust
```

This creates:

```
hello_rust/
├── Cargo.toml    # Package manifest
├── src/
│   └── main.rs   # Entry point
└── .git/         # Auto-initialized git repo
```

### Cargo.toml — The Package Manifest

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

| Field | Purpose |
|-------|---------|
| `name` | Package name, used on crates.io |
| `version` | Semantic versioning |
| `edition` | Rust edition (2015, 2018, 2021, 2024) |
| `[dependencies]` | External crate dependencies |

### src/main.rs — Hello World

```rust
fn main() {
    println!("Hello, world!");
}
```

The `main` function is the program entry point. `println!` is a **macro** (indicated by `!`) that prints text with a newline.

### cargo build

```bash
cargo build
```

Compiles the project. The binary goes to `target/debug/hello_rust`.

```
hello_rust/
├── Cargo.toml
├── Cargo.lock      # Dependency lockfile
├── src/
│   └── main.rs
└── target/
    ├── debug/
    │   └── hello_rust   # Binary
    └── ...
```

### cargo run

```bash
cargo run
```

Builds (if needed) and runs the binary in one step:

```
   Compiling hello_rust v0.1.0 (/path/to/hello_rust)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/hello_rust`
Hello, world!
```

### cargo check

```bash
cargo check
```

Checks code for errors **without producing a binary**. Much faster than `cargo build` — use it frequently during development.

> [!SUCCESS]
> Use `cargo check` to quickly verify your code compiles. Only use `cargo build` or `cargo run` when you actually need the binary. This saves significant time on larger projects.

## Additional Cargo Commands

| Command | Purpose |
|---------|---------|
| `cargo check` | Type-check without building |
| `cargo build` | Compile (debug mode) |
| `cargo build --release` | Compile with optimizations |
| `cargo run` | Build and run |
| `cargo test` | Run tests |
| `cargo doc --open` | Build and open documentation |
| `cargo fmt` | Format code |
| `cargo clippy` | Lint code |
| `cargo update` | Update dependencies |
| `cargo clean` | Remove target directory |

## Release vs Debug Mode

| Mode | Command | Optimizations | Debug Info | Build Time |
|------|---------|---------------|------------|------------|
| Debug | `cargo build` | None | Full | Fast |
| Release | `cargo build --release` | Level 3 | Minimal | Slow |

```bash
cargo build --release
# Binary is in target/release/hello_rust
```

> [!WARNING]
> Always benchmark and deploy the release build. Debug builds are significantly slower and larger.

## Adding Dependencies

Edit `Cargo.toml`:

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
rand = "0.8"
```

Or use cargo add:

```bash
cargo add serde --features derive
cargo add rand
```

Cargo fetches dependencies from [crates.io](https://crates.io), Rust's package registry.

### Using Dependencies

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("Secret: {secret_number}");
}
```

## Workspaces (For Larger Projects)

For multi-crate projects:

```toml
# Cargo.toml (workspace root)
[workspace]
members = ["crate_a", "crate_b"]
```

```
project/
├── Cargo.toml        # Workspace definition
├── crate_a/
│   ├── Cargo.toml
│   └── src/main.rs
└── crate_b/
    ├── Cargo.toml
    └── src/main.rs
```

## Cargo Profiles

Customize compilation settings:

```toml
[profile.release]
opt-level = 3          # Max optimization
lto = true             # Link-time optimization
codegen-units = 1      # Slower compile, faster code
strip = true           # Remove debug symbols (smaller binary)
```

> [!NOTE]
| Setting | Effect |
|---------|--------|
| `opt-level = "z"` | Optimize for size |
| `lto = true` | Better optimization, slower linking |
| `strip = true` | Significantly smaller binaries |

## Practice Questions

1. What command installs Rust?
2. What does `cargo new` create?
3. What's the difference between `cargo check` and `cargo build`?
4. How do you compile with optimizations?
5. What file declares a project's dependencies?
6. What does the `[dependencies]` section in Cargo.toml do?
7. How do you add the `serde` crate with derive features?
8. What's the difference between debug and release builds?
9. How do you update all dependencies in a project?
10. What command builds documentation and opens it in a browser?
