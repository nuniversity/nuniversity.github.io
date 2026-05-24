---
title: "Variáveis e Tipos de Dados"
description: "Aprenda a armazenar dados usando variáveis e entenda os tipos de dados principais do Python: int, float, string e bool"
order: 3
duration: "30 minutos"
difficulty: "iniciante"
---

# Variáveis e Tipos de Dados

Variáveis são recipientes para armazenar dados. Python é dinamicamente tipado, o que significa que você não precisa declarar o tipo de uma variável — o Python o infere automaticamente.

## Variáveis

```python
name = "Alice"        # String
age = 25              # Inteiro
height = 1.68         # Float
is_student = True     # Booleano
```

### Regras de Nomenclatura
- Deve começar com uma letra ou sublinhado
- Pode conter letras, números e sublinhados
- Difere maiúsculas de minúsculas (`age` ≠ `Age`)
- Não pode usar palavras-chave do Python (como `if`, `for`, `while`)

```python
# Nomes válidos
user_name = "Bob"
_user_id = 42
camelCase = "OK"      # Permitido mas não preferido

# Nomes inválidos
2nd_place = "Não"      # Começa com número
my-var = "Não"         # Hífen não permitido
class = "Não"          # Palavra-chave reservada
```

### Convenções de Nomenclatura (PEP 8)
```python
# Use snake_case para variáveis e funções
user_age = 30
total_price = 99.99

# Use UPPER_CASE para constantes
PI = 3.14159
MAX_SIZE = 100
```

> [!NOTE]
> Python segue o guia de estilo PEP 8. Use `snake_case` para variáveis, não `camelCase`.

## Tipos Numéricos

### Inteiros (`int`)
```python
count = 10
negative = -5
big_number = 1_000_000  # Sublinhados melhoram a legibilidade
```

### Floats (`float`)
```python
price = 19.99
pi = 3.14159
scientific = 1.5e-4   # 0.00015
```

### Conversão de Tipos
```python
# int para float
x = float(10)       # 10.0

# float para int (trunca)
y = int(3.99)       # 3

# string para int
z = int("42")       # 42
```

## Strings (`str`)

```python
# Aspas simples ou duplas
first = 'Hello'
second = "World"

# Strings multilinha
poem = """Roses are red,
Violets are blue,
Python is fun,
And so are you."""

# Concatenação de strings
greeting = "Hello" + " " + "World"

# Interpolação de strings (f-strings)
name = "Alice"
age = 25
message = f"{name} is {age} years old."

# Métodos de string
text = "  Python is FUN  "
print(text.lower())       # "  python is fun  "
print(text.upper())       # "  PYTHON IS FUN  "
print(text.strip())       # "Python is FUN"
print(text.replace("FUN", "awesome"))  # "  Python is awesome  "
```

## Booleanos (`bool`)

```python
is_active = True
is_finished = False

# Operadores de comparação retornam booleanos
print(10 > 5)    # True
print(3 == 4)    # False
```

## Tipo None

`None` representa a ausência de um valor:

```python
result = None
print(result)    # None
```

## Verificando Tipos

```python
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("Hello"))   # <class 'str'>
print(type(True))      # <class 'bool'>
print(type(None))      # <class 'NoneType'>
```

## Tipagem Dinâmica

O tipo de uma variável pode mudar:

```python
x = 10        # x é int
x = "hello"   # x agora é str
x = 3.14      # x agora é float
```

> [!WARNING]
> Tipagem dinâmica é flexível mas pode causar bugs. Use nomes de variáveis significativos e seja consistente com os tipos.

> [!SUCCESS]
> Lembre-se: `int` para números inteiros, `float` para decimais, `str` para texto, `bool` para verdadeiro/falso, e `None` para nada.

## Perguntas de Prática

1. O que `type(3.14)` retornará?
2. Converta `"100"` para um inteiro.
3. O que há de errado com `2nd_place = "Bob"`?
4. Escreva uma f-string que diga "Alice is 30 years old".
5. Qual a diferença entre `10` e `10.0`?
6. O que `"hello".upper()` retorna?
7. Verdadeiro ou Falso: Python requer que você declare tipos de variáveis.
8. O que `None` representa em Python?
9. Converta o float `99.9` para um inteiro — qual é o resultado?
10. Escreva um nome de variável Python usando snake_case para o endereço de email de um usuário.
