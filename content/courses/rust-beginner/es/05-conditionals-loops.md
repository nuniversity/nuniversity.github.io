---
title: "Condicionales y Bucles"
description: "Aprende el control de flujo con if/else, loop, while, for y la expresión match"
order: 5
duration: "30 minutos"
difficulty: "principiante"
---

# Condicionales y Bucles

Rust proporciona control de flujo familiar con algunos giros únicos. Todas las construcciones de control de flujo son **expresiones** que pueden devolver valores.

## if / else if / else

A diferencia de C, las condiciones **no necesitan paréntesis**:

```rust
fn main() {
    let numero = 7;
    
    if numero < 5 {
        println!("pequeño");
    } else if numero < 10 {
        println!("mediano");
    } else {
        println!("grande");
    }
}
```

### if es una Expresión

Todo bloque `if`/`else` devuelve un valor — ambos brazos deben ser del mismo tipo:

```rust
fn main() {
    let condicion = true;
    let numero = if condicion { 5 } else { 6 };
    println!("{numero}"); // 5
    
    // ERROR: los brazos deben ser del mismo tipo
    // let malo = if condicion { 5 } else { "seis" };
}
```

> [!NOTE]
| Característica | Rust | C/Java |
|----------------|------|--------|
| Paréntesis | Opcionales | Obligatorios |
| Expresión | Sí (devuelve valor) | Solo sentencia |
| Verificación de tipo | Todos los brazos deben coincidir | Sin tal exigencia |

```rust
fn main() {
    let x = 10;
    let resultado = if x > 5 {
        "mayor"
    } else if x == 5 {
        "igual"
    } else {
        "menor"
    };
    println!("{resultado}"); // "mayor"
}
```

## loop — Bucles Infinitos

`loop` se ejecuta para siempre a menos que se salga explícitamente:

```rust
fn main() {
    let mut contador = 0;
    
    let resultado = loop {
        contador += 1;
        if contador == 10 {
            break contador * 2; // Break con un valor
        }
    };
    
    println!("resultado: {resultado}"); // 20
}
```

### Etiquetas de Bucle

Las etiquetas permiten salir de bucles anidados:

```rust
fn main() {
    'externo: for i in 1..=3 {
        for j in 1..=3 {
            if i == 2 && j == 2 {
                break 'externo; // Sale de ambos bucles
            }
            println!("({i}, {j})");
        }
    }
}
```

| Característica | Sintaxis | Propósito |
|----------------|---------|-----------|
| Etiqueta | `'nombre:` | Nombrar un bucle |
| Break con valor | `break valor` | Salir y devolver valor |
| Continue | `continue` | Saltar a siguiente iteración |
| Break etiquetado | `break 'nombre` | Salir del bucle externo |

> [!SUCCESS]
> Usa `loop` cuando necesites patrones "reintentar hasta éxito" o salir con un valor. Para iteración contada, prefiere `for`.

## while — Bucles Condicionales

```rust
fn main() {
    let mut n = 3;
    while n > 0 {
        println!("{n}");
        n -= 1;
    }
    println!("¡lanzamiento!");
}
```

`while` también puede ser una expresión con `break`:

```rust
fn main() {
    let mut n = 0;
    let resultado = while n < 10 {
        n += 1;
        if n == 7 {
            break n;
        }
    };
    println!("primero >= 7: {resultado:?}"); // Some(7)
}
```

> [!WARNING]
> El valor de break de un bucle `while` es `Option<T>` porque la condición puede nunca ser verdadera. En `loop`, el valor de break es `T` directamente.

## for — Iteración

`for` es el bucle preferido en Rust — es seguro, rápido y expresivo:

```rust
fn main() {
    // Sintaxis de rango
    for i in 0..5 {        // 0, 1, 2, 3, 4
        print!("{i} ");
    }
    println!();
    
    // Rango inclusivo
    for i in 0..=5 {       // 0, 1, 2, 3, 4, 5
        print!("{i} ");
    }
    println!();
    
    // Iterar sobre colección
    let arr = [10, 20, 30];
    for elemento in arr {
        print!("{elemento} ");
    }
    println!();
    
    // Con índice (enumerate)
    for (indice, valor) in arr.iter().enumerate() {
        println!("arr[{indice}] = {valor}");
    }
}
```

### Patrones de Iteración

```rust
fn main() {
    // Rango inverso
    for i in (1..=5).rev() {
        print!("{i} "); // 5 4 3 2 1
    }
    println!();
    
    // Paso a paso
    for i in (0..10).step_by(2) {
        print!("{i} "); // 0 2 4 6 8
    }
    println!();
    
    // Sobre caracteres de una cadena
    for ch in "hola".chars() {
        print!("{ch} ");
    }
    println!();
}
```

