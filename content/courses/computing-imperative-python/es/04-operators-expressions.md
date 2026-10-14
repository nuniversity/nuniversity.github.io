---
title: "Operadores y expresiones"
description: "Domina los operadores de Python: aritméticos, de comparación, lógicos, de asignación, de identidad y de pertenencia, con ejemplos prácticos."
order: 4
duration: "55 min"
difficulty: "beginner"
language: "es"
---

# Operadores y expresiones

Los operadores son símbolos que realizan operaciones sobre valores y variables. Las expresiones combinan operadores y operandos para producir resultados. Esta lección cubre todos los operadores de Python que necesitas conocer.

## ¿Qué son los operadores y las expresiones?

```mermaid
flowchart LR
    A[Operando] --> B[Operador]
    C[Operando] --> B
    B --> D[Resultado de la expresión]
    
    subgraph "Ejemplo: 5 + 3 = 8"
        E["5"] --> F["+"]
        G["3"] --> F
        F --> H["8"]
    end
```

Una **expresión** es cualquier combinación de valores, variables y operadores que se evalúa a un solo valor.

```python
# Simple expressions
5 + 3           # 8
x * 2           # depends on x
age >= 18       # True or False

# Complex expressions
result = (x + y) * (z - 1) / 2
is_valid = age >= 18 and has_id == True
```

## Operadores aritméticos

Los operadores aritméticos realizan cálculos matemáticos.

### Referencia de operadores aritméticos

| Operador | Nombre | Ejemplo | Resultado |
|----------|------|---------|--------|
| `+` | Suma | `10 + 3` | `13` |
| `-` | Resta | `10 - 3` | `7` |
| `*` | Multiplicación | `10 * 3` | `30` |
| `/` | División | `10 / 3` | `3.333...` |
| `//` | División entera | `10 // 3` | `3` |
| `%` | Módulo | `10 % 3` | `1` |
| `**` | Potenciación | `10 ** 3` | `1000` |

### Aritmética en acción

```python
# Basic arithmetic
a = 17
b = 5

print(f"a = {a}, b = {b}\n")
print(f"Addition:       {a} + {b} = {a + b}")
print(f"Subtraction:    {a} - {b} = {a - b}")
print(f"Multiplication: {a} * {b} = {a * b}")
print(f"Division:       {a} / {b} = {a / b}")
print(f"Floor Division: {a} // {b} = {a // b}")
print(f"Modulus:        {a} % {b} = {a % b}")
print(f"Exponentiation: {a} ** {b} = {a ** b}")
```

Salida:
```
a = 17, b = 5

Addition:       17 + 5 = 22
Subtraction:    17 - 5 = 12
Multiplication: 17 * 5 = 85
Division:       17 / 5 = 3.4
Floor Division: 17 // 5 = 3
Modulus:        17 % 5 = 2
Exponentiation: 17 ** 5 = 1419857
```

### Uso práctico del módulo y de la división entera

```python
# Time conversion: seconds to hours, minutes, seconds
total_seconds = 10000

hours = total_seconds // 3600
remaining = total_seconds % 3600
minutes = remaining // 60
seconds = remaining % 60

print(f"{total_seconds} seconds = {hours}h {minutes}m {seconds}s")
# Output: 10000 seconds = 2h 46m 40s

# Check if a number is even or odd
def check_even_odd(number):
    if number % 2 == 0:
        return f"{number} is even"
    else:
        return f"{number} is odd"

print(check_even_odd(42))  # 42 is even
print(check_even_odd(17))  # 17 is odd
```

## Operadores de comparación

Los operadores de comparación comparan dos valores y devuelven un resultado booleano.

### Referencia de operadores de comparación

| Operador | Nombre | Ejemplo | Resultado |
|----------|------|---------|--------|
| `==` | Igual a | `5 == 5` | `True` |
| `!=` | Distinto de | `5 != 3` | `True` |
| `>` | Mayor que | `5 > 3` | `True` |
| `<` | Menor que | `5 < 3` | `False` |
| `>=` | Mayor o igual que | `5 >= 5` | `True` |
| `<=` | Menor o igual que | `5 <= 3` | `False` |

### Comparaciones en acción

