---
title: "Tipos de Datos"
description: "Domina los tipos escalares, tipos compuestos, inferencia de tipos y anotaciones de tipo explícitas en Rust"
order: 4
duration: "30 minutos"
difficulty: "principiante"
---

# Tipos de Datos

Rust es un lenguaje **estáticamente tipado** — toda variable debe tener un tipo conocido en tiempo de compilación. El compilador es inteligente infiriendo tipos, pero siempre puedes anotarlos explícitamente.

## Dos Categorías de Tipos

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| **Escalar** | Valor único | enteros, floats, bool, char |
| **Compuesto** | Grupo de valores | tuplas, arrays, structs, enums |

## Tipos Escalares

### Tipos Enteros

Rust ofrece enteros con signo (`i`) y sin signo (`u`) en varios tamaños:

| Tamaño | Con Signo | Sin Signo | Rango (con signo) |
|--------|-----------|-----------|-------------------|
| 8 bits | `i8` | `u8` | -128 a 127 |
| 16 bits | `i16` | `u16` | -32.768 a 32.767 |
| 32 bits | `i32` | `u32` | -2³¹ a 2³¹ -1 |
| 64 bits | `i64` | `u64` | -2⁶³ a 2⁶³ -1 |
| 128 bits | `i128` | `u128` | -2¹²⁷ a 2¹²⁷ -1 |
| arch | `isize` | `usize` | depende de la plataforma (32/64 bits) |

```rust
fn main() {
    let a = 42;        // i32 (por defecto)
    let b: u8 = 255;   // Byte sin signo explícito
    let c = 100_000;   // Separadores de guion bajo para legibilidad
    let d = 0xff;      // Hexadecimal
    let e = 0o77;      // Octal
    let f = 0b1111;    // Binario
    let g = b'A';      // Literal de byte (u8, ASCII)
    
    // usize/isize para indexar colecciones
    let arr = [1, 2, 3];
    let index: usize = 1;
    println!("{0}", &arr[index]); // 2
}
```

> [!NOTE]
> `i32` es el tipo entero por defecto porque es rápido en CPUs modernas y evita problemas de desbordamiento comunes con tipos más pequeños.

### Desbordamiento de Entero

```rust
fn main() {
    let mut x: u8 = 255;
    // x = x + 1; // PANICA en modo debug (verificación de desbordamiento)
    
    // Wrapping explícito:
    let y = x.wrapping_add(1); // 0 (envuelve)
    let z = x.saturating_add(1); // 255 (satura en máximo)
    println!("wrapping: {y}, saturating: {z}");
}
```

| Método | Comportamiento |
|--------|----------------|
| `wrapping_add` | Envuelve (complemento a dos) |
| `saturating_add` | Se detiene en valor mínimo/máximo |
| `overflowing_add` | Retorna (resultado, desbordó bool) |
| `checked_add` | Retorna `Option` (None en desbordamiento) |

> [!WARNING]
> En modo debug, el desbordamiento de enteros paniquea. En modo release, envuelve silenciosamente. Nunca confíes en el comportamiento de desbordamiento — usa métodos explícitos.

### Tipos de Punto Flotante

```rust
fn main() {
    let x = 2.0;       // f64 (por defecto, doble precisión)
    let y: f32 = 3.0;  // f32 (precisión simple)
    
    // Operaciones f64
    let al_cuadrado = x.powi(2);      // 4.0
    let raiz = x.sqrt();          // 1.414...
    let resto = 5.0 % 2.0;   // 1.0
}
```

| Tipo | Precisión | Tamaño | Caso de Uso |
|------|-----------|--------|-------------|
| `f32` | ~7 dígitos decimales | 4 bytes | Gráficos, GPUs |
| `f64` | ~15 dígitos decimales | 8 bytes | Computación general |

> [!WARNING]
> Los floats no implementan `Eq` u `Ord` — NaN y problemas de precisión hacen que la comparación no sea confiable. Usa `f64::EPSILON` para comparación aproximada:
> ```rust
> fn approx_eq(a: f64, b: f64) -> bool {
>     (a - b).abs() < f64::EPSILON
> }
> ```

### El Tipo Booleano

```rust
fn main() {
    let rust_es_divertido = true;
    let es_dificil: bool = false;
    
    if rust_es_divertido {
        println!("¡Rust es divertido!");
    }
    
    // Conversión a entero
    println!("{}", true as u8); // 1
    println!("{}", false as u8); // 0
}
```

### El Tipo Carácter

