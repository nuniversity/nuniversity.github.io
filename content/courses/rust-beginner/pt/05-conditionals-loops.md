---
title: "Condicionais e Loops"
description: "Aprenda controle de fluxo com if/else, loop, while, for e a expressão match"
order: 5
duration: "30 minutos"
difficulty: "iniciante"
---

# Condicionais e Loops

Rust fornece controle de fluxo familiar com algumas reviravoltas únicas. Todas as construções de controle de fluxo são **expressões** que podem retornar valores.

## if / else if / else

Diferente de C, condições **não precisam de parênteses**:

```rust
fn main() {
    let numero = 7;
    
    if numero < 5 {
        println!("pequeno");
    } else if numero < 10 {
        println!("médio");
    } else {
        println!("grande");
    }
}
```

### if é uma Expressão

Todo bloco `if`/`else` retorna um valor — ambos os braços devem ser do mesmo tipo:

```rust
fn main() {
    let condicao = true;
    let numero = if condicao { 5 } else { 6 };
    println!("{numero}"); // 5
    
    // ERRO: braços devem ser do mesmo tipo
    // let ruim = if condicao { 5 } else { "seis" };
}
```

> [!NOTE]
| Característica | Rust | C/Java |
|----------------|------|--------|
| Parênteses | Opcionais | Obrigatórios |
| Expressão | Sim (retorna valor) | Apenas statement |
| Verificação de tipo | Todos os braços devem combinar | Sem tal exigência |

```rust
fn main() {
    let x = 10;
    let resultado = if x > 5 {
        "maior"
    } else if x == 5 {
        "igual"
    } else {
        "menor"
    };
    println!("{resultado}"); // "maior"
}
```

## loop — Loops Infinitos

`loop` executa para sempre a menos que explicitamente interrompido:

```rust
fn main() {
    let mut contador = 0;
    
    let resultado = loop {
        contador += 1;
        if contador == 10 {
            break contador * 2; // Break com um valor
        }
    };
    
    println!("resultado: {resultado}"); // 20
}
```

### Rótulos de Loop

Rótulos permitem interromper loops aninhados:

```rust
fn main() {
    'externo: for i in 1..=3 {
        for j in 1..=3 {
            if i == 2 && j == 2 {
                break 'externo; // Interrompe ambos os loops
            }
            println!("({i}, {j})");
        }
    }
}
```

| Característica | Sintaxe | Propósito |
|----------------|---------|-----------|
| Rótulo | `'nome:` | Nomear um loop |
| Break com valor | `break valor` | Sair e retornar valor |
| Continue | `continue` | Pular para próxima iteração |
| Break rotulado | `break 'nome` | Sair do loop externo |

> [!SUCCESS]
> Use `loop` quando precisar de padrões "tentar até sucesso" ou interromper com um valor. Para iteração contada, prefira `for`.

## while — Loops Condicionais

```rust
fn main() {
    let mut n = 3;
    while n > 0 {
        println!("{n}");
        n -= 1;
    }
    println!("lançamento!");
}
```

`while` também pode ser uma expressão com `break`:

```rust
fn main() {
    let mut n = 0;
    let resultado = while n < 10 {
        n += 1;
        if n == 7 {
            break n;
        }
    };
    println!("primeiro >= 7: {resultado:?}"); // Some(7)
}
```

> [!WARNING]
> O valor de break de um loop `while` é `Option<T>` porque a condição pode nunca ser verdadeira. Em `loop`, o valor de break é `T` diretamente.

## for — Iteração

`for` é o loop preferido em Rust — é seguro, rápido e expressivo:

```rust
fn main() {
    // Sintaxe de intervalo
    for i in 0..5 {        // 0, 1, 2, 3, 4
        print!("{i} ");
    }
    println!();
    
    // Intervalo inclusivo
    for i in 0..=5 {       // 0, 1, 2, 3, 4, 5
        print!("{i} ");
    }
    println!();
    
    // Iterar sobre coleção
    let arr = [10, 20, 30];
    for elemento in arr {
        print!("{elemento} ");
    }
    println!();
    
    // Com índice (enumerate)
    for (indice, valor) in arr.iter().enumerate() {
        println!("arr[{indice}] = {valor}");
    }
}
```

### Padrões de Iteração

