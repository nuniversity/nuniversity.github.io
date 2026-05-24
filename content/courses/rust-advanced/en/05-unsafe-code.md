---
title: "Unsafe Rust"
description: "Master unsafe Rust: raw pointers, dereferencing, unsafe traits, FFI, and when to use unsafe responsibly"
order: 5
duration: "90 minutes"
difficulty: advanced
---

# Unsafe Rust

Unsafe Rust lets you perform operations that the compiler can't verify. It's a tool of last resort — use it responsibly with careful invariants.

## When to Use Unsafe

```rust
// The five superpowers of unsafe:
unsafe {
    // 1. Dereference a raw pointer
    // 2. Call an unsafe function or method
    // 3. Access or modify a mutable static variable
    // 4. Implement an unsafe trait
    // 5. Access fields of unions
}
```

> [!WARNING]
> Unsafe doesn't mean the code is dangerous. It means **you** must manually uphold safety invariants that the compiler normally enforces. An unsound unsafe block can cause undefined behavior.

## Raw Pointers

Raw pointers (`*const T` and `*mut T`) are the unsafe counterpart to references:

```rust
fn main() {
    let mut x = 42;
    
    // Create raw pointers — this is safe
    let r1: *const i32 = &x as *const i32;
    let r2: *mut i32 = &mut x as *mut i32;
    
    // Dereference — this is unsafe
    unsafe {
        println!("r1: {}", *r1);
        *r2 = 100;
        println!("r2: {}", *r2);
    }
    
    println!("x: {x}"); // 100
}
```

### Raw Pointer vs Reference

| Feature | Reference (`&T`) | Raw Pointer (`*const T`) |
|---------|------------------|--------------------------|
| Nullable | No | Yes |
| Aliasing rules | Strict | None |
| Auto-deref | Yes | No |
| Can be dangling | No (borrow checker) | Yes (unsafe) |
| Implement `Send`/`Sync` | If `T` does | Always (be careful!) |

### Null Pointers

```rust
use std::ptr;

fn main() {
    let null: *const i32 = ptr::null();
    let null_mut: *mut i32 = ptr::null_mut();
    
    unsafe {
        // This is UB! Don't dereference null!
        // println!("{}", *null);
    }
    
    // Check before dereference
    if !null.is_null() {
        unsafe { println!("{}", *null); }
    }
}
```

## Unsafe Functions

```rust
/// Split a slice into two parts at an index
/// Safety: index must be <= len
unsafe fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();
    
    assert!(mid <= len); // Safety check
    
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
> The `unsafe` keyword on a function means calling it requires an `unsafe` block. You're telling callers: "I've verified the invariants, but you must ensure preconditions."

## Mutable Static Variables

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
> Mutable statics are inherently not thread-safe. Prefer `AtomicU32`, `Mutex`, or thread-local storage instead.

## Unsafe Traits

```rust
/// Marker trait for types with a stable memory representation
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
        // You must know which variant is active
        println!("as int: {}", u.i);
        println!("as float: {}", u.f); // UB if not initialized as float
    }
}
```

## FFI Calling Convention

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

## Building Safe APIs on Unsafe

The key pattern: **encapsulate unsafe in safe abstractions**:

```rust
use std::ptr;

/// A safe wrapper around a dynamically allocated buffer
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
| Principle | Example |
|-----------|---------|
| Unsafe internally | Use unsafe for implementation |
| Safe externally | Expose only safe API |
| Document invariants | Safety contract in comments |
| Minimize scope | Keep unsafe blocks small |

## Common Unsafe Patterns

```rust
// 1. Type punning with std::mem::transmute
fn reinterpret<U, T>(value: T) -> U {
    assert_eq!(std::mem::size_of::<T>(), std::mem::size_of::<U>());
    unsafe { std::mem::transmute(value) }
}

// 2. Manual vtable (for trait objects)
#[repr(C)]
struct VTable {
    drop: fn(*mut ()),
    size: usize,
    align: usize,
}

// 3. PhantomData for type-level state
use std::marker::PhantomData;

struct RawHandle(u64);
struct Handle<'a> {
    raw: RawHandle,
    _marker: PhantomData<&'a ()>,
}
```

## Practice Questions

1. What five operations require unsafe?
2. How do raw pointers differ from references?
3. What is undefined behavior?
4. When should you use unsafe vs safe code?
5. How do you create a safe abstraction around unsafe code?
6. What's the difference between `*const T` and `&T`?
7. How does `std::slice::from_raw_parts` work?
8. What's the purpose of `#[repr(C)]`?
9. How do you call C functions from Rust?
10. What are the safety invariants for `std::mem::transmute`?
