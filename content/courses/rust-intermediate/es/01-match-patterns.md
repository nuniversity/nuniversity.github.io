---
title: "Match y Patrones"
description: "Domina la coincidencia de patrones de Rust: literales, rangos, desestructuración, guardias y ergonomía avanzada de match"
order: 1
duration: "45 minutos"
difficulty: "intermedio"
---

# Match y Patrones

La coincidencia de patrones es una de las características más poderosas de Rust. Combina lógica condicional con desestructuración en una única sintaxis expresiva.

## Repaso de Sintaxis de Match

```rust
fn describir_numero(n: i32) -> &'static str {
    match n {
        0 => "cero",
        1 | 2 | 3 => "pequeño",
        4..=10 => "mediano",
        _ if n > 100 => "grande",  // Guardia
        _ => "otro",
    }
}
```

## Tipos de Patrones

### Patrones Literales

Coincide con valores específicos:

```rust
fn es_fin_de_semana(dia: &str) -> bool {
    match dia {
        "sábado" | "domingo" => true,
        _ => false,
    }
}
```

### Patrones de Rango

```rust
fn nota_por_puntuacion(puntos: u8) -> &'static str {
    match puntos {
        90..=100 => "A",
        80..=89 => "B",
        70..=79 => "C",
        60..=69 => "D",
        0..=59 => "F",
    }
}

fn coincidir_char(c: char) -> &'static str {
    match c {
        'a'..='z' => "minúscula",
        'A'..='Z' => "mayúscula",
        '0'..='9' => "dígito",
        _ => "otro",
    }
}
```

> [!NOTE]
| Patrón de Rango | Sintaxis | Ejemplo |
|-----------------|---------|---------|
| Inclusivo | `..=` | `1..=5` coincide con 1,2,3,4,5 |
| Semi-abierto | `..` | `1..5` coincide con 1,2,3,4 (no válido en match, solo en for) |
| Abierto | `..` | `..=5` o `5..` (en match, usa guardias) |

### Patrones de Desestructuración

#### Structs

```rust
struct Punto {
    x: i32,
    y: i32,
}

fn main() {
    let p = Punto { x: 10, y: 20 };
    
    match p {
        Punto { x, y } => println!("({x}, {y})"),
    }
    
    // Desestructuración parcial con ..
    match p {
        Punto { x, .. } => println!("x: {x}"),
    }
    
    // Renombrar campos
    match p {
        Punto { x: a, y: b } => println!("({a}, {b})"),
    }
}
```

#### Enums

```rust
enum Mensaje {
    Salir,
    Mover { x: i32, y: i32 },
    Escribir(String),
    CambiarColor(i32, i32, i32),
}

fn manejar(msg: Mensaje) {
    match msg {
        Mensaje::Salir => println!("salir"),
        Mensaje::Mover { x, y } => println!("mover a ({x}, {y})"),
        Mensaje::Escribir(texto) => println!("{texto}"),
        Mensaje::CambiarColor(r, g, b) => println!("RGB({r}, {g}, {b})"),
    }
}
```

#### Tuplas

```rust
fn describir_punto(p: (i32, i32, i32)) -> &'static str {
    match p {
        (0, 0, 0) => "origen",
        (0, 0, _) => "en el eje z",
        (0, _, _) => "en el plano x=0",
        (_, 0, _) => "en el plano y=0",
        (_, _, 0) => "en el plano z=0",
        _ => "en el espacio",
    }
}
```

#### Arrays y Slices

```rust
fn primero_y_ultimo(arr: &[i32]) -> Option<(&i32, &i32)> {
    match arr {
        [primero, .., ultimo] => Some((primero, ultimo)),
        _ => None,
    }
}

fn suma_dos_primeros(arr: &[i32]) -> i32 {
    match arr {
        [a, b, ..] => a + b,
        [a] => *a,
        [] => 0,
    }
}
```

> [!SUCCESS]
> Los patrones de slice con `..` (patrón de resto) facilitan la coincidencia en la estructura de colecciones. El compilador verifica exhaustividad incluso con patrones complejos.

### Patrones de Guardia

Agrega condiciones extras con `if`:

```rust
fn clasificar_numero(n: i32) -> &'static str {
    match n {
        x if x < 0 => "negativo",
        x if x % 2 == 0 => "positivo par",
        _ => "positivo impar",
    }
}

fn coincidir_par(par: (i32, i32)) -> &'static str {
    match par {
        (x, y) if x == y => "iguales",
        (x, y) if x + y == 0 => "negativos",
        (x, _) if x > 0 => "primero positivo",
        _ => "otro",
    }
}
```

### Enlaces @

Vincula el valor coincidente a un nombre mientras desestructuras:

```rust
fn inspeccionar(valor: Option<i32>) {
    match valor {
        Some(x @ 0..=10) => println!("positivo pequeño: {x}"),
        Some(x @ 11..=100) => println!("positivo mediano: {x}"),
        Some(x) => println!("positivo grande: {x}"),
        None => println!("ninguno"),
    }
}

// Con desestructuración anidada
struct Persona {
    nombre: String,
    edad: u8,
}

fn saludar(persona: Persona) {
    match persona {
        Persona { nombre, edad: edad @ 0..=12 } => {
            println!("Hola {nombre}, tienes {edad} — eres niño!");
        }
        Persona { nombre, edad: edad @ 13..=19 } => {
            println!("Hey {nombre}, tienes {edad} — eres adolescente!");
        }
        Persona { nombre, edad } => {
            println!("Hola {nombre}, tienes {edad}.");
        }
    }
}
```

