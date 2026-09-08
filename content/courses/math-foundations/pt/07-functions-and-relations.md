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
```

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
```

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

## 5. Exemplos Resolvidos Detalhados

### Inclinação a partir de Dois Pontos

**Exemplo 1:** Encontre a inclinação da reta que passa pelos pontos (2, 5) e (6, 13).

**Solução passo a passo:**

**Passo 1:** Identificar as coordenadas.

$$x_1 = 2, \quad y_1 = 5, \quad x_2 = 6, \quad y_2 = 13$$

**Passo 2:** Aplicar a fórmula da inclinação.

$$m = \frac{y_2 - y_1}{x_2 - x_1} = \frac{13 - 5}{6 - 2} = \frac{8}{4} = 2$$

**Passo 3:** Interpretar. A inclinação é 2, ou seja, para cada 1 unidade à direita, o gráfico sobe 2 unidades.

**Equação da reta:** Usando o ponto-slope com (2, 5):

$$y - 5 = 2(x - 2) \Rightarrow y = 2x + 1$$

---

**Exemplo 2:** Encontre a inclinação entre (-1, 7) e (3, -1).

**Solução passo a passo:**

$$m = \frac{-1 - 7}{3 - (-1)} = \frac{-8}{4} = -2$$

A inclinação negativa indica que a reta desce da esquerda para a direita.

---

**Exemplo 3:** Os pontos (4, a) e (-2, 10) estão na mesma reta de inclinação -3. Encontre a.

$$-3 = \frac{10 - a}{-2 - 4} = \frac{10 - a}{-6}$$

$$-3 \times (-6) = 10 - a \Rightarrow 18 = 10 - a \Rightarrow a = -8$$

---

### Aplicação da Fórmula do Vértice

**Exemplo 1:** Encontre o vértice de f(x) = 2x² - 8x + 5.

**Solução passo a passo:**

**Passo 1:** Identificar a = 2, b = -8, c = 5.

**Passo 2:** Calcular a coordenada x do vértice.

$$x_v = -\frac{b}{2a} = -\frac{-8}{2 \times 2} = \frac{8}{4} = 2$$

**Passo 3:** Calcular a coordenada y do vértice substituindo x = 2.

$$y_v = f(2) = 2(2)^2 - 8(2) + 5 = 8 - 16 + 5 = -3$$

**Passo 4:** Escrever o vértice.

$$\text{Vértice: } (2, -3)$$

**Passo 5:** Determinar a direção da parábola. Como a = 2 > 0, a parábola abre para cima, e o vértice é o ponto mínimo.

---

**Exemplo 2:** Encontre o vértice de f(x) = -x² + 6x - 2.

**Solução passo a passo:**

$$x_v = -\frac{6}{2(-1)} = -\frac{6}{-2} = 3$$

$$y_v = f(3) = -(3)^2 + 6(3) - 2 = -9 + 18 - 2 = 7$$

$$\text{Vértice: } (3, 7)$$

Como a = -1 < 0, a parábola abre para baixo, e o vértice é o ponto máximo.

---

**Exemplo 3:** Um foguete segue h(t) = -5t² + 30t + 1. Qual é a altura máxima e quando ocorre?

$$t_{\text{máx}} = -\frac{30}{2(-5)} = 3 \text{ s}$$

$$h(3) = -5(9) + 30(3) + 1 = -45 + 90 + 1 = 46 \text{ m}$$

> **Resposta:** Altura máxima de 46 m aos 3 segundos.

---

### Determinação de Domínio e Contradomínio

**Exemplo 1:** f(x) = √(x - 3)

**Análise:**

O radicando deve ser não-negativo: x - 3 ≥ 0, ou seja, x ≥ 3.

$$\text{Domínio: } [3, +\infty)$$
$$\text{Imagem: } [0, +\infty)$$

---

**Exemplo 2:** f(x) = 1/(x² - 4)

**Análise:**

O denominador não pode ser zero: x² - 4 ≠ 0, ou seja, x ≠ ±2.

