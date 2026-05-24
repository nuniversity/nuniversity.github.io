---
title: "Por que Rust?"
description: "Descubra os pontos fortes do Rust: segurança de memória sem garbage collection, abstrações de custo zero e concorrência sem medo"
order: 1
duration: "30 minutos"
difficulty: "iniciante"
---

# Por que Rust?

Rust é uma linguagem de programação de sistemas focada em segurança, velocidade e concorrência. Criada pela Mozilla e agora mantida pela Rust Foundation, tem sido eleita a "linguagem mais amada" nas pesquisas do Stack Overflow por anos consecutivos.

## Segurança de Memória Sem Garbage Collection

As linguagens se dividem em dois grupos:

| Abordagem | Exemplos | Trade-off |
|-----------|----------|-----------|
| Memória manual | C, C++ | Controle total, mas bugs (use-after-free, buffer overflows) |
| Garbage collection | Java, Go, Python | Seguro, mas pausas imprevisíveis e sobrecarga |
| **Baseada em ownership** | **Rust** | **Segura em tempo de compilação, zero sobrecarga em execução** |

Rust garante segurança de memória em **tempo de compilação** através de seu sistema de ownership. Sem dereferências de ponteiro nulo, sem ponteiros soltos, sem buffer overflows — sem precisar de um garbage collector.

> [!SUCCESS]
> O modelo de ownership do Rust captura bugs de memória em tempo de compilação. Se compila, é seguro para memória — sem surpresas em execução.

## Abstrações de Custo Zero

Uma abstração de custo zero significa que você não paga pelo que não usa, e o que você usa não poderia ser escrito mais rápido manualmente. Os iterators, closures e generics do Rust compilam para o mesmo código de máquina eficiente que implementações manuais.

```rust
// Esta cadeia de iterators de alto nível...
let sum: i32 = (0..100).filter(|x| x % 2 == 0).map(|x| x * 2).sum();

// ...compila para o mesmo assembly que este loop escrito à mão
let mut sum = 0;
let mut i = 0;
while i < 100 {
    if i % 2 == 0 {
        sum += i * 2;
    }
    i += 1;
}
```

> [!NOTE]
| Conceito | Significado |
|----------|-------------|
| Custo zero | Abstrações não têm sobrecarga em execução |
| Tempo de compilação | O custo é pago durante a compilação, não na execução |
| Previsível | Sem alocações ocultas, sem pausas de garbage collection |

## Comparação com C/C++

| Aspecto | Rust | C/C++ |
|---------|------|-------|
| Segurança de memória | Garantida pelo compilador | Manual (responsabilidade do desenvolvedor) |
| Sistema de build | Cargo (integrado) | CMake, Make, etc. (externo) |
| Gerenciador de pacotes | crates.io (oficial) | vcpkg, Conan (comunidade) |
| Curva de aprendizado | Íngreme (ownership) | Íngreme (ponteiros, UB) |
| Null | `Option<T>` (sem null) | `NULL` / `nullptr` |
| Tratamento de erros | `Result<T, E>` | Códigos de retorno / exceções |
| Concorrência | Livre de data races por padrão | Manual (pthreads, mutexes) |

```rust
// C: int* ptr = malloc(sizeof(int)); free(ptr);
// Rust: sem necessidade de free manual
let ptr = Box::new(42);
// Automaticamente liberado quando ptr sai de escopo
```

## Comparação com Go

| Aspecto | Rust | Go |
|---------|------|----|
| Gerenciamento de memória | Ownership (tempo de compilação) | GC (tempo de execução) |
| Custo de abstração | Custo zero | Alguma sobrecarga do GC |
| Modelo de concorrência | Ownership + traits Send/Sync | Goroutines + canais |
| Velocidade de compilação | Mais lenta | Rápida |
| Tamanho do binário | Pequeno, sem runtime | Binário estático, inclui GC |
| Caso de uso | Sistemas, embarcado, WASM | Serviços web, ferramentas CLI |

## O Ecossistema Rust

### Rustup — Gerenciador de Toolchains
```bash
rustup update   # Atualizar Rust
rustup default nightly  # Mudar para nightly
```

### Cargo — Sistema de Build e Gerenciador de Pacotes
```bash
cargo new meu_projeto
cargo build
cargo run
cargo test
cargo doc --open
```

### Crates.io
O registro de pacotes Rust hospeda mais de 150.000 crates:

- **serde** — Serialização/deserialização
- **tokio** — Runtime assíncrono
- **rayon** — Paralelismo de dados
- **clap** — Parsing de argumentos CLI
- **reqwest** — Cliente HTTP

## Concorrência Sem Medo

O sistema de tipos do Rust previne data races em tempo de compilação. As traits `Send` e `Sync` (auto-derivadas quando seguro) garantem que você não possa acidentalmente compartilhar estado mutável entre threads.

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];
    
    // Isso não compila — tentando compartilhar dados não-Sync
    // thread::spawn(|| println!("{:?}", data));
    
    // Move a ownership para a closure
    thread::spawn(move || println!("{:?}", data)).join().unwrap();
}
```

## Onde Rust se Destaca

- **WebAssembly** — Compila para WASM com velocidade quase nativa no navegador
- **Sistemas embarcados** — Sem runtime, performance previsível
- **Ferramentas CLI** — Binários rápidos e pequenos (bat, ripgrep, fd, alacritty)
- **Backends web** — Frameworks Actix-web, Axum, Rocket
- **Motores de jogo** — Bevy, bindings Godot
- **Sistemas operacionais** — Redox, módulos de kernel
- **Blockchain** — Solana, Polkadot, Near

> [!WARNING]
> Rust tem uma curva de aprendizado íngreme. O sistema de ownership e o borrow checker podem parecer restritivos no início. Persista nas primeiras semanas — os erros do compilador são excelentes ferramentas de aprendizado.

## Empresas Usando Rust

| Empresa | Caso de Uso |
|---------|-------------|
| Mozilla | Motor CSS do Firefox (Servo/Quantum) |
| Microsoft | Componentes do kernel Windows |
| Google | Android (AOSP), Fuchsia OS |
| Amazon | Infraestrutura AWS (Firecracker VMs) |
| Meta | Controle de versão (Mononoke), blockchain Diem |
| Discord | Serviços backend, performance do cliente |
| Figma | Motor de colaboração em tempo real |
| Cloudflare | Pingora, infraestrutura de edge computing |

## Perguntas de Prática

1. Quais três garantias o sistema de ownership do Rust oferece em tempo de compilação?
2. O que significa "abstração de custo zero" em Rust?
3. Como o gerenciamento de memória do Rust difere do GC do Java e do gerenciamento manual do C?
4. Qual comando cria um novo projeto Rust?
5. O que é `crates.io`?
6. Compare o tratamento de erros do Rust com as exceções do C++.
7. O que significa "concorrência sem medo"?
8. Nomeie três empresas que usam Rust em produção.
9. Qual problema o Rust resolve que C/C++ enfrentam há décadas?
10. Como a abordagem do Rust para null difere da maioria das linguagens?
