---
title: "Listas e Tuplas"
description: "Aprenda os tipos de sequência do Python: operações com listas, imutabilidade de tuplas, indexação, fatiamento e métodos comuns"
order: 7
duration: "30 minutos"
difficulty: "iniciante"
---

# Listas e Tuplas

Listas e tuplas são as estruturas de dados fundamentais do Python para armazenar coleções ordenadas de itens.

## Listas (`list`)

Listas são sequências ordenadas **mutáveis** (podem ser alteradas):

```python
# Criando listas
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True]
empty = []
nested = [[1, 2], [3, 4]]
```

### Indexação

```python
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[0])      # "apple" (primeiro)
print(fruits[-1])     # "date" (último)
print(fruits[1:3])    # ["banana", "cherry"] (fatiamento)
```

### Modificando Listas

```python
fruits[1] = "blueberry"     # Alterar elemento
fruits.append("elderberry") # Adicionar ao final
fruits.insert(0, "avocado") # Inserir em posição
fruits.remove("cherry")     # Remover por valor
popped = fruits.pop()       # Remover e retornar o último
del fruits[0]               # Deletar por índice
```

### Métodos de Lista

```python
numbers = [3, 1, 4, 1, 5, 9, 2]
numbers.sort()              # [1, 1, 2, 3, 4, 5, 9]
numbers.reverse()           # [9, 5, 4, 3, 2, 1, 1]
print(len(numbers))         # 7
print(numbers.count(1))     # 2
print(3 in numbers)         # True
```

### Operações com Listas

```python
# Concatenação
a = [1, 2] + [3, 4]        # [1, 2, 3, 4]

# Repetição
b = ["ha"] * 3             # ["ha", "ha", "ha"]

# List comprehension (prévia avançada)
squares = [x**2 for x in range(5)]  # [0, 1, 4, 9, 16]
```

## Tuplas (`tuple`)

Tuplas são sequências ordenadas **imutáveis** (não podem ser alteradas):

```python
# Criando tuplas
point = (3, 4)
colors = ("red", "green", "blue")
single = (1,)       # Vírgula final obrigatória!
empty = ()          # Tupla vazia
```

### Acessando Elementos da Tupla
```python
point = (3, 4)
x = point[0]    # 3
y = point[1]    # 4
```

### Desempacotamento de Tuplas
```python
point = (3, 4)
x, y = point    # x=3, y=4

# Trocar variáveis elegantemente
a, b = 1, 2
a, b = b, a     # a=2, b=1
```

> [!NOTE]
> Tuplas são mais rápidas que listas e protegem a integridade dos dados. Use-as para dados fixos como coordenadas, cores RGB ou valores de retorno de funções.

## Quando Usar Cada Uma

| Característica | Lista | Tupla |
|---------|------|-------|
| Mutável? | Sim | Não |
| Sintaxe | `[1, 2, 3]` | `(1, 2, 3)` |
| Performance | Mais lenta | Mais rápida |
| Caso de uso | Dados que mudam | Dados fixos |
| Métodos | Muitos (`append`, `sort`, etc.) | Poucos (`count`, `index`) |

## Exemplos do Mundo Real

### Carrinho de Compras (Lista — muda frequentemente)
```python
cart = []
cart.append("laptop")
cart.append("mouse")
cart.append("keyboard")
total_items = len(cart)
print(f"Cart has {total_items} items")
```

### Cor RGB (Tupla — fixa)
```python
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

def apply_color(pixel, color):
    r, g, b = color
    return (pixel[0] * r // 255, pixel[1] * g // 255, pixel[2] * b // 255)
```

### Notas de Alunos
```python
grades = [85, 92, 78, 90, 88]
average = sum(grades) / len(grades)
print(f"Average: {average:.1f}")

max_grade = max(grades)
min_grade = min(grades)
print(f"Range: {min_grade} - {max_grade}")
```

> [!SUCCESS]
> Listas são para coleções que mudam. Tuplas são para coleções que não mudam. Em caso de dúvida, use listas.

## Perguntas de Prática

1. Crie uma lista de 5 comidas favoritas. Imprima o terceiro item.
2. Qual a diferença entre `list.append()` e `list.insert()`?
3. Como obter o último elemento de uma lista?
4. Por que você usaria uma tupla em vez de uma lista?
5. O que `[1, 2, 3] * 3` produz?
6. Como criar uma tupla com um elemento?
7. Escreva código que troca `a = 5` e `b = 10` usando desempacotamento de tupla.
8. Qual a saída de `[x*2 for x in range(4)]`?
9. Como verificar se um item existe em uma lista?
10. O que acontece se você tentar `my_tuple[0] = 5`?