```rust
fn main() {
    // Intervalo reverso
    for i in (1..=5).rev() {
        print!("{i} "); // 5 4 3 2 1
    }
    println!();
    
    // Passo a passo
    for i in (0..10).step_by(2) {
        print!("{i} "); // 0 2 4 6 8
    }
    println!();
    
    // Sobre caracteres de uma string
    for ch in "olá".chars() {
        print!("{ch} ");
    }
    println!();
}
```

| Tipo de Loop | Quando Usar | Break Retorna |
|--------------|-------------|---------------|
| `loop` | Precisa interromper com valor, ou indefinido | `T` |
| `while` | Baseado em condição, verificado a cada iteração | `Option<T>` |
| `for` | Iterar sobre coleção ou intervalo | `Option<T>` |

## Match — Correspondência de Padrões

`match` é o poderoso switch do Rust turbinado. É **exaustivo** — todo caso possível deve ser tratado:

```rust
fn main() {
    let numero = 3;
    
    match numero {
        1 => println!("um"),
        2 => println!("dois"),
        3 => println!("três"),
        _ => println!("outro"), // Caso genérico
    }
}
```

> [!NOTE]
> `_` é o padrão genérico. Corresponde a qualquer coisa e é o caso padrão. O compilador avisa se você esquecê-lo e não cobriu todos os valores.

### Match como Expressão

```rust
fn main() {
    let valor = 7;
    
    let descricao = match valor {
        0 => "zero",
        1..=3 => "pequeno",         // Padrão de intervalo
        4..=6 => "médio",
        7..=9 => "grande",
        _ if valor > 100 => "enorme", // Condição de guarda
        _ => "outro",
    };
    
    println!("{descricao}"); // "grande"
}
```

### Match com Enums

```rust
enum Moeda {
    Centavo,
    CincoCentavos,
    DezCentavos,
    VinteCincoCentavos,
}

fn valor_em_centavos(moeda: Moeda) -> u8 {
    match moeda {
        Moeda::Centavo => 1,
        Moeda::CincoCentavos => 5,
        Moeda::DezCentavos => 10,
        Moeda::VinteCincoCentavos => 25,
    }
}
```

### Match com Option

```rust
fn main() {
    let algum_valor: Option<i32> = Some(10);
    
    let dobrado = match algum_valor {
        Some(x) => x * 2,
        None => 0,
    };
    
    println!("{dobrado}"); // 20
}
```

## if let — Correspondência Concisa

Quando você só se importa com um padrão:

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
    
    // if let com else
    let valor: Option<i32> = None;
    if let Some(x) = valor {
        println!("recebeu {x}");
    } else {
        println!("não recebeu nada");
    }
}
```

| Construção | Melhor Para |
|------------|-------------|
| `match` | Verificação exaustiva, 3+ braços |
| `if let` | Um padrão para corresponder, ignorar o resto |
| `let else` | Desencapsular ou retornar/interromper cedo |

### let-else (Rust 1.65+)

```rust
fn main() {
    let valor: Option<i32> = Some(42);
    
    let Some(x) = valor else {
        println!("sem valor");
        return;
    };
    println!("recebeu {x}");
}
```

## Mundo Real: Validação de Entrada

```rust
use std::io;

fn main() {
    let mut entrada = String::new();
    
    println!("Digite um número entre 1 e 10:");
    io::stdin().read_line(&mut entrada).unwrap();
    
    let numero: i32 = match entrada.trim().parse() {
        Ok(n) => n,
        Err(_) => {
            println!("Número inválido!");
            return;
        }
    };
    
    match numero {
        1..=5 => println!("{numero} está na metade inferior"),
        6..=10 => println!("{numero} está na metade superior"),
        _ => println!("{numero} está fora do intervalo"),
    }
}
```

## Perguntas de Prática

1. Você pode usar `if` sem `else` em Rust?
2. O que `break 42` faz dentro de um `loop`?
3. Que tipo um loop `while` retorna quando interrompido com um valor?
4. Como iterar sobre um array com índice e valor?
5. O que acontece se um `match` não cobre todos os valores possíveis?
6. Qual a diferença entre `0..5` e `0..=5`?
7. Quando usar `if let` em vez de `match`?
8. O que o padrão `_` faz em uma expressão match?
9. Como `let-else` difere de `if let`?
10. Escreva um for loop que imprime números de 10 até 1.
