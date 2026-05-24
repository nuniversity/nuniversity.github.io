---
title: "Macros Declarativas (macro_rules!)"
description: "Domine las macros de Rust con macro_rules!, patrones de repetición, designadores, higiene y construcción de DSLs reutilizables"
order: 7
duration: "90 minutos"
difficulty: advanced
---

# Macros Declarativas (macro_rules!)

Las macros declarativas (también conocidas como "macros by example") permiten escribir código que escribe código. Coinciden con patrones de sintaxis Rust y generan nuevo código en tiempo de compilación.

## Sintaxis Básica de Macro

```rust
macro_rules! say_hello {
    // Patrón => expansión
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();
    say_hello!(); // Puede llamarse múltiples veces
}
```

### Expansión de Macro

```rust
macro_rules! create_function {
    ($name:ident) => {
        fn $name() {
            println!("Function {:?} was called", stringify!($name));
        }
    };
}

create_function!(foo);
create_function!(bar);

fn main() {
    foo(); // imprime: Function "foo" was called
    bar(); // imprime: Function "bar" was called
}
```

> [!NOTE]
> Las macros se expanden en tiempo de compilación. Solo pueden hacer cosas que el compilador puede — no pueden acceder a valores en tiempo de ejecución.

## Designadores

Los designadores informan al compilador qué tipo de sintaxis coincidir:

```rust
macro_rules! print_value {
    ($x:expr) => {
        println!("expr: {}", $x);
    };
    ($x:ident) => {
        println!("ident: {}", stringify!($x));
    };
    ($x:ty) => {
        println!("type: {}", stringify!($x));
    };
}

fn main() {
    print_value!(42);      // expr: 42
    print_value!(foo);     // ident: foo
    print_value!(i32);     // type: i32
}
```

| Designador | Coincide con | Ejemplo |
|------------|---------|---------|
| `expr` | Expresión | `42`, `x + 1`, `foo()` |
| `ident` | Identificador | `foo`, `my_variable`, `MyType` |
| `ty` | Tipo | `i32`, <code>Vec&lt;String&gt;</code>, `&str` |
| `pat` | Patrón | `Some(x)`, `1..=5` |
| `stmt` | Sentencia | `let x = 5;` |
| `block` | Bloque | `{ foo(); bar(); }` |
| `item` | Elemento | `fn`, `struct`, `impl` |
| `meta` | Contenido de atributo | `inline`, `foo = "bar"` |
| `lifetime` | Lifetime | `'a`, `'static` |
| `literal` | Literal | `42`, `"hello"`, `3.14` |
| `tt` | Árbol de token | Cualquier token o grupo |

## Repetición

Las macros usan `$(...),*` y `$(...),+` para repetición:

```rust
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}

macro_rules! make_map {
    ( $( $key:expr => $val:expr ),* $(,)? ) => {
        {
            let mut map = std::collections::HashMap::new();
            $(
                map.insert($key, $val);
            )*
            map
        }
    };
}

fn main() {
    let v = vec![1, 2, 3]; // Nuestro vec! personalizado
    let m = make_map!("a" => 1, "b" => 2);
    
    println!("{:?}", v);
    println!("{:?}", m);
}
```

| Repetición | Significado |
|------------|---------|
| `$()` | Cuerpo a repetir |
| `*` | Cero o más |
| `+` | Uno o más |
| `?` | Cero o uno |
| Separador | `$(x),*` — separado por coma |

### Repetición con Múltiples Patrones

```rust
macro_rules! repeat {
    ( $( $x:expr ),+ ; $( $y:expr ),+ ) => {
        $(
            println!("x: {}", $x);
        )*
        $(
            println!("y: {}", $y);
        )*
    };
}

macro_rules! zip {
    ( $( $key:expr ),+ ; $( $val:expr ),+ ) => {
        vec![ $( ($key, $val) ),* ]
    };
}

fn main() {
    repeat!(1, 2, 3; "a", "b", "c");
    let zipped = zip!(1, 2, 3; "a", "b", "c");
    println!("{:?}", zipped); // [(1, "a"), (2, "b"), (3, "c")]
}
```

## Macros Recursivas

