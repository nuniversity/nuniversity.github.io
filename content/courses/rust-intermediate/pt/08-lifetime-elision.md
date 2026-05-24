---
title: "Elisão de Lifetime e Padrões Avançados de Lifetime"
description: "Domine as regras de elisão de lifetime, padrões de lifetime de entrada/saída, bounds de lifetime e variância"
order: 8
duration: "45 minutos"
difficulty: "intermediário"
---

# Elisão de Lifetime e Padrões Avançados de Lifetime

As regras de elisão de lifetime do Rust tornam a maioria das anotações de lifetime desnecessárias. Entender exatamente quando e como a elisão funciona é fundamental para escrever Rust ergonômico.

## As Três Regras de Elisão

O compilador aplica estas regras automaticamente:

### Regra 1 — Lifetimes de Entrada

Cada referência elidida em parâmetros de função ganha um lifetime **distinto**:

```rust
// fn foo(x: &i32, y: &str)
// torna-se:
fn foo<'a, 'b>(x: &'a i32, y: &'b str) {}
```

### Regra 2 — Lifetime de Entrada Único

Se houver exatamente um lifetime de entrada, ele é atribuído a todas as referências de saída:

```rust
// fn first_word(s: &str) -> &str
// torna-se:
fn first_word<'a>(s: &'a str) -> &'a str { unimplemented!() }
```

### Regra 3 — Receptor de Método

Se houver `&self` ou `&mut self`, seu lifetime é atribuído a todas as referências de saída:

```rust
impl Widget {
    // fn get_name(&self) -> &str
    // torna-se:
    fn get_name<'a>(&'a self) -> &'a str { unimplemented!() }
}
```

> [!NOTE]
> As regras 2 e 3 só se aplicam quando **não há lifetimes de saída explícitos**. Se você escrever um lifetime na saída, as regras não se aplicam.

## Lifetimes de Entrada vs Saída

### Lifetimes de Entrada

Lifetimes em parâmetros de função:

```rust
// 'a e 'b são lifetimes de entrada
fn process<'a, 'b>(x: &'a str, y: &'b str) {}
```

### Lifetimes de Saída

Lifetimes em valores de retorno:

```rust
// 'a é um lifetime de saída (no tipo de retorno)
fn select<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### Lifetimes Apenas em Posição de Retorno

```rust
// Lifetime apenas no retorno — raro e geralmente errado
// fn foo() -> &'static str { "static" }  // OK — 'static funciona
// fn bar() -> &i32 { /* para onde aponta? */ }  // Error
```

## Elisão em Assinaturas de Método

```rust
struct Container<'a> {
    data: &'a str,
}

impl<'a> Container<'a> {
    // Elidido: &self → saída
    fn get_data(&self) -> &str {
        // Expandido: fn get_data<'b>(&'b self) -> &'b str
        self.data
    }
    
    // Duas refs de entrada → sem elisão automática de saída
    // fn longer(&self, other: &str) -> &str {
    // Expandido: fn longer<'b, 'c>(&'b self, other: &'c str) -> &'b str
    fn longer<'b>(&'b self, other: &'b str) -> &'b str {
        if self.data.len() > other.len() {
            self.data
        } else {
            other
        }
    }
}
```

## Elisão de Lifetime e Genéricos

```rust
use std::fmt::Display;

// Elisão funciona com genéricos
fn announce_and_return<'a>(announcement: &str, x: &'a str) -> &'a str {
    println!("{announcement}");
    x
}

// Com trait bounds
fn longest_with_display<'a, T: Display + ?Sized>(
    x: &'a T,
    y: &'a T,
) -> &'a T
where
    T: PartialOrd,
{
    if x > y { x } else { y }
}
```

## Bounds de Lifetime em Tipos Genéricos

```rust
// T deve sobreviver a 'a
struct Wrapper<'a, T: 'a> {
    value: &'a T,
}

// T deve ser 'static (sem referências não-static)
fn process_static<T: 'static>(value: T) {
    std::mem::drop(value);
}

