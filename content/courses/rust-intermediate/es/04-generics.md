---
title: "Genéricos"
description: "Escriba código reutilizable y type-safe con funciones, structs, enums, restricciones y la sintaxis turbofish"
order: 4
duration: "45 minutos"
difficulty: "intermedio"
---

# Genéricos

Los genéricos permiten escribir código que funciona con múltiples tipos mientras mantiene la fuerte seguridad de tipos de Rust. Son la base de la biblioteca estándar y el ecosistema de Rust.

## Funciones Genéricas

```rust
// Funciona con cualquier tipo T
fn identity<T>(value: T) -> T {
    value
}

fn main() {
    let x = identity(42);
    let y = identity("hello");
    let z = identity(vec![1, 2, 3]);
}
```

### Múltiples Parámetros de Tipo

```rust
fn swap<A, B>(pair: (A, B)) -> (B, A) {
    (pair.1, pair.0)
}

fn main() {
    let result = swap((1, "hello"));
    println!("{:?}", result); // ("hello", 1)
}
```

> [!NOTE]
> Los parámetros de tipo genérico son convencionalmente letras mayúsculas únicas: `T` (type), `E` (error), `K` (key), `V` (value), `N` (number), `A, B` (orden genérica).

## Structs Genéricas

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    
    // Ambos campos deben ser del mismo tipo T
    // let mixed = Point { x: 5, y: 4.0 }; // ERROR: mismatched types
}
```

### Múltiples Parámetros de Tipo en Structs

```rust
struct Pair<A, B> {
    first: A,
    second: B,
}

fn main() {
    let mixed = Pair { first: 42, second: "hello" };
}
```

## Enums Genéricos

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}

enum Either<L, R> {
    Left(L),
    Right(R),
}
```

## Métodos Genéricos

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
    
    fn new(x: T, y: T) -> Point<T> {
        Point { x, y }
    }
}

// Método disponible solo para tipo específico
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let p = Point::new(3, 4);
    println!("x: {}", p.x());
    
    let f = Point::new(3.0, 4.0);
    println!("distance: {}", f.distance_from_origin());
}
```

> [!SUCCESS]
> `impl<T>` hace que la implementación sea genérica sobre T. Sin `<T>`, estás implementando para un `Point<SomeType>` concreto.

## Restricciones Genéricas (Trait Bounds)

```rust
use std::fmt::Display;

// T debe implementar Display
fn print_value<T: Display>(value: T) {
    println!("{value}");
}

// Múltiples bounds
fn compare_and_print<T: Display + PartialOrd>(a: T, b: T) {
    println!("{a} vs {b}");
    if a > b {
        println!("first wins");
    } else if a < b {
        println!("second wins");
    } else {
        println!("tie");
    }
}
```

### Cláusulas Where

Sintaxis más limpia para bounds complejos:

```rust
use std::fmt::Display;

// Sin where
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 { 0 }

// Con where — más legible
fn some_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{ 0 }
```

## La Sintaxis Turbofish

Cuando Rust no puede inferir tipos genéricos, usa `::<>` (turbofish):

```rust
fn main() {
    // Parse necesita tipo explícito
    let n = "42".parse::<i32>().unwrap();
    
    // Collect necesita indicio de tipo
    let nums: Vec<i32> = (0..10).collect();
    // O turbofish:
    let nums = (0..10).collect::<Vec<i32>>();
    
    // Llamada a función genérica
    let x = identity::<i32>(42);
}
```

> [!WARNING]
> Turbofish es necesario cuando el compilador no puede inferir un tipo genérico. Si ves "type annotations needed", añade un turbofish o anotación de tipo.

## Const Genéricos

Rust soporta genéricos constantes en tiempo de compilación para tamaños de array y valores:

```rust
// Const genérico: N es una constante en tiempo de compilación
fn array_sum<T, const N: usize>(arr: &[T; N]) -> &T
where
    T: std::ops::Add<Output = T> + Default + Copy,
{
    let mut sum = T::default();
    for item in arr {
        sum = sum + *item;
    }
    &sum // simplificado; en realidad retorna &T
}

fn main() {
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let sum = array_sum(&arr);
    
    // const N es inferido: N = 5
}
```

### Patrones Útiles de Const Genéricos

```rust
struct Matrix<T, const ROWS: usize, const COLS: usize> {
    data: [[T; COLS]; ROWS],
}

impl<T: Default + Copy, const R: usize, const C: usize> Matrix<T, R, C> {
    fn new() -> Self {
        Matrix { data: [[T::default(); C]; R] }
    }
}

fn main() {
    let m: Matrix<i32, 3, 4> = Matrix::new();
    println!("{}x{} matrix", ROWS, COLS); // no compila directamente
}
```

## Inferencia de Tipo Genérico

```rust
use std::collections::HashMap;

fn main() {
    // Inferir por uso
    let mut map = HashMap::new();
    map.insert(1, "one");
    
    // Inferir por tipo de retorno
    fn make_vec() -> Vec<i32> {
        vec![1, 2, 3]
    }
    
    // Turbofish cuando la inferencia falla
    let chars = "hello".chars().collect::<Vec<char>>();
}
```

## Parámetros Genéricos por Defecto

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Add for Point {
    type Output = Point;
    
    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}
```

## Ejemplo Real: Caché Genérico

```rust
use std::collections::HashMap;
use std::hash::Hash;
use std::time::{Duration, Instant};

struct Cache<K, V> {
    map: HashMap<K, (V, Instant)>,
    ttl: Duration,
}

impl<K: Eq + Hash, V: Clone> Cache<K, V> {
    fn new(ttl: Duration) -> Cache<K, V> {
        Cache { map: HashMap::new(), ttl }
    }
    
    fn get(&self, key: &K) -> Option<V> {
        self.map.get(key).and_then(|(value, inserted)| {
            if inserted.elapsed() < self.ttl {
                Some(value.clone())
            } else {
                None
            }
        })
    }
    
    fn set(&mut self, key: K, value: V) {
        self.map.insert(key, (value, Instant::now()));
    }
    
    fn cleanup(&mut self) {
        self.map.retain(|_, (_, inserted)| inserted.elapsed() < self.ttl);
    }
}

fn main() {
    let mut cache: Cache<String, i32> = Cache::new(Duration::from_secs(60));
    cache.set("counter".into(), 42);
    println!("{:?}", cache.get(&"counter".into())); // Some(42)
}
```

## Preguntas de Práctica

1. ¿Para qué sirven los genéricos?
2. ¿Cómo declarar una función genérica con un parámetro de tipo?
3. ¿Cómo escribir implementaciones genéricas para una struct?
4. ¿Cuál es el propósito de la cláusula `where`?
5. ¿Cuándo necesitas la sintaxis turbofish?
6. ¿Qué son los const genéricos y cuándo usarlos?
7. ¿Puede una struct genérica tener métodos específicos para un tipo concreto?
8. ¿Cómo infiere Rust los tipos genéricos?
9. ¿Cuál es la diferencia entre `impl<T> Foo<T>` e `impl Foo<T>`?
10. ¿Cómo restringir un tipo genérico para que soporte suma?
