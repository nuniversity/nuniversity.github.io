---
title: "Structs e Enums"
description: "Defina tipos de dados personalizados com structs, enums, Option e Result para código seguro e expressivo"
order: 8
duration: "30 minutos"
difficulty: "iniciante"
---

# Structs e Enums

Structs e enums permitem criar tipos personalizados que modelam seu domínio com precisão. São a base do design orientado a tipos do Rust.

## Definindo Structs

Um `struct` agrupa dados relacionados em um tipo:

```rust
struct Usuario {
    ativo: bool,
    nome: String,
    email: String,
    contagem_login: u64,
}

fn main() {
    let usuario = Usuario {
        ativo: true,
        nome: String::from("alice"),
        email: String::from("alice@exemplo.com"),
        contagem_login: 1,
    };
    
    println!("{}", usuario.email);
}
```

> [!NOTE]
> Campos de struct são privados por padrão ao módulo em que são definidos. Use `pub` para torná-los públicos (abordado em módulos).

### Structs Mutáveis

```rust
fn main() {
    let mut usuario = Usuario {
        ativo: true,
        nome: String::from("alice"),
        email: String::from("alice@exemplo.com"),
        contagem_login: 1,
    };
    
    usuario.email = String::from("alice@novodominio.com");
}
```

> [!WARNING]
> Mutabilidade se aplica a toda a instância do struct, não a campos individuais. Você não pode ter alguns campos mutáveis e outros imutáveis (a menos que use mutabilidade interior via `Cell`/`RefCell`).

### Atalho de Inicialização de Campos

```rust
fn construir_usuario(email: String, nome: String) -> Usuario {
    Usuario {
        ativo: true,
        nome, // atalho: campo = variável com mesmo nome
        email,
        contagem_login: 1,
    }
}
```

### Sintaxe de Atualização de Struct

```rust
fn main() {
    let usuario1 = Usuario {
        email: String::from("alice@exemplo.com"),
        nome: String::from("alice"),
        ativo: true,
        contagem_login: 1,
    };
    
    let usuario2 = Usuario {
        email: String::from("bob@exemplo.com"),
        ..usuario1 // Preencher campos restantes de usuario1
    };
    // Nota: nome e email foram movidos (String), usuario1 não é mais válido
}
```

## Tuple Structs

Tuplas nomeadas com nomes de campos:

```rust
struct Cor(i32, i32, i32);
struct Ponto(i32, i32, i32);

fn main() {
    let preto = Cor(0, 0, 0);
    let origem = Ponto(0, 0, 0);
    
    // Tipos diferentes mesmo com os mesmos campos
    // preto = origem; // ERRO: tipos incompatíveis
    
    // Desestruturar
    let Cor(r, g, b) = preto;
    println!("{r} {g} {b}");
}
```

## Unit Structs

Structs sem campos (como o tipo unitário `()`):

```rust
struct SempreIgual;

fn main() {
    let sujeito = SempreIgual;
}
```

Útil para:
- Tipos marcadores (implementando traits neles)
- Estados de máquina de estados sem dados

## Enums

Um enum representa dados que podem ser uma de várias variantes:

```rust
enum TipoIp {
    V4,
    V6,
}

fn main() {
    let quatro = TipoIp::V4;
    let seis = TipoIp::V6;
    
    rotear(quatro);
    rotear(seis);
    rotear(TipoIp::V4);
}

fn rotear(tipo_ip: TipoIp) {}
```

### Enums com Dados

```rust
enum IpAddr {
    V4(String),  // Cada variante pode conter dados
    V6(String),
}

fn main() {
    let casa = IpAddr::V4(String::from("127.0.0.1"));
    let loopback = IpAddr::V6(String::from("::1"));
}
```

### Enums com Dados Diferentes por Variante

```rust
enum Mensagem {
    Sair,                           // Sem dados
    Mover { x: i32, y: i32 },       // Campos nomeados (como struct)
    Escrever(String),               // Variante tupla
    MudarCor(i32, i32, i32),        // Variante tupla
}

impl Mensagem {
    fn chamar(&self) {
        match self {
            Mensagem::Sair => println!("Saindo"),
            Mensagem::Mover { x, y } => println!("Mover para ({x}, {y})"),
            Mensagem::Escrever(texto) => println!("{texto}"),
            Mensagem::MudarCor(r, g, b) => println!("Cor RGB({r}, {g}, {b})"),
        }
    }
}
```

