---
title: "Anotações de Lifetime"
description: "Entenda o sistema de lifetimes do Rust: anotações, regras de elisão, lifetimes em structs e o lifetime 'static"
order: 7
duration: "45 minutos"
difficulty: "intermediário"
---

# Anotações de Lifetime

Lifetimes garantem que referências são sempre válidas. O borrow checker as rastreia implicitamente na maioria das vezes, mas você precisa de anotações explícitas quando o Rust não consegue descobrir.

## Por que Lifetimes?

Toda referência tem um **lifetime** — o escopo para o qual a referência é válida. Na maioria das vezes, os lifetimes são implícitos (elididos). Mas às vezes o compilador precisa de ajuda:

```rust
// ERROR: missing lifetime specifier
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// Corrigido com anotação de lifetime
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

> [!NOTE]
> A anotação `'a` diz: "a referência retornada vive pelo menos tanto quanto `x` e `y`."

## Sintaxe de Anotação de Lifetime

```rust
// Referência única
fn foo<'a>(x: &'a i32) -> &'a i32 { x }

// Duas referências com mesmo lifetime
fn bar<'a>(x: &'a str, y: &'a str) -> &'a str { x }

// Duas referências com lifetimes diferentes
fn baz<'a, 'b>(x: &'a str, y: &'b str) -> &'a str { x }
```

### Convenção de Nomenclatura de Lifetime

| Nome | Convenção | Exemplo |
|------|------------|---------|
| `'a` | Primeiro lifetime | `fn foo<'a>(x: &'a str)` |
| `'b` | Segundo lifetime | `fn bar<'a, 'b>(x: &'a str, y: &'b str)` |
| `'static` | Especial: programa inteiro | `&'static str` |

## Anotações de Lifetime em Funções

```rust
// Lifetimes de entrada: 'a e 'b são independentes
fn first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    x
}

// Lifetime de retorno vinculado ao primeiro parâmetro
fn longer<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

// Múltiplos lifetimes de entrada, saída vinculada a ambos
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    announcement: &'b str,
) -> &'a str {
    println!("ANNOUNCEMENT: {announcement}");
    if x.len() > y.len() { x } else { y }
}
```

> [!SUCCESS]
| Padrão | Significado |
|---------|---------|
| `<'a>(x: &'a str) -> &'a str` | Saída vive tanto quanto a entrada |
| `<'a, 'b>(x: &'a str, _: &'b str) -> &'a str` | Saída vinculada à primeira entrada |
| `<'a>(_: &str, y: &'a str) -> &'a str` | Saída vinculada à segunda entrada |

## Anotações de Lifetime em Structs

Structs podem conter referências, mas precisam de anotações de lifetime:

```rust
struct Excerpt<'a> {
    part: &'a str,  // Excerpt não pode sobreviver a part
}

impl<'a> Excerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("{announcement}");
        self.part
    }
    // Retorna &str com lifetime elidido = &'a str
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    
    let excerpt = Excerpt { part: first_sentence };
    println!("{}", excerpt.part);
    
    // excerpt não pode sobreviver a novel
}
```

### Struct com Múltiplas Referências

```rust
struct MultiRef<'a, 'b> {
    x: &'a str,
    y: &'b str,
}

impl<'a, 'b> MultiRef<'a, 'b> {
    fn longer(&self) -> &str
    where
        'a: 'b,  // 'a sobrevive a 'b
    {
        if self.x.len() > self.y.len() { self.x } else { self.y }
    }
}
```

## O Lifetime 'static

`'static` significa que a referência é válida para o **programa inteiro**:

```rust
// Literais de string são &'static str
let s: &'static str = "hello";

// Variáveis estáticas
static MAX_ITEMS: u32 = 100;
static GREETING: &str = "Hello, world!";

// Trait objects com bound 'static
fn handle<T: 'static>(t: T) { /* T não tem referências não-'static */ }
```

