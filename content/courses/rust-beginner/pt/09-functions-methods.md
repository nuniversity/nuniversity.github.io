---
title: "Funções, Métodos e Blocos impl"
description: "Escreva código reutilizável com funções, implemente métodos em tipos e entenda funções associadas"
order: 9
duration: "30 minutos"
difficulty: "iniciante"
---

# Funções, Métodos e Blocos impl

Funções são os blocos de construção dos programas Rust. Métodos são funções anexadas a tipos via blocos `impl`.

## Funções

Funções em Rust usam nomenclatura `snake_case`:

```rust
fn main() {
    cumprimentar("Mundo");
    let soma = adicionar(5, 3);
    println!("{soma}");
}

fn cumprimentar(nome: &str) {
    println!("Olá, {nome}!");
}

fn adicionar(x: i32, y: i32) -> i32 {
    x + y  // Sem ponto e vírgula = expressão, retornada
}
```

### Sintaxe de Função

```rust
// Palavra-chave nome   params    tipo de retorno
fn     nome(param: Tipo) -> TipoRetorno {
    // Corpo — última expressão é retornada
    valor  // Retorno implícito
}

fn retorno_explicito(x: i32) -> i32 {
    if x > 0 {
        return x;  // Retorno antecipado com 'return'
    }
    0  // Retorno padrão
}
```

> [!NOTE]
| Sintaxe | Comportamento | Exemplo |
|---------|---------------|---------|
| `expr;` (ponto e vírgula) | Statement, retorna `()` | `let x = 5;` |
| `expr` (sem ponto e vírgula) | Expressão, retorna valor | `x + 1` |
| `return expr;` | Retorno antecipado | `return Err(e);` |

### Funções com Múltiplos Retornos

```rust
fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        return Err(String::from("divisão por zero"));
    }
    Ok(a / b)
}

// Múltiplos valores via tupla
fn dividir_em(s: &str, meio: usize) -> (&str, &str) {
    (&s[..meio], &s[meio..])
}
```

## Métodos

Métodos são funções definidas dentro de um bloco `impl`. Seu primeiro parâmetro é sempre `self`, `&self` ou `&mut self`:

```rust
struct Retangulo {
    largura: u32,
    altura: u32,
}

impl Retangulo {
    // Método: toma self emprestado imutavelmente
    fn area(&self) -> u32 {
        self.largura * self.altura
    }
    
    // Método: toma self emprestado mutavelmente
    fn escalar(&mut self, fator: u32) {
        self.largura *= fator;
        self.altura *= fator;
    }
    
    // Método: toma ownership (raro)
    fn consumir(self) -> String {
        format!("{}x{}", self.largura, self.altura)
    }
}

fn main() {
    let mut ret = Retangulo { largura: 30, altura: 50 };
    
    println!("area: {}", ret.area());   // Chamada de método
    ret.escalar(2);                     // Chamada de método mutável
    println!("agora: {}x{}", ret.largura, ret.altura);
}
```

> [!SUCCESS]
| Forma de `self` | Acesso | Caso de Uso |
|-----------------|--------|-------------|
| `&self` | Somente leitura | Maioria dos métodos |
| `&mut self` | Leitura + Escrita | Métodos que modificam |
| `self` | Ownership | Consumindo o valor |

## Funções Associadas

Funções em blocos `impl` que NÃO recebem `self` são chamadas de **funções associadas**. São chamadas com sintaxe `::`:

```rust
impl Retangulo {
    fn quadrado(tamanho: u32) -> Retangulo {
        Retangulo { largura: tamanho, altura: tamanho }
    }
}

fn main() {
    let quadrado = Retangulo::quadrado(10);
    println!("{} x {}", quadrado.largura, quadrado.altura);
}
```

> [!NOTE]
> A sintaxe `::` é usada para:
> - Funções associadas: `Tipo::funcao()`
> - Acesso a namespace: `std::collections::HashMap`
> - Variantes de enum: `Option::Some(5)`

### Funções Associadas Comuns

```rust
// Construtores
let s = String::from("olá");     // &str -> String
let v = Vec::with_capacity(10);    // Pré-alocar
let n = "42".parse::<i32>().unwrap(); // Analisar string
```

## Múltiplos Blocos impl