```python
x = 10
y = 20

print(f"x = {x}, y = {y}\n")
print(f"x == y: {x == y}")   # False
print(f"x != y: {x != y}")   # True
print(f"x > y:  {x > y}")    # False
print(f"x < y:  {x < y}")    # True
print(f"x >= y: {x >= y}")   # False
print(f"x <= y: {x <= y}")   # True

# Chaining comparisons (Python feature!)
age = 25
print(f"\n18 <= {age} <= 65: {18 <= age <= 65}")  # True
print(f"0 <= {age} <= 18: {0 <= age <= 18}")      # False
```

> [!TIP]
> ¡Python permite encadenar comparaciones! `18 <= age <= 65` equivale a `18 <= age and age <= 65`, pero es más legible.

### Ejemplo del mundo real: verificación de edad

```python
def check_access(age, has_ticket, is_vip):
    """Determine if a person can enter an event."""
    
    # Age check
    age_ok = age >= 18
    
    # Access logic
    if is_vip:
        access = age_ok  # VIPs only need age check
        reason = "VIP access granted"
    elif has_ticket:
        access = age_ok
        reason = "Ticket holder" if age_ok else "Underage"
    else:
        access = False
        reason = "No ticket"
    
    return access, reason

# Test cases
print(check_access(25, True, False))   # (True, 'Ticket holder')
print(check_access(16, True, False))   # (False, 'Underage')
print(check_access(17, False, True))   # (False, 'VIP access granted')
print(check_access(30, False, True))   # (True, 'VIP access granted')
```

## Operadores lógicos

Los operadores lógicos combinan expresiones booleanas.

### Referencia de operadores lógicos

| Operador | Descripción | Ejemplo | Resultado |
|----------|-------------|---------|--------|
| `and` | Verdadero si ambos son verdaderos | `True and False` | `False` |
| `or` | Verdadero si al menos uno es verdadero | `True or False` | `True` |
| `not` | Invierte el booleano | `not True` | `False` |

### Tablas de verdad

```mermaid
flowchart TD
    subgraph "Tabla de verdad AND"
        A1["True AND True = True"]
        A2["True AND False = False"]
        A3["False AND True = False"]
        A4["False AND False = False"]
    end
    
    subgraph "Tabla de verdad OR"
        B1["True OR True = True"]
        B2["True OR False = True"]
        B3["False OR True = True"]
        B4["False OR False = False"]
    end
    
    subgraph "Tabla de verdad NOT"
        C1["NOT True = False"]
        C2["NOT False = True"]
    end
```

### Operadores lógicos en acción

```python
# AND: Both conditions must be True
age = 25
has_id = True

can_enter = age >= 18 and has_id
print(f"Can enter (AND): {can_enter}")  # True

# OR: At least one condition must be True
is_weekend = False
is_holiday = True

no_work = is_weekend or is_holiday
print(f"No work today (OR): {no_work}")  # True

# NOT: Inverts the result
is_raining = False
print(f"Need umbrella (NOT): {not is_raining}")  # True (it's NOT raining, so no umbrella needed... wait!)

# Actually, let's fix the logic:
need_umbrella = is_raining  # If it's raining, we need umbrella
print(f"Need umbrella: {need_umbrella}")  # False
```

### Evaluación en cortocircuito

```python
# AND short-circuits: if first is False, second is not evaluated
def check():
    print("  check() was called!")
    return True

result = False and check()  # check() is NOT called
print(f"Result: {result}")

result = True and check()   # check() IS called
print(f"Result: {result}")
```

Salida:
```
Result: False
  check() was called!
Result: True
```

> [!NOTE]
> La evaluación en cortocircuito es útil para evitar errores:
> ```python
> # Safe division
> if divisor != 0 and (numerator / divisor) > 10:
>     print("Large result")
> ```

## Operadores de asignación

Los operadores de asignación asignan y actualizan los valores de las variables.

### Referencia de operadores de asignación

| Operador | Ejemplo | Equivale a |
|----------|---------|---------------|
| `=` | `x = 5` | `x = 5` |
| `+=` | `x += 3` | `x = x + 3` |
| `-=` | `x -= 3` | `x = x - 3` |
| `*=` | `x *= 3` | `x = x * 3` |
| `/=` | `x /= 3` | `x = x / 3` |
| `//=` | `x //= 3` | `x = x // 3` |
| `%=` | `x %= 3` | `x = x % 3` |
| `**=` | `x **= 3` | `x = x ** 3` |

### Asignaciones en acción

