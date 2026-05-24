---
title: "Variables y Mutabilidad"
description: "Comprende la nomenclatura de variables en Rust, shadowing, constantes y cómo la inmutabilidad previene clases enteras de bugs"
order: 3
duration: "25 minutos"
difficulty: "principiante"
---

# Variables y Mutabilidad

Las variables en Rust son **inmutables por defecto**. Esta es una de las decisiones centrales de diseño del lenguaje — te empuja hacia un código más seguro y predecible.

## Variables Inmutables

```rust
fn main() {
    let x = 5;
    // x = 6; // ERROR: cannot assign twice to immutable variable
    println!("x es {x}");
}
```

> [!NOTE]
> La inmutabilidad por defecto elimina una categoría entera de bugs: mutación no intencionada. Si un valor no necesita cambiar, el compilador lo impone.

## Variables Mutables

Usa `mut` para hacer una variable mutable:

```rust
fn main() {
    let mut y = 10;
    println!("y es {y}");
    y = 15;
    println!("ahora y es {y}");
}
```

| Declaración | ¿Puede Reasignar? | ¿Puede Modificar? | Caso de Uso |
|-------------|-------------------|-------------------|-------------|
| `let x = 5;` | No | No | Constantes, datos solo lectura |
| `let mut x = 5;` | Sí | Sí | Contadores, acumuladores, estado |

## Constantes

Las constantes son **siempre inmutables**, deben tener **anotaciones de tipo explícitas**, y pueden declararse en cualquier ámbito (incluyendo global):

```rust
const VELOCIDAD_MAXIMA: u32 = 120;  // Anotación de tipo obligatoria
const NOMBRE_APP: &str = "MiApp";

fn main() {
    println!("{NOMBRE_APP} velocidad máxima: {VELOCIDAD_MAXIMA}");
}
```

| Característica | `let` | `const` |
|----------------|-------|---------|
| ¿Mutable? | Solo con `mut` | Nunca |
| Anotación de tipo | Opcional | Obligatoria |
| Ámbito | Bloque | Cualquier ámbito (incluyendo global) |
| Calculada en | Ejecución | Tiempo de compilación |
| ¿Inline? | No | Sí (valor copiado en cada uso) |

```rust
const TRES_HORAS_EN_SEGUNDOS: u32 = 60 * 60 * 3; // Expresión en tiempo de compilación
```

> [!WARNING]
> Los valores `const` se insertan inline en cada punto de uso. Esto significa que si usas una const en muchos lugares, se duplica. Para una única ubicación de memoria, usa `static`.

## Shadowing

Rust permite **sombrear (shadowing)** una variable al redeclararla con `let`:

```rust
fn main() {
    let x = 5;
    let x = x + 1;    // Shadow: nueva variable, nuevo tipo posible
    let x = x * 2;
    println!("x es {x}"); // 12
    
    // Shadowing permite cambiar el tipo
    let espacios = "   ";
    let espacios = espacios.len(); // Ahora espacios es un número
}
```

### Shadowing vs Mutabilidad

| Aspecto | `let mut x` | `let x` (shadowing) |
|---------|-------------|---------------------|
| Cambia valor | Sí | Sí (nueva variable) |
| Cambia tipo | No | Sí |
| Ubicación de memoria | Misma | Nueva |
| Ámbito | Mismo bloque | Enlace anterior sombreado |

```rust
fn main() {
    // Mutabilidad: mismo tipo, misma memoria
    let mut contador = 0;
    contador += 1;
    contador += 1;
    println!("{contador}"); // 2
    
    // Shadowing: nueva variable, puede cambiar tipo
    let valor = "hola";
    let valor = valor.len();
    println!("{valor}"); // 5
}
```

> [!SUCCESS]
> El shadowing es útil para transformar valores manteniendo el mismo nombre. Úsalo cuando necesites cambiar el tipo o cuando el valor antiguo ya no deba ser accesible.

## Ámbito de Variables

Las variables existen solo dentro del bloque en que se declaran (generalmente `{}`):

```rust
fn main() {
    let externa = 10;
    {
        let interna = 20;
        println!("interna: {interna}, externa: {externa}"); // Ambas accesibles
    }
    // println!("{interna}"); // ERROR: no encontrada en el ámbito
    println!("externa: {externa}"); // Aún accesible
}
```

### Inicialización de Variables

Las variables deben inicializarse antes de usarse:

```rust
fn main() {
    let x: i32;
    // println!("{x}"); // ERROR: usada antes de inicialización
    x = 5;
    println!("{x}"); // OK
}
```

> [!WARNING]
> Rust no permite usar una variable no inicializada. Esto previene comportamiento indefinido común en C/C++ donde leer memoria no inicializada produce valores basura.

## Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Variables | `snake_case` | `nombre_usuario`, `cuenta_maxima` |
| Constantes | `SCREAMING_SNAKE_CASE` | `VELOCIDAD_MAXIMA`, `CLAVE_API` |
| Funciones | `snake_case` | `calcular_area()` |
| Tipos | `PascalCase` | `PerfilUsuario`, `String` |

```rust
const TIMEOUT_POR_DEFECTO_MS: u64 = 5000;

fn main() {
    let edad_usuario: u8 = 25;
    let activo: bool = true;
}
```

## Patrones con Guion Bajo

```rust
fn main() {
    let _no_usado = 42;      // Suprime advertencia de variable no usada
    let _ = 100;              // Descarta completamente — sin vinculación
    let _x = 10;              // Prefijo guion bajo = "intencionalmente no usado"
}
```

## Asignación por Desestructuración

Rust soporta desestructuración con `let`:

```rust
fn main() {
    let (x, y, z) = (1, 2, 3);
    println!("{x}, {y}, {z}"); // 1, 2, 3
    
    // Guion bajo para descartar partes
    let (a, _, b) = (10, 20, 30);
    println!("{a}, {b}"); // 10, 30
}
```

## Patrones del Mundo Real

```rust
// Máquina de estados segura: estados enum inmutables
enum EstadoConexion {
    Desconectado,
    Conectando,
    Conectado,
}

fn main() {
    let estado = EstadoConexion::Desconectado;
    // estado = EstadoConexion::Conectado; // Debe usar 'mut' o shadow
    
    let estado = EstadoConexion::Conectado; // Shadow: nuevo estado
    
    // Usa shadowing para conversión de tipo
    let entrada = "  Hola Mundo  ";
    let entrada = entrada.trim();       // &str -> &str (recortado)
    let entrada = entrada.to_string();  // &str -> String
    let entrada = entrada.as_bytes();   // String -> &[u8]
}
```

## Preguntas de Práctica

1. ¿Por qué las variables son inmutables por defecto en Rust?
2. ¿Qué palabra clave hace una variable mutable?
3. ¿Cuál es la diferencia entre `const` y `let`?
4. ¿Qué permite el shadowing que `mut` no permite?
5. ¿Puede declararse una constante dentro de una función?
6. ¿Qué sucede cuando una variable sale de ámbito?
7. ¿Por qué deben inicializarse las variables antes de usarse?
8. ¿Qué convención de nomenclatura se usa para las constantes Rust?
9. ¿Cómo suprimir una advertencia de variable no usada?
10. ¿Qué hace `let (x, _, z) = (1, 2, 3);`?
