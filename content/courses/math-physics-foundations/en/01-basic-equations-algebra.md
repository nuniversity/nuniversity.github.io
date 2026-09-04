---
title: "Basic Equations & Algebra"
description: "Master fundamental algebraic equations, fractions, exponents, and logarithms with beautifully rendered mathematical notation."
order: 1
duration: "45 min"
difficulty: "beginner"
---

# Basic Equations & Algebra

## Introduction

Mathematics is the language of the universe. In this lesson, we'll explore fundamental algebraic concepts using properly formatted mathematical notation that makes complex expressions easy to read and understand.

> [!NOTE]
> All equations in this course are rendered using KaTeX, a fast math typesetting system. You can write both inline math and display equations.

---

## Linear Equations

A linear equation is the simplest type of equation. It has the general form:

$$ax + b = 0$$

where $a$ and $b$ are constants, and $x$ is the variable we want to solve for.

**Solution:**

$$x = -\frac{b}{a}$$

### Example

Solve $3x + 6 = 0$:

$$x = -\frac{6}{3} = -2$$

---

## Quadratic Equations

A quadratic equation has the form:

$$ax^2 + bx + c = 0$$

The solutions are given by the quadratic formula:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

The expression under the square root, $\Delta = b^2 - 4ac$, is called the **discriminant**. It tells us:

- If $\Delta > 0$: two real solutions
- If $\Delta = 0$: one repeated solution
- If $\Delta < 0$: no real solutions (complex solutions)

### Example

Solve $x^2 - 5x + 6 = 0$:

$$a = 1, \quad b = -5, \quad c = 6$$

$$\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$

$$x = \frac{5 \pm \sqrt{1}}{2} = \frac{5 \pm 1}{2}$$

$$x_1 = 3, \quad x_2 = 2$$

---

## Exponents and Powers

The laws of exponents are fundamental to algebra:

| Rule | Formula |
|------|---------|
| Product | $a^m \cdot a^n = a^{m+n}$ |
| Quotient | $\frac{a^m}{a^n} = a^{m-n}$ |
| Power | $(a^m)^n = a^{mn}$ |
| Zero | $a^0 = 1$ (for $a \neq 0$) |
| Negative | $a^{-n} = \frac{1}{a^n}$ |

### Fractional Exponents

$$a^{1/n} = \sqrt[n]{a}$$

$$a^{m/n} = \sqrt[n]{a^m} = \left(\sqrt[n]{a}\right)^m$$

---

## Logarithms

The logarithm is the inverse of exponentiation. If $b^y = x$, then:

$$\log_b(x) = y$$

### Common Logarithms

**Natural logarithm** (base $e$):

$$\ln(x) = \log_e(x)$$

**Common logarithm** (base 10):

$$\log(x) = \log_{10}(x)$$

### Logarithm Properties

$$\log_b(xy) = \log_b(x) + \log_b(y)$$

$$\log_b\left(\frac{x}{y}\right) = \log_b(x) - \log_b(y)$$

$$\log_b(x^n) = n \cdot \log_b(x)$$

**Change of base formula:**

$$\log_b(x) = \frac{\log_k(x)}{\log_k(b)}$$

---

## Systems of Equations

A system of linear equations can be written in matrix form:

$$A\mathbf{x} = \mathbf{b}$$

where:

$$A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}, \quad \mathbf{x} = \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}, \quad \mathbf{b} = \begin{pmatrix} b_1 \\ b_2 \end{pmatrix}$$

For a 2×2 system, the solution is:

$$x_1 = \frac{\det(A_1)}{\det(A)}, \quad x_2 = \frac{\det(A_2)}{\det(A)}$$

where $\det(A) = a_{11}a_{22} - a_{12}a_{21}$.

---

## Practice Questions

```question
{
  "id": "math-q1",
  "type": "multiple-choice",
  "question": "What is the solution to the equation 2x + 4 = 0?",
  "options": [
    "x = 2",
    "x = -2",
    "x = 4",
    "x = -4"
  ],
  "correct": 1,
  "explanation": "2x + 4 = 0 → 2x = -4 → x = -2"
}
```

```question
{
  "id": "math-q2",
  "type": "multiple-choice",
  "question": "Using the quadratic formula, what is the discriminant of x² - 4x + 4 = 0?",
  "options": [
    "Δ = 0",
    "Δ = 4",
    "Δ = 8",
    "Δ = 16"
  ],
  "correct": 0,
  "explanation": "Δ = b² - 4ac = (-4)² - 4(1)(4) = 16 - 16 = 0. This means there is one repeated solution."
}
```

```question
{
  "id": "math-q3",
  "type": "multiple-choice",
  "question": "Which logarithm property states that log_b(xy) = log_b(x) + log_b(y)?",
  "options": [
    "Power rule",
    "Product rule",
    "Quotient rule",
    "Change of base"
  ],
  "correct": 1,
  "explanation": "The product rule of logarithms states that the logarithm of a product equals the sum of the logarithms."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Linear equations have the form $ax + b = 0$ with solution $x = -b/a$
- Quadratic equations use the formula $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
- Exponent laws simplify complex power expressions
- Logarithms are the inverse of exponentiation
- Systems of equations can be solved using matrices and determinants
