---
title: "Genéricos"
description: "Escreva código reutilizável e type-safe com funções, structs, enums, constraints e a sintaxe turbofish"
order: 4
duration: "45 minutos"
difficulty: "intermediário"
---

# Genéricos

Genéricos permitem escrever código que funciona com múltiplos tipos enquanto mantém a forte segurança de tipos do Rust. Eles são a base da biblioteca padrão e do ecossistema Rust.

## Funções Genéricas

```rust
// Funciona com qualquer tipo T
fn identity<T>(value: T) -> T {
    value
}

fn main() {
    let x = identity(42);
    let y = identity("hello");
    let z = identity(vec![1, 2, 3]);
}
```

### Múltiplos Parâmetros de Tipo

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
> Parâmetros de tipo genérico são convencionalmente letras maiúsculas únicas: `T` (type), `E` (error), `K` (key), `V` (value), `N` (number), `A, B` (ordem genérica).

## Structs Genéricas

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    
    // Ambos os campos devem ser do mesmo tipo T
    // let mixed = Point { x: 5, y: 4.0 }; // ERROR: mismatched types
}
```

### Múltiplos Parâmetros de Tipo em Structs

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

// Método disponível apenas para tipo específico
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
> `impl<T>` torna a implementação genérica sobre T. Sem `<T>`, você está implementando para um `Point<SomeType>` concreto.

## Constraints Genéricas (Trait Bounds)

```rust
use std::fmt::Display;

// T deve implementar Display
fn print_value<T: Display>(value: T) {
    println!("{value}");
}

// Múltiplos bounds
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

Sintaxe mais limpa para bounds complexos:

```rust
use std::fmt::Display;

// Sem where
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 { 0 }

// Com where — mais legível
fn some_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{ 0 }
```

## A Sintaxe Turbofish

Quando o Rust não consegue inferir tipos genéricos, use `::<>` (turbofish):

```rust
fn main() {
    // Parse precisa de tipo explícito
    let n = "42".parse::<i32>().unwrap();
    
    // Collect precisa de hint de tipo
    let nums: Vec<i32> = (0..10).collect();
    // Ou turbofish:
    let nums = (0..10).collect::<Vec<i32>>();
    
    // Chamada de função genérica
    let x = identity::<i32>(42);
}
```

> [!WARNING]
> Turbofish é necessário quando o compilador não consegue inferir um tipo genérico. Se você vir "type annotations needed", adicione um turbofish ou anotação de tipo.

## Const Genéricos

Rust suporta genéricos constantes em tempo de compilação para tamanhos de array e valores:

```rust
// Const genérico: N é uma constante em tempo de compilação
fn array_sum<T, const N: usize>(arr: &[T; N]) -> &T
where
    T: std::ops::Add<Output = T> + Default + Copy,
{
    let mut sum = T::default();
    for item in arr {
        sum = sum + *item;
    }
    &sum // simplificado; na verdade retorna &T
}

fn main() {
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let sum = array_sum(&arr);
    
    // const N é inferido: N = 5
}
```

### Padrões Úteis de Const Genéricos

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
    println!("{}x{} matrix", ROWS, COLS); // não compila diretamente
}
```

## Inferência de Tipo Genérico

```rust
use std::collections::HashMap;

fn main() {
    // Inferir pelo uso
    let mut map = HashMap::new();
    map.insert(1, "one");
    
    // Inferir pelo tipo de retorno
    fn make_vec() -> Vec<i32> {
        vec![1, 2, 3]
    }
    
    // Turbofish quando a inferência falha
    let chars = "hello".chars().collect::<Vec<char>>();
}
```

## Parâmetros Genéricos Padrão

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

## Exemplo Real: Cache Genérico

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

## Perguntas de Prática

1. Para que servem os genéricos?
2. Como declarar uma função genérica com um parâmetro de tipo?
3. Como escrever implementações genéricas para uma struct?
4. Qual é o propósito da cláusula `where`?
5. Quando você precisa da sintaxe turbofish?
6. O que são const genéricos e quando usá-los?
7. Uma struct genérica pode ter métodos específicos para um tipo concreto?
8. Como o Rust infere tipos genéricos?
9. Qual é a diferença entre `impl<T> Foo<T>` e `impl Foo<T>`?
10. Como restringir um tipo genérico para suportar adição?
