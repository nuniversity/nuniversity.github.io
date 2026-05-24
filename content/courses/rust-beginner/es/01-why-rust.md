---
title: "¿Por qué Rust?"
description: "Descubre las fortalezas clave de Rust: seguridad de memoria sin recolector de basura, abstracciones de costo cero y concurrencia sin miedo"
order: 1
duration: "30 minutos"
difficulty: "principiante"
---

# ¿Por qué Rust?

Rust es un lenguaje de programación de sistemas centrado en seguridad, velocidad y concurrencia. Creado por Mozilla y ahora administrado por la Rust Foundation, ha sido votado como el "lenguaje más amado" en las encuestas de Stack Overflow durante años consecutivos.

## Seguridad de Memoria Sin Recolector de Basura

Los lenguajes se dividen en dos grupos:

| Enfoque | Ejemplos | Compromiso |
|---------|----------|------------|
| Memoria manual | C, C++ | Control total, pero bugs (use-after-free, desbordamientos de búfer) |
| Recolector de basura | Java, Go, Python | Seguro, pero pausas impredecibles y sobrecarga |
| **Basado en ownership** | **Rust** | **Seguro en tiempo de compilación, cero sobrecarga en ejecución** |

Rust garantiza seguridad de memoria en **tiempo de compilación** a través de su sistema de ownership. Sin desreferencias de puntero nulo, sin punteros colgantes, sin desbordamientos de búfer — sin necesidad de un recolector de basura.

> [!SUCCESS]
> El modelo de ownership de Rust captura bugs de memoria en tiempo de compilación. Si compila, es seguro para memoria — sin sorpresas en ejecución.

## Abstracciones de Costo Cero

Una abstracción de costo cero significa que no pagas por lo que no usas, y lo que usas no podría escribirse más rápido a mano. Los iteradores, closures y genéricos de Rust compilan al mismo código de máquina eficiente que las implementaciones manuales.

```rust
// Esta cadena de iteradores de alto nivel...
let sum: i32 = (0..100).filter(|x| x % 2 == 0).map(|x| x * 2).sum();

// ...compila al mismo assembly que este bucle escrito a mano
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
| Concepto | Significado |
|----------|-------------|
| Costo cero | Las abstracciones no tienen sobrecarga en ejecución |
| Tiempo de compilación | El costo se paga durante la compilación, no en la ejecución |
| Predecible | Sin asignaciones ocultas, sin pausas de recolector de basura |

## Comparación con C/C++

| Aspecto | Rust | C/C++ |
|---------|------|-------|
| Seguridad de memoria | Garantizada por el compilador | Manual (responsabilidad del desarrollador) |
| Sistema de build | Cargo (integrado) | CMake, Make, etc. (externo) |
| Gestor de paquetes | crates.io (oficial) | vcpkg, Conan (comunidad) |
| Curva de aprendizaje | Empinada (ownership) | Empinada (punteros, UB) |
| Null | `Option<T>` (sin null) | `NULL` / `nullptr` |
| Manejo de errores | `Result<T, E>` | Códigos de retorno / excepciones |
| Concurrencia | Libre de data races por defecto | Manual (pthreads, mutexes) |

```rust
// C: int* ptr = malloc(sizeof(int)); free(ptr);
// Rust: sin necesidad de free manual
let ptr = Box::new(42);
// Liberado automáticamente cuando ptr sale de ámbito
```

## Comparación con Go

| Aspecto | Rust | Go |
|---------|------|----|
| Gestión de memoria | Ownership (tiempo de compilación) | GC (tiempo de ejecución) |
| Costo de abstracción | Costo cero | Algo de sobrecarga del GC |
| Modelo de concurrencia | Ownership + traits Send/Sync | Goroutines + canales |
| Velocidad de compilación | Más lenta | Rápida |
| Tamaño del binario | Pequeño, sin runtime | Binario estático, incluye GC |
| Caso de uso | Sistemas, embebido, WASM | Servicios web, herramientas CLI |

## El Ecosistema Rust

### Rustup — Gestor de Toolchains
```bash
rustup update   # Actualizar Rust
rustup default nightly  # Cambiar a nightly
```

### Cargo — Sistema de Build y Gestor de Paquetes
```bash
cargo new mi_proyecto
cargo build
cargo run
cargo test
cargo doc --open
```

### Crates.io
El registro de paquetes Rust alberga más de 150.000 crates:

- **serde** — Serialización/deserialización
- **tokio** — Runtime asíncrono
- **rayon** — Paralelismo de datos
- **clap** — Análisis de argumentos CLI
- **reqwest** — Cliente HTTP

## Concurrencia Sin Miedo

El sistema de tipos de Rust previene data races en tiempo de compilación. Los traits `Send` y `Sync` (auto-derivados cuando es seguro) garantizan que no puedas compartir accidentalmente estado mutable entre hilos.

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];
    
    // Esto no compila — intentando compartir datos no-Sync
    // thread::spawn(|| println!("{:?}", data));
    
    // Mueve la ownership a la closure
    thread::spawn(move || println!("{:?}", data)).join().unwrap();
}
```

## Dónde Destaca Rust

- **WebAssembly** — Compila a WASM para velocidad casi nativa en el navegador
- **Sistemas embebidos** — Sin runtime, rendimiento predecible
- **Herramientas CLI** — Binarios rápidos y pequeños (bat, ripgrep, fd, alacritty)
- **Backends web** — Frameworks Actix-web, Axum, Rocket
- **Motores de juego** — Bevy, bindings Godot
- **Sistemas operativos** — Redox, módulos de kernel
- **Blockchain** — Solana, Polkadot, Near

> [!WARNING]
> Rust tiene una curva de aprendizaje empinada. El sistema de ownership y el borrow checker se sentirán restrictivos al principio. Persiste las primeras semanas — los errores del compilador son excelentes herramientas de aprendizaje.

## Empresas Usando Rust

| Empresa | Caso de Uso |
|---------|-------------|
| Mozilla | Motor CSS de Firefox (Servo/Quantum) |
| Microsoft | Componentes del kernel Windows |
| Google | Android (AOSP), Fuchsia OS |
| Amazon | Infraestructura AWS (Firecracker VMs) |
| Meta | Control de versiones (Mononoke), blockchain Diem |
| Discord | Servicios backend, rendimiento del cliente |
| Figma | Motor de colaboración en tiempo real |
| Cloudflare | Pingora, infraestructura de edge computing |

## Preguntas de Práctica

1. ¿Qué tres garantías proporciona el sistema de ownership de Rust en tiempo de compilación?
2. ¿Qué significa "abstracción de costo cero" en Rust?
3. ¿Cómo difiere la gestión de memoria de Rust del GC de Java y la gestión manual de C?
4. ¿Qué comando crea un nuevo proyecto Rust?
5. ¿Qué es `crates.io`?
6. Compara el manejo de errores de Rust con las excepciones de C++.
7. ¿Qué significa "concurrencia sin miedo"?
8. Nombra tres empresas que usan Rust en producción.
9. ¿Qué problema resuelve Rust que C/C++ han enfrentado durante décadas?
10. ¿Cómo difiere el enfoque de Rust hacia null de la mayoría de los lenguajes?
