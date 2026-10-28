---
title: "Flujo de control: condicionales"
description: "Domina las condicionales de Python: las sentencias if, elif y else, las condiciones anidadas, el operador ternario y patrones prácticos de toma de decisiones."
order: 5
duration: "55 min"
difficulty: "beginner"
language: "es"
---

# Flujo de control: condicionales

El flujo de control determina el orden en que se ejecutan las sentencias. Las condicionales permiten que tu programa tome decisiones y ejecute código diferente según las condiciones.

## ¿Qué es el flujo de control?

De forma predeterminada, Python ejecuta las sentencias de forma secuencial, una tras otra. Las condicionales te permiten cambiar este flujo según las condiciones.

```mermaid
flowchart TD
    A[Inicio] --> B{¿Condición?}
    B -->|Verdadero| C[Ejecuta el bloque A]
    B -->|Falso| D[Ejecuta el bloque B]
    C --> E[Continúa]
    D --> E
    
    style B fill:#fff3e0
    style C fill:#e8f5e9
    style D fill:#fce4ec
```

## La sentencia if

La sentencia `if` ejecuta un bloque de código solo cuando una condición es verdadera.

### Sintaxis básica

```python
if condition:
    # Code executes only if condition is True
    print("Condition is True!")
```

### Ejemplo sencillo con if

```python
# Check if a number is positive
number = 15

if number > 0:
    print(f"{number} is positive")

print("Program continues...")
```

Salida:
```
15 is positive
Program continues...
```

```python
# What if the condition is False?
number = -5

if number > 0:
    print(f"{number} is positive")  # This won't execute

print("Program continues...")
```

Salida:
```
Program continues...
```

> [!NOTE]
> Python usa la indentación (normalmente 4 espacios) para definir bloques de código. Esto no es opcional: así es como Python sabe qué sentencias pertenecen al bloque if.

## La sentencia if-else

La cláusula `else` ofrece una alternativa cuando la condición es falsa.

### Sintaxis

```python
if condition:
    # Executes when condition is True
    pass
else:
    # Executes when condition is False
    pass
```

### Ejemplo con if-else

```python
# Age verification
age = 16

if age >= 18:
    print("You are an adult.")
    print("You can vote and drive.")
else:
    print("You are a minor.")
    print("You need parental consent.")
```

Salida:
```
You are a minor.
You need parental consent.
```

### Ejemplo del mundo real: sistema de inicio de sesión

```python
# login_system.py
def check_login(username, password):
    """Simple login verification."""
    
    # Valid credentials (in real apps, these would be in a database)
    valid_username = "admin"
    valid_password = "python123"
    
    if username == valid_username and password == valid_password:
        print("Login successful! Welcome back.")
        return True
    else:
        print("Invalid username or password.")
        return False

# Test the login system
print("=== Login System ===")
check_login("admin", "python123")   # Success
print()
check_login("admin", "wrongpass")   # Failure
print()
check_login("user", "python123")    # Failure
```

Salida:
```
=== Login System ===
Login successful! Welcome back.

Invalid username or password.

Invalid username or password.
```

## La sentencia if-elif-else

Cuando tienes varias condiciones que comprobar, usa `elif` (else if).

### Sintaxis

```python
if condition1:
    # Executes if condition1 is True
    pass
elif condition2:
    # Executes if condition1 is False and condition2 is True
    pass
elif condition3:
    # Executes if condition1 and condition2 are False, and condition3 is True
    pass
else:
    # Executes if all conditions are False
    pass
```

### Diagrama de flujo

```mermaid
flowchart TD
    A[Inicio] --> B{¿Condición 1?}
    B -->|Verdadero| C[Bloque 1]
    B -->|Falso| D{¿Condición 2?}
    D -->|Verdadero| E[Bloque 2]
    D -->|Falso| F{¿Condición 3?}
    F -->|Verdadero| G[Bloque 3]
    F -->|Falso| H[Bloque else]
    
    C --> I[Fin]
    E --> I
    G --> I
    H --> I
    
    style B fill:#fff3e0
    style D fill:#fff3e0
    style F fill:#fff3e0
```

### Ejemplo: calculadora de calificaciones

