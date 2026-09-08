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
```

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
```

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

---

## 5. Regra da Cadeia (Chain Rule)

### Definicao

Se $y = f(g(x))$, entao a derivada e:

$$\frac{dy}{dx} = f'(g(x)) \cdot g'(x)$$

Em palavras: **derive a funcao externa mantendo a interna, e multiplique pela derivada da funcao interna.**

### Exemplo 1 — Funcao Composta Simples

**Problema:** Encontre a derivada de $y = (3x + 2)^5$

**Passo 1:** Identifique as funcoes:
- Externa: $f(u) = u^5$ (onde $u = 3x+2$)
- Interna: $g(x) = 3x + 2$

**Passo 2:** Derive cada uma:
- $f'(u) = 5u^4$
- $g'(x) = 3$

**Passo 3:** Aplique a regra da cadeia:
$$y' = 5(3x+2)^4 \cdot 3 = 15(3x+2)^4$$

---

### Exemplo 2 — Funcao Trigonometrica Composta

**Problema:** Encontre a derivada de $y = \sin(2x^2)$

**Passo 1:** Identifique as funcoes:
- Externa: $f(u) = \sin(u)$ (onde $u = 2x^2$)
- Interna: $g(x) = 2x^2$

**Passo 2:** Derive cada uma:
- $f'(u) = \cos(u)$
- $g'(x) = 4x$

**Passo 3:** Aplique a regra da cadeia:
$$y' = \cos(2x^2) \cdot 4x = 4x\cos(2x^2)$$

---

### Exemplo 3 — Funcao Exponencial Composta

**Problema:** Encontre a derivada de $y = e^{3x}$

**Passo 1:** A derivada de $e^u$ e $e^u \cdot u'$:
$$y' = e^{3x} \cdot 3 = 3e^{3x}$$

---

### Exemplo 4 — Raiz Quadrada

**Problema:** Encontre a derivada de $y = \sqrt{x^2 + 1}$

**Passo 1:** Reescreva como potencia: $y = (x^2 + 1)^{1/2}$

**Passo 2:** Aplique a regra da cadeia:
$$y' = \frac{1}{2}(x^2+1)^{-1/2} \cdot 2x = \frac{x}{\sqrt{x^2+1}}$$

> [!WARNING]
> **Erro comum na regra da cadeia:** Esquecer de multiplicar pela derivada da funcao interna. Sempre pergunte: "O que esta **dentro** da funcao externa?"

---

## 6. Calculos Paso a Paso: Derivadas

### Exemplo 1 — Multiplas Regras

**Problema:** Encontre a derivada de $f(x) = x^2 \cdot e^x$

**Passo 1:** Identifique — e um produto: $f(x) = x^2 \cdot e^x$

**Passo 2:** Aplique a regra do produto $(fg)' = f'g + fg'$:
- $f'(x) = 2x$ (derivada de $x^2$)
- $g'(x) = e^x$ (derivada de $e^x$)

**Passo 3:** Combine:
$$f'(x) = 2x \cdot e^x + x^2 \cdot e^x = e^x(2x + x^2) = x \cdot e^x(x + 2)$$

---

### Exemplo 2 — Quociente

**Problema:** Encontre a derivada de $f(x) = \df\frac{\sin x}{x^2}$

**Passo 1:** Aplique a regra do quociente $\left(\frac{f}{g}\right)' = \frac{f'g - fg'}{g^2}$:
- $f(x) = \sin x \Rightarrow f'(x) = \cos x$
- $g(x) = x^2 \Rightarrow g'(x) = 2x$

**Passo 2:** Aplique a formula:
$$f'(x) = \frac{\cos x \cdot x^2 - \sin x \cdot 2x}{x^4}$$

**Passo 3:** Simplifique:
$$f'(x) = \frac{x\cos x - 2\sin x}{x^3}$$

---

### Exemplo 3 — Derivada de Logaritmo Natural

**Problema:** Encontre a derivada de $f(x) = \ln(x^2 + 1)$

**Passo 1:** Regra da cadeia: derivada de $\ln(u)$ e $\frac{1}{u} \cdot u'$
- $u = x^2 + 1$
- $u' = 2x$

**Passo 2:** Aplique:
$$f'(x) = \frac{1}{x^2+1} \cdot 2x = \frac{2x}{x^2+1}$$

