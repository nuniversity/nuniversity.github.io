---
title: "Ownership"
description: "Domina la característica más única de Rust: reglas de ownership, semántica de movimiento, el trait Copy y Clone"
order: 6
duration: "35 minutos"
difficulty: "principiante"
---

# Ownership

Ownership es la característica más distintiva de Rust. Permite seguridad de memoria sin un recolector de basura al imponer reglas estrictas en tiempo de compilación.

## Las Reglas de Ownership

1. **Cada valor tiene exactamente un dueño.**
2. **Solo puede haber un dueño a la vez.**
3. **Cuando el dueño sale de ámbito, el valor se libera.**

```rust
fn main() {
    {                           // s no es válido aquí
        let s = String::from("hola"); // s se vuelve válido
        // usar s
    }                           // s sale de ámbito, memoria liberada
}
```

> [!NOTE]
> Cuando `s` sale de ámbito, Rust llama `drop()` automáticamente — como C++ RAII pero sin la gestión manual de destructores.

## Semántica de Movimiento

Cuando asignas o pasas un valor, la ownership **se mueve**:

```rust
fn main() {
    let s1 = String::from("hola");
    let s2 = s1;  // s1 es MOVIDO a s2
    
    // println!("{s1}"); // ERROR: préstamo de valor movido
    println!("{s2}"); // OK: s2 posee la cadena
}
```

Después del movimiento, `s1` es **invalidado**. El compilador previene uso-después-de-movimiento.

> [!SUCCESS]
> Los movimientos son baratos — solo copian un puntero, longitud y capacidad. Ningún dato del heap se copia. El antiguo dueño simplemente se marca como inválido en tiempo de compilación.

### Qué Sucede en la Memoria

```
Antes del movimiento:
s1 -> { ptr: "hola", len: 4, cap: 4 }
          |
          v
       [h][o][l][a]  (heap)

Después del movimiento:
s1 -> INVALID (impuesto por el compilador)
s2 -> { ptr: "hola", len: 4, cap: 4 }
          |
          v
       [h][o][l][a]  (misma memoria del heap)
```

## Movimiento en Funciones

```rust
fn toma_ownership(s: String) {  // s toma ownership
    println!("{s}");
}  // s liberado aquí, heap liberado

fn hace_copia(i: i32) {  // i es copiado (trait Copy)
    println!("{i}");
}  // i sale de ámbito, nada especial

fn main() {
    let s = String::from("hola");
    toma_ownership(s);
    // println!("{s}"); // ERROR: movido
    
    let x = 42;
    hace_copia(x);
    println!("{x}"); // OK: x es Copy
}
```

### Retornando Ownership

```rust
fn da_ownership() -> String {
    let s = String::from("hola");
    s  // Ownership se mueve al llamante
}

fn toma_y_da(s: String) -> String {
    s  // Ownership se mueve nuevamente
}

fn main() {
    let s1 = da_ownership();
    let s2 = toma_y_da(s1);
    // s1 ahora es inválido
    println!("{s2}");
}
```

## El Trait Copy

Los tipos simples almacenados enteramente en la stack implementan `Copy`. La asignación **copia** en lugar de mover:

```rust
fn main() {
    // Tipos Copy: asignación = copia
    let x = 5;
    let y = x;  // x sigue siendo válido — i32 es Copy
    println!("{x} {y}"); // Ambos funcionan
    
    let a = true;
    let b = a;  // bool es Copy
    println!("{a} {b}"); // Ambos funcionan
}
```

### Tipos Que Son Copy

| Tipo | Ejemplos |
|------|----------|
| Enteros | `i32`, `u64`, `i8`, etc. |
| Floats | `f32`, `f64` |
| Booleano | `bool` |
| Carácter | `char` |
| Tuplas de Copy | `(i32, i32)`, `(bool, char)` |
| Referencias | `&T`, `&mut T` (siempre Copy) |

### Tipos Que NO Son Copy

| Tipo | Razón |
|------|-------|
| `String` | Posee memoria en el heap |
| `Vec<T>` | Posee memoria en el heap |
| `&mut T` | Acceso único (movido, no Copy) |
| `Box<T>` | Posee memoria en el heap |

> [!WARNING]
> Si un tipo o cualquiera de sus campos implementa `Drop`, no puede implementar `Copy`. Esto previene errores de doble liberación.

