---
title: "Elisión de Lifetime y Patrones Avanzados de Lifetime"
description: "Domine las reglas de elisión de lifetime, patrones de lifetime de entrada/salida, bounds de lifetime y varianza"
order: 8
duration: "45 minutos"
difficulty: "intermedio"
---

# Elisión de Lifetime y Patrones Avanzados de Lifetime

Las reglas de elisión de lifetime de Rust hacen que la mayoría de las anotaciones de lifetime sean innecesarias. Entender exactamente cuándo y cómo funciona la elisión es clave para escribir Rust ergonómico.

## Las Tres Reglas de Elisión

El compilador aplica estas reglas automáticamente:

### Regla 1 — Lifetimes de Entrada

Cada referencia elidida en parámetros de función obtiene un lifetime **distinto**:

```rust
// fn foo(x: &i32, y: &str)
// se convierte en:
fn foo<'a, 'b>(x: &'a i32, y: &'b str) {}
```

### Regla 2 — Lifetime de Entrada Único

Si hay exactamente un lifetime de entrada, se asigna a todas las referencias de salida:

```rust
// fn first_word(s: &str) -> &str
// se convierte en:
fn first_word<'a>(s: &'a str) -> &'a str { unimplemented!() }
```

### Regla 3 — Receptor de Método

Si hay `&self` o `&mut self`, su lifetime se asigna a todas las referencias de salida:

```rust
impl Widget {
    // fn get_name(&self) -> &str
    // se convierte en:
    fn get_name<'a>(&'a self) -> &'a str { unimplemented!() }
}
```

> [!NOTE]
> Las reglas 2 y 3 solo se aplican cuando **no hay lifetimes de salida explícitos**. Si escribes un lifetime en la salida, las reglas no se aplican.

## Lifetimes de Entrada vs Salida

### Lifetimes de Entrada

Lifetimes en parámetros de función:

```rust
// 'a y 'b son lifetimes de entrada
fn process<'a, 'b>(x: &'a str, y: &'b str) {}
```

### Lifetimes de Salida

Lifetimes en valores de retorno:

```rust
// 'a es un lifetime de salida (en el tipo de retorno)
fn select<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### Lifetimes Solo en Posición de Retorno

```rust
// Lifetime solo en el retorno — raro y generalmente incorrecto
// fn foo() -> &'static str { "static" }  // OK — 'static funciona
// fn bar() -> &i32 { /* ¿hacia dónde apunta? */ }  // Error
```

## Elisión en Firmas de Método

```rust
struct Container<'a> {
    data: &'a str,
}

impl<'a> Container<'a> {
    // Elidido: &self → salida
    fn get_data(&self) -> &str {
        // Expandido: fn get_data<'b>(&'b self) -> &'b str
        self.data
    }
    
    // Dos refs de entrada → sin elisión automática de salida
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

## Elisión de Lifetime y Genéricos

```rust
use std::fmt::Display;

// La elisión funciona con genéricos
fn announce_and_return<'a>(announcement: &str, x: &'a str) -> &'a str {
    println!("{announcement}");
    x
}

// Con trait bounds
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

## Bounds de Lifetime en Tipos Genéricos

```rust
// T debe sobrevivir a 'a
struct Wrapper<'a, T: 'a> {
    value: &'a T,
}

// T debe ser 'static (sin referencias no-static)
fn process_static<T: 'static>(value: T) {
    std::mem::drop(value);
}

// Higher-ranked trait bounds: para cualquier lifetime
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
| `T: 'static` | T no tiene referencias no-'static |
| `for<'a> F: Fn(&'a str)` | F funciona para cualquier lifetime |

## Subtipado de Lifetime (Varianza)

Los lifetimes pueden estar en relaciones de subtipado:

```rust
// Covariante: &'a T es subtipo de &'b T si 'a: 'b
// Invariante: &'a mut T — debe ser exacto
// Contravariante: fn(T) — inverso

struct Covariant<'a>(&'a str);     // Covariante en 'a
struct Invariant<'a>(Cell<&'a str>); // Invariante en 'a

fn main() {
    let long = String::from("long lived");
    let short = String::from("short");
    
    let cov: Covariant = Covariant(&long);
    // Puede asignarse a lifetime más corto:
    let _: Covariant<'_> = cov; // OK: covariante
    
    // Invariant fallaría:
    // let inv: Invariant = Invariant(Cell::new(&long));
    // let _: Invariant<'_> = inv; // ERROR: invariante
}
```

## Captura de Lifetime

```rust
// El impl Trait captura lifetimes de la función
fn make_debug<'a>(x: &'a str) -> impl std::fmt::Debug + 'a {
    x
}

// Múltiples lifetimes en impl Trait
fn make_cloneable<'a, 'b>(x: &'a str, y: &'b str) -> impl Clone + 'a + 'b {
    (x, y)
}
```

## Patrones Comunes de Elisión

```rust
// Patrón 1: Lector
fn read(&self) -> &str { /* elidido a lifetime de &self */ }

// Patrón 2: Predicado
fn contains(&self, other: &str) -> bool { /* sin refs de salida */ }

// Patrón 3: Fábrica
fn new(value: &str) -> Self { /* elidido por la regla 2 */ }

// Patrón 4: Múltiples retornos
fn parts(&self) -> (&str, &str) { /* todos obtienen lifetime de &self */ }
```

## El Lifetime Anónimo

Usa `'_` para indicar explícitamente lifetime elidido:

```rust
struct Foo<'a> {
    x: &'a str,
}

impl Foo<'_> {  // '_ significa el lifetime elidido del impl
    fn get(&self) -> &str { self.x }
}

// En firmas de función
fn foo(x: &'_ str) -> &'_ str { x }
```

## Ejemplo Real: Lifetimes en un Caché

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
        // Ningún lifetime explícito necesario — la elisión funciona
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

## Preguntas de Práctica

1. ¿Cuáles son las tres reglas de elisión de lifetime?
2. ¿Cuándo NO se aplica la Regla 2?
3. ¿Cuál es la diferencia entre lifetimes de entrada y salida?
4. ¿Cómo se eliden los lifetimes en firmas de método?
5. ¿Qué significa `T: 'static` como un bound?
6. ¿Qué es un higher-ranked trait bound (HRTB)?
7. ¿Cuál es la diferencia entre covarianza y invarianza para lifetimes?
8. ¿Qué significa el lifetime `'_`?
9. ¿Por qué los lifetimes no pueden elidirse en `fn longest(x: &str, y: &str) -> &str`?
10. ¿Cómo expresas "esta función funciona para cualquier lifetime" con un bound?