| Tipo de Bucle | Cuándo Usar | Break Devuelve |
|---------------|-------------|----------------|
| `loop` | Necesita salir con valor, o indefinido | `T` |
| `while` | Basado en condición, verificado cada iteración | `Option<T>` |
| `for` | Iterar sobre colección o rango | `Option<T>` |

## Match — Coincidencia de Patrones

`match` es el poderoso switch de Rust mejorado. Es **exhaustivo** — cada caso posible debe ser manejado:

```rust
fn main() {
    let numero = 3;
    
    match numero {
        1 => println!("uno"),
        2 => println!("dos"),
        3 => println!("tres"),
        _ => println!("otro"), // Caso comodín
    }
}
```

> [!NOTE]
> `_` es el patrón comodín. Coincide con cualquier cosa y es el caso por defecto. El compilador advierte si lo olvidas y no has cubierto todos los valores.

### Match como Expresión

```rust
fn main() {
    let valor = 7;
    
    let descripcion = match valor {
        0 => "cero",
        1..=3 => "pequeño",         // Patrón de rango
        4..=6 => "mediano",
        7..=9 => "grande",
        _ if valor > 100 => "enorme", // Condición de guardia
        _ => "otro",
    };
    
    println!("{descripcion}"); // "grande"
}
```

### Match con Enums

```rust
enum Moneda {
    Centavo,
    CincoCentavos,
    DiezCentavos,
    VeinticincoCentavos,
}

fn valor_en_centavos(moneda: Moneda) -> u8 {
    match moneda {
        Moneda::Centavo => 1,
        Moneda::CincoCentavos => 5,
        Moneda::DiezCentavos => 10,
        Moneda::VeinticincoCentavos => 25,
    }
}
```

### Match con Option

```rust
fn main() {
    let algun_valor: Option<i32> = Some(10);
    
    let doblado = match algun_valor {
        Some(x) => x * 2,
        None => 0,
    };
    
    println!("{doblado}"); // 20
}
```

## if let — Coincidencia Concisa

Cuando solo te importa un patrón:

```rust
fn main() {
    let config_max = Some(3u8);
    
    // Match verboso
    match config_max {
        Some(max) => println!("max: {max}"),
        _ => (),
    }
    
    // if let conciso
    if let Some(max) = config_max {
        println!("max: {max}");
    }
    
    // if let con else
    let valor: Option<i32> = None;
    if let Some(x) = valor {
        println!("recibió {x}");
    } else {
        println!("no recibió nada");
    }
}
```

| Construcción | Mejor Para |
|--------------|-------------|
| `match` | Verificación exhaustiva, 3+ brazos |
| `if let` | Un patrón para coincidir, ignorar el resto |
| `let else` | Desenvolver o retornar/salir temprano |

### let-else (Rust 1.65+)

```rust
fn main() {
    let valor: Option<i32> = Some(42);
    
    let Some(x) = valor else {
        println!("sin valor");
        return;
    };
    println!("recibió {x}");
}
```

## Mundo Real: Validación de Entrada

```rust
use std::io;

fn main() {
    let mut entrada = String::new();
    
    println!("Ingresa un número entre 1 y 10:");
    io::stdin().read_line(&mut entrada).unwrap();
    
    let numero: i32 = match entrada.trim().parse() {
        Ok(n) => n,
        Err(_) => {
            println!("¡Número inválido!");
            return;
        }
    };
    
    match numero {
        1..=5 => println!("{numero} está en la mitad inferior"),
        6..=10 => println!("{numero} está en la mitad superior"),
        _ => println!("{numero} está fuera del rango"),
    }
}
```

## Preguntas de Práctica

1. ¿Puedes usar `if` sin `else` en Rust?
2. ¿Qué hace `break 42` dentro de un `loop`?
3. ¿Qué tipo devuelve un bucle `while` cuando se interrumpe con un valor?
4. ¿Cómo iterar sobre un array con índice y valor?
5. ¿Qué sucede si un `match` no cubre todos los valores posibles?
6. ¿Cuál es la diferencia entre `0..5` y `0..=5`?
7. ¿Cuándo usar `if let` en lugar de `match`?
8. ¿Qué hace el patrón `_` en una expresión match?
9. ¿Cómo difiere `let-else` de `if let`?
10. Escribe un bucle for que imprima números del 10 al 1.
