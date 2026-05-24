---
title: "Traits e Trait Bounds"
description: "Defina comportamento compartilhado com traits, implemente-os em tipos e restrinja genéricos com trait bounds e cláusulas where"
order: 5
duration: "45 minutos"
difficulty: "intermediário"
---

# Traits e Trait Bounds

Traits são o mecanismo do Rust para definir comportamento compartilhado. Eles são similares a interfaces em outras linguagens, mas com diferenças importantes.

## Definindo e Implementando Traits

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    headline: String,
    content: String,
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.headline, &self.content[..20.min(self.content.len())])
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, &self.content[..20.min(self.content.len())])
    }
}

fn main() {
    let article = Article {
        headline: "Rust 2024 released".into(),
        content: "The Rust team announces edition 2024...".into(),
    };
    let tweet = Tweet {
        username: "rustlang".into(),
        content: "Edition 2024 is here!".into(),
    };
    
    println!("{}", article.summarize());
    println!("{}", tweet.summarize());
}
```

> [!NOTE]
> Traits e suas implementações devem estar na mesma crate (regra do órfão). Você não pode implementar `Display` em `Vec` porque nenhum dos dois é seu.

## Implementações Padrão

```rust
trait Greeter {
    fn greet(&self) -> String;
    fn greet_formal(&self) -> String {
        format!("Greetings, {}", self.greet()) // Padrão
    }
}

struct Person { name: String }

impl Greeter for Person {
    fn greet(&self) -> String {
        format!("Hi, {}!", self.name)
    }
    // greet_formal usa a padrão
}

fn main() {
    let p = Person { name: "Alice".into() };
    println!("{}", p.greet());        // "Hi, Alice!"
    println!("{}", p.greet_formal()); // "Greetings, Hi, Alice!!"
}
```

## Trait Bounds em Funções

```rust
use std::fmt::Display;

fn notify<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Múltiplos bounds
fn notify_display<T: Summary + Display>(item: &T) {
    println!("Display: {item}");
    println!("Summary: {}", item.summarize());
}

// Cláusula where (preferida para bounds complexos)
fn notify_where<T>(item: &T)
where
    T: Summary + Display,
{
    println!("{item}");
    println!("{}", item.summarize());
}
```

### Retornando Traits

```rust
fn make_summarizable() -> impl Summary {
    Tweet {
        username: "newsbot".into(),
        content: "Breaking news!".into(),
    }
}

// Nota: impl Trait em posição de retorno significa tipo concreto único
// Para múltiplos tipos, use Box<dyn Trait>
fn make_summarizable_dyn(switch: bool) -> Box<dyn Summary> {
    if switch {
        Box::new(Article {
            headline: "News".into(),
            content: "Content".into(),
        })
    } else {
        Box::new(Tweet {
            username: "user".into(),
            content: "hello".into(),
        })
    }
}
```

> [!WARNING]
> `impl Trait` em posição de retorno requer um único tipo concreto. Se você precisa retornar diferentes tipos condicionalmente, use `Box<dyn Trait>`.

## Trait Bounds em Structs

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T: PartialOrd> Pair<T> {
    fn larger(&self) -> &T {
        if self.x >= self.y { &self.x } else { &self.y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("larger: {}", self.x);
        } else {
            println!("larger: {}", self.y);
        }
    }
}
```

## Implementações Abrangentes (Blanket)

Implemente um trait para todos os tipos que satisfazem um bound:

```rust
use std::fmt::Display;

trait ToString {
    fn to_string(&self) -> String;
}

// Blanket: implementa ToString para tudo que implementa Display
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
```

> [!SUCCESS]
> Implementações abrangentes são como Rust fornece `.to_string()` em todos os tipos Display. São poderosas, mas use com cuidado para evitar implementações conflitantes.

## Macros Derive

Traits comuns podem ser auto-derivados:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
struct Config {
    host: String,
    port: u16,
}

// Isso gera implementações para todos os traits derivados
```

| Trait | Propósito |
|-------|---------|
| `Debug` | Formatação `{:?}` para depuração |
| `Clone` | `.clone()` para cópia profunda |
| `Copy` | Cópia bitwise implícita (apenas stack) |
| `PartialEq` / `Eq` | Comparação `==` e `!=` |
| `PartialOrd` / `Ord` | Ordenação `<`, `>`, `<=`, `>=` |
| `Hash` | Hashing para HashMap/HashSet |
| `Default` | `Type::default()` |

## Tipos Associados

Traits podem ter tipos associados:

```rust
trait Iterator {
    type Item;
    
    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: usize,
}

impl Iterator for Counter {
    type Item = usize;
    
    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        Some(self.count)
    }
}
```

## Supertraits

Traits podem depender de outros traits:

```rust
trait Printable: Display {  // Printable requer Display
    fn print(&self) {
        println!("{}", self); // usa Display
    }
}

// Ou com cláusula where
trait Printable
where
    Self: Display,
{
    fn print(&self) {
        println!("{}", self);
    }
}
```

## Sintaxe Totalmente Qualificada

Quando múltiplos traits têm métodos com o mesmo nome:

```rust
trait Pilot {
    fn fly(&self) -> String;
}

trait Wizard {
    fn fly(&self) -> String;
}

struct Human;

impl Pilot for Human {
    fn fly(&self) -> String { "pilot flying".into() }
}

impl Wizard for Human {
    fn fly(&self) -> String { "wizard flying".into() }
}

impl Human {
    fn fly(&self) -> String { "human walking".into() }
}

fn main() {
    let person = Human;
    println!("{}", person.fly());          // "human walking"
    println!("{}", Pilot::fly(&person));   // "pilot flying"
    println!("{}", Wizard::fly(&person));  // "wizard flying"
}
```

## Exemplo Real: Config Serializável

```rust
use std::fmt;
use std::str::FromStr;

trait ConfigValue: fmt::Display + FromStr + Clone {}
impl<T: fmt::Display + FromStr + Clone> ConfigValue for T {}

#[derive(Debug, Clone)]
struct ConfigField<T: ConfigValue> {
    key: String,
    value: T,
    description: String,
}

impl<T: ConfigValue> ConfigField<T> {
    fn new(key: &str, value: T, description: &str) -> Self {
        ConfigField {
            key: key.into(),
            value,
            description: description.into(),
        }
    }
    
    fn update(&mut self, new_value: &str) -> Result<(), String> {
        self.value = T::from_str(new_value)
            .map_err(|_| format!("invalid value for {}", self.key))?;
        Ok(())
    }
}

fn main() {
    let mut port = ConfigField::new("port", 8080u16, "Server port");
    println!("{}: {} ({})", port.key, port.value, port.description);
    port.update("9090").unwrap();
    println!("Updated: {}", port.value);
}
```

## Perguntas de Prática

1. O que é um trait em Rust?
2. Qual é a regra do órfão?
3. Como fornecer uma implementação padrão em um trait?
4. Qual é a diferença entre `impl Trait` e `Box<dyn Trait>`?
5. O que é uma implementação abrangente (blanket)?
6. O que são macros derive e quais traits comuns podem ser derivados?
7. Como tipos associados são diferentes de parâmetros genéricos?
8. O que é um supertrait e quando usar um?
9. Como desambiguar entre métodos com o mesmo nome de diferentes traits?
10. O que é a cláusula `where` e por que é útil para bounds complexos?
