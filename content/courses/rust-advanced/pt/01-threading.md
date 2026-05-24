---
title: "Threads — spawn, join e Send + Sync"
description: "Domine threads de SO em Rust: spawn, join, move closures, threads com escopo e os traits Send + Sync para liberdade de data races"
order: 1
duration: "90 minutos"
difficulty: advanced
---

# Threads — spawn, join e Send + Sync

Rust fornece threads de SO através de `std::thread`. Combinado com o sistema de ownership, garante **liberdade de data races** em tempo de compilação — nenhuma outra linguagem oferece isso sem runtime ou garbage collector.

## Threads Básicas

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
    
    handle.join().unwrap(); // Aguarda a child terminar
}
```

> [!NOTE]
> Quando a thread principal encerra, todas as threads filhas são terminadas independentemente do estado. Sempre use `join()` se precisar que elas completem.

### API de JoinHandle

```rust
use std::thread;

fn main() {
    let handle: thread::JoinHandle<i32> = thread::spawn(|| {
        // Faz o trabalho
        42  // Valor de retorno da thread
    });
    
    // Bloqueia até a thread terminar, obtém o resultado
    match handle.join() {
        Ok(result) => println!("Thread returned: {result}"),
        Err(e) => eprintln!("Thread panicked: {:?}", e),
    }
    
    // Verificação não-bloqueante (thread é destacada se dropped)
    let handle = thread::spawn(|| {});
    let is_finished = handle.is_finished(); // Verifica sem bloquear
}
```

## Move Closures com Threads

Threads podem sobreviver ao escopo que as criou. A palavra-chave `move` transfere a propriedade:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    
    // ERROR: closure pode sobreviver à função envolvente
    // thread::spawn(|| {
    //     println!("{:?}", v);
    // });
    
    // CORREÇÃO: mover propriedade para a thread
    let handle = thread::spawn(move || {
        println!("{:?}", v);
    });
    
    handle.join().unwrap();
    // println!("{:?}", v); // ERROR: v foi movido
}
```

> [!WARNING]
> `move` força o closure a assumir propriedade de todas as variáveis capturadas. Se precisar compartilhar acesso (não mover), use `Arc`.

### Move Parcial com Threads

```rust
use std::thread;

fn main() {
    let name = String::from("worker");
    let data = vec![1, 2, 3];
    
    // Não pode mover seletivamente — todas as variáveis capturadas são movidas
    let handle = thread::spawn(move || {
        println!("{name} processing: {:?}", data);
    });
    
    handle.join().unwrap();
}
```

## Construtor de Thread — Personalizando Threads

```rust
use std::thread;

fn main() {
    let builder = thread::Builder::new()
        .name("worker-1".into())
        .stack_size(1024 * 1024); // Pilha de 1 MB
    
    let handle = builder.spawn(|| {
        println!("Running in: {:?}", thread::current().name());
        42
    }).unwrap();
    
    println!("Result: {}", handle.join().unwrap());
}
```

| Método do Builder | Propósito |
|----------------|---------|
| `.name(name)` | Definir nome da thread (útil para depuração) |
| `.stack_size(size)` | Definir tamanho da pilha (padrão: 2MB) |
| `.spawn(f)` | Criar a thread |

## Threads com Escopo (Scoped Threads)

`thread::scope` permite emprestar dados sem `move`:

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];
    let mut results = vec![];
    
    // Threads com escopo podem emprestar da thread pai
    thread::scope(|s| {
        s.spawn(|| {
            // Pode emprestar v sem move
            results.push(v.iter().sum::<i32>());
        });
        s.spawn(|| {
            results.push(v.iter().product::<i32>());
        });
    }); // Todas as threads são unidas aqui
    
    println!("{results:?}"); // [6, 6]
    println!("{v:?}"); // v ainda acessível
}
```

> [!SUCCESS]
| Funcionalidade | `thread::spawn` | `thread::scope` |
|---------|-----------------|-----------------|
| Captura | Deve ser `'static` | Pode emprestar localmente |
| Auto-join | Não | Sim (no fim do escopo) |
| Valores de retorno | Via JoinHandle | Via handle criado |

## Comunicação entre Threads — Padrões Básicos

```rust
use std::thread;

fn main() {
    // Computar em paralelo, coletar resultados
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

## Traits Send e Sync

Estes traits marcadores estão no coração da segurança de threads do Rust:

| Trait | Significado | Auto-implementado? |
|-------|---------|-------------------|
| `Send` | Ownership pode ser transferida entre threads | Sim (exceto `Rc`, raw pointers, etc.) |
| `Sync` | Referência compartilhada `&T` pode ser enviada entre threads | Sim (exceto `Cell`, `RefCell`, etc.) |

```rust
use std::thread;
use std::rc::Rc;

fn main() {
    // Rc NÃO é Send — não pode ser movido entre threads
    // let rc = Rc::new(5);
    // thread::spawn(move || { println!("{rc}"); });
    
    // Arc É Send — pode ser movido entre threads
    let arc = std::sync::Arc::new(5);
    let arc_clone = arc.clone();
    thread::spawn(move || {
        println!("{}", arc_clone);
    }).join().unwrap();
}
```

### Como o Compilador Reforça Segurança de Threads

```rust
use std::cell::Cell;
use std::thread;

struct NotSync {
    cell: Cell<i32>,
}

// NotSync é !Sync porque Cell é !Sync

fn main() {
    let ns = NotSync { cell: Cell::new(42) };
    
    // ERROR: NotSync não pode ser compartilhado entre threads com segurança
    // thread::scope(|s| {
    //     s.spawn(|| {
    //         println!("{}", ns.cell.get());
    //     });
    // });
}
```

> [!WARNING]
| Tipo | Send? | Sync? | Motivo |
|------|-------|-------|--------|
| <code>Rc&lt;T&gt;</code> | Não | Não | Contagem de ref não-atômica |
| <code>Arc&lt;T&gt;</code> | Sim | Sim | Contagem de ref atômica |
| <code>Cell&lt;T&gt;</code> | Sim | Não | Mutabilidade interior, sem sync |
| <code>RefCell&lt;T&gt;</code> | Sim | Não | Mutabilidade interior, sem sync |
| <code>Mutex&lt;T&gt;</code> | Sim | Sim | Fornece Sync |
| `AtomicBool` | Sim | Sim | Operações atômicas |

## Armazenamento Local de Thread

```rust
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<u32> = RefCell::new(0);
}

fn main() {
    // Cada thread tem seu próprio COUNTER
    let h1 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            *c.borrow_mut() = 42;
            println!("Thread 1: {}", c.borrow());
        });
    });
    
    let h2 = std::thread::spawn(|| {
        COUNTER.with(|c| {
            println!("Thread 2: {}", c.borrow()); // 0, não 42
        });
    });
    
    h1.join().unwrap();
    h2.join().unwrap();
}
```

## Exemplo Real: Processamento de Imagem em Paralelo

```rust
use std::thread;

fn process_pixel(pixel: u8) -> u8 {
    // Simula computação cara
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

## Perguntas de Prática

1. Como criar uma thread e aguardar sua conclusão?
2. Por que closures passadas para `thread::spawn` devem usar `move`?
3. Qual é a diferença entre `thread::spawn` e threads com escopo?
4. O que `handle.join()` retorna?
5. O que são os traits `Send` e `Sync`?
6. Quais tipos padrão NÃO são `Send`? Por quê?
7. O que são threads com escopo (`thread::scope`) e quando são úteis?
8. Como personalizar o nome e tamanho da pilha de uma thread?
9. Como o compilador previne data races em código com threads?
10. O que é armazenamento local de thread e como é usado?
