---
title: "Calculus Fundamentals"
description: "Understand derivatives, integrals, and the fundamental theorem of calculus with clear mathematical derivations."
order: 2
duration: "60 min"
difficulty: "intermediate"
---

# Calculus Fundamentals

## Introduction

Calculus is the mathematical study of continuous change. It has two major branches: **differential calculus** (concerning rates of change) and **integral calculus** (concerning accumulation of quantities).

---

## Limits

The concept of a limit is foundational to calculus. We write:

$$\lim_{x \to a} f(x) = L$$

This means as $x$ approaches $a$, the function $f(x)$ approaches $L$.

### Important Limits

$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$

$$\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e$$

$$\lim_{x \to 0} \frac{e^x - 1}{x} = 1$$

---

## Derivatives

The derivative of a function $f(x)$ measures its instantaneous rate of change:

$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

### Basic Derivative Rules

| Function | Derivative |
|----------|------------|
| $c$ (constant) | $0$ |
| $x^n$ | $nx^{n-1}$ |
| $e^x$ | $e^x$ |
| $\ln x$ | $\frac{1}{x}$ |
| $\sin x$ | $\cos x$ |
| $\cos x$ | $-\sin x$ |

### Chain Rule

If $y = f(g(x))$, then:

$$\frac{dy}{dx} = f'(g(x)) \cdot g'(x)$$

Or using Leibniz notation:

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

### Product Rule

$$(fg)' = f'g + fg'$$

### Quotient Rule

$$\left(\frac{f}{g}\right)' = \frac{f'g - fg'}{g^2}$$

---

## Integrals

Integration is the reverse process of differentiation. The **indefinite integral** is:

$$\int f(x) \, dx = F(x) + C$$

where $F'(x) = f(x)$ and $C$ is the constant of integration.

### Basic Integrals

$$\int x^n \, dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)$$

$$\int \frac{1}{x} \, dx = \ln|x| + C$$

$$\int e^x \, dx = e^x + C$$

$$\int \sin x \, dx = -\cos x + C$$

$$\int \cos x \, dx = \sin x + C$$

---

## The Fundamental Theorem of Calculus

This theorem connects differentiation and integration:

**Part 1:**

If $F(x) = \int_a^x f(t) \, dt$, then $F'(x) = f(x)$.

**Part 2:**

$$\int_a^b f(x) \, dx = F(b) - F(a)$$

This is often written as:

$$\int_a^b f(x) \, dx = \left[F(x)\right]_a^b$$

---

## Definite Integrals and Area

The definite integral $\int_a^b f(x) \, dx$ represents the signed area between the curve $y = f(x)$ and the $x$-axis from $x = a$ to $x = b$.

### Example

Find the area under $y = x^2$ from $x = 0$ to $x = 2$:

$$\int_0^2 x^2 \, dx = \left[\frac{x^3}{3}\right]_0^2 = \frac{8}{3} - 0 = \frac{8}{3}$$

---

## Integration by Substitution

For $\int f(g(x)) \cdot g'(x) \, dx$, let $u = g(x)$:

$$\int f(g(x)) \cdot g'(x) \, dx = \int f(u) \, du$$

### Example

$$\int 2x \cos(x^2) \, dx$$

Let $u = x^2$, then $du = 2x \, dx$:

$$= \int \cos u \, du = \sin u + C = \sin(x^2) + C$$

---

## Practice Questions

```question
{
  "id": "calc-q1",
  "type": "multiple-choice",
  "question": "What is the derivative of x³?",
  "options": [
    "x²",
    "3x",
    "3x²",
    "3x³"
  ],
  "correct": 2,
  "explanation": "Using the power rule: d/dx(x³) = 3x^(3-1) = 3x²"
}
```

```question
{
  "id": "calc-q2",
  "type": "multiple-choice",
  "question": "What is ∫ 2x dx?",
  "options": [
    "x² + C",
    "2x² + C",
    "x + C",
    "2 + C"
  ],
  "correct": 0,
  "explanation": "Using the power rule for integration: ∫ 2x dx = 2 · (x²/2) + C = x² + C"
}
```

```question
{
  "id": "calc-q3",
  "type": "multiple-choice",
  "question": "According to the Fundamental Theorem of Calculus, what is ∫₀¹ 3x² dx?",
  "options": [
    "0",
    "1",
    "2",
    "3"
  ],
  "correct": 1,
  "explanation": "∫₀¹ 3x² dx = [x³]₀¹ = 1³ - 0³ = 1"
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Limits define the foundation of calculus
- Derivatives measure instantaneous rate of change: $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$
- Integrals represent accumulation and area
- The Fundamental Theorem of Calculus connects derivatives and integrals
- Practice the chain rule, product rule, and substitution method
