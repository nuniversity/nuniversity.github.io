---
title: "Estructuras de Datos: Arrays y Objetos"
description: "Aprende a organizar datos usando arrays y objetos"
order: 6
duration: "35 minutes"
difficulty: "beginner"
---

# Estructuras de Datos: Arrays y Objetos

Las variables individuales no son suficientes cuando necesitas trabajar con colecciones de datos. Los arrays y objetos te permiten organizar valores relacionados juntos.

## Arrays

Un array es una lista ordenada de valores:

```javascript
let colores = ["rojo", "verde", "azul"];
let numeros = [10, 20, 30, 40];
let mixto = ["texto", 42, true, null];
```

### Accediendo a Elementos

Los elementos se acceden por su índice, comenzando en 0:

```javascript
let frutas = ["Manzana", "Banana", "Cereza"];

console.log(frutas[0]);  // Salida: Manzana
console.log(frutas[1]);  // Salida: Banana
console.log(frutas[2]);  // Salida: Cereza
```

### Modificando Arrays

```javascript
frutas[1] = "Arándano";    // Reemplaza "Banana"
console.log(frutas);        // ["Manzana", "Arándano", "Cereza"]

frutas.push("Dátil");      // Agrega al final
frutas.pop();               // Elimina del final
frutas.unshift("Albaricoque"); // Agrega al inicio
frutas.shift();             // Elimina del inicio
```

### Propiedades y Métodos de Array

```javascript
let items = [3, 1, 4, 1, 5];

console.log(items.length);     // Salida: 5
console.log(items.indexOf(4)); // Salida: 2
items.sort();
console.log(items);            // [1, 1, 3, 4, 5]
```

## Objetos

Los objetos almacenan pares clave-valor:

```javascript
let persona = {
  nombre: "Ana",
  edad: 30,
  esEstudiante: false
};
```

### Accediendo y Modificando Propiedades

```javascript
// Notación de punto
console.log(persona.nombre);   // Salida: Ana
persona.edad = 31;

// Notación de corchetes (útil para claves dinámicas)
console.log(persona["nombre"]); // Salida: Ana
persona["esEstudiante"] = true;

// Agregando nuevas propiedades
persona.ciudad = "Madrid";
```

> [!NOTE]
> Usa notación de punto cuando conozcas el nombre de la clave. Usa corchetes cuando la clave venga de una variable.

### Estructuras Anidadas

Los objetos y arrays pueden contenerse entre sí:

```javascript
let salon = {
  profesor: "Sr. García",
  estudiantes: [
    { nombre: "Ana", nota: 85 },
    { nombre: "Bob", nota: 92 },
    { nombre: "Carlos", nota: 78 }
  ],
  materia: "Programación"
};

console.log(salon.estudiantes[0].nombre);  // Salida: Ana
console.log(salon.estudiantes[1].nota);    // Salida: 92
```

### Iterando Sobre Objetos

```javascript
let carro = { marca: "Toyota", modelo: "Corolla", anio: 2023 };

for (let clave in carro) {
  console.log(clave + ":", carro[clave]);
}
// Salida:
// marca: Toyota
// modelo: Corolla
// anio: 2023
```

## Ejercicio Práctico

Crea un programa que gestione una biblioteca simple de libros:

```javascript
let biblioteca = [
  { titulo: "1984", autor: "George Orwell", anio: 1949 },
  { titulo: "Matar un Ruiseñor", autor: "Harper Lee", anio: 1960 }
];

function agregarLibro(titulo, autor, anio) {
  biblioteca.push({ titulo, autor, anio });
}

function encontrarLibrosPorAutor(autor) {
  return biblioteca.filter(libro => libro.autor === autor);
}

agregarLibro("El Gran Gatsby", "F. Scott Fitzgerald", 1925);
console.log(biblioteca.length);  // Salida: 3
```

## Resumen

| Estructura | Uso | Ejemplo |
|------------|-----|---------|
| Array `[]` | Lista ordenada | `["a", "b", "c"]` |
| Objeto `{}` | Pares clave-valor | `{ nombre: "Ana", edad: 30 }` |
| Array de objetos | Lista de datos estructurados | `[{ id: 1 }, { id: 2 }]` |

## Próximos Pasos

Con variables, funciones, flujo de control y estructuras de datos dominados, la próxima lección explora un paradigma diferente: programación funcional con Python.
