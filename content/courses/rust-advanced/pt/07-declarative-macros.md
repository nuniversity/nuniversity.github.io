---
title: "Macros Declarativas (macro_rules!)"
description: "Domine macros Rust com macro_rules!, padrões de repetição, designadores, higiene e construção de DSLs reutilizáveis"
order: 7
duration: "90 minutos"
difficulty: advanced
---

# Macros Declarativas (macro_rules!)

Macros declarativas (também conhecidas como "macros by example") permitem escrever código que escreve código. Elas correspondem a padrões de sintaxe Rust e geram novo código em tempo de compilação.

## Sintaxe Básica de Macro

```rust
macro_rules! say_hello {
    // Padrão => expansão
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();
    say_hello!(); // Pode ser chamado múltiplas vezes
}
```

### Expansão de Macro

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
> Macros são expandidas em tempo de compilação. Elas só podem fazer coisas que o compilador pode — não podem acessar valores em tempo de execução.

## Designadores

Designadores informam ao compilador que tipo de sintaxe corresponder:

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

| Designador | Corresponde a | Exemplo |
|------------|---------|---------|
| `expr` | Expressão | `42`, `x + 1`, `foo()` |
| `ident` | Identificador | `foo`, `my_variable`, `MyType` |
| `ty` | Tipo | `i32`, <code>Vec&lt;String&gt;</code>, `&str` |
| `pat` | Padrão | `Some(x)`, `1..=5` |
| `stmt` | Statement | `let x = 5;` |
| `block` | Bloco | `{ foo(); bar(); }` |
| `item` | Item | `fn`, `struct`, `impl` |
| `meta` | Conteúdo de atributo | `inline`, `foo = "bar"` |
| `lifetime` | Lifetime | `'a`, `'static` |
| `literal` | Literal | `42`, `"hello"`, `3.14` |
| `tt` | Árvore de token | Qualquer token ou grupo |

## Repetição

Macros usam `$(...),*` e `$(...),+` para repetição:

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
    let v = vec![1, 2, 3]; // Nosso vec! personalizado
    let m = make_map!("a" => 1, "b" => 2);
    
    println!("{:?}", v);
    println!("{:?}", m);
}
```

| Repetição | Significado |
|------------|---------|
| `$()` | Corpo a repetir |
| `*` | Zero ou mais |
| `+` | Um ou mais |
| `?` | Zero ou um |
| Separador | `$(x),*` — separado por vírgula |

### Repetição com Múltiplos Padrões

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
    // Caso base: expressão única
    ($x:expr) => ($x);
    
    // Caso recursivo
    ($x:expr, $($rest:expr),+) => ($x + sum!($($rest),+));
}

// Uma macro recursiva mais útil
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
    // Não totalmente implementado — apenas demonstrando recursão
}
```

## Higiene

Macros Rust são **higiênicas** — elas não podem acidentalmente capturar ou sombrear variáveis do escopo de chamada:

```rust
macro_rules! make_local {
    () => {
        let x = 42; // Este 'x' está em um contexto de sintaxe diferente
    };
}

fn main() {
    let x = 10;
    make_local!();
    println!("{x}"); // Ainda 10 — o x da macro não sombreia
}
```

### Quebrando a Higiene

Às vezes você precisa quebrar a higiene para acessar variáveis externas:

```rust
macro_rules! set_to_42 {
    () => {
        // Não funciona — higiênico
        // $x = 42;
    };
}

// Use $crate para escapar da higiene
macro_rules! with_crate {
    () => {
        // $crate refere-se à crate onde a macro foi definida
        let x = $crate::SOME_CONST;
    };
}

const SOME_CONST: i32 = 100;

fn main() {
    with_crate!();
    // println!("{x}"); // ainda higiênico
}
```

> [!SUCCESS]
| Característica | Benefício | Problema |
|---------|---------|---------|
| Higiene | Sem captura acidental | Não pode acessar escopo do chamador |
| `$crate` | Refere-se à crate definidora | Verboso |
| Concatenação de `ident` | `concat_idents!` necessário | Instável |

## Padrões Comuns de Macro

```rust
// Builder para mensagens de erro
macro_rules! error {
    ($($args:tt)*) => {
        eprintln!("[ERROR] {}", format_args!($($args)*));
    };
}

// Assert com mensagem personalizada
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

// Inicialização lazy
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

## Exemplo Real: Macro de Teste

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

// Uma macro de teste parametrizado
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

## Perguntas de Prática

1. O que é uma macro declarativa e quando usar uma?
2. O que são designadores de macro e cite três exemplos?
3. Como operadores de repetição (`*`, `+`, `?`) funcionam em macros?
4. O que significa higiene de macro?
5. Como quebrar a higiene intencionalmente?
6. O que `stringify!` faz?
7. Como escrever uma macro recursiva?
8. Qual é a diferença entre `macro_rules!` e macros procedurais?
9. Como corresponder diferentes padrões de entrada em uma única macro?
10. A que `$crate` se refere em uma macro?