```python
# grade_calculator.py
def get_letter_grade(score):
    """Convert numeric score to letter grade."""
    
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"

# Test with various scores
scores = [95, 87, 72, 65, 45]

for score in scores:
    grade = get_letter_grade(score)
    print(f"Score: {score:3d} → Grade: {grade}")
```

Salida:
```
Score:  95 → Grade: A
Score:  87 → Grade: B
Score:  72 → Grade: C
Score:  65 → Grade: D
Score:  45 → Grade: F
```

> [!WARNING]
> ¡Las condiciones se comprueban en orden! En cuanto se encuentra una condición verdadera, el resto se omite. Esto significa:
> ```python
> # WRONG ORDER: always returns "A"
> if score >= 60:
>     return "D"  # 95 >= 60 is True, so this executes!
> elif score >= 90:
>     return "A"  # Never reached
> 
> # CORRECT ORDER: check highest first
> if score >= 90:
>     return "A"
> elif score >= 60:
>     return "D"
> ```

## Condicionales anidadas

Puedes colocar sentencias if dentro de otras sentencias if.

### Ejemplo de if anidado

```python
# ticket_pricing.py
def calculate_ticket_price(age, is_student, is_weekend):
    """Calculate movie ticket price with discounts."""
    
    base_price = 15.00
    
    if age < 12:
        # Child pricing
        price = base_price * 0.5
        category = "Child"
    elif age >= 65:
        # Senior pricing
        price = base_price * 0.6
        category = "Senior"
    else:
        # Adult pricing
        if is_student:
            price = base_price * 0.8
            category = "Student"
        else:
            price = base_price
            category = "Adult"
    
    # Weekend surcharge
    if is_weekend:
        price += 2.00
    
    return category, price

# Test cases
test_cases = [
    (10, False, False),   # Child, weekday
    (70, False, True),    # Senior, weekend
    (25, True, False),    # Student, weekday
    (30, False, True),    # Adult, weekend
]

print("Movie Ticket Pricing")
print("=" * 45)
for age, student, weekend in test_cases:
    category, price = calculate_ticket_price(age, student, weekend)
    day = "Weekend" if weekend else "Weekday"
    print(f"Age {age:2d}, {category:8s}, {day}: R${price:.2f}")
```

Salida:
```
Movie Ticket Pricing
=============================================
Age 10, Child   , Weekday: R$7.50
Age 70, Senior  , Weekend: R$11.00
Age 25, Student , Weekday: R$12.00
Age 30, Adult   , Weekend: R$17.00
```

## Operador ternario (expresión condicional)

Python tiene una forma concisa de escribir sentencias if-else sencillas en una sola línea.

### Sintaxis

```python
value = true_value if condition else false_value
```

### Ejemplos de operador ternario

```python
# Basic usage
age = 20
status = "adult" if age >= 18 else "minor"
print(f"Status: {status}")  # adult

# With numbers
x = 10
y = 20
maximum = x if x > y else y
print(f"Maximum: {maximum}")  # 20

# Absolute value
number = -15
abs_value = number if number >= 0 else -number
print(f"Absolute value: {abs_value}")  # 15

# Even or odd
num = 7
result = "even" if num % 2 == 0 else "odd"
print(f"{num} is {result}")  # 7 is odd
```

### Ejemplo práctico: calculadora de descuentos

```python
# discount_calculator.py
def apply_discount(price, is_member, purchase_amount):
    """Apply discount based on membership and purchase amount."""
    
    # Member discount
    member_discount = 0.15 if is_member else 0.05
    
    # Bulk purchase bonus
    bulk_bonus = 0.10 if purchase_amount > 100 else 0.0
    
    # Total discount (capped at 20%)
    total_discount = min(member_discount + bulk_bonus, 0.20)
    
    final_price = price * (1 - total_discount)
    
    return final_price, total_discount * 100

# Test cases
print("Discount Calculator")
print("=" * 50)
print(f"{'Price':>8} {'Member':>8} {'Amount':>8} {'Discount':>10} {'Final':>8}")
print("-" * 50)

tests = [
    (50.00, True, 50),
    (120.00, True, 120),
    (80.00, False, 80),
    (200.00, False, 200),
]

for price, member, amount in tests:
    final, disc_pct = apply_discount(price, member, amount)
    member_str = "Yes" if member else "No"
    print(f"R${price:7.2f} {member_str:>8} R${amount:7.2f} {disc_pct:9.1f}% R${final:7.2f}")
```

