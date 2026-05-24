---
title: "Iteradores"
description: "Domine el trait Iterator, adaptadores (map, filter, fold, collect), adaptadores consumidores y evaluación lazy"
order: 10
duration: "45 minutos"
difficulty: "intermedio"
---

# Iteradores

Los iteradores son la forma idiomática de Rust para procesar secuencias de valores. Son lazy, componibles y se compilan a código de máquina eficiente — a menudo más rápido que bucles escritos a mano.

## El Trait Iterator

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // Muchos métodos por defecto...
}
```

Cualquier tipo que implemente `Iterator` se puede usar con adaptadores de iterador:

```rust
struct Counter {
    count: usize,
    max: usize,
}

impl Counter {
    fn new(max: usize) -> Self {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = usize;
    
    fn next(&mut self) -> Option<Self::Item> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new(3);
    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), None);
}
```

> [!NOTE]
> El trait `Iterator` solo requiere `next()`. Todos los demás métodos son implementaciones por defecto construidas sobre `next()`.

## Adaptadores Consumidores

Estos llaman a `next()` hasta `None`:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // collect — recoge en una colección
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // sum — suma todos los valores
    let sum: i32 = numbers.iter().sum();
    println!("{sum}"); // 15
    
    // count — cuenta elementos
    let count = numbers.iter().count();
    println!("{count}"); // 5
    
    // fold — acumula con valor inicial
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("{product}"); // 120
    
    // reduce — acumula sin valor inicial
    let sum = numbers.iter().cloned().reduce(|a, b| a + b);
    println!("{:?}", sum); // Some(15)
    
    // for_each — efectos secundarios
    numbers.iter().for_each(|x| print!("{x} "));
    println!();
    
    // any / all — predicados
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    let all_positive = numbers.iter().all(|x| x > &0);
    println!("has_even: {has_even}, all_positive: {all_positive}");
}
```

## Adaptadores de Iterador (Lazy)

Los adaptadores transforman un iterador en otro iterador. Son **lazy** — nada sucede hasta que se llama a un adaptador consumidor:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // map — transforma cada elemento
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]
    
    // filter — mantiene elementos que coinciden con el predicado
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4]
    
    // filter_map — filtra y mapea en una pasada
    let parsed: Vec<i32> = vec!["1", "two", "3", "four"]
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("{:?}", parsed); // [1, 3]
    
    // flat_map — aplana iteradores anidados
    let words: Vec<String> = vec!["hello world", "rust is great"]
        .iter()
        .flat_map(|s| s.split_whitespace())
        .map(String::from)
        .collect();
    println!("{:?}", words);
    
    // take / skip
    let first3: Vec<i32> = numbers.iter().take(3).cloned().collect();
    let after2: Vec<i32> = numbers.iter().skip(2).cloned().collect();
    println!("take: {first3:?}, skip: {after2:?}");
    
    // chain — combina iteradores
    let combined: Vec<i32> = vec![1, 2].iter().chain(vec![3, 4].iter()).cloned().collect();
    println!("{combined:?}"); // [1, 2, 3, 4]
    
    // zip — empareja elementos de dos iteradores
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![90, 85, 95];
    let paired: Vec<(&str, i32)> = names.iter().zip(scores.iter()).map(|(n, s)| (*n, *s)).collect();
    println!("{paired:?}");
}
```

> [!SUCCESS]
| Adaptador | Propósito | Ejemplo |
|---------|---------|---------|
| `map` | Transformar | `iter.map(\|x\| x * 2)` |
| `filter` | Mantener coincidencias | `iter.filter(\|x\| x > 0)` |
| `filter_map` | Filtrar + transformar | `iter.filter_map(\|x\| x.parse().ok())` |
| `flat_map` | Aplanar anidados | `iter.flat_map(\|x\| x.split())` |
| `take` | Limitar | `iter.take(5)` |
| `skip` | Saltar primeros N | `iter.skip(5)` |
| `zip` | Emparejar | `a.iter().zip(b.iter())` |
| `chain` | Concatenar | `a.iter().chain(b.iter())` |
| `enumerate` | Añadir índice | `iter.enumerate()` |
| `step_by` | Saltar pasos | `iter.step_by(2)` |

## Trait IntoIterator

Los bucles `for` usan `IntoIterator` para convertir tipos en iteradores:

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // IntoIterator::into_iter consume self
    for x in v { // v es consumido
        print!("{x} ");
    }
    // println!("{:?}", v); // ERROR: v movido
    
    // &Vec implementa IntoIterator → produce &i32
    let v = vec![1, 2, 3];
    for x in &v {
        print!("{x} "); // x: &i32
    }
    
    // &mut Vec implementa IntoIterator → produce &mut i32
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
}
```