$$\text{Domínio: } \mathbb{R} \setminus \{-2, 2\}$$
$$\text{Imagem: } (-\infty, -1/4] \cup (0, +\infty)$$

---

**Exemplo 3:** f(x) = ln(x + 5)

**Análise:**

O argumento do logaritmo deve ser positivo: x + 5 > 0, ou seja, x > -5.

$$\text{Domínio: } (-5, +\infty)$$
$$\text{Imagem: } \mathbb{R}$$

---

**Exemplo 4:** f(x) = |2x - 1| + 3

**Análise:**

O valor absoluto aceita qualquer número real. Porém, |2x - 1| ≥ 0, então f(x) ≥ 3.

$$\text{Domínio: } \mathbb{R}$$
$$\text{Imagem: } [3, +\infty)$$

---

### Erros Comuns em Funções

> [!WARNING]
> **Erro 1: Trocar domínio e imagem.** O domínio são os valores de ENTRADA (x), não de saída (y). Não confunda os dois conjuntos.

> [!WARNING]
> **Erro 2: Esquecer de verificar o denominador.** Em f(x) = 1/(x-3), x = 3 não está no domínio. Sempre verifique divisões por zero!

> [!WARNING]
> **Erro 3: Calcular inclinação invertendo os pontos.** A fórmula é (y₂ - y₁)/(x₂ - x₁). Não inverta a ordem em um dos pares — a inclinação mudará de sinal!

> [!WARNING]
> **Erro 4: Confundir vértice com interceptação.** O vértice é o ponto extremo da parábola. A interceptação vertical é onde o gráfico cruza o eixo y. São pontos diferentes!

---

## Exercício Interativo: Tipos de Funções

```matching
{
  "question": "Associe cada função ao seu tipo correto:",
  "pairs": [
    {"left": "f(x) = 5x + 2", "right": "Função Linear"},
    {"left": "f(x) = 3x² - x + 7", "right": "Função Quadrática"},
    {"left": "f(x) = 2 · 3ˣ", "right": "Função Exponencial"},
    {"left": "f(x) = 1/x", "right": "Função Recíproca"},
    {"left": "f(x) = √x", "right": "Função Radical"},
    {"left": "f(x) = |x - 4|", "right": "Função Valor Absoluto"}
  ],
  "explanation": "Reconheça o formato: mx + b é linear; ax² + bx + c é quadrática; a·bˣ é exponencial; 1/x é recíproca; √x é radical; |x| é valor absoluto."
}
```

```matching
{
  "question": "Identifique a inclinação e interceptação de cada reta:",
  "pairs": [
    {"left": "f(x) = 4x - 7", "right": "Inclinação 4, interceptação -7"},
    {"left": "f(x) = -2x + 5", "right": "Inclinação -2, interceptação 5"},
    {"left": "f(x) = x", "right": "Inclinação 1, interceptação 0"}
  ],
  "explanation": "Na forma f(x) = mx + b, m é a inclinação e b é a interceptação vertical."
}
```

---

## Aplicações no Mundo Real: Estudos de Caso

**Caso 1: Custo e Receita de uma Empresa**

Uma fábrica tem custo fixo de R$ 5.000 e custo variável de R$ 20 por unidade produzida. O preço de venda é R$ 50 por unidade.

$$C(x) = 5.000 + 20x \quad \text{(custo total)}$$
$$R(x) = 50x \quad \text{(receita total)}$$
$$L(x) = R(x) - C(x) = 30x - 5.000 \quad \text{(lucro)}$$

Para lucro zero (ponto de equilíbrio): 30x = 5.000 → x ≈ 167 unidades.

**Caso 2: Lançamento de Projéteis**

Uma bola é lançada de 1,5 m com velocidade inicial de 20 m/s:

$$h(t) = -4,9t^2 + 20t + 1,5$$

Altura máxima em t = 20/9,8 ≈ 2,04 s, com h ≈ 21,9 m.

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
```

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
```

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