```python
# Basic assignment
score = 100
print(f"Initial score: {score}")

# Augmented assignment
score += 10   # Add 10
print(f"After += 10: {score}")   # 110

score -= 20   # Subtract 20
print(f"After -= 20: {score}")   # 90

score *= 2    # Multiply by 2
print(f"After *= 2: {score}")    # 180

score /= 3    # Divide by 3
print(f"After /= 3: {score}")    # 60.0 (becomes float!)

score //= 7   # Floor divide by 7
print(f"After //= 7: {score}")   # 8.0

score **= 2   # Square it
print(f"After **= 2: {score}")   # 64.0
```

### Ejemplo práctico: total acumulado

```python
# Shopping cart total
cart_total = 0

# Add items
cart_total += 29.99   # Book
print(f"After book: R${cart_total:.2f}")

cart_total += 149.90  # Headphones
print(f"After headphones: R${cart_total:.2f}")

cart_total += 5.50    # Coffee
print(f"After coffee: R${cart_total:.2f}")

# Apply 10% discount
cart_total *= 0.90
print(f"After 10% discount: R${cart_total:.2f}")
```

Salida:
```
After book: R$29.99
After headphones: R$179.89
After coffee: R$185.39
After 10% discount: R$166.85
```

## Operadores de identidad

Los operadores de identidad comprueban si dos variables hacen referencia al mismo objeto en la memoria.

### Identidad frente a igualdad

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(f"a = {a}")
print(f"b = {b}")
print(f"c = {c}\n")

# Equality: same value?
print(f"a == b: {a == b}")   # True (same values)
print(f"a == c: {a == c}")   # True (same values)

# Identity: same object in memory?
print(f"a is b: {a is b}")   # False (different objects)
print(f"a is c: {a is c}")   # True (same object!)
print(f"a is not b: {a is not b}")  # True
```

> [!WARNING]
> Usa `==` para comparar valores. Usa `is` solo cuando compruebes `None` o compares singletons:
> ```python
> # Correct
> if value is None:
>     ...
> 
> # Incorrect (might work but is bad practice)
> if value is 5:
>     ...
> ```

## Operadores de pertenencia

Los operadores de pertenencia comprueban si un valor existe en una secuencia.

### Referencia de operadores de pertenencia

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `in` | Verdadero si se encuentra el valor | `'a' in 'apple'` → `True` |
| `not in` | Verdadero si NO se encuentra el valor | `'z' not in 'apple'` → `True` |

### Pertenencia en acción

```python
# String membership
text = "Python Programming"
print(f"'Py' in text: {'Py' in text}")         # True
print(f"'Java' in text: {'Java' in text}")      # False
print(f"'x' not in text: {'x' not in text}")    # True

# List membership
fruits = ["apple", "banana", "cherry"]
print(f"'apple' in fruits: {'apple' in fruits}")       # True
print(f"'grape' in fruits: {'grape' in fruits}")       # False
print(f"'grape' not in fruits: {'grape' not in fruits}") # True

# Practical: Permission check
allowed_users = ["admin", "moderator", "editor"]
current_user = "editor"

if current_user in allowed_users:
    print(f"Access granted for {current_user}")
else:
    print(f"Access denied for {current_user}")
```

## Precedencia de operadores

Cuando aparecen varios operadores en una expresión, Python los evalúa en un orden específico; por ejemplo, `**` se evalúa antes que `*` y antes que `+`.

### Tabla de precedencia (de mayor a menor)

| Prioridad | Operadores |
|----------|-----------|
| 1 (Mayor) | `**` (potenciación) |
| 2 | `*`, `/`, `//`, `%` |
| 3 | `+`, `-` |
| 4 | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| 5 | `not` |
| 6 | `and` |
| 7 (Menor) | `or` |

### Ejemplos de precedencia

```python
# Without parentheses (follows precedence)
result = 5 + 3 * 2 ** 2
# Step 1: 2 ** 2 = 4
# Step 2: 3 * 4 = 12
# Step 3: 5 + 12 = 17
print(f"5 + 3 * 2 ** 2 = {result}")  # 17

# With parentheses (overrides precedence)
result = (5 + 3) * 2 ** 2
# Step 1: (5 + 3) = 8
# Step 2: 2 ** 2 = 4
# Step 3: 8 * 4 = 32
print(f"(5 + 3) * 2 ** 2 = {result}")  # 32

# Complex expression
x = 10
y = 3
result = x + y * 2 > 15 and x - y < 10
# Step 1: y * 2 = 6
# Step 2: x + 6 = 16
# Step 3: 16 > 15 = True
# Step 4: x - y = 7
# Step 5: 7 < 10 = True
# Step 6: True and True = True
print(f"Result: {result}")  # True
```

