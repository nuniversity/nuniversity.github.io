---
title: "Módulos, Paquetes y Librería Estándar"
description: "Organiza el código con módulos y paquetes, explora la rica librería estándar de Python y aprende a usar paquetes de terceros"
order: 10
duration: "30 minutos"
difficulty: "beginner"
---

# Módulos, Paquetes y Librería Estándar

A medida que los programas crecen, necesitas organizar el código en archivos separados. Python usa módulos (archivos) y paquetes (directorios) para esto.

## Módulos

Un módulo es simplemente un archivo `.py`:

```python
# utils.py
def greet(name):
    return f"Hello, {name}"

PI = 3.14159

class Circle:
    def __init__(self, radius):
        self.radius = radius
```

Impórtalo en otro archivo:

```python
# main.py
import utils

print(utils.greet("Alice"))       # "Hello, Alice"
print(utils.PI)                   # 3.14159
circle = utils.Circle(5)
```

### Estilos de Importación

```python
import math                    # Importar módulo completo
from math import sqrt          # Importar elementos específicos
from math import *             # Importar todo (¡evitar!)
import math as m               # Alias
from math import sqrt as s     # Alias específico
```

> [!NOTE]
| Forma | Cuándo Usarla |
|---|---|
| `import module` | Usar muchos elementos de un módulo |
| `from module import item` | Usar uno o dos elementos |
| `import module as alias` | Nombre del módulo es largo o conflictivo |

## Paquetes

Un paquete es un directorio que contiene `__init__.py` (puede estar vacío):

```
my_project/
├── main.py
└── shapes/
    ├── __init__.py
    ├── circle.py
    └── rectangle.py
```

```python
# shapes/circle.py
def area(radius):
    return 3.14159 * radius ** 2
```

```python
# main.py
from shapes import circle
print(circle.area(5))
```

## Librería Estándar de Python

La filosofía "baterías incluidas" de Python significa una rica librería estándar:

### Math
```python
import math
print(math.sqrt(16))      # 4.0
print(math.pi)            # 3.14159...
print(math.floor(3.7))    # 3
print(math.ceil(3.2))     # 4
```

### Random
```python
import random
print(random.randint(1, 10))       # Entero aleatorio 1-10
print(random.choice(["a", "b", "c"]))  # Elemento aleatorio
items = [1, 2, 3, 4, 5]
random.shuffle(items)              # Mezclar in situ
```

### Datetime
```python
from datetime import datetime, date

now = datetime.now()
print(now)                       # Fecha/hora actual
print(now.strftime("%Y-%m-%d"))  # Cadena formateada
birthday = date(2025, 12, 25)
print(birthday)                  # 2025-12-25
```

### OS y Operaciones de Archivos
```python
import os
print(os.getcwd())           # Directorio actual
os.mkdir("new_folder")       # Crear directorio
print(os.listdir("."))       # Listar archivos
```

### JSON
```python
import json

data = {"name": "Alice", "age": 25}
json_str = json.dumps(data)       # Serializar a cadena
parsed = json.loads(json_str)     # Parsear de vuelta a dict
```

## Usando Paquetes de Terceros con pip

```python
# Instalar
pip install requests

# Usar
import requests
response = requests.get("https://api.github.com")
data = response.json()
print(data)
```

## El Patrón `if __name__ == "__main__"`

Permite que un archivo sea tanto importado como ejecutado:

```python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

if __name__ == "__main__":
    # Esto se ejecuta solo cuando el archivo se ejecuta directamente
    print("Testing calculator:")
    print(f"3 + 5 = {add(3, 5)}")
    print(f"10 - 4 = {subtract(10, 4)}")
```

```bash
python calculator.py  # Ejecuta el código de prueba
```

```python
# other.py
import calculator     # NO ejecuta el código de prueba
```

## Ejemplo del Mundo Real: Script de Análisis de Datos

```python
# analyze.py
import csv
import json
from collections import Counter
from datetime import datetime

def load_data(filename: str) -> list[dict]:
    with open(filename, "r") as f:
        return list(csv.DictReader(f))

def analyze_sales(data: list[dict]) -> dict:
    total = sum(float(row["amount"]) for row in data)
    categories = Counter(row["category"] for row in data)
    return {"total": total, "categories": dict(categories)}

if __name__ == "__main__":
    sales = load_data("sales.csv")
    report = analyze_sales(sales)
    print(json.dumps(report, indent=2))
```

> [!SUCCESS]
| Concepto | Qué Es | Archivo |
|---|---|---|
| Módulo | Archivo `.py` individual | `utils.py` |
| Paquete | Directorio de módulos | `shapes/` |
| Librería Estándar | Módulos incorporados | `import math` |
| Terceros | Paquetes externos | `pip install requests` |

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre un módulo y un paquete?
2. ¿Cómo importas una función específica desde un módulo?
3. ¿Cuál es el propósito de `__init__.py`?
4. Genera un número aleatorio entre 1 y 100.
5. ¿Cómo obtienes la fecha y hora actual?
6. ¿Qué hace `if __name__ == "__main__":`?
7. Convierte un dict de Python a una cadena JSON.
8. ¿Cómo instalas un paquete de terceros?
9. ¿Por qué deberías evitar `from module import *`?
10. Escribe un módulo con dos funciones y pruébalo usando `__name__`.
