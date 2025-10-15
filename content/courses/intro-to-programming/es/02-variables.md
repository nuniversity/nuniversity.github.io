---
title: "Understanding Variables"
description: "Learn how to store and use data in your programs"
order: 2
duration: "20 minutes"
difficulty: "beginner"
---

# Understanding Variables

Variables are containers that store data values. They're one of the most fundamental concepts in programming.

## What is a Variable?

Think of a variable as a labeled box where you can store information:

\`\`\`javascript
let age = 25;
let name = "Alice";
let isStudent = true;
\`\`\`

## Variable Types

### Numbers
\`\`\`javascript
let score = 100;
let price = 19.99;
let temperature = -5;
\`\`\`

### Strings (Text)
\`\`\`javascript
let greeting = "Hello!";
let message = 'Welcome to programming';
\`\`\`

### Booleans (True/False)
\`\`\`javascript
let isLoggedIn = true;
let hasAccess = false;
\`\`\`

> [!WARNING]
> Variable names cannot start with numbers and should be descriptive!

## Naming Conventions

Good variable names:
- `userName` ✅
- `totalScore` ✅
- `isActive` ✅

Bad variable names:
- `x` ❌ (not descriptive)
- `123data` ❌ (starts with number)
- `user name` ❌ (has space)

## Practice Exercise

Create variables for the following:
1. Your favorite number
2. Your favorite color
3. Whether you like pizza (true/false)

\`\`\`javascript
let favoriteNumber = // Your code here
let favoriteColor = // Your code here
let likesPizza = // Your code here
\`\`\`

## Summary

| Type | Example | Description |
|------|---------|-------------|
| Number | `42` | Numeric values |
| String | `"Hello"` | Text values |
| Boolean | `true` | True or false |

Next, we'll learn about functions!