---
title: "Introdução à Programação Funcional com Python"
description: "Explore o paradigma funcional usando Python: funções puras, map/filter/reduce e compreensões de lista"
order: 7
duration: "35 minutes"
difficulty: "intermediate"
---

# Introdução à Programação Funcional com Python

Até agora você escreveu código imperativo — instruções passo a passo que alteram estado. A programação funcional é um paradigma diferente: enfatiza funções puras, imutabilidade e transformação de dados através de pipelines.

## O que é Programação Funcional?

Programação funcional trata a computação como a avaliação de funções matemáticas. Princípios-chave:

- **Funções puras**: Mesma entrada sempre produz a mesma saída, sem efeitos colaterais
- **Imutabilidade**: Dados nunca são modificados — novos dados são criados
- **Composição de funções**: Construa operações complexas combinando funções simples

## Funções Puras

Uma função pura depende apenas de suas entradas e não tem efeitos colaterais:

```python
# Pura: mesma entrada sempre dá a mesma saída
def somar(a, b):
    return a + b

# Impura: depende de estado externo
total = 0
def somar_ao_total(x):
    global total
    total += x     # efeito colateral — modifica variável externa
    return total
```

Funções puras são mais fáceis de testar, depurar e raciocinar.

## Map, Filter e Reduce

Estas três funções são a base do processamento funcional de dados.

### map

Aplica uma função a cada elemento de uma sequência:

```python
numeros = [1, 2, 3, 4, 5]

def quadrado(x):
    return x * x

quadrados = list(map(quadrado, numeros))
print(quadrados)  # [1, 4, 9, 16, 25]
```

### filter

Mantém apenas elementos que satisfazem uma condição:

```python
def eh_par(x):
    return x % 2 == 0

pares = list(filter(eh_par, numeros))
print(pares)  # [2, 4]
```

### reduce

Combina todos os elementos em um único valor:

```python
from functools import reduce

def multiplicar(x, y):
    return x * y

produto = reduce(multiplicar, numeros)
print(produto)  # 120  (1 * 2 * 3 * 4 * 5)
```

> [!NOTE]
> O `reduce` do Python está no módulo `functools`. `map` e `filter` são nativos.

## Funções Lambda

Lambdas são funções anônimas de uma linha, perfeitas para operações simples:

```python
numeros = [1, 2, 3, 4, 5]

quadrados = list(map(lambda x: x * x, numeros))
pares = list(filter(lambda x: x % 2 == 0, numeros))

print(quadrados)  # [1, 4, 9, 16, 25]
print(pares)      # [2, 4]
```

## Compreensões de Lista

Python oferece uma alternativa mais legível para `map` e `filter`:

```python
numeros = [1, 2, 3, 4, 5]

# Equivalente a map
quadrados = [x * x for x in numeros]
print(quadrados)  # [1, 4, 9, 16, 25]

# Equivalente a filter
pares = [x for x in numeros if x % 2 == 0]
print(pares)      # [2, 4]

# Combinados
quadrados_pares = [x * x for x in numeros if x % 2 == 0]
print(quadrados_pares)  # [4, 16]
```

## Imutabilidade

Na programação funcional, você evita modificar dados no lugar:

```python
# Imperativo (muta)
def adicionar_na_lista(item, itens):
    itens.append(item)
    return itens

# Funcional (cria nova lista)
def adicionar_na_lista_puro(item, itens):
    return itens + [item]

original = [1, 2, 3]
nova_lista = adicionar_na_lista_puro(4, original)
print(original)   # [1, 2, 3]  — inalterado
print(nova_lista) # [1, 2, 3, 4]
```

## Exercício Prático

Use técnicas funcionais para processar uma lista de temperaturas em Celsius:

```python
celsius = [0, 10, 20, 30, 40]

# Converter para Fahrenheit usando map + lambda
fahrenheit = list(map(lambda c: (c * 9/5) + 32, celsius))
print("Fahrenheit:", fahrenheit)

# Filtrar apenas temperaturas "quentes" (acima de 80F)
quentes = list(filter(lambda f: f > 80, fahrenheit))
print("Dias quentes:", quentes)

# Usando compreensões de lista
fahrenheit2 = [(c * 9/5) + 32 for c in celsius]
quentes2 = [f for f in fahrenheit2 if f > 80]
print("Compreensões:", fahrenheit2, quentes2)
```

## Resumo

| Conceito | Ferramenta Python | Exemplo |
|----------|-------------------|---------|
| Função pura | Sem efeitos colaterais | `def somar(a, b): return a + b` |
| Map | `map(func, iteravel)` | Aplicar função a cada elemento |
| Filter | `filter(func, iteravel)` | Manter elementos que correspondem |
| Reduce | `reduce(func, iteravel)` | Combinar em um valor |
| Lambda | `lambda x: expr` | Função anônima inline |
| Compreensão | `[expr for x in lista]` | Alternativa legível para map/filter |

## Próximos Passos

JavaScript e Python são linguagens interpretadas. A próxima lição explora linguagens compiladas usando Rust, onde o código é traduzido para código de máquina antes da execução.
