---
title: "Vectores, Strings y HashMaps"
description: "Domine los tipos de colección estándar de Rust con operaciones comunes, iteración y la API Entry"
order: 6
duration: "45 minutos"
difficulty: "intermedio"
---

# Vectores, Strings y HashMaps

La biblioteca estándar de Rust proporciona colecciones potentes y eficientes. Entender sus internos y APIs es esencial para el desarrollo productivo en Rust.

## Vec\<T\> — Arrays Dinámicos

Los vectores almacenan elementos del mismo tipo en memoria heap contigua:

```rust
fn main() {
    // Creación
    let mut v1: Vec<i32> = Vec::new();
    let v2 = vec![1, 2, 3];
    let v3 = vec![0; 5]; // [0, 0, 0, 0, 0]
    
    // Añadir y remover
    v1.push(10);
    v1.push(20);
    v1.push(30);
    
    let last = v1.pop(); // Some(30)
    let first = v1.remove(0); // 10
    
    // Acceso
    let third = &v2[2]; // 3 — panic si está fuera de límites
    let safe = v2.get(2); // Some(&3) — retorna Option
    let out = v2.get(100); // None — seguro
    
    // Actualización
    if let Some(x) = v1.get_mut(0) {
        *x = 42;
    }
}
```

> [!NOTE]
| Operación | Retorna | ¿Panic? | Costo |
|-----------|---------|---------|------|
| `vec[i]` | `&T` | Sí (OOB) | O(1) |
| `vec.get(i)` | `Option<&T>` | No | O(1) |
| `vec.push(x)` | `()` | No (puede reasignar) | O(1) amortizado |
| `vec.pop()` | `Option<T>` | No | O(1) |
| `vec.insert(i, x)` | `()` | Sí (OOB) | O(n) |
| `vec.remove(i)` | `T` | Sí (OOB) | O(n) |

### Iteración

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // Iteración inmutable
    for x in &v {
        println!("{x}");
    }
    
    // Iteración mutable
    let mut v = vec![1, 2, 3];
    for x in &mut v {
        *x *= 2;
    }
    
    // Iteración consumiendo
    for x in v { // v es movido
        println!("{x}");
    }
    // println!("{:?}", v); // ERROR: v movido
    
    // Varios adaptadores
    let doubled: Vec<i32> = vec![1, 2, 3].iter().map(|x| x * 2).collect();
    let evens: Vec<&i32> = vec![1, 2, 3, 4].iter().filter(|x| *x % 2 == 0).collect();
    let sum: i32 = vec![1, 2, 3].iter().sum();
}
```

### Capacidad del Vector

```rust
fn main() {
    let mut v = Vec::with_capacity(100);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 0, 100
    
    v.push(1);
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 100
    
    v.shrink_to_fit();
    println!("len: {}, cap: {}", v.len(), v.capacity()); // 1, 1
    
    // Reservar más
    v.reserve(1000);
    println!("cap: {}", v.capacity()); // 1001
}
```

> [!SUCCESS]
> Pre-asigna con `Vec::with_capacity(n)` cuando sepas el tamaño esperado. Esto evita reasignaciones repetidas.

## String — Texto UTF-8

`String` es un `Vec<u8>` que garantiza UTF-8 válido:

```rust
fn main() {
    // Creación
    let mut s = String::new();
    let s1 = String::from("hello");
    let s2 = "world".to_string();
    let s3 = format!("{s1} {s2}");
    
    // Añadir
    s.push('!');        // Carácter único
    s.push_str(" world"); // Porción de string
    
    // Concatenación
    let combined = s1 + &s2; // s1 movido, &s2 prestado
    // println!("{s1}"); // ERROR: movido
    let combined = format!("{} {}", "hello", "world"); // Sin move
    
    // Indexación — NO soportada por índice de char
    // let c = s[0]; // ERROR: String no soporta index
}
```

> [!WARNING]
> Las strings no soportan indexación O(1) porque UTF-8 tiene ancho variable. `s[i]` sería O(n) y podría dividir un carácter. Usa `.chars()` o `.bytes()`.

### Operaciones con String

```rust
fn main() {
    let s = "hello world".to_string();
    
    // Iteración
    for c in s.chars() {         // Grafemas Unicode
        print!("{c} ");
    }
    println!();
    
    for b in s.bytes() {         // Bytes brutos
        print!("{b} ");
    }
    println!();
    
    // Segmentación (¡cuidado!)
    let hello = &s[0..5]; // "hello"
    // let bad = &s[0..4]; // PANICS: no está en límite de char
    
    // Búsqueda y sustitución
    println!("contains 'world': {}", s.contains("world"));
    let replaced = s.replace("world", "Rust");
    println!("{replaced}");
    
    // División
    let words: Vec<&str> = s.split(' ').collect();
    println!("{:?}", words);
    
    // Recorte
    let padded = "  hello  ".to_string();
    println!("'{}'", padded.trim());
}
```

### String vs &str

| Aspecto | `String` | `&str` |
|--------|----------|--------|
| Propiedad | Sí | No (prestado) |
| Mutable | Sí | No |
| Asignada en heap | Sí | Apunta a memoria existente |
| Tamaño | `len()` en bytes | `len()` en bytes |
| Uso en parámetros | Prefiere `&str` | Prefiere `&str` |

### Construyendo Strings Eficientemente

```rust
fn main() {
    // Malo: muchas asignaciones
    let mut s = String::new();
    for i in 0..100 {
        s = s + &i.to_string(); // Nueva asignación cada vez!
    }
    
    // Bueno: pre-asignar
    let mut s = String::with_capacity(300);
    for i in 0..100 {
        s.push_str(&i.to_string());
    }
    
    // Mejor: usar collect
    let s: String = (0..100).map(|i| i.to_string()).collect();
}
```

## HashMap\<K, V\> — Almacenamiento Clave-Valor

```rust
use std::collections::HashMap;

