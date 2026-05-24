---
title: "Result y Option — Combinadores de Manejo de Errores"
description: "Domina los tipos Result y Option con unwrap, expect, map, and_then, ok_or y cadenas de combinadores"
order: 2
duration: "45 minutos"
difficulty: "intermedio"
---

# Result y Option — Combinadores de Manejo de Errores

`Result<T, E>` y `Option<T>` son los dos enums más importantes en Rust. Representan computaciones fallibles y valores opcionales, respectivamente.

## Referencia Rápida

| Tipo | Éxito | Fracaso | Caso de Uso |
|------|-------|---------|-------------|
| `Option<T>` | `Some(T)` | `None` | El valor puede estar ausente |
| `Result<T, E>` | `Ok(T)` | `Err(E)` | La operación puede fallar |

## Desenvolvimiento — La Muleta

```rust
fn main() {
    let x = Some(42);
    println!("{}", x.unwrap()); // 42
    
    let y: Option<i32> = None;
    // println!("{}", y.unwrap()); // ¡PANICA!
    
    // Mejor: mensaje personalizado
    println!("{}", y.expect("esperaba un valor")); // PANICA con mensaje
}
```

> [!WARNING]
> `unwrap()` y `expect()` solo deben usarse en:
> - Pruebas y ejemplos
> - Cuando estás absolutamente seguro de que el valor es `Some`/`Ok`
> - Prototipado (reemplázalo con manejo adecuado después)

## Desenvolvimiento Seguro

```rust
fn main() {
    let valor: Option<i32> = Some(42);
    
    // Proveer valores por defecto
    println!("{}", valor.unwrap_or(0)); // 42
    println!("{}", valor.unwrap_or_else(|| computar_por_defecto()));
    
    let resultado: Result<i32, String> = Ok(42);
    println!("{}", resultado.unwrap_or(0));
    println!("{}", resultado.unwrap_or_else(|_| 0));
    
    // Desenvolver con valor por defecto del error
    println!("{}", resultado.unwrap_or_default()); // 42 (si E: Default)
}

fn computar_por_defecto() -> i32 {
    100
}
```

## Mapeo — Transforma el Interior

```rust
fn main() {
    // Option map
    let some: Option<i32> = Some(5);
    let doblado = some.map(|x| x * 2);
    println!("{:?}", doblado); // Some(10)
    
    let none: Option<i32> = None;
    println!("{:?}", none.map(|x| x * 2)); // None
    
    // Result map
    let ok: Result<i32, &str> = Ok(5);
    println!("{:?}", ok.map(|x| x * 2)); // Ok(10)
    
    let err: Result<i32, &str> = Err("falló");
    println!("{:?}", err.map(|x| x * 2)); // Err("falló")
    
    // Result map_err — transformar error
    let err: Result<i32, &str> = Err("no encontrado");
    let mapeado = err.map_err(|e| format!("error: {e}"));
    println!("{mapeado:?}"); // Err("error: no encontrado")
}
```

| Función | Transforma | Omite Cuando |
|---------|------------|--------------|
| `map()` | `Some(T)` / `Ok(T)` | `None` / `Err(E)` |
| `map_err()` | `Err(E)` | `Ok(T)` |
| `map_or()` | `Some(T)` | `None` (con valor por defecto) |

## Encadenamiento con and_then

`and_then` (también llamado `flat_map`) encadena operaciones que retornan `Option`/`Result`:

```rust
fn intentar_analizar(s: &str) -> Option<i32> {
    s.parse().ok()
}

fn intentar_doblar(n: i32) -> Option<i32> {
    if n > 1000 { None } else { Some(n * 2) }
}

fn intentar_formatear(n: i32) -> Option<String> {
    if n < 0 { None } else { Some(format!("valor: {n}")) }
}

fn main() {
    let resultado = Some("42")
        .and_then(intentar_analizar)
        .and_then(intentar_doblar)
        .and_then(intentar_formatear);
    
    println!("{:?}", resultado); // Some("valor: 84")
    
    // Con Result
    let resultado: Result<i32, &str> = Ok(5);
    let encadenado = resultado
        .and_then(|x| -> Result<i32, &str> { Ok(x * 2) })
        .and_then(|x| -> Result<i32, &str> { Ok(x + 1) });
    println!("{:?}", encadenado); // Ok(11)
}
```

