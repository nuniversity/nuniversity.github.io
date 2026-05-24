---
title: "Proyecto Principiante — Conversor de Temperatura CLI"
description: "Construye un conversor de temperatura completo de línea de comandos con validación de entrada, manejo de errores y conversiones de unidad"
order: 10
duration: "35 minutos"
difficulty: "principiante"
---

# Proyecto Principiante: Conversor de Temperatura CLI

Construye un conversor de temperatura de línea de comandos que maneja conversiones Fahrenheit ↔ Celsius con validación robusta de entrada.

## Configuración del Proyecto

```bash
cargo new conversor_temp
cd conversor_temp
```

## Paso 1: Entendiendo las Fórmulas

| Conversión | Fórmula |
|-----------|---------|
| °F → °C | `(f - 32) * 5/9` |
| °C → °F | `(c * 9/5) + 32` |

```rust
fn fahrenheit_a_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_a_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

#[test]
fn test_conversiones() {
    assert!((fahrenheit_a_celsius(32.0) - 0.0).abs() < f64::EPSILON);
    assert!((celsius_a_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
    assert!((fahrenheit_a_celsius(212.0) - 100.0).abs() < f64::EPSILON);
    assert!((celsius_a_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
}
```

> [!NOTE]
> Usamos `(a - b).abs() < f64::EPSILON` para comparación de floats porque `==` en floats no es confiable debido a la precisión.

## Paso 2: Analizando Entrada del Usuario

```rust
use std::io::{self, Write};

fn leer_linea() -> String {
    let mut entrada = String::new();
    io::stdin().read_line(&mut entrada).expect("Fallo al leer línea");
    entrada.trim().to_string()
}

fn analizar_temperatura(entrada: &str) -> Result<f64, String> {
    entrada.trim().parse::<f64>()
        .map_err(|_| format!("'{entrada}' no es un número válido"))
}

fn analizar_unidad(entrada: &str) -> Result<&str, String> {
    match entrada.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{entrada}' no es una unidad válida. Usa 'C' o 'F'")),
    }
}
```

## Paso 3: Construyendo la Aplicación

```rust
fn ejecutar_conversor() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Ingresa temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let entrada_temp = leer_linea();
    let temperatura = analizar_temperatura(&entrada_temp)?;
    
    print!("Convertir a (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let entrada_unid = leer_linea();
    let unidad_destino = analizar_unidad(&entrada_unid)?;
    
    match unidad_destino {
        "C" => {
            let resultado = fahrenheit_a_celsius(temperatura);
            println!("{temperatura}°F = {resultado:.1}°C");
        }
        "F" => {
            let resultado = celsius_a_fahrenheit(temperatura);
            println!("{temperatura}°C = {resultado:.1}°F");
        }
        _ => unreachable!(), // analizar_unidad ya validó
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = ejecutar_conversor() {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}
```

> [!SUCCESS]
> Usar `Result` como tipo de retorno nos permite usar el operador `?` para propagación limpia de errores. La función `main` maneja el caso `Err` externo.

## Paso 4: Agregando Validación de Entrada

```rust
fn validar_temperatura(valor: f64, unidad: &str) -> Result<(), String> {
    match unidad {
        "C" if valor < -273.15 => {
            Err(format!("{valor}°C está bajo cero absoluto (-273.15°C)"))
        }
        "F" if valor < -459.67 => {
            Err(format!("{valor}°F está bajo cero absoluto (-459.67°F)"))
        }
        _ => Ok(()),
    }
}

fn ejecutar_conversor_validado() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Ingresa temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperatura = analizar_temperatura(&leer_linea())?;
    
    print!("Ingresa unidad (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unidad = analizar_unidad(&leer_linea())?;
    
    validar_temperatura(temperatura, unidad)?;
    
    match unidad {
        "C" => {
            let resultado = celsius_a_fahrenheit(temperatura);
            println!("{temperatura:.1}°C = {resultado:.1}°F");
        }
        "F" => {
            let resultado = fahrenheit_a_celsius(temperatura);
            println!("{temperatura:.1}°F = {resultado:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}
```

## Paso 5: Aplicación Completa

Aquí está el programa completo:

