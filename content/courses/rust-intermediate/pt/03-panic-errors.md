---
title: "panic! e Estratégias de Tratamento de Erros"
description: "Aprenda quando usar panic, como propagar erros e construir tratamento robusto de erros com anyhow e thiserror"
order: 3
duration: "45 minutos"
difficulty: "intermediário"
---

# panic! e Estratégias de Tratamento de Erros

Nem todos os erros são recuperáveis. Rust fornece `panic!` para erros irrecuperáveis e `Result` para erros recuperáveis. Escolher a estratégia certa é fundamental para um código robusto.

## panic! — Erros Irrecuperáveis

`panic!` imprime uma mensagem de erro, desempilha a pilha (por padrão) e encerra:

```rust
fn main() {
    panic!("crash and burn");
    // thread 'main' panicked at 'crash and burn', src/main.rs:2:5
}
```

### Cenários Comuns de Panic

```rust
fn main() {
    // Índice fora dos limites
    let v = vec![1, 2, 3];
    // v[10];  // panic: index out of bounds
    
    // Unwrap em None
    let x: Option<i32> = None;
    // x.unwrap();  // panic: called `Option::unwrap()` on a `None` value
    
    // Estouro de inteiro (modo debug)
    let x: u8 = 255;
    // let y = x + 1;  // panic: attempt to add with overflow
    
    // Asserção falhou
    // assert!(false);  // panic: assertion failed
}
```

> [!WARNING]
| Situação | Deve Usar panic? | Alternativa Melhor |
|-----------|-------------------|--------------------|
| Índice de array fora dos limites | Sim (bug) | Use `.get()` para acesso seguro |
| Entrada do usuário inválida | Não | Retorne `Result` |
| Arquivo de configuração ausente | Talvez | Retorne `Result` ou use `expect` |
| Timeout de rede | Não | Retorne `Result` |
| Divisão por zero | Sim | Verifique antes de dividir |

### Mensagens de Panic Personalizadas

```rust
fn main() {
    let msg = String::from("custom error");
    panic!("something went wrong: {msg}");
}
```

### panic! Estrategicamente

```rust
fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("division by zero");
    }
    a / b
}

// Melhor: retornar Result
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
    // unwrap: mínimo, não descritivo
    let result: Result<i32, &str> = Err("error");
    // result.unwrap(); // panics with: called `Result::unwrap()` on an `Err` value: "error"
    
    // expect: mensagem descritiva
    // result.expect("failed to get value");
    // panics with: failed to get value: "error"
}
```

> [!NOTE]
| Método | Mensagem | Caso de Uso |
|--------|---------|-------------|
| `unwrap()` | Genérica (mostra o valor) | Protótipos rápidos |
| `expect(msg)` | Personalizada + valor | Documentar suposições |
| `unwrap_or(default)` | Nenhuma | Valor padrão seguro |

## Propagação de Erros com ?

O operador `?` propaga erros para o chamador:

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

// Vários tipos de erro = dor de cabeça
fn read_and_parse(path: &str) -> Result<i32, ???> {
    let content = fs::read_to_string(path)?;        // io::Error
    let num = content.trim().parse::<i32>()?;       // ParseIntError
    Ok(num)
}
```

### Solução 1: Box\<dyn Error\>

```rust
use std::error::Error;

fn read_and_parse(path: &str) -> Result<i32, Box<dyn Error>> {
    let content = fs::read_to_string(path)?;
    let num = content.trim().parse::<i32>()?;
    Ok(num)
}
```

> [!SUCCESS]
> `Box<dyn Error>` é a maneira mais simples de lidar com vários tipos de erro. É ótimo para aplicações, mas perde informação de tipo.

### Solução 2: Tipo de Erro Personalizado

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
    let content = fs::read_to_string(path)?; // Convertido via From
    let num = content.trim().parse::<i32>()?; // Convertido via From
    Ok(num)
}
```

## anyhow — Tratamento Ergonômico de Erros

`anyhow` fornece `anyhow::Error` e a trait `Context`:

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
| Funcionalidade | `Box<dyn Error>` | `anyhow` |
|---------|-------------------|----------|
| Apagamento de tipo | Sim | Sim |
| Anexar contexto | Manual | `.with_context()` |
| Downcasting | Possível | Possível |
| Popularidade | Stdlib | Padrão da comunidade |
| Quando usar | Bibliotecas | Aplicações |

## thiserror — Tipos de Erro para Bibliotecas

`thiserror` deriva `Display` e `Error` para tipos de erro personalizados:

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
    // io::Error converte automaticamente via #[from]
    let _content = fs::read_to_string("data.txt")?;
    Err(DataError::Unknown)
}
```

> [!SUCCESS]
| Crate | Propósito | Quando Usar |
|-------|---------|-------------|
| `anyhow` | Tratamento de erros em aplicações | Projetos binários, CLIs |
| `thiserror` | Tipos de erro para bibliotecas | Crates de biblioteca |
| Ambos | Definir tipos com thiserror, usar anyhow em apps | Projetos grandes |

## Panicar ou Não?

### Quando panicar:

```rust
// Violação de invariante — isso nunca deveria acontecer
fn month_name(month: u8) -> &'static str {
    match month {
        1 => "January",
        2 => "February",
        // ...
        12 => "December",
        _ => panic!("invalid month: {month}"), // Bug de programação
    }
}

// Unwrap em operções infalíveis
fn main() {
    let parsed: i32 = "42".parse().unwrap(); // Parse sempre funciona aqui
    // Melhor: usar expect
    let parsed: i32 = "42".parse().expect("hardcoded literal must parse");
}
```

### Quando NÃO panicar:

```rust
// Entrada do usuário — nunca panique
fn process_user_input(input: &str) -> Result<i32, String> {
    input.trim().parse::<i32>().map_err(|_| format!("'{input}' is not a number"))
}
```

## Exemplo Real: Tratamento de Erros em um CLI

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

## Perguntas de Prática

1. O que acontece quando `panic!` é chamado?
2. Quando é apropriado usar panic em Rust?
3. Qual é a diferença entre `unwrap()` e `expect()`?
4. Como o operador `?` propaga erros?
5. Qual é a vantagem de `Box<dyn Error>` para tratamento de erros?
6. Como `anyhow` melhora a ergonomia do tratamento de erros?
7. O que o atributo `#[from]` do `thiserror` faz?
8. Quando você deve usar `anyhow` vs `thiserror`?
9. O que `with_context()` adiciona a um erro?
10. Como decidir entre um panic e um Result?
