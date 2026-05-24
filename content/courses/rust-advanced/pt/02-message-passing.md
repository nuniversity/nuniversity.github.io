---
title: "Passagem de Mensagens — Canais e Mutex Básico"
description: "Comunique-se entre threads com canais mpsc, compartilhe estado com Arc<Mutex<T>> e entenda os primitivos de concorrência do Rust"
order: 2
duration: "90 minutos"
difficulty: advanced
---

# Passagem de Mensagens — Canais e Mutex Básico

Rust segue o mantra do Go: "Não se comunique compartilhando memória; em vez disso, compartilhe memória se comunicando." Canais fornecem concorrência por passagem de mensagens.

## Canais mpsc

`mpsc` significa **Múltiplos Produtores, Único Consumidor**:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        let val = String::from("hello from thread");
        tx.send(val).unwrap();
        // println!("{val}"); // ERROR: val foi movido por send
    });
    
    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

### send e recv

| Método | Bloqueante? | Retorna | Erro Quando |
|--------|-----------|---------|------------|
| `send(val)` | Não | `Result<(), SendError>` | Receptor foi dropped |
| `recv()` | Sim (bloqueia) | `Result<T, RecvError>` | Todos os senders foram dropped |
| `try_recv()` | Não | `Result<T, TryRecvError>` | Nada ainda / fechado |

### try_recv — Recepção Não-Bloqueante

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

## Múltiplos Produtores

Clone o sender para múltiplas threads produtoras:

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
    
    drop(tx); // Fecha o sender original
    
    for received in rx {
        println!("Got: {received}");
    }
}
```

> [!SUCCESS]
| Cenário | Padrão | Código |
|----------|---------|------|
| Produtor único | `tx` direto | `let (tx, rx) = channel()` |
| Múltiplos produtores | `tx.clone()` | Clone sender para cada thread |
| Múltiplos consumidores | Não suportado | Use `Mutex` ou crate `broadcast` |

## Enviando Múltiplas Mensagens

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
> Tratar `rx` como um iterador (em `for`) é a maneira mais idiomática de receber múltiplas mensagens. Ele bloqueia em cada mensagem e para quando o canal fecha.

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

## Mutex Básico (Prévia)

`Mutex` fornece exclusão mútua — apenas uma thread pode acessar os dados por vez:

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);
    
    {
        let mut num = m.lock().unwrap();
        *num = 6;
    } // Lock liberado quando `num` sai de escopo
    
    println!("m = {m:?}"); // Mutex { data: 6, poisoned: false, .. }
}
```

> [!WARNING]
> `Mutex::lock()` retorna um `MutexGuard` que implementa `Deref` e `DerefMut`. O lock é liberado quando o guard é dropped. Nunca segure um lock através de um `.await`!

### Compartilhando um Mutex entre Threads

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

## Arc — Contagem de Referência Atômica

`Arc<T>` permite ownership compartilhada entre threads:

| Característica | <code>Rc&lt;T&gt;</code> | <code>Arc&lt;T&gt;</code> |
|---------|---------|----------|
| Thread-safe | Não | Sim |
| Performance | Rápido | Mais lento (ops atômicas) |
| Comportamento clone | Incremento não-atômico | Incremento atômico |
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

## Exemplo Real: Pool de Trabalhadores com Canais

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

## Perguntas de Prática

1. O que `mpsc` significa e o que isso implica?
2. Como enviar um valor através de um canal?
3. Como receber um valor de um canal?
4. Qual é a diferença entre `recv()` e `try_recv()`?
5. Como criar múltiplos produtores para um canal?
6. O que acontece com o canal quando todos os senders são dropped?
7. Como `Mutex` garante acesso exclusivo?
8. Por que você precisa de `Arc` para compartilhar um `Mutex` entre threads?
9. Qual é a diferença entre `Rc` e `Arc`?
10. Como enviar mensagens de tipos diferentes através de um único canal?
