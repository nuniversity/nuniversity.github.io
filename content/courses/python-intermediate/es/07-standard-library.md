---
title: "La Biblioteca Estándar de Python"
description: "Inmersión profunda en os, sys, re, collections, itertools y functools — los módulos integrados de Python para el desarrollo diario"
order: 7
duration: "50 minutos"
difficulty: "intermedio"
---

# La Biblioteca Estándar de Python

La biblioteca estándar de Python es famosamente completa — "baterías incluidas". Estos módulos están disponibles en cada instalación de Python y resuelven una amplia gama de problemas comunes.

## `os` — Interfaz del Sistema Operativo

```python
import os

# Directorio de trabajo actual
cwd = os.getcwd()

# Listar contenido del directorio
entries = os.listdir(".")

# Crear/eliminar directorios
os.makedirs("a/b/c", exist_ok=True)
os.rmdir("a/b/c")     # Debe estar vacío
os.removedirs("a/b")  # Elimina hoja y padres vacíos

# Información del archivo
stat_info = os.stat("file.txt")
print(stat_info.st_size)      # Tamaño del archivo en bytes
print(stat_info.st_mtime)     # Timestamp de última modificación

# Variables de entorno
print(os.environ.get("HOME"))
os.environ["MY_VAR"] = "value"

# Operaciones de ruta (legado — prefiere pathlib)
full_path = os.path.join("dir", "subdir", "file.txt")
base = os.path.basename("/path/to/file.txt")     # file.txt
dir_name = os.path.dirname("/path/to/file.txt")  # /path/to
name, ext = os.path.splitext("data.csv")         # ("data", ".csv")
```

> [!NOTE]
> Python 3.4+ recomienda `pathlib.Path` sobre `os.path` para la mayoría de operaciones de ruta. Es más intuitivo y multiplataforma.

## `sys` — Parámetros Específicos del Sistema

```python
import sys

# Argumentos de línea de comandos
print(f"Script: {sys.argv[0]}")
print(f"Args: {sys.argv[1:]}")

# Versión de Python
print(f"Python {sys.version}")
print(f"Major: {sys.version_info.major}")

# Salir del programa con código de estado
sys.exit(0)   # Éxito
sys.exit(1)   # Error

# Búsqueda de ruta
print(sys.path)  # Lista de directorios de búsqueda de importación

# Streams estándar
sys.stdout.write("Output to stdout\n")
sys.stderr.write("Error message\n")

# Tamaño de memoria de un objeto
print(sys.getsizeof([1, 2, 3]))  # 120 (aprox., varía según Python/build)

# Límite de recursión
print(sys.getrecursionlimit())   # 1000 predeterminado
sys.setrecursionlimit(5000)      # Aumentar (usar con cuidado)
```

## `re` — Expresiones Regulares

```python
import re

# Coincidencia básica
pattern = r"\d+"  # Uno o más dígitos
text = "Order 42: 12 items at $3.99"

match = re.search(pattern, text)
if match:
    print(match.group())  # 42
    print(match.start())  # 6
    print(match.end())    # 8

# Encontrar todas las coincidencias
prices = re.findall(r"\d+\.?\d*", text)
print(prices)  # ['42', '12', '3', '99']  (nota: 3.99 divide)

# Mejor: capturar decimal completo
prices = re.findall(r"\d+\.\d+|\d+", text)
print(prices)  # ['42', '12', '3.99']
```

```python
import re

# Sustitución
cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", "Hello, World! #2024")
print(cleaned)  # "Hello World 2024"

# Compilación (para uso repetido)
email_pattern = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
emails = ["alice@example.com", "bob@bad", "carol@test.org"]
valid = [e for e in emails if email_pattern.search(e)]
print(valid)  # ['alice@example.com', 'carol@test.org']

# Grupos nombrados
log_line = "2024-01-15 10:30:45 ERROR: Connection timeout"
pattern = r"(?P<date>\S+)\s+(?P<time>\S+)\s+(?P<level>\w+):\s+(?P<message>.+)"
m = re.match(pattern, log_line)
print(m.groupdict())
# {'date': '2024-01-15', 'time': '10:30:45', 'level': 'ERROR', 'message': 'Connection timeout'}
```

