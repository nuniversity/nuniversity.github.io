---
title: "Introducción a la Programación Funcional con Python"
description: "Explora el paradigma funcional usando Python: funciones puras, map/filter/reduce y comprensiones de lista"
order: 7
duration: "35 minutes"
difficulty: "intermediate"
---

# Introducción a la Programación Funcional con Python

Hasta ahora has escrito código imperativo — instrucciones paso a paso que cambian estado. La programación funcional es un paradigma diferente: enfatiza funciones puras, inmutabilidad y transformación de datos a través de pipelines.

## ¿Qué es la Programación Funcional?

La programación funcional trata la computación como la evaluación de funciones matemáticas. Principios clave:

- **Funciones puras**: Misma entrada siempre produce la misma salida, sin efectos secundarios
- **Inmutabilidad**: Los datos nunca se modifican — se crean nuevos datos
- **Composición de funciones**: Construye operaciones complejas combinando funciones simples

## Funciones Puras

Una función pura depende solo de sus entradas y no tiene efectos secundarios:

```python
# Pura: misma entrada siempre da la misma salida
def sumar(a, b):
    return a + b

# Impura: depende de estado externo
total = 0
def sumar_al_total(x):
    global total
    total += x     # efecto secundario — modifica variable externa
    return total
```

Las funciones puras son más fáciles de probar, depurar y razonar.

## Map, Filter y Reduce

Estas tres funciones son la base del procesamiento funcional de datos.

### map

Aplica una función a cada elemento de una secuencia:

```python
numeros = [1, 2, 3, 4, 5]

def cuadrado(x):
    return x * x

cuadrados = list(map(cuadrado, numeros))
print(cuadrados)  # [1, 4, 9, 16, 25]
```

### filter

Conserva solo elementos que satisfacen una condición:

```python
def es_par(x):
    return x % 2 == 0

pares = list(filter(es_par, numeros))
print(pares)  # [2, 4]
```

### reduce

Combina todos los elementos en un solo valor:

```python
from functools import reduce

def multiplicar(x, y):
    return x * y

producto = reduce(multiplicar, numeros)
print(producto)  # 120  (1 * 2 * 3 * 4 * 5)
```

> [!NOTE]
> El `reduce` de Python está en el módulo `functools`. `map` y `filter` son integrados.

## Funciones Lambda

Las lambdas son funciones anónimas de una línea, perfectas para operaciones simples:

```python
numeros = [1, 2, 3, 4, 5]

cuadrados = list(map(lambda x: x * x, numeros))
pares = list(filter(lambda x: x % 2 == 0, numeros))

print(cuadrados)  # [1, 4, 9, 16, 25]
print(pares)      # [2, 4]
```

## Comprensiones de Lista

Python ofrece una alternativa más legible para `map` y `filter`:

```python
numeros = [1, 2, 3, 4, 5]

# Equivalente a map
cuadrados = [x * x for x in numeros]
print(cuadrados)  # [1, 4, 9, 16, 25]

# Equivalente a filter
pares = [x for x in numeros if x % 2 == 0]
print(pares)      # [2, 4]

# Combinados
cuadrados_pares = [x * x for x in numeros if x % 2 == 0]
print(cuadrados_pares)  # [4, 16]
```

## Inmutabilidad

En programación funcional, evitas modificar datos en el lugar:

```python
# Imperativo (muta)
def agregar_a_lista(item, items):
    items.append(item)
    return items

# Funcional (crea nueva lista)
def agregar_a_lista_puro(item, items):
    return items + [item]

original = [1, 2, 3]
nueva_lista = agregar_a_lista_puro(4, original)
print(original)    # [1, 2, 3]  — sin cambios
print(nueva_lista) # [1, 2, 3, 4]
```

## Ejercicio Práctico

Usa técnicas funcionales para procesar una lista de temperaturas en Celsius:

```python
celsius = [0, 10, 20, 30, 40]

# Convertir a Fahrenheit usando map + lambda
fahrenheit = list(map(lambda c: (c * 9/5) + 32, celsius))
print("Fahrenheit:", fahrenheit)

# Filtrar solo temperaturas "calientes" (mayores a 80F)
calientes = list(filter(lambda f: f > 80, fahrenheit))
print("Días calientes:", calientes)

# Usando comprensiones de lista
fahrenheit2 = [(c * 9/5) + 32 for c in celsius]
calientes2 = [f for f in fahrenheit2 if f > 80]
print("Comprensiones:", fahrenheit2, calientes2)
```

## Resumen

| Concepto | Herramienta Python | Ejemplo |
|----------|--------------------|---------|
| Función pura | Sin efectos secundarios | `def sumar(a, b): return a + b` |
| Map | `map(func, iterable)` | Aplicar función a cada elemento |
| Filter | `filter(func, iterable)` | Conservar elementos que coinciden |
| Reduce | `reduce(func, iterable)` | Combinar en un valor |
| Lambda | `lambda x: expr` | Función anónima en línea |
| Comprensión | `[expr for x in lista]` | Alternativa legible para map/filter |

## Próximos Pasos

JavaScript y Python son lenguajes interpretados. La próxima lección explora lenguajes compilados usando Rust, donde el código se traduce a código máquina antes de la ejecución.
