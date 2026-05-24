---
title: "Operadores y Expresiones"
description: "Domina los operadores aritméticos, de comparación, lógicos y de asignación para construir expresiones potentes en Python"
order: 4
duration: "30 minutos"
difficulty: "beginner"
---

# Operadores y Expresiones

Los operadores realizan operaciones sobre valores y variables. Combinados con operandos, forman expresiones — los bloques de construcción de los programas en Python.

## Operadores Aritméticos

```python
a = 10
b = 3

print(a + b)    # 13  (suma)
print(a - b)    # 7   (resta)
print(a * b)    # 30  (multiplicación)
print(a / b)    # 3.333...  (división → siempre float)
print(a // b)   # 3   (división entera / suelo)
print(a % b)    # 1   (módulo / resto)
print(a ** b)   # 1000  (exponenciación)
```

### Ejemplo Real: Calculadora de Propina
```python
bill = 45.50
tip_percentage = 15
tip = bill * (tip_percentage / 100)
total = bill + tip
print(f"Tip: ${tip:.2f}, Total: ${total:.2f}")
```

## Operadores de Comparación

Compara valores y obtén un resultado booleano:

```python
x = 5
y = 10

print(x == y)   # False  (igual a)
print(x != y)   # True   (no igual a)
print(x < y)    # True   (menor que)
print(x > y)    # False  (mayor que)
print(x <= 5)   # True   (menor o igual que)
print(y >= 10)  # True   (mayor o igual que)
```

### Comparación Encadenada
```python
age = 25
is_adult = 18 <= age <= 65  # True
print(is_adult)
```

## Operadores Lógicos

Combina expresiones booleanas:

```python
has_license = True
has_insurance = True
age = 22

# AND — ambos deben ser True
can_drive = has_license and has_insurance

# OR — al menos uno debe ser True
needs_review = age < 18 or age > 70

# NOT — invierte el booleano
is_minor = not (age >= 18)
```

### Tabla de Verdad
| A | B | A and B | A or B | not A |
|---|---|---|---|---|
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |

> [!NOTE]
> Python usa evaluación de cortocircuito: `and` se detiene en el primer False, `or` se detiene en el primer True.

## Operadores de Asignación

```python
x = 10        # asignación simple
x += 5        # x = x + 5  → 15
x -= 3        # x = x - 3  → 12
x *= 2        # x = x * 2  → 24
x /= 4        # x = x / 4  → 6.0
x //= 2       # x = x // 2 → 3.0
x %= 2        # x = x % 2  → 1.0
x **= 3       # x = x ** 3 → 1.0
```

## Precedencia de Operadores

Se aplica PEMDAS (Paréntesis, Exponentes, Multiplicación/División, Adición/Sustracción):

```python
result = 2 + 3 * 4      # 14 (3*4 primero, luego +2)
result2 = (2 + 3) * 4   # 20 (paréntesis primero)
result3 = 2 ** 3 * 4    # 32 (exponente primero: 8*4)
```

> [!WARNING]
> ¡Si tienes dudas sobre la precedencia, usa paréntesis `()` para hacer tu intención clara!

## Ejemplos de Expresiones

### Conversión de Temperatura
```python
celsius = 25
fahrenheit = (celsius * 9/5) + 32
print(f"{celsius}°C = {fahrenheit}°F")
```

### Verificación de Par o Impar
```python
number = 7
is_even = number % 2 == 0
print(f"{number} is {'even' if is_even else 'odd'}")
```

> [!SUCCESS]
| Operador | Categoría | Ejemplo |
|---|---|---|
| `+ - * /` | Aritmética | `5 + 3` |
| `% // **` | Aritmética | `10 % 3` |
| `== != < > <= >=` | Comparación | `age >= 18` |
| `and or not` | Lógica | `a and b` |
| `= += -=` | Asignación | `x += 1` |

## Preguntas de Práctica

1. ¿A qué evalúa `17 % 5`?
2. ¿Cuál es el resultado de `10 + 2 * 3`?
3. Corrige esto: `x = 10; if x = 5:` — ¿qué está mal?
4. Escribe una expresión que verifique si un número está entre 10 y 20 (inclusive).
5. ¿A qué evalúa `(3 + 2) * 4 // 2`?
6. Verdadero o Falso: ¿`"10" == 10` en Python?
7. ¿Qué operador te da el resto de una división?
8. Convierte 100 grados Celsius a Fahrenheit.
9. Escribe una expresión booleana: "x es positivo AND y es negativo"
10. ¿A qué evalúa `not (True and False)`?
