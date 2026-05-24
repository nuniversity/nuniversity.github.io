---
title: "Declarative Macros (macro_rules!)"
description: "Master Rust macros with macro_rules!, repetition patterns, designators, hygiene, and building reusable DSLs"
order: 7
duration: "90 minutes"
difficulty: advanced
---

# Declarative Macros (macro_rules!)

Declarative macros (aka "macros by example") allow you to write code that writes code. They match against Rust syntax patterns and generate new code at compile time.

## Basic Macro Syntax

```rust
macro_rules! say_hello {
    // Pattern => expansion
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();
    say_hello!(); // Can be called multiple times
}
```

### Macro Expansion

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
    foo(); // prints: Function "foo" was called
    bar(); // prints: Function "bar" was called
}
```

> [!NOTE]
> Macros are expanded at compile time. They can only do things the compiler can — they can't access runtime values.

## Designators

Designators tell the compiler what kind of syntax to match:

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

| Designator | Matches | Example |
|------------|---------|---------|
| `expr` | Expression | `42`, `x + 1`, `foo()` |
| `ident` | Identifier | `foo`, `my_variable`, `MyType` |
| `ty` | Type | `i32`, <code>Vec&lt;String&gt;</code>, `&str` |
| `pat` | Pattern | `Some(x)`, `1..=5` |
| `stmt` | Statement | `let x = 5;` |
| `block` | Block | `{ foo(); bar(); }` |
| `item` | Item | `fn`, `struct`, `impl` |
| `meta` | Attribute contents | `inline`, `foo = "bar"` |
| `lifetime` | Lifetime | `'a`, `'static` |
| `literal` | Literal | `42`, `"hello"`, `3.14` |
| `tt` | Token tree | Any single token or group |

## Repetition

Macros use `$(...),*` and `$(...),+` for repetition:

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
    let v = vec![1, 2, 3]; // Our custom vec!
    let m = make_map!("a" => 1, "b" => 2);
    
    println!("{:?}", v);
    println!("{:?}", m);
}
```

| Repetition | Meaning |
|------------|---------|
| `$()` | Body to repeat |
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one |
| Separator | `$(x),*` — comma-separated |

### Repetition with Multiple Patterns

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

## Recursive Macros

```rust
macro_rules! sum {
    // Base case: single expression
    ($x:expr) => ($x);
    
    // Recursive case
    ($x:expr, $($rest:expr),+) => ($x + sum!($($rest),+));
}

// A more useful recursive macro
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
    // Not fully implemented — just demonstrating recursion
}
```

## Hygiene

Rust macros are **hygienic** — they can't accidentally capture or shadow variables from the calling scope:

```rust
macro_rules! make_local {
    () => {
        let x = 42; // This 'x' is in a different syntax context
    };
}

fn main() {
    let x = 10;
    make_local!();
    println!("{x}"); // Still 10 — macro's x doesn't shadow
}
```

### Breaking Hygiene

Sometimes you need to break hygiene to access external variables:

```rust
macro_rules! set_to_42 {
    () => {
        // Won't work — hygienic
        // $x = 42;
    };
}

// Use $crate for escaping hygiene
macro_rules! with_crate {
    () => {
        // $crate refers to the crate where the macro was defined
        let x = $crate::SOME_CONST;
    };
}

const SOME_CONST: i32 = 100;

fn main() {
    with_crate!();
    // println!("{x}"); // still hygienic
}
```

> [!SUCCESS]
| Feature | Benefit | Pitfall |
|---------|---------|---------|
| Hygiene | No accidental capture | Can't access caller's scope |
| `$crate` | Refers to defining crate | Verbose |
| `ident` concatenation | `concat_idents!` needed | Unstable |

## Common Macro Patterns

```rust
// Builder for error messages
macro_rules! error {
    ($($args:tt)*) => {
        eprintln!("[ERROR] {}", format_args!($($args)*));
    };
}

// Assert with custom message
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

// Lazy initialization
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

## Real-World: Test Macro

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

// A parameterized test macro
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

## Practice Questions

1. What is a declarative macro and when would you use one?
2. What are macro designators and name three examples?
3. How do repetition operators (`*`, `+`, `?`) work in macros?
4. What does macro hygiene mean?
5. How do you break hygiene intentionally?
6. What does `stringify!` do?
7. How do you write a recursive macro?
8. What's the difference between `macro_rules!` and procedural macros?
9. How do you match different input patterns in a single macro?
10. What does `$crate` refer to in a macro?
