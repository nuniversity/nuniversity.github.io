---
title: "Result e Option — Combinadores de Tratamento de Erros"
description: "Domine os tipos Result e Option com unwrap, expect, map, and_then, ok_or e cadeias de combinadores"
order: 2
duration: "45 minutos"
difficulty: "intermediário"
---

# Result e Option — Combinadores de Tratamento de Erros

`Result<T, E>` e `Option<T>` são os dois enums mais importantes em Rust. Eles representam computações fallíveis e valores opcionais, respectivamente.

## Referência Rápida

| Tipo | Sucesso | Falha | Caso de Uso |
|------|---------|-------|-------------|
| `Option<T>` | `Some(T)` | `None` | Valor pode estar ausente |
| `Result<T, E>` | `Ok(T)` | `Err(E)` | Operação pode falhar |

## Desencapsulamento — A Muleta

```rust
fn main() {
    let x = Some(42);
    println!("{}", x.unwrap()); // 42
    
    let y: Option<i32> = None;
    // println!("{}", y.unwrap()); // PANICA!
    
    // Melhor: mensagem personalizada
    println!("{}", y.expect("esperava um valor")); // PANICA com mensagem
}
```

> [!WARNING]
> `unwrap()` e `expect()` só devem ser usados em:
> - Testes e exemplos
> - Quando você tem certeza absoluta que o valor é `Some`/`Ok`
> - Prototipagem (substitua por tratamento adequado depois)

## Desencapsulamento Seguro

```rust
fn main() {
    let valor: Option<i32> = Some(42);
    
    // Fornecer padrões
    println!("{}", valor.unwrap_or(0)); // 42
    println!("{}", valor.unwrap_or_else(|| computar_padrao()));
    
    let resultado: Result<i32, String> = Ok(42);
    println!("{}", resultado.unwrap_or(0));
    println!("{}", resultado.unwrap_or_else(|_| 0));
    
    // Desencapsular com padrão do erro
    println!("{}", resultado.unwrap_or_default()); // 42 (se E: Default)
}

fn computar_padrao() -> i32 {
    100
}
```

## Mapeamento — Transforme o Interior

```rust
fn main() {
    // Option map
    let some: Option<i32> = Some(5);
    let dobrado = some.map(|x| x * 2);
    println!("{:?}", dobrado); // Some(10)
    
    let none: Option<i32> = None;
    println!("{:?}", none.map(|x| x * 2)); // None
    
    // Result map
    let ok: Result<i32, &str> = Ok(5);
    println!("{:?}", ok.map(|x| x * 2)); // Ok(10)
    
    let err: Result<i32, &str> = Err("falhou");
    println!("{:?}", err.map(|x| x * 2)); // Err("falhou")
    
    // Result map_err — transformar erro
    let err: Result<i32, &str> = Err("não encontrado");
    let mapeado = err.map_err(|e| format!("erro: {e}"));
    println!("{mapeado:?}"); // Err("erro: não encontrado")
}
```

| Função | Transforma | Ignora Quando |
|--------|------------|---------------|
| `map()` | `Some(T)` / `Ok(T)` | `None` / `Err(E)` |
| `map_err()` | `Err(E)` | `Ok(T)` |
| `map_or()` | `Some(T)` | `None` (com padrão) |

## Encadeamento com and_then

`and_then` (também chamado `flat_map`) encadeia operações que retornam `Option`/`Result`:

```rust
fn tentar_analisar(s: &str) -> Option<i32> {
    s.parse().ok()
}

fn tentar_dobrar(n: i32) -> Option<i32> {
    if n > 1000 { None } else { Some(n * 2) }
}

fn tentar_formatar(n: i32) -> Option<String> {
    if n < 0 { None } else { Some(format!("valor: {n}")) }
}

fn main() {
    let resultado = Some("42")
        .and_then(tentar_analisar)
        .and_then(tentar_dobrar)
        .and_then(tentar_formatar);
    
    println!("{:?}", resultado); // Some("valor: 84")
    
    // Com Result
    let resultado: Result<i32, &str> = Ok(5);
    let encadeado = resultado
        .and_then(|x| -> Result<i32, &str> { Ok(x * 2) })
        .and_then(|x| -> Result<i32, &str> { Ok(x + 1) });
    println!("{:?}", encadeado); // Ok(11)
}
```

> [!SUCCESS]
| Combinador | Entrada → Saída | Caso de Uso |
|------------|----------------|-------------|
| `map(f)` | `Option<T>` → `Option<U>` | Transformar interior |
| `and_then(f)` | `Option<T>` → `Option<U>` | Encadear passos fallíveis |
| `or_else(f)` | `Option<T>` → `Option<T>` | Alternativa em None/Err |

## Convertendo Entre Option e Result

```rust
fn main() {
    // Option -> Result
    let some: Option<i32> = Some(42);
    let resultado: Result<i32, &str> = some.ok_or("valor ausente");
    println!("{:?}", resultado); // Ok(42)
    
    let none: Option<i32> = None;
    let resultado: Result<i32, &str> = none.ok_or("valor ausente");
    println!("{:?}", resultado); // Err("valor ausente")
    
    // ok_or_else — avaliação preguiçosa
    let resultado: Result<i32, String> = none.ok_or_else(|| format!("erro na linha {}", line!()));
    println!("{resultado:?}");
    
    // Result -> Option
    let ok: Result<i32, &str> = Ok(42);
    println!("{:?}", ok.ok()); // Some(42)
    
    let err: Result<i32, &str> = Err("falhou");
    println!("{:?}", err.ok()); // None
}
```

## Filter e Flatten