> [!SUCCESS]
| Struct vs Enum | Use Quando |
|----------------|-----------|
| Struct | Dados sempre têm todos os campos |
| Enum | Dados podem ser uma de várias formas |
| Enum com dados | Cada variante carrega dados diferentes |

## Option — Tratamento Seguro de Null

Rust não tem `null`. Em vez disso, use `Option<T>`:

```rust
enum Option<T> {
    Some(T),
    None,
}

fn main() {
    let algum_numero = Some(5);       // Option<i32>
    let algum_char = Some('a');       // Option<char>
    let numero_ausente: Option<i32> = None; // Deve especificar tipo
    
    // Option<T> e T são tipos diferentes
    let x: i32 = 5;
    let y: Option<i32> = Some(10);
    // let soma = x + y; // ERRO: não pode somar i32 e Option<i32>
    
    // Deve extrair o valor primeiro
    let soma = x + y.unwrap_or(0);
    println!("{soma}");
}
```

### Métodos Comuns de Option

| Método | Propósito | Retorna |
|--------|-----------|---------|
| `unwrap()` | Obter valor ou panicar | `T` |
| `unwrap_or(padrao)` | Obter valor ou padrão | `T` |
| `unwrap_or_else(fn)` | Obter valor ou chamar fn | `T` |
| `is_some()` | Verificar se é Some | `bool` |
| `is_none()` | Verificar se é None | `bool` |
| `map(fn)` | Transformar valor Some | `Option<U>` |
| `expect(msg)` | Desencapsular com mensagem de panic personalizada | `T` |

## Result — Tratamento de Erros

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Usado para operações que podem falhar:

```rust
use std::fs::File;

fn main() {
    let resultado_arquivo = File::open("ola.txt");
    
    let arquivo = match resultado_arquivo {
        Ok(f) => f,
        Err(e) => panic!("Falha ao abrir arquivo: {e}"),
    };
}
```

| Aspecto | `Option<T>` | `Result<T, E>` |
|---------|-------------|----------------|
| Significado | Valor pode estar ausente | Operação pode falhar |
| Sucesso | `Some(T)` | `Ok(T)` |
| Falha | `None` | `Err(E)` |
| Informação de erro | Não | Sim (o tipo `E`) |

## Correspondência de Padrões com Enums

```rust
enum Status {
    Ativo,
    Inativo,
    Pendente { desde: String },
}

fn descrever(status: Status) -> String {
    match status {
        Status::Ativo => String::from("ativo"),
        Status::Inativo => String::from("inativo"),
        Status::Pendente { desde } => format!("pendente desde {desde}"),
    }
}
```

## if let / while let com Enums

```rust
fn main() {
    let mut pilha = Vec::new();
    pilha.push(1);
    pilha.push(2);
    pilha.push(3);
    
    while let Some(topo) = pilha.pop() {
        println!("{topo}");
    }
    
    // Desestruturar variantes de enum
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
    Novo,
    Pago,
    Enviado { rastreio: String },
    Entregue,
    Cancelado { motivo: String },
}

impl EstadoPedido {
    fn transicionar(self, acao: &str) -> Result<EstadoPedido, String> {
        match (&self, acao) {
            (EstadoPedido::Novo, "pagar") => Ok(EstadoPedido::Pago),
            (EstadoPedido::Pago, "enviar") => Ok(EstadoPedido::Enviado {
                rastreio: format!("RSTR-{}", rand::random::<u16>()),
            }),
            (EstadoPedido::Enviado { .. }, "entregar") => Ok(EstadoPedido::Entregue),
            (s, "cancelar") => Ok(EstadoPedido::Cancelado {
                motivo: format!("Cancelado no estado {:?}", s),
            }),
            _ => Err(format!("Não pode '{acao}' no estado {:?}", self)),
        }
    }
}
```

## Perguntas de Prática

1. Como criar uma nova instância de struct?
2. Qual a diferença entre um struct e um tuple struct?
3. Para que serve um unit struct?
4. Como enums diferem de structs?
5. Por que Rust não tem `null`?
6. O que é `Option<T>` e quando você o usaria?
7. Como `Result<T, E>` difere de `Option<T>`?
8. O que a sintaxe de atualização de struct `..` faz?
9. Um struct pode ter campos mutáveis?
10. Como extrair dados de uma variante de enum com diferentes formas de dados?