| Patrón | Significado |
|--------|-------------|
| `\d` | Dígito (0-9) |
| `\w` | Carácter de palabra (letra, dígito, guión bajo) |
| `\s` | Espacio en blanco (espacio, tab, nueva línea) |
| `.` | Cualquier carácter excepto nueva línea |
| `*` | Cero o más |
| `+` | Uno o más |
| `?` | Cero o uno (también hace `*`, `+` no codiciosos) |
| `{n,m}` | Entre n y m repeticiones |
| `^` | Inicio de cadena |
| `$` | Fin de cadena |
| `[abc]` | Clase de carácter (a, b o c) |
| `(.*)` | Grupo de captura |

> [!WARNING]
> Usa cadenas raw (`r"pattern"`) para patrones regex para evitar escapar barras invertidas. `r"\d"` es correcto; `"\\d"` también funciona pero es feo.

## `collections` — Estructuras de Datos Especializadas

### Counter

```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counter = Counter(words)
print(counter)                # Counter({'apple': 3, 'banana': 2, 'cherry': 1})
print(counter["apple"])       # 3
print(counter["orange"])      # 0 (¡sin KeyError!)

# Más comunes
print(counter.most_common(2))  # [('apple', 3), ('banana', 2)]

# Aritmética
counter2 = Counter(["apple", "date"])
print(counter + counter2)     # Counter({'apple': 4, 'banana': 2, 'cherry': 1, 'date': 1})
```

### defaultdict

```python
from collections import defaultdict

# Agrupar elementos por categoría
data = [("fruit", "apple"), ("fruit", "banana"), ("color", "red"), ("fruit", "cherry")]
groups = defaultdict(list)
for category, item in data:
    groups[category].append(item)

print(groups["fruit"])   # ['apple', 'banana', 'cherry']
print(groups["color"])   # ['red']
print(groups["unknown"])  # [] — ¡sin KeyError!

# defaultdict anidado
nested = defaultdict(lambda: defaultdict(int))
nested["alice"]["apples"] += 1
nested["bob"]["bananas"] += 2
```

> [!NOTE]
> `defaultdict` nunca lanza `KeyError` — las claves ausentes se crean automáticamente usando la función de fábrica. Perfecto para agrupar y contar.

### namedtuple

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 5)
print(p.x, p.y)       # 3 5
print(p[0], p[1])     # 3 5 (la indexación de tupla también funciona)
x, y = p              # Desempaquetado de tupla

# Convertir a dict
print(p._asdict())    # {'x': 3, 'y': 5}

# Crear nueva instancia con campo cambiado
p2 = p._replace(x=10)
print(p2)             # Point(x=10, y=5)

# Sugerencias de tipo con namedtuple
from typing import NamedTuple

class Employee(NamedTuple):
    name: str
    id: int
    salary: float

e = Employee("Alice", 123, 75000.0)
print(e.name, e.salary)  # Alice 75000.0
```

## `itertools` — Herramientas de Iterador

```python
from itertools import count, cycle, repeat, chain, product, permutations, combinations, groupby, accumulate, islice

# Iteradores infinitos
for i in count(10, 2):   # 10, 12, 14, ...
    if i > 20: break

# Cycle
colors = cycle(["red", "green", "blue"])
print([next(colors) for _ in range(5)])  # ['red', 'green', 'blue', 'red', 'green']

# Chain
combined = chain([1, 2], [3, 4], "ab")
print(list(combined))  # [1, 2, 3, 4, 'a', 'b']

# Product (cartesiano)
print(list(product("AB", [1, 2])))   # [('A', 1), ('A', 2), ('B', 1), ('B', 2)]

# Permutations
print(list(permutations("ABC", 2)))  # [('A','B'), ('A','C'), ('B','A'), ('B','C'), ('C','A'), ('C','B')]

# Combinations
print(list(combinations("ABC", 2)))  # [('A','B'), ('A','C'), ('B','C')]

# Accumulate
print(list(accumulate([1, 2, 3, 4])))  # [1, 3, 6, 10]
print(list(accumulate([1, 2, 3, 4], lambda a, b: a * b)))  # [1, 2, 6, 24]
```

```python
from itertools import islice, groupby

