---
title: "Iterators"
description: "Domine o trait Iterator, adaptadores (map, filter, fold, collect), adaptadores consumidores e avaliação lazy"
order: 10
duration: "45 minutos"
difficulty: "intermediário"
---

# Iterators

Iterators são a forma idiomática do Rust para processar sequências de valores. Eles são lazy, combináveis e compilam para código de máquina eficiente — frequentemente mais rápido que loops escritos à mão.

## O Trait Iterator

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // Muitos métodos padrão...
}
```

Qualquer tipo que implemente `Iterator` pode ser usado com adaptadores de iterator:

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
> O trait `Iterator` só requer `next()`. Todos os outros métodos são implementações padrão construídas sobre `next()`.

## Adaptadores Consumidores

Estes chamam `next()` até `None`:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // collect — coleta em uma coleção
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // sum — soma todos os valores
    let sum: i32 = numbers.iter().sum();
    println!("{sum}"); // 15
    
    // count — conta elementos
    let count = numbers.iter().count();
    println!("{count}"); // 5
    
    // fold — acumula com valor inicial
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("{product}"); // 120
    
    // reduce — acumula sem valor inicial
    let sum = numbers.iter().cloned().reduce(|a, b| a + b);
    println!("{:?}", sum); // Some(15)
    
    // for_each — efeitos colaterais
    numbers.iter().for_each(|x| print!("{x} "));
    println!();
    
    // any / all — predicados
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    let all_positive = numbers.iter().all(|x| x > &0);
    println!("has_even: {has_even}, all_positive: {all_positive}");
}
```

## Adaptadores de Iterator (Lazy)

Adaptadores transformam um iterator em outro iterator. Eles são **lazy** — nada acontece até que um adaptador consumidor seja chamado:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // map — transforma cada elemento
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]
    
    // filter — mantém elementos que correspondem ao predicado
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4]
    
    // filter_map — filtra e mapeia em uma passada
    let parsed: Vec<i32> = vec!["1", "two", "3", "four"]
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("{:?}", parsed); // [1, 3]
    
    // flat_map — achata iterators aninhados
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
    
    // chain — combina iterators
    let combined: Vec<i32> = vec![1, 2].iter().chain(vec![3, 4].iter()).cloned().collect();
    println!("{combined:?}"); // [1, 2, 3, 4]
    
    // zip — pareia elementos de dois iterators
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![90, 85, 95];
    let paired: Vec<(&str, i32)> = names.iter().zip(scores.iter()).map(|(n, s)| (*n, *s)).collect();
    println!("{paired:?}");
}
```

> [!SUCCESS]
| Adaptador | Propósito | Exemplo |
|---------|---------|---------|
| `map` | Transformar | `iter.map(\|x\| x * 2)` |
| `filter` | Manter correspondências | `iter.filter(\|x\| x > 0)` |
| `filter_map` | Filtrar + transformar | `iter.filter_map(\|x\| x.parse().ok())` |
| `flat_map` | Achatar aninhados | `iter.flat_map(\|x\| x.split())` |
| `take` | Limitar | `iter.take(5)` |
| `skip` | Pular primeiros N | `iter.skip(5)` |
| `zip` | Parear | `a.iter().zip(b.iter())` |
| `chain` | Concatenar | `a.iter().chain(b.iter())` |
| `enumerate` | Adicionar índice | `iter.enumerate()` |
| `step_by` | Pular passos | `iter.step_by(2)` |

## Trait IntoIterator

Loops `for` usam `IntoIterator` para converter tipos em iterators:

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // IntoIterator::into_iter consome self
    for x in v { // v é consumido
        print!("{x} ");
    }
    // println!("{:?}", v); // ERROR: v movido
    
    // &Vec implementa IntoIterator → produz &i32
    let v = vec![1, 2, 3];
    for x in &v {
        print!("{x} "); // x: &i32
    }
    
    // &mut Vec implementa IntoIterator → produz &mut i32
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
}
```

| IntoIterator em | Produz | Efeito |
|----------------|--------|--------|
| `Vec<T>` | `T` | Consome o vector |
| `&Vec<T>` | `&T` | Empresta |
| `&mut Vec<T>` | `&mut T` | Empréstimo mutável |

## Métodos de Iterator Personalizados

```rust
fn main() {
    // Processamento em chunks
    let data = vec![1, 2, 3, 4, 5, 6];
    
    for chunk in data.chunks(2) {
        println!("{:?}", chunk); // [1,2], [3,4], [5,6]
    }
    
    for window in data.windows(2) {
        println!("{:?}", window); // [1,2], [2,3], [3,4], [4,5], [5,6]
    }
}

// Iterator personalizado — Fibonacci
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

## Performance — Iterators vs Loops

Os iterators do Rust compilam para o mesmo código de máquina que loops escritos à mão:

```rust
// Estes compilam para assembly IDÊNTICO:
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
> Iterators são abstrações de custo zero. O compilador os inline e otimiza, produzindo código equivalente à versão escrita à mão.

## Exemplo Real: Pipeline de Processamento de Dados

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

## Perguntas de Prática

1. Qual é o único método obrigatório no trait Iterator?
2. Qual é a diferença entre adaptadores consumidores e lazy?
3. Como `collect` sabe em qual tipo coletar?
4. O que `filter_map` faz que `filter` e `map` separados não podem?
5. Como `IntoIterator` possibilita loops `for`?
6. Qual é a diferença entre `fold` e `reduce`?
7. Iterators são mais lentos que loops escritos à mão em Rust?
8. Como criar um tipo de iterator personalizado?
9. O que `flat_map` faz?
10. Como processar itens em chunks usando iterators?
