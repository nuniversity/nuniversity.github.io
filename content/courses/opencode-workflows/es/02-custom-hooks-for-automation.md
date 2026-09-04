---
title: "Hooks Personalizados para Automatización"
description: "Crea hooks personalizados para automatizar tareas repetitivas en OpenCode. Aprende el ciclo de vida de los hooks, tipos de eventos y cómo crear hooks que validen, transformen y protejan tu flujo de trabajo."
order: 2
duration: "45 min"
difficulty: "intermediate"
---

# Hooks Personalizados para Automatización

## ¿Qué Son los Hooks?

Los hooks son scripts que se ejecutan automáticamente en puntos específicos del ciclo de vida de OpenCode. Permiten:

- **Validación** — Verificar entradas/salidas antes del procesamiento
- **Transformación** — Modificar datos entre pasos
- **Protección** — Bloquear operaciones peligrosas
- **Registro** — Rastrear actividad para auditoría

---

## Eventos de Hooks

| Evento | Cuándo Se Activa | Caso de Uso |
|-------|---------------|----------|
| `session.start` | La sesión comienza | Cargar contexto, verificar entorno |
| `session.end` | La sesión termina | Limpieza, guardar estado |
| `file.write` | Antes de escribir un archivo | Validar contenido, formatear código |
| `file.read` | Antes de leer un archivo | Control de acceso, registro |
| `tool.execute.before` | Antes de ejecutar una herramienta | Verificaciones de permisos, validación |
| `tool.execute.after` | Después de ejecutar una herramienta | Post-procesamiento, registro |

---

## Estructura del Hook

```
.opencode/hooks/my-hook/
├── hook.json          # Hook configuration
├── scripts/
│   └── handler.py     # Hook script
└── examples/
    └── sample-input.json
```

### hook.json

```json
{
  "name": "validate-frontmatter",
  "description": "Validates YAML frontmatter in lesson files",
  "event": "file.write",
  "pattern": "content/courses/**/*.md",
  "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
  "blocking": true
}
```

| Campo | Descripción |
|-------|-------------|
| `name` | Identificador único |
| `description` | Qué hace el hook |
| `event` | Cuándo activar |
| `pattern` | Patrón de archivos a coincidir (glob) |
| `script` | Ruta al script manejador |
| `blocking` | Si es true, bloquea la operación en caso de fallo |

---

## Creando un Hook de Validación

### Paso 1: Crear Directorio

```bash
mkdir -p .opencode/hooks/validate-frontmatter/scripts
```

### Paso 2: Crear hook.json

```json
{
  "name": "validate-frontmatter",
  "description": "Validates YAML frontmatter in Markdown files",
  "event": "file.write",
  "pattern": "**/*.md",
  "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
  "blocking": true
}
```

### Paso 3: Crear Script Manejador

```python
#!/usr/bin/env python3
"""Validate YAML frontmatter in Markdown files.

Exit Codes:
    0 - Validation passed
    1 - Warning (non-blocking)
    2 - Validation failed (blocking)
"""
import os
import sys
import yaml
from pathlib import Path


def extract_frontmatter(content: str) -> tuple[str | None, str]:
    """Extract YAML frontmatter from Markdown content."""
    if not content.startswith("---"):
        return None, content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content

    return parts[1].strip(), parts[2]


def validate_frontmatter(frontmatter: str) -> list[str]:
    """Validate frontmatter structure and return errors."""
    errors = []

    try:
        data = yaml.safe_load(frontmatter)
    except yaml.YAMLError as e:
        return [f"Invalid YAML: {e}"]

    required_fields = ["title", "description", "order"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if "order" in data:
        if not isinstance(data["order"], int):
            errors.append("Field 'order' must be an integer")
        elif data["order"] < 1:
            errors.append("Field 'order' must be >= 1")

    return errors


def main() -> int:
    """Main hook entry point."""
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        print("WARNING: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 1

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"ERROR: Cannot read file: {e}", file=sys.stderr)
        return 2

    frontmatter, _ = extract_frontmatter(content)
    if frontmatter is None:
        print(f"WARNING: No frontmatter found in {file_path}")
        return 1

    errors = validate_frontmatter(frontmatter)
    if errors:
        for error in errors:
            print(f"VALIDATION ERROR: {error}", file=sys.stderr)
        return 2

    print(f"VALIDATION PASSED: {file_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Paso 4: Hacer el Script Ejecutable

```bash
chmod +x .opencode/hooks/validate-frontmatter/scripts/handler.py
```

---

## Registrando Hooks

Agrega hooks a `opencode.json`:

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-frontmatter",
        "pattern": "content/courses/**/*.md",
        "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
        "blocking": true
      }
    ],
    "session.start": [
      {
        "name": "load-context",
        "script": ".opencode/hooks/load-context/scripts/handler.py",
        "blocking": false
      }
    ]
  }
}
```

