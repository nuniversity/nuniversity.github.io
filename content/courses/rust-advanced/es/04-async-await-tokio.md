---
title: "Async/Await y Tokio"
description: "Domine la sintaxis async/await de Rust, el runtime Tokio, tareas asíncronas y construcción de aplicaciones asíncronas concurrentes"
order: 4
duration: "90 minutos"
difficulty: advanced
---

# Async/Await y Tokio

El Rust asíncrono permite I/O concurrente con sobrecarga mínima. A diferencia de los hilos de SO, las tareas asíncronas son ligeras y multiplexadas en pocos hilos.

## ¿Por qué Async?

| Enfoque | Costo por Tarea | Máx. Tareas | Utilización de CPU |
|----------|---------------|-----------|-----------------|
| Hilo de SO | ~2 MB de pila | Miles | Apropiativo |
| Green thread | Variable | Muchas | Apropiativo |
| **Rust async** | **~pocos bytes** | **Millones** | **Cooperativo** |

```rust
// Hilos — costo pesado por tarea
use std::thread;
fn thread_example() {
    for i in 0..100 {
        thread::spawn(move || {
            // Cada hilo: ~2 MB de pila, overhead de syscall
            println!("{i}");
        });
    }
}

// Async — ligero
async fn async_example(i: usize) {
    // Cada tarea: pequeña máquina de estados, sin pila
    println!("{i}");
}
```

> [!NOTE]
> Async es ideal para cargas de trabajo ligadas a I/O (servidores web, bases de datos, servicios de red). Para trabajo vinculado a CPU, usa hilos.

## Sintaxis Async/Await

```rust
use std::time::Duration;

// Definir una función async
async fn do_something() -> u32 {
    42
}

// Await dentro de una función async
async fn process() {
    let result = do_something().await;
    println!("{result}");
}

// Leer un archivo asíncronamente
async fn read_file(path: &str) -> String {
    tokio::fs::read_to_string(path).await.unwrap()
}
```

### Qué son Realmente las Funciones Async

```rust
// Esta función async:
async fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Se desazucara a:
fn add(a: i32, b: i32) -> impl Future<Output = i32> {
    async move { a + b }
}
```

## El Runtime Tokio

Tokio es el runtime async de facto para Rust:

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main]
async fn main() {
    println!("Hello from Tokio!");
}

// Equivalente a:
fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        println!("Hello from Tokio!");
    });
}
```

> [!SUCCESS]
| Atributo | Qué Hace |
|-----------|-------------|
| `#[tokio::main]` | Envuelve main con runtime Tokio |
| `#[tokio::test]` | Ejecuta prueba en runtime Tokio |
| `#[tokio::main(flavor = "current_thread")]` | Runtime single-threaded |
| `#[tokio::main(worker_threads = 4)]` | Multi-threaded, 4 workers |

## tokio::spawn — Tareas Concurrentes

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

### Múltiples Tareas Concurrentes

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
    
    // Espera todas las tareas
    for handle in handles {
        handle.await.unwrap();
    }
    
    // O usa la macro join!:
    tokio::join! {
        task("a", 1),
        task("b", 2),
        task("c", 3),
    };
}
```

## Redes Asíncronas con Tokio

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

## Canales en Tokio

Tokio proporciona canales asíncronos:

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32); // Canal con buffer
    
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

| Canal | ¿Con Buffer? | Caso de Uso |
|---------|----------|----------|
| `mpsc` | Ambos | Múltiples productores, consumidor único |
| `oneshot` | No (un valor) | Comunicación única |
| `broadcast` | Sí | Fan-out a muchos receptores |
| `watch` | Sí | Notificaciones de cambio de estado |

## Mutex Asíncrono

**¡Nunca mantengas un `std::sync::Mutex` a través de `.await`!** Usa `tokio::sync::Mutex`:

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
| Mutex | ¿Mantenido a través de `.await`? | Motivo |
|-------|----------------------|--------|
| `std::sync::Mutex` | No | Puede deadlock o bloquear worker thread |
| `tokio::sync::Mutex` | Sí | Consciente de async, libera tarea mientras espera |

## Cancelación y Timeouts

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
    
    // Select — el primero en completar gana
    tokio::select! {
        _ = sleep(Duration::from_secs(1)) => println!("one second"),
        _ = sleep(Duration::from_secs(2)) => println!("two seconds"),
    }
}
```

## Ejemplo Real: Cliente HTTP Asíncrono

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

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre tareas async y hilos de SO?
2. ¿Cómo difiere `async fn` de una función regular?
3. ¿Qué papel juega Tokio en el Rust asíncrono?
4. ¿Cómo crear una tarea asíncrona concurrente?
5. ¿Cuál es la diferencia entre `tokio::join!` y `tokio::spawn`?
6. ¿Por qué no debes mantener un `std::sync::Mutex` a través de un `.await`?
7. ¿Cómo funciona `tokio::select!`?
8. ¿Para qué sirve el azúcar sintáctico del atributo `#[tokio::main]`?
9. ¿Cómo manejar timeouts en código async?
10. ¿Qué tipos de canal Tokio existen y cuándo usar cada uno?
