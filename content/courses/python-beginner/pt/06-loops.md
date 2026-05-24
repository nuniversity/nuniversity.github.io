---
title: "Laços (for e while)"
description: "Domine iteração em Python com laços for, while, range(), break, continue e laços aninhados"
order: 6
duration: "30 minutos"
difficulty: "iniciante"
---

# Laços (for e while)

Laços permitem repetir código várias vezes — essencial para processar dados, automatizar tarefas e construir programas eficientes.

## O Laço for

Itere sobre uma sequência (lista, string, range, etc.):

```python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

### Percorrendo uma String
```python
for char in "Python":
    print(char)
# Saída: P, y, t, h, o, n
```

### Usando range()

`range(início, fim, passo)` gera uma sequência de números:

```python
# 0 a 4
for i in range(5):
    print(i)

# 2 a 8 (passo 2)
for i in range(2, 9, 2):
    print(i)

# Contagem regressiva
for i in range(10, 0, -1):
    print(i)
print("Blast off!")
```

## O Laço while

Executa enquanto uma condição for True:

```python
count = 0
while count < 5:
    print(count)
    count += 1
```

### Validação de Entrada
```python
password = ""
while password != "secret":
    password = input("Enter password: ")
print("Access granted!")
```

> [!WARNING]
> Sempre garanta que a condição do laço while eventualmente se torne False — caso contrário você cria um loop infinito!

## break e continue

### break — Sai do laço completamente
```python
for i in range(100):
    if i == 5:
        break
    print(i)
# Imprime: 0 1 2 3 4
```

### continue — Pula para a próxima iteração
```python
for i in range(10):
    if i % 2 == 0:
        continue
    print(i)
# Imprime: 1 3 5 7 9
```

## Laços Aninhados

Laços dentro de laços:

```python
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})", end=" ")
    print()
# Saída:
# (0, 0) (0, 1) (0, 2)
# (1, 0) (1, 1) (1, 2)
# (2, 0) (2, 1) (2, 2)
```

## A Cláusula else em Laços

Executa quando o laço completa normalmente (sem break):

```python
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} = {x} * {n//x}")
            break
    else:
        print(f"{n} is prime")
```

## enumerate — Laço com Índice

```python
colors = ["red", "green", "blue"]
for index, color in enumerate(colors):
    print(f"{index}: {color}")
# 0: red, 1: green, 2: blue
```

## zip — Percorrer Múltiplas Listas Juntas

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

> [!SUCCESS]
| Laço | Quando Usar | Exemplo |
|------|-------------|---------|
| `for` | Iterar sobre uma sequência conhecida | `for item in list:` |
| `while` | Repetir até uma condição mudar | `while running:` |
| `for` + `range()` | Número conhecido de iterações | `for i in range(10):` |

## Perguntas de Prática

1. Escreva um laço for que imprime números de 1 a 10.
2. O que `range(5)` gera?
3. Escreva um laço while que soma números de 1 a 100.
4. Qual a diferença entre `break` e `continue`?
5. Escreva laços aninhados para imprimir uma tabuada 3×3.
6. Como percorrer uma lista com índice e valor?
7. O que acontece se uma condição de laço while for sempre True?
8. Escreva um laço for com uma cláusula else.
9. Como percorrer duas listas simultaneamente?
10. Escreva um programa que imprime todos os números pares de 1 a 20 usando continue.
