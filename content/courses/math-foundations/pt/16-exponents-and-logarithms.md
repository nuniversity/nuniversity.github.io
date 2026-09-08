---
title: "Expoentes e Logaritmos"
description: "Compreenda expoentes, logaritmos e notação científica, e modele crescimento e decaimento exponencial."
order: 16
duration: "60 minutes"
difficulty: "beginner"
---

# Expoentes e Logaritmos

**Gancho**: "Expoentes tornam números grandes crescerem rápido. Logaritmos são expoentes ao contrário — eles domam números grandes."

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
```

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
```

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

---

## 5. Exemplos Resolvidos: Regras de Expoentes

### Exemplo 1 — Multiplicação de Mesma Base

**Problema:** Simplifique $5^3 \cdot 5^4$

**Passo 1:** Identifique a regra — multiplicação de potências com a mesma base.
$$a^m \cdot a^n = a^{m+n}$$

**Passo 2:** Some os expoentes:
$$5^3 \cdot 5^4 = 5^{3+4} = 5^7$$

**Passo 3:** Avalie (opcional):
$$5^7 = 78\,125$$

> [!WARNING]
> **Erro comum:** Muitos alunos multiplicam os expoentes ($3 \times 4 = 12$) em vez de somá-los. Lembre-se: multiplicação de bases iguais resulta em **soma** dos expoentes.

---

### Exemplo 2 — Divisão de Mesma Base

**Problema:** Simplifique $\df\frac{7^6}{7^2}$

**Passo 1:** Identifique a regra — divisão de potências com a mesma base.
$$\frac{a^m}{a^n} = a^{m-n}$$

**Passo 2:** Subtraia os expoentes:
$$\frac{7^6}{7^2} = 7^{6-2} = 7^4$$

**Passo 3:** Avalie (opcional):
$$7^4 = 2\,401$$

> [!WARNING]
> **Erro comum:** Não subtraia as bases ($7-7=0$). A regra se aplica aos **expoentes**, não às bases.

---

### Exemplo 3 — Potência de uma Potência

**Problema:** Simplifique $(3^2)^4$

**Passo 1:** Identifique a regra — potência de uma potência.
$$(a^m)^n = a^{mn}$$

**Passo 2:** Multiplique os expoentes:
$$(3^2)^4 = 3^{2 \times 4} = 3^8$$

**Passo 3:** Avalie (opcional):
$$3^8 = 6\,561$$

> [!WARNING]
> **Erro comum:** Não some os expoentes aqui. Potência de uma potência usa **multiplicação** de expoentes.

---

### Exemplo 4 — Expoente Negativo

**Problema:** Reescreva $2^{-3}$ como fração positiva.

**Passo 1:** Identifique a regra — expoente negativo.
$$a^{-n} = \frac{1}{a^n}$$

**Passo 2:** Aplique a regra:
$$2^{-3} = \frac{1}{2^3} = \frac{1}{8}$$

> [!WARNING]
> **Erro comum:** $2^{-3}$ **não** é $-8$. O sinal negativo indica recíproco, não negação do resultado.

---

### Exemplo 5 — Expoente Zero

**Problema:** Avalie $99^{0}$

**Passo 1:** Qualquer número não-zero elevado a zero é 1:
$$a^0 = 1 \quad (a \neq 0)$$

**Passo 2:** Portanto:
$$99^{0} = 1$$

> [!WARNING]
> **Erro comum:** $0^{0}$ é indefinido. A regra $a^0 = 1$ só vale para $a \neq 0$.

---

### Exemplo 6 — Expoente Fracionário

**Problema:** Avalie $27^{2/3}$

**Passo 1:** Interprete o expoente fracionário — a parte do numerador é potência e a parte do denominador é raiz:
$$a^{m/n} = \sqrt[n]{a^m} = \left(\sqrt[n]{a}\right)^m$$

**Passo 2:** Aplique:
$$27^{2/3} = \left(\sqrt[3]{27}\right)^2 = 3^2 = 9$$

**Passo 3:** Verificação por outra ordem:
$$27^{2/3} = \sqrt[3]{27^2} = \sqrt[3]{729} = 9 \quad \checkmark$$

> [!WARNING]
> **Erro comum:** Não confunda $a^{1/n}$ com $1/a^n$. Expoente fracionário é raiz, **não** recíproco.

---

### Exemplo 7 — Combinação de Regras

**Problema:** Simplifique $\df\frac{(2^3)^2 \cdot 2^4}{2^5}$

**Passo 1:** Resolva $(2^3)^2$:
$$(2^3)^2 = 2^{3 \times 2} = 2^6$$

