---
title: "Control Flow: Making Decisions with Conditionals"
description: "Learn how to make decisions in your code using if, else, and switch"
order: 4
duration: "30 minutes"
difficulty: "beginner"
---

# Control Flow: Making Decisions with Conditionals

Programs rarely run the same code every time. Conditionals let your code make decisions based on data.

## The if Statement

An `if` block runs only when its condition is true:

```javascript
let temperature = 30;

if (temperature > 25) {
  console.log("It's a hot day!");
}
```

The condition inside parentheses is evaluated as a boolean. If it is `true`, the block runs.

## if...else

Use `else` to run code when the condition is false:

```javascript
let age = 17;

if (age >= 18) {
  console.log("You are an adult.");
} else {
  console.log("You are a minor.");
}
```

## if...else if...else

Chain multiple conditions with `else if`:

```javascript
let score = 85;

if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}
```

> [!WARNING]
> Conditions are checked top to bottom. Once one matches, the rest are skipped.

## Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` / `===` | Equal (loose / strict) | `5 === 5` |
| `!=` / `!==` | Not equal | `5 !== "5"` |
| `>` | Greater than | `10 > 5` |
| `<` | Less than | `5 < 10` |
| `>=` | Greater than or equal | `10 >= 10` |
| `<=` | Less than or equal | `5 <= 10` |

Always prefer `===` over `==` — strict equality checks both value and type.

## Logical Operators

Combine conditions with logical operators:

```javascript
let age = 25;
let hasLicense = true;

if (age >= 18 && hasLicense) {
  console.log("You can drive.");
}

if (age < 18 || !hasLicense) {
  console.log("You cannot drive.");
}
```

- `&&` — both must be true
- `||` — at least one must be true
- `!` — inverts a boolean

## The switch Statement

Use `switch` when comparing a single value against many options:

```javascript
let day = 3;

switch (day) {
  case 1:
    console.log("Monday");
    break;
  case 2:
    console.log("Tuesday");
    break;
  case 3:
    console.log("Wednesday");
    break;
  default:
    console.log("Unknown day");
}
```

The `break` prevents fall-through to the next case.

## Ternary Operator

A concise shorthand for simple if...else:

```javascript
let age = 20;
let status = age >= 18 ? "Adult" : "Minor";
console.log(status);  // Output: Adult
```

Syntax: `condition ? valueIfTrue : valueIfFalse`

## Practice Exercise

Write a function that checks if a number is positive, negative, or zero:

```javascript
function checkNumber(n) {
  if (n > 0) {
    return "Positive";
  } else if (n < 0) {
    return "Negative";
  } else {
    return "Zero";
  }
}

console.log(checkNumber(10));   // Output: Positive
console.log(checkNumber(-5));   // Output: Negative
console.log(checkNumber(0));    // Output: Zero
```

## Summary

| Construct | Use |
|-----------|-----|
| `if (cond) { ... }` | Run code when condition is true |
| `if ... else` | Choose between two paths |
| `if ... else if ... else` | Choose between multiple paths |
| `switch (val) { case: ... }` | Match value against many options |
| `cond ? a : b` | Inline conditional expression |

## Next Steps

Now that your code can make decisions, the next lesson shows how to repeat actions with loops.
