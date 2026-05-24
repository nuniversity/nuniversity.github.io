---
title: "Bucles (for y while)"
description: "Domina la iteración en Python con bucles for, bucles while, range(), break, continue y bucles anidados"
order: 6
duration: "30 minutos"
difficulty: "beginner"
---

# Bucles (for y while)

Los bucles te permiten repetir código múltiples veces — esencial para procesar datos, automatizar tareas y construir programas eficientes.

## El Bucle for

Itera sobre una secuencia (lista, cadena, range, etc.):

```python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

### Iterando a Través de una Cadena
```python
for char in "Python":
    print(char)
# Salida: P, y, t, h, o, n
```

### Usando range()

`range(inicio, fin, paso)` genera una secuencia de números:

```python
# 0 a 4
for i in range(5):
    print(i)

# 2 a 8 (paso 2)
for i in range(2, 9, 2):
    print(i)

# Cuenta regresiva
for i in range(10, 0, -1):
    print(i)
print("Blast off!")
```

## El Bucle while

Se ejecuta mientras una condición sea True:

```python
count = 0
while count < 5:
    print(count)
    count += 1
```

### Validación de Entrada
```python
password = ""
while password != "secret":
    password = input("Enter password: ")
print("Access granted!")
```

> [!WARNING]
> ¡Asegúrate siempre de que la condición del bucle while eventualmente se vuelva False — de lo contrario creas un bucle infinito!

## break y continue

### break — Sale del bucle completamente
```python
for i in range(100):
    if i == 5:
        break
    print(i)
# Imprime: 0 1 2 3 4
```

### continue — Salta a la siguiente iteración
```python
for i in range(10):
    if i % 2 == 0:
        continue
    print(i)
# Imprime: 1 3 5 7 9
```

## Bucles Anidados

Bucles dentro de bucles:

```python
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})", end=" ")
    print()
# Salida:
# (0, 0) (0, 1) (0, 2)
# (1, 0) (1, 1) (1, 2)
# (2, 0) (2, 1) (2, 2)
```

## La Cláusula else en Bucles

Se ejecuta cuando el bucle termina normalmente (sin break):

```python
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} = {x} * {n//x}")
            break
    else:
        print(f"{n} is prime")
```

## enumerate — Bucle con Índice

```python
colors = ["red", "green", "blue"]
for index, color in enumerate(colors):
    print(f"{index}: {color}")
# 0: red, 1: green, 2: blue
```

## zip — Bucle con Múltiples Listas Simultáneamente

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

> [!SUCCESS]
| Bucle | Cuándo Usarlo | Ejemplo |
|---|---|---|
| `for` | Iterar sobre una secuencia conocida | `for item in list:` |
| `while` | Repetir hasta que una condición cambie | `while running:` |
| `for` + `range()` | Número conocido de iteraciones | `for i in range(10):` |

## Preguntas de Práctica

1. Escribe un bucle for que imprima los números del 1 al 10.
2. ¿Qué genera `range(5)`?
3. Escribe un bucle while que sume números del 1 al 100.
4. ¿Cuál es la diferencia entre `break` y `continue`?
5. Escribe bucles anidados para imprimir una tabla de multiplicar de 3×3.
6. ¿Cómo recorres una lista con índice y valor a la vez?
7. ¿Qué sucede si la condición de un bucle while es siempre True?
8. Escribe un bucle for con una cláusula else.
9. ¿Cómo recorres dos listas simultáneamente?
10. Escribe un programa que imprima todos los números pares del 1 al 20 usando continue.