**Passo 2:** Multiplique no numerador:
$$2^6 \cdot 2^4 = 2^{6+4} = 2^{10}$$

**Passo 3:** Divida pelo denominador:
$$\frac{2^{10}}{2^5} = 2^{10-5} = 2^5 = 32$$

---

## 6. Exemplos Resolvidos: Equações Logarítmicas

### Exemplo 1 — Equação Simples

**Problema:** Resolva $\log_2(x) = 5$

**Passo 1:** Converta de forma logarítmica para exponencial:
$$\log_b(x) = y \iff b^y = x$$

**Passo 2:** Aplique:
$$x = 2^5 = 32$$

**Verificação:** $\log_2(32) = 5 \quad \checkmark$

---

### Exemplo 2 — Equação com Logaritmos dos Dois Lados

**Problema:** Resolva $\log_3(x + 6) = 2$

**Passo 1:** Converta para forma exponencial:
$$x + 6 = 3^2 = 9$$

**Passo 2:** Isole $x$:
$$x = 9 - 6 = 3$$

**Verificação:** $\log_3(3 + 6) = \log_3(9) = 2 \quad \checkmark$

---

### Exemplo 3 — Usando Propriedades de Logaritmos

**Problema:** Resolva $\log_2(x) + \log_2(x - 2) = 3$

**Passo 1:** Aplique a propriedade de soma de logaritmos:
$$\log_2(x) + \log_2(x-2) = \log_2[x(x-2)]$$

**Passo 2:** Converta para forma exponencial:
$$x(x-2) = 2^3 = 8$$

**Passo 3:** Expanda e resolva a equação quadrática:
$$x^2 - 2x = 8$$
$$x^2 - 2x - 8 = 0$$
$$(x - 4)(x + 2) = 0$$
$$x = 4 \quad \text{ou} \quad x = -2$$

**Passo 4:** Verifique restrições de domínio ($x > 0$ e $x - 2 > 0$):
- $x = 4$: $4 > 0$ e $4 - 2 = 2 > 0$ $\checkmark$
- $x = -2$: $-2 < 0$ $\times$ (inválido, pois logaritmo de número negativo não existe)

**Resposta:** $x = 4$

> [!WARNING]
> **Erro comum:** Sempre verifique se a solução final satisfaz as restrições de domínio. Logaritmos só estão definidos para números **positivos**.

---

### Exemplo 4 — Mudança de Base

**Problema:** Avalie $\log_5(20)$ usando logaritmo comum.

**Passo 1:** Aplique a fórmula de mudança de base:
$$\log_b(x) = \frac{\log_k(x)}{\log_k(b)}$$

**Passo 2:** Use logaritmo comum (base 10):
$$\log_5(20) = \frac{\log(20)}{\log(5)} = \frac{1.3010}{0.6990} \approx 1.8614$$

**Verificação:** $5^{1.8614} \approx 20 \quad \checkmark$

---

## 7. Exemplos Resolvidos: Aplicações

### Exemplo 1 — Juros Compostos

**Problema:** Você investe R\$ 10.000 a uma taxa de 6% ao ano, capitalizada mensalmente. Quanto terá após 5 anos?

**Passo 1:** Identifique os valores:
- $P = 10\,000$ (capital inicial)
- $r = 0{,}06$ (taxa anual)
- $n = 12$ (capitalizações por ano)
- $t = 5$ (anos)

**Passo 2:** Aplique a fórmula:
$$A = P\left(1 + \frac{r}{n}\right)^{nt}$$

$$A = 10\,000\left(1 + \frac{0{,}06}{12}\right)^{12 \times 5}$$

$$A = 10\,000\left(1 + 0{,}005\right)^{60}$$

$$A = 10\,000 \times (1{,}005)^{60}$$

**Passo 3:** Calcule:
$$(1{,}005)^{60} \approx 1{,}3489$$

$$A \approx 10\,000 \times 1{,}3489 = R\$\, 13\,489$$

**Lucro:** $R\$\, 3\,489$ em 5 anos.

> [!NOTE]
> Com juros simples, o lucro seria apenas $R\$\, 3\,000$. Os juros compostos geram R\$ 489 a mais — e esse "bônus" cresce exponencialmente com o tempo.

---

### Exemplo 2 — Escala de pH

**Problema:** Uma solução de vinagre tem concentração de íons hidrogênio $[H^+] = 0{,}005$ mol/L. Qual é o pH?

**Passo 1:** Aplique a fórmula do pH:
$$\text{pH} = -\log_{10}[H^+]$$

**Passo 2:** Substitua:
$$\text{pH} = -\log_{10}(0{,}005)$$

