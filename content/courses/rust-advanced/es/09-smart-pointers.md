---
title: "Smart Pointers — Box, Rc, RefCell y Mutabilidad Interior"
description: "Domine los smart pointers de Rust: Box para asignación en heap, Rc para propiedad compartida, RefCell para mutabilidad interior y prevención de ciclos de referencia"
order: 9
duration: "90 minutos"
difficulty: advanced
---

# Smart Pointers — Box, Rc, RefCell y Mutabilidad Interior

Los smart pointers son estructuras de datos que actúan como punteros pero proporcionan capacidades adicionales. Los smart pointers de Rust implementan los traits `Deref` y `Drop`.

## Box\<T\> — Asignación en Heap

`Box<T>` es el smart pointer más simple — asigna datos en el heap:

```rust
fn main() {
    // Asignación en heap
    let b = Box::new(5);
    println!("b = {b}"); // Auto-deref
    
    // Tipo recursivo (con tamaño en tiempo de compilación)
    // Sin Box, esto no compilaría (tamaño infinito)
    // enum List { Cons(i32, List), Nil }
    
    enum List {
        Cons(i32, Box<List>),
        Nil,
    }
    
    let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
    
    // Box<dyn Trait> para trait objects
    let values: Vec<Box<dyn std::fmt::Debug>> = vec![
        Box::new(42),
        Box::new("hello"),
        Box::new(vec![1, 2, 3]),
    ];
    
    for v in values {
        println!("{v:?}"); // Dispatch dinámico
    }
}
```

> [!NOTE]
| Caso de Uso | Por qué Box |
|----------|---------|
| Tipos recursivos | Requisito de tamaño |
| Trait objects | Dispatch dinámico |
| Movimientos de datos grandes | Barato (copia de puntero) |
| Asignación en heap necesaria | Control manual de lifetime |

### Rendimiento de Box

```rust
fn main() {
    // Mover un Box grande es barato — solo copia el puntero
    let big_data = Box::new([0u8; 1024 * 1024]); // 1 MB en heap
    let moved = big_data; // Solo copia 8 bytes (puntero)
    
    // Sin Box, esto copiaría 1 MB
    // let big_data = [0u8; 1024 * 1024];
    // let moved = big_data; // ¡Copia 1 MB!
}
```

## Rc\<T\> — Conteo de Referencias

`Rc<T>` permite múltiples propiedades mediante conteo de referencias no-atómico:

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(vec![1, 2, 3]);
    
    let a = Rc::clone(&data);
    let b = Rc::clone(&data);
    
    println!("ref count: {}", Rc::strong_count(&data)); // 3
    
    {
        let c = Rc::clone(&data);
        println!("ref count: {}", Rc::strong_count(&data)); // 4
    }
    
    println!("ref count: {}", Rc::strong_count(&data)); // 3
}
```

> [!WARNING]
> `Rc` **no** es thread-safe. Usa `Arc` para escenarios multi-hilo. `Rc` usa incrementos no-atómicos, haciéndolo más rápido pero inseguro entre hilos.

### Rc con RefCell

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let shared = Rc::new(RefCell::new(42));
    
    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);
    
    *a.borrow_mut() = 100;
    
    println!("{:?}", shared.borrow()); // 100
    println!("{:?}", b.borrow()); // 100
}
```

## RefCell\<T\> — Mutabilidad Interior

`RefCell<T>` refuerza las reglas de borrowing en **tiempo de ejecución** en lugar de tiempo de compilación:

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(42);
    
    // Borrow en tiempo de ejecución
    {
        let borrowed = cell.borrow();
        println!("{borrowed}"); // 42
    }
    
    {
        let mut borrowed = cell.borrow_mut();
        *borrowed = 100;
    }
    
    println!("{:?}", cell); // RefCell { value: 100 }
}
```

> [!SUCCESS]
| Tipo | Borrow Verificado | Caso de Uso |
|------|---------------|----------|
| `<code>Box&lt;T&gt;</code>` | Tiempo de compilación | Propiedad única, heap |
| `<code>Rc&lt;T&gt;</code>` | Tiempo de compilación | Propiedad compartida solo lectura |
| `<code>RefCell&lt;T&gt;</code>` | Tiempo de ejecución | Mutabilidad interior |
| `<code>Rc&lt;RefCell&lt;T&gt;&gt;</code>` | Tiempo de ejecución | Propiedad compartida mutable |

### Verificación de Borrow en Tiempo de Ejecución

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(String::from("hello"));
    
    let r1 = cell.borrow();
    // let r2 = cell.borrow_mut(); // Pánico en tiempo de ejecución (ya prestado)
    
    println!("{r1}"); // Usa r1 antes de r2
    
    drop(r1); // Termina borrow
    let mut r2 = cell.borrow_mut(); // Ahora OK
    *r2 = String::from("world");
}
```

> [!WARNING]
> `RefCell` entra en pánico en tiempo de ejecución si violas las reglas de borrowing. Esto no es diferente de un data race — solo ocurre en tiempo de ejecución en lugar de compilación. Siempre verifica tu lógica de borrowing.

### Patrón de Mutabilidad Interior