`char` tiene 4 bytes y representa un Valor Escalar Unicode:

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ';
    let gato_ojos_corazon = '😻';
    
    println!("{c} {z} {gato_ojos_corazon}");
    
    // char como número
    println!("{}", 'A' as u8); // 65
    println!("{}", '😻' as u32); // 128571
}
```

> [!NOTE]
> `char` tiene 4 bytes (no 1 como el char de C). Soporta Unicode completo pero no es ASCII — usa `u8` o `&[u8]` para datos a nivel de byte.

## Tipos Compuestos

### Tuplas

Las tuplas agrupan valores de **tipos diferentes**. Tamaño fijo, conocido en tiempo de compilación.

```rust
fn main() {
    let tup: (i32, f64, char) = (500, 6.4, 'x');
    
    // Desestructuración
    let (x, y, z) = tup;
    println!("{x}, {y}, {z}");
    
    // Notación de punto (indexada desde 0)
    println!("{}", tup.0); // 500
    println!("{}", tup.1); // 6.4
    
    // Tupla unitaria (tupla vacía)
    let unit: () = ();
}
```

| Patrón | Ejemplo | Cuándo Usar |
|--------|---------|-------------|
| Desestructurar | `let (a, b) = tup` | Extraer todos los valores |
| Acceso por punto | `tup.0` | Extraer un valor |
| Ignorar | `let (a, _, _) = tup` | Extraer algunos valores |

### Arrays

Los arrays tienen **tamaño fijo**, todos los elementos **mismo tipo**, almacenados en la **stack**:

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    
    // Anotación de tipo: [tipo; longitud]
    let tipado: [i32; 5] = [1, 2, 3, 4, 5];
    
    // Expresión de repetición: [valor; cuenta]
    let ceros = [0; 10];      // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    
    // Acceso
    let primero = arr[0];
    let segundo = arr[1];
    
    // Verificación de límites en ejecución
    // let oops = arr[10]; // Panica: índice fuera de límites
}
```

| Característica | Array | Tupla |
|----------------|-------|-------|
| ¿Mismo tipo? | Sí | No |
| ¿Tamaño fijo? | Sí | Sí |
| Tipo por defecto | `[T; N]` | `(T1, T2, ...)` |
| Acceso | `arr[i]` (verificado en ejecución) | `tup.i` (tiempo de compilación) |

### Vectores (Avance)

Los vectores son arrays asignados en el heap, redimensionables:

```rust
fn main() {
    let mut vec = vec![1, 2, 3];
    vec.push(4);  // Ahora [1, 2, 3, 4]
    println!("{vec:?}");
}
```

## Inferencia de Tipos y Anotaciones

Rust infiere tipos en la mayoría de las situaciones:

```rust
fn main() {
    // La inferencia funciona
    let x = 42;        // i32
    let y = 3.14;      // f64
    let cond = true;   // bool
    
    // Las anotaciones aclaran intención
    let puerto: u16 = 8080;
    let pi: f32 = 3.14159;
    
    // A veces obligatorio (ambigüedad de tipo)
    let ambiguo = "hola".parse(); // ERROR: no puede inferir tipo
    let analizado: u32 = "42".parse().unwrap(); // OK con anotación
    
    // Sintaxis Turbofish
    let n = "100".parse::<i32>().unwrap();
}
```

> [!SUCCESS]
| Situación | Ejemplo |
|-----------|---------|
| `parse()` necesita anotación | `"42".parse::<i32>()` o `let x: i32 = "42".parse()?` |
| Entero por defecto | `let x = 42` → `i32` |
| Float por defecto | `let x = 3.14` → `f64` |
| Genérico de colección | `Vec::new()` necesita contexto de tipo |

## Alias de Tipo

```rust
type Kilometros = i32;
type Thunk = Box<dyn FnOnce() + Send>;

fn main() {
    let distancia: Kilometros = 100;
    println!("{distancia} km");
}
```

## Tipos Sized y Unsized

| Categoría | Ejemplos | ¿Tamaño en Tiempo de Compilación? |
|-----------|----------|-----------------------------------|
| Sized | `i32`, `f64`, `[i32; 5]`, `String` | Sí |
| Unsized | `str`, `[i32]`, `dyn Trait` | No (detrás de puntero) |

Los tipos unsized deben estar siempre detrás de un puntero: `&str`, `Box<dyn Trait>`.

## Preguntas de Práctica

1. ¿Cuál es el tipo entero por defecto en Rust? ¿Y el tipo float?
2. ¿Cuántos bytes tiene un `char` en Rust? ¿Cómo es diferente del char de C?
3. ¿Cuál es la diferencia entre una tupla y un array?
4. ¿Por qué no puedes comparar dos valores `f64` con `==` directamente?
5. ¿Qué sucede si accedes a un índice de array fuera de los límites?
6. ¿Cuándo debes anotar el tipo de una variable explícitamente?
7. ¿Para qué sirve el tipo unitario `()`?
8. ¿Cómo analizar una cadena en un entero?
9. ¿Cuál es la diferencia entre `usize` y `u64`?
10. ¿Qué métodos puedes usar para manejar el desbordamiento de enteros de forma segura?
