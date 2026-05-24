---
title: "Beginner Project — CLI Temperature Converter"
description: "Build a complete command-line temperature converter with input validation, error handling, and unit conversions"
order: 10
duration: "35 minutes"
difficulty: "beginner"
---

# Beginner Project: CLI Temperature Converter

Build a command-line temperature converter that handles Fahrenheit ↔ Celsius conversions with robust input validation.

## Project Setup

```bash
cargo new temp_converter
cd temp_converter
```

## Step 1: Understanding the Formulas

| Conversion | Formula |
|------------|---------|
| °F → °C | `(f - 32) * 5/9` |
| °C → °F | `(c * 9/5) + 32` |

```rust
fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_to_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

#[test]
fn test_conversions() {
    assert!((fahrenheit_to_celsius(32.0) - 0.0).abs() < f64::EPSILON);
    assert!((celsius_to_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
    assert!((fahrenheit_to_celsius(212.0) - 100.0).abs() < f64::EPSILON);
    assert!((celsius_to_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
}
```

> [!NOTE]
> We use `(a - b).abs() < f64::EPSILON` for float comparison because `==` on floats is unreliable due to precision.

## Step 2: Parsing User Input

```rust
use std::io::{self, Write};

fn read_line() -> String {
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read line");
    input.trim().to_string()
}

fn parse_temperature(input: &str) -> Result<f64, String> {
    input.trim().parse::<f64>()
        .map_err(|_| format!("'{input}' is not a valid number"))
}

fn parse_unit(input: &str) -> Result<&str, String> {
    match input.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{input}' is not a valid unit. Use 'C' or 'F'")),
    }
}
```

## Step 3: Building the Application

```rust
fn run_converter() -> Result<(), String> {
    println!("=== Temperature Converter ===");
    
    print!("Enter temperature: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temp_input = read_line();
    let temperature = parse_temperature(&temp_input)?;
    
    print!("Convert to (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unit_input = read_line();
    let target_unit = parse_unit(&unit_input)?;
    
    match target_unit {
        "C" => {
            let result = fahrenheit_to_celsius(temperature);
            println!("{temperature}°F = {result:.1}°C");
        }
        "F" => {
            let result = celsius_to_fahrenheit(temperature);
            println!("{temperature}°C = {result:.1}°F");
        }
        _ => unreachable!(), // parse_unit already validated
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = run_converter() {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}
```

> [!SUCCESS]
> Using `Result` as the return type lets us use the `?` operator for clean error propagation. The `main` function handles the outer `Err` case.

## Step 4: Adding Input Validation

```rust
fn validate_temperature(value: f64, unit: &str) -> Result<(), String> {
    match unit {
        "C" if value < -273.15 => {
            Err(format!("{value}°C is below absolute zero (-273.15°C)"))
        }
        "F" if value < -459.67 => {
            Err(format!("{value}°F is below absolute zero (-459.67°F)"))
        }
        _ => Ok(()),
    }
}

fn run_validated_converter() -> Result<(), String> {
    println!("=== Temperature Converter ===");
    
    print!("Enter temperature: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperature = parse_temperature(&read_line())?;
    
    print!("Enter unit (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unit = parse_unit(&read_line())?;
    
    validate_temperature(temperature, unit)?;
    
    match unit {
        "C" => {
            let result = celsius_to_fahrenheit(temperature);
            println!("{temperature:.1}°C = {result:.1}°F");
        }
        "F" => {
            let result = fahrenheit_to_celsius(temperature);
            println!("{temperature:.1}°F = {result:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}
```

## Step 5: Full Application

Here's the complete program:

