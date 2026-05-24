---
title: "Flujo de Control: Tomando Decisiones con Condicionales"
description: "Aprende a tomar decisiones en tu código usando if, else y switch"
order: 4
duration: "30 minutes"
difficulty: "beginner"
---

# Flujo de Control: Tomando Decisiones con Condicionales

Los programas rara vez ejecutan el mismo código cada vez. Los condicionales permiten que tu código tome decisiones basadas en datos.

## La Sentencia if

Un bloque `if` se ejecuta solo cuando su condición es verdadera:

```javascript
let temperatura = 30;

if (temperatura > 25) {
  console.log("¡Es un día caluroso!");
}
```

La condición dentro de los paréntesis se evalúa como booleano. Si es `true`, el bloque se ejecuta.

## if...else

Usa `else` para ejecutar código cuando la condición es falsa:

```javascript
let edad = 17;

if (edad >= 18) {
  console.log("Eres adulto.");
} else {
  console.log("Eres menor de edad.");
}
```

## if...else if...else

Encadena múltiples condiciones con `else if`:

```javascript
let puntuacion = 85;

if (puntuacion >= 90) {
  console.log("Nota: A");
} else if (puntuacion >= 80) {
  console.log("Nota: B");
} else if (puntuacion >= 70) {
  console.log("Nota: C");
} else {
  console.log("Nota: F");
}
```

> [!WARNING]
> Las condiciones se verifican de arriba a abajo. Cuando una coincide, las restantes se ignoran.

## Operadores de Comparación

| Operador | Significado | Ejemplo |
|----------|-------------|---------|
| `==` / `===` | Igual (débil / estricto) | `5 === 5` |
| `!=` / `!==` | Diferente | `5 !== "5"` |
| `>` | Mayor que | `10 > 5` |
| `<` | Menor que | `5 < 10` |
| `>=` | Mayor o igual | `10 >= 10` |
| `<=` | Menor o igual | `5 <= 10` |

Prefiere siempre `===` sobre `==` — la igualdad estricta verifica valor y tipo.

## Operadores Lógicos

Combina condiciones con operadores lógicos:

```javascript
let edad = 25;
let tieneLicencia = true;

if (edad >= 18 && tieneLicencia) {
  console.log("Puedes conducir.");
}

if (edad < 18 || !tieneLicencia) {
  console.log("No puedes conducir.");
}
```

- `&&` — ambos deben ser verdaderos
- `||` — al menos uno debe ser verdadero
- `!` — invierte un booleano

## La Sentencia switch

Usa `switch` cuando comparas un solo valor con muchas opciones:

```javascript
let dia = 3;

switch (dia) {
  case 1:
    console.log("Lunes");
    break;
  case 2:
    console.log("Martes");
    break;
  case 3:
    console.log("Miércoles");
    break;
  default:
    console.log("Día desconocido");
}
```

El `break` evita que la ejecución continúe al siguiente caso.

## Operador Ternario

Una forma concisa para if...else simple:

```javascript
let edad = 20;
let estado = edad >= 18 ? "Adulto" : "Menor";
console.log(estado);  // Salida: Adulto
```

Sintaxis: `condición ? valorSiVerdadero : valorSiFalso`

## Ejercicio Práctico

Escribe una función que verifique si un número es positivo, negativo o cero:

```javascript
function verificarNumero(n) {
  if (n > 0) {
    return "Positivo";
  } else if (n < 0) {
    return "Negativo";
  } else {
    return "Cero";
  }
}

console.log(verificarNumero(10));   // Salida: Positivo
console.log(verificarNumero(-5));   // Salida: Negativo
console.log(verificarNumero(0));    // Salida: Cero
```

## Resumen

| Construcción | Uso |
|--------------|-----|
| `if (cond) { ... }` | Ejecutar código cuando la condición es verdadera |
| `if ... else` | Elegir entre dos caminos |
| `if ... else if ... else` | Elegir entre múltiples caminos |
| `switch (val) { case: ... }` | Comparar valor con muchas opciones |
| `cond ? a : b` | Expresión condicional en línea |

## Próximos Pasos

Ahora que tu código puede tomar decisiones, la próxima lección muestra cómo repetir acciones con bucles.
