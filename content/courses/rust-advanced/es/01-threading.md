---
title: "Hilos — spawn, join y Send + Sync"
description: "Domine los hilos de SO en Rust: spawn, join, move closures, hilos con ámbito y los traits Send + Sync para libertad de data races"
order: 1
duration: "90 minutos"
difficulty: advanced
---

# Hilos — spawn, join y Send + Sync

Rust proporciona hilos de SO a través de `std::thread`. Combinado con el sistema de ownership, garantiza **libertad de data races** en tiempo de compilación — ningún otro lenguaje ofrece esto sin runtime o garbage collector.

## Hilos Básicos

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("child: {i}");
            thread::sleep(Duration::from_millis(1));
        }
    });
    
    for i in 1..5 {
        println!("main: {i}");
        thread::sleep(Duration::from_millis(1));
    }
    
    handle.join().unwrap(); // Espera a que el hijo termine
}
```

> [!NOTE]
> Cuando el hilo principal termina, todos los hilos hijos se terminan independientemente de su estado. Siempre usa `join()` si necesitas que completen.

### API de JoinHandle

```rust
use std::thread;

fn main() {
    let handle: thread::JoinHandle<i32> = thread::spawn(|| {
        // Hace el trabajo
        42  // Valor de retorno del hilo
    });
    
    // Bloquea hasta que el hilo termine, obtiene el resultado
    match handle.join() {
        Ok(result) => println!("Thread returned: {result}"),
        Err(e) => eprintln!("Thread panicked: {:?}", e),
    }
    
    // Verificación no bloqueante (el hilo se desprende si se dropea)
    let handle = thread::spawn(|| {});
    let is_finished = handle.is_finished(); // Verifica sin bloquear
}
```

## Move Closures con Hilos

Los hilos pueden sobrevivir al ámbito que los creó. La palabra clave `move` transfiere la propiedad:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    
    // ERROR: el closure puede sobrevivir a la función envolvente
    // thread::spawn(|| {
    //     println!("{:?}", v);
    // });
    
    // CORRECCIÓN: mover propiedad al hilo
    let handle = thread::spawn(move || {
        println!("{:?}", v);
    });
    
    handle.join().unwrap();
    // println!("{:?}", v); // ERROR: v fue movido
}
```

> [!WARNING]
> `move` fuerza al closure a tomar propiedad de todas las variables capturadas. Si necesitas compartir acceso (no mover), usa `Arc`.

### Move Parcial con Hilos

```rust
use std::thread;

fn main() {
    let name = String::from("worker");
    let data = vec![1, 2, 3];
    
    // No puede mover selectivamente — todas las variables capturadas se mueven
    let handle = thread::spawn(move || {
        println!("{name} processing: {:?}", data);
    });
    
    handle.join().unwrap();
}
```

## Constructor de Hilo — Personalizando Hilos

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new()
        .name("worker-1".into())
        .stack_size(1024 * 1024); // Pila de 1 MB
    
    let handle = builder.spawn(|| {
        println!("Running in: {:?}", thread::current().name());
        42
    }).unwrap();
    
    println!("Result: {}", handle.join().unwrap());
}
```

| Método del Builder | Propósito |
|----------------|---------|
| `.name(name)` | Establecer nombre del hilo (útil para depuración) |
| `.stack_size(size)` | Establecer tamaño de pila (por defecto: 2MB) |
| `.spawn(f)` | Crear el hilo |

## Hilos con Ámbito (Scoped Threads)

`thread::scope` permite tomar prestados datos sin `move`:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let mut results = vec![];
    
    // Los hilos con ámbito pueden tomar prestado del hilo padre
    thread::scope(|s| {
        s.spawn(|| {
            // Puede tomar prestado v sin move
            results.push(v.iter().sum::<i32>());
        });
        s.spawn(|| {
            results.push(v.iter().product::<i32>());
        });
    }); // Todos los hilos se unen aquí
    
    println!("{results:?}"); // [6, 6]
    println!("{v:?}"); // v todavía accesible
}
```

> [!SUCCESS]
| Característica | `thread::spawn` | `thread::scope` |
|---------|-----------------|-----------------|
| Captura | Debe ser `'static` | Puede tomar prestado localmente |
| Auto-join | No | Sí (al final del ámbito) |
| Valores de retorno | Via JoinHandle | Via handle creado |

## Comunicación entre Hilos — Patrones Básicos

