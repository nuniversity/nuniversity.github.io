---
title: "Instalación y Conceptos Básicos de Cargo"
description: "Instala Rust con rustup, domina los comandos de Cargo y escribe tu primer programa Hello World"
order: 2
duration: "25 minutos"
difficulty: "principiante"
---

# Instalación y Conceptos Básicos de Cargo

Antes de escribir código Rust, necesitas la toolchain de Rust. Rust lo hace fácil con `rustup`, el instalador oficial y gestor de toolchains.

## Instalando Rust con rustup

### Linux / macOS / Windows (WSL)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Esto instala:
- **rustup** — El gestor de toolchains
- **rustc** — El compilador Rust
- **cargo** — El sistema de build y gestor de paquetes
- **rustdoc** — El generador de documentación

### Windows (Independiente)

Descarga el instalador de [rustup.rs](https://rustup.rs) y ejecútalo. También necesitarás **Visual Studio C++ Build Tools** para el enlazado.

### Verifica la Instalación

```bash
rustc --version   # rustc 1.85.0 (o posterior)
cargo --version   # cargo 1.85.0
rustup --version  # rustup 1.28.0
```

> [!NOTE]
> Rust garantiza compatibilidad hacia adelante: el código escrito para Rust 1.0 aún compila en la versión más reciente. Esto se llama "estabilidad de edición."

## Gestionando Toolchains con rustup

```bash
# Listar toolchains instaladas
rustup toolchain list

# Cambiar a nightly (para características experimentales)
rustup default nightly

# Instalar una versión específica
rustup toolchain install 1.75.0

# Agregar el objetivo WebAssembly
rustup target add wasm32-unknown-unknown
```

### Canales de Rust

| Canal | Caso de Uso | Garantía de Estabilidad |
|-------|-------------|---------------------------|
| **stable** (por defecto) | Producción | Completamente estable, cada 6 semanas |
| **beta** | Probar próximas características | Mayormente estable |
| **nightly** | Características experimentales | Puede romper |

## Tu Primer Proyecto Rust con Cargo

Cargo es el sistema de build y gestor de paquetes de Rust. Maneja:
- Crear nuevos proyectos
- Compilar código
- Ejecutar pruebas
- Obtener dependencias
- Construir documentación

### cargo new

```bash
cargo new hello_rust
cd hello_rust
```

Esto crea:

```
hello_rust/
├── Cargo.toml    # Manifiesto del paquete
├── src/
│   └── main.rs   # Punto de entrada
└── .git/         # Repositorio git auto-inicializado
```

### Cargo.toml — El Manifiesto del Paquete

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

| Campo | Propósito |
|-------|-----------|
| `name` | Nombre del paquete, usado en crates.io |
| `version` | Versionado semántico |
| `edition` | Edición Rust (2015, 2018, 2021, 2024) |
| `[dependencies]` | Dependencias de crates externos |

### src/main.rs — Hello World

```rust
fn main() {
    println!("Hello, world!");
}
```

La función `main` es el punto de entrada del programa. `println!` es una **macro** (indicada por `!`) que imprime texto con una nueva línea.

### cargo build

```bash
cargo build
```

Compila el proyecto. El binario va a `target/debug/hello_rust`.

```
hello_rust/
├── Cargo.toml
├── Cargo.lock      # Lockfile de dependencias
├── src/
│   └── main.rs
└── target/
    ├── debug/
    │   └── hello_rust   # Binario
    └── ...
```

### cargo run

```bash
cargo run
```

Compila (si es necesario) y ejecuta el binario en un paso:

```
   Compiling hello_rust v0.1.0 (/ruta/a/hello_rust)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/hello_rust`
Hello, world!
```

### cargo check

```bash
cargo check
```

Verifica código por errores **sin producir un binario**. Mucho más rápido que `cargo build` — úsalo frecuentemente durante el desarrollo.

> [!SUCCESS]
> Usa `cargo check` para verificar rápidamente si tu código compila. Usa `cargo build` o `cargo run` solo cuando necesites el binario. Esto ahorra tiempo significativo en proyectos grandes.

## Comandos Adicionales de Cargo

| Comando | Propósito |
|---------|-----------|
| `cargo check` | Verificación de tipos sin compilar |
| `cargo build` | Compilar (modo debug) |
| `cargo build --release` | Compilar con optimizaciones |
| `cargo run` | Compilar y ejecutar |
| `cargo test` | Ejecutar pruebas |
| `cargo doc --open` | Compilar y abrir documentación |
| `cargo fmt` | Formateador de código |
| `cargo clippy` | Linter de código |
| `cargo update` | Actualizar dependencias |
| `cargo clean` | Eliminar directorio target |

## Modo Release vs Debug

| Modo | Comando | Optimizaciones | Información de Debug | Tiempo de Build |
|------|---------|----------------|----------------------|-----------------|
| Debug | `cargo build` | Ninguna | Completa | Rápido |
| Release | `cargo build --release` | Nivel 3 | Mínima | Lento |

```bash
cargo build --release
# El binario está en target/release/hello_rust
```

> [!WARNING]
> Siempre haz benchmark y despliega con la build de release. Las builds debug son significativamente más lentas y grandes.

## Agregando Dependencias

Edita `Cargo.toml`:

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
rand = "0.8"
```

O usa cargo add:

```bash
cargo add serde --features derive
cargo add rand
```

Cargo obtiene dependencias de [crates.io](https://crates.io), el registro de paquetes de Rust.

### Usando Dependencias

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("Secret: {secret_number}");
}
```

## Workspaces (Para Proyectos Grandes)

Para proyectos con múltiples crates:

```toml
# Cargo.toml (raíz del workspace)
[workspace]
members = ["crate_a", "crate_b"]
```

```
project/
├── Cargo.toml        # Definición del workspace
├── crate_a/
│   ├── Cargo.toml
│   └── src/main.rs
└── crate_b/
    ├── Cargo.toml
    └── src/main.rs
```

## Perfiles de Cargo

Personaliza las configuraciones de compilación:

```toml
[profile.release]
opt-level = 3          # Máxima optimización
lto = true             # Optimización en tiempo de enlazado
codegen-units = 1      # Compilación más lenta, código más rápido
strip = true           # Eliminar símbolos de debug (binario más pequeño)
```

> [!NOTE]
| Configuración | Efecto |
|--------------|--------|
| `opt-level = "z"` | Optimizar para tamaño |
| `lto = true` | Mejor optimización, enlazado más lento |
| `strip = true` | Binarios significativamente más pequeños |

## Preguntas de Práctica

1. ¿Qué comando instala Rust?
2. ¿Qué crea `cargo new`?
3. ¿Cuál es la diferencia entre `cargo check` y `cargo build`?
4. ¿Cómo compilas con optimizaciones?
5. ¿Qué archivo declara las dependencias de un proyecto?
6. ¿Qué hace la sección `[dependencies]` en Cargo.toml?
7. ¿Cómo agregas el crate `serde` con características derive?
8. ¿Cuál es la diferencia entre builds debug y release?
9. ¿Cómo actualizas todas las dependencias de un proyecto?
10. ¿Qué comando compila documentación y la abre en el navegador?
