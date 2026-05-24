---
title: "Variáveis e Mutabilidade"
description: "Entenda a nomenclatura de variáveis em Rust, shadowing, constantes e como a imutabilidade previne classes inteiras de bugs"
order: 3
duration: "25 minutos"
difficulty: "iniciante"
---

# Variáveis e Mutabilidade

Variáveis em Rust são **imutáveis por padrão**. Esta é uma das decisões centrais de design da linguagem — ela leva você a um código mais seguro e previsível.

## Variáveis Imutáveis

```rust
fn main() {
    let x = 5;
    // x = 6; // ERRO: cannot assign twice to immutable variable
    println!("x é {x}");
}
```

> [!NOTE]
> Imutabilidade por padrão remove uma categoria inteira de bugs: mutação não intencional. Se um valor não precisa mudar, o compilador o impõe.

## Variáveis Mutáveis

Use `mut` para tornar uma variável mutável:

```rust
fn main() {
    let mut y = 10;
    println!("y é {y}");
    y = 15;
    println!("agora y é {y}");
}
```

| Declaração | Pode Reatribuir? | Pode Modificar? | Caso de Uso |
|-------------|------------------|-----------------|-------------|
| `let x = 5;` | Não | Não | Constantes, dados somente leitura |
| `let mut x = 5;` | Sim | Sim | Contadores, acumuladores, estado |

## Constantes

Constantes são **sempre imutáveis**, devem ter **anotações de tipo explícitas**, e podem ser declaradas em qualquer escopo (incluindo global):

```rust
const VELOCIDADE_MAXIMA: u32 = 120;  // Anotação de tipo obrigatória
const NOME_APP: &str = "MeuApp";

fn main() {
    println!("{NOME_APP} velocidade máxima: {VELOCIDADE_MAXIMA}");
}
```

| Característica | `let` | `const` |
|----------------|-------|---------|
| Mutável? | Apenas com `mut` | Nunca |
| Anotação de tipo | Opcional | Obrigatória |
| Escopo | Bloco | Qualquer escopo (incluindo global) |
| Computada em | Execução | Tempo de compilação |
| Inline? | Não | Sim (valor copiado em cada uso) |

```rust
const TRES_HORAS_EM_SEGUNDOS: u32 = 60 * 60 * 3; // Expressão em tempo de compilação
```

> [!WARNING]
> Valores `const` são inseridos inline em cada ponto de uso. Isso significa que se você usar uma const em muitos lugares, ela é duplicada. Para um único local de memória, use `static`.

## Shadowing

Rust permite **sombreado (shadowing)** de uma variável ao redeclará-la com `let`:

```rust
fn main() {
    let x = 5;
    let x = x + 1;    // Shadow: nova variável, novo tipo possível
    let x = x * 2;
    println!("x é {x}"); // 12
    
    // Shadowing permite mudar o tipo
    let espacos = "   ";
    let espacos = espacos.len(); // Agora espacos é um número
}
```

### Shadowing vs Mutabilidade

| Aspecto | `let mut x` | `let x` (shadowing) |
|---------|-------------|---------------------|
| Muda valor | Sim | Sim (nova variável) |
| Muda tipo | Não | Sim |
| Local de memória | Mesmo | Novo |
| Escopo | Mesmo bloco | Antiga ligação sombreada |

```rust
fn main() {
    // Mutabilidade: mesmo tipo, mesma memória
    let mut contador = 0;
    contador += 1;
    contador += 1;
    println!("{contador}"); // 2
    
    // Shadowing: nova variável, pode mudar tipo
    let valor = "olá";
    let valor = valor.len();
    println!("{valor}"); // 3
}
```

> [!SUCCESS]
> Shadowing é útil para transformar valores mantendo o mesmo nome. Use quando precisar mudar o tipo ou quando o valor antigo não deve mais ser acessível.

## Escopo de Variáveis

Variáveis existem apenas dentro do bloco em que são declaradas (geralmente `{}`):

```rust
fn main() {
    let externa = 10;
    {
        let interna = 20;
        println!("interna: {interna}, externa: {externa}"); // Ambas acessíveis
    }
    // println!("{interna}"); // ERRO: não encontrada no escopo
    println!("externa: {externa}"); // Ainda acessível
}
```

### Inicialização de Variáveis

Variáveis devem ser inicializadas antes do uso:

```rust
fn main() {
    let x: i32;
    // println!("{x}"); // ERRO: usada antes da inicialização
    x = 5;
    println!("{x}"); // OK
}
```

> [!WARNING]
> Rust não permite usar uma variável não inicializada. Isso previne comportamento indefinido comum em C/C++ onde ler memória não inicializada produz valores lixo.

## Convenções de Nomenclatura

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Variáveis | `snake_case` | `nome_usuario`, `contagem_maxima` |
| Constantes | `SCREAMING_SNAKE_CASE` | `VELOCIDADE_MAXIMA`, `CHAVE_API` |
| Funções | `snake_case` | `calcular_area()` |
| Tipos | `PascalCase` | `PerfilUsuario`, `String` |

```rust
const TIMEOUT_PADRAO_MS: u64 = 5000;

fn main() {
    let idade_usuario: u8 = 25;
    let ativo: bool = true;
}
```

## Padrões com Sublinhado

```rust
fn main() {
    let _nao_usado = 42;      // Suprime aviso de variável não usada
    let _ = 100;              // Descarta completamente — sem vinculação
    let _x = 10;              // Prefixo sublinhado = "intencionalmente não usado"
}
```

## Atribuição por Desestruturação

Rust suporta desestruturação com `let`:

```rust
fn main() {
    let (x, y, z) = (1, 2, 3);
    println!("{x}, {y}, {z}"); // 1, 2, 3
    
    // Sublinhado para descartar partes
    let (a, _, b) = (10, 20, 30);
    println!("{a}, {b}"); // 10, 30
}
```

## Padrões do Mundo Real

```rust
// Máquina de estados segura: estados enum imutáveis
enum EstadoConexao {
    Desconectado,
    Conectando,
    Conectado,
}

fn main() {
    let estado = EstadoConexao::Desconectado;
    // estado = EstadoConexao::Conectado; // Deve usar 'mut' ou shadow
    
    let estado = EstadoConexao::Conectado; // Shadow: novo estado
    
    // Use shadowing para conversão de tipo
    let entrada = "  Olá Mundo  ";
    let entrada = entrada.trim();       // &str -> &str (aparado)
    let entrada = entrada.to_string();  // &str -> String
    let entrada = entrada.as_bytes();   // String -> &[u8]
}
```

## Perguntas de Prática

1. Por que variáveis são imutáveis por padrão em Rust?
2. Qual palavra-chave torna uma variável mutável?
3. Qual a diferença entre `const` e `let`?
4. O que o shadowing permite que `mut` não permite?
5. Uma constante pode ser declarada dentro de uma função?
6. O que acontece quando uma variável sai de escopo?
7. Por que variáveis devem ser inicializadas antes do uso?
8. Qual convenção de nomenclatura é usada para constantes Rust?
9. Como suprimir um aviso de variável não usada?
10. O que `let (x, _, z) = (1, 2, 3);` faz?