# Rebanando un iterador
iterator = iter(range(1000))
first_10 = list(islice(iterator, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# groupby (requiere datos ordenados)
data = [("fruit", "apple"), ("fruit", "banana"), ("animal", "dog")]
data.sort(key=lambda x: x[0])  # ¡Debe ordenar primero!
for key, group in groupby(data, key=lambda x: x[0]):
    print(f"{key}: {list(group)}")
```

## `functools` — Funciones de Orden Superior

```python
from functools import partial, lru_cache, reduce, wraps

# partial — congelar argumentos
def power(base: float, exponent: float) -> float:
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)
print(square(5))  # 25
print(cube(5))    # 125

# lru_cache — memoización
@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(100))  # 354224848179261915075 (¡instantáneo!)
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)

# reduce — acumular desde la izquierda
from functools import reduce
product = reduce(lambda a, b: a * b, [1, 2, 3, 4, 5])
print(product)  # 120
```

> [!SUCCESS]
| Módulo | Mejor Para |
|--------|------------|
| `os` | Interacción con SO (variables de entorno, proceso, sistema de archivos) |
| `sys` | Runtime de Python (versión, path, argv, salida) |
| `re` | Coincidencia y extracción de patrones de texto |
| `collections` | Tipos especializados de dict/list/tuple |
| `itertools` | Álgebra de iteradores (herramientas combinatorias perezosas) |
| `functools` | Manipulación de funciones (cache, partial, reduce) |

## Mundo Real: Analizador de Archivos de Registro

```python
import re
from collections import Counter, defaultdict
from pathlib import Path

def analyze_logs(log_path: str) -> dict:
    pattern = re.compile(
        r"(?P<ip>\d+\.\d+\.\d+\.\d+) .* "
        r"\[(?P<timestamp>[^\]]+)\] "
        r'"(?P<method>\w+) (?P<path>\S+) .*" '
        r"(?P<status>\d{3})"
    )

    status_counts = Counter()
    paths_by_ip = defaultdict(list)

    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            m = pattern.search(line)
            if m:
                data = m.groupdict()
                status_counts[data["status"]] += 1
                paths_by_ip[data["ip"]].append(data["path"])

    return {
        "total_requests": sum(status_counts.values()),
        "status_distribution": dict(status_counts),
        "most_active_ips": Counter({ip: len(paths) for ip, paths in paths_by_ip.items()}).most_common(5),
    }

result = analyze_logs("/var/log/nginx/access.log")
print(f"Total: {result['total_requests']}")
print(f"Statuses: {result['status_distribution']}")
print(f"Top IPs: {result['most_active_ips']}")
```

## Mundo Real: Pipeline de Datos con itertools

```python
from itertools import islice, chain, groupby
import csv

def process_batches(filename: str, batch_size: int = 100):
    with open(filename, "r", newline="") as f:
        reader = csv.DictReader(f)
        while True:
            batch = list(islice(reader, batch_size))
            if not batch:
                break
            yield from process_batch(batch)

def process_batch(rows: list[dict]) -> list[dict]:
    results = []
    for row in rows:
        row["total"] = float(row.get("price", 0)) * int(row.get("quantity", 0))
        results.append(row)
    return results

for item in process_batches("large_orders.csv", 500):
    print(f"Processed {item['id']}: ${item['total']:.2f}")
```

> [!WARNING]
> `itertools.groupby` solo agrupa elementos consecutivos. Ordena tus datos por la clave de agrupación primero, o usa `defaultdict` para agrupación no consecutiva.

## Preguntas de Práctica

1. ¿Cómo obtienes todas las variables de entorno usando `os.environ`? ¿Cómo obtienes una específica de forma segura?
2. Escribe una regex que valide un formato de teléfono estadounidense: `(123) 456-7890`.
3. ¿Cuál es la diferencia entre `re.search()` y `re.match()`?
4. Usa `collections.Counter` para encontrar la palabra más común en una frase.
5. ¿Cuándo usarías `namedtuple` en lugar de una clase regular? ¿Cuándo usarías `dict` en su lugar?
6. Escribe código usando `itertools.product` para generar todas las combinaciones posibles de 3 letras de "ABC".
7. ¿Qué hace `functools.lru_cache` y cuándo deberías usarlo?
8. Usa `itertools.chain` para aplanar `[[1, 2], [3, 4], [5]]` en `[1, 2, 3, 4, 5]`.
9. ¿Cómo difiere `collections.defaultdict` de un `dict` regular?
10. Escribe una función usando `functools.partial` que cree un conversor `to_celsius` a partir de un conversor de temperatura general.
