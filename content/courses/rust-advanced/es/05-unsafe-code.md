---
title: "Unsafe Rust"
description: "Domine unsafe Rust: raw pointers, desreferenciamiento, traits unsafe, FFI y cuándo usar unsafe con responsabilidad"
order: 5
duration: "90 minutos"
difficulty: advanced
---

# Unsafe Rust

Unsafe Rust permite realizar operaciones que el compilador no puede verificar. Es una herramienta de último recurso — úsala con responsabilidad e invariantes cuidadosos.

## Cuándo Usar Unsafe

```rust
// Los cinco superpoderes de unsafe:
unsafe {
    // 1. Desreferenciar un raw pointer
    // 2. Llamar a una función o método unsafe
    // 3. Acceder o modificar una variable static mutable
    // 4. Implementar un trait unsafe
    // 5. Acceder a campos de unions
}
```

> [!WARNING]
> Unsafe no significa que el código sea peligroso. Significa que **tú** debes mantener manualmente los invariantes de seguridad que el compilador normalmente refuerza. Un bloque unsafe incorrecto puede causar comportamiento indefinido.

## Raw Pointers

Los raw pointers (`*const T` y `*mut T`) son la contraparte insegura de las referencias:

```rust
fn main() {
    let mut x = 42;
    
    // Crear raw pointers — esto es seguro
    let r1: *const i32 = &x as *const i32;
    let r2: *mut i32 = &mut x as *mut i32;
    
    // Desreferenciar — esto es unsafe
    unsafe {
        println!("r1: {}", *r1);
        *r2 = 100;
        println!("r2: {}", *r2);
    }
    
    println!("x: {x}"); // 100
}
```

### Raw Pointer vs Referencia

| Característica | Referencia (`&T`) | Raw Pointer (`*const T`) |
|---------|------------------|--------------------------|
| Anulable | No | Sí |
| Reglas de aliasing | Estrictas | Ninguna |
| Auto-deref | Sí | No |
| Puede ser dangling | No (borrow checker) | Sí (unsafe) |
| Implementa `Send`/`Sync` | Si `T` implementa | Siempre (cuidado!) |

### Null Pointers

```rust
use std::ptr;

fn main() {
    let null: *const i32 = ptr::null();
    let null_mut: *mut i32 = ptr::null_mut();
    
    unsafe {
        // ¡Esto es UB! ¡No desreferencies null!
        // println!("{}", *null);
    }
    
    // Verificar antes de desreferenciar
    if !null.is_null() {
        unsafe { println!("{}", *null); }
    }
}
```

## Funciones Unsafe

```rust
/// Divide un slice en dos partes en un índice
/// Seguridad: índice debe ser <= len
unsafe fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();
    
    assert!(mid <= len); // Verificación de seguridad
    
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
> La palabra clave `unsafe` en una función significa que llamarla requiere un bloque `unsafe`. Estás diciendo a los llamantes: "He verificado los invariantes, pero debes garantizar las precondiciones."

## Variables Static Mutables

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
> Las variables static mutables son inherentemente no thread-safe. Prefiere `AtomicU32`, `Mutex`, o almacenamiento local de hilo.

## Traits Unsafe

```rust
/// Marker trait para tipos con representación de memoria estable
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
        // Debes saber qué variante está activa
        println!("as int: {}", u.i);
        println!("as float: {}", u.f); // UB si no está inicializado como float
    }
}
```

## Convención de Llamada FFI

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

## Construyendo APIs Seguras sobre Unsafe

El patrón principal: **encapsular unsafe en abstracciones seguras**:

```rust
use std::ptr;

/// Un wrapper seguro alrededor de un buffer asignado dinámicamente
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
| Principio | Ejemplo |
|-----------|---------|
| Unsafe internamente | Usa unsafe para implementación |
| Seguro externamente | Expón solo API segura |
| Documenta invariantes | Contrato de seguridad en comentarios |
| Minimiza ámbito | Mantén bloques unsafe pequeños |

## Patrones Unsafe Comunes

```rust
// 1. Type punning con std::mem::transmute
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

// 3. PhantomData para estado a nivel de tipo
use std::marker::PhantomData;

struct RawHandle(u64);
struct Handle<'a> {
    raw: RawHandle,
    _marker: PhantomData<&'a ()>,
}
```

## Preguntas de Práctica

1. ¿Qué cinco operaciones requieren unsafe?
2. ¿Cómo difieren los raw pointers de las referencias?
3. ¿Qué es comportamiento indefinido?
4. ¿Cuándo usar unsafe vs código seguro?
5. ¿Cómo crear una abstracción segura alrededor de código unsafe?
6. ¿Cuál es la diferencia entre `*const T` y `&T`?
7. ¿Cómo funciona `std::slice::from_raw_parts`?
8. ¿Cuál es el propósito de `#[repr(C)]`?
9. ¿Cómo llamar funciones C desde Rust?
10. ¿Cuáles son los invariantes de seguridad para `std::mem::transmute`?