```rust
fn main() {
    // filter — manter valores Some que satisfazem predicado
    let items = vec![Some(1), Some(2), None, Some(4)];
    let filtrados: Vec<_> = items.into_iter()
        .filter_map(|x| x.filter(|n| n % 2 == 0))
        .collect();
    println!("{:?}", filtrados); // [2, 4]
    
    // flatten — achatar Options aninhados
    let aninhado: Option<Option<i32>> = Some(Some(42));
    println!("{:?}", aninhado.flatten()); // Some(42)
    
    let plano: Option<Option<Option<i32>>> = Some(Some(Some(5)));
    println!("{:?}", plano.flatten().flatten()); // Some(5)
}
```

## O Operador ?

O operador `?` é açúcar sintático para retorno antecipado em erro:

```rust
use std::fs::File;
use std::io::{self, Read};

// Versão verbosa:
fn ler_usuario_verboso(caminho: &str) -> Result<String, io::Error> {
    let resultado_arquivo = File::open(caminho);
    let mut arquivo = match resultado_arquivo {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    let mut usuario = String::new();
    match arquivo.read_to_string(&mut usuario) {
        Ok(_) => Ok(usuario.trim().to_string()),
        Err(e) => Err(e),
    }
}

// Com operador ?:
fn ler_usuario(caminho: &str) -> Result<String, io::Error> {
    let mut arquivo = File::open(caminho)?;
    let mut usuario = String::new();
    arquivo.read_to_string(&mut usuario)?;
    Ok(usuario.trim().to_string())
}

// Ainda mais curto:
fn ler_usuario_curto(caminho: &str) -> Result<String, io::Error> {
    let mut usuario = String::new();
    File::open(caminho)?.read_to_string(&mut usuario)?;
    Ok(usuario.trim().to_string())
}
```

> [!NOTE]
> O operador `?` pode ser usado em funções que retornam `Result`, `Option` ou qualquer tipo que implemente `FromResidual`. Ele converte o tipo de erro automaticamente usando `From`.

### ? com Option

```rust
fn ultimo_caractere_primeira_linha(texto: &str) -> Option<char> {
    texto.lines().next()?.chars().last()
}

fn analisar_primeiro_numero(linhas: &[String]) -> Option<i32> {
    let linha = linhas.first()?;
    linha.split_whitespace().next()?.parse().ok()
}
```

### Misturando Result e ? — O Problema

```rust
// Isso não compila — Result e Option não se misturam com ?
// fn misturado() -> Option<i32> {
//     let arquivo = File::open("foo.txt")?; // Erro: não pode usar ? em fn Option
//     Some(42)
// }
```

Use conversões:

```rust
fn misturado() -> Option<i32> {
    let arquivo = File::open("foo.txt").ok()?; // Converter Err para None
    Some(42)
}
```

## Combinando Operadores

```rust
use std::num::ParseIntError;

fn analisar_e_processar(entrada: &str) -> Result<i32, ParseIntError> {
    entrada
        .parse::<i32>()       // Result<i32, ParseIntError>
        .map(|x| x * 2)       // Result<i32, ParseIntError>
        .map_err(|e| e)       // Result<i32, ParseIntError>
}

fn processar_texto(entrada: &str) -> Option<i32> {
    let aparado = entrada.trim();
    if aparado.is_empty() { return None; }
    
    aparado
        .parse::<i32>()       // Result<i32, ParseIntError>
        .ok()                  // Option<i32>
        .map(|x| x * 3)       // Option<i32>
        .filter(|x| *x > 0)   // Option<i32>
}

fn main() {
    println!("{:?}", processar_texto("  42  ")); // Some(126)
    println!("{:?}", processar_texto(""));       // None
    println!("{:?}", processar_texto("abc"));    // None
}
```

## Mundo Real: Analisador de Configuração

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    host: String,
    porta: u16,
    timeout: u64,
}

#[derive(Debug)]
enum ErroConfig {
    CampoAusente(String),
    ValorInvalido { campo: String, valor: String },
    ErroParse(String),
}

fn analisar_config(mapa: &HashMap<String, String>) -> Result<Config, ErroConfig> {
    let host = mapa
        .get("host")
        .ok_or_else(|| ErroConfig::CampoAusente("host".into()))?
        .clone();
    
    let porta_str = mapa
        .get("porta")
        .ok_or_else(|| ErroConfig::CampoAusente("porta".into()))?;
    
    let porta = porta_str
        .parse::<u16>()
        .map_err(|_| ErroConfig::ValorInvalido {
            campo: "porta".into(),
            valor: porta_str.clone(),
        })?;
    
    let timeout_str = mapa
        .get("timeout")
        .unwrap_or(&String::from("30"));
    
    let timeout = timeout_str
        .parse::<u64>()
        .unwrap_or(30);
    
    Ok(Config { host, porta, timeout })
}

fn main() {
    let mapa = HashMap::from([
        ("host".into(), "localhost".into()),
        ("porta".into(), "8080".into()),
    ]);
    
    match analisar_config(&mapa) {
        Ok(config) => println!("Config: {config:?}"),
        Err(e) => eprintln!("Erro de config: {e:?}"),
    }
}
```

## Perguntas de Prática

1. Qual a diferença entre `unwrap()` e `expect()`?
2. Quando é aceitável usar `unwrap()` em código de produção?
3. O que `map()` faz em um tipo `Result`?
4. Como `and_then()` difere de `map()`?
5. O que `ok_or()` converte e qual é a versão preguiçosa?
6. Como o operador `?` funciona com diferentes tipos de erro?
7. Qual a diferença entre `filter_map` e `map` seguido de `filter`?
8. Quando usar `unwrap_or_else` em vez de `unwrap_or`?
9. Você pode usar `?` em `main`? Que tipo de retorno main deve ter?
10. Como converter um `Option` em um `Result` com uma mensagem de erro personalizada?
