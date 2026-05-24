---
title: "Lenguajes de Programación Compilados con Rust"
description: "Aprende sobre lenguajes compilados, seguridad de memoria y programación de sistemas usando Rust"
order: 8
duration: "35 minutes"
difficulty: "intermediate"
---

# Lenguajes de Programación Compilados con Rust

JavaScript y Python son interpretados — un intérprete lee y ejecuta tu código línea por línea en tiempo de ejecución. Los lenguajes compilados como Rust funcionan de manera diferente: un compilador traduce todo tu programa a código máquina antes de ejecutarlo.

## Interpretado vs Compilado

| Aspecto | Interpretado (JS, Python) | Compilado (Rust, C, Go) |
|---------|---------------------------|--------------------------|
| Ejecución | Leído y ejecutado línea por línea | Traducido a código máquina primero |
| Inicio | Instantáneo para código pequeño | Ligera demora durante la compilación |
| Rendimiento | Más lento en tiempo de ejecución | Ejecución más rápida |
| Detección de errores | Encontrados en ejecución | Muchos errores capturados en compilación |
| Distribución | Necesita código fuente o runtime | Binario ejecutable único |

## Hello World en Rust

```rust
fn main() {
    println!("Hello, World!");
}
```

- `fn` declara una función
- `main()` es el punto de entrada de todo programa Rust
- `println!` es una macro (nota el `!`) que imprime en la consola

## Sistema de Tipos de Rust

Rust está tipado estáticamente — el compilador conoce el tipo de cada variable:

```rust
fn main() {
    let edad: i32 = 25;         // entero de 32 bits
    let nombre: &str = "Ana";   // string slice
    let activo: bool = true;    // booleano
    let puntuacion: f64 = 95.5; // float de 64 bits
    
    println!("{} tiene {} años", nombre, edad);
}
```

A diferencia de JavaScript, Rust no realiza coerción implícita de tipos.

## Variables y Mutabilidad

Las variables en Rust son **inmutables por defecto**:

```rust
fn main() {
    let x = 5;
    // x = 6;  // Error: no se puede asignar dos veces a variable inmutable
    
    let mut y = 10;  // `mut` la hace mutable
    y = 15;          // Esto está permitido
    println!("y = {}", y);
}
```

Esta inmutabilidad por defecto es una decisión de diseño deliberada que previene errores.

## Propiedad y Préstamo

La característica más distintiva de Rust es su sistema de propiedad — garantiza seguridad de memoria sin un recolector de basura.

### Reglas de Propiedad

1. Cada valor tiene exactamente un **dueño**
2. Cuando el dueño sale de ámbito, el valor se descarta
3. Un valor puede ser **prestado** sin transferir la propiedad

```rust
fn main() {
    let s1 = String::from("hola");
    let longitud = calcular_longitud(&s1);  // Presta s1, no toma posesión
    println!("'{}' tiene longitud {}", s1, longitud);  // s1 todavía se puede usar
}

fn calcular_longitud(s: &String) -> usize {
    s.len()  // Devuelve la longitud
}
```

El símbolo `&` crea una **referencia** — presta el valor sin tomar posesión.

### Referencias Mutables

```rust
fn main() {
    let mut s = String::from("hola");
    cambiar(&mut s);
    println!("{}", s);  // "hola, mundo"
}

fn cambiar(s: &mut String) {
    s.push_str(", mundo");
}
```

> [!NOTE]
> Rust previene condiciones de carrera en tiempo de compilación: puedes tener una referencia mutable o cualquier número de referencias inmutables, pero no ambas simultáneamente.

## La Expresión match

El `match` de Rust es una poderosa construcción de coincidencia de patrones:

```rust
fn describir_numero(n: i32) -> &'static str {
    match n {
        0 => "cero",
        1..=9 => "pequeño",
        10..=99 => "mediano",
        _ => "grande"  // caso por defecto
    }
}

fn main() {
    println!("{}", describir_numero(42));   // "mediano"
    println!("{}", describir_numero(100));  // "grande"
}
```

## Ejercicio Práctico

Escribe un programa Rust que verifique si un número es par o impar:

```rust
fn es_par(n: i32) -> bool {
    n % 2 == 0
}

fn main() {
    let numeros = [1, 2, 3, 4, 5, 6];
    
    for num in numeros {
        if es_par(*num) {
            println!("{} es par", num);
        } else {
            println!("{} es impar", num);
        }
    }
}
```

## Resumen

| Concepto | Rust | JavaScript |
|----------|------|------------|
| Declaración de variable | `let x = 5;` | `let x = 5;` |
| Variable mutable | `let mut x = 5;` | `let x = 5;` (todo let es mutable) |
| Constante | `const X: i32 = 5;` | `const X = 5;` |
| Función | `fn add(a: i32) -> i32` | `function add(a) { return a; }` |
| Referencia | `&x` | N/A (objetos son tipos referencia) |
| Coincidencia de patrones | `match x { ... }` | `switch (x) { ... }` |

## Próximos Pasos

La próxima lección introduce programación declarativa — una forma diferente de pensar donde describes qué quieres, no cómo obtenerlo.
