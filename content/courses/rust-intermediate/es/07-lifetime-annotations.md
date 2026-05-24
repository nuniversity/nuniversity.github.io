---
title: "Anotaciones de Lifetime"
description: "Comprenda el sistema de lifetimes de Rust: anotaciones, reglas de elisión, lifetimes en structs y el lifetime 'static"
order: 7
duration: "45 minutos"
difficulty: "intermedio"
---

# Anotaciones de Lifetime

Los lifetimes garantizan que las referencias son siempre válidas. El borrow checker las rastrea implícitamente la mayoría del tiempo, pero necesitas anotaciones explícitas cuando Rust no puede descubrirlas.

## ¿Por qué Lifetimes?

Toda referencia tiene un **lifetime** — el ámbito para el cual la referencia es válida. La mayoría del tiempo, los lifetimes son implícitos (elididos). Pero a veces el compilador necesita ayuda:

```rust
// ERROR: missing lifetime specifier
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// Corregido con anotación de lifetime
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

> [!NOTE]
> La anotación `'a` dice: "la referencia retornada vive al menos tanto como `x` e `y`."

## Sintaxis de Anotación de Lifetime

```rust
// Referencia única
fn foo<'a>(x: &'a i32) -> &'a i32 { x }

// Dos referencias con el mismo lifetime
fn bar<'a>(x: &'a str, y: &'a str) -> &'a str { x }

// Dos referencias con lifetimes diferentes
fn baz<'a, 'b>(x: &'a str, y: &'b str) -> &'a str { x }
```

### Convención de Nomenclatura de Lifetime

| Nombre | Convención | Ejemplo |
|------|------------|---------|
| `'a` | Primer lifetime | `fn foo<'a>(x: &'a str)` |
| `'b` | Segundo lifetime | `fn bar<'a, 'b>(x: &'a str, y: &'b str)` |
| `'static` | Especial: programa completo | `&'static str` |

## Anotaciones de Lifetime en Funciones

```rust
// Lifetimes de entrada: 'a y 'b son independientes
fn first<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    x
}

// Lifetime de retorno vinculado al primer parámetro
fn longer<'a>(x: &'a str, y: &str) -> &'a str {
    x
}

// Múltiples lifetimes de entrada, salida vinculada a ambos
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
| Patrón | Significado |
|---------|---------|
| `<'a>(x: &'a str) -> &'a str` | Salida vive tanto como la entrada |
| `<'a, 'b>(x: &'a str, _: &'b str) -> &'a str` | Salida vinculada a la primera entrada |
| `<'a>(_: &str, y: &'a str) -> &'a str` | Salida vinculada a la segunda entrada |

## Anotaciones de Lifetime en Structs

Las structs pueden contener referencias, pero necesitan anotaciones de lifetime:

```rust
struct Excerpt<'a> {
    part: &'a str,  // Excerpt no puede sobrevivir a part
}

impl<'a> Excerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("{announcement}");
        self.part
    }
    // Retorna &str con lifetime elidido = &'a str
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    
    let excerpt = Excerpt { part: first_sentence };
    println!("{}", excerpt.part);
    
    // excerpt no puede sobrevivir a novel
}
```

### Struct con Múltiples Referencias

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

## El Lifetime 'static

`'static` significa que la referencia es válida para el **programa completo**:

```rust
// Literales de string son &'static str
let s: &'static str = "hello";

// Variables estáticas
static MAX_ITEMS: u32 = 100;
static GREETING: &str = "Hello, world!";

// Trait objects con bound 'static
fn handle<T: 'static>(t: T) { /* T no tiene referencias no-'static */ }
```

> [!WARNING]
> `'static` no significa "vive para siempre en tiempo de ejecución" — significa "válido para toda la ejecución del programa." Los valores asignados en la pila con bounds `'static` aún pueden liberarse, solo no mientras están prestados.

### Concepto Erróneo Común

```rust
// Esto generalmente NO es lo que quieres
fn returns_str() -> &'static str {
    let s = String::from("hello");
    // &s // ERROR: s no vive suficiente
    "static literal" // OK: literales de string son 'static
}
```

## Reglas de Elisión de Lifetime

Rust añade automáticamente anotaciones de lifetime siguiendo tres reglas:

1. Cada referencia de entrada obtiene su propio lifetime.
2. Si hay exactamente un lifetime de entrada, se asigna a todas las salidas.
3. Si hay `&self` o `&mut self`, su lifetime se asigna a todas las salidas.

```rust
// Regla 1: entradas obtienen lifetimes
fn foo(x: &str)     → fn foo<'a>(x: &'a str)

// Regla 2: una entrada → misma para salida
fn bar(x: &str) -> &str  → fn bar<'a>(x: &'a str) -> &'a str

// Regla 2 se aplica:
fn first_word(s: &str) -> &str
// = fn first_word<'a>(s: &'a str) -> &'a str

// Regla 3: &self → misma para salida
impl Person {
    fn get_name(&self) -> &str
    // = fn get_name<'a>(&'a self) -> &'a str
    
    fn longest<'b>(&self, other: &'b str) -> &'b str
    // &self obtiene 'a, other obtiene 'b, retorno es 'b
}
```

### Cuando la Elisión Falla

```rust
// Dos entradas, sin self → ambiguo
// fn compare(x: &str, y: &str) -> &str
// = fn compare<'a, 'b>(x: &'a str, y: &'b str) -> &??? 
// ERROR: no puede inferir qué lifetime retornar

// Corrección: anotar
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

// T: 'static significa que T no tiene referencias no-'static
fn process<T: 'static>(value: T) {
    // T puede almacenarse seguramente para siempre
}
```

## Subtipado de Lifetime

Un lifetime puede sobrevivir a otro (varianza):

```rust
// 'a: 'b significa que 'a sobrevive a 'b (subtipado de lifetime)
fn longer<'a, 'b>(x: &'a str, y: &'b str) -> &'a str
where
    'a: 'b,  // 'a vive al menos tanto como 'b
{
    if x.len() > y.len() { x } else { y }
}
```

## Ejemplo Real: Parser de String con Lifetimes

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

## Preguntas de Práctica

1. ¿Qué problema resuelven las anotaciones de lifetime?
2. ¿Qué significa `<'a>` en una firma de función?
3. ¿Cuáles son las tres reglas de elisión de lifetime?
4. ¿Cuándo debes escribir anotaciones de lifetime explícitas?
5. ¿Cómo funcionan los lifetimes en definiciones de struct?
6. ¿Qué es el lifetime `'static`?
7. ¿Qué significa `T: 'a` como un trait bound?
8. ¿Qué es el subtipado de lifetime?
9. ¿Cómo determina el compilador el lifetime de una referencia?
10. ¿Qué sucede si una referencia sobrevive a los datos a los que apunta?
