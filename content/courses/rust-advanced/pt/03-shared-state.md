---
title: "Estado Compartilhado — Mutex, RwLock, Arc e Atômicos"
description: "Domine concorrência com estado compartilhado usando Mutex, RwLock, Arc e tipos atômicos para programação lock-free"
order: 3
duration: "90 minutos"
difficulty: advanced
---

# Estado Compartilhado — Mutex, RwLock, Arc e Atômicos

Enquanto a passagem de mensagens é excelente, o estado compartilhado às vezes é a ferramenta certa. O sistema de tipos do Rust garante que o estado compartilhado seja acessado com segurança.

## Mutex\<T\> — Exclusão Mútua

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(42);
    
    // Lock para acessar dados
    {
        let mut guard = mutex.lock().unwrap();
        *guard += 1;
        println!("Inside lock: {guard}");
    } // Lock liberado aqui
    
    println!("{:?}", mutex); // Mutex { data: 43, ... }
}
```

### Internos do Mutex

```
Mutex<T> {
    data: T,          // Dados protegidos
    inner: {          // Mutex a nível de SO
        locked: AtomicBool,
        queue: WaitQueue,
    },
}
```

### Poisoning

Quando uma thread entra em pânico enquanto segura um lock, o mutex é **envenenado**:

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(10);
    
    // Thread entra em pânico enquanto segura o lock
    let handle = std::thread::spawn(move || {
        let guard = mutex.lock().unwrap();
        panic!("panic while holding lock");
        drop(guard); // Nunca alcançado
    });
    
    assert!(handle.join().is_err());
    // mutex agora está envenenado
}
```

| Método | Comportamento em Poison |
|--------|-------------------|
| `lock().unwrap()` | Entra em pânico se envenenado |
| `lock().unwrap_or_else(poisoned)` | Pode recuperar com `.into_inner()` |
| `.into_inner()` | Consome mutex, retorna dados |

> [!WARNING]
> Um mutex envenenado significa que os dados protegidos podem estar em estado inconsistente. Use `lock().unwrap_or_else(|e| e.into_inner())` para recuperar se tiver certeza de que é seguro.

### MutexGuard — Lock RAII

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(vec![1, 2, 3]);
    
    // MutexGuard implementa Deref e DerefMut
    let mut guard = mutex.lock().unwrap();
    guard.push(4);
    
    // Com map — acessa um campo dentro do lock
    let first: std::sync::MutexGuard<'_, i32> = std::sync::MutexGuard::map(guard, |v| &mut v[0]);
    *first = 10;
    // guard não é mais válido, first segura o lock
    drop(first); // Lock liberado
}
```

## RwLock\<T\> — Lock de Leitura-Escrita

Múltiplos leitores OU um escritor:

```rust
use std::sync::RwLock;

fn main() {
    let rwlock = RwLock::new(42);
    
    // Múltiplos leitores concorrentes
    {
        let r1 = rwlock.read().unwrap();
        let r2 = rwlock.read().unwrap(); // OK: múltiplos leitores
        println!("{r1} {r2}");
    } // Leitores liberados
    
    // Escritor exclusivo
    {
        let mut w = rwlock.write().unwrap();
        *w += 1;
    }
}
```

| Lock | Leitores | Escritores | Caso de Uso |
|------|---------|---------|----------|
| <code>Mutex&lt;T&gt;</code> | 1 por vez | 1 por vez | Acesso exclusivo simples |
| <code>RwLock&lt;T&gt;</code> | Ilimitado | 1 por vez | Cargas de trabalho com muita leitura |

> [!SUCCESS]
> Use `RwLock` quando leituras superam enormemente escritas. Para cargas com escritas frequentes, `Mutex` geralmente é mais rápido devido à menor sobrecarga.

### Starvation no RwLock

```rust
use std::sync::RwLock;
use std::thread;

fn main() {
    let lock = RwLock::new(0);
    let lock = std::sync::Arc::new(lock);
    
    // Escritor pode passar fome se leitores forem contínuos
    // Use RwLock::try_read() e RwLock::try_write() para não-bloqueante
    // Use parking_lot::RwLock para lock justo
}
```

| Método | Bloqueante? | Retorna |
|--------|-----------|---------|
| `read()` | Sim | <code>RwLockReadGuard&lt;T&gt;</code> |
| `try_read()` | Não | `Result<RwLockReadGuard<T>, TryLockError>` |
| `write()` | Sim | <code>RwLockWriteGuard&lt;T&gt;</code> |
| `try_write()` | Não | `Result<RwLockWriteGuard<T>, TryLockError>` |

## Arc — Contagem de Referência Atômica

`Arc<T>` permite ownership compartilhada entre threads:

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);
    let mut handles = vec![];
    
    for _ in 0..5 {
        let data = Arc::clone(&data); // Incremento atômico
        handles.push(thread::spawn(move || {
            println!("{:?}", data);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    // Todos os clones dropped, dados liberados
}
```

### Internos do Arc