---

## 7. Exemplos Resolvidos: Integrais Definidas

### Exemplo 1 — Area Sob uma Parabola

**Problema:** Calcule $\displaystyle\int_0^3 x^2 \, dx$

**Passo 1:** Encontre a antiderivada:
$$F(x) = \frac{x^3}{3}$$

**Passo 2:** Aplique o Teorema Fundamental:
$$\int_0^3 x^2 \, dx = F(3) - F(0) = \frac{27}{3} - \frac{0}{3} = 9$$

**Interpretacao:** A area sob $y = x^2$ de $x=0$ a $x=3$ e 9 unidades quadradas.

---

### Exemplo 2 — Integral Trigonometrica

**Problema:** Calcule $\displaystyle\int_0^{\pi/2} \cos x \, dx$

**Passo 1:** A antiderivada de $\cos x$ e $\sin x$:
$$\int_0^{\pi/2} \cos x \, dx = \sin x \Big|_0^{\pi/2}$$

**Passo 2:** Avalie:
$$= \sin\left(\frac{\pi}{2}\right) - \sin(0) = 1 - 0 = 1$$

**Interpretacao:** A area sob $y = \cos x$ de 0 a $\pi/2$ e 1.

---

### Exemplo 3 — Integral com Funcao Exponencial

**Problema:** Calcule $\displaystyle\int_1^2 \frac{1}{x} \, dx$

**Passo 1:** A antiderivada de $\frac{1}{x}$ e $\ln|x|$:
$$\int_1^2 \frac{1}{x} \, dx = \ln|x| \Big|_1^2$$

**Passo 2:** Avalie:
$$= \ln 2 - \ln 1 = \ln 2 - 0 = \ln 2 \approx 0{,}693$$

**Interpretacao:** A area sob $y = 1/x$ de 1 a 2 e $\ln 2$.

---

### Exemplo 4 — Integral com Substituicao

**Problema:** Calcule $\displaystyle\int_0^1 2x \cdot e^{x^2} \, dx$

**Passo 1:** Faca a substituicao $u = x^2$, $du = 2x \, dx$:
- Quando $x = 0$, $u = 0$
- Quando $x = 1$, $u = 1$

**Passo 2:** Reescreva a integral:
$$\int_0^1 e^u \, du = e^u \Big|_0^1$$

**Passo 3:** Avalie:
$$= e^1 - e^0 = e - 1 \approx 1{,}718$$

---

## 8. Aplicacoes Adicionais do Teorema Fundamental

### Exemplo 1 — Velocidade e Deslocamento

**Problema:** Um carro tem velocidade $v(t) = 60 + 4t$ m/s. Qual e o deslocamento entre $t = 0$ e $t = 5$ segundos?

**Solucao:**
$$\text{Deslocamento} = \int_0^5 v(t) \, dt = \int_0^5 (60 + 4t) \, dt$$

$$= \left[60t + 2t^2\right]_0^5 = (300 + 50) - 0 = 350 \text{ metros}$$

---

### Exemplo 2 — Custo Marginal

**Problema:** O custo marginal de produzir $x$ unidades e $C'(x) = 2x + 10$. Se o custo fixo e R$ 100, qual e o custo total de produzir 20 unidades?

**Solucao:**
$$C(x) = \int C'(x) \, dx = \int (2x + 10) \, dx = x^2 + 10x + K$$

Com $C(0) = 100$: $K = 100$

$$C(20) = 400 + 200 + 100 = R\$\, 700$$

---

### Exemplo 3 — Area Entre Duas Curvas

**Problema:** Encontre a area entre $y = x^2$ e $y = x$ no intervalo $[0, 1]$.

**Passo 1:** Identifique qual curva esta acima. Para $x \in (0,1)$: $x > x^2$.

**Passo 2:** Calcule a integral:
$$A = \int_0^1 (x - x^2) \, dx = \left[\frac{x^2}{2} - \frac{x^3}{3}\right]_0^1$$

**Passo 3:** Avalie:
$$A = \left(\frac{1}{2} - \frac{1}{3}\right) - 0 = \frac{1}{6}$$

---

## 9. Erros Comuns no Calculo