### Múltiples Patrones con |

```rust
fn es_vocal(c: char) -> bool {
    matches!(c, 'a' | 'e' | 'i' | 'o' | 'u' | 'A' | 'E' | 'I' | 'O' | 'U')
}

fn describir_dia(n: u8) -> &'static str {
    match n {
        1 | 7 => "fin de semana",
        2..=6 => "día laboral",
        _ => "inválido",
    }
}
```

## La Macro matches!

Para verificaciones booleanas simples de patrones:

```rust
fn main() {
    let foo = Some(42);
    assert!(matches!(foo, Some(x) if x > 0));
    
    let arr = [1, 2, 3];
    assert!(matches!(arr, [1, _, _]));
}
```

## Ergonomía de Match

Rust desreferencia automáticamente en patrones de match:

```rust
fn main() {
    let x = &Some(42);
    
    // Sin ergonomía (pre-2018):
    match x {
        &Some(ref y) => println!("{y}"),
        &None => (),
    }
    
    // Con ergonomía (2018+):
    match x {
        Some(y) => println!("{y}"),
        None => (),
    }
}
```

### Patrones Ref

Usa `ref` y `ref mut` para tomar valores prestados:

```rust
fn main() {
    let s = Some(String::from("hola"));
    
    match s {
        Some(ref s) => println!("prestado: {s}"),  // s es &String
        None => (),
    }
    
    println!("aún poseído: {:?}", s); // s no fue movido
    
    let mut t = Some(String::from("mundo"));
    match t {
        Some(ref mut s) => *s = String::from("cambiado"),
        None => (),
    }
    println!("{:?}", t); // Some("cambiado")
}
```

## Coincidencia de Patrones en Otros Contextos

### Declaraciones let

```rust
let (x, y, z) = (1, 2, 3);
let Punto { x: a, y: b } = Punto { x: 10, y: 20 };
```

### Parámetros de Función

```rust
fn imprimir_coordenadas(&(x, y): &(i32, i32)) {
    println!("({x}, {y})");
}

fn sumar_coordenadas(Punto { x, y }: &Punto) -> i32 {
    x + y
}
```

### if let / while let

```rust
fn main() {
    let mut pila = vec![1, 2, 3];
    while let Some(tope) = pila.pop() {
        println!("{tope}");
    }
    
    let coords = (0, 5);
    if let (0, y) = coords {
        println!("en el eje y en {y}");
    }
}
```

### for loops

```rust
fn main() {
    let pares = [(1, 2), (3, 4), (5, 6)];
    for (a, b) in &pares {
        println!("{a} + {b} = {}", a + b);
    }
    
    let mapa = std::collections::HashMap::from([("a", 1), ("b", 2)]);
    for (clave, valor) in &mapa {
        println!("{clave}: {valor}");
    }
}
```

## Coincidencia de Tipos de Referencia y Puntero

```rust
fn main() {
    let x = 42;
    let y = &x;
    let z = Box::new(x);
    
    match y {
        42 => println!("coincide con el valor (auto-deref)"),
        _ => println!("sin coincidencia"),
    }
    
    match &z {
        42 => println!("Box también coincide"),
        _ => println!("sin coincidencia"),
    }
}
```

## Mundo Real: Evaluador de Expresiones

```rust
#[derive(Debug)]
enum Expr {
    Lit(i32),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

fn evaluar(expr: &Expr) -> Option<i32> {
    match expr {
        Expr::Lit(n) => Some(*n),
        Expr::Add(l, r) => Some(evaluar(l)? + evaluar(r)?),
        Expr::Sub(l, r) => Some(evaluar(l)? - evaluar(r)?),
        Expr::Mul(l, r) => Some(evaluar(l)? * evaluar(r)?),
        Expr::Div(l, r) => {
            let r_val = evaluar(r)?;
            if r_val == 0 {
                None
            } else {
                Some(evaluar(l)? / r_val)
            }
        }
    }
}

fn main() {
    let expr = Expr::Add(
        Box::new(Expr::Lit(10)),
        Box::new(Expr::Mul(
            Box::new(Expr::Lit(3)),
            Box::new(Expr::Lit(5)),
        )),
    );
    println!("{:?}", evaluar(&expr)); // Some(25)
}
```

## Preguntas de Práctica

1. ¿Qué significa el patrón `..` al desestructurar un struct?
2. ¿Cómo coincidir un rango de valores en match?
3. ¿Cuál es la diferencia entre `|` y `..=` en patrones?
4. ¿Cuándo usarías una guardia de match en lugar de un match anidado?
5. ¿Qué hace el enlace `@`?
6. ¿Cómo difiere la coincidencia de patrones en `if let` de `match`?
7. ¿Qué son los patrones ref y cuándo se necesitan?
8. ¿Cómo simplifica la macro `matches!` la coincidencia de patrones?
9. ¿Puedes desestructurar un slice con patrones? Da un ejemplo.
10. ¿Cómo maneja Rust la desreferenciación automática en patrones de match?
