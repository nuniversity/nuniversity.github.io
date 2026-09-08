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
- Se a ≡ b (mod n) e c ≡ d (mod n), então a × c ≡ b × d (mod n)

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
```

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
```

---

## Aplicação no Mundo Real

### Criptografia, Ciência da Computação

**Criptografia:**
- RSA usa primos grandes
- Segurança de transações online
- Assinaturas digitais

**Ciência da Computação:**
- Tabelas hash usam aritmética modular
- Geração de números aleatórios
- Códigos de detecção de erros

---

## 5. Peneira de Eratóstenes — Demonstração Visual

A Peneira de Eratóstenes é o método mais antigo e elegante para encontrar todos os números primos até um dado limite. Vamos demonstrar passo a passo como ela funciona para encontrar primos até 30.

### Passo a Passo Visual

Imagine uma grade com os números de 2 a 30:

```
 2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
```

**Passo 1:** Comece com 2 (o primeiro número não riscado). É primo. Risque todos os múltiplos de 2:
```
 2  3  X  5  X  7  X  9  X 11  X 13  X 15  X 17  X 19  X 21  X 23  X 25  X 27  X 29  X
```
Múltiplos de 2 riscados: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30

**Passo 2:** O próximo não riscado é 3. É primo. Risque todos os múltiplos de 3:
```
 2  3  X  5  X  7  X  X  X 11  X 13  X  X  X 17  X 19  X  X  X 23  X 25  X  X  X 29  X
```
Múltiplos de 3 riscados: 9, 15, 21, 27 (6, 12, 18, 24, 30 já foram riscados por 2)

**Passo 3:** O próximo não riscado é 5. É primo. Risque múltiplos de 5:
```
 2  3  X  5  X  7  X  X  X 11  X 13  X  X  X 17  X 19  X  X  X 23  X  X  X  X  X 29  X
```
Múltiplos de 5 riscados: 25 (10, 15, 20, 30 já foram riscados)

**Passo 4:** O próximo não riscado é 7. 7² = 49 > 30, então podemos parar!

**Resultado:** Os primos até 30 são: **2, 3, 5, 7, 11, 13, 17, 19, 23, 29**

> [!NOTE]
> Você só precisa verificar até a raiz quadrada do limite. Se n = 30, √30 ≈ 5.47, então basta riscar múltiplos de 2, 3 e 5.

### Contagem de Primos

| Limite (n) | Primos até n | Proporção | Estimativa n/ln(n) |
|:----------:|:-----------:|:---------:|:-------------------:|
| 10 | 4 | 40% | 4.3 |
| 50 | 15 | 30% | 12.7 |
| 100 | 25 | 25% | 21.7 |
| 1000 | 168 | 16.8% | 144.8 |
| 10000 | 1229 | 12.3% | 1085.7 |

---

## 6. Aritmética Modular — Exemplos Computacionais

### Operações Básicas

Aritmética modular trabalha com restos. Aqui estão cálculos passo a passo:

**Exemplo 1:** Calcule (17 + 23) mod 5
- Passo 1: 17 + 23 = 40
- Passo 2: 40 ÷ 5 = 8 resto 0
- Resposta: **(17 + 23) mod 5 = 0**

**Exemplo 2:** Calcule (7 × 8) mod 3
- Passo 1: 7 × 8 = 56
- Passo 2: 56 ÷ 3 = 18 resto 2
- Resposta: **(7 × 8) mod 3 = 2**

**Exemplo 3:** Calcule 2¹⁰ mod 7 usando exponenciação rápida
- 2¹ mod 7 = 2
- 2² mod 7 = 4
- 2⁴ mod 7 = 16 mod 7 = 2
- 2⁸ mod 7 = (2⁴)² mod 7 = 2² mod 7 = 4
- 2¹⁰ mod 7 = 2⁸ × 2² mod 7 = 4 × 4 mod 7 = 16 mod 7 = **2**

### Tabela de Congruências (mod 7)

| a | a mod 7 | 2a mod 7 | a² mod 7 |
|:-:|:-------:|:--------:|:--------:|
| 0 | 0 | 0 | 0 |
| 1 | 1 | 2 | 1 |
| 2 | 2 | 4 | 4 |
| 3 | 3 | 6 | 2 |
| 4 | 4 | 1 | 2 |
| 5 | 5 | 3 | 4 |
| 6 | 6 | 5 | 1 |

