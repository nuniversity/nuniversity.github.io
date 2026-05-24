---
title: "Tipos de Dados"
description: "Domine os tipos escalares, tipos compostos, inferência de tipos e anotações de tipo explícitas em Rust"
order: 4
duration: "30 minutos"
difficulty: "iniciante"
---

# Tipos de Dados

Rust é uma linguagem **estaticamente tipada** — toda variável deve ter um tipo conhecido em tempo de compilação. O compilador é inteligente em inferir tipos, mas você pode sempre anotá-los explicitamente.

## Duas Categorias de Tipos

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| **Escalar** | Valor único | inteiros, floats, bool, char |
| **Composto** | Grupo de valores | tuplas, arrays, structs, enums |

## Tipos Escalares

### Tipos Inteiros

Rust oferece inteiros com sinal (`i`) e sem sinal (`u`) em vários tamanhos:

| Tamanho | Com Sinal | Sem Sinal | Faixa (com sinal) |
|---------|-----------|-----------|-------------------|
| 8 bits | `i8` | `u8` | -128 a 127 |
| 16 bits | `i16` | `u16` | -32.768 a 32.767 |
| 32 bits | `i32` | `u32` | -2³¹ a 2³¹ -1 |
| 64 bits | `i64` | `u64` | -2⁶³ a 2⁶³ -1 |
| 128 bits | `i128` | `u128` | -2¹²⁷ a 2¹²⁷ -1 |
| arch | `isize` | `usize` | depende da plataforma (32/64 bits) |

```rust
fn main() {
    let a = 42;        // i32 (padrão)
    let b: u8 = 255;   // Byte sem sinal explícito
    let c = 100_000;   // Separadores de sublinhado para legibilidade
    let d = 0xff;      // Hexadecimal
    let e = 0o77;      // Octal
    let f = 0b1111;    // Binário
    let g = b'A';      // Literal de byte (u8, ASCII)
    
    // usize/isize para indexar coleções
    let arr = [1, 2, 3];
    let index: usize = 1;
    println!("{0}", &arr[index]); // 2
}
```

> [!NOTE]
> `i32` é o tipo inteiro padrão porque é rápido em CPUs modernas e evita problemas de estouro comuns com tipos menores.

### Estouro de Inteiro

```rust
fn main() {
    let mut x: u8 = 255;
    // x = x + 1; // PANICA em modo debug (verificação de estouro)
    
    // Wrapping explícito:
    let y = x.wrapping_add(1); // 0 (envolve)
    let z = x.saturating_add(1); // 255 (satura no máximo)
    println!("wrapping: {y}, saturating: {z}");
}
```

| Método | Comportamento |
|--------|---------------|
| `wrapping_add` | Envolve (complemento de dois) |
| `saturating_add` | Para no valor mínimo/máximo |
| `overflowing_add` | Retorna (resultado, estourou bool) |
| `checked_add` | Retorna `Option` (None no estouro) |

> [!WARNING]
> Em modo debug, estouro de inteiro panica. Em modo release, ele envolve silenciosamente. Nunca confie no comportamento de estouro — use métodos explícitos.

### Tipos de Ponto Flutuante

```rust
fn main() {
    let x = 2.0;       // f64 (padrão, dupla precisão)
    let y: f32 = 3.0;  // f32 (precisão simples)
    
    // Operações f64
    let ao_quadrado = x.powi(2);      // 4.0
    let raiz = x.sqrt();          // 1.414...
    let resto = 5.0 % 2.0;   // 1.0
}
```

| Tipo | Precisão | Tamanho | Caso de Uso |
|------|----------|---------|-------------|
| `f32` | ~7 dígitos decimais | 4 bytes | Gráficos, GPUs |
| `f64` | ~15 dígitos decimais | 8 bytes | Computação geral |

> [!WARNING]
> Floats não implementam `Eq` ou `Ord` — NaN e problemas de precisão tornam a comparação não confiável. Use `f64::EPSILON` para comparação aproximada:
> ```rust
> fn approx_eq(a: f64, b: f64) -> bool {
>     (a - b).abs() < f64::EPSILON
> }
> ```

### O Tipo Booleano

```rust
fn main() {
    let rust_e_divertido = true;
    let e_dificil: bool = false;
    
    if rust_e_divertido {
        println!("Rust é divertido!");
    }
    
    // Conversão para inteiro
    println!("{}", true as u8); // 1
    println!("{}", false as u8); // 0
}
```

### O Tipo Caractere

