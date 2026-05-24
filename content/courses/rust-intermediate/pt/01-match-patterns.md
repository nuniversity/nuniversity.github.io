---
title: "Match e Padrões"
description: "Domine a correspondência de padrões do Rust: literais, intervalos, desestruturação, guards e ergonomia avançada de match"
order: 1
duration: "45 minutos"
difficulty: "intermediário"
---

# Match e Padrões

A correspondência de padrões é um dos recursos mais poderosos do Rust. Ela combina lógica condicional com desestruturação em uma única sintaxe expressiva.

## Revisão da Sintaxe de Match

```rust
fn descrever_numero(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1 | 2 | 3 => "pequeno",
        4..=10 => "médio",
        _ if n > 100 => "grande",  // Guard
        _ => "outro",
    }
}
```

## Tipos de Padrões

### Padrões Literais

Combine valores específicos:

```rust
fn eh_fim_de_semana(dia: &str) -> bool {
    match dia {
        "sábado" | "domingo" => true,
        _ => false,
    }
}
```

### Padrões de Intervalo

```rust
fn nota_por_pontuacao(pontos: u8) -> &'static str {
    match pontos {
        90..=100 => "A",
        80..=89 => "B",
        70..=79 => "C",
        60..=69 => "D",
        0..=59 => "F",
    }
}

fn corresponder_char(c: char) -> &'static str {
    match c {
        'a'..='z' => "minúsculo",
        'A'..='Z' => "maiúsculo",
        '0'..='9' => "dígito",
        _ => "outro",
    }
}
```

> [!NOTE]
| Padrão de Intervalo | Sintaxe | Exemplo |
|---------------------|---------|---------|
| Inclusivo | `..=` | `1..=5` corresponde a 1,2,3,4,5 |
| Semi-aberto | `..` | `1..5` corresponde a 1,2,3,4 (não válido em match, apenas em for) |
| Aberto | `..` | `..=5` ou `5..` (em match, use guards) |

### Padrões de Desestruturação

#### Structs

```rust
struct Ponto {
    x: i32,
    y: i32,
}

fn main() {
    let p = Ponto { x: 10, y: 20 };
    
    match p {
        Ponto { x, y } => println!("({x}, {y})"),
    }
    
    // Desestruturação parcial com ..
    match p {
        Ponto { x, .. } => println!("x: {x}"),
    }
    
    // Renomear campos
    match p {
        Ponto { x: a, y: b } => println!("({a}, {b})"),
    }
}
```

#### Enums

```rust
enum Mensagem {
    Sair,
    Mover { x: i32, y: i32 },
    Escrever(String),
    MudarCor(i32, i32, i32),
}

fn manipular(msg: Mensagem) {
    match msg {
        Mensagem::Sair => println!("sair"),
        Mensagem::Mover { x, y } => println!("mover para ({x}, {y})"),
        Mensagem::Escrever(texto) => println!("{texto}"),
        Mensagem::MudarCor(r, g, b) => println!("RGB({r}, {g}, {b})"),
    }
}
```

#### Tuplas

```rust
fn descrever_ponto(p: (i32, i32, i32)) -> &'static str {
    match p {
        (0, 0, 0) => "origem",
        (0, 0, _) => "no eixo z",
        (0, _, _) => "no plano x=0",
        (_, 0, _) => "no plano y=0",
        (_, _, 0) => "no plano z=0",
        _ => "no espaço",
    }
}
```

#### Arrays e Slices

```rust
fn primeiro_e_ultimo(arr: &[i32]) -> Option<(&i32, &i32)> {
    match arr {
        [primeiro, .., ultimo] => Some((primeiro, ultimo)),
        _ => None,
    }
}

fn soma_dois_primeiros(arr: &[i32]) -> i32 {
    match arr {
        [a, b, ..] => a + b,
        [a] => *a,
        [] => 0,
    }
}
```

> [!SUCCESS]
> Padrões de slice com `..` (padrão de resto) facilitam a correspondência na estrutura de coleções. O compilador verifica exaustividade mesmo com padrões complexos.

### Padrões de Guarda

Adicione condições extras com `if`:

```rust
fn classificar_numero(n: i32) -> &'static str {
    match n {
        x if x < 0 => "negativo",
        x if x % 2 == 0 => "positivo par",
        _ => "positivo ímpar",
    }
}

fn corresponder_par(par: (i32, i32)) -> &'static str {
    match par {
        (x, y) if x == y => "iguais",
        (x, y) if x + y == 0 => "negativos",
        (x, _) if x > 0 => "primeiro positivo",
        _ => "outro",
    }
}
```

### Ligações @

Vincule o valor correspondido a um nome enquanto desestrutura:

```rust
fn inspecionar(valor: Option<i32>) {
    match valor {
        Some(x @ 0..=10) => println!("positivo pequeno: {x}"),
        Some(x @ 11..=100) => println!("positivo médio: {x}"),
        Some(x) => println!("positivo grande: {x}"),
        None => println!("nenhum"),
    }
}

// Com desestruturação aninhada
struct Pessoa {
    nome: String,
    idade: u8,
}

fn cumprimentar(pessoa: Pessoa) {
    match pessoa {
        Pessoa { nome, idade: idade @ 0..=12 } => {
            println!("Oi {nome}, você tem {idade} — é criança!");
        }
        Pessoa { nome, idade: idade @ 13..=19 } => {
            println!("Ei {nome}, você tem {idade} — é adolescente!");
        }
        Pessoa { nome, idade } => {
            println!("Olá {nome}, você tem {idade}.");
        }
    }
}
```

