---
title: "Operadores e Expressões"
description: "Domine operadores aritméticos, de comparação, lógicos e de atribuição para construir expressões poderosas em Python"
order: 4
duration: "30 minutos"
difficulty: "iniciante"
---

# Operadores e Expressões

Operadores realizam operações em valores e variáveis. Combinados com operandos, eles formam expressões — os blocos de construção de programas Python.

## Operadores Aritméticos

```python
a = 10
b = 3

print(a + b)    # 13  (adição)
print(a - b)    # 7   (subtração)
print(a * b)    # 30  (multiplicação)
print(a / b)    # 3.333...  (divisão → sempre float)
print(a // b)   # 3   (divisão inteira)
print(a % b)    # 1   (módulo / resto)
print(a ** b)   # 1000  (exponenciação)
```

### Exemplo Real: Calculadora de Gorjeta
```python
bill = 45.50
tip_percentage = 15
tip = bill * (tip_percentage / 100)
total = bill + tip
print(f"Tip: ${tip:.2f}, Total: ${total:.2f}")
```

## Operadores de Comparação

Compare valores e obtenha um resultado booleano:

```python
x = 5
y = 10

print(x == y)   # False  (igual a)
print(x != y)   # True   (diferente de)
print(x < y)    # True   (menor que)
print(x > y)    # False  (maior que)
print(x <= 5)   # True   (menor ou igual a)
print(y >= 10)  # True   (maior ou igual a)
```

### Comparações Encadeadas
```python
age = 25
is_adult = 18 <= age <= 65  # True
print(is_adult)
```

## Operadores Lógicos

Combine expressões booleanas:

```python
has_license = True
has_insurance = True
age = 22

# AND — ambos devem ser True
can_drive = has_license and has_insurance

# OR — pelo menos um deve ser True
needs_review = age < 18 or age > 70

# NOT — inverte o booleano
is_minor = not (age >= 18)
```

### Tabela Verdade
| A | B | A and B | A or B | not A |
|---|---|---|--------|--------|-------|
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |

> [!NOTE]
> Python usa avaliação de curto-circuito: `and` para no primeiro False, `or` para no primeiro True.

## Operadores de Atribuição

```python
x = 10        # atribuição simples
x += 5        # x = x + 5  → 15
x -= 3        # x = x - 3  → 12
x *= 2        # x = x * 2  → 24
x /= 4        # x = x / 4  → 6.0
x //= 2       # x = x // 2 → 3.0
x %= 2        # x = x % 2  → 1.0
x **= 3       # x = x ** 3 → 1.0
```

## Precedência de Operadores

A ordem das operações se aplica (Parênteses, Expoentes, Multiplicação/Divisão, Adição/Subtração):

```python
result = 2 + 3 * 4      # 14 (3*4 primeiro, depois +2)
result2 = (2 + 3) * 4   # 20 (parênteses primeiro)
result3 = 2 ** 3 * 4    # 32 (expoente primeiro: 8*4)
```

> [!WARNING]
> Em caso de dúvida sobre precedência, use parênteses `()` para tornar sua intenção clara!

## Exemplos de Expressões

### Conversão de Temperatura
```python
celsius = 25
fahrenheit = (celsius * 9/5) + 32
print(f"{celsius}°C = {fahrenheit}°F")
```

### Verificar Par ou Ímpar
```python
number = 7
is_even = number % 2 == 0
print(f"{number} is {'even' if is_even else 'odd'}")
```

> [!SUCCESS]
| Operador | Categoria | Exemplo |
|----------|----------|---------|
| `+ - * /` | Aritmético | `5 + 3` |
| `% // **` | Aritmético | `10 % 3` |
| `== != < > <= >=` | Comparação | `age >= 18` |
| `and or not` | Lógico | `a and b` |
| `= += -=` | Atribuição | `x += 1` |

## Perguntas de Prática

1. Quanto vale `17 % 5`?
2. Qual o resultado de `10 + 2 * 3`?
3. Corrija isto: `x = 10; if x = 5:` — o que está errado?
4. Escreva uma expressão que verifica se um número está entre 10 e 20 (inclusive).
5. Quanto vale `(3 + 2) * 4 // 2`?
6. Verdadeiro ou Falso: `"10" == 10` em Python?
7. Qual operador fornece o resto de uma divisão?
8. Converta 100 graus Celsius para Fahrenheit.
9. Escreva uma expressão booleana: "x é positivo E y é negativo"
10. Quanto vale `not (True and False)`?
