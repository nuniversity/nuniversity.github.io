---
title: "Empréstimo e Referências"
description: "Aprenda referências, referências mutáveis, regras de empréstimo e slices — a chave para usar dados sem tomar ownership"
order: 7
duration: "30 minutos"
difficulty: "iniciante"
---

# Empréstimo e Referências

Empréstimo permite usar um valor sem tomar ownership. Em vez de mover dados, você passa uma **referência** — um ponteiro que segue regras estritas impostas em tempo de compilação.

## Referências (Empréstimo Imutável)

Uma referência `&T` permite ler dados sem possuí-los:

```rust
fn main() {
    let s = String::from("olá");
    let len = calcular_comprimento(&s);  // &s cria uma referência
    println!("'{s}' tem {len} caracteres"); // s ainda utilizável
}

fn calcular_comprimento(s: &String) -> usize {
    s.len() // Ler a string
    // s.push_str("!"); // ERRO: referência é imutável
}  // s é uma referência, nada é liberado
```

> [!NOTE]
> O oposto de referenciar (`&`) é **desreferenciar** (`*`). Mas Rust auto-desreferencia na maioria das situações, então você raramente precisa de `*` explicitamente.

### Visualização da Memória

```
Stack:
s (String) -> { ptr: 0x..., len: 4, cap: 4 }
                ^
                |
s_ref (&String) - aponta para os dados de stack de s
```

## Referências Mutáveis

`&mut T` permite ler **e** escrever:

```rust
fn main() {
    let mut s = String::from("olá");
    mudar(&mut s);
    println!("{s}"); // "olá, mundo"
}

fn mudar(s: &mut String) {
    s.push_str(", mundo");
}
```

> [!WARNING]
> Você só pode ter **uma** referência mutável para um valor por vez. Isso previne data races em tempo de compilação.

## As Regras de Empréstimo

Rust impõe duas regras em tempo de compilação:

1. **A qualquer momento, você tem** uma referência mutável **ou** qualquer número de referências imutáveis.
2. **Referências devem ser sempre válidas** (sem ponteiros soltos).

```rust
fn main() {
    let mut s = String::from("olá");
    
    let r1 = &s;    // OK: múltiplas referências imutáveis
    let r2 = &s;    // OK
    println!("{r1} {r2}");
    // r1 e r2 não são mais usadas aqui
    
    let r3 = &mut s; // OK: sem referências imutáveis em uso
    println!("{r3}");
}
```

### Violações que o Compilador Pega

```rust
fn main() {
    let mut s = String::from("olá");
    
    let r1 = &s;      // empréstimo imutável começa
    let r2 = &s;      // empréstimo imutável começa
    // let r3 = &mut s; // ERRO: não pode emprestar como mutável porque também é imutável
    println!("{r1} {r2}");
    // empréstimos imutáveis terminam aqui
    
    let r3 = &mut s;  // OK agora
    println!("{r3}");
}
```

```rust
fn main() {
    let mut s = String::from("olá");
    
    let r1 = &mut s;  // empréstimo mutável começa
    // let r2 = &s;   // ERRO: não pode emprestar como imutável
    // println!("{r2}");
    
    r1.push_str("!");
    println!("{r1}");
    // empréstimo mutável termina aqui
}
```

> [!SUCCESS]
| Cenário | Permitido? | Porquê |
|----------|----------|--------|
| Múltiplos `&T` | Sim | Somente leitura, sem conflito |
| Um `&mut T` | Sim | Acesso exclusivo de escrita |
| `&T` + `&mut T` simultaneamente | Não | Poderia ler enquanto escreve |
| Dois `&mut T` simultaneamente | Não | Dois escritores = data race |

## Referências Soltas

Rust previne referências soltas em tempo de compilação:

```rust
// fn solta() -> &String {  // ERRO: especificador de lifetime ausente
//     let s = String::from("olá");
//     &s
// } // s liberado, referência seria inválida

fn nao_solta() -> String {
    let s = String::from("olá");
    s  // Ownership se move, sem referência solta
}
```

> [!NOTE]
> O borrow checker garante que referências nunca sobrevivam aos dados que apontam. Isso elimina bugs de use-after-free completamente.

