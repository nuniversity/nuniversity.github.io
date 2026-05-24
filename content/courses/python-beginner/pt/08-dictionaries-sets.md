---
title: "Dicionários e Conjuntos"
description: "Domine pares chave-valor com dicionários e coleções não ordenadas de elementos únicos com conjuntos"
order: 8
duration: "30 minutos"
difficulty: "iniciante"
---

# Dicionários e Conjuntos

Dicionários armazenam pares chave-valor para buscas rápidas. Conjuntos armazenam elementos únicos para teste de pertinência e operações matemáticas.

## Dicionários (`dict`)

Dicionários mapeiam chaves para valores:

```python
# Criando dicionários
student = {
    "name": "Alice",
    "age": 22,
    "major": "Computer Science",
    "gpa": 3.8
}

# Construtor alternativo
student = dict(name="Alice", age=22, major="CS")
```

### Acessando Valores

```python
print(student["name"])      # "Alice"
print(student.get("age"))   # 22
print(student.get("grade", "N/A"))  # "N/A" (acesso seguro)
```

> [!WARNING]
> Acessar uma chave inexistente com `[]` levanta um KeyError. Use `.get()` para acesso seguro.

### Modificando Dicionários

```python
student["gpa"] = 3.9       # Atualizar valor
student["year"] = 3        # Adicionar nova chave-valor
del student["age"]         # Remover chave
popped = student.pop("major")  # Remover e retornar
```

### Métodos de Dicionário

```python
for key in student:
    print(key)

for value in student.values():
    print(value)

for key, value in student.items():
    print(f"{key}: {value}")

# Verificar existência de chave
if "name" in student:
    print("Name exists")
```

## Caso de Uso Real: Contador de Palavras

```python
text = "the quick brown fox jumps over the lazy dog"
word_count = {}

for word in text.split():
    if word in word_count:
        word_count[word] += 1
    else:
        word_count[word] = 1

print(word_count)
# {'the': 2, 'quick': 1, 'brown': 1, ...}
```

### Usando defaultdict (mais simples)

```python
from collections import defaultdict

word_count = defaultdict(int)
for word in text.split():
    word_count[word] += 1
```

## Conjuntos (`set`)

Conjuntos armazenam elementos **únicos** e não ordenados:

```python
# Criando conjuntos
fruits = {"apple", "banana", "cherry", "apple"}  # Duplicatas removidas
numbers = set([1, 2, 3, 3, 2, 1])  # {1, 2, 3}
empty = set()  # {} cria um dicionário vazio, não conjunto!
```

### Operações com Conjuntos

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # União: {1, 2, 3, 4, 5, 6}
print(a & b)   # Interseção: {3, 4}
print(a - b)   # Diferença: {1, 2}
print(a ^ b)   # Diferença simétrica: {1, 2, 5, 6}
```

### Métodos de Conjuntos

```python
a.add(7)         # Adicionar elemento
a.remove(7)      # Remover (levanta KeyError se ausente)
a.discard(10)    # Remover (sem erro se ausente)
print(3 in a)    # Teste de pertinência (muito rápido!)
```

> [!NOTE]
> Conjuntos são otimizados para teste de pertinência (`in`) — O(1) em média vs O(n) para listas. Use conjuntos quando a ordem não importar e duplicatas não existirem.

## Casos de Uso Reais

### Visitantes Únicos
```python
visitor_ips = set()
visitor_ips.add("192.168.1.1")
visitor_ips.add("192.168.1.2")
visitor_ips.add("192.168.1.1")  # Duplicata, ignorada
print(f"Unique visitors: {len(visitor_ips)}")
```

### Encontrando Elementos Comuns
```python
python_students = {"Alice", "Bob", "Charlie"}
java_students = {"Bob", "Diana", "Eve"}
both = python_students & java_students
print(f"Students in both: {both}")
```

### Removendo Duplicatas de uma Lista
```python
items = [1, 2, 2, 3, 3, 3, 4]
unique = list(set(items))  # [1, 2, 3, 4]
```

> [!SUCCESS]
| Estrutura | Ordenada | Mutável | Chaves Únicas | Caso de Uso |
|-----------|---------|---------|-------------|----------|
| Lista | Sim | Sim | Não | Coleção ordenada |
| Tupla | Sim | Não | Não | Dados fixos |
| Dict | Sim* | Sim | Sim | Buscas chave-valor |
| Set | Não | Sim | Sim* | Pertinência, unicidade |

*Python 3.7+ dicionários mantêm ordem de inserção. Conjuntos armazenam valores únicos.

## Perguntas de Prática

1. Crie um dicionário para um livro com título, autor e ano.
2. Como obter um valor de um dicionário com segurança sem risco de KeyError?
3. Qual a diferença entre `{}` e `set()`?
4. Escreva código para contar frequência de caracteres em uma string usando um dicionário.
5. Como encontrar elementos únicos entre duas listas usando conjuntos?
6. O que `{1, 2, 3} - {2, 3, 4}` retorna?
7. Como percorrer tanto chaves quanto valores de um dicionário?
8. Por que testes de pertinência em conjuntos são mais rápidos que em listas?
9. Remova duplicatas de `[1, 1, 2, 3, 3, 4, 5, 5]`.
10. O que acontece se você adicionar um elemento duplicado a um conjunto?
