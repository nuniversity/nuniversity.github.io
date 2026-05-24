---
title: "Funciones: Bloques de Código Reutilizables"
description: "Aprende a definir, llamar y organizar código con funciones"
order: 3
duration: "30 minutes"
difficulty: "beginner"
---

# Funciones: Bloques de Código Reutilizables

Las funciones te permiten empaquetar un bloque de código para ejecutarlo cuando sea necesario — con diferentes entradas si lo deseas.

## Por qué Usar Funciones

- **Reutilización**: Escribe una vez, usa muchas veces
- **Organización**: Divide la lógica compleja en partes pequeñas y comprensibles
- **Abstracción**: Oculta detalles de implementación detrás de una llamada simple

## Definiendo y Llamando una Función

```javascript
function saludo() {
  console.log("¡Hola, bienvenido a la programación!");
}

saludo();  // Llama a la función
```

La palabra clave `function` la declara, el nombre describe lo que hace, y los paréntesis `()` la invocan.

## Parámetros y Argumentos

Los parámetros son placeholders que reciben valores cuando se llama a la función:

```javascript
function saludarUsuario(nombre) {
  console.log("¡Hola, " + nombre + "!");
}

saludarUsuario("Ana");  // Salida: ¡Hola, Ana!
saludarUsuario("Bob");  // Salida: ¡Hola, Bob!
```

Los parámetros múltiples se separan con comas:

```javascript
function sumar(a, b) {
  console.log(a + b);
}

sumar(3, 5);  // Salida: 8
```

## Valores de Retorno

Las funciones pueden enviar un valor de vuelta usando `return`:

```javascript
function multiplicar(x, y) {
  return x * y;
}

let resultado = multiplicar(4, 5);
console.log(resultado);  // Salida: 20
```

Cuando `return` se ejecuta, la función se detiene inmediatamente.

> [!NOTE]
> Una función sin `return` devuelve `undefined` por defecto.

## Ámbito de Función

Las variables declaradas dentro de una función son locales — no pueden accederse desde fuera:

```javascript
function mostrarMensaje() {
  let mensaje = "Dentro de la función";
  console.log(mensaje);
}

mostrarMensaje();
// console.log(mensaje);  // ReferenceError: mensaje is not defined
```

Las variables declaradas fuera (ámbito global) son accesibles dentro:

```javascript
let nombreGlobal = "Ana";

function decirHola() {
  console.log("Hola, " + nombreGlobal);
}

decirHola();  // Salida: Hola, Ana
```

## Funciones Flecha

Una sintaxis más corta para escribir funciones:

```javascript
// Tradicional
function sumar(a, b) {
  return a + b;
}

// Flecha
const sumar = (a, b) => a + b;
```

Cuando el cuerpo es una sola expresión, el `return` es implícito.

## Ejercicio Práctico

Escribe una función que convierta Celsius a Fahrenheit:

```javascript
function celsiusAFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

console.log(celsiusAFahrenheit(0));   // Salida: 32
console.log(celsiusAFahrenheit(100)); // Salida: 212
```

## Resumen

| Concepto | Ejemplo |
|----------|---------|
| Declaración de función | `function nombre() { ... }` |
| Parámetros | `function sumar(a, b)` |
| Valor de retorno | `return valor;` |
| Función flecha | `const fn = (x) => x * 2;` |
| Ámbito local | `let x = 1;` dentro de una función es privado |

## Próximos Pasos

A continuación aprenderás a tomar decisiones en tu código usando condicionales.
