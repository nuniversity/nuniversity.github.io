---
title: "Structs y Enums"
description: "Define tipos de datos personalizados con structs, enums, Option y Result para código seguro y expresivo"
order: 8
duration: "30 minutos"
difficulty: "principiante"
---

# Structs y Enums

Los structs y enums permiten crear tipos personalizados que modelan tu dominio con precisión. Son la base del diseño orientado a tipos de Rust.

## Definiendo Structs

Un `struct` agrupa datos relacionados en un tipo:

```rust
struct Usuario {
    activo: bool,
    nombre: String,
    email: String,
    contador_login: u64,
}

fn main() {
    let usuario = Usuario {
        activo: true,
        nombre: String::from("alice"),
        email: String::from("alice@ejemplo.com"),
        contador_login: 1,
    };
    
    println!("{}", usuario.email);
}
```

> [!NOTE]
> Los campos de struct son privados por defecto al módulo en que se definen. Usa `pub` para hacerlos públicos (cubierto en módulos).

### Structs Mutables

```rust
fn main() {
    let mut usuario = Usuario {
        activo: true,
        nombre: String::from("alice"),
        email: String::from("alice@ejemplo.com"),
        contador_login: 1,
    };
    
    usuario.email = String::from("alice@nuevodominio.com");
}
```

> [!WARNING]
> La mutabilidad se aplica a toda la instancia del struct, no a campos individuales. No puedes tener algunos campos mutables y otros inmutables (a menos que uses mutabilidad interior via `Cell`/`RefCell`).

### Atajo de Inicialización de Campos

```rust
fn construir_usuario(email: String, nombre: String) -> Usuario {
    Usuario {
        activo: true,
        nombre, // atajo: campo = variable con mismo nombre
        email,
        contador_login: 1,
    }
}
```

### Sintaxis de Actualización de Struct

```rust
fn main() {
    let usuario1 = Usuario {
        email: String::from("alice@ejemplo.com"),
        nombre: String::from("alice"),
        activo: true,
        contador_login: 1,
    };
    
    let usuario2 = Usuario {
        email: String::from("bob@ejemplo.com"),
        ..usuario1 // Rellenar campos restantes de usuario1
    };
    // Nota: nombre y email fueron movidos (String), usuario1 ya no es válido
}
```

## Tuple Structs

Tuplas nombradas con nombres de campos:

```rust
struct Color(i32, i32, i32);
struct Punto(i32, i32, i32);

fn main() {
    let negro = Color(0, 0, 0);
    let origen = Punto(0, 0, 0);
    
    // Tipos diferentes aunque tengan los mismos campos
    // negro = origen; // ERROR: tipos incompatibles
    
    // Desestructurar
    let Color(r, g, b) = negro;
    println!("{r} {g} {b}");
}
```

## Unit Structs

Structs sin campos (como el tipo unitario `()`):

```rust
struct SiempreIgual;

fn main() {
    let sujeto = SiempreIgual;
}
```

Útil para:
- Tipos marcadores (implementando traits en ellos)
- Estados de máquina de estados sin datos

## Enums

Un enum representa datos que pueden ser una de varias variantes:

```rust
enum TipoIp {
    V4,
    V6,
}

fn main() {
    let cuatro = TipoIp::V4;
    let seis = TipoIp::V6;
    
    enrutar(cuatro);
    enrutar(seis);
    enrutar(TipoIp::V4);
}

fn enrutar(tipo_ip: TipoIp) {}
```

### Enums con Datos

```rust
enum IpAddr {
    V4(String),  // Cada variante puede contener datos
    V6(String),
}

fn main() {
    let casa = IpAddr::V4(String::from("127.0.0.1"));
    let loopback = IpAddr::V6(String::from("::1"));
}
```

### Enums con Datos Diferentes por Variante

```rust
enum Mensaje {
    Salir,                           // Sin datos
    Mover { x: i32, y: i32 },       // Campos nombrados (como struct)
    Escribir(String),               // Variante tupla
    CambiarColor(i32, i32, i32),    // Variante tupla
}

impl Mensaje {
    fn llamar(&self) {
        match self {
            Mensaje::Salir => println!("Saliendo"),
            Mensaje::Mover { x, y } => println!("Mover a ({x}, {y})"),
            Mensaje::Escribir(texto) => println!("{texto}"),
            Mensaje::CambiarColor(r, g, b) => println!("Color RGB({r}, {g}, {b})"),
        }
    }
}
```

