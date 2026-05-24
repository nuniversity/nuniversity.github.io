---
title: "Ownership"
description: "Domine a característica mais única do Rust: regras de ownership, semântica de movimentação, trait Copy e Clone"
order: 6
duration: "35 minutos"
difficulty: "iniciante"
---

# Ownership

Ownership é a característica mais distintiva do Rust. Ela possibilita segurança de memória sem um garbage collector ao impor regras estritas em tempo de compilação.

## As Regras de Ownership

1. **Cada valor tem exatamente um dono.**
2. **Só pode haver um dono por vez.**
3. **Quando o dono sai de escopo, o valor é liberado.**

```rust
fn main() {
    {                           // s não é válido aqui
        let s = String::from("olá"); // s se torna válido
        // usar s
    }                           // s sai de escopo, memória liberada
}
```

> [!NOTE]
> Quando `s` sai de escopo, Rust chama `drop()` automaticamente — como C++ RAII, mas sem o gerenciamento manual de destruidores.

## Semântica de Movimentação

Quando você atribui ou passa um valor, a ownership **se move**:

```rust
fn main() {
    let s1 = String::from("olá");
    let s2 = s1;  // s1 é MOVIDO para s2
    
    // println!("{s1}"); // ERRO: empréstimo de valor movido
    println!("{s2}"); // OK: s2 possui a string
}
```

Após a movimentação, `s1` é **invalidado**. O compilador previne uso-após-movimentação.

> [!SUCCESS]
> Movimentações são baratas — apenas copiam um ponteiro, comprimento e capacidade. Nenhum dado do heap é copiado. O antigo dono é simplesmente marcado como inválido em tempo de compilação.

### O que Acontece na Memória

```
Antes da movimentação:
s1 -> { ptr: "olá", len: 4, cap: 4 }
          |
          v
       [o][l][á]  (heap)

Após a movimentação:
s1 -> INVALID (imposto pelo compilador)
s2 -> { ptr: "olá", len: 4, cap: 4 }
          |
          v
       [o][l][á]  (mesma memória do heap)
```

## Movimentação em Funções

```rust
fn take_ownership(s: String) {  // s assume ownership
    println!("{s}");
}  // s liberado aqui, heap liberado

fn make_copy(i: i32) {  // i é copiado (trait Copy)
    println!("{i}");
}  // i sai de escopo, nada especial

fn main() {
    let s = String::from("olá");
    take_ownership(s);
    // println!("{s}"); // ERRO: movido
    
    let x = 42;
    make_copy(x);
    println!("{x}"); // OK: x é Copy
}
```

### Retornando Ownership

```rust
fn give_ownership() -> String {
    let s = String::from("olá");
    s  // Ownership se move para o chamador
}

fn take_and_give(s: String) -> String {
    s  // Ownership se move novamente
}

fn main() {
    let s1 = give_ownership();
    let s2 = take_and_give(s1);
    // s1 agora é inválido
    println!("{s2}");
}
```

## A Trait Copy

Tipos simples armazenados inteiramente na stack implementam `Copy`. Atribuição **copia** em vez de mover:

```rust
fn main() {
    // Tipos Copy: atribuição = cópia
    let x = 5;
    let y = x;  // x ainda é válido — i32 é Copy
    println!("{x} {y}"); // Ambos funcionam
    
    let a = true;
    let b = a;  // bool é Copy
    println!("{a} {b}"); // Ambos funcionam
}
```

### Tipos Que São Copy

| Tipo | Exemplos |
|------|----------|
| Inteiros | `i32`, `u64`, `i8`, etc. |
| Floats | `f32`, `f64` |
| Booleano | `bool` |
| Caractere | `char` |
| Tuplas de Copy | `(i32, i32)`, `(bool, char)` |
| Referências | `&T`, `&mut T` (sempre Copy) |

### Tipos Que NÃO São Copy

| Tipo | Razão |
|------|-------|
| `String` | Possui memória no heap |
| `Vec<T>` | Possui memória no heap |
| `&mut T` | Acesso único (movido, não Copy) |
| `Box<T>` | Possui memória no heap |

> [!WARNING]
> Se um tipo ou qualquer um de seus campos implementa `Drop`, ele não pode implementar `Copy`. Isso previne erros de dupla liberação.