> [!TIP]
> ¡Cuando tengas dudas, usa paréntesis! Dejan clara tu intención y anulan las reglas de precedencia:
> ```python
> # Unclear
> result = a + b * c > d and e or f
> 
> # Clear
> result = ((a + (b * c)) > d and e) or f
> ```

## Ejemplo del mundo real: calculadora de calificaciones

```python
# grade_calculator.py
# Calculate letter grade from numeric score

def calculate_grade(score):
    """Convert numeric score to letter grade."""
    
    # Validate input
    if not 0 <= score <= 100:
        return "Invalid score"
    
    # Determine grade
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
    
    # Add + or - modifier
    remainder = score % 10
    if grade not in ("F",) and remainder >= 7:
        grade += "-"
    elif grade not in ("F",) and remainder <= 3 and grade != "A":
        grade += "+"
    
    return grade

# Test the function
test_scores = [95, 87, 72, 65, 58, 100, 0, 83]

print("Grade Calculator")
print("=" * 25)
for score in test_scores:
    print(f"Score: {score:3d} → Grade: {calculate_grade(score)}")
```

Salida:
```
Grade Calculator
=========================
Score:  95 → Grade: A-
Score:  87 → Grade: B
Score:  72 → Grade: C+
Score:  65 → Grade: D
Score:  58 → Grade: F
Score: 100 → Grade: A-
Score:   0 → Grade: F
Score:  83 → Grade: B+
```

## Ejercicios de práctica

### Ejercicio 1: Práctica aritmética
Calcula lo siguiente con Python:
- El área de un círculo con radio 7 (usa `3.14159 * r ** 2`)
- Cuántas horas completas hay en 5000 segundos
- El resto de dividir 1234 entre 7

### Ejercicio 2: Cadenas de comparaciones
Escribe expresiones con comparaciones encadenadas para comprobar:
- Si un número está entre 1 y 100 (ambos incluidos)
- Si una temperatura está entre 18 y 25 grados (ambos excluidos)

### Ejercicio 3: Operadores lógicos
Escribe una condición que sea verdadera cuando:
- Una persona es estudiante Y mayor de 18 O tiene el permiso de un padre o tutor
- Un número es divisible entre 3 Y entre 5

### Ejercicio 4: Operadores de asignación
Empezando con `x = 100`, aplica estas operaciones en orden y muestra el resultado después de cada una:
- `x += 50`
- `x *= 2`
- `x //= 3`
- `x %= 7`

### Ejercicio 5: Comprobación de pertenencia
Crea una lista de vocales `['a', 'e', 'i', 'o', 'u']` y escribe código que compruebe si un carácter introducido por el usuario es una vocal.

### Ejercicio 6: Precedencia de operadores
Predice el resultado antes de ejecutar:
- `2 + 3 * 4 - 1`
- `(2 + 3) * (4 - 1)`
- `2 ** 3 * 2`
- `not True or False and True`

### Ejercicio 7: Calculadora de IMC
Escribe un programa que calcule el índice de masa corporal: `BMI = weight_kg / height_m ** 2`
Clasifica como: bajo peso (<18.5), normal (18.5-24.9), sobrepeso (25-29.9) y obesidad (30+)

### Ejercicio 8: Verificador de años bisiestos
Un año es bisiesto si:
- Es divisible entre 4 Y NO es divisible entre 100, O
- Es divisible entre 400
Escribe una función que compruebe si un año dado es bisiesto.

## Resumen

En esta lección aprendiste:
- Los operadores aritméticos para los cálculos matemáticos
- Los operadores de comparación para comparar valores
- Los operadores lógicos (`and`, `or`, `not`) para combinar condiciones
- Los operadores de asignación para actualizar variables de forma eficiente
- Los operadores de identidad (`is`, `is not`) para comparar objetos
- Los operadores de pertenencia (`in`, `not in`) para comprobar secuencias
- La precedencia de operadores y la importancia de los paréntesis
- Cómo combinar operadores en programas del mundo real

Los operadores son las herramientas que te permiten manipular datos. Domínalos para escribir expresiones de Python potentes.