> [!SUCCESS]
| Combinador | Entrada → Salida | Caso de Uso |
|------------|-----------------|-------------|
| `map(f)` | `Option<T>` → `Option<U>` | Transformar interior |
| `and_then(f)` | `Option<T>` → `Option<U>` | Encadenar pasos fallibles |
| `or_else(f)` | `Option<T>` → `Option<T>` | Alternativa en None/Err |

## Convirtiendo Entre Option y Result

```rust
fn main() {
    // Option -> Result
    let some: Option<i32> = Some(42);
    let resultado: Result<i32, &str> = some.ok_or("valor ausente");
    println!("{:?}", resultado); // Ok(42)
    
    let none: Option<i32> = None;
    let resultado: Result<i32, &str> = none.ok_or("valor ausente");
    println!("{:?}", resultado); // Err("valor ausente")
    
    // ok_or_else — evaluación perezosa
    let resultado: Result<i32, String> = none.ok_or_else(|| format!("error en línea {}", line!()));
    println!("{resultado:?}");
    
    // Result -> Option
    let ok: Result<i32, &str> = Ok(42);
    println!("{:?}", ok.ok()); // Some(42)
    
    let err: Result<i32, &str> = Err("falló");
    println!("{:?}", err.ok()); // None
}
```

## Filter y Flatten

```rust
fn main() {
    // filter — mantener valores Some que satisfacen predicado
    let items = vec![Some(1), Some(2), None, Some(4)];
    let filtrados: Vec<_> = items.into_iter()
        .filter_map(|x| x.filter(|n| n % 2 == 0))
        .collect();
    println!("{:?}", filtrados); // [2, 4]
    
    // flatten — aplanar Options anidados
    let anidado: Option<Option<i32>> = Some(Some(42));
    println!("{:?}", anidado.flatten()); // Some(42)
    
    let plano: Option<Option<Option<i32>>> = Some(Some(Some(5)));
    println!("{:?}", plano.flatten().flatten()); // Some(5)
}
```

## El Operador ?

El operador `?` es azúcar sintáctico para retorno anticipado en caso de error:

```rust
use std::fs::File;
use std::io::{self, Read};

// Versión verbosa:
fn leer_usuario_verboso(ruta: &str) -> Result<String, io::Error> {
    let resultado_archivo = File::open(ruta);
    let mut archivo = match resultado_archivo {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    let mut usuario = String::new();
    match archivo.read_to_string(&mut usuario) {
        Ok(_) => Ok(usuario.trim().to_string()),
        Err(e) => Err(e),
    }
}

// Con operador ?:
fn leer_usuario(ruta: &str) -> Result<String, io::Error> {
    let mut archivo = File::open(ruta)?;
    let mut usuario = String::new();
    archivo.read_to_string(&mut usuario)?;
    Ok(usuario.trim().to_string())
}

// Aún más corto:
fn leer_usuario_corto(ruta: &str) -> Result<String, io::Error> {
    let mut usuario = String::new();
    File::open(ruta)?.read_to_string(&mut usuario)?;
    Ok(usuario.trim().to_string())
}
```

> [!NOTE]
> El operador `?` puede usarse en funciones que retornan `Result`, `Option` o cualquier tipo que implemente `FromResidual`. Convierte el tipo de error automáticamente usando `From`.

### ? con Option

