---
title: "Traits y Trait Bounds"
description: "Defina comportamiento compartido con traits, impleméntelos en tipos y restrinja genéricos con trait bounds y cláusulas where"
order: 5
duration: "45 minutos"
difficulty: "intermedio"
---

# Traits y Trait Bounds

Los traits son el mecanismo de Rust para definir comportamiento compartido. Son similares a las interfaces en otros lenguajes pero con diferencias importantes.

## Definiendo e Implementando Traits

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
> Los traits y sus implementaciones deben estar en el mismo crate (regla del huérfano). No puedes implementar `Display` en `Vec` porque ninguno es tuyo.

## Implementaciones por Defecto

```rust
trait Greeter {
    fn greet(&self) -> String;
    fn greet_formal(&self) -> String {
        format!("Greetings, {}", self.greet()) // Por defecto
    }
}

struct Person { name: String }

impl Greeter for Person {
    fn greet(&self) -> String {
        format!("Hi, {}!", self.name)
    }
    // greet_formal usa la predeterminada
}

fn main() {
    let p = Person { name: "Alice".into() };
    println!("{}", p.greet());        // "Hi, Alice!"
    println!("{}", p.greet_formal()); // "Greetings, Hi, Alice!!"
}
```

## Trait Bounds en Funciones

```rust
use std::fmt::Display;

fn notify<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Múltiples bounds
fn notify_display<T: Summary + Display>(item: &T) {
    println!("Display: {item}");
    println!("Summary: {}", item.summarize());
}

// Cláusula where (preferida para bounds complejos)
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

// Nota: impl Trait en posición de retorno significa tipo concreto único
// Para múltiples tipos, use Box<dyn Trait>
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
> `impl Trait` en posición de retorno requiere un único tipo concreto. Si necesitas retornar diferentes tipos condicionalmente, usa `Box<dyn Trait>`.

## Trait Bounds en Structs

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

## Implementaciones Generales (Blanket)

Implementa un trait para todos los tipos que satisfacen un bound:

```rust
use std::fmt::Display;

trait ToString {
    fn to_string(&self) -> String;
}

// Blanket: implementa ToString para todo lo que implementa Display
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
```

> [!SUCCESS]
> Las implementaciones blanket son cómo Rust proporciona `.to_string()` en todos los tipos Display. Son poderosas, pero úsalas con cuidado para evitar implementaciones conflictivas.

## Macros Derive

Traits comunes pueden auto-derivarse:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
struct Config {
    host: String,
    port: u16,
}

// Esto genera implementaciones para todos los traits derivados
```

| Trait | Propósito |
|-------|---------|
| `Debug` | Formateo `{:?}` para depuración |
| `Clone` | `.clone()` para copia profunda |
| `Copy` | Copia bitwise implícita (solo stack) |
| `PartialEq` / `Eq` | Comparación `==` y `!=` |
| `PartialOrd` / `Ord` | Ordenación `<`, `>`, `<=`, `>=` |
| `Hash` | Hashing para HashMap/HashSet |
| `Default` | `Type::default()` |

## Tipos Asociados

Los traits pueden tener tipos asociados:

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

Los traits pueden depender de otros traits:

```rust
trait Printable: Display {  // Printable requiere Display
    fn print(&self) {
        println!("{}", self); // usa Display
    }
}

// O con cláusula where
trait Printable
where
    Self: Display,
{
    fn print(&self) {
        println!("{}", self);
    }
}
```

## Sintaxis Totalmente Calificada

Cuando múltiples traits tienen métodos con el mismo nombre:

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

## Ejemplo Real: Config Serializable

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

## Preguntas de Práctica

1. ¿Qué es un trait en Rust?
2. ¿Cuál es la regla del huérfano?
3. ¿Cómo proporcionar una implementación por defecto en un trait?
4. ¿Cuál es la diferencia entre `impl Trait` y `Box<dyn Trait>`?
5. ¿Qué es una implementación blanket?
6. ¿Qué son las macros derive y qué traits comunes se pueden derivar?
7. ¿Cómo son diferentes los tipos asociados de los parámetros genéricos?
8. ¿Qué es un supertrait y cuándo usar uno?
9. ¿Cómo desambiguar entre métodos con el mismo nombre de diferentes traits?
10. ¿Qué es la cláusula `where` y por qué es útil para bounds complejos?
