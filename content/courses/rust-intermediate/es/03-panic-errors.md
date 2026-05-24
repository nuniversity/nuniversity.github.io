---
title: "panic! y Estrategias de Manejo de Errores"
description: "Aprenda cuándo usar panic, cómo propagar errores y construir manejo robusto de errores con anyhow y thiserror"
order: 3
duration: "45 minutos"
difficulty: "intermedio"
---

# panic! y Estrategias de Manejo de Errores

No todos los errores son recuperables. Rust proporciona `panic!` para errores irrecuperables y `Result` para errores recuperables. Elegir la estrategia correcta es clave para un código robusto.

## panic! — Errores Irrecuperables

`panic!` imprime un mensaje de error, desenrolla la pila (por defecto) y termina:

```rust
fn main() {
    panic!("crash and burn");
    // thread 'main' panicked at 'crash and burn', src/main.rs:2:5
}
```

### Escenarios Comunes de Panic

```rust
fn main() {
    // Índice fuera de los límites
    let v = vec![1, 2, 3];
    // v[10];  // panic: index out of bounds
    
    // Unwrap en None
    let x: Option<i32> = None;
    // x.unwrap();  // panic: called `Option::unwrap()` on a `None` value
    
    // Desbordamiento de entero (modo debug)
    let x: u8 = 255;
    // let y = x + 1;  // panic: attempt to add with overflow
    
    // Aserción fallida
    // assert!(false);  // panic: assertion failed
}
```

> [!WARNING]
| Situación | ¿Debe Usar panic? | Mejor Alternativa |
|-----------|-------------------|--------------------|
| Índice de array fuera de límites | Sí (bug) | Use `.get()` para acceso seguro |
| Entrada de usuario inválida | No | Retorne `Result` |
| Archivo de configuración faltante | Tal vez | Retorne `Result` o use `expect` |
| Timeout de red | No | Retorne `Result` |
| División por cero | Sí | Verifique antes de dividir |

### Mensajes de Panic Personalizados

```rust
fn main() {
    let msg = String::from("custom error");
    panic!("something went wrong: {msg}");
}
```

### panic! Estratégicamente

```rust
fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("division by zero");
    }
    a / b
}

// Mejor: retornar Result
fn safe_divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("division by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

## Unwrap vs Expect

```rust
fn main() {
    // unwrap: mínimo, no descriptivo
    let result: Result<i32, &str> = Err("error");
    // result.unwrap(); // panics with: called `Result::unwrap()` on an `Err` value: "error"
    
    // expect: mensaje descriptivo
    // result.expect("failed to get value");
    // panics with: failed to get value: "error"
}
```

> [!NOTE]
| Método | Mensaje | Caso de Uso |
|--------|---------|-------------|
| `unwrap()` | Genérica (muestra el valor) | Prototipos rápidos |
| `expect(msg)` | Personalizada + valor | Documentar suposiciones |
| `unwrap_or(default)` | Ninguna | Valor predeterminado seguro |

## Propagación de Errores con ?

El operador `?` propaga errores al llamante:

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

// Múltiples tipos de error = dolor de cabeza
fn read_and_parse(path: &str) -> Result<i32, ???> {
    let content = fs::read_to_string(path)?;        // io::Error
    let num = content.trim().parse::<i32>()?;       // ParseIntError
    Ok(num)
}
```

### Solución 1: Box\<dyn Error\>

```rust
use std::error::Error;

fn read_and_parse(path: &str) -> Result<i32, Box<dyn Error>> {
    let content = fs::read_to_string(path)?;
    let num = content.trim().parse::<i32>()?;
    Ok(num)
}
```

> [!SUCCESS]
> `Box<dyn Error>` es la forma más simple de manejar múltiples tipos de error. Es excelente para aplicaciones pero pierde información de tipo.

### Solución 2: Tipo de Error Personalizado

```rust
use std::fmt;
use std::fs;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Io(e) => write!(f, "IO error: {e}"),
            AppError::Parse(e) => write!(f, "Parse error: {e}"),
        }
    }
}

impl From<io::Error> for AppError {
    fn from(e: io::Error) -> AppError {
        AppError::Io(e)
    }
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> AppError {
        AppError::Parse(e)
    }
}

fn read_and_parse(path: &str) -> Result<i32, AppError> {
    let content = fs::read_to_string(path)?; // Convertido vía From
    let num = content.trim().parse::<i32>()?; // Convertido vía From
    Ok(num)
}
```

## anyhow — Manejo Ergonométrico de Errores

