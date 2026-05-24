---
title: "Préstamo y Referencias"
description: "Aprende referencias, referencias mutables, reglas de préstamo y slices — la clave para usar datos sin tomar ownership"
order: 7
duration: "30 minutos"
difficulty: "principiante"
---

# Préstamo y Referencias

El préstamo permite usar un valor sin tomar ownership. En lugar de mover datos, pasas una **referencia** — un puntero que sigue reglas estrictas impuestas en tiempo de compilación.

## Referencias (Préstamo Inmutable)

Una referencia `&T` permite leer datos sin poseerlos:

```rust
fn main() {
    let s = String::from("hola");
    let len = calcular_longitud(&s);  // &s crea una referencia
    println!("'{s}' tiene {len} caracteres"); // s sigue siendo utilizable
}

fn calcular_longitud(s: &String) -> usize {
    s.len() // Leer la cadena
    // s.push_str("!"); // ERROR: la referencia es inmutable
}  // s es una referencia, nada se libera
```

> [!NOTE]
> Lo opuesto de referenciar (`&`) es **desreferenciar** (`*`). Pero Rust auto-desreferencia en la mayoría de las situaciones, así que raramente necesitas `*` explícitamente.

### Vista de Memoria

```
Stack:
s (String) -> { ptr: 0x..., len: 4, cap: 4 }
                ^
                |
s_ref (&String) - apunta a los datos de stack de s
```

## Referencias Mutables

`&mut T` permite leer **y** escribir:

```rust
fn main() {
    let mut s = String::from("hola");
    cambiar(&mut s);
    println!("{s}"); // "hola, mundo"
}

fn cambiar(s: &mut String) {
    s.push_str(", mundo");
}
```

> [!WARNING]
> Solo puedes tener **una** referencia mutable a un valor a la vez. Esto previene data races en tiempo de compilación.

## Las Reglas de Préstamo

Rust impone dos reglas en tiempo de compilación:

1. **En cualquier momento, tienes** una referencia mutable **o** cualquier número de referencias inmutables.
2. **Las referencias deben ser siempre válidas** (sin punteros colgantes).

```rust
fn main() {
    let mut s = String::from("hola");
    
    let r1 = &s;    // OK: múltiples referencias inmutables
    let r2 = &s;    // OK
    println!("{r1} {r2}");
    // r1 y r2 ya no se usan aquí
    
    let r3 = &mut s; // OK: sin referencias inmutables en uso
    println!("{r3}");
}
```

### Violaciones que el Compilador Detecta

```rust
fn main() {
    let mut s = String::from("hola");
    
    let r1 = &s;      // préstamo inmutable comienza
    let r2 = &s;      // préstamo inmutable comienza
    // let r3 = &mut s; // ERROR: no puede tomar prestado como mutable porque también es inmutable
    println!("{r1} {r2}");
    // préstamos inmutables terminan aquí
    
    let r3 = &mut s;  // OK ahora
    println!("{r3}");
}
```

```rust
fn main() {
    let mut s = String::from("hola");
    
    let r1 = &mut s;  // préstamo mutable comienza
    // let r2 = &s;   // ERROR: no puede tomar prestado como inmutable
    // println!("{r2}");
    
    r1.push_str("!");
    println!("{r1}");
    // préstamo mutable termina aquí
}
```

> [!SUCCESS]
| Escenario | ¿Permitido? | Por qué |
|----------|----------|--------|
| Múltiples `&T` | Sí | Solo lectura, sin conflicto |
| Un `&mut T` | Sí | Acceso exclusivo de escritura |
| `&T` + `&mut T` simultáneamente | No | Podría leer mientras escribe |
| Dos `&mut T` simultáneamente | No | Dos escritores = data race |

## Referencias Colgantes

Rust previene referencias colgantes en tiempo de compilación:

```rust
// fn cuelga() -> &String {  // ERROR: especificador de lifetime faltante
//     let s = String::from("hola");
//     &s
// } // s liberado, referencia sería inválida

fn no_cuelga() -> String {
    let s = String::from("hola");
    s  // Ownership se mueve, sin referencia colgante
}
```

> [!NOTE]
> El borrow checker garantiza que las referencias nunca sobrevivan a los datos que apuntan. Esto elimina bugs de use-after-free por completo.

