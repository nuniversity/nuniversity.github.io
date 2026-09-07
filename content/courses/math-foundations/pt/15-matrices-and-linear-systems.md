---
title: "Matrizes e Sistemas Lineares"
description: "Compreenda matrizes, operações matriciais e resolução de sistemas de equações lineares."
order: 15
duration: "60 minutes"
difficulty: "beginner"
---

# Matrizes e Sistemas Lineares

**Gancho**: "Matrizes são arranjos retangulares de números. São ferramentas poderosas para resolver sistemas de equações e transformar espaços."

---

## Inventados na China

Matemáticos chineses inventaram métodos matriciais no século II a.C. O Nove Capítulos da Arte Matemática usa arranjos retangulares para resolver sistemas de equações lineares. Isso foi 1.800 anos antes de matemáticos ocidentais desenvolverem métodos semelhantes.

> [!NOTE]
> Matrizes são usadas em computação gráfica, engenharia, economia e ciência da computação.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender operações com matrizes
- Resolver sistemas usando matrizes
- Aplicar matrizes a transformações
- Compreender as origens chinesas

---

## 1. Fundamentos de Matrizes

### Definição e Notação

Uma **matriz** é um arranjo retangular de números entre colchetes.

**Exemplo:** Matriz 2×2
$$
A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$

### Adição e Multiplicação por Escalar

**Soma:** A + B (elemento por elemento)
**Escalar:** kA (multiplica cada elemento por k)

### Multiplicação de Matrizes

$$
(AB)_{ij} = \sum_{k} a_{ik} \cdot b_{kj}
$$

**Exemplo:**
$$
\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} \times \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix} = \begin{pmatrix} 19 & 22 \\ 43 & 50 \end{pmatrix}
$$

> [!WARNING]
> Multiplicação de matrizes NÃO é comutativa: AB ≠ BA em geral.

---

## 2. Resolvendo Sistemas

### Matrizes Aumentadas

**Sistema:**
```text
x + y = 5
2x - y = 1
```

**Matriz aumentada:**
$$
\begin{pmatrix} 1 & 1 & | & 5 \\ 2 & -1 & | & 1 \end{pmatrix}
$$

### Eliminação de Gauss-Jordan

1. Zere abaixo da diagonal principal
2. Zere acima da diagonal principal
3. Normalize a diagonal

### Eliminação Gaussiana

$$
\begin{pmatrix} 1 & 1 & 5 \\ 2 & -1 & 1 \end{pmatrix} \rightarrow \begin{pmatrix} 1 & 1 & 5 \\ 0 & -3 & -9 \end{pmatrix} \rightarrow \begin{pmatrix} 1 & 1 & 5 \\ 0 & 1 & 3 \end{pmatrix} \rightarrow \begin{pmatrix} 1 & 0 & 2 \\ 0 & 1 & 3 \end{pmatrix}
$$

**Solução:** x = 2, y = 3

---

## 3. Aplicações

### Transformações 2D e 3D

**Rotação:**
$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$

**Escala:**
$$
S = \begin{pmatrix} s_x & 0 \\ 0 & s_y \end{pmatrix}
$$

### Computação Gráfica

- Translações, rotações, escalas
- Projeções 3D para 2D
- Animações

### Análise de Redes

- Matrizes de adjacência
- Fluxo em redes
- PageRank do Google

---

## 4. Exercícios Interativos

### Calculadora de Matrizes

```matching
{
  "question": "Realize cada operação:",
  "pairs": [
    {"left": "[1,2; 3,4] + [5,6; 7,8]", "right": "[6,8; 10,12]"},
    {"left": "2 × [1,2; 3,4]", "right": "[2,4; 6,8]"},
    {"left": "[1,0; 0,1] × [a;b]", "right": "[a;b]"}
  ],
  "explanation": "Matrizes são somadas elemento por elemento; escalares multiplicam todos os elementos."
}
```text

### Resolvedor de Sistemas

```matching
{
  "question": "Resolva cada sistema:",
  "pairs": [
    {"left": "x + y = 5, x - y = 1", "right": "x = 3, y = 2"},
    {"left": "2x + y = 7, x + y = 4", "right": "x = 3, y = 1"},
    {"left": "x + 2y = 8, 2x + y = 7", "right": "x = 2, y = 3"}
  ],
  "explanation": "Use eliminação de Gauss para resolver sistemas."
}
```

### Visualizador de Transformação

```matching
{
  "question": "Identifique a transformação:",
  "pairs": [
    {"left": "[0,-1; 1,0]", "right": "Rotação 90°"},
    {"left": "[2,0; 0,2]", "right": "Escala por 2"},
    {"left": "[1,1; 0,1]", "right": "Cisalhamento"}
  ],
  "explanation": "Cada matriz de transformação tem um efeito geométrico específico."
}
```text

---

## Aplicação no Mundo Real

### Computação Gráfica, Engenharia e Economia

**Computação Gráfica:**
- Transformações em jogos
- Animações de filmes
- Realidade virtual

**Engenharia:**
- Sistemas de equações em circuitos
- Análise estrutural
- Controle de processos

**Economia:**
- Modelos de insumo-produto
- Análise de mercados
- Otimização

---

## Practice Questions

```question
{
  "id": "math-foundations-q76",
  "type": "multiple-choice",
  "question": "Some as matrizes: [1,2; 3,4] + [5,6; 7,8]",
  "options": [
    "[6,8; 10,12]",
    "[5,12; 21,32]",
    "[6,6; 10,10]",
    "[1,3; 5,7]"
  ],
  "correct": 0,
  "explanation": "Soma elemento por elemento: 1+5=6, 2+6=8, 3+7=10, 4+8=12."
}
```

```question
{
  "id": "math-foundations-q77",
  "type": "multiple-choice",
  "question": "Multiplique: [1,2; 3,4] × [5,6; 7,8]",
  "options": [
    "[19,22; 43,50]",
    "[5,12; 21,32]",
    "[7,10; 15,22]",
    "[1,4; 9,16]"
  ],
  "correct": 0,
  "explanation": "1×5+2×7=19, 1×6+2×8=22, 3×5+4×7=43, 3×6+4×8=50."
}
```text

```question
{
  "id": "math-foundations-q78",
  "type": "multiple-choice",
  "question": "Resolva: x + y = 5, 2x - y = 1",
  "options": [
    "x=2, y=3",
    "x=3, y=2",
    "x=1, y=4",
    "x=4, y=1"
  ],
  "correct": 0,
  "explanation": "Somando as equações: 3x=6 → x=2; logo y=3."
}
```

```question
{
  "id": "math-foundations-q79",
  "type": "multiple-choice",
  "question": "Como matemáticos chineses usavam matrizes?",
  "options": [
    "Para arte",
    "Para resolver sistemas lineares com ábacos",
    "Para astronomia",
    "Para filosofia"
  ],
  "correct": 1,
  "explanation": "O Nove Capítulos usa arranjos retangulares para resolver sistemas, semelhante à eliminação gaussiana."
}
```text

```question
{
  "id": "math-foundations-q80",
  "type": "multiple-choice",
  "question": "Que transformação a matriz [0,-1; 1,0] representa?",
  "options": [
    "Escala",
    "Reflexão",
    "Rotação 90°",
    "Cisalhamento"
  ],
  "correct": 2,
  "explanation": "Esta matriz rotaciona pontos 90° no sentido anti-horário."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Matrizes representam dados e transformações
- Multiplicação de matrizes não é comutativa
- Eliminação de Gauss resolve sistemas lineares
- Matrizes são base da computação gráfica
- Matemáticos chineses inventaram métodos matriciais há 2000 anos
