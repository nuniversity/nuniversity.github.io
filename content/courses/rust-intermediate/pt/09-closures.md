---
title: "Closures"
description: "Domine closures em Rust: sintaxe, modos de captura (Fn, FnMut, FnOnce), semântica move e padrões"
order: 9
duration: "45 minutos"
difficulty: "intermediário"
---

# Closures

Closures são funções anônimas que podem capturar variáveis de seu ambiente. O sistema de closures do Rust é flexível e eficiente — closures são compilados para structs simples.

## Sintaxe de Closure

```rust
fn main() {
    // Sintaxe completa
    let add_one = |x: i32| -> i32 { x + 1 };
    
    // Inferência de tipo
    let add_two = |x| x + 2;
    
    // Corpo com bloco
    let complex = |x: i32| {
        let y = x * 2;
        y + 1
    };
    
    // Sem parâmetros
    let hello = || println!("hello");
    
    // Múltiplos parâmetros
    let add = |a: i32, b: i32| a + b;
    
    println!("{}", add_one(5));  // 6
    println!("{}", add_two(5));  // 7
}
```

> [!NOTE]
| Padrão | Sintaxe | Exemplo |
|---------|--------|---------|
| Sem params | `|| expr` | `|| 42` |
| Um param | `|x| expr` | `|x| x + 1` |
| Params tipados | `|x: i32| -> i32` | `|x: i32| -> i32 { x + 1 }` |
| Corpo com bloco | `\|x\| { stmt; expr }` | `|x| { let y = x; y }` |

## Modos de Captura

Closures capturam variáveis de seu escopo circundante. O compilador escolhe o modo de captura menos restritivo:

### FnOnce — Consome valores capturados

```rust
fn main() {
    let s = String::from("hello");
    
    let consume = || {
        drop(s);  // s é movido para dentro do closure
    };
    
    consume();
    // consume(); // ERROR: closure não pode ser chamado duas vezes
    // println!("{s}"); // ERROR: s foi movido
}
```

> [!WARNING]
> Closures `FnOnce` só podem ser chamados uma vez porque consomem valores capturados. Eles implementam `FnOnce`, mas não `Fn` ou `FnMut`.

### FnMut — Empresta mutavelmente

```rust
fn main() {
    let mut count = 0;
    
    let mut increment = || {
        count += 1;  // Empresta count mutavelmente
    };
    
    increment();
    increment();
    println!("{count}"); // 2
    
    // let shared = &count; // ERROR: não pode emprestar enquanto emprestado mutavelmente
    // increment(); // Funcionaria se shared não fosse usado
}
```

### Fn — Empresta imutavelmente

```rust
fn main() {
    let prefix = String::from("Hello, ");
    
    let greet = |name: &str| {
        println!("{prefix}{name}");  // Empresta prefix imutavelmente
    };
    
    greet("Alice");
    greet("Bob");
    println!("prefix: {prefix}"); // Ainda acessível
}
```

| Trait | Captura | Chamável | Usado Para |
|-------|---------|----------|----------|
| `Fn` | Por referência | Múltiplas vezes | Acesso somente leitura |
| `FnMut` | Por ref mutável | Múltiplas vezes | Mutação de estado |
| `FnOnce` | Por valor (move) | Uma vez | Consumir valores |

> [!SUCCESS]
> Closures tentam capturar pelo modo menos restritivo. Se um closure só lê, é `Fn`. Se escreve, é `FnMut`. Se move para fora, é `FnOnce`.

## A Palavra-chave move

Força o closure a assumir propriedade das variáveis capturadas:

```rust
fn main() {
    let data = vec![1, 2, 3];
    
    // Sem move: closure empresta data
    let borrow = || println!("{:?}", data);
    
    // Com move: closure assume propriedade
    let owned = move || println!("{:?}", data);
    // println!("{:?}", data); // ERROR: data movido
    
    // Necessário para criar threads
    let nums = vec![1, 2, 3];
    std::thread::spawn(move || {
        println!("{:?}", nums); // nums movido para a thread
    }).join().unwrap();
}
```

### Quando move é Necessário

```rust
use std::thread;

fn main() {
    let message = String::from("hello from thread");
    
    // ERROR: closure pode sobreviver à função atual
    // thread::spawn(|| {
    //     println!("{message}");
    // });
    
    // Correção: mover propriedade para o closure
    thread::spawn(move || {
        println!("{message}");
    }).join().unwrap();
}
```