**Passo 3:** Calcule:
$$\log_{10}(0{,}005) = \log_{10}(5 \times 10^{-3}) = \log_{10}(5) + \log_{10}(10^{-3})$$
$$= 0{,}6990 + (-3) = -2{,}3010$$

$$\text{pH} = -(-2{,}3010) = 2{,}30$$

**Interpretação:** pH 2,30 é ácido (vinagre tem pH entre 2 e 3).

---

### Exemplo 3 — Escala de Richter

**Problema:** Um terremoto tem magnitude 7,0 e outro tem magnitude 5,0. Quantas vezes o terremoto maior é mais intenso?

**Passo 1:** A magnitude de Richter é logarítmica:
$$M = \log_{10}\left(\frac{I}{I_0}\right)$$

**Passo 2:** A diferença de magnitude indica a razão de intensidade:
$$\frac{I_1}{I_2} = 10^{M_1 - M_2}$$

**Passo 3:** Calcule:
$$\frac{I_1}{I_2} = 10^{7{,}0 - 5{,}0} = 10^{2} = 100$$

**Resultado:** Um terremoto de magnitude 7 é **100 vezes** mais intenso que um de magnitude 5.

> [!NOTE]
> Cada unidade a mais na escala de Richter representa **10 vezes** mais intensidade. Dois pontos a mais representam $10^2 = 100$ vezes mais intensidade.

---

### Exemplo 4 — Crescimento Populacional

**Problema:** Uma colônia de bactérias tem 500 indivíduos e dobra a cada 3 horas. Qual será a população após 12 horas?

**Passo 1:** Identifique os valores:
- $P_0 = 500$ (população inicial)
- Tempo de dobra = 3 horas
- Tempo total = 12 horas
- Número de dobras: $12 / 3 = 4$

**Passo 2:** Aplique a fórmula de crescimento:
$$P(t) = P_0 \times 2^{t/T_d}$$

$$P(12) = 500 \times 2^{12/3} = 500 \times 2^4$$

**Passo 3:** Calcule:
$$P(12) = 500 \times 16 = 8\,000$$

**Resultado:** Após 12 horas, haverá 8.000 bactérias.

---

## 8. Erros Comuns em Expoentes e Logaritmos

> [!WARNING]
> **Erro 1: Confundir regras de soma e multiplicação de expoentes**
>
> - $a^m \cdot a^n = a^{m+n}$ (soma dos expoentes)
> - $(a^m)^n = a^{mn}$ (multiplicação dos expoentes)
>
> Não troque uma pela outra!

> [!WARNING]
> **Erro 2: Achar que log(a + b) = log(a) + log(b)**
>
> Isso é **falso**! A propriedade correta é:
> $$\log(a \cdot b) = \log(a) + \log(b)$$
> Logaritmo de uma **soma** não pode ser simplificado.

> [!WARNING]
> **Erro 3: Esquecer restrições de domínio**
>
> - $a^n$ exige $a > 0$ para expoentes reais
> - $\log_b(x)$ exige $x > 0$ e $b > 0$, $b \neq 1$
> Sempre verifique se a solução satisfaz essas restrições!

> [!WARNING]
> **Erro 4: Confundir $e$ com Euler's number**
>
> $e \approx 2{,}71828$ é uma constante matemática, não uma variável. Na fórmula $A = Pe^{rt}$, $e$ é a base do logaritmo natural.

---

## 9. Exercícios Interativos Adicionais

### Preencha os Espaços: Regras de Expoentes

```fillblank
{
  "question": "Quando multiplicamos potências de mesma base, somamos os expoentes: $a^m \\cdot a^n = a^{\\_\\_\\_}$",
  "template": "Quando multiplicamos potências de mesma base, somamos os expoentes: $a^m \\cdot a^n = a^{\\_\\_\\_}$ {{1}}",
  "answers": {
    "1": "m+n"
  },
  "explanation": "A regra de multiplicação de potências diz que $a^m \\cdot a^n = a^{m+n}$. Por exemplo, $2^3 \\cdot 2^4 = 2^7$."
}
```

```fillblank
{
  "question": "Quando elevamos uma potência a outra potência, multiplicamos os expoentes: $(a^m)^n = a^{\\_\\_\\_}$",
  "template": "Quando elevamos uma potência a outra potência, multiplicamos os expoentes: $(a^m)^n = a^{\\_\\_\\_}$ {{1}}",
  "answers": {
    "1": "mn"
  },
  "explanation": "Potência de uma potência usa multiplicação: $(a^m)^n = a^{mn}$. Por exemplo, $(3^2)^4 = 3^8$."
}
```

