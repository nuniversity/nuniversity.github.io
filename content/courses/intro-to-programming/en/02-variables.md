---
title: "Understanding Variables"
description: "Learn how to store and manipulate data using variables"
order: 2
duration: "25 minutes"
difficulty: "beginner"
---

# Understanding Variables

Variables are the fundamental building blocks of any program. They let you store, read, and modify data while your program runs.

## What is a Variable?

A variable is a named container that holds a value. Think of it as a labeled box where you can put information and retrieve it later.

```javascript
let age = 25;
let name = "Alice";
let isStudent = true;
```

Each variable has a **name**, a **value**, and a **type** that determines what kind of data it can hold.

## Primitive Data Types

### Numbers

Used for all numeric values, both integers and decimals:

```javascript
let score = 100;
let price = 19.99;
let temperature = -5;
```

### Strings

Used for text. Strings are enclosed in quotes:

```javascript
let greeting = "Hello!";
let message = 'Welcome to programming';
let template = `The score is ${score}`;
```

### Booleans

Used for true/false values, often in conditions:

```javascript
let isLoggedIn = true;
let hasAccess = false;
```

### Null and Undefined

These represent the absence of a value:

```javascript
let empty = null;        // intentionally nothing
let notAssigned;         // undefined (declared but not initialized)
```

> [!WARNING]
> Variable names cannot start with a digit, cannot contain spaces, and should describe the data they hold.

## Naming Conventions

Good variable names are self-documenting:

| Good | Bad | Why |
|------|-----|-----|
| `userName` | `x` | Not descriptive |
| `totalScore` | `123data` | Starts with a digit |
| `isActive` | `user name` | Contains a space |
| `MAX_SIZE` | `max-size` | Hyphen is not allowed |

JavaScript uses **camelCase** by convention: start lowercase, capitalize each subsequent word.

## Constants

Use `const` when the value should never change:

```javascript
const PI = 3.14159;
const DAYS_IN_WEEK = 7;
```

## Practice Exercise

Create variables for your personal profile:

```javascript
let favoriteNumber = 42;
let favoriteColor = "blue";
let likesPizza = true;

console.log(favoriteNumber);
console.log(favoriteColor);
console.log(likesPizza);
```

Try changing the values and observe how the output changes.

## Summary

| Type | Example | Use |
|------|---------|-----|
| Number | `42`, `3.14` | Numeric values |
| String | `"Hello"` | Text values |
| Boolean | `true`, `false` | Logical values |
| Null | `null` | Intentional absence |
| Undefined | `let x;` | Uninitialized variable |

## Next Steps

Now that you can store data, the next lesson will teach you how to package reusable logic into functions.
