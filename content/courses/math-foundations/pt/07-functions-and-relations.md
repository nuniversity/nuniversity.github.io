---
title: "Funções e Relações"
description: "Compreenda funções, suas representações e aplicações no mundo real, desde crescimento populacional até modelagem financeira."
order: 7
duration: "60 minutes"
difficulty: "beginner"
---

# Funções e Relações

**Gancho**: "Uma função é uma máquina: coloque algo, obtenha algo. É uma das ideias mais poderosas da matemática."

---

## A Máquina da Matemática

O conceito de função se desenvolveu gradualmente. Leibniz (1694) usou o termo pela primeira vez. Euler (1748) a definiu como uma expressão analítica. Dirichlet (1837) deu a definição moderna: uma função atribui cada entrada exatamente uma saída.

> [!NOTE]
> As funções estão em toda parte: temperatura ao longo do dia, preço de ações, crescimento de plantas. São a base da modelagem matemática.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender funções e relações
- Representar funções de diferentes maneiras
- Analisar funções lineares e quadráticas
- Aplicar funções a situações reais

---

## 1. O que é uma Função?

### Definição e Notação

Uma **função** é uma regra que associa cada elemento de um conjunto (domínio) a exatamente um elemento de outro conjunto (contradomínio).

**Notação:** f: A → B ou y = f(x)

**Exemplo:** f(x) = 2x + 3
- f(1) = 5
- f(2) = 7
- f(0) = 3

### Domínio e Contradomínio

**Domínio:** Conjunto de todas as entradas possíveis
**Contradomínio:** Conjunto de todas as saídas possíveis
**Imagem:** Conjunto de saídas realmente atingidas

$$
f(x) = \sqrt{x} \quad \Rightarrow \quad \text{Domínio: } x \geq 0
$$

### Função vs. Relação

**Relação:** Pode associar uma entrada a múltiplas saídas
**Função:** Cada entrada tem exatamente uma saída

**Exemplo:** x² + y² = 1 é uma relação (não função), pois para x = 0, y pode ser 1 ou -1.

---

## 2. Representando Funções

### Tabelas

| x | f(x) |
|---|------|
| 0 | 3 |
| 1 | 5 |
| 2 | 7 |
| 3 | 9 |

### Gráficos

Pontos plotados em um plano cartesiano conectados formam o gráfico da função.

### Equações

**Lineares:** f(x) = mx + b
**Quadráticas:** f(x) = ax² + bx + c
**Exponenciais:** f(x) = a · bˣ

### Descrições Verbais

"O dobro de um número mais três"
"A área de um quadrado de lado x"

### Diagramas de Correspondência

Setas conectando elementos do domínio aos elementos da imagem.

---

## 3. Tipos de Funções

### Funções Lineares

**Forma:** f(x) = mx + b

- **m** = inclinação (slope)
- **b** = interceptação vertical (y-intercept)

$$
m = \frac{y_2 - y_1}{x_2 - x_1}
$$

**Exemplo:** f(x) = 2x + 3
- Inclinação: 2 (sobe 2 para cada 1 à direita)
- Interceptação: 3 (cruza o eixo y em 3)

### Funções Quadráticas

**Forma:** f(x) = ax² + bx + c

**Gráfico:** Parábola
- Se a > 0: abre para cima
- Se a < 0: abre para baixo

**Vértice:** ponto (-b/2a, f(-b/2a))

$$
x_v = -\frac{b}{2a}
$$

### Funções Exponenciais

**Forma:** f(x) = a · bˣ

- **b > 1:** crescimento exponencial
- **0 < b < 1:** decaimento exponencial

**Exemplo:** f(x) = 2ˣ
- f(0) = 1
- f(1) = 2
- f(2) = 4
- f(3) = 8

> [!WARNING]
> Funções exponenciais crescem muito mais rápido que funções lineares ou quadráticas. Um investimento com juros compostos pode crescer surpreendentemente.

---

## 4. Exercícios Interativos

### Máquina de Funções

```matching
{
  "question": "Identifique a saída para cada entrada:",
  "pairs": [
    {"left": "f(x) = 2x + 1, x = 3", "right": "7"},
    {"left": "f(x) = x², x = 4", "right": "16"},
    {"left": "f(x) = 3ˣ, x = 2", "right": "9"}
  ],
  "explanation": "Substitua o valor de x na função para encontrar a saída."
}
```text