```rust
fn ultimo_caracter_primera_linea(texto: &str) -> Option<char> {
    texto.lines().next()?.chars().last()
}

fn analizar_primer_numero(lineas: &[String]) -> Option<i32> {
    let linea = lineas.first()?;
    linea.split_whitespace().next()?.parse().ok()
}
```

### Mezclando Result y ? — El Problema

```rust
// Esto no compila — Result y Option no se mezclan con ?
// fn mezclado() -> Option<i32> {
//     let archivo = File::open("foo.txt")?; // Error: no puede usar ? en fn Option
//     Some(42)
// }
```

Usa conversiones:

```rust
fn mezclado() -> Option<i32> {
    let archivo = File::open("foo.txt").ok()?; // Convertir Err a None
    Some(42)
}
```

## Combinando Operadores

```rust
use std::num::ParseIntError;

fn analizar_y_procesar(entrada: &str) -> Result<i32, ParseIntError> {
    entrada
        .parse::<i32>()       // Result<i32, ParseIntError>
        .map(|x| x * 2)       // Result<i32, ParseIntError>
        .map_err(|e| e)       // Result<i32, ParseIntError>
}

fn procesar_texto(entrada: &str) -> Option<i32> {
    let recortado = entrada.trim();
    if recortado.is_empty() { return None; }
    
    recortado
        .parse::<i32>()       // Result<i32, ParseIntError>
        .ok()                  // Option<i32>
        .map(|x| x * 3)       // Option<i32>
        .filter(|x| *x > 0)   // Option<i32>
}

fn main() {
    println!("{:?}", procesar_texto("  42  ")); // Some(126)
    println!("{:?}", procesar_texto(""));       // None
    println!("{:?}", procesar_texto("abc"));    // None
}
```

## Mundo Real: Analizador de Configuración

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    host: String,
    puerto: u16,
    timeout: u64,
}

#[derive(Debug)]
enum ErrorConfig {
    CampoAusente(String),
    ValorInvalido { campo: String, valor: String },
    ErrorParse(String),
}

fn analizar_config(mapa: &HashMap<String, String>) -> Result<Config, ErrorConfig> {
    let host = mapa
        .get("host")
        .ok_or_else(|| ErrorConfig::CampoAusente("host".into()))?
        .clone();
    
    let puerto_str = mapa
        .get("puerto")
        .ok_or_else(|| ErrorConfig::CampoAusente("puerto".into()))?;
    
    let puerto = puerto_str
        .parse::<u16>()
        .map_err(|_| ErrorConfig::ValorInvalido {
            campo: "puerto".into(),
            valor: puerto_str.clone(),
        })?;
    
    let timeout_str = mapa
        .get("timeout")
        .unwrap_or(&String::from("30"));
    
    let timeout = timeout_str
        .parse::<u64>()
        .unwrap_or(30);
    
    Ok(Config { host, puerto, timeout })
}

fn main() {
    let mapa = HashMap::from([
        ("host".into(), "localhost".into()),
        ("puerto".into(), "8080".into()),
    ]);
    
    match analizar_config(&mapa) {
        Ok(config) => println!("Config: {config:?}"),
        Err(e) => eprintln!("Error de config: {e:?}"),
    }
}
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `unwrap()` y `expect()`?
2. ¿Cuándo es aceptable usar `unwrap()` en código de producción?
3. ¿Qué hace `map()` en un tipo `Result`?
4. ¿Cómo difiere `and_then()` de `map()`?
5. ¿Qué convierte `ok_or()` y cuál es la versión perezosa?
6. ¿Cómo funciona el operador `?` con diferentes tipos de error?
7. ¿Cuál es la diferencia entre `filter_map` y `map` seguido de `filter`?
8. ¿Cuándo usarías `unwrap_or_else` en lugar de `unwrap_or`?
9. ¿Puedes usar `?` en `main`? ¿Qué tipo de retorno debe tener main?
10. ¿Cómo convertir un `Option` en un `Result` con un mensaje de error personalizado?