Um tipo pode ter múltiplos blocos `impl`:

```rust
struct Ponto {
    x: f64,
    y: f64,
}

impl Ponto {
    fn novo(x: f64, y: f64) -> Ponto {
        Ponto { x, y }
    }
}

impl Ponto {
    fn distancia_da_origem(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

impl Ponto {
    fn distancia(&self, outro: &Ponto) -> f64 {
        ((self.x - outro.x).powi(2) + (self.y - outro.y).powi(2)).sqrt()
    }
}
```

Isso é útil para separar código em grupos lógicos, especialmente ao usar atributos `#[cfg]` ou feature gates.

## Encadeamento de Métodos

Retorne `&mut self` ou `Self` de métodos para permitir encadeamento:

```rust
struct Calculadora {
    valor: f64,
}

impl Calculadora {
    fn nova() -> Calculadora {
        Calculadora { valor: 0.0 }
    }
    
    fn adicionar(&mut self, x: f64) -> &mut Calculadora {
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
    let resultado = Calculadora::nova()
        .adicionar(10.0)
        .multiplicar(2.0)
        .adicionar(5.0)
        .resultado();
    println!("{resultado}"); // 25.0
}
```

## Funções Genéricas (Prévia)

```rust
fn maior<T: PartialOrd>(lista: &[T]) -> &T {
    let mut maior = &lista[0];
    for item in lista {
        if item > maior {
            maior = item;
        }
    }
    maior
}

fn main() {
    println!("{}", maior(&[1, 3, 5, 2, 4])); // 5
    println!("{}", maior(&['a', 'z', 'm'])); // 'z'
}
```

## Funções como Valores

Funções são cidadãos de primeira classe — podem ser passadas:

```rust
fn adicionar_um(x: i32) -> i32 { x + 1 }
fn dobrar(x: i32) -> i32 { x * 2 }

fn aplicar(f: fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

fn main() {
    println!("{}", aplicar(adicionar_um, 5));  // 6
    println!("{}", aplicar(dobrar, 5));   // 10
}
```

## Atributos de Função

```rust
#[inline]
fn funcao_pequena_quente(x: i32) -> i32 {
    x.wrapping_mul(2) + 1
}

#[cfg(test)]
mod testes {
    #[test]
    fn test_adicionar() {
        assert_eq!(super::adicionar(2, 3), 5);
    }
}
```

## Mundo Real: Padrão Builder

```rust
struct ConstrutorEmail {
    para: Option<String>,
    assunto: Option<String>,
    corpo: Option<String>,
}

impl ConstrutorEmail {
    fn novo() -> ConstrutorEmail {
        ConstrutorEmail { para: None, assunto: None, corpo: None }
    }
    
    fn para(mut self, para: &str) -> ConstrutorEmail {
        self.para = Some(para.to_string());
        self
    }
    
    fn assunto(mut self, assunto: &str) -> ConstrutorEmail {
        self.assunto = Some(assunto.to_string());
        self
    }
    
    fn corpo(mut self, corpo: &str) -> ConstrutorEmail {
        self.corpo = Some(corpo.to_string());
        self
    }
    
    fn construir(self) -> Result<Email, String> {
        Ok(Email {
            para: self.para.ok_or("Faltando 'para'")?,
            assunto: self.assunto.unwrap_or_default(),
            corpo: self.corpo.unwrap_or_default(),
        })
    }
}

struct Email {
    para: String,
    assunto: String,
    corpo: String,
}

fn main() {
    let email = ConstrutorEmail::novo()
        .para("alice@exemplo.com")
        .assunto("Olá")
        .corpo("Como você está?")
        .construir()
        .unwrap();
    
    println!("Email para: {}", email.para);
}
```

## Perguntas de Prática

1. Qual a diferença entre uma função e um método?
2. O que `&self` significa na assinatura de um método?
3. Quando usar `self` (com ownership) em vez de `&self`?
4. O que é uma função associada? Como é chamada?
5. Um struct pode ter múltiplos blocos `impl`?
6. Qual a diferença entre statements e expressões em corpos de função?
7. Como fazer um retorno antecipado de uma função?
8. O que é encadeamento de métodos e como é implementado?
9. Como definir uma função que recebe outra função como parâmetro?
10. Quando usar uma função associada vs um método?
