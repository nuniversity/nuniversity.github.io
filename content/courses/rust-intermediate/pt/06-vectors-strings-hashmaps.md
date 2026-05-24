---
title: "Vectors, Strings e HashMaps"
description: "Domine os tipos de coleção padrão do Rust com operações comuns, iteração e a API Entry"
order: 6
duration: "45 minutos"
difficulty: "intermediário"
---

# Vectors, Strings e HashMaps

A biblioteca padrão do Rust fornece coleções poderosas e eficientes. Entender seus internos e APIs é essencial para o desenvolvimento produtivo em Rust.

## Vec\<T\> — Arrays Dinâmicos

Vectors armazenam elementos do mesmo tipo em memória heap contígua:

```rust
fn main() {
    // Criação
    let mut v1: Vec<i32> = Vec::new();
    let v2 = vec![1, 2, 3];
    let v3 = vec![0; 5]; // [0, 0, 0, 0, 0]
    
    // Adicionar e remover
    v1.push(10);
    v1.push(20);
    v1.push(30);
    
    let last = v1.pop(); // Some(30)
    let first = v1.remove(0); // 10
    
    // Acesso
    let third = &v2[2]; // 3 — panic se fora dos limites
    let safe = v2.get(2); // Some(&3) — retorna Option
    let out = v2.get(100); // None — seguro
    
    // Atualização
    if let Some(x) = v1.get_mut(0) {
        *x = 42;
    }
}
```

> [!NOTE]
| Operação | Retorna | Panic? | Custo |
|-----------|---------|---------|------|
| `vec[i]` | `&T` | Sim (OOB) | O(1) |
| `vec.get(i)` | `Option<&T>` | Não | O(1) |
| `vec.push(x)` | `()` | Não (pode realocar) | O(1) amortizado |
| `vec.pop()` | `Option<T>` | Não | O(1) |
| `vec.insert(i, x)` | `()` | Sim (OOB) | O(n) |
| `vec.remove(i)` | `T` | Sim (OOB) | O(n) |

### Iteração

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // Iteração imutável
    for x in &v {
        println!("{x}");
    }
    
    // Iteração mutável
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
    
    // Iteração consumindo
    for x in v { // v é movido
        println!("{x}");
    }
    // println!("{:?}", v); // ERROR: v movido
    
    // Vários adaptadores
    let doubled: Vec<i32> = vec![1, 2, 3].iter().map(|x| x * 2).collect();
    let evens: Vec<&i32> = vec![1, 2, 3, 4].iter().filter(|x| *x % 2 == 0).collect();
    let sum: i32 = vec![1, 2, 3].iter().sum();
}
```

### Capacidade do Vector

```rust
fn main() {
    let mut v = Vec::with_capacity(100);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 0, 100
    
    v.push(1);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 100
    
    v.shrink_to_fit();
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 1
    
    // Reservar mais
    v.reserve(1000);
    println!("cap: {}", v.capacity()); // 1001
}
```

> [!SUCCESS]
> Pré-aloque com `Vec::with_capacity(n)` quando você souber o tamanho esperado. Isso evita realocações repetidas.

## String — Texto UTF-8

`String` é um `Vec<u8>` que garante UTF-8 válido:

```rust
fn main() {
    // Criação
    let mut s = String::new();
    let s1 = String::from("hello");
    let s2 = "world".to_string();
    let s3 = format!("{s1} {s2}");
    
    // Adicionar
    s.push('!');        // Caractere único
    s.push_str(" world"); // Fatia de string
    
    // Concatenação
    let combined = s1 + &s2; // s1 movido, &s2 emprestado
    // println!("{s1}"); // ERROR: movido
    let combined = format!("{} {}", "hello", "world"); // Sem move
    
    // Indexação — NÃO suportada por índice de char
    // let c = s[0]; // ERROR: String não suporta index
}
```

> [!WARNING]
> Strings não suportam indexação O(1) porque UTF-8 tem largura variável. `s[i]` seria O(n) e poderia dividir um caractere. Use `.chars()` ou `.bytes()`.

### Operações com String

```rust
fn main() {
    let s = "hello world".to_string();
    
    // Iteração
    for c in s.chars() {         // Grafemas Unicode
        print!("{c} ");
    }
    println!();
    
    for b in s.bytes() {         // Bytes brutos
        print!("{b} ");
    }
    println!();
    
    // Fatiamento (cuidado!)
    let hello = &s[0..5]; // "hello"
    // let bad = &s[0..4]; // PANICS: não está em limite de char
    
    // Busca e substituição
    println!("contains 'world': {}", s.contains("world"));
    let replaced = s.replace("world", "Rust");
    println!("{replaced}");
    
    // Divisão
    let words: Vec<&str> = s.split(' ').collect();
    println!("{:?}", words);
    
    // Aparar
    let padded = "  hello  ".to_string();
    println!("'{}'", padded.trim());
}
```

### String vs &str

| Aspecto | `String` | `&str` |
|--------|----------|--------|
| Ownership | Sim | Não (emprestado) |
| Mutável | Sim | Não |
| Alocada no heap | Sim | Aponta para memória existente |
| Tamanho | `len()` em bytes | `len()` em bytes |
| Uso em parâmetros | Prefira `&str` | Prefira `&str` |

### Construindo Strings Eficientemente

```rust
fn main() {
    // Ruim: muitas alocações
    let mut s = String::new();
    for i in 0..100 {
        s = s + &i.to_string(); // Nova alocação cada vez!
    }
    
    // Bom: pré-alocar
    let mut s = String::with_capacity(300);
    for i in 0..100 {
        s.push_str(&i.to_string());
    }
    
    // Melhor: usar collect
    let s: String = (0..100).map(|i| i.to_string()).collect();
}
```

## HashMap\<K, V\> — Armazenamento Chave-Valor

```rust
use std::collections::HashMap;