// Higher-ranked trait bounds: para qualquer lifetime
fn with_hrtb<F>(f: F)
where
    F: for<'a> Fn(&'a str) -> &'a str,
{
    println!("{}", f("hello"));
}
```

> [!SUCCESS]
| Bound | Significado |
|-------|---------|
| `T: 'a` | T sobrevive a 'a |
| `T: 'static` | T não tem referências não-'static |
| `for<'a> F: Fn(&'a str)` | F funciona para qualquer lifetime |

## Subtipagem de Lifetime (Variância)

Lifetimes podem estar em relações de subtipagem:

```rust
// Covariante: &'a T é subtipo de &'b T se 'a: 'b
// Invariante: &'a mut T — deve ser exato
// Contravariante: fn(T) — inverso

struct Covariant<'a>(&'a str);     // Covariante em 'a
struct Invariant<'a>(Cell<&'a str>); // Invariante em 'a

fn main() {
    let long = String::from("long lived");
    let short = String::from("short");
    
    let cov: Covariant = Covariant(&long);
    // Pode atribuir a lifetime mais curto:
    let _: Covariant<'_> = cov; // OK: covariante
    
    // Invariant falharia:
    // let inv: Invariant = Invariant(Cell::new(&long));
    // let _: Invariant<'_> = inv; // ERROR: invariante
}
```

## Captura de Lifetime

```rust
// O impl Trait captura lifetimes da função
fn make_debug<'a>(x: &'a str) -> impl std::fmt::Debug + 'a {
    x
}

// Múltiplos lifetimes em impl Trait
fn make_cloneable<'a, 'b>(x: &'a str, y: &'b str) -> impl Clone + 'a + 'b {
    (x, y)
}
```

## Padrões Comuns de Elisão

```rust
// Padrão 1: Leitor
fn read(&self) -> &str { /* elidido para lifetime de &self */ }

// Padrão 2: Predicado
fn contains(&self, other: &str) -> bool { /* sem refs de saída */ }

// Padrão 3: Fábrica
fn new(value: &str) -> Self { /* elidido pela regra 2 */ }

// Padrão 4: Múltiplos retornos
fn parts(&self) -> (&str, &str) { /* todos ganham lifetime de &self */ }
```

## O Lifetime Anônimo

Use `'_` para indicar explicitamente lifetime elidido:

```rust
struct Foo<'a> {
    x: &'a str,
}

impl Foo<'_> {  // '_ significa o lifetime elidido do impl
    fn get(&self) -> &str { self.x }
}

// Em assinaturas de função
fn foo(x: &'_ str) -> &'_ str { x }
```

## Exemplo Real: Lifetimes em um Cache

```rust
use std::collections::HashMap;

struct Index<'a> {
    data: &'a str,
    positions: HashMap<&'a str, usize>,
}

impl<'a> Index<'a> {
    fn new(data: &'a str) -> Self {
        let mut positions = HashMap::new();
        for (i, line) in data.lines().enumerate() {
            for word in line.split_whitespace() {
                positions.entry(word).or_insert(i);
            }
        }
        Index { data, positions }
    }
    
    fn find(&self, word: &str) -> Option<&'a str> {
        // Nenhum lifetime explícito necessário — elisão funciona
        self.positions.get(word).map(|&line| {
            self.data.lines().nth(line).unwrap_or("")
        })
    }
}

fn main() {
    let text = String::from("apple banana\ncherry date");
    let index = Index::new(&text);
    
    if let Some(line) = index.find("cherry") {
        println!("Found: {line}"); // "cherry date"
    }
}
```

## Perguntas de Prática

1. Quais são as três regras de elisão de lifetime?
2. Quando a Regra 2 NÃO se aplica?
3. Qual é a diferença entre lifetimes de entrada e saída?
4. Como os lifetimes são elididos em assinaturas de método?
5. O que `T: 'static` significa como um bound?
6. O que é um higher-ranked trait bound (HRTB)?
7. Qual é a diferença entre covariância e invariância para lifetimes?
8. O que o lifetime `'_` significa?
9. Por que lifetimes não podem ser elididos em `fn longest(x: &str, y: &str) -> &str`?
10. Como expressar "esta função funciona para qualquer lifetime" com um bound?