fn main() {
    // Creación
    let mut scores: HashMap<String, i32> = HashMap::new();
    
    // Insertar
    scores.insert(String::from("Alice"), 100);
    scores.insert(String::from("Bob"), 90);
    
    // Acceso
    let alice = scores.get("Alice"); // Some(&100)
    let charlie = scores.get("Charlie"); // None
    
    // Iterar
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
    
    // Verificar existencia
    if scores.contains_key("Alice") {
        println!("Alice is in the map");
    }
    
    // Remover
    scores.remove("Bob");
}
```

### La API Entry

La forma más idiomática de trabajar con HashMaps:

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

| Método Entry | Comportamiento |
|-------------|----------|
| `or_insert(v)` | Inserta v si ausente, retorna &mut V |
| `or_insert_with(fn)` | Inserta resultado de fn() si ausente |
| `or_default()` | Inserta V::default() si ausente |
| `and_modify(fn)` | Modifica valor existente si presente |

### Consejos de Rendimiento para HashMap

```rust
use std::collections::HashMap;

fn main() {
    // Pre-asignar capacidad
    let mut map: HashMap<&str, i32> = HashMap::with_capacity(1000);
    
    // Usar entry API para insertar-o-modificar
    map.entry("key").and_modify(|v| *v += 1).or_insert(1);
    
    // Hasher personalizado (para rendimiento)
    use std::collections::hash_map::RandomState;
    let fast_map: HashMap<&str, i32, RandomState> = HashMap::default();
}
```

## Otras Colecciones Útiles

| Colección | Descripción | Caso de Uso |
|------------|-------------|----------|
| `VecDeque<T>` | Cola doblemente terminada | FIFO, push/pop ambos extremos |
| `LinkedList<T>` | Lista doblemente enlazada | Raro, fragmentación pesada |
| `HashSet<T>` | Conjunto de valores únicos | Desduplicación, pertenencia |
| `BTreeMap<K, V>` | Clave-valor ordenado | Iteración ordenada |
| `BTreeSet<T>` | Conjunto ordenado | Valores únicos ordenados |
| `BinaryHeap<T>` | Cola de prioridad | Max-heap, procesamiento por prioridad |

```rust
use std::collections::{VecDeque, HashSet, BTreeMap, BinaryHeap};

fn main() {
    // VecDeque — cola eficiente
    let mut queue = VecDeque::new();
    queue.push_back(1);
    queue.push_front(0);
    assert_eq!(queue.pop_front(), Some(0));
    
    // HashSet — prueba rápida de pertenencia
    let mut seen = HashSet::new();
    seen.insert("hello");
    assert!(seen.contains("hello"));
    
    // BTreeMap — claves ordenadas
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
    assert_eq!(heap.pop(), Some(5)); // Mayor primero
}
```

## Ejemplo Real: Analizador de Frecuencia de Palabras

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

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `Vec::new()` y `vec![]`?
2. ¿Cómo acceder seguramente a un elemento de vector sin panic?
3. ¿Qué es la capacidad de un vector y por qué importa?
4. ¿Por qué `String` no soporta indexación por posición de carácter?
5. ¿Cómo iterar sobre los caracteres de una String?
6. ¿Cuándo usar `&str` vs `String` en parámetros de función?
7. ¿Qué proporciona la API Entry que insert directo no proporciona?
8. ¿Cómo actualizar un valor en un HashMap si existe, o insertar si no existe?
9. ¿Qué colección usarías para una cola de prioridad?
10. ¿Cómo pre-asignar un HashMap para mejor rendimiento?
