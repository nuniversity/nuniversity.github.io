---
title: "Expoentes e Logaritmos"
description: "Compreenda expoentes, logaritmos e notação científica, e modele crescimento e decaimento exponencial."
order: 16
duration: "60 minutes"
difficulty: "beginner"
---

# Expoentes e Logaritmos

**Gancho": "Expoentes tornam números grandes crescerem rápido. Logaritmos são expoentes ao contrário — eles domam números grandes."

---

## Tamanho e Escala

John Napier inventou logaritmos em 1614, mas o conceito de expoentes é antigo. Tablets babilônicos mostram cálculos de expoentes. Matemáticos indianos usavam potências de 10. A função exponencial modela crescimento em populações, finanças e natureza.

> [!NOTE]
> Logaritmos são usados em escalas como pH, Richter e decibéis porque comprimem grandes faixas de valores.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender regras de expoentes
- Aplicar logaritmos a problemas
- Usar notação científica
- Modelar crescimento e decaimento exponencial

---

## 1. Expoentes

### Definição e Regras

$$
a^n = \underbrace{a \times a \times \cdots \times a}_{n \text{ vezes}}
$$

**Regras:**
$$
a^m \cdot a^n = a^{m+n}
$$

$$
\frac{a^m}{a^n} = a^{m-n}
$$

$$
(a^m)^n = a^{mn}
$$

$$
a^0 = 1 \quad (a \neq 0)
$$

$$
a^{-n} = \frac{1}{a^n}
$$

### Notação Científica

$$
a \times 10^n
$$

**Exemplo:** 45.000 = 4.5 × 10⁴

### Expoentes Negativos e Fracionários

$$
a^{-1/2} = \frac{1}{\sqrt{a}}
$$

---

## 2. Logaritmos

### Definição e Propriedades

Se bʸ = x, então:
$$
\log_b(x) = y
$$

**Logaritmo natural:** ln(x) = logₑ(x)
**Logaritmo comum:** log(x) = log₁₀(x)

**Propriedades:**
$$
\log_b(xy) = \log_b(x) + \log_b(y)
$$

$$
\log_b\left(\frac{x}{y}\right) = \log_b(x) - \log_b(y)
$$

$$
\log_b(x^n) = n \cdot \log_b(x)
$$

### Fórmula de Mudança de Base

$$
\log_b(x) = \frac{\log_k(x)}{\log_k(b)}
$$

---

## 3. Aplicações

### Crescimento e Decaimento Exponencial

**Crescimento:** P(t) = P₀ · eʳᵗ
**Decaimento:** N(t) = N₀ · e⁻ᵏᵗ

### Juros Compostos

$$
A = P\left(1 + \frac{r}{n}\right)^{nt}
$$

### Escalas Logarítmicas

- **pH:** mede acidez (-log[H⁺])
- **Richter:** mede magnitude de terremotos
- **Decibéis:** mede intensidade sonora

---

## 4. Exercícios Interativos

### Calculadora de Expoentes

```matching
{
  "question": "Simplifique cada expressão:",
  "pairs": [
    {"left": "2³ × 2⁴", "right": "2⁷ = 128"},
    {"left": "5⁰", "right": "1"},
    {"left": "3⁻²", "right": "1/9"}
  ],
  "explanation": "Use as regras de expoentes para simplificar."
}
```text

### Explorador de Logaritmos

```matching
{
  "question": "Avalie cada logaritmo:",
  "pairs": [
    {"left": "log₂(32)", "right": "5"},
    {"left": "log₁₀(1000)", "right": "3"},
    {"left": "ln(e²)", "right": "2"}
  ],
  "explanation": "Logaritmo pergunta: a que potência devo elevar a base?"
}
```

### Modelador de Crescimento

```matching
{
  "question": "Modele situações exponenciais:",
  "pairs": [
    {"left": "População dobra a cada 10 anos", "right": "P(t) = P₀ × 2^(t/10)"},
    {"left": "Investimento 5% ao ano", "right": "A(t) = P × 1.05ᵗ"},
    {"left": "Rádio decai pela metade", "right": "N(t) = N₀ × (1/2)^(t/h)"}
  ],
  "explanation": "Crescimento e decaimento são modelados por funções exponenciais."
}
```text

---

## Aplicação no Mundo Real

### Finanças, Ciência e Medicina

**Finanças:**
- Juros compostos
- Crescimento de investimentos

**Ciência:**
- Crescimento populacional
- Decaimento radioativo
- Spread de doenças

**Medicina:**
- Escala pH
- Dosagem de medicamentos

---

## Practice Questions

```question
{
  "id": "math-foundations-q81",
  "type": "multiple-choice",
  "question": "Simplifique: 2³ × 2⁴",
  "options": [
    "2⁷",
    "2¹²",
    "8⁷",
    "2⁷ = 128"
  ],
  "correct": 3,
  "explanation": "2³ × 2⁴ = 2^(3+4) = 2⁷ = 128."
}
```

```question
{
  "id": "math-foundations-q82",
  "type": "multiple-choice",
  "question": "Avalie: log₂(32)",
  "options": [
    "4",
    "5",
    "6",
    "16"
  ],
  "correct": 1,
  "explanation": "2⁵ = 32, então log₂(32) = 5."
}
```text

```question
{
  "id": "math-foundations-q83",
  "type": "multiple-choice",
  "question": "Resolva: 3ˣ = 81",
  "options": [
    "3",
    "4",
    "5",
    "27"
  ],
  "correct": 1,
  "explanation": "3⁴ = 81, então x = 4."
}
```

```question
{
  "id": "math-foundations-q84",
  "type": "multiple-choice",
  "question": "Uma população dobra a cada 10 anos. Escreva uma função.",
  "options": [
    "P(t) = P₀ × 2ᵗ",
    "P(t) = P₀ × 2^(t/10)",
    "P(t) = P₀ × 10^(t/2)",
    "P(t) = P₀ + 2t"
  ],
  "correct": 1,
  "explanation": "Se dobra a cada 10 anos, o fator é 2^(t/10)."
}
```text

```question
{
  "id": "math-foundations-q85",
  "type": "multiple-choice",
  "question": "Como pH está relacionado a logaritmos?",
  "options": [
    "pH = log[H⁺]",
    "pH = -log[H⁺]",
    "pH = 10^[H⁺]",
    "pH = [H⁺]²"
  ],
  "correct": 1,
  "explanation": "pH = -log₁₀[H⁺], onde [H⁺] é a concentração de íons hidrogênio."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Expoentes representam multiplicações repetidas
- Logaritmos são a operação inversa de expoentes
- Escalas logarítmicas comprimem grandes faixas
- Crescimento e decaimento são exponenciais
- Notação científica simplifica números grandes
