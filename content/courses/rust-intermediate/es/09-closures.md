---
title: "Closures"
description: "Domine los closures en Rust: sintaxis, modos de captura (Fn, FnMut, FnOnce), semántica move y patrones"
order: 9
duration: "45 minutos"
difficulty: "intermedio"
---

# Closures

Los closures son funciones anónimas que pueden capturar variables de su entorno. El sistema de closures de Rust es flexible y eficiente — los closures se compilan a structs simples.

## Sintaxis de Closure

```rust
fn main() {
    // Sintaxis completa
    let add_one = |x: i32| -> i32 { x + 1 };
    
    // Inferencia de tipo
    let add_two = |x| x + 2;
    
    // Cuerpo con bloque
    let complex = |x: i32| {
        let y = x * 2;
        y + 1
    };
    
    // Sin parámetros
    let hello = || println!("hello");
    
    // Múltiples parámetros
    let add = |a: i32, b: i32| a + b;
    
    println!("{}", add_one(5));  // 6
    println!("{}", add_two(5));  // 7
}
```

> [!NOTE]
| Patrón | Sintaxis | Ejemplo |
|---------|--------|---------|
| Sin params | `|| expr` | `|| 42` |
| Un param | `|x| expr` | `|x| x + 1` |
| Params tipados | `|x: i32| -> i32` | `|x: i32| -> i32 { x + 1 }` |
| Cuerpo con bloque | `\|x\| { stmt; expr }` | `|x| { let y = x; y }` |

## Modos de Captura

Los closures capturan variables de su ámbito circundante. El compilador elige el modo de captura menos restrictivo:

### FnOnce — Consume valores capturados

```rust
fn main() {
    let s = String::from("hello");
    
    let consume = || {
        drop(s);  // s se mueve dentro del closure
    };
    
    consume();
    // consume(); // ERROR: el closure no se puede llamar dos veces
    // println!("{s}"); // ERROR: s fue movido
}
```

> [!WARNING]
> Los closures `FnOnce` solo se pueden llamar una vez porque consumen valores capturados. Implementan `FnOnce`, pero no `Fn` o `FnMut`.

### FnMut — Toma prestado mutablemente

```rust
fn main() {
    let mut count = 0;
    
    let mut increment = || {
        count += 1;  // Toma prestado count mutablemente
    };
    
    increment();
    increment();
    println!("{count}"); // 2
    
    // let shared = &count; // ERROR: no se puede tomar prestado mientras está prestado mutablemente
    // increment(); // Funcionaría si shared no se usara
}
```

### Fn — Toma prestado inmutablemente

```rust
fn main() {
    let prefix = String::from("Hello, ");
    
    let greet = |name: &str| {
        println!("{prefix}{name}");  // Toma prestado prefix inmutablemente
    };
    
    greet("Alice");
    greet("Bob");
    println!("prefix: {prefix}"); // Todavía accesible
}
```

| Trait | Captura | Invocable | Usado Para |
|-------|---------|----------|----------|
| `Fn` | Por referencia | Múltiples veces | Acceso solo lectura |
| `FnMut` | Por ref mutable | Múltiples veces | Mutación de estado |
| `FnOnce` | Por valor (move) | Una vez | Consumir valores |

> [!SUCCESS]
> Los closures intentan capturar por el modo menos restrictivo. Si un closure solo lee, es `Fn`. Si escribe, es `FnMut`. Si mueve hacia fuera, es `FnOnce`.

## La Palabra clave move

Fuerza al closure a tomar propiedad de las variables capturadas:

```rust
fn main() {
    let data = vec![1, 2, 3];
    
    // Sin move: el closure toma prestado data
    let borrow = || println!("{:?}", data);
    
    // Con move: el closure toma propiedad
    let owned = move || println!("{:?}", data);
    // println!("{:?}", data); // ERROR: data movido
    
    // Necesario para crear hilos
    let nums = vec![1, 2, 3];
    std::thread::spawn(move || {
        println!("{:?}", nums); // nums movido al hilo
    }).join().unwrap();
}
```

### Cuándo move es Necesario

```rust
use std::thread;

fn main() {
    let message = String::from("hello from thread");
    
    // ERROR: el closure puede sobrevivir a la función actual
    // thread::spawn(|| {
    //     println!("{message}");
    // });
    
    // Corrección: mover propiedad al closure
    thread::spawn(move || {
        println!("{message}");
    }).join().unwrap();
}
```

## Closures como Argumentos