## Closures como Argumentos

```rust
// Função que recebe um closure
fn apply<F>(f: F, x: i32) -> i32
where
    F: Fn(i32) -> i32,
{
    f(x)
}

// Com FnMut
fn apply_mut<F>(mut f: F, x: i32) -> i32
where
    F: FnMut(i32) -> i32,
{
    f(x)
}

// Com FnOnce
fn apply_once<F>(f: F, x: i32) -> i32
where
    F: FnOnce(i32) -> i32,
{
    f(x)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5)); // 10
    
    let mut total = 0;
    let add_to_total = |x| { total += x; total };
    println!("{}", apply_mut(add_to_total, 5)); // 5
}
```

## Closures como Valores de Retorno

```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y  // Deve capturar por valor
}

fn make_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || { count += 1; count }
}

fn main() {
    let add_five = make_adder(5);
    println!("{}", add_five(3)); // 8
    
    let mut counter = make_counter();
    println!("{}", counter()); // 1
    println!("{}", counter()); // 2
}
```

> [!WARNING]
> Ao retornar closures, use `move` para capturar por valor. Caso contrário, o closure empresta variáveis locais que saem de escopo.

## Closures e Iterators

Closures são a base dos adaptadores de iterator:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // Closure em map
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // Closure em filter
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    
    // Closure com variável capturada
    let threshold = 3;
    let above: Vec<&i32> = numbers.iter().filter(|x| **x > threshold).collect();
    
    // Closure em fold
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    
    println!("{doubled:?} {evens:?} {above:?} {sum}");
}
```

## Comparando Closures e Funções

```rust
fn add_one(x: i32) -> i32 { x + 1 }

fn main() {
    let closure = |x| x + 1;
    let closure_annotated = |x: i32| -> i32 { x + 1 };
    
    // Funções coagim para closures
    let mapped: Vec<i32> = vec![1, 2, 3].iter().map(add_one).collect();
    let mapped2: Vec<i32> = vec![1, 2, 3].iter().map(|x| x + 1).collect();
    
    // Ponteiros de função
    let fp: fn(i32) -> i32 = add_one;
    let fp_caller: fn(i32) -> i32 = |x| x + 1; // Não captura
    
    // Closure com captura — NÃO é um ponteiro de função
    let y = 5;
    let captures = |x| x + y; // Não pode coagir para fn pointer
}
```

| Tipo | Captura? | Tamanho | Caso de Uso |
|------|-----------|------|----------|
| `fn(i32) -> i32` | Não | Ponteiro | APIs de callback |
| `impl Fn(i32) -> i32` | Sim | Tamanho do closure | Funções genéricas |
| `Box<dyn Fn(i32) -> i32>` | Sim | Alocado no heap | Dispatch dinâmico |

## Exemplo Real: Construtor de Configuração

```rust
struct Config {
    transformers: Vec<Box<dyn Fn(String) -> String>>,
}

impl Config {
    fn new() -> Self {
        Config { transformers: Vec::new() }
    }
    
    fn add<F>(&mut self, f: F)
    where
        F: Fn(String) -> String + 'static,
    {
        self.transformers.push(Box::new(f));
    }
    
    fn process(&self, input: String) -> String {
        self.transformers.iter().fold(input, |acc, f| f(acc))
    }
}

fn main() {
    let mut config = Config::new();
    
    let prefix = "LOG: ".to_string();
    config.add(move |s| format!("{prefix}{s}"));
    config.add(|s| s.to_uppercase());
    config.add(|s| s.trim().to_string());
    
    let result = config.process("  hello world  ".to_string());
    println!("{result}"); // "LOG:   HELLO WORLD  "
}
```

## Perguntas de Prática

1. Quais são os três traits de closure em Rust?
2. Como o compilador decide qual trait um closure implementa?
3. O que a palavra-chave `move` faz para closures?
4. Quando `move` é necessário em um closure?
5. Como aceitar um closure como parâmetro de função?
6. Como retornar um closure de uma função?
7. Qual é a diferença entre `fn` (ponteiro de função) e `Fn` (trait de closure)?
8. Por que closures que capturam variáveis não podem coagir para ponteiros de função?
9. O que acontece se você chamar um closure FnOnce duas vezes?
10. Como closures funcionam com adaptadores de iterator como `map` e `filter`?