fn main() {
    // Criação
    let mut scores: HashMap<String, i32> = HashMap::new();
    
    // Inserir
    scores.insert(String::from("Alice"), 100);
    scores.insert(String::from("Bob"), 90);
    
    // Acesso
    let alice = scores.get("Alice"); // Some(&100)
    let charlie = scores.get("Charlie"); // None
    
    // Iterar
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
    
    // Verificar existência
    if scores.contains_key("Alice") {
        println!("Alice is in the map");
    }
    
    // Remover
    scores.remove("Bob");
}
```

### A API Entry

A maneira mais idiomática de trabalhar com HashMaps:

```rust
use std::collections::HashMap;

fn main() {
    let mut word_count = HashMap::new();
    let text = "hello world hello Rust hello";
    
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    
    println!("{:?}", word_count);
    // {"hello": 3, "world": 1, "Rust": 1}
}
```

| Método Entry | Comportamento |
|-------------|----------|
| `or_insert(v)` | Insere v se ausente, retorna &mut V |
| `or_insert_with(fn)` | Insere resultado de fn() se ausente |
| `or_default()` | Insere V::default() se ausente |
| `and_modify(fn)` | Modifica valor existente se presente |

### Dicas de Performance para HashMap

```rust
use std::collections::HashMap;

fn main() {
    // Pré-alocar capacidade
    let mut map: HashMap<&str, i32> = HashMap::with_capacity(1000);
    
    // Usar entry API para inserir-ou-modificar
    map.entry("key").and_modify(|v| *v += 1).or_insert(1);
    
    // Hasher personalizado (para performance)
    use std::collections::hash_map::RandomState;
    let fast_map: HashMap<&str, i32, RandomState> = HashMap::default();
}
```

## Outras Coleções Úteis

| Coleção | Descrição | Caso de Uso |
|------------|-------------|----------|
| `VecDeque<T>` | Fila duplamente terminada | FIFO, push/pop ambas as extremidades |
| `LinkedList<T>` | Lista duplamente ligada | Raro, fragmentação pesada |
| `HashSet<T>` | Conjunto de valores únicos | Deduplicação, pertinência |
| `BTreeMap<K, V>` | Chave-valor ordenado | Iteração ordenada |
| `BTreeSet<T>` | Conjunto ordenado | Valores únicos ordenados |
| `BinaryHeap<T>` | Fila de prioridade | Max-heap, processamento por prioridade |

```rust
use std::collections::{VecDeque, HashSet, BTreeMap, BinaryHeap};

fn main() {
    // VecDeque — fila eficiente
    let mut queue = VecDeque::new();
    queue.push_back(1);
    queue.push_front(0);
    assert_eq!(queue.pop_front(), Some(0));
    
    // HashSet — teste rápido de pertinência
    let mut seen = HashSet::new();
    seen.insert("hello");
    assert!(seen.contains("hello"));
    
    // BTreeMap — chaves ordenadas
    let mut sorted = BTreeMap::new();
    sorted.insert("b", 2);
    sorted.insert("a", 1);
    for (k, v) in &sorted {
        println!("{k}: {v}"); // a: 1, b: 2 (ordenado)
    }
    
    // BinaryHeap — max heap
    let mut heap = BinaryHeap::new();
    heap.push(3);
    heap.push(1);
    heap.push(5);
    assert_eq!(heap.pop(), Some(5)); // Maior primeiro
}
```

## Exemplo Real: Analisador de Frequência de Palavras

```rust
use std::collections::HashMap;

fn word_frequency(text: &str) -> Vec<(String, usize)> {
    let mut freq: HashMap<String, usize> = HashMap::new();
    
    for word in text
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| !w.is_empty())
    {
        *freq.entry(word.to_string()).or_insert(0) += 1;
    }
    
    let mut result: Vec<_> = freq.into_iter().collect();
    result.sort_by(|a, b| b.1.cmp(&a.1));
    result.truncate(10);
    result
}

fn main() {
    let text = "The quick brown fox jumps over the lazy dog. The dog slept. The fox jumped again.";
    let top_words = word_frequency(text);
    
    for (word, count) in top_words {
        println!("{word}: {count}");
    }
}
```

## Perguntas de Prática

1. Qual é a diferença entre `Vec::new()` e `vec![]`?
2. Como acessar seguramente um elemento de vector sem panic?
3. O que é a capacidade de um vector e por que isso importa?
4. Por que `String` não suporta indexação por posição de caractere?
5. Como iterar sobre os caracteres de uma String?
6. Quando usar `&str` vs `String` em parâmetros de função?
7. O que a API Entry fornece que insert direto não fornece?
8. Como atualizar um valor em um HashMap se existir, ou inserir se não existir?
9. Qual coleção você usaria para uma fila de prioridade?
10. Como pré-alocar um HashMap para melhor performance?