```fillblank
{
  "question": "Um expoente negativo indica recíproco: $a^{-n} = \\frac{1}{a^{\\_\\_\\_}}$",
  "template": "Um expoente negativo indica recíproco: $a^{-n} = \\frac{1}{a^{\\_\\_\\_}}$ {{1}}",
  "answers": {
    "1": "n"
  },
  "explanation": "Expoente negativo significa recíproco: $2^{-3} = \\frac{1}{2^3} = \\frac{1}{8}$."
}
```

```fillblank
{
  "question": "O logaritmo na base 10 de 1000 é _____.",
  "template": "O logaritmo na base 10 de 1000 é {{1}}__.",
  "answers": {
    "1": "3"
  },
  "explanation": "$\\log_{10}(1000) = 3$ porque $10^3 = 1000$."
}
```

```fillblank
{
  "question": "Se $\\log_2(x) = 5$, então $x = $ _____.",
  "template": "Se $\\log_2(x) = 5$, então $x = $ {{1}}__.",
  "answers": {
    "1": "32"
  },
  "explanation": "$\\log_2(x) = 5$ significa $2^5 = x$, logo $x = 32$."
}
```

```fillblank
{
  "question": "O pH de uma solução com $[H^+] = 0{,}01$ mol/L é _____.",
  "template": "O pH de uma solução com $[H^+] = 0{,}01$ mol/L é {{1}}__.",
  "answers": {
    "1": "2"
  },
  "explanation": "$\\text{pH} = -\\log(0{,}01) = -\\log(10^{-2}) = -(-2) = 2$."
}
```

---

## Exemplos Passo a Passo: Regras de Expoentes

### Exemplo — Regra do Produto: $2^3 \times 2^4$

**Problema:** Calcule $2^3 \times 2^4$

**Regra:** Quando multiplicamos potências de mesma base, somamos os expoentes:
$$a^m \cdot a^n = a^{m+n}$$

**Passo 1:** Identifique a base comum ($2$) e some os expoentes:
$$2^3 \times 2^4 = 2^{3+4} = 2^7$$

**Passo 2:** Avalie:
$$2^7 = 128$$

> [!NOTE]
> Nao confunda com $2^3 \times 4^2 = 8 \times 16 = 128$. Nesse caso, as bases sao diferentes e nao podemos somar os expoentes.

---

### Exemplo — Regra do Quociente: $5^7 \div 5^3$

**Problema:** Calcule $5^7 \div 5^3$

**Regra:** Quando dividimos potencias de mesma base, subtraímos os expoentes:
$$\frac{a^m}{a^n} = a^{m-n}$$

**Passo 1:** Identifique a base comum ($5$) e subtraia os expoentes:
$$5^7 \div 5^3 = 5^{7-3} = 5^4$$

**Passo 2:** Avalie:
$$5^4 = 625$$

> [!WARNING]
> **Erro comum:** Nao subtraia as bases ($5-5=0$). A regra se aplica aos **expoentes**, nao as bases.

---

### Exemplo — Regra da Potencia: $(3^2)^4$

**Problema:** Calcule $(3^2)^4$

**Regra:** Quando elevamos uma potencia a outra potencia, multiplicamos os expoentes:
$$(a^m)^n = a^{mn}$$

**Passo 1:** Multiplique os expoentes:
$$(3^2)^4 = 3^{2 \times 4} = 3^8$$

**Passo 2:** Avalie:
$$3^8 = 6\,561$$

> [!NOTE]
> Note a diferenca: no produto ($a^m \cdot a^n$) **somamos** os expoentes; na potencia de potencia ($ (a^m)^n $) **multiplicamos**.

---

## Exemplos Passo a Passo: Equacoes Logaritmicas

### Exemplo 1 — Equacao Simples: $\log_2(x) = 5$

**Problema:** Resolva $\log_2(x) = 5$

**Passo 1:** Converta de logaritmica para exponencial:
$$\log_b(x) = y \iff b^y = x$$

$$x = 2^5$$

**Passo 2:** Avalie:
$$x = 32$$

**Verificacao:** $\log_2(32) = 5$ porque $2^5 = 32$ $\checkmark$

---

### Exemplo 2 — Equacao com Soma de Logaritmos: $\log_2(x) + \log_2(x-2) = 3$

**Problema:** Resolva $\log_2(x) + \log_2(x-2) = 3$

**Passo 1:** Aplique a propriedade de soma de logaritmos:
$$\log_b(A) + \log_b(B) = \log_b(A \cdot B)$$

$$\log_2[x(x-2)] = 3$$

