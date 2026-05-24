---
title: "Diccionarios y Conjuntos"
description: "Domina los pares clave-valor con diccionarios y las colecciones únicas no ordenadas con conjuntos"
order: 8
duration: "30 minutos"
difficulty: "beginner"
---

# Diccionarios y Conjuntos

Los diccionarios almacenan pares clave-valor para búsquedas rápidas. Los conjuntos almacenan elementos únicos para pruebas de pertenencia y operaciones matemáticas.

## Diccionarios (`dict`)

Los diccionarios mapean claves a valores:

```python
# Creando diccionarios
student = {
    "name": "Alice",
    "age": 22,
    "major": "Computer Science",
    "gpa": 3.8
}

# Constructor alternativo
student = dict(name="Alice", age=22, major="CS")
```

### Accediendo a Valores

```python
print(student["name"])      # "Alice"
print(student.get("age"))   # 22
print(student.get("grade", "N/A"))  # "N/A" (acceso seguro)
```

> [!WARNING]
> Acceder a una clave que no existe con `[]` lanza un KeyError. Usa `.get()` para acceso seguro.

### Modificando Diccionarios

```python
student["gpa"] = 3.9       # Actualizar valor
student["year"] = 3        # Agregar nueva clave-valor
del student["age"]         # Eliminar clave
popped = student.pop("major")  # Eliminar y devolver
```

### Métodos de Diccionarios

```python
for key in student:
    print(key)

for value in student.values():
    print(value)

for key, value in student.items():
    print(f"{key}: {value}")

# Verificar existencia de clave
if "name" in student:
    print("Name exists")
```

## Caso de Uso Real: Contador de Palabras

```python
text = "the quick brown fox jumps over the lazy dog"
word_count = {}

for word in text.split():
    if word in word_count:
        word_count[word] += 1
    else:
        word_count[word] = 1

print(word_count)
# {'the': 2, 'quick': 1, 'brown': 1, ...}
```

### Usando defaultdict (más simple)

```python
from collections import defaultdict

word_count = defaultdict(int)
for word in text.split():
    word_count[word] += 1
```

## Conjuntos (`set`)

Los conjuntos almacenan elementos **únicos** y no ordenados:

```python
# Creando conjuntos
fruits = {"apple", "banana", "cherry", "apple"}  # Duplicados eliminados
numbers = set([1, 2, 3, 3, 2, 1])  # {1, 2, 3}
empty = set()  # {} crea un dict vacío, ¡no un set!
```

### Operaciones con Conjuntos

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # Unión: {1, 2, 3, 4, 5, 6}
print(a & b)   # Intersección: {3, 4}
print(a - b)   # Diferencia: {1, 2}
print(a ^ b)   # Diferencia simétrica: {1, 2, 5, 6}
```

### Métodos de Conjuntos

```python
a.add(7)         # Agregar elemento
a.remove(7)      # Eliminar (lanza KeyError si no existe)
a.discard(10)    # Eliminar (sin error si no existe)
print(3 in a)    # Prueba de pertenencia (¡muy rápido!)
```

> [!NOTE]
> Los conjuntos están optimizados para pruebas de pertenencia (`in`) — O(1) promedio vs O(n) para listas. Usa conjuntos cuando el orden no importe y no deban existir duplicados.

## Casos de Uso del Mundo Real

### Visitantes Únicos
```python
visitor_ips = set()
visitor_ips.add("192.168.1.1")
visitor_ips.add("192.168.1.2")
visitor_ips.add("192.168.1.1")  # Duplicado, ignorado
print(f"Unique visitors: {len(visitor_ips)}")
```

### Encontrando Elementos Comunes
```python
python_students = {"Alice", "Bob", "Charlie"}
java_students = {"Bob", "Diana", "Eve"}
both = python_students & java_students
print(f"Students in both: {both}")
```

### Eliminando Duplicados de una Lista
```python
items = [1, 2, 2, 3, 3, 3, 4]
unique = list(set(items))  # [1, 2, 3, 4]
```

> [!SUCCESS]
| Estructura | Ordenada | Mutable | Claves Únicas | Caso de Uso |
|---|---|---|---|---|
| Lista | Sí | Sí | No | Colección ordenada |
| Tupla | Sí | No | No | Datos fijos |
| Dict | Sí* | Sí | Sí | Búsquedas clave-valor |
| Set | No | Sí | Sí* | Pertenencia, unicidad |

*Python 3.7+ los dicts mantienen orden de inserción. Los sets almacenan valores únicos.

## Preguntas de Práctica

1. Crea un diccionario para un libro con título, autor y año.
2. ¿Cómo obtienes un valor de un dict de forma segura sin arriesgar un KeyError?
3. ¿Cuál es la diferencia entre `{}` y `set()`?
4. Escribe código para contar la frecuencia de caracteres en una cadena usando un dict.
5. ¿Cómo encuentras elementos únicos entre dos listas usando conjuntos?
6. ¿Qué devuelve `{1, 2, 3} - {2, 3, 4}`?
7. ¿Cómo recorres tanto las claves como los valores de un diccionario?
8. ¿Por qué las pruebas de pertenencia en conjuntos son más rápidas que en listas?
9. Elimina duplicados de `[1, 1, 2, 3, 3, 4, 5, 5]`.
10. ¿Qué sucede si agregas un elemento duplicado a un conjunto?