> [!WARNING]
> **Erro 1: Esquecer a constante C na antiderivada**
>
> Ao calcular uma integral indefinida, **sempre** adicione $+ C$. Sem ele, a resposta esta incompleta.

> [!WARNING]
> **Erro 2: Aplicar a regra do produto para divisao**
>
> O produto $(fg)' = f'g + fg'$. A divisao usa a regra do quociente:
> $$\left(\frac{f}{g}\right)' = \frac{f'g - fg'}{g^2}$$
> Nao troque uma pela outra!

> [!WARNING]
> **Erro 3: Erro na regra da cadeia**
>
> Ao derivar $\sin(3x)$, nao escreva apenas $\cos(3x)$. A resposta correta e $3\cos(3x)$ — voce **deve** multiplicar pela derivada da funcao interna.

---

## 10. Exercicios Interativos Adicionais

### Preencha os Espacos: Regras de Diferenciacao

```fillblank
{
  "question": "A derivada de $x^n$ e $\\_\\_\\_ \\cdot x^{n-1}$ (Regra da Potencia).",
  "template": "A derivada de $x^n$ e $\\_\\_\\_ \\cdot x^{n-1}$ (Regra da Potencia). {{1}}",
  "answers": {
    "1": "n"
  },
  "explanation": "A regra da potencia diz que $\\frac{d}{dx}(x^n) = nx^{n-1}$. Por exemplo, a derivada de $x^3$ e $3x^2$."
}
```

```fillblank
{
  "question": "A regra do produto afirma que $(fg)' = f'g + \\_\\_\\_$",
  "template": "A regra do produto afirma que $(fg)' = f'g + \\_\\_\\_$ {{1}}",
  "answers": {
    "1": "fg'"
  },
  "explanation": "A regra do produto: $(fg)' = f'g + fg'$. A derivada do produto NAO e $f' \\cdot g'$."
}
```

```fillblank
{
  "question": "A derivada de $\\sin(x)$ e _____ e a derivada de $\\cos(x)$ e _____.",
  "template": "A derivada de $\\sin(x)$ e {{1}}__ e a derivada de $\\cos(x)$ e {{1}}__.",
  "answers": {
    "1": "cos(x), -sin(x)"
  },
  "explanation": "$\\frac{d}{dx}\\sin(x) = \\cos(x)$ e $\\frac{d}{dx}\\cos(x) = -\\sin(x)$."
}
```

```fillblank
{
  "question": "Pela regra da cadeia, a derivada de $e^{3x}$ e _____ $\\cdot e^{3x}$.",
  "template": "Pela regra da cadeia, a derivada de $e^{3x}$ e {{1}}__ $\\cdot e^{3x}$.",
  "answers": {
    "1": "3"
  },
  "explanation": "A derivada de $e^{u}$ e $e^u \\cdot u'$. Para $u = 3x$, temos $u' = 3$."
}
```

```fillblank
{
  "question": "A integral definida $\\int_0^2 2x \\, dx$ e igual a _____.",
  "template": "A integral definida $\\int_0^2 2x \\, dx$ e igual a {{1}}__.",
  "answers": {
    "1": "4"
  },
  "explanation": "$\\int_0^2 2x \\, dx = x^2 \\Big|_0^2 = 4 - 0 = 4$."
}
```

---

## 11. Regra da Cadeia — Resumo e Mais Exemplos

### Formula Geral

A regra da cadeia permite derivar funcoes compostas. Se $y = f(g(x))$, entao:

$$\frac{d}{dx}[f(g(x))] = f'(g(x)) \times g'(x)$$

Em palavras: **derive a funcao externa mantendo a interna, depois multiplique pela derivada da funcao interna.**

---

### Exemplo 1 — d/dx[sin(3x)]

**Problema:** Encontre a derivada de $y = \sin(3x)$.

**Passo 1:** Identifique as funcoes:
- Externa: $f(u) = \sin(u)$, logo $f'(u) = \cos(u)$
- Interna: $g(x) = 3x$, logo $g'(x) = 3$

**Passo 2:** Aplique a regra da cadeia:
$$y' = \cos(3x) \times 3 = 3\cos(3x)$$

> [!WARNING]
> Nao escreva apenas $\cos(3x)$. A derivada da funcao interna (3) **deve** ser multiplicada.

