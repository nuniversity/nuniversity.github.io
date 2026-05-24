---
title: "Advanced Capstone — Concurrent Key-Value Store"
description: "Build a concurrent, thread-safe key-value store server with Tokio, persistent storage, and protocol handling"
order: 10
duration: "90 minutes"
difficulty: advanced
---

# Advanced Capstone: Concurrent Key-Value Store

Build a thread-safe, asynchronous key-value store server with persistence, client protocol, and concurrent access.

## Project Setup

```bash
cargo new kv_store
cd kv_store
```

```toml
[package]
name = "kv_store"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
thiserror = "2"
bytes = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
```

## Step 1: Core Data Structure

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Value {
    data: String,
    created_at: u64,
    ttl: Option<u64>,
}

impl Value {
    fn new(data: String, ttl: Option<Duration>) -> Self {
        Value {
            data,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            ttl: ttl.map(|d| d.as_secs()),
        }
    }
    
    fn is_expired(&self) -> bool {
        if let Some(ttl) = self.ttl {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            now - self.created_at > ttl
        } else {
            false
        }
    }
}

#[derive(Debug)]
struct KvStoreInner {
    data: HashMap<String, Value>,
    persistent_path: Option<String>,
}

impl KvStoreInner {
    fn new() -> Self {
        KvStoreInner {
            data: HashMap::new(),
            persistent_path: None,
        }
    }
}
```

## Step 2: Thread-Safe Store

```rust
#[derive(Debug, Clone)]
pub struct KvStore {
    inner: Arc<RwLock<KvStoreInner>>,
}

impl KvStore {
    pub fn new() -> Self {
        KvStore {
            inner: Arc::new(RwLock::new(KvStoreInner::new())),
        }
    }
    
    pub async fn get(&self, key: &str) -> Option<String> {
        let inner = self.inner.read().await;
        inner.data.get(key).and_then(|value| {
            if value.is_expired() {
                drop(inner); // Release read lock before write
                let mut inner = self.inner.write().await;
                inner.data.remove(key);
                None
            } else {
                Some(value.data.clone())
            }
        })
    }
    
    pub async fn set(&self, key: String, value: String, ttl: Option<Duration>) {
        let mut inner = self.inner.write().await;
        inner.data.insert(key, Value::new(value, ttl));
    }
    
    pub async fn delete(&self, key: &str) -> bool {
        let mut inner = self.inner.write().await;
        inner.data.remove(key).is_some()
    }
    
    pub async fn exists(&self, key: &str) -> bool {
        let inner = self.inner.read().await;
        inner.data.contains_key(key)
    }
    
    pub async fn flush(&self) {
        let mut inner = self.inner.write().await;
        inner.data.clear();
    }
    
    pub async fn keys(&self) -> Vec<String> {
        let inner = self.inner.read().await;
        // Filter expired keys
        inner.data.iter()
            .filter(|(_, v)| !v.is_expired())
            .map(|(k, _)| k.clone())
            .collect()
    }
}
```

> [!SUCCESS]
| Operation | Lock | Concurrency |
|-----------|------|-------------|
| `get` / `exists` / `keys` | Read lock | Unlimited readers |
| `set` / `delete` / `flush` | Write lock | Exclusive access |
| TTL expiration | Upgrade to write | Background cleanup |

## Step 3: Network Protocol Handler

```rust
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use anyhow::Result;

#[derive(Debug)]
enum Command {
    Get(String),
    Set(String, String, Option<u64>),
    Delete(String),
    Exists(String),
    Keys,
    Flush,
    Quit,
}

impl Command {
    fn parse(input: &str) -> Result<Self, String> {
        let parts: Vec<&str> = input.trim().split_whitespace().collect();
        if parts.is_empty() {
            return Err("empty command".into());
        }
        
        match parts[0].to_uppercase().as_str() {
            "GET" if parts.len() == 2 => Ok(Command::Get(parts[1].to_string())),
            "SET" if parts.len() >= 3 => {
                let value = parts[2..].join(" ");
                let ttl = parts.get(3).and_then(|s| s.parse::<u64>().ok());
                Ok(Command::Set(parts[1].to_string(), value, ttl))
            }
            "DEL" | "DELETE" if parts.len() == 2 => Ok(Command::Delete(parts[1].to_string())),
            "EXISTS" if parts.len() == 2 => Ok(Command::Exists(parts[1].to_string())),
            "KEYS" if parts.len() == 1 => Ok(Command::Keys),
            "FLUSH" if parts.len() == 1 => Ok(Command::Flush),
            "QUIT" if parts.len() == 1 => Ok(Command::Quit),
            _ => Err(format!("invalid command: {input}")),
        }
    }
}
```

## Step 4: Async Connection Handler

```rust
async fn handle_connection(store: KvStore, stream: TcpStream) -> Result<()> {
    let (reader, mut writer) = stream.into_split();
    let mut reader = BufReader::new(reader);
    let mut line = String::new();
    
    writer.write_all(b"KV Store v0.1.0\n> ").await?;
    
    loop {
        line.clear();
        let bytes_read = reader.read_line(&mut line).await?;
        
        if bytes_read == 0 {
            break; // Connection closed
        }
        
        let response = match Command::parse(&line) {
            Ok(cmd) => handle_command(&store, cmd).await,
            Err(e) => format!("ERR {e}\n"),
        };
        
        writer.write_all(response.as_bytes()).await?;
        writer.write_all(b"> ").await?;
    }
    
    Ok(())
}

