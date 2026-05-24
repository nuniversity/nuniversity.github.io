---
title: "Projeto Iniciante — Conversor de Temperatura CLI"
description: "Construa um conversor de temperatura completo de linha de comando com validação de entrada, tratamento de erros e conversões de unidade"
order: 10
duration: "35 minutos"
difficulty: "iniciante"
---

# Projeto Iniciante: Conversor de Temperatura CLI

Construa um conversor de temperatura de linha de comando que lida com conversões Fahrenheit ↔ Celsius com validação robusta de entrada.

## Configuração do Projeto

```bash
cargo new conversor_temp
cd conversor_temp
```

## Passo 1: Entendendo as Fórmulas

| Conversão | Fórmula |
|-----------|---------|
| °F → °C | `(f - 32) * 5/9` |
| °C → °F | `(c * 9/5) + 32` |

```rust
fn fahrenheit_para_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_para_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

#[test]
fn test_conversoes() {
    assert!((fahrenheit_para_celsius(32.0) - 0.0).abs() < f64::EPSILON);
    assert!((celsius_para_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
    assert!((fahrenheit_para_celsius(212.0) - 100.0).abs() < f64::EPSILON);
    assert!((celsius_para_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
}
```

> [!NOTE]
> Usamos `(a - b).abs() < f64::EPSILON` para comparação de floats porque `==` em floats não é confiável devido à precisão.

## Passo 2: Analisando Entrada do Usuário

```rust
use std::io::{self, Write};

fn ler_linha() -> String {
    let mut entrada = String::new();
    io::stdin().read_line(&mut entrada).expect("Falha ao ler linha");
    entrada.trim().to_string()
}

fn analisar_temperatura(entrada: &str) -> Result<f64, String> {
    entrada.trim().parse::<f64>()
        .map_err(|_| format!("'{entrada}' não é um número válido"))
}

fn analisar_unidade(entrada: &str) -> Result<&str, String> {
    match entrada.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{entrada}' não é uma unidade válida. Use 'C' ou 'F'")),
    }
}
```

## Passo 3: Construindo a Aplicação

```rust
fn executar_conversor() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Digite a temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let entrada_temp = ler_linha();
    let temperatura = analisar_temperatura(&entrada_temp)?;
    
    print!("Converter para (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let entrada_unid = ler_linha();
    let unidade_alvo = analisar_unidade(&entrada_unid)?;
    
    match unidade_alvo {
        "C" => {
            let resultado = fahrenheit_para_celsius(temperatura);
            println!("{temperatura}°F = {resultado:.1}°C");
        }
        "F" => {
            let resultado = celsius_para_fahrenheit(temperatura);
            println!("{temperatura}°C = {resultado:.1}°F");
        }
        _ => unreachable!(), // analisar_unidade já validou
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = executar_conversor() {
        eprintln!("Erro: {e}");
        std::process::exit(1);
    }
}
```

> [!SUCCESS]
> Usar `Result` como tipo de retorno nos permite usar o operador `?` para propagação limpa de erros. A função `main` lida com o caso `Err` externo.

## Passo 4: Adicionando Validação de Entrada

```rust
fn validar_temperatura(valor: f64, unidade: &str) -> Result<(), String> {
    match unidade {
        "C" if valor < -273.15 => {
            Err(format!("{valor}°C está abaixo do zero absoluto (-273.15°C)"))
        }
        "F" if valor < -459.67 => {
            Err(format!("{valor}°F está abaixo do zero absoluto (-459.67°F)"))
        }
        _ => Ok(()),
    }
}

fn executar_conversor_validado() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Digite a temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperatura = analisar_temperatura(&ler_linha())?;
    
    print!("Digite a unidade (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unidade = analisar_unidade(&ler_linha())?;
    
    validar_temperatura(temperatura, unidade)?;
    
    match unidade {
        "C" => {
            let resultado = celsius_para_fahrenheit(temperatura);
            println!("{temperatura:.1}°C = {resultado:.1}°F");
        }
        "F" => {
            let resultado = fahrenheit_para_celsius(temperatura);
            println!("{temperatura:.1}°F = {resultado:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}
```

## Passo 5: Aplicação Completa

Aqui está o programa completo:

```rust
use std::io::{self, Write};

fn fahrenheit_para_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}

fn celsius_para_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

fn ler_linha() -> String {
    let mut entrada = String::new();
    io::stdin().read_line(&mut entrada).expect("Falha ao ler linha");
    entrada.trim().to_string()
}

fn analisar_temperatura(entrada: &str) -> Result<f64, String> {
    entrada.parse::<f64>()
        .map_err(|_| format!("'{entrada}' não é um número válido"))
}

fn analisar_unidade(entrada: &str) -> Result<&str, String> {
    match entrada.trim().to_lowercase().as_str() {
        "c" | "celsius" => Ok("C"),
        "f" | "fahrenheit" => Ok("F"),
        _ => Err(format!("'{entrada}' não é uma unidade válida. Use 'C' ou 'F'")),
    }
}

fn validar_temperatura(valor: f64, unidade: &str) -> Result<(), String> {
    match unidade {
        "C" if valor < -273.15 => {
            Err(format!("{valor}°C está abaixo do zero absoluto"))
        }
        "F" if valor < -459.67 => {
            Err(format!("{valor}°F está abaixo do zero absoluto"))
        }
        _ => Ok(()),
    }
}

fn executar_conversor() -> Result<(), String> {
    println!("=== Conversor de Temperatura ===");
    
    print!("Digite a temperatura: ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let temperatura = analisar_temperatura(&ler_linha())?;
    
    print!("Digite a unidade (C/F): ");
    io::stdout().flush().map_err(|e| e.to_string())?;
    let unidade = analisar_unidade(&ler_linha())?;
    
    validar_temperatura(temperatura, unidade)?;
    
    match (unidade, temperatura) {
        ("C", c) => {
            let f = celsius_para_fahrenheit(c);
            println!("{c:.1}°C = {f:.1}°F");
        }
        ("F", f) => {
            let c = fahrenheit_para_celsius(f);
            println!("{f:.1}°F = {c:.1}°C");
        }
        _ => unreachable!(),
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = executar_conversor() {
        eprintln!("Erro: {e}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fahrenheit_para_celsius() {
        assert!((fahrenheit_para_celsius(32.0) - 0.0).abs() < f64::EPSILON);
        assert!((fahrenheit_para_celsius(212.0) - 100.0).abs() < f64::EPSILON);
        assert!((fahrenheit_para_celsius(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_celsius_para_fahrenheit() {
        assert!((celsius_para_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
        assert!((celsius_para_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
        assert!((celsius_para_fahrenheit(-40.0) - (-40.0)).abs() < f64::EPSILON);
    }
    
    #[test]
    fn test_analisar_temperatura() {
        assert_eq!(analisar_temperatura("25.5"), Ok(25.5));
        assert!(analisar_temperatura("abc").is_err());
        assert!(analisar_temperatura("").is_err());
    }
    
    #[test]
    fn test_analisar_unidade() {
        assert_eq!(analisar_unidade("C"), Ok("C"));
        assert_eq!(analisar_unidade("fahrenheit"), Ok("F"));
        assert!(analisar_unidade("K").is_err());
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

## Passo 6: Executando e Testando

```bash
# Executar em modo release
cargo run --release

# Executar testes
cargo test

# Exemplo de saída:
# === Conversor de Temperatura ===
# Digite a temperatura: 100
# Digite a unidade (C/F): F
# 100.0°C = 212.0°F

# Caso de erro:
# === Conversor de Temperatura ===
# Digite a temperatura: abc
# Digite a unidade (C/F): F
# Erro: 'abc' não é um número válido
```

> [!WARNING]
> Sempre verifique `f64::NAN` e `f64::INFINITY` em aplicações reais. Usuários podem digitar esses valores e causar comportamento inesperado.

## Extensões

Tente estas melhorias:

1. **Loop até sair** — Continue convertendo até o usuário digitar "q"
2. **Suporte a Kelvin** — Adicione unidade Kelvin
3. **Saída mais bonita** — Use saída colorida com crate `colored`
4. **Conversão em lote** — Leia múltiplos valores de um arquivo (`--file entrada.txt`)
5. **Flag de precisão** — `--precision 4` controla casas decimais
6. **Argumentos CLI** — Use crate `clap`: `conversor_temp 100 C to F`

```rust
// Extensão: loop até sair
fn main() {
    loop {
        println!("\n=== Conversor de Temperatura (q para sair) ===");
        print!("Digite a temperatura: ");
        io::stdout().flush().unwrap();
        
        let entrada = ler_linha();
        if entrada.to_lowercase() == "q" {
            break;
        }
        
        match analisar_temperatura(&entrada) {
            Ok(temp) => {
                print!("Digite a unidade (C/F): ");
                io::stdout().flush().unwrap();
                let entrada_unid = ler_linha();
                
                match analisar_unidade(&entrada_unid) {
                    Ok(unidade) => {
                        if let Err(e) = validar_temperatura(temp, unidade) {
                            eprintln!("Erro: {e}");
                            continue;
                        }
                        match unidade {
                            "C" => println!("{temp:.1}°C = {:.1}°F", celsius_para_fahrenheit(temp)),
                            "F" => println!("{temp:.1}°F = {:.1}°C", fahrenheit_para_celsius(temp)),
                            _ => unreachable!(),
                        }
                    }
                    Err(e) => eprintln!("Erro: {e}"),
                }
            }
            Err(e) => eprintln!("Erro: {e}"),
        }
    }
}
```

## Perguntas de Prática

1. O que `io::stdout().flush()` faz e por que é necessário?
2. Por que usamos `f64` em vez de `f32` para temperatura?
3. O que o operador `?` faz no código do conversor?
4. Como `parse::<f64>()` lida com entrada inválida?
5. Por que não podemos usar `==` para comparar resultados float?
6. Qual o propósito da função `validar_temperatura`?
7. Como você adicionaria conversão Kelvin ao programa?
8. Por que a função `executar_conversor` é separada de `main`?
9. O que `std::process::exit(1)` faz?
10. Como você escreveria um teste para a análise de unidade case-sensitive?