---

## Hooks de Protección

Los hooks de protección bloquean operaciones peligrosas:

```python
#!/usr/bin/env python3
"""Block writes to protected directories."""
import os
import sys
from pathlib import Path


PROTECTED_PATTERNS = [
    ".env",
    "secrets/**",
    "*.key",
    "*.pem",
]


def is_protected(path: Path) -> bool:
    """Check if path matches protected patterns."""
    from fnmatch import fnmatch

    path_str = str(path)
    for pattern in PROTECTED_PATTERNS:
        if fnmatch(path_str, pattern):
            return True
        if fnmatch(path.name, pattern):
            return True
    return False


def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        return 0

    path = Path(file_path)
    if is_protected(path):
        print(f"BLOCKED: Cannot write to protected file: {file_path}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

---

## Depuración de Hooks

### Habilitar Registro de Depuración

```bash
export OPENCODE_DEBUG=1
opencode
```

### Probar Hooks Manualmente

```bash
OPENCODE_FILE_PATH=test.md python .opencode/hooks/validate-frontmatter/scripts/handler.py
```

### Verificar Códigos de Salida

| Código | Significado | Acción |
|------|---------|--------|
| `0` | Aprobado | Continuar operación |
| `1` | Advertencia | Registrar, continuar |
| `2` | Bloqueado | Detener operación, mostrar error |

---

## Practice Questions

```question
{
  "id": "oc-hooks-q1",
  "type": "multiple-choice",
  "question": "What happens when a blocking hook returns exit code 2?",
  "options": [
    "Operation continues with warning",
    "Operation is blocked and error is shown",
    "Hook is skipped",
    "OpenCode crashes"
  ],
  "correct": 1,
  "explanation": "Exit code 2 blocks the operation and displays the error message to the user."
}
```

```question
{
  "id": "oc-hooks-q2",
  "type": "multiple-choice",
  "question": "Which hook event fires before a file is written?",
  "options": [
    "file.write",
    "file.save",
    "file.commit",
    "file.create"
  ],
  "correct": 0,
  "explanation": "The file.write event fires before a file is written, allowing validation or transformation."
}
```

```question
{
  "id": "oc-hooks-q3",
  "type": "multiple-choice",
  "question": "What field in hook.json specifies which files trigger the hook?",
  "options": [
    "filter",
    "match",
    "pattern",
    "glob"
  ],
  "correct": 2,
  "explanation": "The pattern field uses glob syntax to specify which files trigger the hook."
}
```

```question
{
  "id": "oc-hooks-q4",
  "type": "multiple-choice",
  "question": "How do you test a hook manually?",
  "options": [
    "Run opencode --test-hook",
    "Set OPENCODE_FILE_PATH and run the script directly",
    "Use the /hook-test command",
    "Add a test flag to hook.json"
  ],
  "correct": 1,
  "explanation": "Set the OPENCODE_FILE_PATH environment variable and run the handler script directly to test."
}
```

```question
{
  "id": "oc-hooks-q5",
  "type": "multiple-choice",
  "question": "What is a guard hook used for?",
  "options": [
    "Logging file operations",
    "Blocking dangerous operations",
    "Transforming content",
    "Loading context"
  ],
  "correct": 1,
  "explanation": "Guard hooks check for dangerous patterns and block operations that match protected files or commands."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Los hooks son scripts que se ejecutan automáticamente en puntos específicos del ciclo de vida
- El evento `file.write` es ideal para validar contenido antes de guardar
- Usa código de salida 0 para aprobado, 1 para advertencia, 2 para bloqueado
- Los hooks de protección safeguard archivos sensibles y operaciones peligrosas
- Los hooks se registran en `opencode.json` bajo la clave `hooks`
- El campo `pattern` usa sintaxis glob para coincidir con archivos
- Prueba los hooks manualmente configurando OPENCODE_FILE_PATH y ejecutando el script