> [!SUCCESS]
| Struct vs Enum | Usa Cuando |
|----------------|-----------|
| Struct | Los datos siempre tienen todos los campos |
| Enum | Los datos pueden ser una de varias formas |
| Enum con datos | Cada variante lleva datos diferentes |

## Option — Manejo Seguro de Null

Rust no tiene `null`. En su lugar, usa `Option<T>`:

```rust
enum Option<T> {
    Some(T),
    None,
}

fn main() {
    let algun_numero = Some(5);       // Option<i32>
    let algun_char = Some('a');       // Option<char>
    let numero_ausente: Option<i32> = None; // Debe especificar tipo
    
    // Option<T> y T son tipos diferentes
    let x: i32 = 5;
    let y: Option<i32> = Some(10);
    // let suma = x + y; // ERROR: no puede sumar i32 y Option<i32>
    
    // Debe extraer el valor primero
    let suma = x + y.unwrap_or(0);
    println!("{suma}");
}
```

### Métodos Comunes de Option

| Método | Propósito | Devuelve |
|--------|-----------|----------|
| `unwrap()` | Obtener valor o entrar en pánico | `T` |
| `unwrap_or(default)` | Obtener valor o default | `T` |
| `unwrap_or_else(fn)` | Obtener valor o llamar fn | `T` |
| `is_some()` | Verificar si es Some | `bool` |
| `is_none()` | Verificar si es None | `bool` |
| `map(fn)` | Transformar valor Some | `Option<U>` |
| `expect(msg)` | Desenvolver con mensaje de pánico personalizado | `T` |

## Result — Manejo de Errores

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Usado para operaciones que pueden fallar:

```rust
use std::fs::File;

fn main() {
    let resultado_archivo = File::open("hola.txt");
    
    let archivo = match resultado_archivo {
        Ok(f) => f,
        Err(e) => panic!("Fallo al abrir archivo: {e}"),
    };
}
```

| Aspecto | `Option<T>` | `Result<T, E>` |
|---------|-------------|----------------|
| Significado | Valor puede estar ausente | Operación puede fallar |
| Éxito | `Some(T)` | `Ok(T)` |
| Fracaso | `None` | `Err(E)` |
| Información de error | No | Sí (el tipo `E`) |

## Coincidencia de Patrones con Enums

```rust
enum Estado {
    Activo,
    Inactivo,
    Pendiente { desde: String },
}

fn describir(estado: Estado) -> String {
    match estado {
        Estado::Activo => String::from("activo"),
        Estado::Inactivo => String::from("inactivo"),
        Estado::Pendiente { desde } => format!("pendiente desde {desde}"),
    }
}
```

## if let / while let con Enums

```rust
fn main() {
    let mut pila = Vec::new();
    pila.push(1);
    pila.push(2);
    pila.push(3);
    
    while let Some(tope) = pila.pop() {
        println!("{tope}");
    }
    
    // Desestructurar variantes de enum
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("max: {max}");
    }
}
```

## Mundo Real: Máquina de Estados

```rust
#[derive(Debug)]
enum EstadoPedido {
    Nuevo,
    Pagado,
    Enviado { seguimiento: String },
    Entregado,
    Cancelado { motivo: String },
}

impl EstadoPedido {
    fn transicionar(self, accion: &str) -> Result<EstadoPedido, String> {
        match (&self, accion) {
            (EstadoPedido::Nuevo, "pagar") => Ok(EstadoPedido::Pagado),
            (EstadoPedido::Pagado, "enviar") => Ok(EstadoPedido::Enviado {
                seguimiento: format!("SEG-{}", rand::random::<u16>()),
            }),
            (EstadoPedido::Enviado { .. }, "entregar") => Ok(EstadoPedido::Entregado),
            (s, "cancelar") => Ok(EstadoPedido::Cancelado {
                motivo: format!("Cancelado en estado {:?}", s),
            }),
            _ => Err(format!("No se puede '{accion}' en estado {:?}", self)),
        }
    }
}
```

## Preguntas de Práctica

1. ¿Cómo crear una nueva instancia de struct?
2. ¿Cuál es la diferencia entre un struct y un tuple struct?
3. ¿Para qué sirve un unit struct?
4. ¿Cómo difieren los enums de los structs?
5. ¿Por qué Rust no tiene `null`?
6. ¿Qué es `Option<T>` y cuándo lo usarías?
7. ¿Cómo difiere `Result<T, E>` de `Option<T>`?
8. ¿Qué hace la sintaxis de actualización de struct `..`?
9. ¿Puede un struct tener campos mutables?
10. ¿Cómo extraer datos de una variante de enum con diferentes formas de datos?