> [!WARNING]
> `'static` não significa "vive para sempre em tempo de execução" — significa "válido para toda a execução do programa." Valores alocados na stack com bounds `'static` ainda podem ser liberados, apenas não enquanto emprestados.

### Equívoco Comum

```rust
// Isso geralmente NÃO é o que você quer
fn returns_str() -> &'static str {
    let s = String::from("hello");
    // &s // ERROR: s não vive o suficiente
    "static literal" // OK: literais de string são 'static
}
```

## Regras de Elisão de Lifetime

Rust adiciona automaticamente anotações de lifetime seguindo três regras:

1. Cada referência de entrada ganha seu próprio lifetime.
2. Se houver exatamente um lifetime de entrada, ele é atribuído a todas as saídas.
3. Se houver `&self` ou `&mut self`, seu lifetime é atribuído a todas as saídas.

```rust
// Regra 1: entradas ganham lifetimes
fn foo(x: &str)     → fn foo<'a>(x: &'a str)

// Regra 2: uma entrada → mesma para saída
fn bar(x: &str) -> &str  → fn bar<'a>(x: &'a str) -> &'a str

// Regra 2 se aplica:
fn first_word(s: &str) -> &str
// = fn first_word<'a>(s: &'a str) -> &'a str

// Regra 3: &self → mesma para saída
impl Person {
    fn get_name(&self) -> &str
    // = fn get_name<'a>(&'a self) -> &'a str
    
    fn longest<'b>(&self, other: &'b str) -> &'b str
    // &self ganha 'a, other ganha 'b, retorno é 'b
}
```

### Quando a Elisão Falha

```rust
// Duas entradas, sem self → ambíguo
// fn compare(x: &str, y: &str) -> &str
// = fn compare<'a, 'b>(x: &'a str, y: &'b str) -> &??? 
// ERROR: não pode inferir qual lifetime retornar

// Correção: anotar
fn compare<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

## Bounds de Lifetime

```rust
// T: 'a significa que T sobrevive a 'a
struct Ref<'a, T: 'a> {
    data: &'a T,
}

// T: 'static significa que T não tem referências não-'static
fn process<T: 'static>(value: T) {
    // T pode ser armazenado com segurança para sempre
}
```

## Subtipagem de Lifetime

Um lifetime pode sobreviver a outro (variância):

```rust
// 'a: 'b significa que 'a sobrevive a 'b (subtipagem de lifetime)
fn longer<'a, 'b>(x: &'a str, y: &'b str) -> &'a str
where
    'a: 'b,  // 'a vive pelo menos tanto quanto 'b
{
    if x.len() > y.len() { x } else { y }
}
```

## Exemplo Real: Parser de String com Lifetimes

```rust
#[derive(Debug)]
struct Parser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, pos: 0 }
    }
    
    fn next_word(&mut self) -> Option<&'a str> {
        let rest = &self.input[self.pos..];
        let trimmed = rest.trim_start();
        self.pos = rest.len() - trimmed.len(); // simplificado
        
        if let Some(end) = trimmed.find(char::is_whitespace) {
            self.pos += rest.len() - trimmed.len() + end;
            Some(&trimmed[..end])
        } else if !trimmed.is_empty() {
            self.pos = self.input.len();
            Some(trimmed)
        } else {
            None
        }
    }
}

fn main() {
    let data = String::from("hello world rust");
    let mut parser = Parser::new(&data);
    
    while let Some(word) = parser.next_word() {
        println!("{word}");
    }
}
```

## Perguntas de Prática

1. Que problema as anotações de lifetime resolvem?
2. O que `<'a>` significa em uma assinatura de função?
3. Quais são as três regras de elisão de lifetime?
4. Quando você deve escrever anotações de lifetime explícitas?
5. Como lifetimes funcionam em definições de struct?
6. O que é o lifetime `'static`?
7. O que `T: 'a` significa como um trait bound?
8. O que é subtipagem de lifetime?
9. Como o compilador determina o lifetime de uma referência?
10. O que acontece se uma referência sobreviver aos dados para os quais aponta?
