---
title: "Funções e Escopo"
description: "Crie código reutilizável com funções: parâmetros, valores de retorno, escopo, argumentos padrão e boas práticas"
order: 9
duration: "30 minutos"
difficulty: "iniciante"
---

# Funções e Escopo

Funções são blocos de código reutilizáveis que executam uma tarefa específica. Elas ajudam a organizar código, evitar repetição e construir programas complexos a partir de partes simples.

## Definindo e Chamando Funções

```python
def greet():
    print("Hello, World!")

greet()  # Chamar a função
```

## Parâmetros e Argumentos

```python
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")  # "Hello, Alice!"
```

### Múltiplos Parâmetros
```python
def add(a, b):
    result = a + b
    return result

sum_result = add(5, 3)  # 8
```

## A Declaração return

Funções podem retornar valores (ou `None` por padrão):

```python
def square(x):
    return x * x

result = square(4)  # 16

# Múltiplos valores de retorno (como tupla)
def divide(a, b):
    quotient = a // b
    remainder = a % b
    return quotient, remainder

q, r = divide(17, 5)  # q=3, r=2
```

## Argumentos Padrão

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))          # "Hello, Alice!"
print(greet("Bob", "Hi"))      # "Hi, Bob!"
```

> [!WARNING]
> Nunca use argumentos padrão mutáveis (listas, dicionários). Eles são criados uma vez e compartilhados entre chamadas!

```python
def bad_append(item, list=[]):  # Errado!
    list.append(item)
    return list

def good_append(item, list=None):  # Correto
    if list is None:
        list = []
    list.append(item)
    return list
```

## Argumentos Nomeados

```python
def create_user(name, age, country):
    return f"{name}, {age}, from {country}"

# Posicional
user1 = create_user("Alice", 25, "USA")

# Nomeado (ordem não importa)
user2 = create_user(age=30, country="Canada", name="Bob")
```

## Escopo de Variáveis

### Escopo Local
```python
def my_func():
    x = 10  # Variável local
    print(x)

my_func()     # 10
print(x)      # NameError! x não está definida
```

### Escopo Global
```python
x = 10  # Variável global

def my_func():
    print(x)  # Pode ler variável global

my_func()  # 10
```

### Modificando Globais (Use com Moderação!)
```python
count = 0

def increment():
    global count
    count += 1

increment()
print(count)  # 1
```

> [!NOTE]
| Tipo | Definida | Acessível | Boa Prática |
|------|---------|------------|---------------|
| Local | Dentro da função | Apenas nessa função | Padrão — use para dados temporários |
| Enclosing | Em função externa | Funções internas | Use com closures |
| Global | Nível superior | Em todo lugar | Evite modificar; use parâmetros |
| Built-in | O próprio Python | Em todo lugar | Não sobrescreva |

## Anotações de Tipo (Documentação)

```python
def add(a: int, b: int) -> int:
    return a + b

def greet(name: str) -> str:
    return f"Hello, {name}"

def process(items: list[str]) -> None:
    for item in items:
        print(item)
```

## Docstrings

Documente o que sua função faz:

```python
def calculate_bmi(weight: float, height: float) -> float:
    """Calculate Body Mass Index.
    
    Args:
        weight: Weight in kilograms
        height: Height in meters
        
    Returns:
        BMI value
    """
    return weight / (height ** 2)
```

## Exemplo Real: Funções de Processamento de Dados

```python
def clean_text(text: str) -> str:
    """Remove punctuation and normalize whitespace."""
    import string
    for char in string.punctuation:
        text = text.replace(char, "")
    return " ".join(text.split())

def word_frequency(text: str) -> dict:
    """Count word frequency in text."""
    words = clean_text(text).lower().split()
    freq = {}
    for word in words:
        freq[word] = freq.get(word, 0) + 1
    return freq

def top_words(freq: dict, n: int = 5) -> list:
    """Return the n most common words."""
    return sorted(freq.items(), key=lambda x: x[1], reverse=True)[:n]

# Uso
text = "Hello world! Hello everyone. Welcome to the world of Python."
freq = word_frequency(text)
print(top_words(freq))
```

> [!SUCCESS]
> Funções são os blocos de construção de código sustentável: elas escondem complexidade, previnem repetição e tornam seus programas modulares.

## Perguntas de Prática

1. Escreva uma função que recebe dois números e retorna o produto deles.
2. Qual a diferença entre `print` e `return` em uma função?
3. O que acontece se uma função não tem uma declaração return?
4. Por que `def func(x=[])` é problemático?
5. Escreva uma função com anotações de tipo que converte Celsius para Fahrenheit.
6. Qual o escopo de uma variável definida dentro de uma função?
7. Como retornar múltiplos valores de uma função?
8. Escreva uma função recursiva que calcula fatorial.
9. O que `global` faz dentro de uma função?
10. Escreva uma docstring para uma função que valida um endereço de email.
