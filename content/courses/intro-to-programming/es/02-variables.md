---
title: "Entendiendo Variables"
description: "Aprende a almacenar y manipular datos usando variables"
order: 2
duration: "25 minutes"
difficulty: "beginner"
---

# Entendiendo Variables

Las variables son los bloques fundamentales de cualquier programa. Te permiten almacenar, leer y modificar datos mientras tu programa se ejecuta.

## ¿Qué es una Variable?

Una variable es un contenedor con nombre que guarda un valor. Piensa en ella como una caja etiquetada donde puedes poner información y recuperarla después.

```javascript
let edad = 25;
let nombre = "Ana";
let esEstudiante = true;
```

Cada variable tiene un **nombre**, un **valor** y un **tipo** que determina qué clase de dato puede contener.

## Tipos de Datos Primitivos

### Números

Se usan para todos los valores numéricos, tanto enteros como decimales:

```javascript
let puntuacion = 100;
let precio = 19.99;
let temperatura = -5;
```

### Cadenas (Strings)

Se usan para texto. Las cadenas se encierran entre comillas:

```javascript
let saludo = "¡Hola!";
let mensaje = 'Bienvenido a la programación';
let plantilla = `La puntuación es ${puntuacion}`;
```

### Booleanos

Se usan para valores verdadero/falso, frecuentemente en condiciones:

```javascript
let estaLogueado = true;
let tieneAcceso = false;
```

### Null y Undefined

Representan la ausencia de un valor:

```javascript
let vacio = null;        // intencionalmente vacío
let noAsignado;          // undefined (declarado pero no inicializado)
```

> [!WARNING]
> Los nombres de variables no pueden empezar con un dígito, no pueden contener espacios y deben describir el dato que almacenan.

## Convenciones de Nomenclatura

Los buenos nombres de variables son autodocumentables:

| Bueno | Malo | Por qué |
|-------|------|---------|
| `nombreUsuario` | `x` | No descriptivo |
| `puntuacionTotal` | `123dato` | Empieza con dígito |
| `estaActivo` | `nombre usuario` | Contiene espacio |
| `TAMANIO_MAX` | `tamanio-max` | El guión no está permitido |

JavaScript usa **camelCase** por convención: empieza en minúscula, capitaliza cada palabra subsecuente.

## Constantes

Usa `const` cuando el valor nunca deba cambiar:

```javascript
const PI = 3.14159;
const DIAS_EN_SEMANA = 7;
```

## Ejercicio Práctico

Crea variables para tu perfil personal:

```javascript
let numeroFavorito = 42;
let colorFavorito = "azul";
let gustaPizza = true;

console.log(numeroFavorito);
console.log(colorFavorito);
console.log(gustaPizza);
```

Intenta cambiar los valores y observa cómo cambia la salida.

## Resumen

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| Number | `42`, `3.14` | Valores numéricos |
| String | `"Hola"` | Valores de texto |
| Boolean | `true`, `false` | Valores lógicos |
| Null | `null` | Ausencia intencional |
| Undefined | `let x;` | Variable no inicializada |

## Próximos Pasos

Ahora que puedes almacenar datos, la próxima lección te enseñará cómo empaquetar lógica reutilizable en funciones.