```rust
use std::io::{self, Write};

fn fahrenheit_a_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_a_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

fn leer_linea() -> String {
    let mut entrada = String::new();
    io::stdin().read_line(&mut entrada).expect("Fallo al leer línea");
    entrada.trim().to_string()
}

fn analizar_temperatura(entrada: &str) -> Result<f64, String> {
    entrada.parse::<f64>()
        .map_err(|_| format!("'{entrada}' no es un número válido"))
}

fn analizar_unidad(entrada: &str) -> Result<&str, String> {
    match entrada.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{entrada}' no es una unidad válida. Usa 'C' o 'F'")),
    }
}

fn validar_temperatura(valor: f64, unidad: &str) -> Result<(), String> {
    match unidad {
        "C" if valor < -273.15 => {
            Err(format!("{valor}°C está bajo cero absoluto"))
        }
        "F" if valor < -459.67 => {
            Err(format!("{valor}°F está bajo cero absoluto"))
        }
        _ => Ok(()),
    }
}

fn ejecutar_conversor() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Ingresa temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperatura = analizar_temperatura(&leer_linea())?;
    
    print!("Ingresa unidad (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unidad = analizar_unidad(&leer_linea())?;
    
    validar_temperatura(temperatura, unidad)?;
    
    match (unidad, temperatura) {
        ("C", c) => {
            let f = celsius_a_fahrenheit(c);
            println!("{c:.1}°C = {f:.1}°F");
        }
        ("F", f) => {
            let c = fahrenheit_a_celsius(f);
            println!("{f:.1}°F = {c:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = ejecutar_conversor() {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fahrenheit_a_celsius() {
        assert!((fahrenheit_a_celsius(32.0) - 0.0).abs() < f64::EPSILON);
        assert!((fahrenheit_a_celsius(212.0) - 100.0).abs() < f64::EPSILON);
        assert!((fahrenheit_a_celsius(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_celsius_a_fahrenheit() {
        assert!((celsius_a_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
        assert!((celsius_a_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
        assert!((celsius_a_fahrenheit(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_analizar_temperatura() {
        assert_eq!(analizar_temperatura("25.5"), Ok(25.5));
        assert!(analizar_temperatura("abc").is_err());
        assert!(analizar_temperatura("").is_err());
    }
    
    #[test]
    fn test_analizar_unidad() {
        assert_eq!(analizar_unidad("C"), Ok("C"));
        assert_eq!(analizar_unidad("fahrenheit"), Ok("F"));
        assert!(analizar_unidad("K").is_err());
    }
    
    #[test]
    fn test_validar_temperatura() {
        assert!(validar_temperatura(25.0, "C").is_ok());
        assert!(validar_temperatura(-300.0, "C").is_err());
        assert!(validar_temperatura(-500.0, "F").is_err());
        assert!(validar_temperatura(100.0, "F").is_ok());
    }
}
```

## Paso 6: Ejecutando y Probando

```bash
# Ejecutar en modo release
cargo run --release

# Ejecutar pruebas
cargo test

# Ejemplo de salida:
# === Conversor de Temperatura ===
# Ingresa temperatura: 100
# Ingresa unidad (C/F): F
# 100.0°C = 212.0°F

# Caso de error:
# === Conversor de Temperatura ===
# Ingresa temperatura: abc
# Ingresa unidad (C/F): F
# Error: 'abc' no es un número válido
```

> [!WARNING]
> Siempre verifica `f64::NAN` y `f64::INFINITY` en aplicaciones reales. Los usuarios pueden ingresar estos valores y causar comportamiento inesperado.

## Extensiones

Prueba estas mejoras:

1. **Bucle hasta salir** — Sigue convirtiendo hasta que el usuario escriba "q"
2. **Soporte Kelvin** — Agrega unidad Kelvin
3. **Salida más bonita** — Usa salida coloreada con crate `colored`
4. **Conversión por lotes** — Lee múltiples valores de un archivo (`--file entrada.txt`)
5. **Indicador de precisión** — `--precision 4` controla decimales
6. **Argumentos CLI** — Usa crate `clap`: `conversor_temp 100 C to F`

```rust
// Extensión: bucle hasta salir
fn main() {
    loop {
        println!("\n=== Conversor de Temperatura (q para salir) ===");
        print!("Ingresa temperatura: ");
        io::stdout().flush().unwrap();
        
        let entrada = leer_linea();
        if entrada.to_lowercase() == "q" {
            break;
        }
        
        match analizar_temperatura(&entrada) {
            Ok(temp) => {
                print!("Ingresa unidad (C/F): ");
                io::stdout().flush().unwrap();
                let entrada_unid = leer_linea();
                
                match analizar_unidad(&entrada_unid) {
                    Ok(unidad) => {
                        if let Err(e) = validar_temperatura(temp, unidad) {
                            eprintln!("Error: {e}");
                            continue;
                        }
                        match unidad {
                            "C" => println!("{temp:.1}°C = {:.1}°F", celsius_a_fahrenheit(temp)),
                            "F" => println!("{temp:.1}°F = {:.1}°C", fahrenheit_a_celsius(temp)),
                            _ => unreachable!(),
                        }
                    }
                    Err(e) => eprintln!("Error: {e}"),
                }
            }
            Err(e) => eprintln!("Error: {e}"),
        }
    }
}
```

## Preguntas de Práctica

1. ¿Qué hace `io::stdout().flush()` y por qué es necesario?
2. ¿Por qué usamos `f64` en lugar de `f32` para temperatura?
3. ¿Qué hace el operador `?` en el código del conversor?
4. ¿Cómo maneja `parse::<f64>()` la entrada inválida?
5. ¿Por qué no podemos usar `==` para comparar resultados float?
6. ¿Cuál es el propósito de la función `validar_temperatura`?
7. ¿Cómo agregarías conversión Kelvin al programa?
8. ¿Por qué la función `ejecutar_conversor` está separada de `main`?
9. ¿Qué hace `std::process::exit(1)`?
10. ¿Cómo escribirías una prueba para el análisis de unidad sensible a mayúsculas?