async fn handle_command(store: &KvStore, cmd: Command) -> String {
    match cmd {
        Command::Get(key) => {
            match store.get(&key).await {
                Some(value) => format!("OK {value}\n"),
                None => "ERR not found\n".into(),
            }
        }
        Command::Set(key, value, ttl) => {
            let ttl = ttl.map(Duration::from_secs);
            store.set(key, value, ttl).await;
            "OK\n".into()
        }
        Command::Delete(key) => {
            if store.delete(&key).await {
                "OK\n".into()
            } else {
                "ERR not found\n".into()
            }
        }
        Command::Exists(key) => {
            if store.exists(&key).await {
                "OK 1\n".into()
            } else {
                "OK 0\n".into()
            }
        }
        Command::Keys => {
            let keys = store.keys().await;
            format!("OK {}\n{}\n", keys.len(), keys.join("\n"))
        }
        Command::Flush => {
            store.flush().await;
            "OK\n".into()
        }
        Command::Quit => "BYE\n".into(),
    }
}
```

## Step 5: Main Server

```rust
use tokio::net::TcpListener;
use tracing::{info, error};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    
    let store = KvStore::new();
    let listener = TcpListener::bind("127.0.0.1:6379").await?;
    
    info!("KV Store listening on 127.0.0.1:6379");
    
    loop {
        match listener.accept().await {
            Ok((stream, addr)) => {
                info!("New connection from {addr}");
                let store = store.clone();
                tokio::spawn(async move {
                    if let Err(e) = handle_connection(store, stream).await {
                        error!("Connection error: {e}");
                    }
                });
            }
            Err(e) => error!("Accept error: {e}"),
        }
    }
}
```

## Step 6: Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[tokio::test]
    async fn test_basic_operations() {
        let store = KvStore::new();
        
        // Set and get
        store.set("key1".into(), "value1".into(), None).await;
        assert_eq!(store.get("key1").await, Some("value1".into()));
        
        // Overwrite
        store.set("key1".into(), "value2".into(), None).await;
        assert_eq!(store.get("key1").await, Some("value2".into()));
        
        // Delete
        assert!(store.delete("key1").await);
        assert_eq!(store.get("key1").await, None);
        assert!(!store.delete("key1").await);
        
        // Exists
        store.set("key2".into(), "val".into(), None).await;
        assert!(store.exists("key2").await);
        assert!(!store.exists("nonexistent").await);
    }
    
    #[tokio::test]
    async fn test_ttl() {
        let store = KvStore::new();
        
        store.set("ephemeral".into(), "data".into(), Some(Duration::from_millis(50))).await;
        assert_eq!(store.get("ephemeral").await, Some("data".into()));
        
        tokio::time::sleep(Duration::from_millis(100)).await;
        assert_eq!(store.get("ephemeral").await, None);
    }
    
    #[tokio::test]
    async fn test_parallel_access() {
        let store = KvStore::new();
        let mut handles = vec![];
        
        for i in 0..100 {
            let store = store.clone();
            handles.push(tokio::spawn(async move {
                store.set(format!("key{i}"), format!("val{i}"), None).await;
                let val = store.get(&format!("key{i}")).await;
                assert_eq!(val, Some(format!("val{i}")));
            }));
        }
        
        for handle in handles {
            handle.await.unwrap();
        }
        
        assert_eq!(store.keys().await.len(), 100);
    }
    
    #[test]
    fn test_command_parsing() {
        assert!(matches!(Command::parse("GET foo"), Ok(Command::Get(_))));
        assert!(matches!(Command::parse("SET a b"), Ok(Command::Set(_, _, _))));
        assert!(matches!(Command::parse("DEL a"), Ok(Command::Delete(_))));
        assert!(matches!(Command::parse("KEYS"), Ok(Command::Keys)));
        assert!(Command::parse("INVALID").is_err());
    }
}
```

## Extensions

Try implementing these enhancements:

1. **Snapshot persistence** — Save/load data to disk on startup/shutdown
2. **Pub/Sub** — Add SUBSCRIBE/PUBLISH commands
3. **Authentication** — Require AUTH with password
4. **ACL** — Fine-grained access control
5. **Clustering** — Shard data across multiple nodes
6. **HTTP API** — Add a REST interface via Axum
7. **Metrics** — Track command counts, latency, active connections
8. **Client SDK** — Build a Rust client with the protocol

```rust
// Example: snapshot persistence
impl KvStore {
    pub async fn save_snapshot(&self, path: &str) -> Result<()> {
        let inner = self.inner.read().await;
        let json = serde_json::to_string(&*inner.data)?;
        tokio::fs::write(path, json).await?;
        Ok(())
    }
    
    pub async fn load_snapshot(path: &str) -> Result<Self> {
        let json = tokio::fs::read_to_string(path).await?;
        let data: HashMap<String, Value> = serde_json::from_str(&json)?;
        let inner = KvStoreInner { data, persistent_path: Some(path.into()) };
        Ok(KvStore { inner: Arc::new(RwLock::new(inner)) })
    }
}
```

## Practice Questions

1. Why did we use `RwLock` instead of `Mutex` for the store?
2. How does the TTL expiration work in this design?
3. What happens if a client connects and sends no data?
4. How would you add persistence to the store?
5. What's the advantage of `tokio::spawn` over `thread::spawn` for handling connections?
6. How would you implement a BATCH command?
7. What's the purpose of the `Arc` wrapping the `RwLock`?
8. How would you limit the number of concurrent connections?
9. What happens to expired keys in the keys() method?
10. How would you implement atomic compare-and-swap (CAS)?