```rust
use std::cell::RefCell;

// Patrón mock object — permite mutación a través de &self
pub struct MockDatabase {
    queries: RefCell<Vec<String>>,
}

impl MockDatabase {
    pub fn new() -> Self {
        MockDatabase { queries: RefCell::new(vec![]) }
    }
    
    pub fn query(&self, sql: &str) {
        self.queries.borrow_mut().push(sql.to_string());
    }
    
    pub fn executed_queries(&self) -> Vec<String> {
        self.queries.borrow().clone()
    }
}

fn main() {
    let db = MockDatabase::new();
    db.query("SELECT 1");
    db.query("SELECT 2");
    
    println!("{:?}", db.executed_queries());
}
```

## Cell\<T\> — Mutabilidad Interior Copia

`Cell<T>` es como `RefCell<T>` pero para tipos `Copy`:

```rust
use std::cell::Cell;

fn main() {
    let cell = Cell::new(42);
    
    cell.set(100); // Sin verificación de borrow necesaria (Copy)
    let val = cell.get(); // Copia el valor
    println!("{val}"); // 100
    
    // Cell funciona con tipos Copy
    let cell = Cell::new(String::from("hello"));
    // cell.get(); // ERROR: String no es Copy
}
```

| Característica | <code>Cell&lt;T&gt;</code> | <code>RefCell&lt;T&gt;</code> |
|---------|-----------|--------------|
| Requiere `Copy` | Sí | No |
| Verificación de borrow | Ninguna (siempre segura) | Tiempo de ejecución |
| Rendimiento | Muy rápido | Ligera sobrecarga |
| Métodos | `get`, `set`, `replace` | `borrow`, `borrow_mut` |
| Pánicos | Nunca | En borrow doble |

## Weak — Rompiendo Ciclos de Referencia

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });
    
    println!("leaf strong: {}", Rc::strong_count(&leaf));
    println!("leaf weak: {}", Rc::weak_count(&leaf));
    
    {
        let branch = Rc::new(Node {
            value: 5,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&leaf)]),
        });
        
        *leaf.parent.borrow_mut() = Rc::downgrade(&branch);
        
        println!("leaf strong: {}", Rc::strong_count(&leaf)); // 2
        println!("branch strong: {}", Rc::strong_count(&branch)); // 1
        println!("branch weak: {}", Rc::weak_count(&branch)); // 1
    }
    
    // El padre de leaf ahora es None (branch fue dropeado)
    println!("leaf parent: {:?}", leaf.parent.borrow().upgrade());
    println!("leaf strong: {}", Rc::strong_count(&leaf)); // 1
}
```

## Traits Deref y Drop

```rust
use std::ops::Deref;

// Smart pointer personalizado
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;
    
    fn deref(&self) -> &T {
        &self.0
    }
}

impl<T> Drop for MyBox<T> {
    fn drop(&mut self) {
        println!("Dropping MyBox");
    }
}

fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    
    // Coerción Deref: &MyBox<String> -> &String -> &str
    hello(&m);
    
    // Drop se llama automáticamente al final del ámbito
}
```

| Trait | Método | Propósito |
|-------|--------|---------|
| `Deref` | `fn deref(&self) -> &Target` | Operador `*`, auto-deref |
| `DerefMut` | `fn deref_mut(&mut self) -> &mut Target` | `*` para mutable |
| `Drop` | `fn drop(&mut self)` | Limpieza al salir de ámbito |

## Ejemplo Real: Grafo con Rc\<RefCell\>

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct GraphNode {
    value: i32,
    edges: Vec<Rc<RefCell<GraphNode>>>,
}

impl GraphNode {
    fn new(value: i32) -> Rc<RefCell<GraphNode>> {
        Rc::new(RefCell::new(GraphNode {
            value,
            edges: vec![],
        }))
    }
    
    fn connect(a: &Rc<RefCell<GraphNode>>, b: &Rc<RefCell<GraphNode>>) {
        a.borrow_mut().edges.push(Rc::clone(b));
        b.borrow_mut().edges.push(Rc::clone(a));
    }
}

fn main() {
    let node1 = GraphNode::new(1);
    let node2 = GraphNode::new(2);
    let node3 = GraphNode::new(3);
    
    GraphNode::connect(&node1, &node2);
    GraphNode::connect(&node2, &node3);
    GraphNode::connect(&node1, &node3);
    
    println!("node1: {:?}", node1.borrow());
}
```

## Preguntas de Práctica

1. ¿Cuándo usar `Box<T>` vs una asignación regular en la pila?
2. ¿Cuál es la diferencia entre `Rc` y `Arc`?
3. ¿Cómo proporciona `RefCell` mutabilidad interior?
4. ¿Cuál es la diferencia entre `Cell` y `RefCell`?
5. ¿Cuándo usar `Weak` en lugar de `Rc`?
6. ¿Qué son los traits `Deref` y `Drop`?
7. ¿Qué es la coerción deref?
8. ¿Cómo evitar ciclos de referencia con `Rc`?
9. ¿Qué sucede si violas las reglas de borrowing de `RefCell`?
10. ¿Cómo compartir datos mutables entre múltiples propietarios?