## As Regras na Prática

```rust
fn main() {
    let mut dados = vec![1, 2, 3];
    
    // Referência imutável — ok
    let visao = &dados;
    println!("{:?}", visao);
    
    // Operações mutáveis — ok (sem referências ativas)
    dados.push(4);
    println!("{:?}", dados);
    
    // Controle de escopo
    let r1 = &dados;
    let r2 = &dados;
    println!("{r1:?} {r2:?}"); // Último uso de referências imutáveis
    
    let r3 = &mut dados;
    r3.push(5);
    println!("{r3:?}");
}
```

## Slices — Referências a Elementos Contíguos

Slices são referências a uma sequência contígua dentro de uma coleção. São **ponteiros gordos** (ponteiro + comprimento).

### String Slices

```rust
fn main() {
    let s = String::from("olá mundo");
    
    let olá = &s[0..3];  // "olá"
    let mundo = &s[4..9]; // "mundo"
    
    println!("'{olá}' '{mundo}'");
    
    // Sintaxe abreviada
    let inteiro = &s[..];    // "olá mundo"
    let do_inicio = &s[..3]; // "olá"
    let ate_o_fim = &s[4..];  // "mundo"
}
```

> [!WARNING]
> String slices devem estar em limites de caracteres UTF-8 válidos. Fatiar no meio de um caractere multibyte vai panicar.

### Array Slices

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..4];  // &[i32] — tipo é [2, 3, 4]
    
    for item in slice {
        println!("{item}");
    }
    
    println!("len: {}", slice.len()); // 3
}
```

### O Tipo Slice

```rust
fn primeira_palavra(s: &str) -> &str {  // &str é um string slice
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("olá mundo");
    let palavra = primeira_palavra(&s);
    println!("{palavra}"); // "olá"
}
```

### &str vs String

| Tipo | Possuído? | Mutável? | Memória |
|------|-----------|----------|---------|
| `String` | Sim | Sim | Alocado no heap |
| `&str` | Não | Não | Visão em dados existentes |
| `&mut str` | Não | Sim | Raramente usado |

> [!SUCCESS]
> Use `&str` para parâmetros de função quando você só precisa ler dados de string. É mais flexível que `&String` porque aceita tanto `&String` quanto `&str`.

## Empréstimo com Funções

```rust
// Prefira &str em vez de &String para parâmetros
fn imprimir_mensagem(msg: &str) {
    println!("{msg}");
}

fn main() {
    let s = String::from("olá");
    imprimir_mensagem(&s);     // &String auto-coage para &str
    imprimir_mensagem("mundo"); // Literal &str funciona diretamente
}
```

## NLL (Non-Lexical Lifetimes)

Desde Rust 2018, empréstimos vivem até seu **último uso**, não até o fim do escopo:

```rust
fn main() {
    let mut s = String::from("olá");
    
    let r = &s;
    println!("{r}");   // Último uso do empréstimo imutável
    // r está "terminado" aqui
    
    let m = &mut s;    // OK: empréstimo imutável terminou
    m.push_str("!");
}
```

## Mundo Real: Analisador de Linha CSV Seguro

```rust
fn analisar_linha_csv(linha: &str) -> Vec<&str> {
    linha.split(',').map(|s| s.trim()).collect()
}

fn main() {
    let dados = String::from("Alice,30,Engenheiro\nBob,25,Designer");
    
    for linha in dados.lines() {
        let campos = analisar_linha_csv(linha);
        println!("Nome: {}, Idade: {}, Cargo: {}", campos[0], campos[1], campos[2]);
    }
}
```

## Perguntas de Prática

1. Qual a diferença entre uma referência e ownership?
2. Quantas referências mutáveis podem existir ao mesmo tempo?
3. Quantas referências imutáveis podem existir ao mesmo tempo?
4. Qual regra previne data races em Rust?
5. Como Rust previne referências soltas?
6. O que é um string slice (`&str`)?
7. Por que você deve usar `&str` em vez de `&String` em parâmetros de função?
8. O que é um "ponteiro gordo"?
9. Como NLL (Non-Lexical Lifetimes) melhora a ergonomia?
10. O que acontece se você fatiar uma string em um limite não-UTF-8?
