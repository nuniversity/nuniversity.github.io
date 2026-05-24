---
title: "A Biblioteca Padrão do Python"
description: "Mergulho profundo em os, sys, re, collections, itertools e functools — módulos embutidos do Python para o desenvolvimento diário"
order: 7
duration: "50 minutos"
difficulty: "intermediário"
---

# A Biblioteca Padrão do Python

A biblioteca padrão do Python é famosamente abrangente — "baterias incluídas". Estes módulos estão disponíveis em toda instalação Python e resolvem uma vasta gama de problemas comuns.

## `os` — Interface do Sistema Operacional

```python
import os

# Diretório de trabalho atual
cwd = os.getcwd()

# Listar conteúdo do diretório
entries = os.listdir(".")

# Criar/remover diretórios
os.makedirs("a/b/c", exist_ok=True)
os.rmdir("a/b/c")     # Deve estar vazio
os.removedirs("a/b")  # Remove folha e pais vazios

# Informações do arquivo
stat_info = os.stat("file.txt")
print(stat_info.st_size)      # Tamanho do arquivo em bytes
print(stat_info.st_mtime)     # Timestamp da última modificação

# Variáveis de ambiente
print(os.environ.get("HOME"))
os.environ["MY_VAR"] = "value"

# Operações de caminho (legado — prefira pathlib)
full_path = os.path.join("dir", "subdir", "file.txt")
base = os.path.basename("/path/to/file.txt")     # file.txt
dir_name = os.path.dirname("/path/to/file.txt")  # /path/to
name, ext = os.path.splitext("data.csv")         # ("data", ".csv")
```

> [!NOTE]
> Python 3.4+ recomenda `pathlib.Path` em vez de `os.path` para a maioria das operações de caminho. É mais intuitivo e multiplataforma.

## `sys` — Parâmetros Específicos do Sistema

```python
import sys

# Argumentos da linha de comando
print(f"Script: {sys.argv[0]}")
print(f"Args: {sys.argv[1:]}")

# Versão do Python
print(f"Python {sys.version}")
print(f"Major: {sys.version_info.major}")

# Sair do programa com código de status
sys.exit(0)   # Sucesso
sys.exit(1)   # Erro

# Pesquisa de caminho
print(sys.path)  # Lista de diretórios de pesquisa de importação

# Streams padrão
sys.stdout.write("Output to stdout\n")
sys.stderr.write("Error message\n")

# Tamanho de memória de um objeto
print(sys.getsizeof([1, 2, 3]))  # 120 (aprox., varia por Python/build)

# Limite de recursão
print(sys.getrecursionlimit())   # 1000 padrão
sys.setrecursionlimit(5000)      # Aumentar (usar com cuidado)
```

## `re` — Expressões Regulares

```python
import re

# Correspondência básica
pattern = r"\d+"  # Um ou mais dígitos
text = "Order 42: 12 items at $3.99"

match = re.search(pattern, text)
if match:
    print(match.group())  # 42
    print(match.start())  # 6
    print(match.end())    # 8

# Encontrar todas as correspondências
prices = re.findall(r"\d+\.?\d*", text)
print(prices)  # ['42', '12', '3', '99']  (nota: 3.99 divide)

# Melhor: capturar decimal completo
prices = re.findall(r"\d+\.\d+|\d+", text)
print(prices)  # ['42', '12', '3.99']
```

```python
import re

# Substituição
cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", "Hello, World! #2024")
print(cleaned)  # "Hello World 2024"

# Compilação (para uso repetido)
email_pattern = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
emails = ["alice@example.com", "bob@bad", "carol@test.org"]
valid = [e for e in emails if email_pattern.search(e)]
print(valid)  # ['alice@example.com', 'carol@test.org']

# Grupos nomeados
log_line = "2024-01-15 10:30:45 ERROR: Connection timeout"
pattern = r"(?P<date>\S+)\s+(?P<time>\S+)\s+(?P<level>\w+):\s+(?P<message>.+)"
m = re.match(pattern, log_line)
print(m.groupdict())
# {'date': '2024-01-15', 'time': '10:30:45', 'level': 'ERROR', 'message': 'Connection timeout'}
```

| Padrão | Significado |
|--------|-------------|
| `\d` | Dígito (0-9) |
| `\w` | Caractere de palavra (letra, dígito, sublinhado) |
| `\s` | Espaço em branco (espaço, tab, nova linha) |
| `.` | Qualquer caractere exceto nova linha |
| `*` | Zero ou mais |
| `+` | Um ou mais |
| `?` | Zero ou um (também torna `*`, `+` não-guloso) |
| `{n,m}` | Entre n e m repetições |
| `^` | Início da string |
| `$` | Fim da string |
| `[abc]` | Classe de caractere (a, b ou c) |
| `(.*)` | Grupo de captura |

