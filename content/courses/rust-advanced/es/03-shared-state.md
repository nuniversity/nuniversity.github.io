---
title: "Estado Compartido — Mutex, RwLock, Arc y Atómicos"
description: "Domine la concurrencia con estado compartido usando Mutex, RwLock, Arc y tipos atómicos para programación lock-free"
order: 3
duration: "90 minutos"
difficulty: advanced
---

# Estado Compartido — Mutex, RwLock, Arc y Atómicos

Mientras que el paso de mensajes es excelente, el estado compartido a veces es la herramienta correcta. El sistema de tipos de Rust garantiza que el estado compartido se acceda de forma segura.

## Mutex\<T\> — Exclusión Mutua

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(42);
    
    // Lock para acceder a datos
    {
        let mut guard = mutex.lock().unwrap();
        *guard += 1;
        println!("Inside lock: {guard}");
    } // Lock liberado aquí
    
    println!("{:?}", mutex); // Mutex { data: 43, ... }
}
```

### Internos del Mutex

```
Mutex<T> {
    data: T,          // Datos protegidos
    inner: {          // Mutex a nivel de SO
        locked: AtomicBool,
        queue: WaitQueue,
    },
}
```

### Envenenamiento

Cuando un hilo entra en pánico mientras mantiene un lock, el mutex se **envenena**:

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(10);
    
    // Hilo entra en pánico mientras mantiene el lock
    let handle = std::thread::spawn(move || {
        let guard = mutex.lock().unwrap();
        panic!("panic while holding lock");
        drop(guard); // Nunca alcanzado
    });
    
    assert!(handle.join().is_err());
    // mutex ahora está envenenado
}
```

| Método | Comportamiento en Veneno |
|--------|-------------------|
| `lock().unwrap()` | Entra en pánico si envenenado |
| `lock().unwrap_or_else(poisoned)` | Puede recuperar con `.into_inner()` |
| `.into_inner()` | Consume mutex, retorna datos |

> [!WARNING]
> Un mutex envenenado significa que los datos protegidos pueden estar en estado inconsistente. Usa `lock().unwrap_or_else(|e| e.into_inner())` para recuperar si estás seguro de que es seguro.

### MutexGuard — Lock RAII

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(vec![1, 2, 3]);
    
    // MutexGuard implementa Deref y DerefMut
    let mut guard = mutex.lock().unwrap();
    guard.push(4);
    
    // Con map — accede a un campo dentro del lock
    let first: std::sync::MutexGuard<'_, i32> = std::sync::MutexGuard::map(guard, |v| &mut v[0]);
    *first = 10;
    // guard ya no es válido, first mantiene el lock
    drop(first); // Lock liberado
}
```

## RwLock\<T\> — Lock de Lectura-Escritura

Múltiples lectores O un escritor:

```rust
use std::sync::RwLock;

fn main() {
    let rwlock = RwLock::new(42);
    
    // Múltiples lectores concurrentes
    {
        let r1 = rwlock.read().unwrap();
        let r2 = rwlock.read().unwrap(); // OK: múltiples lectores
        println!("{r1} {r2}");
    } // Lectores liberados
    
    // Escritor exclusivo
    {
        let mut w = rwlock.write().unwrap();
        *w += 1;
    }
}
```

| Lock | Lectores | Escritores | Caso de Uso |
|------|---------|---------|----------|
| <code>Mutex&lt;T&gt;</code> | 1 a la vez | 1 a la vez | Acceso exclusivo simple |
| <code>RwLock&lt;T&gt;</code> | Ilimitado | 1 a la vez | Cargas de trabajo con mucha lectura |

> [!SUCCESS]
> Usa `RwLock` cuando las lecturas superan enormemente a las escrituras. Para cargas con escrituras frecuentes, `Mutex` suele ser más rápido debido a menor sobrecarga.

### Inanición en RwLock

```rust
use std::sync::RwLock;
use std::thread;

