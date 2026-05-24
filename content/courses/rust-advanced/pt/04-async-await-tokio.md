---
title: "Async/Await e Tokio"
description: "Domine a sintaxe async/await do Rust, o runtime Tokio, tarefas assíncronas e construção de aplicações assíncronas concorrentes"
order: 4
duration: "90 minutos"
difficulty: advanced
---

# Async/Await e Tokio

O Rust assíncrono permite I/O concorrente com sobrecarga mínima. Diferente de threads de SO, tarefas assíncronas são leves e multiplexadas em poucas threads.

## Por que Async?

| Abordagem | Custo por Tarefa | Máx. Tarefas | Utilização de CPU |
|----------|---------------|-----------|-----------------|
| Thread de SO | ~2 MB de pilha | Milhares | Preemptivo |
| Green thread | Variável | Muitas | Preemptivo |
| **Rust async** | **~poucos bytes** | **Milhões** | **Cooperativo** |

```rust
// Threads — custo pesado por tarefa
use std::thread;
fn thread_example() {
    for i in 0..100 {
        thread::spawn(move || {
            // Cada thread: ~2 MB de pilha, overhead de syscall
            println!("{i}");
        });
    }
}

// Async — leve
async fn async_example(i: usize) {
    // Cada tarefa: pequena máquina de estados, sem pilha
    println!("{i}");
}
```

> [!NOTE]
> Async é ideal para cargas de trabalho ligadas a I/O (servidores web, bancos de dados, serviços de rede). Para trabalho vinculado a CPU, use threads.

## Sintaxe Async/Await

```rust
use std::time::Duration;

// Definir uma função async
async fn do_something() -> u32 {
    42
}

// Await dentro de uma função async
async fn process() {
    let result = do_something().await;
    println!("{result}");
}

// Ler um arquivo assincronamente
async fn read_file(path: &str) -> String {
    tokio::fs::read_to_string(path).await.unwrap()
}
```

### O que Funções Async Realmente São

```rust
// Esta função async:
async fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Dessugara para:
fn add(a: i32, b: i32) -> impl Future<Output = i32> {
    async move { a + b }
}
```

## O Runtime Tokio

Tokio é o runtime async de facto para Rust:

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
| Atributo | O Que Faz |
|-----------|-------------|
| `#[tokio::main]` | Envolve main com runtime Tokio |
| `#[tokio::test]` | Executa teste no runtime Tokio |
| `#[tokio::main(flavor = "current_thread")]` | Runtime single-threaded |
| `#[tokio::main(worker_threads = 4)]` | Multi-threaded, 4 workers |

## tokio::spawn — Tarefas Concorrentes

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

### Múltiplas Tarefas Concorrentes

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
    
    // Aguarda todas as tarefas
    for handle in handles {
        handle.await.unwrap();
    }
    
    // Ou use a macro join!:
    tokio::join! {
        task("a", 1),
        task("b", 2),
        task("c", 3),
    };
}
```

## Redes Assíncronas com Tokio

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

## Canais no Tokio

Tokio fornece canais assíncronos:

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32); // Canal com buffer
    
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

| Canal | Com Buffer? | Caso de Uso |
|---------|----------|----------|
| `mpsc` | Ambos | Múltiplos produtores, consumidor único |
| `oneshot` | Não (um valor) | Comunicação única |
| `broadcast` | Sim | Fan-out para muitos receptores |
| `watch` | Sim | Notificações de mudança de estado |

## Mutex Assíncrono

**Nunca segure um `std::sync::Mutex` através de `.await`!** Use `tokio::sync::Mutex`:

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
| Mutex | Segurado através de `.await`? | Motivo |
|-------|----------------------|--------|
| `std::sync::Mutex` | Não | Pode deadlock ou bloquear worker thread |
| `tokio::sync::Mutex` | Sim | Consciente de async, libera tarefa enquanto espera |

## Cancelamento e Timeouts

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
    
    // Select — primeiro a completar vence
    tokio::select! {
        _ = sleep(Duration::from_secs(1)) => println!("one second"),
        _ = sleep(Duration::from_secs(2)) => println!("two seconds"),
    }
}
```

## Exemplo Real: Cliente HTTP Assíncrono

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

## Perguntas de Prática

1. Qual é a diferença entre tarefas async e threads de SO?
2. Como `async fn` difere de uma função regular?
3. Qual papel Tokio desempenha no Rust assíncrono?
4. Como criar uma tarefa assíncrona concorrente?
5. Qual é a diferença entre `tokio::join!` e `tokio::spawn`?
6. Por que você não deve segurar um `std::sync::Mutex` através de um `.await`?
7. Como `tokio::select!` funciona?
8. Para que serve o açúcar sintático do atributo `#[tokio::main]`?
9. Como lidar com timeouts em código async?
10. Que tipos de canal Tokio existem e quando usar cada um?
