---
title: "Flujo de Control: Repitiendo con Bucles"
description: "Aprende a repetir acciones usando bucles for, while y do...while"
order: 5
duration: "30 minutes"
difficulty: "beginner"
---

# Flujo de Control: Repitiendo con Bucles

Los bucles te permiten ejecutar un bloque de código múltiples veces sin escribirlo repetidamente.

## El Bucle for

Usa un bucle `for` cuando sabes cuántas veces repetir:

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Iteración:", i);
}
```

Un bucle `for` tiene tres partes:
1. **Inicialización**: `let i = 0` — se ejecuta una vez antes del bucle
2. **Condición**: `i < 5` — se verifica antes de cada iteración
3. **Actualización**: `i++` — se ejecuta después de cada iteración

## El Bucle while

Usa `while` cuando quieras repetir hasta que una condición cambie:

```javascript
let contador = 0;

while (contador < 5) {
  console.log("Conteo:", contador);
  contador++;
}
```

> [!WARNING]
> Si la condición nunca se vuelve falsa, el bucle se ejecuta para siempre y ¡congela tu programa!

## El Bucle do...while

Similar a `while`, pero el cuerpo siempre se ejecuta al menos una vez:

```javascript
let i = 0;

do {
  console.log("Esto se ejecuta al menos una vez, i =", i);
  i++;
} while (i < 3);
```

## break y continue

- `break` sale del bucle inmediatamente
- `continue` salta a la siguiente iteración

```javascript
for (let i = 0; i < 10; i++) {
  if (i === 3) {
    continue;  // Salta el 3
  }
  if (i === 7) {
    break;     // Termina en el 7
  }
  console.log(i);  // Salida: 0, 1, 2, 4, 5, 6
}
```

## Recorriendo Arrays

Un patrón común es iterar sobre elementos de un array:

```javascript
let frutas = ["Manzana", "Banana", "Cereza"];

for (let i = 0; i < frutas.length; i++) {
  console.log(frutas[i]);
}
```

JavaScript también ofrece una sintaxis más limpia:

```javascript
for (let fruta of frutas) {
  console.log(fruta);
}
```

## Bucles Anidados

Los bucles pueden colocarse dentro de otros bucles:

```javascript
for (let fila = 0; fila < 3; fila++) {
  let linea = "";
  for (let col = 0; col < 3; col++) {
    linea += "* ";
  }
  console.log(linea);
}
// Salida:
// * * *
// * * *
// * * *
```

## Ejercicio Práctico

Escribe una función que calcule la suma de números del 1 a n:

```javascript
function sumarHasta(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

console.log(sumarHasta(5));   // Salida: 15  (1+2+3+4+5)
console.log(sumarHasta(100)); // Salida: 5050
```

## Resumen

| Bucle | Cuándo usarlo |
|-------|---------------|
| `for (init; cond; update)` | Número conocido de iteraciones |
| `while (cond)` | Ejecutar mientras condición sea verdadera |
| `do { ... } while (cond)` | Ejecutar al menos una vez |
| `for...of` | Iterar sobre elementos de un array |
| `break` | Salir del bucle anticipadamente |
| `continue` | Saltar iteración actual |

## Próximos Pasos

Ahora que puedes repetir acciones, la próxima lección cubre estructuras de datos — arrays y objetos para organizar datos.