```rust
use std::io::{self, Write};

fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_to_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

fn read_line() -> String {
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read line");
    input.trim().to_string()
}

fn parse_temperature(input: &str) -> Result<f64, String> {
    input.parse::<f64>()
        .map_err(|_| format!("'{input}' is not a valid number"))
}

fn parse_unit(input: &str) -> Result<&str, String> {
    match input.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{input}' is not a valid unit. Use 'C' or 'F'")),
    }
}

fn validate_temperature(value: f64, unit: &str) -> Result<(), String> {
    match unit {
        "C" if value < -273.15 => {
            Err(format!("{value}°C is below absolute zero"))
        }
        "F" if value < -459.67 => {
            Err(format!("{value}°F is below absolute zero"))
        }
        _ => Ok(()),
    }
}

fn run_converter() -> Result<(), String> {
    println!("=== Temperature Converter ===");
    
    print!("Enter temperature: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperature = parse_temperature(&read_line())?;
    
    print!("Enter unit (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unit = parse_unit(&read_line())?;
    
    validate_temperature(temperature, unit)?;
    
    match (unit, temperature) {
        ("C", c) => {
            let f = celsius_to_fahrenheit(c);
            println!("{c:.1}°C = {f:.1}°F");
        }
        ("F", f) => {
            let c = fahrenheit_to_celsius(f);
            println!("{f:.1}°F = {c:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = run_converter() {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fahrenheit_to_celsius() {
        assert!((fahrenheit_to_celsius(32.0) - 0.0).abs() < f64::EPSILON);
        assert!((fahrenheit_to_celsius(212.0) - 100.0).abs() < f64::EPSILON);
        assert!((fahrenheit_to_celsius(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_celsius_to_fahrenheit() {
        assert!((celsius_to_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
        assert!((celsius_to_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
        assert!((celsius_to_fahrenheit(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_parse_temperature() {
        assert_eq!(parse_temperature("25.5"), Ok(25.5));
        assert!(parse_temperature("abc").is_err());
        assert!(parse_temperature("").is_err());
    }
    
    #[test]
    fn test_parse_unit() {
        assert_eq!(parse_unit("C"), Ok("C"));
        assert_eq!(parse_unit("fahrenheit"), Ok("F"));
        assert!(parse_unit("K").is_err());
    }
    
    #[test]
    fn test_validate_temperature() {
        assert!(validate_temperature(25.0, "C").is_ok());
        assert!(validate_temperature(-300.0, "C").is_err());
        assert!(validate_temperature(-500.0, "F").is_err());
        assert!(validate_temperature(100.0, "F").is_ok());
    }
}
```

## Step 6: Running and Testing

```bash
# Run in release mode
cargo run --release

# Run tests
cargo test

# Example output:
# === Temperature Converter ===
# Enter temperature: 100
# Enter unit (C/F): F
# 100.0°C = 212.0°F

# Error case:
# === Temperature Converter ===
# Enter temperature: abc
# Enter unit (C/F): F
# Error: 'abc' is not a valid number
```

> [!WARNING]
> Always check for `f64::NAN` and `f64::INFINITY` in real applications. Users can enter these values and cause unexpected behavior.

## Extensions

Try these enhancements:

1. **Loop until quit** — Keep converting until user types "q"
2. **Kelvin support** — Add Kelvin unit
3. **Prettier output** — Use colored output with `colored` crate
4. **Batch conversion** — Read multiple values from a file (`--file input.txt`)
5. **Precision flag** — `--precision 4` controls decimal places
6. **CLI arguments** — Use `clap` crate: `temp_converter 100 C to F`

```rust
// Extension: loop until quit
fn main() {
    loop {
        println!("\n=== Temperature Converter (q to quit) ===");
        print!("Enter temperature: ");
        io::stdout().flush().unwrap();
        
        let input = read_line();
        if input.to_lowercase() == "q" {
            break;
        }
        
        match parse_temperature(&input) {
            Ok(temp) => {
                print!("Enter unit (C/F): ");
                io::stdout().flush().unwrap();
                let unit_input = read_line();
                
                match parse_unit(&unit_input) {
                    Ok(unit) => {
                        if let Err(e) = validate_temperature(temp, unit) {
                            eprintln!("Error: {e}");
                            continue;
                        }
                        match unit {
                            "C" => println!("{temp:.1}°C = {:.1}°F", celsius_to_fahrenheit(temp)),
                            "F" => println!("{temp:.1}°F = {:.1}°C", fahrenheit_to_celsius(temp)),
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

## Practice Questions

1. What does `io::stdout().flush()` do and why is it needed?
2. Why do we use `f64` instead of `f32` for temperature?
3. What does the `?` operator do in the converter code?
4. How does `parse::<f64>()` handle invalid input?
5. Why can't we use `==` to compare float results?
6. What's the purpose of the `validate_temperature` function?
7. How would you add Kelvin conversion to the program?
8. Why is the `run_converter` function separated from `main`?
9. What does `std::process::exit(1)` do?
10. How would you write a test for the case-sensitive unit parsing?