## Las Reglas en la Práctica

```rust
fn main() {
    let mut datos = vec![1, 2, 3];
    
    // Referencia inmutable — bien
    let vista = &datos;
    println!("{:?}", vista);
    
    // Operaciones mutables — bien (sin referencias activas)
    datos.push(4);
    println!("{:?}", datos);
    
    // Control de ámbito
    let r1 = &datos;
    let r2 = &datos;
    println!("{r1:?} {r2:?}"); // Último uso de referencias inmutables
    
    let r3 = &mut datos;
    r3.push(5);
    println!("{r3:?}");
}
```

## Slices — Referencias a Elementos Contiguos

Los slices son referencias a una secuencia contigua dentro de una colección. Son **punteros gordos** (puntero + longitud).

### String Slices

```rust
fn main() {
    let s = String::from("hola mundo");
    
    let hola = &s[0..4];  // "hola"
    let mundo = &s[5..10]; // "mundo"
    
    println!("'{hola}' '{mundo}'");
    
    // Sintaxis abreviada
    let entero = &s[..];    // "hola mundo"
    let desde_inicio = &s[..4]; // "hola"
    let hasta_fin = &s[5..];  // "mundo"
}
```

> [!WARNING]
> Los string slices deben estar en límites de caracteres UTF-8 válidos. Dividir en medio de un carácter multibyte entrará en pánico.

### Array Slices

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..4];  // &[i32] — tipo es [2, 3, 4]
    
    for item in slice {
        println!("{item}");
    }
    
    println!("len: {}", slice.len()); // 3
}
```

### El Tipo Slice

```rust
fn primera_palabra(s: &str) -> &str {  // &str es un string slice
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("hola mundo");
    let palabra = primera_palabra(&s);
    println!("{palabra}"); // "hola"
}
```

### &str vs String

| Tipo | ¿Poseído? | ¿Mutable? | Memoria |
|------|-----------|-----------|---------|
| `String` | Sí | Sí | Asignado en heap |
| `&str` | No | No | Vista en datos existentes |
| `&mut str` | No | Sí | Raramente usado |

> [!SUCCESS]
> Usa `&str` para parámetros de función cuando solo necesites leer datos de cadena. Es más flexible que `&String` porque acepta tanto `&String` como `&str`.

## Préstamo con Funciones

```rust
// Prefiere &str en lugar de &String para parámetros
fn imprimir_mensaje(msg: &str) {
    println!("{msg}");
}

fn main() {
    let s = String::from("hola");
    imprimir_mensaje(&s);     // &String auto-coerciona a &str
    imprimir_mensaje("mundo"); // Literal &str funciona directamente
}
```

## NLL (Non-Lexical Lifetimes)

Desde Rust 2018, los préstamos viven hasta su **último uso**, no hasta el final del ámbito:

```rust
fn main() {
    let mut s = String::from("hola");
    
    let r = &s;
    println!("{r}");   // Último uso del préstamo inmutable
    // r está "terminado" aquí
    
    let m = &mut s;    // OK: préstamo inmutable terminó
    m.push_str("!");
}
```

## Mundo Real: Analizador de Línea CSV Seguro

```rust
fn analizar_linea_csv(linea: &str) -> Vec<&str> {
    linea.split(',').map(|s| s.trim()).collect()
}

fn main() {
    let datos = String::from("Alice,30,Ingeniero\nBob,25,Diseñador");
    
    for linea in datos.lines() {
        let campos = analizar_linea_csv(linea);
        println!("Nombre: {}, Edad: {}, Rol: {}", campos[0], campos[1], campos[2]);
    }
}
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre una referencia y ownership?
2. ¿Cuántas referencias mutables pueden existir al mismo tiempo?
3. ¿Cuántas referencias inmutables pueden existir al mismo tiempo?
4. ¿Qué regla previene data races en Rust?
5. ¿Cómo previene Rust las referencias colgantes?
6. ¿Qué es un string slice (`&str`)?
7. ¿Por qué deberías usar `&str` en lugar de `&String` en parámetros de función?
8. ¿Qué es un "puntero gordo"?
9. ¿Cómo mejoran NLL (Non-Lexical Lifetimes) la ergonomía?
10. ¿Qué sucede si divides una cadena en un límite no UTF-8?
