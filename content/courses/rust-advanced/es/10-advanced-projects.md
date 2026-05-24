---
title: "Capstone Avanzado — Almacenamiento Clave-Valor Concurrente"
description: "Construya un servidor de almacenamiento clave-valor concurrente y thread-safe con Tokio, almacenamiento persistente y manejo de protocolo"
order: 10
duration: "90 minutos"
difficulty: advanced
---

# Capstone Avanzado: Almacenamiento Clave-Valor Concurrente

Construya un servidor de almacenamiento clave-valor asíncrono y thread-safe con persistencia, protocolo de cliente y acceso concurrente.

## Configuración del Proyecto

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

## Paso 1: Estructura de Datos Principal

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

## Paso 2: Almacenamiento Thread-Safe

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
                drop(inner); // Libera lock de lectura antes de escritura
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
        // Filtrar claves expiradas
        inner.data.iter()
            .filter(|(_, v)| !v.is_expired())
            .map(|(k, _)| k.clone())
            .collect()
    }
}
```

> [!SUCCESS]
| Operación | Lock | Concurrencia |
|-----------|------|-------------|
| `get` / `exists` / `keys` | Lock de lectura | Lectores ilimitados |
| `set` / `delete` / `flush` | Lock de escritura | Acceso exclusivo |
| Expiración TTL | Upgrade a escritura | Limpieza en segundo plano |

## Paso 3: Manejador de Protocolo de Red

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

## Paso 4: Manejador de Conexión Asíncrona

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
            break; // Conexión cerrada
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

## Paso 5: Servidor Principal

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

## Paso 6: Pruebas

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[tokio::test]
    async fn test_basic_operations() {
        let store = KvStore::new();
        
        // Set y get
        store.set("key1".into(), "value1".into(), None).await;
        assert_eq!(store.get("key1").await, Some("value1".into()));
        
        // Sobrescribir
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

## Extensiones

Intenta implementar estas mejoras:

1. **Persistencia de snapshot** — Guardar/cargar datos en disco al inicio/apagado
2. **Pub/Sub** — Añadir comandos SUBSCRIBE/PUBLISH
3. **Autenticación** — Requerir AUTH con contraseña
4. **ACL** — Control de acceso detallado
5. **Clusterización** — Shard de datos entre múltiples nodos
6. **API HTTP** — Añadir una interfaz REST via Axum
7. **Métricas** — Rastrear conteos de comando, latencia, conexiones activas
8. **SDK de Cliente** — Construir un cliente Rust con el protocolo

```rust
// Ejemplo: persistencia de snapshot
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

## Preguntas de Práctica

1. ¿Por qué usamos `RwLock` en lugar de `Mutex` para el almacenamiento?
2. ¿Cómo funciona la expiración de TTL en este diseño?
3. ¿Qué sucede si un cliente conecta y no envía datos?
4. ¿Cómo añadir persistencia al almacenamiento?
5. ¿Cuál es la ventaja de `tokio::spawn` sobre `thread::spawn` para manejar conexiones?
6. ¿Cómo implementar un comando BATCH?
7. ¿Cuál es el propósito del `Arc` envolviendo el `RwLock`?
8. ¿Cómo limitar el número de conexiones concurrentes?
9. ¿Qué sucede con las claves expiradas en el método keys()?
10. ¿Cómo implementar compare-and-swap (CAS) atómico?
