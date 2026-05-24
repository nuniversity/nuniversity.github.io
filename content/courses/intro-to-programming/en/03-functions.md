---
title: "Functions: Reusable Code Blocks"
description: "Learn how to define, call, and organize code with functions"
order: 3
duration: "30 minutes"
difficulty: "beginner"
---

# Functions: Reusable Code Blocks

Functions let you package a block of code so you can run it whenever you need — with different inputs if you want.

## Why Use Functions

- **Reusability**: Write once, use many times
- **Organization**: Break complex logic into small, understandable pieces
- **Abstraction**: Hide implementation details behind a simple call

## Defining and Calling a Function

```javascript
function greet() {
  console.log("Hello, welcome to programming!");
}

greet();  // Call the function
```

The `function` keyword declares it, the name describes what it does, and the parentheses `()` invoke it.

## Parameters and Arguments

Parameters are placeholders that receive values when the function is called:

```javascript
function greetUser(name) {
  console.log("Hello, " + name + "!");
}

greetUser("Alice");  // Output: Hello, Alice!
greetUser("Bob");    // Output: Hello, Bob!
```

Multiple parameters are separated by commas:

```javascript
function add(a, b) {
  console.log(a + b);
}

add(3, 5);  // Output: 8
```

## Return Values

Functions can send a value back to the caller using `return`:

```javascript
function multiply(x, y) {
  return x * y;
}

let result = multiply(4, 5);
console.log(result);  // Output: 20
```

Once `return` executes, the function stops immediately.

> [!NOTE]
> A function without a `return` statement returns `undefined` by default.

## Function Scope

Variables declared inside a function are local to that function — they cannot be accessed outside:

```javascript
function showMessage() {
  let message = "Inside the function";
  console.log(message);
}

showMessage();
// console.log(message);  // ReferenceError: message is not defined
```

Variables declared outside a function (global scope) are accessible inside:

```javascript
let globalName = "Alice";

function sayHello() {
  console.log("Hello, " + globalName);
}

sayHello();  // Output: Hello, Alice
```

## Arrow Functions

A shorter syntax for writing functions:

```javascript
// Traditional
function add(a, b) {
  return a + b;
}

// Arrow
const add = (a, b) => a + b;
```

When the body is a single expression, the `return` is implicit.

## Practice Exercise

Write a function that converts Celsius to Fahrenheit:

```javascript
function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

console.log(celsiusToFahrenheit(0));   // Output: 32
console.log(celsiusToFahrenheit(100)); // Output: 212
```

## Summary

| Concept | Example |
|---------|---------|
| Function declaration | `function name() { ... }` |
| Parameters | `function add(a, b)` |
| Return value | `return value;` |
| Arrow function | `const fn = (x) => x * 2;` |
| Local scope | `let x = 1;` inside a function is private |

## Next Steps

Next you will learn how to make decisions in your code using conditionals.