Salida:
```
Discount Calculator
==================================================
   Price   Member   Amount   Discount    Final
--------------------------------------------------
R$  50.00      Yes  R$  50.00      15.0% R$  42.50
R$ 120.00      Yes  R$ 120.00      20.0% R$  96.00
R$  80.00       No  R$  80.00       5.0% R$  76.00
R$ 200.00       No  R$ 200.00      15.0% R$ 170.00
```

## Múltiples condiciones con operadores lógicos

Combina condiciones usando `and`, `or` y `not`.

### Combinación de condiciones

```python
# Weather activity recommender
def recommend_activity(temperature, is_raining, is_weekend):
    """Recommend an activity based on weather conditions."""
    
    if not is_raining and temperature >= 25:
        return "Go to the beach!"
    elif not is_raining and 15 <= temperature < 25:
        return "Go for a walk in the park."
    elif is_raining and is_weekend:
        return "Watch a movie at home."
    elif is_raining and not is_weekend:
        return "Take an umbrella to work."
    elif temperature < 15:
        return "Stay indoors with hot chocolate."
    else:
        return "Check local events."

# Test scenarios
scenarios = [
    (30, False, True),   # Hot, sunny, weekend
    (20, False, False),  # Mild, sunny, weekday
    (18, True, True),    # Mild, rainy, weekend
    (10, True, False),   # Cold, rainy, weekday
    (5, False, True),    # Cold, sunny, weekend
]

print("Activity Recommender")
print("=" * 60)
for temp, rain, weekend in scenarios:
    weather = "Rainy" if rain else "Sunny"
    day = "Weekend" if weekend else "Weekday"
    activity = recommend_activity(temp, rain, weekend)
    print(f"{temp:2d}°C, {weather:6s}, {day:7s} → {activity}")
```

Salida:
```
Activity Recommender
============================================================
30°C, Sunny , Weekend → Go to the beach!
20°C, Sunny , Weekday → Go for a walk in the park.
18°C, Rainy, Weekend → Watch a movie at home.
10°C, Rainy, Weekday → Take an umbrella to work.
 5°C, Sunny , Weekend → Stay indoors with hot chocolate.
```

## Valores truthy y falsy en las condiciones

Python permite cualquier valor en una condición, no solo booleanos.

### Valores truthy y falsy

```python
# Falsy values (evaluate to False)
falsy_values = [
    False,
    None,
    0,
    0.0,
    "",           # Empty string
    [],           # Empty list
    {},           # Empty dict
    set(),        # Empty set
]

print("Falsy values:")
for val in falsy_values:
    print(f"  bool({repr(val):10s}) = {bool(val)}")

# Truthy values (evaluate to True)
print("\nTruthy values:")
print(f"  bool(1) = {bool(1)}")
print(f"  bool('hello') = {bool('hello')}")
print(f"  bool([1, 2, 3]) = {bool([1, 2, 3])}")
```

Salida:
```
Falsy values:
  bool(False    ) = False
  bool(None     ) = False
  bool(0        ) = False
  bool(0.0      ) = False
  bool(''       ) = False
  bool([]       ) = False
  bool({}       ) = False
  bool(set()    ) = False

Truthy values:
  bool(1) = True
  bool('hello') = True
  bool([1, 2, 3]) = True
```

### Python idiomático: comprobación de valores vacíos

```python
# Instead of this:
if len(my_list) > 0:
    print("List has items")

# Write this (more Pythonic):
if my_list:
    print("List has items")

# Instead of this:
if my_string != "":
    print("String is not empty")

# Write this:
if my_string:
    print("String is not empty")
```

## Ejemplo del mundo real: sistema de retiro de efectivo en un cajero automático

