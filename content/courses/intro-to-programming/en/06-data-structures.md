---
title: "Data Structures: Arrays and Objects"
description: "Learn to organize data using arrays and objects"
order: 6
duration: "35 minutes"
difficulty: "beginner"
---

# Data Structures: Arrays and Objects

Individual variables are not enough when you need to work with collections of data. Arrays and objects let you organize related values together.

## Arrays

An array is an ordered list of values:

```javascript
let colors = ["red", "green", "blue"];
let numbers = [10, 20, 30, 40];
let mixed = ["text", 42, true, null];
```

### Accessing Elements

Elements are accessed by their index, starting at 0:

```javascript
let fruits = ["Apple", "Banana", "Cherry"];

console.log(fruits[0]);  // Output: Apple
console.log(fruits[1]);  // Output: Banana
console.log(fruits[2]);  // Output: Cherry
```

### Modifying Arrays

```javascript
fruits[1] = "Blueberry";  // Replace "Banana"
console.log(fruits);       // ["Apple", "Blueberry", "Cherry"]

fruits.push("Date");       // Add to the end
fruits.pop();              // Remove from the end
fruits.unshift("Apricot"); // Add to the front
fruits.shift();            // Remove from the front
```

### Array Properties and Methods

```javascript
let items = [3, 1, 4, 1, 5];

console.log(items.length);     // Output: 5
console.log(items.indexOf(4)); // Output: 2
items.sort();
console.log(items);            // [1, 1, 3, 4, 5]
```

## Objects

Objects store key-value pairs:

```javascript
let person = {
  name: "Alice",
  age: 30,
  isStudent: false
};
```

### Accessing and Modifying Properties

```javascript
// Dot notation
console.log(person.name);   // Output: Alice
person.age = 31;

// Bracket notation (useful for dynamic keys)
console.log(person["name"]); // Output: Alice
person["isStudent"] = true;

// Adding new properties
person.city = "New York";
```

> [!NOTE]
> Use dot notation when you know the key name. Use bracket notation when the key comes from a variable.

### Nested Structures

Objects and arrays can contain each other:

```javascript
let classroom = {
  teacher: "Mr. Smith",
  students: [
    { name: "Alice", grade: 85 },
    { name: "Bob", grade: 92 },
    { name: "Charlie", grade: 78 }
  ],
  subject: "Programming"
};

console.log(classroom.students[0].name);  // Output: Alice
console.log(classroom.students[1].grade); // Output: 92
```

### Iterating Over Objects

```javascript
let car = { make: "Toyota", model: "Corolla", year: 2023 };

for (let key in car) {
  console.log(key + ":", car[key]);
}
// Output:
// make: Toyota
// model: Corolla
// year: 2023
```

## Practice Exercise

Create a program that manages a simple library of books:

```javascript
let library = [
  { title: "1984", author: "George Orwell", year: 1949 },
  { title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 }
];

function addBook(title, author, year) {
  library.push({ title, author, year });
}

function findBooksByAuthor(author) {
  return library.filter(book => book.author === author);
}

addBook("The Great Gatsby", "F. Scott Fitzgerald", 1925);
console.log(library.length);  // Output: 3
```

## Summary

| Structure | Use | Example |
|-----------|-----|---------|
| Array `[]` | Ordered list | `["a", "b", "c"]` |
| Object `{}` | Key-value pairs | `{ name: "Alice", age: 30 }` |
| Array of objects | List of structured data | `[{ id: 1 }, { id: 2 }]` |

## Next Steps

With variables, functions, control flow, and data structures under your belt, the next lesson explores a different paradigm: functional programming with Python.
