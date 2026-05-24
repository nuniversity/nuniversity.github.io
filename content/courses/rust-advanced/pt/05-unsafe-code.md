---
title: "Unsafe Rust"
description: "Domine unsafe Rust: raw pointers, dereferenciamento, traits unsafe, FFI e quando usar unsafe com responsabilidade"
order: 5
duration: "90 minutos"
difficulty: advanced
---

# Unsafe Rust

Unsafe Rust permite realizar operações que o compilador não pode verificar. É uma ferramenta de último recurso — use-a com responsabilidade e invariantes cuidadosos.

## Quando Usar Unsafe

```rust
// Os cinco superpoderes de unsafe:
unsafe {
    // 1. Dereferenciar um raw pointer
    // 2. Chamar uma função ou método unsafe
    // 3. Acessar ou modificar uma variável static mutável
    // 4. Implementar um trait unsafe
    // 5. Acessar campos de unions
}
```

> [!WARNING]
> Unsafe não significa que o código é perigoso. Significa que **você** deve manualmente manter os invariantes de segurança que o compilador normalmente reforça. Um bloco unsafe incorreto pode causar comportamento indefinido.

## Raw Pointers

Raw pointers (`*const T` e `*mut T`) são a contraparte insegura das referências:

```rust
fn main() {
    let mut x = 42;
    
    // Criar raw pointers — isto é seguro
    let r1: *const i32 = &x as *const i32;
    let r2: *mut i32 = &mut x as *mut i32;
    
    // Dereferenciar — isto é unsafe
    unsafe {
        println!("r1: {}", *r1);
        *r2 = 100;
        println!("r2: {}", *r2);
    }
    
    println!("x: {x}"); // 100
}
```

### Raw Pointer vs Referência

| Característica | Referência (`&T`) | Raw Pointer (`*const T`) |
|---------|------------------|--------------------------|
| Anulável | Não | Sim |
| Regras de aliasing | Estritas | Nenhuma |
| Auto-deref | Sim | Não |
| Pode ser dangling | Não (borrow checker) | Sim (unsafe) |
| Implementa `Send`/`Sync` | Se `T` implementa | Sempre (cuidado!) |

### Null Pointers

```rust
use std::ptr;

fn main() {
    let null: *const i32 = ptr::null();
    let null_mut: *mut i32 = ptr::null_mut();
    
    unsafe {
        // Isto é UB! Não dereferencie null!
        // println!("{}", *null);
    }
    
    // Verificar antes de dereferenciar
    if !null.is_null() {
        unsafe { println!("{}", *null); }
    }
}
```

## Funções Unsafe

```rust
/// Divide uma slice em duas partes em um índice
/// Segurança: índice deve ser <= len
unsafe fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();
    
    assert!(mid <= len); // Verificação de segurança
    
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    let (left, right) = unsafe { split_at_mut(&mut data, 3) };
    println!("left: {left:?}, right: {right:?}"); // [1,2,3], [4,5]
}
```

> [!NOTE]
> A palavra-chave `unsafe` em uma função significa que chamá-la requer um bloco `unsafe`. Você está dizendo aos chamadores: "Eu verifiquei os invariantes, mas você deve garantir as pré-condições."

## Variáveis Static Mutáveis

```rust
static mut COUNTER: u32 = 0;

fn add_to_counter(val: u32) {
    unsafe {
        COUNTER += val;
    }
}

fn main() {
    add_to_counter(5);
    println!("Counter: {}", unsafe { COUNTER });
}
```

> [!WARNING]
> Variáveis static mutáveis são inerentemente não thread-safe. Prefira `AtomicU32`, `Mutex`, ou armazenamento local de thread.

## Traits Unsafe

