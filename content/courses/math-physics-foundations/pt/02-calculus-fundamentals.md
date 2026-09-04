---
title: "Fundamentos de Cálculo"
description: "Compreenda derivadas, integrais e o teorema fundamental do cálculo com derivações matemáticas claras."
order: 2
duration: "60 min"
difficulty: "intermediate"
---

# Fundamentos de Cálculo

## Introdução

O cálculo é o estudo matemático da mudança contínua. Ele possui dois ramos principais: **cálculo diferencial** (sobre taxas de mudança) e **cálculo integral** (sobre acumulação de quantidades).

---

## Limites

O conceito de limite é fundamental para o cálculo. Escrevemos:

$$\lim_{x \to a} f(x) = L$$

Isso significa que quando $x$ se aproxima de $a$, a função $f(x)$ se aproxima de $L$.

---

## Derivadas

A derivada de uma função $f(x)$ mede sua taxa de mudança instantânea:

$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

### Regras Básicas de Derivação

| Função | Derivada |
|--------|----------|
| $c$ (constante) | $0$ |
| $x^n$ | $nx^{n-1}$ |
| $e^x$ | $e^x$ |
| $\ln x$ | $\frac{1}{x}$ |
| $\sin x$ | $\cos x$ |
| $\cos x$ | $-\sin x$ |

### Regra do Produto

$$(fg)' = f'g + fg'$$

---

## Integrais

A integração é o processo inverso da diferenciação:

$$\int f(x) \, dx = F(x) + C$$

### Integrais Básicas

$$\int x^n \, dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)$$

$$\int e^x \, dx = e^x + C$$

---

## Teorema Fundamental do Cálculo

$$\int_a^b f(x) \, dx = F(b) - F(a)$$

---

> [!SUCCESS]
> ### Resumo

- Derivadas medem taxa de mudança instantânea
- Integrais representam acumulação e área
- O Teorema Fundamental conecta derivadas e integrais
