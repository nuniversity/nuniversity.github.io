---
title: "Paso de Mensajes — Canales y Mutex Básico"
description: "Comuníquese entre hilos con canales mpsc, comparta estado con Arc<Mutex<T>> y entienda los primitivos de concurrencia de Rust"
order: 2
duration: "90 minutos"
difficulty: advanced
---

# Paso de Mensajes — Canales y Mutex Básico

Rust sigue el mantra de Go: "No se comunique compartiendo memoria; en su lugar, comparta memoria comunicándose." Los canales proporcionan concurrencia mediante paso de mensajes.

## Canales mpsc

`mpsc` significa **Múltiples Productores, Único Consumidor**:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let val = String::from("hello from thread");
        tx.send(val).unwrap();
        // println!("{val}"); // ERROR: val fue movido por send
    });
    
    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

### send y recv

| Método | ¿Bloqueante? | Retorna | Error Cuando |
|--------|-----------|---------|------------|
| `send(val)` | No | `Result<(), SendError>` | Receptor fue dropeado |
| `recv()` | Sí (bloquea) | `Result<T, RecvError>` | Todos los senders fueron dropeados |
| `try_recv()` | No | `Result<T, TryRecvError>` | Nada aún / cerrado |

### try_recv — Recepción No Bloqueante

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

## Múltiples Productores

Clona el sender para múltiples hilos productores:

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
    
    drop(tx); // Cierra el sender original
    
    for received in rx {
        println!("Got: {received}");
    }
}
```

> [!SUCCESS]
| Escenario | Patrón | Código |
|----------|---------|------|
| Productor único | `tx` directo | `let (tx, rx) = channel()` |
| Múltiples productores | `tx.clone()` | Clona sender para cada hilo |
| Múltiples consumidores | No soportado | Usa `Mutex` o crate `broadcast` |

## Enviando Múltiples Mensajes

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
> Tratar `rx` como un iterador (en `for`) es la forma más idiomática de recibir múltiples mensajes. Bloquea en cada mensaje y se detiene cuando el canal se cierra.

## Enviando Tipos Diferentes

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

## Mutex Básico (Avance)

`Mutex` proporciona exclusión mutua — solo un hilo puede acceder a los datos a la vez:

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);
    
    {
        let mut num = m.lock().unwrap();
        *num = 6;
    } // Lock liberado cuando `num` sale de ámbito
    
    println!("m = {m:?}"); // Mutex { data: 6, poisoned: false, .. }
}
```

> [!WARNING]
> `Mutex::lock()` retorna un `MutexGuard` que implementa `Deref` y `DerefMut`. El lock se libera cuando el guard se dropea. ¡Nunca mantengas un lock a través de un `.await`!

### Compartiendo un Mutex entre Hilos

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

## Arc — Conteo de Referencia Atómica

`Arc<T>` permite propiedad compartida entre hilos:

| Característica | <code>Rc&lt;T&gt;</code> | <code>Arc&lt;T&gt;</code> |
|---------|---------|----------|
| Thread-safe | No | Sí |
| Rendimiento | Rápido | Más lento (ops atómicas) |
| Comportamiento clone | Incremento no-atómico | Incremento atómico |
| Caso de uso | Single-threaded | Multi-threaded |

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

## Ejemplo Real: Pool de Trabajadores con Canales

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

## Preguntas de Práctica

1. ¿Qué significa `mpsc` y qué implica?
2. ¿Cómo enviar un valor a través de un canal?
3. ¿Cómo recibir un valor de un canal?
4. ¿Cuál es la diferencia entre `recv()` y `try_recv()`?
5. ¿Cómo crear múltiples productores para un canal?
6. ¿Qué sucede con el canal cuando todos los senders son dropeados?
7. ¿Cómo garantiza `Mutex` acceso exclusivo?
8. ¿Por qué necesitas `Arc` para compartir un `Mutex` entre hilos?
9. ¿Cuál es la diferencia entre `Rc` y `Arc`?
10. ¿Cómo enviar mensajes de diferentes tipos a través de un solo canal?
