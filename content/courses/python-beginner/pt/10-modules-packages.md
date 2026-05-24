---
title: "Módulos, Pacotes e Biblioteca Padrão"
description: "Organize código com módulos e pacotes, explore a rica biblioteca padrão do Python e aprenda a usar pacotes de terceiros"
order: 10
duration: "30 minutos"
difficulty: "iniciante"
---

# Módulos, Pacotes e Biblioteca Padrão

Conforme os programas crescem, você precisa organizar o código em arquivos separados. Python usa módulos (arquivos) e pacotes (diretórios) para isso.

## Módulos

Um módulo é simplesmente um arquivo `.py`:

```python
# utils.py
def greet(name):
    return f"Hello, {name}"

PI = 3.14159

class Circle:
    def __init__(self, radius):
        self.radius = radius
```

Importe-o em outro arquivo:

```python
# main.py
import utils

print(utils.greet("Alice"))       # "Hello, Alice"
print(utils.PI)                   # 3.14159
circle = utils.Circle(5)
```

### Estilos de Importação

```python
import math                    # Importar módulo inteiro
from math import sqrt          # Importar itens específicos
from math import *             # Importar tudo (evite!)
import math as m               # Apelido
from math import sqrt as s     # Apelido específico
```

> [!NOTE]
| Forma | Quando Usar |
|------|-------------|
| `import module` | Usando muitos itens de um módulo |
| `from module import item` | Usando um ou dois itens |
| `import module as alias` | Nome do módulo é longo ou conflita |

## Pacotes

Um pacote é um diretório contendo `__init__.py` (pode estar vazio):

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

## Biblioteca Padrão do Python

A filosofia "baterias incluídas" do Python significa uma rica biblioteca padrão:

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
print(random.randint(1, 10))       # Inteiro aleatório 1-10
print(random.choice(["a", "b", "c"]))  # Elemento aleatório
items = [1, 2, 3, 4, 5]
random.shuffle(items)              # Embaralhar no lugar
```

### Datetime
```python
from datetime import datetime, date

now = datetime.now()
print(now)                       # Data/hora atual
print(now.strftime("%Y-%m-%d"))  # String formatada
birthday = date(2025, 12, 25)
print(birthday)                  # 2025-12-25
```

### Operações com OS e Arquivos
```python
import os
print(os.getcwd())           # Diretório atual
os.mkdir("new_folder")       # Criar diretório
print(os.listdir("."))       # Listar arquivos
```

### JSON
```python
import json

data = {"name": "Alice", "age": 25}
json_str = json.dumps(data)       # Serializar para string
parsed = json.loads(json_str)     # Analisar de volta para dicionário
```

## Usando Pacotes de Terceiros com pip

```python
# Instalar
pip install requests

# Usar
import requests
response = requests.get("https://api.github.com")
data = response.json()
print(data)
```

## O Padrão `if __name__ == "__main__"`

Permite que um arquivo seja tanto importado quanto executado:

```python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

if __name__ == "__main__":
    # Isto executa apenas quando o arquivo é executado diretamente
    print("Testing calculator:")
    print(f"3 + 5 = {add(3, 5)}")
    print(f"10 - 4 = {subtract(10, 4)}")
```

```bash
python calculator.py  # Executa o código de teste
```

```python
# other.py
import calculator     # NÃO executa o código de teste
```

## Exemplo Real: Script de Análise de Dados

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
| Conceito | O que É | Arquivo |
|---------|------------|------|
| Módulo | Arquivo `.py` único | `utils.py` |
| Pacote | Diretório de módulos | `shapes/` |
| Biblioteca Padrão | Módulos embutidos | `import math` |
| Terceiros | Pacotes externos | `pip install requests` |

## Perguntas de Prática

1. Qual a diferença entre um módulo e um pacote?
2. Como importar uma função específica de um módulo?
3. Qual o propósito do `__init__.py`?
4. Gere um número aleatório entre 1 e 100.
5. Como obter a data e hora atuais?
6. O que `if __name__ == "__main__":` faz?
7. Converta um dicionário Python para uma string JSON.
8. Como instalar um pacote de terceiros?
9. Por que evitar `from module import *`?
10. Escreva um módulo com duas funções e teste-o usando `__name__`.