### Explorador de Gráficos

```matching
{
  "question": "Identifique o tipo de função pelo gráfico:",
  "pairs": [
    {"left": "Linha reta", "right": "Função linear"},
    {"left": "Parábola", "right": "Função quadrática"},
    {"left": "Curva ascendente rápida", "right": "Função exponencial"}
  ],
  "explanation": "Cada tipo de função tem um formato de gráfico característico."
}
```

### Funções do Mundo Real

```matching
{
  "question": "Associe cada situação com o tipo de função:",
  "pairs": [
    {"left": "Velocidade constante", "right": "Linear"},
    {"left": "Queda livre", "right": "Quadrática"},
    {"left": "Crescimento populacional", "right": "Exponencial"}
  ],
  "explanation": "Diferentes fenômenos são modelados por diferentes tipos de funções."
}
```text

---

## Aplicação no Mundo Real

### Economia, Ciência e Engenharia

**Economia:**
- Custo total = Custo fixo + Custo variável × unidades
- Receita = Preço × Quantidade
- Lucro = Receita - Custo

**Ciência:**
- Posição: s(t) = s₀ + v₀t + ½at²
- Crescimento bacteriano: N(t) = N₀ · 2^(t/T)

**Engenharia:**
- Circuitos elétricos: V = IR
- Resistência de materiais

---

## Practice Questions

```question
{
  "id": "math-foundations-q36",
  "type": "multiple-choice",
  "question": "A relação entre idade e altura é uma função? Por quê?",
  "options": [
    "Sim, porque cada idade tem uma altura",
    "Não, porque uma pessoa pode ter duas alturas",
    "Sim, porque altura é contínua",
    "Depende da pessoa"
  ],
  "correct": 0,
  "explanation": "Para cada idade (entrada), existe exatamente uma altura (saída), então é uma função."
}
```

```question
{
  "id": "math-foundations-q37",
  "type": "multiple-choice",
  "question": "Qual é a inclinação e a interceptação de f(x) = 2x + 3?",
  "options": [
    "Inclinação 3, interceptação 2",
    "Inclinação 2, interceptação 3",
    "Inclinação 2, interceptação 0",
    "Inclinação 1, interceptação 3"
  ],
  "correct": 1,
  "explanation": "Na forma f(x) = mx + b, m é a inclinação (2) e b é a interceptação (3)."
}
```text

```question
{
  "id": "math-foundations-q38",
  "type": "multiple-choice",
  "question": "Se f(x) = x² - 3x + 2, quanto é f(5)?",
  "options": [
    "12",
    "22",
    "32",
    "7"
  ],
  "correct": 0,
  "explanation": "f(5) = 25 - 15 + 2 = 12."
}
```

```question
{
  "id": "math-foundations-q39",
  "type": "multiple-choice",
  "question": "Um carro perde 15% do seu valor por ano. Qual função modela isso?",
  "options": [
    "f(t) = 10000 × 0.85ᵗ",
    "f(t) = 10000 × 1.15ᵗ",
    "f(t) = 10000 - 1500t",
    "f(t) = 10000 × 15ᵗ"
  ],
  "correct": 0,
  "explanation": "Perda de 15% significa que resta 85% do valor, então multiplicamos por 0.85 a cada ano."
}
```text

```question
{
  "id": "math-foundations-q40",
  "type": "multiple-choice",
  "question": "Qual é um exemplo de função do dia a dia?",
  "options": [
    "Temperatura ao longo do dia",
    "Nomes em uma lista telefônica",
    "Cores do arco-íris",
    "Letras do alfabeto"
  ],
  "correct": 0,
  "explanation": "A temperatura em cada momento do dia é uma função do tempo."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Uma função atribui cada entrada exatamente uma saída
- Funções podem ser representadas por tabelas, gráficos, equações ou descrições
- Funções lineares têm gráfico de linha reta
- Funções quadráticas têm gráfico de parábola
- Funções exponenciais modelam crescimento e decaimento
- As funções são ferramentas essenciais para modelar o mundo real