> [!WARNING]
> Use strings raw (`r"pattern"`) para padrões regex para evitar escapar barras invertidas. `r"\d"` está correto; `"\\d"` também funciona mas é feio.

## `collections` — Estruturas de Dados Especializadas

### Counter

```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counter = Counter(words)
print(counter)                # Counter({'apple': 3, 'banana': 2, 'cherry': 1})
print(counter["apple"])       # 3
print(counter["orange"])      # 0 (sem KeyError!)

# Mais comuns
print(counter.most_common(2))  # [('apple', 3), ('banana', 2)]

# Aritmética
counter2 = Counter(["apple", "date"])
print(counter + counter2)     # Counter({'apple': 4, 'banana': 2, 'cherry': 1, 'date': 1})
```

### defaultdict

```python
from collections import defaultdict

# Agrupar itens por categoria
data = [("fruit", "apple"), ("fruit", "banana"), ("color", "red"), ("fruit", "cherry")]
groups = defaultdict(list)
for category, item in data:
    groups[category].append(item)

print(groups["fruit"])   # ['apple', 'banana', 'cherry']
print(groups["color"])   # ['red']
print(groups["unknown"])  # [] — sem KeyError!

# defaultdict aninhado
nested = defaultdict(lambda: defaultdict(int))
nested["alice"]["apples"] += 1
nested["bob"]["bananas"] += 2
```

> [!NOTE]
> `defaultdict` nunca levanta `KeyError` — chaves ausentes são criadas automaticamente usando a função de fábrica. Perfeito para agrupar e contar.

### namedtuple

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 5)
print(p.x, p.y)       # 3 5
print(p[0], p[1])     # 3 5 (indexação de tupla também funciona)
x, y = p              # Desempacotamento de tupla

# Converter para dict
print(p._asdict())    # {'x': 3, 'y': 5}

# Criar nova instância com campo alterado
p2 = p._replace(x=10)
print(p2)             # Point(x=10, y=5)

# Dicas de tipo com namedtuple
from typing import NamedTuple

class Employee(NamedTuple):
    name: str
    id: int
    salary: float

e = Employee("Alice", 123, 75000.0)
print(e.name, e.salary)  # Alice 75000.0
```

## `itertools` — Ferramentas de Iterador

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

# Fatiando um iterador
iterator = iter(range(1000))
first_10 = list(islice(iterator, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# groupby (requer dados ordenados)
data = [("fruit", "apple"), ("fruit", "banana"), ("animal", "dog")]
data.sort(key=lambda x: x[0])  # Deve ordenar primeiro!
for key, group in groupby(data, key=lambda x: x[0]):
    print(f"{key}: {list(group)}")
```

## `functools` — Funções de Ordem Superior

```python
from functools import partial, lru_cache, reduce, wraps

# partial — congelar argumentos
def power(base: float, exponent: float) -> float:
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)
print(square(5))  # 25
print(cube(5))    # 125

# lru_cache — memoização
@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(100))  # 354224848179261915075 (instantâneo!)
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)

# reduce — acumular da esquerda
from functools import reduce
product = reduce(lambda a, b: a * b, [1, 2, 3, 4, 5])
print(product)  # 120
```

> [!SUCCESS]
| Módulo | Melhor Para |
|--------|-------------|
| `os` | Interação com SO (variáveis de ambiente, processo, sistema de arquivos) |
| `sys` | Runtime Python (versão, path, argv, saída) |
| `re` | Correspondência e extração de padrões de texto |
| `collections` | Tipos especializados de dict/list/tuple |
| `itertools` | Álgebra de iteradores (ferramentas combinatórias preguiçosas) |
| `functools` | Manipulação de funções (cache, partial, reduce) |

## Mundo Real: Analisador de Arquivos de Log

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

## Mundo Real: Pipeline de Dados com itertools

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
> `itertools.groupby` apenas agrupa elementos consecutivos. Ordene seus dados pela chave de agrupamento primeiro, ou use `defaultdict` para agrupamento não consecutivo.

## Perguntas de Prática

1. Como você obtém todas as variáveis de ambiente usando `os.environ`? Como obter uma específica com segurança?
2. Escreva uma regex que valide um formato de telefone dos EUA: `(123) 456-7890`.
3. Qual é a diferença entre `re.search()` e `re.match()`?
4. Use `collections.Counter` para encontrar a palavra mais comum em uma frase.
5. Quando você usaria `namedtuple` em vez de uma classe regular? Quando usaria `dict` em vez disso?
6. Escreva código usando `itertools.product` para gerar todas as combinações possíveis de 3 letras de "ABC".
7. O que `functools.lru_cache` faz e quando você deve usá-lo?
8. Use `itertools.chain` para achatar `[[1, 2], [3, 4], [5]]` em `[1, 2, 3, 4, 5]`.
9. Como `collections.defaultdict` difere de um `dict` regular?
10. Escreva uma função usando `functools.partial` que cria um conversor `to_celsius` a partir de um conversor de temperatura geral.
