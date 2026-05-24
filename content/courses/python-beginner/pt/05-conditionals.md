---
title: "Condicionais (if/elif/else)"
description: "Controle o fluxo do programa com declarações condicionais: if, elif, else, condições aninhadas e o operador ternário"
order: 5
duration: "25 minutos"
difficulty: "iniciante"
---

# Condicionais (if/elif/else)

Condicionais permitem que seu programa tome decisões baseadas em condições. É assim que o código se torna "inteligente".

## A Declaração if

```python
age = 18
if age >= 18:
    print("You are an adult")
```

Indentação é importante! O bloco sob `if` deve ser indentado consistentemente.

## if/else

```python
temperature = 30
if temperature > 25:
    print("It's hot outside!")
else:
    print("It's cool outside.")
```

## if/elif/else

```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Grade: {grade}")
```

> [!NOTE]
> Python não tem uma declaração `switch`. Use `if/elif/else` no lugar. Python 3.10+ tem `match` (correspondência de padrão estrutural).

## Condicionais Aninhadas

```python
age = 20
has_id = True

if age >= 18:
    if has_id:
        print("Entry allowed")
    else:
        print("ID required")
else:
    print("Too young")
```

## Operador Ternário (Expressão Condicional)

Uma forma compacta de escrever condicionais simples:

```python
# Forma padrão
if age >= 18:
    status = "Adult"
else:
    status = "Minor"

# Forma ternária (uma linha)
status = "Adult" if age >= 18 else "Minor"
```

## Veracidade

Em Python, alguns valores são "truthy" e outros são "falsy":

```python
# Valores falsy (avaliam como False em contexto booleano)
False, None, 0, 0.0, "", [], {}, set(), range(0)

# Todo o resto é truthy
name = "Alice"
if name:  # True porque a string não está vazia
    print(f"Hello, {name}")
```

### Exemplos Práticos
```python
# Verificar se uma lista está vazia
items = []
if not items:
    print("Cart is empty")

# Verificar se um número é diferente de zero
count = 5
if count:
    print(f"Processing {count} items")
```

> [!WARNING]
> Cuidado com `==` vs `=`. `=` é atribuição, `==` é comparação. Usar `=` em uma condição (`if x = 5:`) causa um erro de sintaxe.

## Caso de Uso Real: Autenticação de Usuário

```python
username = input("Username: ")
password = input("Password: ")

if username == "admin" and password == "secret123":
    print("Welcome, admin!")
elif username == "admin":
    print("Wrong password")
elif password == "secret123":
    print("Unknown user")
else:
    print("Invalid credentials")
```

> [!SUCCESS]
> Pense em condicionais como pontos de decisão em seu programa: se isto for verdadeiro, faça isto; senão, faça aquilo.

## Perguntas de Prática

1. Escreva uma declaração if que imprime "Positive" se `num > 0`.
2. Qual a diferença entre `=` e `==` em Python?
3. Converta para ternário: `if x > 0: result = "positive" else: result = "negative"`
4. Liste todos os valores falsy em Python.
5. O que `if "":` avalia?
6. Escreva uma condicional aninhada que verifica se uma pessoa tem pelo menos 18 anos E tem um ingresso válido.
7. O que há de errado com `if x = 10:`?
8. Como escrever uma condicional de múltiplas vias em Python (como switch/case)?
9. Escreva um programa que imprime "Even" ou "Odd" baseado em um número.
10. O que isto imprime: `status = "pass" if score >= 60 else "fail"` se a nota for 45?