---

### Exemplo 2 — d/dx[(2x+1)⁵]

**Problema:** Encontre a derivada de $y = (2x+1)^5$.

**Passo 1:** Identifique as funcoes:
- Externa: $f(u) = u^5$, logo $f'(u) = 5u^4$
- Interna: $g(x) = 2x+1$, logo $g'(x) = 2$

**Passo 2:** Aplique a regra da cadeia:
$$y' = 5(2x+1)^4 \times 2 = 10(2x+1)^4$$

---

### Exemplo 3 — Regra do Produto: d/dx[x²sin(x)]

**Problema:** Encontre a derivada de $y = x^2 \cdot \sin(x)$.

**Formula:** $(fg)' = f'g + fg'$

**Passo 1:** Identifique:
- $f(x) = x^2 \Rightarrow f'(x) = 2x$
- $g(x) = \sin(x) \Rightarrow g'(x) = \cos(x)$

**Passo 2:** Aplique a regra do produto:
$$y' = 2x \cdot \sin(x) + x^2 \cdot \cos(x)$$

**Interpretacao:** O resultado combina dois termos — cada um tem a derivada de um fator multiplicada pelo outro fator.

---

## 12. Integrais Definidas — Mais Exemplos

### Exemplo 1 — ∫₀³ x² dx

**Problema:** Calcule $\displaystyle\int_0^3 x^2 \, dx$.

**Passo 1:** Encontre a antiderivada:
$$F(x) = \frac{x^3}{3}$$

**Passo 2:** Aplique o Teorema Fundamental:
$$\int_0^3 x^2 \, dx = \left[\frac{x^3}{3}\right]_0^3 = \frac{3^3}{3} - \frac{0^3}{3} = \frac{27}{3} - 0 = 9$$

**Interpretacao:** A area sob $y = x^2$ no intervalo $[0, 3]$ e 9 unidades quadradas.

---

### Exemplo 2 — ∫₁² (3x² - 2x) dx

**Problema:** Calcule $\displaystyle\int_1^2 (3x^2 - 2x) \, dx$.

**Passo 1:** Encontre a antiderivada de cada termo:
- Antiderivada de $3x^2$: $\frac{3x^3}{3} = x^3$
- Antiderivada de $2x$: $\frac{2x^2}{2} = x^2$

$$F(x) = x^3 - x^2$$

**Passo 2:** Aplique o Teorema Fundamental:
$$\int_1^2 (3x^2 - 2x) \, dx = \left[x^3 - x^2\right]_1^2$$

$$= (2^3 - 2^2) - (1^3 - 1^2) = (8 - 4) - (1 - 1) = 4 - 0 = 4$$

---

## 13. Exercicios: Regras de Diferenciacao

```fillblank
{
  "question": "Pela regra da cadeia, a derivada de $\\sin(3x)$ e $\\_\\_\\_ \\cdot \\cos(3x)$.",
  "template": "Pela regra da cadeia, a derivada de $\\sin(3x)$ e $\\_\\_\\_ \\cdot \\cos(3x)$. {{1}}",
  "answers": {
    "1": "3"
  },
  "explanation": "A derivada de $\\sin(u)$ e $\\cos(u) \\cdot u'$. Para $u = 3x$, temos $u' = 3$. Portanto, $\\frac{d}{dx}\\sin(3x) = 3\\cos(3x)$."
}
```

```fillblank
{
  "question": "Pela regra do produto, a derivada de $x^2 \\sin(x)$ e $2x \\cdot \\sin(x) + x^2 \\cdot \\_\\_\\_$.",
  "template": "Pela regra do produto, a derivada de $x^2 \\sin(x)$ e $2x \\cdot \\sin(x) + x^2 \\cdot \\_\\_\\_$. {{1}}",
  "answers": {
    "1": "cos(x)"
  },
  "explanation": "A regra do produto: $(fg)' = f'g + fg'$. Aqui $f = x^2$, $g = \\sin(x)$, entao $f' = 2x$ e $g' = \\cos(x)$. Logo, $y' = 2x\\sin(x) + x^2\\cos(x)$."
}
```


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
```

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
  "correct": 3,
  "explanation": "y' = 3x², em x = 2: 3(4) = 12."
}
```

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
