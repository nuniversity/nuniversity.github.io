---
title: "Smart Pointers — Box, Rc, RefCell, and Interior Mutability"
description: "Master Rust's smart pointers: Box for heap allocation, Rc for shared ownership, RefCell for interior mutability, and avoiding reference cycles"
order: 9
duration: "90 minutes"
difficulty: advanced
---

# Smart Pointers — Box, Rc, RefCell, and Interior Mutability

Smart pointers are data structures that act like pointers but provide additional capabilities. Rust's smart pointers implement the `Deref` and `Drop` traits.

## Box\<T\> — Heap Allocation

`Box<T>` is the simplest smart pointer — it allocates data on the heap:

```rust
fn main() {
    // Heap allocation
    let b = Box::new(5);
    println!("b = {b}"); // Auto-deref
    
    // Recursive type (sized at compile time)
    // Without Box, this wouldn't compile (infinite size)
    // enum List { Cons(i32, List), Nil }
    
    enum List {
        Cons(i32, Box<List>),
        Nil,
    }
    
    let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
    
    // Box<dyn Trait> for trait objects
    let values: Vec<Box<dyn std::fmt::Debug>> = vec![
        Box::new(42),
        Box::new("hello"),
        Box::new(vec![1, 2, 3]),
    ];
    
    for v in values {
        println!("{v:?}"); // Dynamic dispatch
    }
}
```

> [!NOTE]
| Use Case | Why Box |
|----------|---------|
| Recursive types | Sized requirement |
| Trait objects | Dynamic dispatch |
| Large data moves | Cheap (pointer copy) |
| Heap-allocation needed | Manual lifetime control |

### Box Performance

```rust
fn main() {
    // Moving a large Box is cheap — just copies the pointer
    let big_data = Box::new([0u8; 1024 * 1024]); // 1 MB on heap
    let moved = big_data; // Just copies 8 bytes (pointer)
    
    // Without Box, this would copy 1 MB
    // let big_data = [0u8; 1024 * 1024];
    // let moved = big_data; // Copies 1 MB!
}
```

## Rc\<T\> — Reference Counting

`Rc<T>` enables multiple ownership through non-atomic reference counting:

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
> `Rc` is **not** thread-safe. Use `Arc` for multi-threaded scenarios. `Rc` uses non-atomic increments, making it faster but unsafe across threads.

### Rc with RefCell

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

## RefCell\<T\> — Interior Mutability

`RefCell<T>` enforces borrowing rules at **runtime** instead of compile time:

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(42);
    
    // Borrow at runtime
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
| Type | Borrow Checked | Use Case |
|------|---------------|----------|
| `<code>Box&lt;T&gt;</code>` | Compile time | Single ownership, heap |
| `<code>Rc&lt;T&gt;</code>` | Compile time | Shared read-only ownership |
| `<code>RefCell&lt;T&gt;</code>` | Runtime | Interior mutability |
| `<code>Rc&lt;RefCell&lt;T&gt;&gt;</code>` | Runtime | Shared mutable ownership |

### Runtime Borrow Checking

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(String::from("hello"));
    
    let r1 = cell.borrow();
    // let r2 = cell.borrow_mut(); // Panics at runtime (already borrowed)
    
    println!("{r1}"); // Use r1 before r2
    
    drop(r1); // End borrow
    let mut r2 = cell.borrow_mut(); // Now OK
    *r2 = String::from("world");
}
```

> [!WARNING]
> `RefCell` panics at runtime if you violate borrowing rules. This is no different from a data race — it just happens at runtime instead of compile time. Always verify your borrowing logic.

### Interior Mutability Pattern

```rust
use std::cell::RefCell;

// Mock object pattern — allows mutation through &self
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

## Cell\<T\> — Copy Interior Mutability

`Cell<T>` is like `RefCell<T>` but for `Copy` types:

```rust
use std::cell::Cell;

fn main() {
    let cell = Cell::new(42);
    
    cell.set(100); // No borrow checking needed (Copy)
    let val = cell.get(); // Copies the value
    println!("{val}"); // 100
    
    // Cell works with Copy types
    let cell = Cell::new(String::from("hello"));
    // cell.get(); // ERROR: String is not Copy
}
```

| Feature | <code>Cell&lt;T&gt;</code> | <code>RefCell&lt;T&gt;</code> |
|---------|-----------|--------------|
| Requires `Copy` | Yes | No |
| Borrow checking | None (always safe) | Runtime |
| Performance | Very fast | Slight overhead |
| Methods | `get`, `set`, `replace` | `borrow`, `borrow_mut` |
| Panics | Never | On double borrow |

## Weak — Breaking Reference Cycles

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
    
    // leaf's parent is now None (branch was dropped)
    println!("leaf parent: {:?}", leaf.parent.borrow().upgrade());
    println!("leaf strong: {}", Rc::strong_count(&leaf)); // 1
}
```

## Deref and Drop Traits

```rust
use std::ops::Deref;

// Custom smart pointer
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
    
    // Deref coercion: &MyBox<String> -> &String -> &str
    hello(&m);
    
    // Drop is called automatically at end of scope
}
```

| Trait | Method | Purpose |
|-------|--------|---------|
| `Deref` | `fn deref(&self) -> &Target` | `*` operator, auto-deref |
| `DerefMut` | `fn deref_mut(&mut self) -> &mut Target` | `*` for mutable |
| `Drop` | `fn drop(&mut self)` | Cleanup on scope exit |

## Real-World: Graph with Rc\<RefCell\>

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

## Practice Questions

1. When would you use `Box<T>` vs a regular stack allocation?
2. What's the difference between `Rc` and `Arc`?
3. How does `RefCell` provide interior mutability?
4. What's the difference between `Cell` and `RefCell`?
5. When would you use `Weak` instead of `Rc`?
6. What are the `Deref` and `Drop` traits?
7. What is deref coercion?
8. How do you avoid reference cycles with `Rc`?
9. What happens if you violate `RefCell`'s borrowing rules?
10. How do you share mutable data between multiple owners?