**Passo 2:** Converta para forma exponencial:
$$x(x-2) = 2^3 = 8$$

**Passo 3:** Expanda e resolva a equacao quadratica:
$$x^2 - 2x - 8 = 0$$
$$(x-4)(x+2) = 0$$
$$x = 4 \quad \text{ou} \quad x = -2$$

**Passo 4:** Verifique restricoes de dominio ($x > 0$ e $x-2 > 0$):
- $x = 4$: $4 > 0$ e $4 - 2 = 2 > 0$ $\checkmark$
- $x = -2$: $-2 < 0$ $\times$ (logaritmo de numero negativo nao existe)

**Resposta:** $x = 4$

> [!WARNING]
> **Erro comum:** Sempre verifique se a solucao satisfaz as restricoes de dominio. Logaritmos so estao definidos para numeros **positivos**.

---

## Exemplos Passo a Passo: Aplicacoes

### Exemplo — Juros Compostos

**Problema:** Voce investe R\$ 1.000 a uma taxa de 5% ao mes durante 12 meses. Quanto tera no final?

**Passo 1:** Identifique os valores:
- $P = 1\,000$ (capital inicial)
- $r = 0{,}05$ (taxa mensal)
- $n = 1$ (capitalizacoes por mes)
- $t = 12$ (meses)

**Passo 2:** Aplique a formula de juros compostos:
$$A = P(1 + r)^t$$
$$A = 1\,000 \times (1 + 0{,}05)^{12}$$
$$A = 1\,000 \times (1{,}05)^{12}$$

**Passo 3:** Calcule $(1{,}05)^{12}$:
$$(1{,}05)^{12} \approx 1{,}7959$$

**Passo 4:** Calcule o valor final:
$$A \approx 1\,000 \times 1{,}7959 = R\$\, 1\,795{,}90$$

**Lucro:** $R\$\, 795{,}90$ em 12 meses.

> [!NOTE]
> Com juros simples, o lucro seria apenas $R\$\, 600{,}00$ ($1\,000 \times 0{,}05 \times 12$). Os juros compostos geram $R\$\, 195{,}90$ a mais.

---

### Exemplo — Escala de pH

**Problema:** Uma solucao tem concentracao de ions hidrogenio $[H^+] = 0{,}001$ mol/L. Qual e o pH?

**Passo 1:** Aplique a formula do pH:
$$\text{pH} = -\log_{10}[H^+]$$

**Passo 2:** Substitua:
$$\text{pH} = -\log_{10}(0{,}001)$$

**Passo 3:** Reescreva $0{,}001$ como potencia de 10:
$$0{,}001 = 10^{-3}$$

**Passo 4:** Calcule:
$$\text{pH} = -\log_{10}(10^{-3}) = -(-3) = 3$$

**Interpretacao:** pH 3 e moderadamente acido (semelhante a suco de laranja).

---

### Exemplo — Escala de Richter

**Problema:** Um terremoto tem razao de amplitude de 1.000 em relacao a um terremoto de referencia. Qual e a magnitude?

**Passo 1:** A formula da magnitude de Richter e:
$$M = \log_{10}\left(\frac{I}{I_0}\right)$$

onde $\frac{I}{I_0}$ e a razao de amplitude.

**Passo 2:** Substitua a razao de amplitude:
$$M = \log_{10}(1000)$$

**Passo 3:** Reescreva 1000 como potencia de 10:
$$1000 = 10^3$$

**Passo 4:** Calcule:
$$M = \log_{10}(10^3) = 3$$

**Resultado:** A magnitude e 3 na escala de Richter.

> [!NOTE]
> Na escala de Richter, cada unidade a mais representa **10 vezes** mais intensidade. Uma magnitude 3 e 10 vezes mais forte que uma magnitude 2, e 100 vezes mais forte que uma magnitude 1.

---

## Exercicios Adicionais

```fillblank
{
  "question": "Se $\\log_3(x) = 4$, entao $x = $ _____.",
  "template": "Se $\\log_3(x) = 4$, entao $x = $ {{1}}__.",
  "answers": {
    "1": "81"
  },
  "explanation": "$\\log_3(x) = 4$ significa $3^4 = x$, logo $x = 81$."
}
```

```fillblank
{
  "question": "O pH de uma solucao com $[H^+] = 0{,}0001$ mol/L e _____.",
  "template": "O pH de uma solucao com $[H^+] = 0{,}0001$ mol/L e {{1}}__.",
  "answers": {
    "1": "4"
  },
  "explanation": "$\\text{pH} = -\\log(0{,}0001) = -\\log(10^{-4}) = -(-4) = 4$."
}
```

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
```

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
```

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