## Clone — Copia Profunda Explícita

Cuando quieres una copia profunda de datos en el heap, llama `.clone()`:

```rust
fn main() {
    let s1 = String::from("hola");
    let s2 = s1.clone();  // Copia profunda: datos del heap son duplicados
    
    println!("s1: {s1}"); // Sigue siendo válido
    println!("s2: {s2}"); // Copia separada
    
    // Con tipos Copy, clone no es necesario
    let x = 5;
    let y = x.clone(); // Funciona, pero redundante para tipos Copy
}
```

> [!NOTE]
| Operación | Datos de Stack | Datos de Heap | Costo |
|-----------|----------------|---------------|-------|
| Movimiento | Copiados | No copiados (dueño cambia) | Tamaño del puntero |
| Clone | Copiados | Copiados profundamente | Asignación en heap + copia |
| Copy | Copiados | N/A (sin datos en heap) | Trivial |

## Ownership y Ámbito

```rust
fn main() {
    let s = String::from("fuera");
    {
        let interno = String::from("dentro");
        println!("{interno}"); // OK
    }
    // interno fue liberado aquí
    
    println!("{s}"); // OK
    // s es liberado aquí
}
```

### Orden de Liberación

Las variables se liberan en **orden inverso de declaración**:

```rust
fn main() {
    let a = String::from("a");
    let b = String::from("b");
    // b liberado primero, luego a
}
```

## Movimientos Parciales

Los structs pueden ser parcialmente movidos:

```rust
struct Persona {
    nombre: String,
    edad: u8,
}

fn main() {
    let persona = Persona {
        nombre: String::from("Alice"),
        edad: 30,
    };
    
    let nombre = persona.nombre; // Mover nombre fuera
    // println!("{}", persona.nombre); // ERROR: parcialmente movido
    println!("{}", persona.edad); // OK: edad es Copy, aún accesible
}
```

## Ownership en la Práctica

```rust
// Malo: ownership movida, pero queremos usarla después
fn mal_longitud(s: String) -> usize {
    s.len()
} // s liberado

// Bueno: retornar ownership
fn ok_longitud(s: String) -> (String, usize) {
    let len = s.len();
    (s, len)
}

// Mejor: tomar prestado en lugar de tomar ownership (siguiente lección)
fn mejor_longitud(s: &String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hola");
    let len = mal_longitud(s);
    // println!("{s}"); // ERROR
    
    let s = String::from("hola");
    let (s, len) = ok_longitud(s);
    println!("{s} tiene {len} caracteres"); // OK
    
    let s = String::from("hola");
    let len = mejor_longitud(&s);
    println!("{s} tiene {len} caracteres"); // OK
}
```

## Ownership con Tipos Personalizados

```rust
#[derive(Debug)]
struct Archivo {
    nombre: String,
    datos: Vec<u8>,
}

fn main() {
    let archivo = Archivo {
        nombre: String::from("datos.txt"),
        datos: vec![1, 2, 3],
    };
    
    let archivo2 = archivo; // ¡Movimiento! File NO es Copy
    // println!("{:?}", archivo); // ERROR
    
    // Usa clone si quieres ambos
    let archivo3 = archivo2.clone();
    println!("{:?}", archivo2);
    println!("{:?}", archivo3);
}
```

> [!SUCCESS]
> Ownership es la base de las garantías de seguridad de Rust. Cuando haga clic, entenderás cómo Rust elimina categorías enteras de bugs (use-after-free, doble liberación, punteros colgantes) en tiempo de compilación.

## Preguntas de Práctica

1. ¿Cuáles son las tres reglas de ownership?
2. ¿Qué sucede con la memoria cuando el dueño sale de ámbito?
3. ¿Cuál es la diferencia entre movimiento y copia?
4. ¿Qué tipos implementan el trait `Copy`?
5. ¿Qué hace `.clone()`?
6. ¿Por qué un tipo con `Drop` no puede implementar `Copy`?
7. ¿Qué sucede si intentas usar un valor después de moverlo?
8. ¿Qué determina el orden en que se liberan las variables?
9. ¿Qué es un movimiento parcial?
10. ¿Cómo retornar ownership de una función mientras también retornas datos computados?