fn main() {
    let lock = RwLock::new(0);
    let lock = std::sync::Arc::new(lock);
    
    // El escritor puede morir de hambre si los lectores son continuos
    // Usa RwLock::try_read() y RwLock::try_write() para no bloqueante
    // Usa parking_lot::RwLock para lock justo
}
```

| Método | ¿Bloqueante? | Retorna |
|--------|-----------|---------|
| `read()` | Sí | <code>RwLockReadGuard&lt;T&gt;</code> |
| `try_read()` | No | `Result<RwLockReadGuard<T>, TryLockError>` |
| `write()` | Sí | <code>RwLockWriteGuard&lt;T&gt;</code> |
| `try_write()` | No | `Result<RwLockWriteGuard<T>, TryLockError>` |

## Arc — Conteo de Referencia Atómica

`Arc<T>` permite propiedad compartida entre hilos:

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);
    let mut handles = vec![];
    
    for _ in 0..5 {
        let data = Arc::clone(&data); // Incremento atómico
        handles.push(thread::spawn(move || {
            println!("{:?}", data);
        }));
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    // Todos los clones dropeados, datos liberados
}
```

### Internos de Arc

```
Arc<T> {
    ptr: NonNull<ArcInner<T>>,
}

ArcInner<T> {
    strong: AtomicUsize,  // Conteo de referencias
    weak: AtomicUsize,    // Conteo de referencias débiles
    data: T,
}
```

### Weak — Rompiendo Ciclos

```rust
use std::sync::{Arc, Weak};

fn main() {
    let shared: Arc<String> = Arc::new("hello".to_string());
    let weak: Weak<String> = Arc::downgrade(&shared);
    
    // Upgrade para verificar si todavía está vivo
    match weak.upgrade() {
        Some(data) => println!("Still alive: {data}"),
        None => println!("Data was dropped"),
    }
    
    drop(shared);
    assert!(weak.upgrade().is_none());
}
```

## Atómicos — Programación Lock-Free

Los tipos atómicos proporcionan operaciones thread-safe sin locks:

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

### Tipos Atómicos

| Tipo | Tamaño | Caso de Uso |
|------|------|----------|
| `AtomicBool` | 1 byte | Banderas, señales de control |
| `AtomicI32` / `AtomicU32` | 4 bytes | Contadores, estado |
| `AtomicI64` / `AtomicU64` | 8 bytes | Contadores más grandes |
| `AtomicUsize` | bytes de arquitectura | Contadores del tamaño de puntero |
| <code>AtomicPtr&lt;T&gt;</code> | bytes de arquitectura | Estructuras de datos lock-free |

### Ordering

El ordenamiento de memoria controla la visibilidad de operaciones atómicas:

```rust
use std::sync::atomic::Ordering;

// Relaxed — sin garantías de ordenamiento (más rápido)
x.store(5, Ordering::Relaxed);
y.load(Ordering::Relaxed);

// Acquire — lecturas subsiguientes ven la escritura
// Release — escrituras anteriores son visibles para acquire
x.store(5, Ordering::Release);
y.load(Ordering::Acquire); // Ve x = 5

// SeqCst — garantía más fuerte
// Todos los hilos ven operaciones en el mismo orden
x.store(5, Ordering::SeqCst);
y.load(Ordering::SeqCst);
```

> [!WARNING]
| Ordering | Garantía | Costo |
|----------|-----------|------|
| `Relaxed` | Sin ordenamiento | Zero |
| `Acquire`/`Release` | happens-before | Moderado |
| `AcqRel` | Acquire + Release | Moderado |
| `SeqCst` | Consistencia secuencial | Mayor (pero generalmente ok) |

### Operaciones Atómicas

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
            Err(actual) => current = actual, // Reintentar con valor actualizado
        }
    }
    
    // Swap
    let old = counter.swap(100, Ordering::SeqCst);
    
    println!("Final: {}", counter.load(Ordering::SeqCst)); // 100
}
```

## Ejemplo Real: Contador Concurrente

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

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `Mutex` y `RwLock`?
2. ¿Qué significa cuando un mutex está envenenado?
3. ¿Cómo recuperarse de un mutex envenenado?
4. ¿Cuál es la diferencia entre `Arc` y `Rc`?
5. ¿Cuándo usar `Weak` en lugar de `Arc`?
6. ¿Qué son los tipos atómicos y cuándo son útiles?
7. ¿Qué significan los diferentes ordenamientos de memoria?
8. ¿Cómo funciona compare-and-swap (CAS)?
9. ¿Cuál es la ventaja de `RwLock` sobre `Mutex` para cargas con mucha lectura?
10. ¿Cómo incrementar atómicamente un contador compartido?
