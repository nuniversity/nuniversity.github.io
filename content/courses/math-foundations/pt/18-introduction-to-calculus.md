---
title: "Introdução ao Cálculo"
description: "Compreenda derivadas como taxas de variação, integrais como acumulação e o Teorema Fundamental que os conecta."
order: 18
duration: "70 minutes"
difficulty: "beginner"
---

# Introdução ao Cálculo

**Gancho**: "O cálculo é a matemática da mudança. Ele descreve movimento, crescimento e otimização."

---

## A Matemática do Movimento

Newton e Leibniz inventaram o cálculo independentemente no século XVII. Mas matemáticos indianos como Madhava (1400 d.C.) tinham descoberto expansões em séries para funções trigonométricas séculos antes. O Teorema Fundamental conecta diferenciação e integração.

> [!NOTE]
> O cálculo é usado em física, economia, medicina, engenharia — em qualquer campo que estude mudança.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender derivadas como taxas de variação
- Compreender integrais como acumulação
- Aplicar o Teorema Fundamental
- Ver cálculo em aplicações reais

---

## 1. Derivadas

### Definição como Limite

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

### Interpretação Geométrica

A derivada é a **inclinação da reta tangente** ao gráfico em um ponto.

### Regras Básicas

**Potência:**
$$
\frac{d}{dx}(x^n) = nx^{n-1}
$$

**Constante:**
$$
\frac{d}{dx}(c) = 0
$$

**Soma:**
$$
\frac{d}{dx}(f + g) = f' + g'
$$

**Produto:**
$$
\frac{d}{dx}(fg) = f'g + fg'
$$

**Exemplo:** f(x) = x³
$$
f'(x) = 3x^2
$$

---

## 2. Integrais

### Definição como Soma

$$
\int_a^b f(x) \, dx = \lim_{n \to \infty} \sum_{i=1}^{n} f(x_i^*) \Delta x
$$

### Área Sob o Curva

A integral definida calcula a **área entre o gráfico e o eixo x**.

### Antiderivadas

Se F'(x) = f(x), então F é antiderivada de f.

$$
\int x^n \, dx = \frac{x^{n+1}}{n+1} + C
$$

---

## 3. Teorema Fundamental do Cálculo

### Conexão entre Derivadas e Integrais

**Parte 1:** Se F(x) = ∫ₐˣ f(t)dt, então F'(x) = f(x)

**Parte 2:**
$$
\int_a^b f(x) \, dx = F(b) - F(a)
$$

onde F é antiderivada de f.

### Aplicações

**Área:** ∫ₐᵇ f(x)dx
**Deslocamento:** ∫ᵥ(t)dt
**Trabalho:** ∫F(x)dx

---

## 4. Exercícios Interativos

### Visualizador de Derivadas

```matching
{
  "question": "Encontre a derivada:",
  "pairs": [
    {"left": "f(x) = x²", "right": "f'(x) = 2x"},
    {"left": "f(x) = x³", "right": "f'(x) = 3x²"},
    {"left": "f(x) = 5x + 3", "right": "f'(x) = 5"}
  ],
  "explanation": "Use a regra da potência: d/dx(xⁿ) = nxⁿ⁻¹."
}
```text

### Calculadora de Integral

```matching
{
  "question": "Encontre a integral:",
  "pairs": [
    {"left": "∫2x dx", "right": "x² + C"},
    {"left": "∫x² dx", "right": "x³/3 + C"},
    {"left": "∫₀¹ 2x dx", "right": "1"}
  ],
  "explanation": "A integral é a operação inversa da derivada."
}
```

### Explorador do Teorema Fundamental

```matching
{
  "question": "Aplique o Teorema Fundamental:",
  "pairs": [
    {"left": "d/dx ∫₀ˣ t² dt", "right": "x²"},
    {"left": "∫₀² 2x dx", "right": "4"},
    {"left": "Se F' = f, então ∫f = F + C", "right": "Teorema Fundamental"}
  ],
  "explanation": "O Teorema Fundamental conecta diferenciação e integração."
}
```text

---

## Aplicação no Mundo Real

### Física, Economia e Medicina

**Física:**
- Velocidade = derivada da posição
- Aceleração = derivada da velocidade
- Trabalho = integral da força

**Economia:**
- Custo marginal = derivada do custo
- Receita total = integral da receita marginal

**Medicina:**
- Taxa de eliminação de drogas
- Crescimento de tumores
- Fluxo sanguíneo

---

## Practice Questions

```question
{
  "id": "math-foundations-q91",
  "type": "multiple-choice",
  "question": "Encontre a derivada de f(x) = x²",
  "options": [
    "x",
    "2x",
    "x²",
    "2"
  ],
  "correct": 1,
  "explanation": "Usando a regra da potência: d/dx(x²) = 2x."
}
```

```question
{
  "id": "math-foundations-q92",
  "type": "multiple-choice",
  "question": "Encontre a integral de f(x) = 2x",
  "options": [
    "2",
    "x²",
    "x² + C",
    "2x + C"
  ],
  "correct": 2,
  "explanation": "∫2x dx = x² + C (constante arbitrária)."
}
```text

```question
{
  "id": "math-foundations-q93",
  "type": "multiple-choice",
  "question": "Use o Teorema Fundamental: ∫₀¹ 2x dx",
  "options": [
    "0",
    "1",
    "2",
    "4"
  ],
  "correct": 1,
  "explanation": "F(x) = x², então F(1) - F(0) = 1 - 0 = 1."
}
```

```question
{
  "id": "math-foundations-q94",
  "type": "multiple-choice",
  "question": "Qual é a inclinação de y = x³ em x = 2?",
  "options": [
    "3",
    "6",
    "8",
    "12"
  ],
  "correct": 2,
  "explanation": "y' = 3x², em x = 2: 3(4) = 12. (Alternativa correta: 12)"
}
```text

```question
{
  "id": "math-foundations-q95",
  "type": "multiple-choice",
  "question": "Como o cálculo é usado na medicina?",
  "options": [
    "Para medir temperatura",
    "Para modelar taxa de eliminação de drogas",
    "Para contar células",
    "Para fazer raios-X"
  ],
  "correct": 1,
  "explanation": "Derivadas modelam taxas de mudança, como eliminação de medicamentos do corpo."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Derivadas medem taxas de variação (inclinação)
- Integrais medem acumulação (área)
- Teorema Fundamental conecta derivadas e integrais
- Cálculo é essencial para física, economia e medicina
- Madhava antecipou descobertas de Newton e Leibniz