```python
# atm_system.py
def atm_withdrawal(balance, amount, pin, daily_limit):
    """Simulate an ATM withdrawal with multiple checks."""
    
    # Check 1: PIN validation
    if pin != 1234:
        return "ERROR: Invalid PIN"
    
    # Check 2: Amount must be positive
    if amount <= 0:
        return "ERROR: Amount must be positive"
    
    # Check 3: Amount must be multiple of 10
    if amount % 10 != 0:
        return "ERROR: Amount must be a multiple of 10"
    
    # Check 4: Sufficient balance
    if amount > balance:
        return f"ERROR: Insufficient funds. Balance: R${balance:.2f}"
    
    # Check 5: Daily limit
    if amount > daily_limit:
        return f"ERROR: Exceeds daily limit of R${daily_limit:.2f}"
    
    # All checks passed - process withdrawal
    new_balance = balance - amount
    return f"SUCCESS: Withdrawn R${amount:.2f}. New balance: R${new_balance:.2f}"

# Test the ATM system
print("=== ATM Withdrawal System ===\n")

test_cases = [
    (500.00, 100, 1234, 300),   # Valid withdrawal
    (500.00, 100, 5678, 300),   # Wrong PIN
    (500.00, -50, 1234, 300),   # Negative amount
    (500.00, 55, 1234, 300),    # Not multiple of 10
    (500.00, 600, 1234, 300),   # Insufficient funds
    (500.00, 400, 1234, 300),   # Exceeds daily limit
]

for balance, amount, pin, limit in test_cases:
    result = atm_withdrawal(balance, amount, pin, limit)
    print(f"Balance: R${balance:7.2f}, Withdraw: R${amount:4d}, PIN: {pin}")
    print(f"  → {result}\n")
```

Salida:
```
=== ATM Withdrawal System ===

Balance: R$ 500.00, Withdraw: R$ 100, PIN: 1234
  → SUCCESS: Withdrawn R$100.00. New balance: R$400.00

Balance: R$ 500.00, Withdraw: R$ 100, PIN: 5678
  → ERROR: Invalid PIN

Balance: R$ 500.00, Withdraw: R$ -50, PIN: 1234
  → ERROR: Amount must be positive

Balance: R$ 500.00, Withdraw: R$  55, PIN: 1234
  → ERROR: Amount must be a multiple of 10

Balance: R$ 500.00, Withdraw: R$ 600, PIN: 1234
  → ERROR: Insufficient funds. Balance: R$500.00

Balance: R$ 500.00, Withdraw: R$ 400, PIN: 1234
  → ERROR: Exceeds daily limit of R$300.00
```

## Ejercicios de práctica

### Ejercicio 1: positivo, negativo o cero
Escribe un programa que compruebe si un número es positivo, negativo o cero.

### Ejercicio 2: comparador de números
Escribe un programa que reciba dos números e imprima cuál es mayor, o si son iguales.

### Ejercicio 3: verificador de años bisiestos
Escribe un programa que determine si un año es bisiesto usando condicionales anidadas.

### Ejercicio 4: clasificador de calificaciones
Crea un programa que reciba una calificación (0-100) y devuelva:
- "Excelente" para 90-100
- "Bien" para 75-89
- "Regular" para 60-74
- "Necesita mejorar" para menos de 60

### Ejercicio 5: calculadora sencilla
Escribe una calculadora que reciba dos números y una operación (+, -, *, /) y realice el cálculo. Maneja la división entre cero.

### Ejercicio 6: práctica con el operador ternario
Reescribe estas sentencias if-else como expresiones ternarias:
```python
if x > 100:
    result = "high"
else:
    result = "low"
```

### Ejercicio 7: verificador de la fortaleza de una contraseña
Escribe una función que compruebe la fortaleza de una contraseña:
- "Débil" si la longitud es menor que 6
- "Media" si la longitud está entre 6 y 11
- "Fuerte" si la longitud es mayor o igual que 12 y contiene mayúsculas
- "Muy fuerte" si la longitud es mayor o igual que 12, contiene mayúsculas y contiene un dígito

### Ejercicio 8: piedra, papel o tijera
Escribe un programa que determine el ganador de una ronda de piedra, papel o tijera dadas dos elecciones.

## Resumen

En esta lección aprendiste:
- Cómo usar las sentencias `if` para la toma de decisiones básicas
- Cómo `if-else` ofrece dos rutas de ejecución
- Cómo `if-elif-else` maneja múltiples condiciones
- Cómo anidar condicionales para lógica compleja
- Cómo usar el operador ternario para escribir expresiones concisas
- Cómo combinar condiciones con operadores lógicos
- Cómo funcionan los valores truthy y falsy en Python
- Cómo construir sistemas de toma de decisiones del mundo real

Las condicionales son esenciales para crear programas que responden a situaciones diferentes. Practica la escritura de condicionales para desarrollar tu habilidad para tomar decisiones en código.