## Clone — Cópia Profunda Explícita

Quando você quer uma cópia profunda de dados no heap, chame `.clone()`:

```rust
fn main() {
    let s1 = String::from("olá");
    let s2 = s1.clone();  // Cópia profunda: dados do heap são duplicados
    
    println!("s1: {s1}"); // Ainda válido
    println!("s2: {s2}"); // Cópia separada
    
    // Com tipos Copy, clone não é necessário
    let x = 5;
    let y = x.clone(); // Funciona, mas redundante para tipos Copy
}
```

> [!NOTE]
| Operação | Dados da Stack | Dados do Heap | Custo |
|-----------|---------------|---------------|-------|
| Movimentação | Copiados | Não copiados (dono muda) | Tamanho do ponteiro |
| Clone | Copiados | Copiados profundamente | Alocação no heap + cópia |
| Copy | Copiados | N/A (sem dados no heap) | Trivial |

## Ownership e Escopo

```rust
fn main() {
    let s = String::from("fora");
    {
        let interno = String::from("dentro");
        println!("{interno}"); // OK
    }
    // interno foi liberado aqui
    
    println!("{s}"); // OK
    // s é liberado aqui
}
```

### Ordem de Liberação

Variáveis são liberadas em **ordem inversa de declaração**:

```rust
fn main() {
    let a = String::from("a");
    let b = String::from("b");
    // b liberado primeiro, depois a
}
```

## Movimentações Parciais

Structs podem ser parcialmente movidas:

```rust
struct Pessoa {
    nome: String,
    idade: u8,
}

fn main() {
    let pessoa = Pessoa {
        nome: String::from("Alice"),
        idade: 30,
    };
    
    let nome = pessoa.nome; // Mover nome para fora
    // println!("{}", pessoa.nome); // ERRO: parcialmente movido
    println!("{}", pessoa.idade); // OK: idade é Copy, ainda acessível
}
```

## Ownership na Prática

```rust
// Ruim: ownership movida, mas queremos usar depois
fn ruim_comprimento(s: String) -> usize {
    s.len()
} // s liberado

// Bom: retornar ownership
fn ok_comprimento(s: String) -> (String, usize) {
    let len = s.len();
    (s, len)
}

// Melhor: pegar emprestado em vez de tomar ownership (próxima lição)
fn melhor_comprimento(s: &String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("olá");
    let len = ruim_comprimento(s);
    // println!("{s}"); // ERRO
    
    let s = String::from("olá");
    let (s, len) = ok_comprimento(s);
    println!("{s} tem {len} caracteres"); // OK
    
    let s = String::from("olá");
    let len = melhor_comprimento(&s);
    println!("{s} tem {len} caracteres"); // OK
}
```

## Ownership com Tipos Personalizados

```rust
#[derive(Debug)]
struct Arquivo {
    nome: String,
    dados: Vec<u8>,
}

fn main() {
    let arquivo = Arquivo {
        nome: String::from("dados.txt"),
        dados: vec![1, 2, 3],
    };
    
    let arquivo2 = arquivo; // Movimentação! File NÃO é Copy
    // println!("{:?}", arquivo); // ERRO
    
    // Use clone se quiser ambos
    let arquivo3 = arquivo2.clone();
    println!("{:?}", arquivo2);
    println!("{:?}", arquivo3);
}
```

> [!SUCCESS]
> Ownership é a base das garantias de segurança do Rust. Quando fizer sentido, você entenderá como Rust elimina categorias inteiras de bugs (use-after-free, dupla liberação, ponteiros soltos) em tempo de compilação.

## Perguntas de Prática

1. Quais são as três regras de ownership?
2. O que acontece com a memória quando o dono sai de escopo?
3. Qual a diferença entre movimentação e cópia?
4. Quais tipos implementam a trait `Copy`?
5. O que `.clone()` faz?
6. Por que um tipo com `Drop` não pode implementar `Copy`?
7. O que acontece se você tentar usar um valor após movê-lo?
8. O que determina a ordem em que as variáveis são liberadas?
9. O que é uma movimentação parcial?
10. Como retornar ownership de uma função enquanto também retorna dados computados?
