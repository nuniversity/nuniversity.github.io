---
title: "Matemática Discreta"
description: "Compreenda conjuntos, lógica, combinatória e teoria dos grafos — a matemática da ciência da computação."
order: 19
duration: "60 minutes"
difficulty: "beginner"
---

# Matemática Discreta

**Gancho**: "A matemática discreta lida com valores separados e distintos. É a matemática da ciência da computação."

---

## A Matemática dos Computadores

A combinatória tem raízes antigas. Matemáticos indianos estudaram permutações e combinações. Matemáticos chineses desenvolveram o Triângulo de Pascal (Triângulo de Yang Hui, 1303 d.C.) antes de Pascal. Jogos de areia africanos codificam pensamento combinatório.

> [!NOTE]
> Matemática discreta é a base da ciência da computação, redes e programação.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender conjuntos e lógica
- Aplicar princípios de contagem
- Explorar teoria dos grafos
- Conectar com ciência da computação

---

## 1. Conjuntos e Lógica

### Notação de Conjunto

$$
A = \{1, 2, 3\}
$$

**Elemento:** 1 ∈ A
**Subconjunto:** B ⊂ A

### União e Interseção

$$
A \cup B = \{x : x \in A \text{ ou } x \in B\}
$$

$$
A \cap B = \{x : x \in A \text{ e } x \in B\}
$$

### Operadores Lógicos

- **E (∧):** Verdadeiro se ambos verdadeiros
- **Ou (∨):** Verdadeiro se pelo menos um verdadeiro
- **Não (¬):** Inverte valor
- **Se...então (→):** Falso apenas se T → F

---

## 2. Combinatória

### Permutações

**Arranjos:** Ordem importa
$$
P(n,r) = \frac{n!}{(n-r)!}
$$

### Combinações

**Combinações:** Ordem não importa
$$
C(n,r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}
$$

### Teorema Binomial

$$
(a+b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k
$$

---

## 3. Teoria dos Grafos

### Vértices e Arestas

**Grafo:** G = (V, E) onde V são vértices e E são arestas

### Caminhos e Ciclos

**Caminho:** Sequência de vértices conectados
**Ciclo:** Caminho que começa e termina no mesmo vértice

### Pontes de Königsberg

Euler (1736) provou que não é possível cruzar todas as pontes uma única vez — nascimento da teoria dos grafos.

---

## 4. Exercícios Interativos

### Calculadora de Conjuntos

```matching
{
  "question": "Encontre:",
  "pairs": [
    {"left": "{1,2,3} ∪ {3,4,5}", "right": "{1,2,3,4,5}"},
    {"left": "{1,2,3} ∩ {3,4,5}", "right": "{3}"},
    {"left": "|{1,2,3,4,5}|", "right": "5"}
  ],
  "explanation": "Unão combina elementos; interseção mantém comuns."
}
```text

### Ferramenta de Contagem

```matching
{
  "question": "Calcule:",
  "pairs": [
    {"left": "5! ", "right": "120"},
    {"left": "C(10,3)", "right": "120"},
    {"left": "P(5,3)", "right": "60"}
  ],
  "explanation": "Fatorial, combinações e permutações são princípios fundamentais de contagem."
}
```

### Explorador de Grafos

```matching
{
  "question": "Identifique:",
  "pairs": [
    {"left": "K₄ (completo em 4 vértices)", "right": "6 arestas"},
    {"left": "Ciclo em 5 vértices", "right": "5 arestas"},
    {"left": "Árvore em 4 vértices", "right": "3 arestas"}
  ],
  "explanation": "Grafos completos têm n(n-1)/2 arestas; árvores têm n-1 arestas."
}
```text

---

## Aplicação no Mundo Real

### Ciência da Computação, Redes e Programação

**Ciência da Computação:**
- Algoritmos usam grafos
- Árvores de decisão
- Grafos de dependência

**Redes:**
- Roteamento (grafos)
- Topologia de redes
- Análise de redes sociais

**Programação:**
- Estruturas de dados (árvores, grafos)
- Lógica booleana
- Otimização

---

## Practice Questions

```question
{
  "id": "math-foundations-q96",
  "type": "multiple-choice",
  "question": "Encontre |{1,2,3} ∪ {3,4,5}|",
  "options": [
    "3",
    "4",
    "5",
    "6"
  ],
  "correct": 2,
  "explanation": "A união tem 5 elementos: {1,2,3,4,5}."
}
```

```question
{
  "id": "math-foundations-q97",
  "type": "multiple-choice",
  "question": "Quantas maneiras de escolher 3 livros de 10?",
  "options": [
    "30",
    "120",
    "720",
    "210"
  ],
  "correct": 1,
  "explanation": "C(10,3) = 10!/(3!7!) = 120."
}
```text

```question
{
  "id": "math-foundations-q98",
  "type": "multiple-choice",
  "question": "Desenhe K₄ (grafo completo em 4 vértices).",
  "options": [
    "3 arestas",
    "4 arestas",
    "6 arestas",
    "8 arestas"
  ],
  "correct": 2,
  "explanation": "K₄ tem 4×3/2 = 6 arestas."
}
```

```question
{
  "id": "math-foundations-q99",
  "type": "multiple-choice",
  "question": "Resolva as pontes de Königsberg.",
  "options": [
    "É possível cruzar todas as pontes uma vez",
    "Não é possível — não há caminho euleriano",
    "É possível começar em qualquer ponte",
    "Depende do dia"
  ],
  "correct": 1,
  "explanation": "Euler provou que não existe caminho euleriano porque todos os vértices têm grau ímpar."
}
```text

```question
{
  "id": "math-foundations-q100",
  "type": "multiple-choice",
  "question": "Como o teorema binomial se relaciona com o Triângulo de Pascal?",
  "options": [
    "Não se relacionam",
    "Os coeficientes do triângulo são C(n,k)",
    "O triângulo é uma tabela de logaritmos",
    "O triângulo mostra sequências"
  ],
  "correct": 1,
  "explanation": "Cada elemento do Triângulo de Pascal é uma combinação C(n,k)."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Conjuntos são a base da matemática discreta
- Permutações e combinatória contam arranjos
- Teoria dos grafos estuda conectividade
- Matemática discreta é a base da ciência da computação
- Euler fundou teoria dos grafos resolvendo pontes de Königsberg