```
Arc<T> {
    ptr: NonNull<ArcInner<T>>,
}

ArcInner<T> {
    strong: AtomicUsize,  // Contagem de referência
    weak: AtomicUsize,    // Contagem de referência fraca
    data: T,
}
```

### Weak — Quebrando Ciclos

```rust
use std::sync::{Arc, Weak};

fn main() {
    let shared: Arc<String> = Arc::new("hello".to_string());
    let weak: Weak<String> = Arc::downgrade(&shared);
    
    // Upgrade para verificar se ainda está vivo
    match weak.upgrade() {
        Some(data) => println!("Still alive: {data}"),
        None => println!("Data was dropped"),
    }
    
    drop(shared);
    assert!(weak.upgrade().is_none());
}
```

## Atômicos — Programação Lock-Free

Tipos atômicos fornecem operações thread-safe sem locks:

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;

fn main() {
    let flag = AtomicBool::new(false);
    let counter = AtomicUsize::new(0);
    
    let flag = std::sync::Arc::new(flag);
    let counter = std::sync::Arc::new(counter);
    
    let mut handles = vec![];
    for _ in 0..10 {
        let flag = Arc::clone(&flag);
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            counter.fetch_add(1, Ordering::SeqCst);
            flag.store(true, Ordering::SeqCst);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("counter: {}", counter.load(Ordering::SeqCst));
    println!("flag: {}", flag.load(Ordering::SeqCst));
}
```

### Tipos Atômicos

| Tipo | Tamanho | Caso de Uso |
|------|------|----------|
| `AtomicBool` | 1 byte | Flags, sinais de controle |
| `AtomicI32` / `AtomicU32` | 4 bytes | Contadores, estado |
| `AtomicI64` / `AtomicU64` | 8 bytes | Contadores maiores |
| `AtomicUsize` | bytes da arquitetura | Contadores do tamanho de ponteiro |
| <code>AtomicPtr&lt;T&gt;</code> | bytes da arquitetura | Estruturas de dados lock-free |

### Ordering

O ordenamento de memória controla a visibilidade de operações atômicas:

```rust
use std::sync::atomic::Ordering;

// Relaxed — sem garantias de ordenamento (mais rápido)
x.store(5, Ordering::Relaxed);
y.load(Ordering::Relaxed);

// Acquire — leituras subsequentes veem a escrita
// Release — escritas anteriores são visíveis para acquire
x.store(5, Ordering::Release);
y.load(Ordering::Acquire); // Vê x = 5

// SeqCst — garantia mais forte
// Todas as threads veem operações na mesma ordem
x.store(5, Ordering::SeqCst);
y.load(Ordering::SeqCst);
```

> [!WARNING]
| Ordering | Garantia | Custo |
|----------|-----------|------|
| `Relaxed` | Sem ordenamento | Zero |
| `Acquire`/`Release` | happens-before | Moderado |
| `AcqRel` | Acquire + Release | Moderado |
| `SeqCst` | Consistência sequencial | Maior (mas geralmente ok) |

### Operações Atômicas

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let counter = AtomicUsize::new(0);
    
    // Fetch-and-modify
    counter.fetch_add(5, Ordering::SeqCst);
    counter.fetch_sub(3, Ordering::SeqCst);
    
    // Compare-and-swap (CAS)
    let mut current = counter.load(Ordering::SeqCst);
    loop {
        let new = current + 1;
        match counter.compare_exchange(
            current,
            new,
            Ordering::SeqCst,
            Ordering::SeqCst,
        ) {
            Ok(_) => break,
            Err(actual) => current = actual, // Tentar novamente com valor atualizado
        }
    }
    
    // Swap
    let old = counter.swap(100, Ordering::SeqCst);
    
    println!("Final: {}", counter.load(Ordering::SeqCst)); // 100
}
```

## Exemplo Real: Contador Concorrente

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

struct ConcurrentCounter {
    value: AtomicUsize,
}

impl ConcurrentCounter {
    fn new() -> Self {
        ConcurrentCounter { value: AtomicUsize::new(0) }
    }
    
    fn increment(&self) -> usize {
        self.value.fetch_add(1, Ordering::SeqCst)
    }
    
    fn get(&self) -> usize {
        self.value.load(Ordering::SeqCst)
    }
}

fn main() {
    let counter = Arc::new(ConcurrentCounter::new());
    let mut handles = vec![];
    
    for _ in 0..100 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                counter.increment();
            }
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("Final count: {}", counter.get()); // 100000
}
```

## Perguntas de Prática

1. Qual é a diferença entre `Mutex` e `RwLock`?
2. O que significa quando um mutex está envenenado?
3. Como recuperar de um mutex envenenado?
4. Qual é a diferença entre `Arc` e `Rc`?
5. Quando usar `Weak` em vez de `Arc`?
6. O que são tipos atômicos e quando são úteis?
7. O que os diferentes ordenamentos de memória significam?
8. Como funciona compare-and-swap (CAS)?
9. Qual é a vantagem do `RwLock` sobre `Mutex` para cargas com muita leitura?
10. Como incrementar atomicamente um contador compartilhado?