```rust
use std::thread;

fn main() {
    // Computar en paralelo, recolectar resultados
    let mut handles = vec![];
    
    for i in 0..5 {
        let handle = thread::spawn(move || {
            i * i
        });
        handles.push(handle);
    }
    
    let results: Vec<i32> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();
    
    println!("{results:?}"); // [0, 1, 4, 9, 16]
}
```

## Traits Send y Sync

Estos traits marcadores están en el corazón de la seguridad de hilos de Rust:

| Trait | Significado | ¿Auto-implementado? |
|-------|---------|-------------------|
| `Send` | La propiedad puede transferirse entre hilos | Sí (excepto `Rc`, raw pointers, etc.) |
| `Sync` | La referencia compartida `&T` puede enviarse entre hilos | Sí (excepto `Cell`, `RefCell`, etc.) |

```rust
use std::thread;
use std::rc::Rc;

fn main() {
    // Rc NO es Send — no puede moverse entre hilos
    // let rc = Rc::new(5);
    // thread::spawn(move || { println!("{rc}"); });
    
    // Arc SÍ es Send — puede moverse entre hilos
    let arc = std::sync::Arc::new(5);
    let arc_clone = arc.clone();
    thread::spawn(move || {
        println!("{}", arc_clone);
    }).join().unwrap();
}
```

### Cómo el Compilador Refuerza la Seguridad de Hilos

```rust
use std::cell::Cell;
use std::thread;

struct NotSync {
    cell: Cell<i32>,
}

// NotSync es !Sync porque Cell es !Sync

fn main() {
    let ns = NotSync { cell: Cell::new(42) };
    
    // ERROR: NotSync no puede compartirse entre hilos de forma segura
    // thread::scope(|s| {
    //     s.spawn(|| {
    //         println!("{}", ns.cell.get());
    //     });
    // });
}
```

> [!WARNING]
| Tipo | ¿Send? | ¿Sync? | Motivo |
|------|-------|-------|--------|
| <code>Rc&lt;T&gt;</code> | No | No | Conteo de ref no-atómico |
| <code>Arc&lt;T&gt;</code> | Sí | Sí | Conteo de ref atómico |
| <code>Cell&lt;T&gt;</code> | Sí | No | Mutabilidad interior, sin sync |
| <code>RefCell&lt;T&gt;</code> | Sí | No | Mutabilidad interior, sin sync |
| <code>Mutex&lt;T&gt;</code> | Sí | Sí | Proporciona Sync |
| `AtomicBool` | Sí | Sí | Operaciones atómicas |

## Almacenamiento Local de Hilo

```rust
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<u32> = RefCell::new(0);
}

fn main() {
    // Cada hilo tiene su propio COUNTER
    let h1 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            *c.borrow_mut() = 42;
            println!("Thread 1: {}", c.borrow());
        });
    });
    
    let h2 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            println!("Thread 2: {}", c.borrow()); // 0, no 42
        });
    });
    
    h1.join().unwrap();
    h2.join().unwrap();
}
```

## Ejemplo Real: Procesamiento de Imagen en Paralelo

```rust
use std::thread;

fn process_pixel(pixel: u8) -> u8 {
    // Simula computación costosa
    pixel.saturating_mul(2)
}

fn process_image_parallel(image: Vec<u8>, num_threads: usize) -> Vec<u8> {
    let chunk_size = (image.len() + num_threads - 1) / num_threads;
    let mut handles = vec![];
    
    for chunk in image.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        handles.push(thread::spawn(move || {
            chunk.into_iter().map(process_pixel).collect::<Vec<_>>()
        }));
    }
    
    let mut result = Vec::with_capacity(image.len());
    for handle in handles {
        result.extend(handle.join().unwrap());
    }
    result
}

fn main() {
    let image: Vec<u8> = (0..100).collect();
    let processed = process_image_parallel(image.clone(), 4);
    println!("Original: {:?}", &image[..10]);
    println!("Processed: {:?}", &processed[..10]);
}
```

## Preguntas de Práctica

1. ¿Cómo crear un hilo y esperar a que termine?
2. ¿Por qué los closures pasados a `thread::spawn` deben usar `move`?
3. ¿Cuál es la diferencia entre `thread::spawn` y los hilos con ámbito?
4. ¿Qué retorna `handle.join()`?
5. ¿Qué son los traits `Send` y `Sync`?
6. ¿Qué tipos estándar NO son `Send`? ¿Por qué?
7. ¿Qué son los hilos con ámbito (`thread::scope`) y cuándo son útiles?
8. ¿Cómo personalizar el nombre y tamaño de pila de un hilo?
9. ¿Cómo previene el compilador los data races en código con hilos?
10. ¿Qué es el almacenamiento local de hilo y cómo se usa?
