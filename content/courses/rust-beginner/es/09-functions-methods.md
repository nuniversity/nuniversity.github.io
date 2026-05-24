---
title: "Funciones, Métodos y Bloques impl"
description: "Escribe código reutilizable con funciones, implementa métodos en tipos y entiende las funciones asociadas"
order: 9
duration: "30 minutos"
difficulty: "principiante"
---

# Funciones, Métodos y Bloques impl

Las funciones son los bloques de construcción de los programas Rust. Los métodos son funciones adjuntas a tipos mediante bloques `impl`.

## Funciones

Las funciones en Rust usan nomenclatura `snake_case`:

```rust
fn main() {
    saludar("Mundo");
    let suma = sumar(5, 3);
    println!("{suma}");
}

fn saludar(nombre: &str) {
    println!("¡Hola, {nombre}!");
}

fn sumar(x: i32, y: i32) -> i32 {
    x + y  // Sin punto y coma = expresión, retornada
}
```

### Sintaxis de Función

```rust
// Palabra clave nombre   params    tipo de retorno
fn     nombre(param: Tipo) -> TipoRetorno {
    // Cuerpo — última expresión es retornada
    valor  // Retorno implícito
}

fn retorno_explicito(x: i32) -> i32 {
    if x > 0 {
        return x;  // Retorno anticipado con 'return'
    }
    0  // Retorno por defecto
}
```

> [!NOTE]
| Sintaxis | Comportamiento | Ejemplo |
|----------|----------------|---------|
| `expr;` (punto y coma) | Sentencia, retorna `()` | `let x = 5;` |
| `expr` (sin punto y coma) | Expresión, retorna valor | `x + 1` |
| `return expr;` | Retorno anticipado | `return Err(e);` |

### Funciones con Múltiples Retornos

```rust
fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err(String::from("división por cero"));
    }
    Ok(a / b)
}

// Múltiples valores mediante tupla
fn dividir_en(s: &str, medio: usize) -> (&str, &str) {
    (&s[..medio], &s[medio..])
}
```

## Métodos

Los métodos son funciones definidas dentro de un bloque `impl`. Su primer parámetro es siempre `self`, `&self` o `&mut self`:

```rust
struct Rectangulo {
    ancho: u32,
    alto: u32,
}

impl Rectangulo {
    // Método: toma self prestado inmutablemente
    fn area(&self) -> u32 {
        self.ancho * self.alto
    }
    
    // Método: toma self prestado mutablemente
    fn escalar(&mut self, factor: u32) {
        self.ancho *= factor;
        self.alto *= factor;
    }
    
    // Método: toma ownership (raro)
    fn consumir(self) -> String {
        format!("{}x{}", self.ancho, self.alto)
    }
}

fn main() {
    let mut rect = Rectangulo { ancho: 30, alto: 50 };
    
    println!("area: {}", rect.area());   // Llamada a método
    rect.escalar(2);                     // Llamada a método mutable
    println!("ahora: {}x{}", rect.ancho, rect.alto);
}
```

> [!SUCCESS]
| Forma de `self` | Acceso | Caso de Uso |
|-----------------|--------|-------------|
| `&self` | Solo lectura | Mayoría de métodos |
| `&mut self` | Lectura + Escritura | Métodos que modifican |
| `self` | Ownership | Consumiendo el valor |

## Funciones Asociadas

Las funciones en bloques `impl` que NO reciben `self` se llaman **funciones asociadas**. Se llaman con sintaxis `::`:

```rust
impl Rectangulo {
    fn cuadrado(tamano: u32) -> Rectangulo {
        Rectangulo { ancho: tamano, alto: tamano }
    }
}

fn main() {
    let cuadrado = Rectangulo::cuadrado(10);
    println!("{} x {}", cuadrado.ancho, cuadrado.alto);
}
```

> [!NOTE]
> La sintaxis `::` se usa para:
> - Funciones asociadas: `Tipo::funcion()`
> - Acceso a namespace: `std::collections::HashMap`
> - Variantes de enum: `Option::Some(5)`

### Funciones Asociadas Comunes

```rust
// Constructores
let s = String::from("hola");     // &str -> String
let v = Vec::with_capacity(10);    // Pre-asignar
let n = "42".parse::<i32>().unwrap(); // Analizar cadena
```

## Múltiples Bloques impl

Un tipo puede tener múltiples bloques `impl`:

```rust
struct Punto {
    x: f64,
    y: f64,
}

impl Punto {
    fn nuevo(x: f64, y: f64) -> Punto {
        Punto { x, y }
    }
}

impl Punto {
    fn distancia_del_origen(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

impl Punto {
    fn distancia(&self, otro: &Punto) -> f64 {
        ((self.x - otro.x).powi(2) + (self.y - otro.y).powi(2)).sqrt()
    }
}
```

Esto es útil para separar código en grupos lógicos, especialmente al usar atributos `#[cfg]` o feature gates.

## Encadenamiento de Métodos

Retorna `&mut self` o `Self` desde métodos para permitir encadenamiento:

```rust
struct Calculadora {
    valor: f64,
}

impl Calculadora {
    fn nueva() -> Calculadora {
        Calculadora { valor: 0.0 }
    }
    
    fn sumar(&mut self, x: f64) -> &mut Calculadora {
        self.valor += x;
        self
    }
    
    fn multiplicar(&mut self, x: f64) -> &mut Calculadora {
        self.valor *= x;
        self
    }
    
    fn resultado(&self) -> f64 {
        self.valor
    }
}

fn main() {
    let resultado = Calculadora::nueva()
        .sumar(10.0)
        .multiplicar(2.0)
        .sumar(5.0)
        .resultado();
    println!("{resultado}"); // 25.0
}
```

## Funciones Genéricas (Avance)

```rust
fn mayor<T: PartialOrd>(lista: &[T]) -> &T {
    let mut mayor = &lista[0];
    for item in lista {
        if item > mayor {
            mayor = item;
        }
    }
    mayor
}

fn main() {
    println!("{}", mayor(&[1, 3, 5, 2, 4])); // 5
    println!("{}", mayor(&['a', 'z', 'm'])); // 'z'
}
```

## Funciones como Valores

Las funciones son ciudadanos de primera clase — pueden pasarse:

```rust
fn sumar_uno(x: i32) -> i32 { x + 1 }
fn doblar(x: i32) -> i32 { x * 2 }

fn aplicar(f: fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

fn main() {
    println!("{}", aplicar(sumar_uno, 5));  // 6
    println!("{}", aplicar(doblar, 5));   // 10
}
```

## Atributos de Función

```rust
#[inline]
fn funcion_pequena_caliente(x: i32) -> i32 {
    x.wrapping_mul(2) + 1
}

#[cfg(test)]
mod pruebas {
    #[test]
    fn test_sumar() {
        assert_eq!(super::sumar(2, 3), 5);
    }
}
```

## Mundo Real: Patrón Builder

```rust
struct ConstructorEmail {
    para: Option<String>,
    asunto: Option<String>,
    cuerpo: Option<String>,
}

impl ConstructorEmail {
    fn nuevo() -> ConstructorEmail {
        ConstructorEmail { para: None, asunto: None, cuerpo: None }
    }
    
    fn para(mut self, para: &str) -> ConstructorEmail {
        self.para = Some(para.to_string());
        self
    }
    
    fn asunto(mut self, asunto: &str) -> ConstructorEmail {
        self.asunto = Some(asunto.to_string());
        self
    }
    
    fn cuerpo(mut self, cuerpo: &str) -> ConstructorEmail {
        self.cuerpo = Some(cuerpo.to_string());
        self
    }
    
    fn construir(self) -> Result<Email, String> {
        Ok(Email {
            para: self.para.ok_or("Falta 'para'")?,
            asunto: self.asunto.unwrap_or_default(),
            cuerpo: self.cuerpo.unwrap_or_default(),
        })
    }
}

struct Email {
    para: String,
    asunto: String,
    cuerpo: String,
}

fn main() {
    let email = ConstructorEmail::nuevo()
        .para("alice@ejemplo.com")
        .asunto("Hola")
        .cuerpo("¿Cómo estás?")
        .construir()
        .unwrap();
    
    println!("Email para: {}", email.para);
}
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre una función y un método?
2. ¿Qué significa `&self` en la firma de un método?
3. ¿Cuándo usar `self` (con ownership) en lugar de `&self`?
4. ¿Qué es una función asociada? ¿Cómo se llama?
5. ¿Puede un struct tener múltiples bloques `impl`?
6. ¿Cuál es la diferencia entre sentencias y expresiones en cuerpos de función?
7. ¿Cómo hacer un retorno anticipado de una función?
8. ¿Qué es el encadenamiento de métodos y cómo se implementa?
9. ¿Cómo definir una función que recibe otra función como parámetro?
10. ¿Cuándo usar una función asociada vs un método?
