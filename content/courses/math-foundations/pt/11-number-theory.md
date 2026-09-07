---
title: "Teoria dos Números"
description: "Explore números primos, divisibilidade e aritmética modular — a rainha da matemática."
order: 11
duration: "60 minutes"
difficulty: "beginner"
---

# Teoria dos Números

**Gancho**: "A teoria dos números é a 'rainha da matemática' — o estudo das propriedades belas dos números inteiros."

---

## A Beleza dos Números

Matemáticos indianos fizeram contribuições profundas à teoria dos números. Aryabhata (499 d.C.) estudou congruências. Brahmagupta (628 d.C.) resolveu a equação de Pell. Na África, o Osso de Ishango (20.000 a.C.) mostra pensamento antigo sobre teoria dos números.

> [!NOTE]
> A teoria dos números parece abstrata, mas é a base da criptografia moderna que protege suas transações online.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender números primos
- Explorar divisibilidade e fatores
- Aplicar aritmética modular
- Compreender contribuições globais à teoria dos números

---

## 1. Números Primos

### Definição e Propriedades

**Primo:** Número natural maior que 1 que só é divisível por 1 e por ele mesmo.

**Primos:** 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, ...

> [!WARNING]
> O número 1 não é primo! É considerado "unidade" — nem primo nem composto.

### Peneira de Eratóstenes

Método para encontrar todos os primos até um limite n:
1. Liste todos os números de 2 a n
2. Cirle o primeiro não riscado (é primo)
3. Risque todos os seus múltiplos
4. Repita até não houver mais primos

### Distribuição dos Primos

A **Hipótese de Riemann** (não provada) descreve a distribuição de primos. O **Teorema dos Números Primos** diz que há aproximadamente n/ln(n) primos até n.

---

## 2. Divisibilidade

### Fatores e Múltiplos

**Fator:** Divisor exato de um número
**Múltiplo:** Produto de um número por um inteiro

**Exemplo:** Fatores de 12: 1, 2, 3, 4, 6, 12

### MDC e MMC

**MDC (Máximo Divisor Comum):** Maior número que divide ambos
**MMC (Mínimo Múltiplo Comum):** Menor número divisível por ambos

$$
MDC(a,b) \times MMC(a,b) = a \times b
$$

### Algoritmo de Euclides

Método eficiente para calcular MDC:
1. Divida o maior pelo menor
2. Substitua o maior pelo menor e o menor pelo resto
3. Repita até o resto ser 0
4. O último divisor é o MDC

**Exemplo:** MDC(48, 18)
- 48 = 2 × 18 + 12
- 18 = 1 × 12 + 6
- 12 = 2 × 6 + 0
- MDC = 6

---

## 3. Aritmética Modular

### Aritmética do Relógio

**Mod n:** Resto da divisão por n

**Exemplo:** 17 mod 5 = 2 (porque 17 = 3 × 5 + 2)

### Congruências

**Notação:** a ≡ b (mod n) significa que a e b têm o mesmo resto ao dividir por n.

**Propriedades:**
- Se a ≡ b (mod n) e c ≡ d (mod n), então a + c ≡ b + d (mod n)
- Se a ≡ b (mod n) e c ≡ d (mod n), então a × c ≷ b × d (mod n)

### Aplicações em Criptografia

**RSA:** Sistema de criptografia baseado em primos grandes
- Escolha dois primos p e q grandes
- Calcule n = p × q
- A segurança depende da dificuldade de fatorar n

---

## 4. Exercícios Interativos

### Localizador de Primos

```matching
{
  "question": "Identifique se cada número é primo:",
  "pairs": [
    {"left": "17", "right": "Primo"},
    {"left": "21", "right": "Composto (3 × 7)"},
    {"left": "2", "right": "Primo par"}
  ],
  "explanation": "2 é o único primo par. 21 = 3 × 7 não é primo."
}
```text

### Testador de Divisibilidade

```matching
{
  "question": "Calcule o MDC de cada par:",
  "pairs": [
    {"left": "MDC(12, 8)", "right": "4"},
    {"left": "MDC(15, 25)", "right": "5"},
    {"left": "MDC(17, 13)", "right": "1"}
  ],
  "explanation": "Quando MDC = 1, os números são primos entre si."
}
```

### Calculadora Modular

```matching
{
  "question": "Calcule cada congruência:",
  "pairs": [
    {"left": "17 mod 5", "right": "2"},
    {"left": "23 mod 7", "right": "2"},
    {"left": "100 mod 9", "right": "1"}
  ],
  "explanation": "Mod n dá o resto da divisão por n."
}
```text

---

## Aplicação no Mundo Real

### Criptografia, Ciência da Computação

**Criptografia:**
- RSA usa primos grandes
- Segurança de transações online
- Assinaturas digitais

**Ciência da Computação:**
- Hash tables usam aritmética modular
- Random number generation
- Error detection codes

---

## Practice Questions

```question
{
  "id": "math-foundations-q56",
  "type": "multiple-choice",
  "question": "Liste todos os primos menores que 50.",
  "options": [
    "2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47",
    "2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23",
    "1, 2, 3, 5, 7, 11, 13, 17, 19, 23",
    "2, 4, 6, 8, 10, 12, 14, 16, 18, 20"
  ],
  "correct": 0,
  "explanation": "Primos são divisíveis apenas por 1 e por si mesmos. 1 não é primo."
}
```

```question
{
  "id": "math-foundations-q57",
  "type": "multiple-choice",
  "question": "Encontre MDC(48, 18) usando o algoritmo de Euclides.",
  "options": [
    "6",
    "9",
    "12",
    "18"
  ],
  "correct": 0,
  "explanation": "48 = 2×18 + 12; 18 = 1×12 + 6; 12 = 2×6 + 0. MDC = 6."
}
```text

```question
{
  "id": "math-foundations-q58",
  "type": "multiple-choice",
  "question": "Qual é 17 mod 5?",
  "options": [
    "2",
    "3",
    "4",
    "5"
  ],
  "correct": 0,
  "explanation": "17 = 3 × 5 + 2, então 17 mod 5 = 2."
}
```

```question
{
  "id": "math-foundations-q59",
  "type": "multiple-choice",
  "question": "Por que números primos são importantes para segurança da internet?",
  "options": [
    "São fáceis de calcular",
    "São difíceis de fatorar em grandes números",
    "São sempre pares",
    "São sempre ímpares"
  ],
  "correct": 1,
  "explanation": "A criptografia RSA depende da dificuldade de fatorar produtos de dois primos grandes."
}
```text

```question
{
  "id": "math-foundations-q60",
  "type": "multiple-choice",
  "question": "Encontre um padrão na distribuição de primos.",
  "options": [
    "Todos os primos são pares",
    "Primos ficam mais raros conforme os números aumentam",
    "Primos aparecem sempre em pares",
    "Todos os números ímpares são primos"
  ],
  "correct": 1,
  "explanation": "O Teorema dos Números Primos mostra que primos ficam menos frequentes."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Números primos são os blocos construtores dos números inteiros
- O algoritmo de Euclides é eficiente para calcular MDC
- Aritmética modular é a base da criptografia
- A distribuição de primos é um mistério profundo
- Teoria dos números conecta matemática abstrata com aplicações reais
