---
title: "Condicionales (if/elif/else)"
description: "Controla el flujo del programa con sentencias condicionales: if, elif, else, condiciones anidadas y el operador ternario"
order: 5
duration: "25 minutos"
difficulty: "beginner"
---

# Condicionales (if/elif/else)

Los condicionales permiten que tu programa tome decisiones basadas en condiciones. Así es como el código se vuelve "inteligente".

## La Sentencia if

```python
age = 18
if age >= 18:
    print("You are an adult")
```

¡La indentación importa! El bloque bajo `if` debe estar indentado de manera consistente.

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
> Python no tiene una sentencia `switch`. Usa `if/elif/else` en su lugar. Python 3.10+ tiene `match` (coincidencia de patrones estructural).

## Condicionales Anidados

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

## El Operador Ternario (Expresión Condicional)

Una forma compacta de escribir condicionales simples:

```python
# Forma estándar
if age >= 18:
    status = "Adult"
else:
    status = "Minor"

# Forma ternaria (una línea)
status = "Adult" if age >= 18 else "Minor"
```

## Veracidad (Truthiness)

En Python, algunos valores son "truthy" y otros son "falsy":

```python
# Valores falsy (evalúan a False en contexto booleano)
False, None, 0, 0.0, "", [], {}, set(), range(0)

# Todo lo demás es truthy
name = "Alice"
if name:  # True porque la cadena no está vacía
    print(f"Hello, {name}")
```

### Ejemplos Prácticos
```python
# Verificar si una lista está vacía
items = []
if not items:
    print("Cart is empty")

# Verificar si un número es distinto de cero
count = 5
if count:
    print(f"Processing {count} items")
```

> [!WARNING]
> Ten cuidado con `==` vs `=`. `=` es asignación, `==` es comparación. Usar `=` en una condición (`if x = 5:`) provoca un error de sintaxis.

## Caso de Uso Real: Autenticación de Usuario

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
> Piensa en los condicionales como puntos de decisión en tu programa: si esto es verdadero, haz esto; de lo contrario, haz aquello.

## Preguntas de Práctica

1. Escribe una sentencia if que imprima "Positive" si `num > 0`.
2. ¿Cuál es la diferencia entre `=` y `==` en Python?
3. Convierte esto a ternario: `if x > 0: result = "positive" else: result = "negative"`
4. Enumera todos los valores falsy en Python.
5. ¿A qué evalúa `if "":`?
6. Escribe un condicional anidado que verifique si una persona tiene al menos 18 años Y tiene un boleto válido.
7. ¿Qué hay de malo con `if x = 10:`?
8. ¿Cómo escribes un condicional múltiple en Python (como switch/case)?
9. Escribe un programa que imprima "Even" o "Odd" basado en un número.
10. ¿Qué genera esto: `status = "pass" if score >= 60 else "fail"` si score es 45?