`char` tem 4 bytes e representa um Valor Escalar Unicode:

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ';
    let gato_olhos_coracao = '😻';
    
    println!("{c} {z} {gato_olhos_coracao}");
    
    // char como número
    println!("{}", 'A' as u8); // 65
    println!("{}", '😻' as u32); // 128571
}
```

> [!NOTE]
> `char` tem 4 bytes (não 1 como o char do C). Ele suporta Unicode completo, mas não é ASCII — use `u8` ou `&[u8]` para dados em nível de byte.

## Tipos Compostos

### Tuplas

Tuplas agrupam valores de **tipos diferentes**. Tamanho fixo, conhecido em tempo de compilação.

```rust
fn main() {
    let tup: (i32, f64, char) = (500, 6.4, 'x');
    
    // Desestruturação
    let (x, y, z) = tup;
    println!("{x}, {y}, {z}");
    
    // Notação de ponto (indexada do 0)
    println!("{}", tup.0); // 500
    println!("{}", tup.1); // 6.4
    
    // Tupla unitária (tupla vazia)
    let unit: () = ();
}
```

| Padrão | Exemplo | Quando Usar |
|--------|---------|-------------|
| Desestruturar | `let (a, b) = tup` | Extrair todos os valores |
| Acesso por ponto | `tup.0` | Extrair um valor |
| Ignorar | `let (a, _, _) = tup` | Extrair alguns valores |

### Arrays

Arrays têm **tamanho fixo**, todos os elementos **mesmo tipo**, armazenados na **stack**:

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    
    // Anotação de tipo: [tipo; tamanho]
    let tipado: [i32; 5] = [1, 2, 3, 4, 5];
    
    // Expressão de repetição: [valor; contagem]
    let zeros = [0; 10];      // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    
    // Acesso
    let primeiro = arr[0];
    let segundo = arr[1];
    
    // Verificação de limites em execução
    // let oops = arr[10]; // Panica: índice fora dos limites
}
```

| Característica | Array | Tupla |
|----------------|-------|-------|
| Mesmo tipo? | Sim | Não |
| Tamanho fixo? | Sim | Sim |
| Tipo padrão | `[T; N]` | `(T1, T2, ...)` |
| Acesso | `arr[i]` (verificado em execução) | `tup.i` (tempo de compilação) |

### Vectors (Prévia)

Vectors são arrays alocados no heap, redimensionáveis:

```rust
fn main() {
    let mut vec = vec![1, 2, 3];
    vec.push(4);  // Agora [1, 2, 3, 4]
    println!("{vec:?}");
}
```

## Inferência de Tipos e Anotações

Rust infere tipos na maioria das situações:

```rust
fn main() {
    // Inferência funciona
    let x = 42;        // i32
    let y = 3.14;      // f64
    let cond = true;   // bool
    
    // Anotações esclarecem intenção
    let porta: u16 = 8080;
    let pi: f32 = 3.14159;
    
    // Às vezes obrigatório (ambiguidade de tipo)
    let ambíguo = "olá".parse(); // ERRO: não pode inferir tipo
    let analisado: u32 = "42".parse().unwrap(); // OK com anotação
    
    // Sintaxe Turbofish
    let n = "100".parse::<i32>().unwrap();
}
```

> [!SUCCESS]
| Situação | Exemplo |
|-----------|---------|
| `parse()` precisa de anotação | `"42".parse::<i32>()` ou `let x: i32 = "42".parse()?` |
| Inteiro padrão | `let x = 42` → `i32` |
| Float padrão | `let x = 3.14` → `f64` |
| Genérico de coleção | `Vec::new()` precisa de contexto de tipo |

## Aliases de Tipo

```rust
type Quilometros = i32;
type Thunk = Box<dyn FnOnce() + Send>;

fn main() {
    let distancia: Quilometros = 100;
    println!("{distancia} km");
}
```

## Tipos Sized e Unsized

| Categoria | Exemplos | Tamanho em Tempo de Compilação? |
|-----------|----------|--------------------------------|
| Sized | `i32`, `f64`, `[i32; 5]`, `String` | Sim |
| Unsized | `str`, `[i32]`, `dyn Trait` | Não (atrás de ponteiro) |

Tipos unsized devem sempre estar atrás de um ponteiro: `&str`, `Box<dyn Trait>`.

## Perguntas de Prática

1. Qual é o tipo inteiro padrão em Rust? E o tipo float?
2. Quantos bytes tem um `char` em Rust? Como isso difere do C?
3. Qual a diferença entre uma tupla e um array?
4. Por que você não pode comparar dois valores `f64` com `==` diretamente?
5. O que acontece se você acessar um índice de array fora dos limites?
6. Quando você deve anotar o tipo de uma variável explicitamente?
7. Para que serve o tipo unitário `()`?
8. Como analisar uma string em um inteiro?
9. Qual a diferença entre `usize` e `u64`?
10. Quais métodos você pode usar para lidar com estouro de inteiro com segurança?