```rust
macro_rules! sum {
    // Caso base: expresión única
    ($x:expr) => ($x);
    
    // Caso recursivo
    ($x:expr, $($rest:expr),+) => ($x + sum!($($rest),+));
}

// Una macro recursiva más útil
macro_rules! json {
    (null) => { serde_json::Value::Null };
    (true) => { serde_json::Value::Bool(true) };
    (false) => { serde_json::Value::Bool(false) };
    ($val:expr) => {
        serde_json::to_value(&$val).unwrap()
    };
    ([ $( $inner:expr ),* $(,)? ]) => {
        serde_json::Value::Array(vec![ $( json!($inner) ),* ])
    };
}

fn main() {
    println!("sum: {}", sum!(1, 2, 3, 4, 5)); // 15
    
    let data = json!({
        "name": "Alice",
        "scores": [1, 2, 3]
    });
    // No completamente implementado — solo demostrando recursión
}
```

## Higiene

Las macros de Rust son **higiénicas** — no pueden accidentalmente capturar o sombrear variables del ámbito de llamada:

```rust
macro_rules! make_local {
    () => {
        let x = 42; // Esta 'x' está en un contexto de sintaxis diferente
    };
}

fn main() {
    let x = 10;
    make_local!();
    println!("{x}"); // Sigue siendo 10 — la x de la macro no sombrea
}
```

### Rompiendo la Higiene

A veces necesitas romper la higiene para acceder a variables externas:

```rust
macro_rules! set_to_42 {
    () => {
        // No funciona — higiénico
        // $x = 42;
    };
}

// Usa $crate para escapar de la higiene
macro_rules! with_crate {
    () => {
        // $crate se refiere al crate donde se definió la macro
        let x = $crate::SOME_CONST;
    };
}

const SOME_CONST: i32 = 100;

fn main() {
    with_crate!();
    // println!("{x}"); // todavía higiénico
}
```

> [!SUCCESS]
| Característica | Beneficio | Problema |
|---------|---------|---------|
| Higiene | Sin captura accidental | No puede acceder al ámbito del llamante |
| `$crate` | Se refiere al crate definidor | Verboso |
| Concatenación de `ident` | `concat_idents!` necesario | Inestable |

## Patrones Comunes de Macro

```rust
// Builder para mensajes de error
macro_rules! error {
    ($($args:tt)*) => {
        eprintln!("[ERROR] {}", format_args!($($args)*));
    };
}

// Assert con mensaje personalizado
macro_rules! assert_approx_eq {
    ($a:expr, $b:expr) => {{
        let (a, b) = (&$a, &$b);
        assert!(
            (*a - *b).abs() < 1e-6,
            "assertion failed: `(left ≈ right)`\n  left: `{:?}`,\n right: `{:?}`",
            *a, *b
        );
    }};
}

// Inicialización lazy
macro_rules! lazy_static {
    ($name:ident: $ty:ty = $init:expr) => {
        std::lazy::SyncLazy::new(|| -> $ty { $init })
    };
}

fn main() {
    error!("something went wrong: {}", 42);
    
    let a = 1.0000001;
    let b = 1.0;
    assert_approx_eq!(a, b);
    
    let config = lazy_static!(CONFIG: String = String::from("default"));
}
```

## Ejemplo Real: Macro de Prueba

```rust
macro_rules! test_suite {
    ( $( $name:ident: $body:block ),+ $(,)? ) => {
        $(
            #[test]
            fn $name() {
                $body
            }
        )*
    };
}

test_suite! {
    test_add: {
        assert_eq!(2 + 2, 4);
    },
    test_sub: {
        assert_eq!(5 - 3, 2);
    },
    test_mul: {
        assert_eq!(3 * 4, 12);
    },
}

// Una macro de prueba parametrizada
macro_rules! param_test {
    ($name:ident, $cases:expr, $test:expr) => {
        #[test]
        fn $name() {
            for (input, expected) in $cases {
                assert_eq!(($test)(input), expected);
            }
        }
    };
}

fn double(x: i32) -> i32 { x * 2 }

param_test!(test_double, [(1, 2), (2, 4), (5, 10)], double);
```

## Preguntas de Práctica

1. ¿Qué es una macro declarativa y cuándo usar una?
2. ¿Qué son los designadores de macro y menciona tres ejemplos?
3. ¿Cómo funcionan los operadores de repetición (`*`, `+`, `?`) en macros?
4. ¿Qué significa higiene de macro?
5. ¿Cómo romper la higiene intencionalmente?
6. ¿Qué hace `stringify!`?
7. ¿Cómo escribir una macro recursiva?
8. ¿Cuál es la diferencia entre `macro_rules!` y las macros procedurales?
9. ¿Cómo coincidir diferentes patrones de entrada en una sola macro?
10. ¿A qué se refiere `$crate` en una macro?
