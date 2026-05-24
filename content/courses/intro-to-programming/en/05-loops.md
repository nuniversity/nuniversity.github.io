---
title: "Control Flow: Repeating with Loops"
description: "Learn how to repeat actions using for, while, and do...while loops"
order: 5
duration: "30 minutes"
difficulty: "beginner"
---

# Control Flow: Repeating with Loops

Loops let you execute a block of code multiple times without writing it over and over.

## The for Loop

Use a `for` loop when you know how many times to repeat:

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Iteration:", i);
}
```

A `for` loop has three parts:
1. **Initialization**: `let i = 0` — runs once before the loop
2. **Condition**: `i < 5` — checked before each iteration
3. **Update**: `i++` — runs after each iteration

## The while Loop

Use `while` when you want to repeat until a condition changes:

```javascript
let count = 0;

while (count < 5) {
  console.log("Count:", count);
  count++;
}
```

> [!WARNING]
> If the condition never becomes false, the loop runs forever and crashes your program!

## The do...while Loop

Similar to `while`, but the body always runs at least once:

```javascript
let i = 0;

do {
  console.log("This runs at least once, i =", i);
  i++;
} while (i < 3);
```

## break and continue

- `break` exits the loop immediately
- `continue` skips to the next iteration

```javascript
for (let i = 0; i < 10; i++) {
  if (i === 3) {
    continue;  // Skip 3
  }
  if (i === 7) {
    break;     // Stop at 7
  }
  console.log(i);  // Output: 0, 1, 2, 4, 5, 6
}
```

## Looping Through Arrays

A common pattern is iterating over array elements:

```javascript
let fruits = ["Apple", "Banana", "Cherry"];

for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}
```

JavaScript also offers a cleaner syntax:

```javascript
for (let fruit of fruits) {
  console.log(fruit);
}
```

## Nested Loops

Loops can be placed inside other loops:

```javascript
for (let row = 0; row < 3; row++) {
  let line = "";
  for (let col = 0; col < 3; col++) {
    line += "* ";
  }
  console.log(line);
}
// Output:
// * * *
// * * *
// * * *
```

## Practice Exercise

Write a function that calculates the sum of numbers from 1 to n:

```javascript
function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

console.log(sumTo(5));   // Output: 15  (1+2+3+4+5)
console.log(sumTo(100)); // Output: 5050
```

## Summary

| Loop | When to use |
|------|-------------|
| `for (init; cond; update)` | Known number of iterations |
| `while (cond)` | Run while condition is true |
| `do { ... } while (cond)` | Run at least once |
| `for...of` | Iterate over array elements |
| `break` | Exit loop early |
| `continue` | Skip current iteration |

## Next Steps

Now that you can repeat actions, the next lesson covers data structures — arrays and objects for organizing data.