```rust
/// Marker trait para tipos com representação de memória estável
unsafe trait Pod {} // Plain Old Data

unsafe impl Pod for u8 {}
unsafe impl Pod for i32 {}
unsafe impl Pod for f64 {}

fn cast_as_bytes<T: Pod>(value: &T) -> &[u8] {
    unsafe {
        std::slice::from_raw_parts(
            value as *const T as *const u8,
            std::mem::size_of::<T>(),
        )
    }
}

#[repr(C)]
struct Point { x: f64, y: f64 }
unsafe impl Pod for Point {}

fn main() {
    let p = Point { x: 1.0, y: 2.0 };
    let bytes = cast_as_bytes(&p);
    println!("size: {}, bytes: {:02x?}", bytes.len(), bytes);
}
```

## Unions

```rust
#[repr(C)]
union MyUnion {
    i: i32,
    f: f32,
}

fn main() {
    let u = MyUnion { i: 42 };
    
    unsafe {
        // Você deve saber qual variante está ativa
        println!("as int: {}", u.i);
        println!("as float: {}", u.f); // UB se não inicializado como float
    }
}
```

## Convenção de Chamada FFI

```rust
extern "C" {
    fn abs(input: i32) -> i32;
    fn strlen(s: *const u8) -> usize;
}

fn main() {
    unsafe {
        println!("abs(-5): {}", abs(-5));
        
        let s = "hello\0";
        let len = strlen(s.as_ptr());
        println!("len: {len}");
    }
}
```

## Construindo APIs Seguras sobre Unsafe

O padrão principal: **encapsular unsafe em abstrações seguras**:

```rust
use std::ptr;

/// Um wrapper seguro em torno de um buffer alocado dinamicamente
struct Buffer {
    ptr: *mut u8,
    len: usize,
    capacity: usize,
}

impl Buffer {
    fn new(capacity: usize) -> Self {
        let layout = std::alloc::Layout::array::<u8>(capacity).unwrap();
        let ptr = unsafe { std::alloc::alloc(layout) };
        if ptr.is_null() {
            std::alloc::handle_alloc_error(layout);
        }
        Buffer { ptr, len: 0, capacity }
    }
    
    fn push(&mut self, byte: u8) {
        assert!(self.len < self.capacity, "buffer full");
        unsafe {
            ptr::write(self.ptr.add(self.len), byte);
        }
        self.len += 1;
    }
    
    fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for Buffer {
    fn drop(&mut self) {
        let layout = std::alloc::Layout::array::<u8>(self.capacity).unwrap();
        unsafe {
            std::alloc::dealloc(self.ptr, layout);
        }
    }
}

fn main() {
    let mut buf = Buffer::new(10);
    buf.push(b'H');
    buf.push(b'i');
    println!("{:?}", buf.as_slice()); // [72, 105]
}
```

> [!SUCCESS]
| Princípio | Exemplo |
|-----------|---------|
| Unsafe internamente | Use unsafe para implementação |
| Seguro externamente | Exponha apenas API segura |
| Documente invariantes | Contrato de segurança em comentários |
| Minimize escopo | Mantenha blocos unsafe pequenos |

## Padrões Unsafe Comuns

```rust
// 1. Type punning com std::mem::transmute
fn reinterpret<U, T>(value: T) -> U {
    assert_eq!(std::mem::size_of::<T>(), std::mem::size_of::<U>());
    unsafe { std::mem::transmute(value) }
}

// 2. Vtable manual (para trait objects)
#[repr(C)]
struct VTable {
    drop: fn(*mut ()),
    size: usize,
    align: usize,
}

// 3. PhantomData para estado a nível de tipo
use std::marker::PhantomData;

struct RawHandle(u64);
struct Handle<'a> {
    raw: RawHandle,
    _marker: PhantomData<&'a ()>,
}
```

## Perguntas de Prática

1. Quais cinco operações requerem unsafe?
2. Como raw pointers diferem de referências?
3. O que é comportamento indefinido?
4. Quando usar unsafe vs código seguro?
5. Como criar uma abstração segura em torno de código unsafe?
6. Qual é a diferença entre `*const T` e `&T`?
7. Como `std::slice::from_raw_parts` funciona?
8. Qual é o propósito de `#[repr(C)]`?
9. Como chamar funções C a partir de Rust?
10. Quais são os invariantes de segurança para `std::mem::transmute`?