### Congruências com Potências

Para calcular a^n mod m eficientemente, use o método de exponenciação binária:

**Exemplo:** 3²⁰ mod 11
- 20 em binário = 10100
- 3¹ mod 11 = 3
- 3² mod 11 = 9
- 3⁴ mod 11 = 9² mod 11 = 81 mod 11 = 4
- 3⁸ mod 11 = 4² mod 11 = 16 mod 11 = 5
- 3¹⁶ mod 11 = 5² mod 11 = 25 mod 11 = 3
- 3²⁰ = 3¹⁶ × 3⁴ → 3 × 4 mod 11 = 12 mod 11 = **1**

> [!WARNING]
> Cuidado: (a + b) mod n = ((a mod n) + (b mod n)) mod n, mas a + b mod n ≠ a mod n + b mod n em geral (o resultado pode ser ≥ n).

---

## 7. Criptografia RSA — Passo a Passo

O RSA é o sistema de criptografia mais usado na internet. Veja como funciona:

### Geração de Chaves

**Passo 1:** Escolha dois números primos p e q
- Exemplo: p = 61, q = 53

**Passo 2:** Calcule n = p × q
- n = 61 × 53 = 3233

**Passo 3:** Calcule φ(n) = (p-1)(q-1)
- φ(3233) = 60 × 52 = 3120

**Passo 4:** Escolha e tal que 1 < e < φ(n) e MDC(e, φ(n)) = 1
- Escolha e = 17 (MDC(17, 3120) = 1) ✓

**Passo 5:** Calcule d tal que d × e ≡ 1 (mod φ(n))
- d = 17⁻¹ mod 3120 = 2753 (porque 17 × 2753 = 46801 = 15 × 3120 + 1)

**Chaves:**
- **Chave pública:** (n, e) = (3233, 17) — pode ser compartilhada
- **Chave privada:** (n, d) = (3233, 2753) — mantida secreta

### Criptografia e Descriptografia

**Mensagem original:** M = 65

**Criptografia (com chave pública):**
- C = M^e mod n
- C = 65¹⁷ mod 3233 = 2790

**Descriptografia (com chave privada):**
- M = C^d mod n
- M = 2790^2753 mod 3233 = 65 ✓

### Por que é Seguro?

A segurança do RSA depende de um fato matemático:
- **Multiplicar** dois primos grandes é fácil: p × q = n
- **Fatorar** n de volta em p e q é extremamente difícil para primos grandes

Para primos de 2048 bits (617 dígitos), fatorar n levaria bilhões de anos com os melhores computadores.

> [!WARNING]
> Erro comum ao calcular RSA: esquecer de usar mod n em cada etapa da exponenciação. Sempre reduza módulo n após cada multiplicação para manter os números gerenciáveis.

---

## 8. Fatoração em Primos — Exercícios Interativos

### Decomposição em Fatores Primos

```fillblank
{
  "question": "Complete a decomposição em fatores primos: 360 = 2^? × 3^? × 5^1",
  "template": "Complete a decomposição em fatores primos: 360 = 2^{{1}} × 3^{{2}} × 5^1",
  "answers": {
    "1": "3",
    "2": "2"
  },
  "explanation": ""
}
```

```fillblank
{
  "question": "Encontre MDC(252, 180) usando decomposição em primos: 252 = 2² × 3² × 7, 180 = 2² × 3² × ?. MDC = 2² × 3² = ?",
  "template": "Encontre MDC(252, 180) usando decomposição em primos: 252 = 2² × 3² × 7, 180 = 2² × 3² × {{1}}. MDC = 2² × 3² = {{2}}",
  "answers": {
    "1": "5",
    "2": "36"
  },
  "explanation": ""
}
```

```fillblank
{
  "question": "Resolva: 3x ≡ 4 (mod 7). O inverso de 3 mod 7 é ?, então x ≡ ? (mod 7)",
  "template": "Resolva: 3x ≡ 4 (mod 7). O inverso de 3 mod 7 é {{1}}, então x ≡ {{2}} (mod 7)",
  "answers": {
    "1": "5",
    "2": "6"
  },
  "explanation": ""
}
```

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
```

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
```

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
