---
title: "Instalação e Noções Básicas do Cargo"
description: "Instale Rust com rustup, domine comandos do Cargo e escreva seu primeiro programa Hello World"
order: 2
duration: "25 minutos"
difficulty: "iniciante"
---

# Instalação e Noções Básicas do Cargo

Antes de escrever código Rust, você precisa da toolchain Rust. O Rust torna isso fácil com `rustup`, o instalador oficial e gerenciador de toolchains.

## Instalando Rust com rustup

### Linux / macOS / Windows (WSL)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Isso instala:
- **rustup** — O gerenciador de toolchains
- **rustc** — O compilador Rust
- **cargo** — O sistema de build e gerenciador de pacotes
- **rustdoc** — O gerador de documentação

### Windows (Standalone)

Baixe o instalador de [rustup.rs](https://rustup.rs) e execute-o. Você também precisará do **Visual Studio C++ Build Tools** para linkedição.

### Verifique a Instalação

```bash
rustc --version   # rustc 1.85.0 (ou posterior)
cargo --version   # cargo 1.85.0
rustup --version  # rustup 1.28.0
```

> [!NOTE]
> Rust garante compatibilidade futura: código escrito para Rust 1.0 ainda compila na versão mais recente. Isso é chamado de "estabilidade de edição."

## Gerenciando Toolchains com rustup

```bash
# Listar toolchains instaladas
rustup toolchain list

# Mudar para nightly (para funcionalidades experimentais)
rustup default nightly

# Instalar uma versão específica
rustup toolchain install 1.75.0

# Adicionar o alvo WebAssembly
rustup target add wasm32-unknown-unknown
```

### Canais do Rust

| Canal | Caso de Uso | Garantia de Estabilidade |
|-------|-------------|---------------------------|
| **stable** (padrão) | Produção | Totalmente estável, a cada 6 semanas |
| **beta** | Testar próximas funcionalidades | Majoritariamente estável |
| **nightly** | Funcionalidades experimentais | Pode quebrar |

## Seu Primeiro Projeto Rust com Cargo

Cargo é o sistema de build e gerenciador de pacotes do Rust. Ele lida com:
- Criar novos projetos
- Compilar código
- Executar testes
- Buscar dependências
- Construir documentação

### cargo new

```bash
cargo new hello_rust
cd hello_rust
```

Isso cria:

```
hello_rust/
├── Cargo.toml    # Manifesto do pacote
├── src/
│   └── main.rs   # Ponto de entrada
└── .git/         # Repositório git auto-inicializado
```

### Cargo.toml — O Manifesto do Pacote

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

| Campo | Propósito |
|-------|-----------|
| `name` | Nome do pacote, usado no crates.io |
| `version` | Versionamento semântico |
| `edition` | Edição Rust (2015, 2018, 2021, 2024) |
| `[dependencies]` | Dependências de crates externos |

### src/main.rs — Hello World

```rust
fn main() {
    println!("Hello, world!");
}
```

A função `main` é o ponto de entrada do programa. `println!` é uma **macro** (indicada por `!`) que imprime texto com uma nova linha.

### cargo build

```bash
cargo build
```

Compila o projeto. O binário vai para `target/debug/hello_rust`.

```
hello_rust/
├── Cargo.toml
├── Cargo.lock      # Lockfile de dependências
├── src/
│   └── main.rs
└── target/
    ├── debug/
    │   └── hello_rust   # Binário
    └── ...
```

### cargo run

```bash
cargo run
```

Compila (se necessário) e executa o binário em um passo:

```
   Compiling hello_rust v0.1.0 (/caminho/para/hello_rust)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/hello_rust`
Hello, world!
```

### cargo check

```bash
cargo check
```

Verifica código por erros **sem produzir um binário**. Muito mais rápido que `cargo build` — use-o frequentemente durante o desenvolvimento.

> [!SUCCESS]
> Use `cargo check` para verificar rapidamente se seu código compila. Use `cargo build` ou `cargo run` apenas quando precisar do binário. Isso economiza tempo significativo em projetos maiores.

## Comandos Adicionais do Cargo

| Comando | Propósito |
|---------|-----------|
| `cargo check` | Verificação de tipos sem compilar |
| `cargo build` | Compilar (modo debug) |
| `cargo build --release` | Compilar com otimizações |
| `cargo run` | Compilar e executar |
| `cargo test` | Executar testes |
| `cargo doc --open` | Compilar e abrir documentação |
| `cargo fmt` | Formatador de código |
| `cargo clippy` | Linter de código |
| `cargo update` | Atualizar dependências |
| `cargo clean` | Remover diretório target |

## Modo Release vs Debug

| Modo | Comando | Otimizações | Informação de Debug | Tempo de Build |
|------|---------|-------------|---------------------|----------------|
| Debug | `cargo build` | Nenhuma | Completa | Rápido |
| Release | `cargo build --release` | Nível 3 | Mínima | Lento |

```bash
cargo build --release
# Binário está em target/release/hello_rust
```

> [!WARNING]
> Sempre faça benchmark e deploy com a build de release. Builds debug são significativamente mais lentas e maiores.

## Adicionando Dependências

Edite `Cargo.toml`:

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
rand = "0.8"
```

Ou use cargo add:

```bash
cargo add serde --features derive
cargo add rand
```

Cargo busca dependências de [crates.io](https://crates.io), o registro de pacotes do Rust.

### Usando Dependências

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("Secret: {secret_number}");
}
```

## Workspaces (Para Projetos Maiores)

Para projetos com múltiplos crates:

```toml
# Cargo.toml (raiz do workspace)
[workspace]
members = ["crate_a", "crate_b"]
```

```
project/
├── Cargo.toml        # Definição do workspace
├── crate_a/
│   ├── Cargo.toml
│   └── src/main.rs
└── crate_b/
    ├── Cargo.toml
    └── src/main.rs
```

## Perfis do Cargo

Personalize as configurações de compilação:

```toml
[profile.release]
opt-level = 3          # Máxima otimização
lto = true             # Otimização em tempo de linkedição
codegen-units = 1      # Compilação mais lenta, código mais rápido
strip = true           # Remover símbolos de debug (binário menor)
```

> [!NOTE]
| Configuração | Efeito |
|--------------|--------|
| `opt-level = "z"` | Otimizar para tamanho |
| `lto = true` | Melhor otimização, linkedição mais lenta |
| `strip = true` | Binários significativamente menores |

## Perguntas de Prática

1. Qual comando instala Rust?
2. O que `cargo new` cria?
3. Qual a diferença entre `cargo check` e `cargo build`?
4. Como compilar com otimizações?
5. Qual arquivo declara as dependências de um projeto?
6. O que a seção `[dependencies]` no Cargo.toml faz?
7. Como adicionar o crate `serde` com recursos derive?
8. Qual a diferença entre builds debug e release?
9. Como atualizar todas as dependências de um projeto?
10. Qual comando compila documentação e a abre no navegador?