`anyhow` proporciona `anyhow::Error` y el trait `Context`:

```toml
[dependencies]
anyhow = "1.0"
```

```rust
use anyhow::{Context, Result};
use std::fs;

fn read_config(path: &str) -> Result<String> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {path}"))?;
    Ok(content)
}

fn parse_port(content: &str) -> Result<u16> {
    content.trim().parse::<u16>()
        .with_context(|| format!("invalid port number: {content}"))?
}

fn main() -> Result<()> {
    let config = read_config("config.toml")?;
    let port = parse_port(&config)?;
    println!("Port: {port}");
    Ok(())
}
```

> [!NOTE]
| Característica | `Box<dyn Error>` | `anyhow` |
|---------|-------------------|----------|
| Borrado de tipo | Sí | Sí |
| Adjuntar contexto | Manual | `.with_context()` |
| Downcasting | Posible | Posible |
| Popularidad | Stdlib | Estándar de la comunidad |
| Cuándo usar | Bibliotecas | Aplicaciones |

## thiserror — Tipos de Error para Bibliotecas

`thiserror` deriva `Display` y `Error` para tipos de error personalizados:

```toml
[dependencies]
thiserror = "2"
```

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DataError {
    #[error("data store disconnected")]
    Disconnect(#[from] io::Error),
    
    #[error("invalid header (expected {expected:?}, got {found:?})")]
    InvalidHeader {
        expected: String,
        found: String,
    },
    
    #[error("unknown data store error")]
    Unknown,
}

fn process_data() -> Result<(), DataError> {
    // io::Error se convierte automáticamente vía #[from]
    let _content = fs::read_to_string("data.txt")?;
    Err(DataError::Unknown)
}
```

> [!SUCCESS]
| Crate | Propósito | Cuándo Usar |
|-------|---------|-------------|
| `anyhow` | Manejo de errores en aplicaciones | Proyectos binarios, CLIs |
| `thiserror` | Tipos de error para bibliotecas | Crates de biblioteca |
| Ambos | Definir tipos con thiserror, usar anyhow en apps | Proyectos grandes |

## ¿Panic o No?

### Cuándo usar panic:

```rust
// Violación de invariante — esto nunca debería ocurrir
fn month_name(month: u8) -> &'static str {
    match month {
        1 => "January",
        2 => "February",
        // ...
        12 => "December",
        _ => panic!("invalid month: {month}"), // Bug de programación
    }
}

// Unwrap en operaciones infalibles
fn main() {
    let parsed: i32 = "42".parse().unwrap(); // Parse siempre funciona aquí
    // Mejor: usar expect
    let parsed: i32 = "42".parse().expect("hardcoded literal must parse");
}
```

### Cuándo NO usar panic:

```rust
// Entrada del usuario — nunca usar panic
fn process_user_input(input: &str) -> Result<i32, String> {
    input.trim().parse::<i32>().map_err(|_| format!("'{input}' is not a number"))
}
```

## Ejemplo Real: Manejo de Errores en un CLI

```rust
use anyhow::{Context, Result};
use std::path::Path;
use std::fs;

#[derive(Debug)]
struct UserData {
    name: String,
    age: u8,
}

fn load_user_data(path: &Path) -> Result<UserData> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("cannot read {}", path.display()))?;
    
    let lines: Vec<&str> = content.lines().collect();
    if lines.len() < 2 {
        anyhow::bail!("file must have at least 2 lines");
    }
    
    let name = lines[0].to_string();
    let age = lines[1].parse::<u8>()
        .with_context(|| format!("invalid age: '{}'", lines[1]))?;
    
    Ok(UserData { name, age })
}

fn main() -> Result<()> {
    let data = load_user_data(Path::new("user.txt"))?;
    println!("Loaded: {} (age {})", data.name, data.age);
    Ok(())
}
```

## Preguntas de Práctica

1. ¿Qué sucede cuando se llama a `panic!`?
2. ¿Cuándo es apropiado usar panic en Rust?
3. ¿Cuál es la diferencia entre `unwrap()` y `expect()`?
4. ¿Cómo propaga errores el operador `?`?
5. ¿Cuál es la ventaja de `Box<dyn Error>` para el manejo de errores?
6. ¿Cómo mejora `anyhow` la ergonomía del manejo de errores?
7. ¿Qué hace el atributo `#[from]` de `thiserror`?
8. ¿Cuándo deberías usar `anyhow` vs `thiserror`?
9. ¿Qué añade `with_context()` a un error?
10. ¿Cómo decides entre un panic y un Result?