### Múltiplos Padrões com |

```rust
fn eh_vogal(c: char) -> bool {
    matches!(c, 'a' | 'e' | 'i' | 'o' | 'u' | 'A' | 'E' | 'I' | 'O' | 'U')
}

fn descrever_dia(n: u8) -> &'static str {
    match n {
        1 | 7 => "fim de semana",
        2..=6 => "dia útil",
        _ => "inválido",
    }
}
```

## A Macro matches!

Para verificações booleanas simples de padrões:

```rust
fn main() {
    let foo = Some(42);
    assert!(matches!(foo, Some(x) if x > 0));
    
    let arr = [1, 2, 3];
    assert!(matches!(arr, [1, _, _]));
}
```

## Ergonomia de Match

Rust desreferencia automaticamente em padrões de match:

```rust
fn main() {
    let x = &Some(42);
    
    // Sem ergonomia (pré-2018):
    match x {
        &Some(ref y) => println!("{y}"),
        &None => (),
    }
    
    // Com ergonomia (2018+):
    match x {
        Some(y) => println!("{y}"),
        None => (),
    }
}
```

### Padrões Ref

Use `ref` e `ref mut` para tomar valores emprestados:

```rust
fn main() {
    let s = Some(String::from("olá"));
    
    match s {
        Some(ref s) => println!("emprestado: {s}"),  // s é &String
        None => (),
    }
    
    println!("ainda possuído: {:?}", s); // s não foi movido
    
    let mut t = Some(String::from("mundo"));
    match t {
        Some(ref mut s) => *s = String::from("alterado"),
        None => (),
    }
    println!("{:?}", t); // Some("alterado")
}
```

## Correspondência de Padrões em Outros Contextos

### Declarações let

```rust
let (x, y, z) = (1, 2, 3);
let Ponto { x: a, y: b } = Ponto { x: 10, y: 20 };
```

### Parâmetros de Função

```rust
fn imprimir_coordenadas(&(x, y): &(i32, i32)) {
    println!("({x}, {y})");
}

fn somar_coordenadas(Ponto { x, y }: &Ponto) -> i32 {
    x + y
}
```

### if let / while let

```rust
fn main() {
    let mut pilha = vec![1, 2, 3];
    while let Some(topo) = pilha.pop() {
        println!("{topo}");
    }
    
    let coords = (0, 5);
    if let (0, y) = coords {
        println!("no eixo y em {y}");
    }
}
```

### for loops

```rust
fn main() {
    let pares = [(1, 2), (3, 4), (5, 6)];
    for (a, b) in &pares {
        println!("{a} + {b} = {}", a + b);
    }
    
    let mapa = std::collections::HashMap::from([("a", 1), ("b", 2)]);
    for (chave, valor) in &mapa {
        println!("{chave}: {valor}");
    }
}
```

## Correspondência de Tipos de Referência e Ponteiro

```rust
fn main() {
    let x = 42;
    let y = &x;
    let z = Box::new(x);
    
    match y {
        42 => println!("corresponde ao valor (auto-deref)"),
        _ => println!("sem correspondência"),
    }
    
    match &z {
        42 => println!("Box também corresponde"),
        _ => println!("sem correspondência"),
    }
}
```

## Mundo Real: Avaliador de Expressões

```rust
#[derive(Debug)]
enum Expr {
    Lit(i32),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

fn avaliar(expr: &Expr) -> Option<i32> {
    match expr {
        Expr::Lit(n) => Some(*n),
        Expr::Add(l, r) => Some(avaliar(l)? + avaliar(r)?),
        Expr::Sub(l, r) => Some(avaliar(l)? - avaliar(r)?),
        Expr::Mul(l, r) => Some(avaliar(l)? * avaliar(r)?),
        Expr::Div(l, r) => {
            let r_val = avaliar(r)?;
            if r_val == 0 {
                None
            } else {
                Some(avaliar(l)? / r_val)
            }
        }
    }
}

fn main() {
    let expr = Expr::Add(
        Box::new(Expr::Lit(10)),
        Box::new(Expr::Mul(
            Box::new(Expr::Lit(3)),
            Box::new(Expr::Lit(5)),
        )),
    );
    println!("{:?}", avaliar(&expr)); // Some(25)
}
```

## Perguntas de Prática

1. O que o padrão `..` significa ao desestruturar um struct?
2. Como corresponder um intervalo de valores em match?
3. Qual a diferença entre `|` e `..=` em padrões?
4. Quando usar um guard de match em vez de um match aninhado?
5. O que a ligação `@` faz?
6. Como a correspondência de padrões em `if let` difere de `match`?
7. O que são padrões ref e quando são necessários?
8. Como a macro `matches!` simplifica a correspondência de padrões?
9. Você pode desestruturar um slice com padrões? Dê um exemplo.
10. Como Rust lida com a desreferenciação automática em padrões de match?
