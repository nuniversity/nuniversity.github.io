---
title: "Tu Primera Sesión de Codificación con IA"
description: "Recorre una sesión completa de codificación asistida por IA usando OpenCode. Aprende a hacer preguntas, revisar sugerencias de código y aplicar cambios a tu proyecto."
order: 3
duration: "45 min"
difficulty: "beginner"
---

# Tu Primera Sesión de Codificación con IA

## Iniciar una Sesión

Lanza OpenCode en el directorio de tu proyecto:

```bash
cd your-project
opencode
```

El agente de IA detectará automáticamente el tipo de proyecto y proporcionará asistencia relevante.

---

## Comprendiendo la Interfaz

```
OpenCode v1.x.x
Connected to: gpt-4o
Project: your-project
>
```

| Elemento | Descripción |
|---------|-------------|
| `>` prompt | Listo para tu entrada |
| `Connected to:` | Muestra el proveedor LLM activo |
| `Project:` | Directorio de trabajo actual |

### Comandos de Entrada

| Comando | Acción |
|---------|--------|
| Escribir mensaje | Enviar a IA |
| `/help` | Mostrar comandos disponibles |
| `/quit` o `/exit` | Salir de OpenCode |
| `/clear` | Limpiar conversación |
| `/history` | Mostrar historial de conversación |

---

## Sesión de Ejemplo: Corrigiendo un Error

Recorramos un escenario del mundo real — corrigiendo un error en una función de Python.

### Paso 1: Describe el Problema

```
> Tengo una función que calcula el promedio de una lista, pero está devolviendo 
  resultados incorrectos para listas vacías. ¿Puedes ayudarme a corregirla?
```

### Paso 2: Comparte el Código

```
> Aquí está la función:
  
  def calculate_average(numbers):
      total = sum(numbers)
      return total / len(numbers)
```

### Paso 3: Obtén la Corrección

La IA analizará tu código y sugerirá:

```
El problema es que dividir por cero (cuando la lista está vacía) lanza un 
ZeroDivisionError. Aquí está la versión corregida:

def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
```

### Paso 4: Aplica el Cambio

```
> ¿Puedes aplicar esta corrección a mi archivo en src/utils.py?
```

OpenCode usará la herramienta `edit` para actualizar tu archivo.

---

## Trabajando con Archivos

### Leyendo Archivos

```
> Lee el contenido de src/main.py
```

OpenCode usa la herramienta `read` para obtener el contenido de los archivos y mostrarlo.

### Buscando Archivos

```
> Encuentra todos los archivos Python que importan requests
```

OpenCode usa `grep` para buscar contenido de archivos.

```
> Encuentra todos los archivos de configuración en este proyecto
```

OpenCode usa `glob` para encontrar archivos por patrón.

### Creando Archivos

```
> Crea un nuevo archivo Python en src/helpers.py con una función para validar direcciones de correo electrónico
```

OpenCode usa la herramienta `write` para crear nuevos archivos.

---

## Mejores Prácticas para Indicaciones

### Sé Específico

| ❌ Vago | ✅ Específico |
|----------|------------|
| "Corrige mi código" | "Corrige el ZeroDivisionError en calculate_average() cuando la lista está vacía" |
| "Agrega una función" | "Agrega una función Python que valide direcciones de correo electrónico usando regex" |
| "Optimiza esto" | "Optimiza esta consulta SQL para usar un índice en lugar de un escaneo completo de tabla" |

### Proporciona Contexto

```
> Estoy trabajando en una API REST de Django. El modelo User tiene campos: id, email, 
  name, created_at. Necesito una función para verificar si un usuario está activo 
  (creado dentro de los últimos 30 días).
```

### Haz Preguntas de Seguimiento

```
> ¿Puedes explicar por qué usaste datetime.timedelta en lugar de dateutil.relativedelta?
```

---

## Usando Herramientas Efectivamente

### La Herramienta read

```
> Lee src/config.py y explica qué hace cada configuración
```

### La Herramienta bash

```
> Ejecuta las pruebas en mi proyecto usando pytest
```

### La Herramienta grep

```
> Busca todos los comentarios TODO en el código fuente
```

### La Herramienta glob

```
> Encuentra todos los archivos JavaScript en el directorio src/components
```

---

## Manejando Errores

### Cuando la IA No Entiende

```
> Necesito hacer que la cosa mejore
```

Si la IA pide clarificación, proporciona más detalles:

```
> Lo siento, quiero decir que necesito optimizar la consulta de base de datos en UserViewSet 
  para reducir el número de consultas de 5 a 1.
```

### Cuando la IA Comete Errores

```
> Eso no es del todo correcto. La función debería devolver una tupla de (promedio, conteo), 
  no solo el promedio.
```

---

## Guardando y Cargando Sesiones

### Guardar Sesión

```
> /save my-session
```

### Cargar Sesión

```
> /load my-session
```

### Ver Historial

```
> /history
```

---

## Practice Questions

```question
{
  "id": "oc-first-q1",
  "type": "multiple-choice",
  "question": "¿Qué comando limpia el historial de conversación en OpenCode?",
  "options": [
    "/clear",
    "/reset",
    "/new",
    "/empty"
  ],
  "correct": 0,
  "explanation": "El comando /clear limpia la conversación actual mientras mantiene la sesión."
}
```

```question
{
  "id": "oc-first-q2",
  "type": "multiple-choice",
  "question": "¿Qué herramienta usa OpenCode para buscar patrones de texto en archivos?",
  "options": [
    "bash",
    "read",
    "grep",
    "glob"
  ],
  "correct": 2,
  "explanation": "La herramienta grep busca contenido de archivos usando expresiones regulares, haciéndola ideal para encontrar patrones de texto como comentarios TODO."
}
```

```question
{
  "id": "oc-first-q3",
  "type": "multiple-choice",
  "question": "¿Cuál es la mejor manera de pedir a OpenCode que corrija un error específico?",
  "options": [
    "Corrige mi código",
    "Corrige el ZeroDivisionError en calculate_average() cuando la lista está vacía",
    "Haz que funcione",
    "Depura esto"
  ],
  "correct": 1,
  "explanation": "Las indicaciones específicas que incluyen el tipo de error, nombre de función y condiciones esperadas ayudan a la IA a proporcionar correcciones precisas."
}
```

```question
{
  "id": "oc-first-q4",
  "type": "multiple-choice",
  "question": "¿Qué herramienta crea nuevos archivos en OpenCode?",
  "options": [
    "read",
    "write",
    "edit",
    "bash"
  ],
  "correct": 1,
  "explanation": "La herramienta write crea nuevos archivos o sobrescribe completamente los existentes con nuevo contenido."
}
```

```question
{
  "id": "oc-first-q5",
  "type": "multiple-choice",
  "question": "¿Cómo sale de una sesión de OpenCode?",
  "options": [
    "Ctrl+C",
    "/quit o /exit",
    "/stop",
    "close"
  ],
  "correct": 1,
  "explanation": "Use los comandos /quit o /exit para salir elegantemente de una sesión de OpenCode."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Inicie OpenCode en el directorio de su proyecto para asistencia consciente del contexto
- Sea específico en sus indicaciones — incluya tipos de errores, nombres de archivos y comportamiento esperado
- OpenCode usa herramientas (read, write, edit, grep, glob, bash) para interactuar con su proyecto
- Puede guardar y cargar sesiones para continuidad
- Haga preguntas de seguimiento para comprear el razonamiento de la IA
- La IA pedirá clarificación cuando las indicaciones sean demasiado vagas