| IntoIterator en | Produce | Efecto |
|----------------|--------|--------|
| `Vec<T>` | `T` | Consume el vector |
| `&Vec<T>` | `&T` | Toma prestado |
| `&mut Vec<T>` | `&mut T` | Préstamo mutable |

## Métodos de Iterador Personalizados

```rust
fn main() {
    // Procesamiento en chunks
    let data = vec![1, 2, 3, 4, 5, 6];
    
    for chunk in data.chunks(2) {
        println!("{:?}", chunk); // [1,2], [3,4], [5,6]
    }
    
    for window in data.windows(2) {
        println!("{:?}", window); // [1,2], [2,3], [3,4], [4,5], [5,6]
    }
}

// Iterador personalizado — Fibonacci
struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Iterator for Fibonacci {
    type Item = u64;
    
    fn next(&mut self) -> Option<Self::Item> {
        let current = self.curr;
        self.curr = self.next;
        self.next = current + self.next;
        Some(current)
    }
}

fn fibonacci() -> Fibonacci {
    Fibonacci { curr: 0, next: 1 }
}

fn main() {
    let fib: Vec<u64> = fibonacci().take(10).collect();
    println!("{:?}", fib); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
}
```

## Rendimiento — Iteradores vs Bucles

Los iteradores de Rust se compilan al mismo código de máquina que los bucles escritos a mano:

```rust
// Estos compilan a ensamblador IDÉNTICO:
fn sum_with_loop(v: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..v.len() {
        sum += v[i];
    }
    sum
}

fn sum_with_iter(v: &[i32]) -> i32 {
    v.iter().sum()
}
```

> [!NOTE]
> Los iteradores son abstracciones de costo cero. El compilador los inlinea y optimiza, produciendo código equivalente a la versión escrita a mano.

## Ejemplo Real: Pipeline de Procesamiento de Datos

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Sale {
    product: String,
    amount: f64,
    quantity: u32,
}

fn analyze_sales(sales: Vec<Sale>) -> HashMap<String, f64> {
    sales
        .into_iter()
        .map(|s| (s.product, s.amount * s.quantity as f64))
        .fold(HashMap::new(), |mut acc, (product, total)| {
            *acc.entry(product).or_insert(0.0) += total;
            acc
        })
}

fn process_log(lines: Vec<String>) -> Vec<(usize, String)> {
    lines
        .into_iter()
        .enumerate()
        .filter(|(_, line)| !line.trim().is_empty())
        .filter(|(_, line)| !line.starts_with('#'))
        .map(|(i, line)| (i + 1, line))
        .collect()
}

fn main() {
    let sales = vec![
        Sale { product: "Widget".into(), amount: 10.0, quantity: 3 },
        Sale { product: "Gadget".into(), amount: 25.0, quantity: 2 },
        Sale { product: "Widget".into(), amount: 10.0, quantity: 1 },
        Sale { product: "Gizmo".into(), amount: 15.0, quantity: 5 },
    ];
    
    let revenue = analyze_sales(sales);
    for (product, total) in &revenue {
        println!("{product}: ${total:.2}");
    }
    
    let log = vec![
        "# Comment".into(),
        "INFO: started".into(),
        "".into(),
        "INFO: processing".into(),
        "ERROR: failed".into(),
    ];
    
    let cleaned = process_log(log);
    println!("{:?}", cleaned);
}
```

## Preguntas de Práctica

1. ¿Cuál es el único método obligatorio en el trait Iterator?
2. ¿Cuál es la diferencia entre adaptadores consumidores y lazy?
3. ¿Cómo sabe `collect` en qué tipo recolectar?
4. ¿Qué hace `filter_map` que `filter` y `map` separados no pueden?
5. ¿Cómo permite `IntoIterator` los bucles `for`?
6. ¿Cuál es la diferencia entre `fold` y `reduce`?
7. ¿Son los iteradores más lentos que los bucles escritos a mano en Rust?
8. ¿Cómo crear un tipo de iterador personalizado?
9. ¿Qué hace `flat_map`?
10. ¿Cómo procesar elementos en chunks usando iteradores?