```rust
// Función que recibe un closure
fn apply<F>(f: F, x: i32) -> i32
where
    F: Fn(i32) -> i32,
{
    f(x)
}

// Con FnMut
fn apply_mut<F>(mut f: F, x: i32) -> i32
where
    F: FnMut(i32) -> i32,
{
    f(x)
}

// Con FnOnce
fn apply_once<F>(f: F, x: i32) -> i32
where
    F: FnOnce(i32) -> i32,
{
    f(x)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5)); // 10
    
    let mut total = 0;
    let add_to_total = |x| { total += x; total };
    println!("{}", apply_mut(add_to_total, 5)); // 5
}
```

## Closures como Valores de Retorno

```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y  // Debe capturar por valor
}

fn make_counter() -> impl FnMut() -> i32 {
    let mut count = 0;
    move || { count += 1; count }
}

fn main() {
    let add_five = make_adder(5);
    println!("{}", add_five(3)); // 8
    
    let mut counter = make_counter();
    println!("{}", counter()); // 1
    println!("{}", counter()); // 2
}
```

> [!WARNING]
> Al retornar closures, usa `move` para capturar por valor. De lo contrario, el closure toma prestadas variables locales que salen de ámbito.

## Closures e Iteradores

Los closures son la base de los adaptadores de iterador:

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // Closure en map
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    // Closure en filter
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    
    // Closure con variable capturada
    let threshold = 3;
    let above: Vec<&i32> = numbers.iter().filter(|x| **x > threshold).collect();
    
    // Closure en fold
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    
    println!("{doubled:?} {evens:?} {above:?} {sum}");
}
```

## Comparando Closures y Funciones

```rust
fn add_one(x: i32) -> i32 { x + 1 }

fn main() {
    let closure = |x| x + 1;
    let closure_annotated = |x: i32| -> i32 { x + 1 };
    
    // Las funciones se coercionan a closures
    let mapped: Vec<i32> = vec![1, 2, 3].iter().map(add_one).collect();
    let mapped2: Vec<i32> = vec![1, 2, 3].iter().map(|x| x + 1).collect();
    
    // Punteros de función
    let fp: fn(i32) -> i32 = add_one;
    let fp_caller: fn(i32) -> i32 = |x| x + 1; // No captura
    
    // Closure con captura — NO es un puntero de función
    let y = 5;
    let captures = |x| x + y; // No puede coercionarse a fn pointer
}
```

| Tipo | ¿Captura? | Tamaño | Caso de Uso |
|------|-----------|------|----------|
| `fn(i32) -> i32` | No | Puntero | APIs de callback |
| `impl Fn(i32) -> i32` | Sí | Tamaño del closure | Funciones genéricas |
| `Box<dyn Fn(i32) -> i32>` | Sí | Asignado en heap | Dispatch dinámico |

## Ejemplo Real: Constructor de Configuración

```rust
struct Config {
    transformers: Vec<Box<dyn Fn(String) -> String>>,
}

impl Config {
    fn new() -> Self {
        Config { transformers: Vec::new() }
    }
    
    fn add<F>(&mut self, f: F)
    where
        F: Fn(String) -> String + 'static,
    {
        self.transformers.push(Box::new(f));
    }
    
    fn process(&self, input: String) -> String {
        self.transformers.iter().fold(input, |acc, f| f(acc))
    }
}

fn main() {
    let mut config = Config::new();
    
    let prefix = "LOG: ".to_string();
    config.add(move |s| format!("{prefix}{s}"));
    config.add(|s| s.to_uppercase());
    config.add(|s| s.trim().to_string());
    
    let result = config.process("  hello world  ".to_string());
    println!("{result}"); // "LOG:   HELLO WORLD  "
}
```

## Preguntas de Práctica

1. ¿Cuáles son los tres traits de closure en Rust?
2. ¿Cómo decide el compilador qué trait implementa un closure?
3. ¿Qué hace la palabra clave `move` para closures?
4. ¿Cuándo es necesario `move` en un closure?
5. ¿Cómo aceptar un closure como parámetro de función?
6. ¿Cómo retornar un closure de una función?
7. ¿Cuál es la diferencia entre `fn` (puntero de función) y `Fn` (trait de closure)?
8. ¿Por qué los closures que capturan variables no pueden coercionarse a punteros de función?
9. ¿Qué sucede si llamas a un closure FnOnce dos veces?
10. ¿Cómo funcionan los closures con adaptadores de iterador como `map` y `filter`?
