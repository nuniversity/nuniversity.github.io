---
title: "Smart Pointers — Box, Rc, RefCell e Mutabilidade Interior"
description: "Domine os smart pointers do Rust: Box para alocação em heap, Rc para ownership compartilhada, RefCell para mutabilidade interior e prevenção de ciclos de referência"
order: 9
duration: "90 minutos"
difficulty: advanced
---

# Smart Pointers — Box, Rc, RefCell e Mutabilidade Interior

Smart pointers são estruturas de dados que agem como ponteiros mas fornecem capacidades adicionais. Os smart pointers do Rust implementam os traits `Deref` e `Drop`.

## Box\<T\> — Alocação em Heap

`Box<T>` é o smart pointer mais simples — ele aloca dados no heap:

```rust
fn main() {
    // Alocação em heap
    let b = Box::new(5);
    println!("b = {b}"); // Auto-deref
    
    // Tipo recursivo (com tamanho em tempo de compilação)
    // Sem Box, isso não compilaria (tamanho infinito)
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
        println!("{v:?}"); // Dispatch dinâmico
    }
}
```

> [!NOTE]
| Caso de Uso | Por que Box |
|----------|---------|
| Tipos recursivos | Requisito de tamanho |
| Trait objects | Dispatch dinâmico |
| Movimentos de dados grandes | Barato (cópia de ponteiro) |
| Alocação em heap necessária | Controle manual de lifetime |

### Performance do Box

```rust
fn main() {
    // Mover um Box grande é barato — apenas copia o ponteiro
    let big_data = Box::new([0u8; 1024 * 1024]); // 1 MB no heap
    let moved = big_data; // Apenas copia 8 bytes (ponteiro)
    
    // Sem Box, isso copiaria 1 MB
    // let big_data = [0u8; 1024 * 1024];
    // let moved = big_data; // Copia 1 MB!
}
```

## Rc\<T\> — Contagem de Referência

`Rc<T>` permite múltiplos ownerships através de contagem de referência não-atômica:

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
> `Rc` **não** é thread-safe. Use `Arc` para cenários multi-thread. `Rc` usa incrementos não-atômicos, tornando-o mais rápido mas inseguro entre threads.

### Rc com RefCell

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

## RefCell\<T\> — Mutabilidade Interior

`RefCell<T>` reforça as regras de borrowing em **tempo de execução** em vez de tempo de compilação:

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(42);
    
    // Borrow em tempo de execução
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
| `<code>Box&lt;T&gt;</code>` | Tempo de compilação | Ownership único, heap |
| `<code>Rc&lt;T&gt;</code>` | Tempo de compilação | Ownership compartilhado somente leitura |
| `<code>RefCell&lt;T&gt;</code>` | Tempo de execução | Mutabilidade interior |
| `<code>Rc&lt;RefCell&lt;T&gt;&gt;</code>` | Tempo de execução | Ownership compartilhado mutável |

### Verificação de Borrow em Tempo de Execução

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(String::from("hello"));
    
    let r1 = cell.borrow();
    // let r2 = cell.borrow_mut(); // Pânico em tempo de execução (já emprestado)
    
    println!("{r1}"); // Usa r1 antes de r2
    
    drop(r1); // Termina borrow
    let mut r2 = cell.borrow_mut(); // Agora OK
    *r2 = String::from("world");
}
```

> [!WARNING]
> `RefCell` entra em pânico em tempo de execução se você violar as regras de borrowing. Isso não é diferente de um data race — apenas acontece em tempo de execução em vez de compilação. Sempre verifique sua lógica de borrowing.

### Padrão de Mutabilidade Interior

```rust
use std::cell::RefCell;

// Padrão mock object — permite mutação através de &self
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

## Cell\<T\> — Mutabilidade Interior Cópia

`Cell<T>` é como `RefCell<T>` mas para tipos `Copy`:

```rust
use std::cell::Cell;

fn main() {
    let cell = Cell::new(42);
    
    cell.set(100); // Sem verificação de borrow necessária (Copy)
    let val = cell.get(); // Copia o valor
    println!("{val}"); // 100
    
    // Cell funciona com tipos Copy
    let cell = Cell::new(String::from("hello"));
    // cell.get(); // ERROR: String não é Copy
}
```

| Característica | <code>Cell&lt;T&gt;</code> | <code>RefCell&lt;T&gt;</code> |
|---------|-----------|--------------|
| Requer `Copy` | Sim | Não |
| Verificação de borrow | Nenhuma (sempre segura) | Tempo de execução |
| Performance | Muito rápido | Leve overhead |
| Métodos | `get`, `set`, `replace` | `borrow`, `borrow_mut` |
| Pânicos | Nunca | Em borrow duplo |

## Weak — Quebrando Ciclos de Referência

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
    
    // O pai de leaf agora é None (branch foi dropped)
    println!("leaf parent: {:?}", leaf.parent.borrow().upgrade());
    println!("leaf strong: {}", Rc::strong_count(&leaf)); // 1
}
```

## Traits Deref e Drop

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
    
    // Coerção Deref: &MyBox<String> -> &String -> &str
    hello(&m);
    
    // Drop é chamado automaticamente ao final do escopo
}
```

| Trait | Método | Propósito |
|-------|--------|---------|
| `Deref` | `fn deref(&self) -> &Target` | Operador `*`, auto-deref |
| `DerefMut` | `fn deref_mut(&mut self) -> &mut Target` | `*` para mutável |
| `Drop` | `fn drop(&mut self)` | Limpeza na saída de escopo |

## Exemplo Real: Grafo com Rc\<RefCell\>

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

## Perguntas de Prática

1. Quando usar `Box<T>` vs uma alocação regular na pilha?
2. Qual é a diferença entre `Rc` e `Arc`?
3. Como `RefCell` fornece mutabilidade interior?
4. Qual é a diferença entre `Cell` e `RefCell`?
5. Quando usar `Weak` em vez de `Rc`?
6. O que são os traits `Deref` e `Drop`?
7. O que é coerção deref?
8. Como evitar ciclos de referência com `Rc`?
9. O que acontece se você violar as regras de borrowing do `RefCell`?
10. Como compartilhar dados mutáveis entre múltiplos proprietários?
