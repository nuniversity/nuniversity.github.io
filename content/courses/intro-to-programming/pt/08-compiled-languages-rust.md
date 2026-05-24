---
title: "Linguagens de Programação Compiladas com Rust"
description: "Aprenda sobre linguagens compiladas, segurança de memória e programação de sistemas usando Rust"
order: 8
duration: "35 minutes"
difficulty: "intermediate"
---

# Linguagens de Programação Compiladas com Rust

JavaScript e Python são interpretados — um interpretador lê e executa seu código linha por linha em tempo de execução. Linguagens compiladas como Rust funcionam de forma diferente: um compilador traduz todo o seu programa para código de máquina antes de executá-lo.

## Interpretado vs Compilado

| Aspecto | Interpretado (JS, Python) | Compilado (Rust, C, Go) |
|---------|---------------------------|--------------------------|
| Execução | Lido e executado linha por linha | Traduzido para código de máquina primeiro |
| Inicialização | Instantâneo para código pequeno | Leve atraso durante a compilação |
| Performance | Mais lento em tempo de execução | Execução mais rápida |
| Detecção de erros | Encontrados em execução | Muitos erros capturados na compilação |
| Distribuição | Precisa de código fonte ou runtime | Binário executável único |

## Hello World em Rust

```rust
fn main() {
    println!("Hello, World!");
}
```

- `fn` declara uma função
- `main()` é o ponto de entrada de todo programa Rust
- `println!` é uma macro (note o `!`) que imprime no console

## Sistema de Tipos do Rust

Rust é estaticamente tipado — o compilador sabe o tipo de toda variável:

```rust
fn main() {
    let idade: i32 = 25;         // inteiro de 32 bits
    let nome: &str = "Alice";    // string slice
    let ativo: bool = true;      // booleano
    let pontuacao: f64 = 95.5;   // float de 64 bits
    
    println!("{} tem {} anos", nome, idade);
}
```

Ao contrário de JavaScript, Rust não faz coerção implícita de tipos.

## Variáveis e Mutabilidade

Variáveis em Rust são **imutáveis por padrão**:

```rust
fn main() {
    let x = 5;
    // x = 6;  // Erro: não pode atribuir duas vezes à variável imutável
    
    let mut y = 10;  // `mut` torna mutável
    y = 15;          // Isto é permitido
    println!("y = {}", y);
}
```

Esta imutabilidade por padrão é uma escolha de design deliberada que previne bugs.

## Propriedade e Empréstimo

A característica mais distintiva do Rust é seu sistema de propriedade — garante segurança de memória sem um coletor de lixo.

### Regras de Propriedade

1. Cada valor tem exatamente um **dono**
2. Quando o dono sai de escopo, o valor é descartado
3. Um valor pode ser **emprestado** sem transferir propriedade

```rust
fn main() {
    let s1 = String::from("olá");
    let tamanho = calcular_tamanho(&s1);  // Empresta s1, não toma posse
    println!("'{}' tem tamanho {}", s1, tamanho);  // s1 ainda é utilizável
}

fn calcular_tamanho(s: &String) -> usize {
    s.len()  // Retorna o tamanho
}
```

O símbolo `&` cria uma **referência** — ela empresta o valor sem tomar posse.

### Referências Mutáveis

```rust
fn main() {
    let mut s = String::from("olá");
    mudar(&mut s);
    println!("{}", s);  // "olá, mundo"
}

fn mudar(s: &mut String) {
    s.push_str(", mundo");
}
```

> [!NOTE]
> Rust previne condições de corrida em tempo de compilação: você pode ter ou uma referência mutável ou qualquer número de referências imutáveis, mas não ambas simultaneamente.

## A Expressão match

O `match` do Rust é uma poderosa construção de correspondência de padrões:

```rust
fn descrever_numero(n: i32) -> &'static str {
    match n {
        0 => "zero",
        1..=9 => "pequeno",
        10..=99 => "médio",
        _ => "grande"  // caso padrão
    }
}

fn main() {
    println!("{}", descrever_numero(42));   // "médio"
    println!("{}", descrever_numero(100));  // "grande"
}
```

## Exercício Prático

Escreva um programa Rust que verifica se um número é par ou ímpar:

```rust
fn eh_par(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    let numeros = [1, 2, 3, 4, 5, 6];
    
    for num in numeros {
        if eh_par(*num) {
            println!("{} é par", num);
        } else {
            println!("{} é ímpar", num);
        }
    }
}
```

## Resumo

| Conceito | Rust | JavaScript |
|----------|------|------------|
| Declaração de variável | `let x = 5;` | `let x = 5;` |
| Variável mutável | `let mut x = 5;` | `let x = 5;` (todo let é mutável) |
| Constante | `const X: i32 = 5;` | `const X = 5;` |
| Função | `fn add(a: i32) -> i32` | `function add(a) { return a; }` |
| Referência | `&x` | N/A (objetos são tipos de referência) |
| Correspondência | `match x { ... }` | `switch (x) { ... }` |

## Próximos Passos

A próxima lição introduz programação declarativa — uma forma diferente de pensar onde você descreve o que quer, não como obter.
