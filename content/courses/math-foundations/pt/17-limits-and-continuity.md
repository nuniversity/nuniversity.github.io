---
title: "Limites e Continuidade"
description: "Compreenda o conceito de limites, avalie limites algebricamente e entenda continuidade — a base do cálculo."
order: 17
duration: "65 minutes"
difficulty: "beginner"
---

# Limites e Continuidade

**Gancho**: "Limites descrevem o que acontece quando nos aproximamos cada vez mais de um ponto. São a fundação do cálculo."

---

## O Ponto de Partida do Cálculo

O conceito de limites era intuitivamente compreendido por matemáticos indianos. Madhava (1400 d.C.) usou limites para derivar séries infinitas. Newton e Leibniz formalizaram o cálculo no século XVII, mas a definição rigorosa veio de Weierstrass no século XIX.

> [!NOTE]
> Limites conectam álgebra com cálculo. Eles permitem definir derivadas e integrais de forma rigorosa.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender o conceito de limites
- Avaliar limites algebricamente
- Compreender continuidade
- Preparar-se para cálculo

---

## 1. O que é um Limite?

### Definição Intuitiva

$$
\lim_{x \to a} f(x) = L
$$

Significa: quando x se aproxima de a, f(x) se aproxima de L.

### Limites Laterais

**Limite pela esquerda:** x → a⁻
**Limite pela direita:** x → a⁺

O limite existe se e somente se ambos os limites laterais existem e são iguais.

### Limites no Infinito

$$
\lim_{x \to \infty} \frac{1}{x} = 0
$$

---

## 2. Avaliando Limites

### Técnicas Algébricas

**Fatoração:**
$$
\lim_{x \to 2} \frac{x^2 - 4}{x - 2} = \lim_{x \to 2} \frac{(x-2)(x+2)}{x-2} = \lim_{x \to 2} (x+2) = 4
$$

### Limites que Não Existem

Se os limites laterais diferem, o limite não existe.

### Formas Indeterminadas

**0/0 ou ∞/∞:** Usar fatoração, racionalização ou L'Hôpital

---

## 3. Continuidade

### Definição de Continuidade

Uma função f é contínua em x = a se:
1. f(a) está definido
2. lim(x→a) f(x) existe
3. lim(x→a) f(x) = f(a)

### Tipos de Descontinuidade

**Removível:** Buraco no gráfico
**Salto:** Mudança abrupta
**Infinito:** Assíntota vertical

### Teorema do Valor Intermediário

Se f é contínua em [a,b] e k está entre f(a) e f(b), então existe c em (a,b) tal que f(c) = k.

---

## 4. Exercícios Interativos

### Visualizador de Limites

```matching
{
  "question": "Avalie cada limite:",
  "pairs": [
    {"left": "lim(x→2) (x²-4)/(x-2)", "right": "4"},
    {"left": "lim(x→∞) 1/x", "right": "0"},
    {"left": "lim(x→0) sin(x)/x", "right": "1"}
  ],
  "explanation": "Use fatoração ou propriedades para avaliar limites."
}
```

### Verificador de Continuidade

```matching
{
  "question": "A função é contínua em x = a?",
  "pairs": [
    {"left": "f(x) = x² em x = 0", "right": "Sim, contínua"},
    {"left": "f(x) = 1/x em x = 0", "right": "Não, assíntota"},
    {"left": "f(x) = |x| em x = 0", "right": "Sim, contínua"}
  ],
  "explanation": "Verifique se f(a) existe, se o limite existe e se são iguais."
}
```

### Explorador de Aproximação

```matching
{
  "question": "Observe o comportamento da função:",
  "pairs": [
    {"left": "x → 0⁺ em 1/x", "right": "Vai para +∞"},
    {"left": "x → 0⁻ em 1/x", "right": "Vai para -∞"},
    {"left": "x → ∞ em eˣ", "right": "Vai para +∞"}
  ],
  "explanation": "Limites laterais podem ter comportamentos diferentes."
}
```

---

## Aplicação no Mundo Real

### Movimento, Otimização e Análise

**Movimento:**
- Velocidade instantânea = limite da velocidade média
- Aceleração = limite da mudança de velocidade

**Otimização:**
- Máximos e mínimos usam limites
- Economia: maximizar lucro

**Análise:**
- Convergência de séries
- Comportamento assintótico

---

---

## 5. Exemplos Resolvidos: Racionalização e Técnicas de Limites

### Exemplo 1 — Racionalização com Radicais

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{\sqrt{x+4} - 2}{x}$

**Passo 1:** Substituição direta produz $\frac{0}{0}$ (indeterminado). Precisamos racionalizar.

**Passo 2:** Multiplique numerador e denominador pelo conjugado:
$$\frac{\sqrt{x+4} - 2}{x} \cdot \frac{\sqrt{x+4} + 2}{\sqrt{x+4} + 2}$$

**Passo 3:** No numerador, aplique $(a-b)(a+b) = a^2 - b^2$:
$$\frac{(x+4) - 4}{x(\sqrt{x+4} + 2)} = \frac{x}{x(\sqrt{x+4} + 2)}$$

**Passo 4:** Simplifique o $x$:
$$\frac{1}{\sqrt{x+4} + 2}$$

**Passo 5:** Avalie o limite:
$$\lim_{x \to 0} \frac{1}{\sqrt{x+4} + 2} = \frac{1}{\sqrt{4} + 2} = \frac{1}{4}$$

> [!NOTE]
> Racionalização é especialmente útil quando radicais causam a forma indeterminada 0/0. O conjugado remove o radical do numerador.

---

### Exemplo 2 — Racionalização no Numerador e Denominador

**Problema:** Avalie $\displaystyle\lim_{x \to 3} \frac{x - 3}{\sqrt{x} - \sqrt{3}}$

**Passo 1:** Substituição direta: $\frac{3-3}{\sqrt{3}-\sqrt{3}} = \frac{0}{0}$ (indeterminado).

**Passo 2:** Racionalize o denominador multiplicando pelo conjugado:
$$\frac{x-3}{\sqrt{x}-\sqrt{3}} \cdot \frac{\sqrt{x}+\sqrt{3}}{\sqrt{x}+\sqrt{3}} = \frac{(x-3)(\sqrt{x}+\sqrt{3})}{x-3}$$

**Passo 3:** Simplifique:
$$= \sqrt{x} + \sqrt{3}$$

**Passo 4:** Avalie o limite:
$$\lim_{x \to 3} (\sqrt{x} + \sqrt{3}) = \sqrt{3} + \sqrt{3} = 2\sqrt{3}$$

---

### Exemplo 3 — Fatoração com Quadrática

**Problema:** Avalie $\displaystyle\lim_{x \to 1} \frac{x^2 - 3x + 2}{x - 1}$

**Passo 1:** Substituição direta: $\frac{1 - 3 + 2}{1 - 1} = \frac{0}{0}$ (indeterminado).

**Passo 2:** Fatore o numerador:
$$x^2 - 3x + 2 = (x-1)(x-2)$$

**Passo 3:** Simplifique:
$$\frac{(x-1)(x-2)}{x-1} = x - 2$$

**Passo 4:** Avalie o limite:
$$\lim_{x \to 1} (x-2) = 1 - 2 = -1$$

---

## 6. Limites Trigonometricos

### O Limite Fundamental: $\displaystyle\lim_{x \to 0} \frac{\sin x}{x} = 1$

Este e um dos limites mais importantes do calculus. Ele permite resolver muitos limites trigonometricos.

**Por que vale?** Geometricamente, para $x$ pequeno (em radianos), o arco $x$, o seno de $x$ e a tangente de $x$ sao quase iguais. Portanto $\sin(x) \approx x$ quando $x \approx 0$.

### Exemplo 1 — Aplicacao do Limite Fundamental

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{\sin(5x)}{x}$

**Passo 1:** Precisamos que o argumento do seno coincida com o denominador. Multiplique e divida por 5:
$$\frac{\sin(5x)}{x} = \frac{\sin(5x)}{5x} \cdot 5$$

**Passo 2:** Seja $u = 5x$. Quando $x \to 0$, $u \to 0$:
$$\lim_{x \to 0} \frac{\sin(5x)}{5x} \cdot 5 = \lim_{u \to 0} \frac{\sin u}{u} \cdot 5 = 1 \cdot 5 = 5$$

---

### Exemplo 2 — Limite com Cosseno

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{1 - \cos x}{x^2}$

**Passo 1:** Substituicao direta: $\frac{1-1}{0} = \frac{0}{0}$ (indeterminado).

**Passo 2:** Multiplique numerador e denominador pelo conjugado $(1 + \cos x)$:
$$\frac{(1-\cos x)(1+\cos x)}{x^2(1+\cos x)} = \frac{1 - \cos^2 x}{x^2(1+\cos x)} = \frac{\sin^2 x}{x^2(1+\cos x)}$$

**Passo 3:** Reorganize:
$$= \left(\frac{\sin x}{x}\right)^2 \cdot \frac{1}{1+\cos x}$$

**Passo 4:** Avalie o limite:
$$= (1)^2 \cdot \frac{1}{1+1} = \frac{1}{2}$$

> [!NOTE]
> **Limites trigonometricos fundamentais para memorizar:**
> - $\displaystyle\lim_{x \to 0} \frac{\sin x}{x} = 1$
> - $\displaystyle\lim_{x \to 0} \frac{1 - \cos x}{x^2} = \frac{1}{2}$
> - $\displaystyle\lim_{x \to 0} \frac{\tan x}{x} = 1$

---

### Exemplo 3 — Limite com Tangente

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{\tan(3x)}{x}$

**Passo 1:** Reescreva $\tan(3x) = \frac{\sin(3x)}{\cos(3x)}$:
$$\frac{\tan(3x)}{x} = \frac{\sin(3x)}{x \cos(3x)}$$

**Passo 2:** Multiplique e divida por 3:
$$= \frac{\sin(3x)}{3x} \cdot \frac{3}{\cos(3x)}$$

**Passo 3:** Avalie cada parte separadamente:
$$\lim_{x \to 0} \frac{\sin(3x)}{3x} = 1 \quad \text{e} \quad \lim_{x \to 0} \frac{3}{\cos(3x)} = \frac{3}{1} = 3$$

**Resultado:** $1 \times 3 = 3$

---

## 7. Regra de L'Hopital

### Quando Usar

A regra de L'Hopital resolve limites nas formas indeterminadas $\frac{0}{0}$ ou $\frac{\infty}{\infty}$.

**Enunciado:** Se $\displaystyle\lim_{x \to a} \frac{f(x)}{g(x)}$ resulta em $\frac{0}{0}$ ou $\frac{\infty}{\infty}$, entao:

$$\lim_{x \to a} \frac{f(x)}{g(x)} = \lim_{x \to a} \frac{f'(x)}{g'(x)}$$

desde que o limite da direita exista.

### Exemplo 1 — Forma 0/0

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{e^x - 1}{x}$

**Passo 1:** Verifique a forma indeterminada:
- Numerador: $e^0 - 1 = 0$
- Denominador: $0$
- Forma: $\frac{0}{0}$

**Passo 2:** Aplique L'Hopital — derive numerador e denominador:
$$\frac{d}{dx}(e^x - 1) = e^x \quad \text{e} \quad \frac{d}{dx}(x) = 1$$

**Passo 3:** Avalie o novo limite:
$$\lim_{x \to 0} \frac{e^x}{1} = e^0 = 1$$

---

### Exemplo 2 — Forma Infinito/Infinito

**Problema:** Avalie $\displaystyle\lim_{x \to \infty} \frac{\ln x}{x}$

**Passo 1:** Verifique a forma indeterminada:
- Numerador: $\ln(\infty) = \infty$
- Denominador: $\infty$
- Forma: $\frac{\infty}{\infty}$

**Passo 2:** Aplique L'Hopital:
$$\frac{d}{dx}(\ln x) = \frac{1}{x} \quad \text{e} \quad \frac{d}{dx}(x) = 1$$

**Passo 3:** Avalie:
$$\lim_{x \to \infty} \frac{1/x}{1} = \lim_{x \to \infty} \frac{1}{x} = 0$$

> [!NOTE]
> Este resultado mostra que $\ln x$ cresce mais lentamente que $x$ quando $x \to \infty$. Logaritmos sao sempre "ultrapassados" por funcoes lineares.

---

### Exemplo 3 — Forma Infinito/Infinito com Exponenciais

**Problema:** Avalie $\displaystyle\lim_{x \to \infty} \frac{e^x}{x^2}$

**Passo 1:** Forma $\frac{\infty}{\infty}$. Aplique L'Hopital:
$$\lim_{x \to \infty} \frac{e^x}{2x}$$

**Passo 2:** Ainda e $\frac{\infty}{\infty}$. Aplique novamente:
$$\lim_{x \to \infty} \frac{e^x}{2} = \infty$$

**Resultado:** A exponencial cresce mais rapido que qualquer polinomio.

> [!WARNING]
> **Cuidado:** Antes de aplicar L'Hopital, **sempre** verifique se a forma e realmente $\frac{0}{0}$ ou $\frac{\infty}{\infty}$. Se nao for, L'Hopital **nao se aplica** e pode levar a respostas erradas.

---

## 8. Exemplos Adicionais de Continuidade

### Exemplo 1 — Descontinuidade Removivel

**Problema:** Analise a continuidade de:
$$f(x) = \frac{x^2 - 1}{x - 1} \text{ em } x = 1$$

**Analise:**
1. $f(1) = \frac{0}{0}$: **nao esta definido**
2. $f(x) = \frac{(x-1)(x+1)}{x-1} = x + 1$ para $x \neq 1$
3. $\lim_{x \to 1} f(x) = 2$

**Conclusao:** Existe uma descontinuidade **removivel** (um buraco) em $x = 1$. Se definirmos $f(1) = 2$, a funcao se torna continua.

---

### Exemplo 2 — Descontinuidade de Salto

**Problema:** Analise:
$$g(x) = \begin{cases} x + 1 & \text{se } x < 0 \\ x - 1 & \text{se } x \geq 0 \end{cases}$$

**Analise:**
1. Limite pela esquerda: $\lim_{x \to 0^-} g(x) = 0 + 1 = 1$
2. Limite pela direita: $\lim_{x \to 0^+} g(x) = 0 - 1 = -1$
3. Os limites laterais sao diferentes

**Conclusao:** Descontinuidade de **salto** em $x = 0$. O limite nao existe.

---

### Exemplo 3 — Descontinuidade Infinita

**Problema:** Analise $h(x) = \frac{1}{x^2}$ em $x = 0$.

**Analise:**
1. $h(0)$: **nao esta definido** (divisao por zero)
2. $\lim_{x \to 0^+} \frac{1}{x^2} = +\infty$
3. $\lim_{x \to 0^-} \frac{1}{x^2} = +\infty$

**Conclusao:** Descontinuidade **infinita** (assintota vertical) em $x = 0$.

---

### Exemplo 4 — Teorema do Valor Intermediario na Pratica

**Problema:** Prove que $f(x) = x^3 - x - 1$ tem uma raiz entre 1 e 2.

**Passo 1:** Avalie nos extremos do intervalo:
- $f(1) = 1 - 1 - 1 = -1 < 0$
- $f(2) = 8 - 2 - 1 = 5 > 0$

**Passo 2:** $f(x)$ e continua (polinomio) e $f(1) < 0 < f(2)$.

**Passo 3:** Pelo Teorema do Valor Intermediario, existe $c \in (1,2)$ tal que $f(c) = 0$.

> [!NOTE]
> O TVI nao diz onde esta a raiz, apenas que ela **existe**. Para encontrá-la numericamente, use o metodo da bissecao.

---

## 9. Erros Comuns em Limites e Continuidade

> [!WARNING]
> **Erro 1: Substituir diretamente em formas indeterminadas**
>
> Se $\frac{f(a)}{g(a)} = \frac{0}{0}$, **nao** conclua que o limite e 0 ou nao existe. Precisamos usar fatoracao, racionalizacao, L'Hopital ou outra tecnica.

> [!WARNING]
> **Erro 2: Confundir limite com valor da funcao**
>
> $\displaystyle\lim_{x \to a} f(x)$ nao depende de $f(a)$. O limite descreve o comportamento **perto** de $a$, nao **em** $a$.

> [!WARNING]
> **Erro 3: Aplicar L'Hopital sem verificar a forma indeterminada**
>
> L'Hopital so se aplica a $\frac{0}{0}$ ou $\frac{\infty}{\infty}$. Se o limite da $\frac{1}{0}$, por exemplo, L'Hopital nao se aplica — o resultado pode ser $\pm\infty$.

---

## 10. Exercicios Interativos Adicionais

### Arraste as Tecnicas de Limite

```dragdrop
{
  "question": "Arraste cada limite para a tecnica correta para resolve-lo:",
  "items": [
    "lim(x->2) (x^2-4)/(x-2)",
    "lim(x->0) sin(x)/x",
    "lim(x->0) (sqrt(x+4)-2)/x",
    "lim(x->0) (e^x-1)/x",
    "lim(x->inf) ln(x)/x"
  ],
  "explanation": "Fatoracao remove fatores comuns, racionalizacao remove radicais, limites trigonometricos usam sin(x)/x -> 1, e L'Hopital resolve 0/0 ou inf/inf.",
  "correctOrder": [
    "lim(x->2) (x^2-4)/(x-2)",
    "lim(x->0) sin(x)/x",
    "lim(x->0) (sqrt(x+4)-2)/x",
    "lim(x->0) (e^x-1)/x",
    "lim(x->inf) ln(x)/x"
  ]
}
```

### Preencha os Espacos: Conceitos de Continuidade

```fillblank
{
  "question": "Uma funcao f e continua em x = a se tres condicoes sao satisfeitas: (1) f(a) esta _____, (2) o limite existe, e (3) o limite e igual a f(a).",
  "template": "Uma funcao f e continua em x = a se tres condicoes sao satisfeitas: (1) f(a) esta {{1}}__, (2) o limite existe, e (3) o limite e igual a f(a).",
  "answers": {
    "1": "definido"
  },
  "explanation": "A primeira condicao de continuidade e que f(a) deve existir — a funcao nao pode ter buraco ou ser indefinida em a."
}
```

```fillblank
{
  "question": "Se os limites laterais sao diferentes, o limite _____ existe.",
  "template": "Se os limites laterais sao diferentes, o limite {{1}}__ existe.",
  "answers": {
    "1": "nao"
  },
  "explanation": "O limite existe se e somente se o limite pela esquerda e igual ao limite pela direita."
}
```

---

## Exemplos Passo a Passo: Tecnicas de Avaliacao de Limites

### Exemplo 1 — Racionalizacao: $\displaystyle\lim_{x \to 0} \frac{\sqrt{x+4} - 2}{x}$

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{\sqrt{x+4} - 2}{x}$

**Passo 1:** Substituicao direta produz $\frac{0}{0}$ (indeterminado). Precisamos racionalizar.

**Passo 2:** Multiplique numerador e denominador pelo conjugado do numerador:
$$\frac{\sqrt{x+4} - 2}{x} \cdot \frac{\sqrt{x+4} + 2}{\sqrt{x+4} + 2}$$

**Passo 3:** No numerador, aplique $(a-b)(a+b) = a^2 - b^2$:
$$\frac{(x+4) - 4}{x(\sqrt{x+4} + 2)} = \frac{x}{x(\sqrt{x+4} + 2)}$$

**Passo 4:** Simplifique o $x$ (valido pois $x \neq 0$ no limite):
$$\frac{1}{\sqrt{x+4} + 2}$$

**Passo 5:** Avalie o limite por substituicao:
$$\lim_{x \to 0} \frac{1}{\sqrt{x+4} + 2} = \frac{1}{\sqrt{4} + 2} = \frac{1}{4}$$

> [!NOTE]
> Racionalizacao e a tecnica ideal quando radicais causam a forma indeterminada $\frac{0}{0}$. O conjugado remove o radical do numerador.

---

### Exemplo 2 — Fatoracao: $\displaystyle\lim_{x \to 3} \frac{x^2 - 9}{x - 3}$

**Problema:** Avalie $\displaystyle\lim_{x \to 3} \frac{x^2 - 9}{x - 3}$

**Passo 1:** Substituicao direta: $\frac{3^2 - 9}{3 - 3} = \frac{0}{0}$ (indeterminado).

**Passo 2:** Fatore o numerador (diferenca de quadrados):
$$x^2 - 9 = (x-3)(x+3)$$

**Passo 3:** Simplifique o fator comum:
$$\frac{(x-3)(x+3)}{x-3} = x + 3 \quad (\text{para } x \neq 3)$$

**Passo 4:** Avalie o limite:
$$\lim_{x \to 3} (x + 3) = 3 + 3 = 6$$

> [!WARNING]
> **Erro comum:** Nao cancele o fator $(x-3)$ e depois substitua $x = 3$ diretamente na expressao original. Primeiro simplifique, **depois** avalie o limite.

---

### Exemplo 3 — Limite Trigonometrico: $\displaystyle\lim_{x \to 0} \frac{\sin x}{x}$

**Problema:** Avalie $\displaystyle\lim_{x \to 0} \frac{\sin x}{x}$

Este e um dos limites mais importantes do calculo. Ele estabelece que, para $x$ pequeno (em radianos), $\sin(x) \approx x$.

**Metodo geometrico (intuicao):**

Para $x$ pequeno e positivo (em radianos):
- O arco de comprimento $x$ no circulo unitario
- O seno de $x$ (altura do triangulo retangulo)
- A tangente de $x$ (altura do triangulo formado pela tangente)

Geometricamente: $\sin(x) < x < \tan(x)$ para $0 < x < \frac{\pi}{2}$.

Dividindo por $\sin(x)$:
$$1 < \frac{x}{\sin(x)} < \frac{1}{\cos(x)}$$

Invertendo:
$$\cos(x) < \frac{\sin(x)}{x} < 1$$

Quando $x \to 0$, $\cos(x) \to 1$, entao pelo Teorema do Confinamento:
$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$

> [!NOTE]
> **Limites trigonometricos fundamentais para memorizar:**
> - $\displaystyle\lim_{x \to 0} \frac{\sin x}{x} = 1$
> - $\displaystyle\lim_{x \to 0} \frac{1 - \cos x}{x^2} = \frac{1}{2}$
> - $\displaystyle\lim_{x \to 0} \frac{\tan x}{x} = 1$

---

## Exemplo Passo a Passo: Verificacao de Continuidade

### Funcao Definida por Partes

**Problema:** Verifique se a funcao abaixo e continua em $x = 2$:
$$f(x) = \begin{cases} x^2 & \text{se } x < 2 \ 6 & \text{se } x = 2 \ 2x + 1 & \text{se } x > 2 \end{cases}$$

**Passo 1:** Verifique se $f(2)$ esta definido.
$$f(2) = 6 \quad \checkmark$$

**Passo 2:** Calcule o limite pela esquerda ($x \to 2^-$):
$$\lim_{x \to 2^-} f(x) = \lim_{x \to 2^-} x^2 = 2^2 = 4$$

**Passo 3:** Calcule o limite pela direita ($x \to 2^+$):
$$\lim_{x \to 2^+} f(x) = \lim_{x \to 2^+} (2x + 1) = 2(2) + 1 = 5$$

**Passo 4:** Compare os limites laterais:
$$\lim_{x \to 2^-} f(x) = 4 \neq 5 = \lim_{x \to 2^+} f(x)$$

Os limites laterais sao diferentes, entao $\lim_{x \to 2} f(x)$ **nao existe**.

**Conclusao:** A funcao $f(x)$ e **descontinua** em $x = 2$ (descontinuidade de salto).

> [!NOTE]
> Para que uma funcao seja continua em um ponto, **todas** as tres condicoes devem ser satisfeitas: (1) $f(a)$ definido, (2) o limite existe, e (3) o limite e igual a $f(a)$. Aqui, a condicao (2) falha.

---

## Exercicios Adicionais

```fillblank
{
  "question": "Para racionalizar uma expressao com radical no numerador, multiplicamos numerador e denominador pelo _____ do numerador.",
  "template": "Para racionalizar uma expressao com radical no numerador, multiplicamos numerador e denominador pelo {{1}}__ do numerador.",
  "answers": {
    "1": "conjugado"
  },
  "explanation": "O conjugado de $\\sqrt{a} - b$ e $\\sqrt{a} + b$. A multiplicacao $(\\sqrt{a}-b)(\\sqrt{a}+b) = a - b^2$ elimina o radical."
}
```

```fillblank
{
  "question": "O limite fundamental de trigonometria e: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = $ _____.",
  "template": "O limite fundamental de trigonometria e: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = $ {{1}}__.",
  "answers": {
    "1": "1"
  },
  "explanation": "Este e um dos limites mais importantes do calculo: para $x$ pequeno (em radianos), $\\sin(x) \\approx x$."
}
```

---


## Practice Questions

```question
{
  "id": "math-foundations-q86",
  "type": "multiple-choice",
  "question": "Encontre: lim(x→2) (x² - 4)/(x - 2)",
  "options": [
    "0",
    "2",
    "4",
    "Não existe"
  ],
  "correct": 2,
  "explanation": "Fatorando: (x-2)(x+2)/(x-2) = x+2 → 4 quando x→2."
}
```

```question
{
  "id": "math-foundations-q87",
  "type": "multiple-choice",
  "question": "lim(x→0) sin(x)/x existe?",
  "options": [
    "Não",
    "Sim, é 0",
    "Sim, é 1",
    "Sim, é ∞"
  ],
  "correct": 2,
  "explanation": "Este é um limite fundamental: lim(x→0) sin(x)/x = 1."
}
```

```question
{
  "id": "math-foundations-q88",
  "type": "multiple-choice",
  "question": "Onde f(x) = 1/x é descontínua?",
  "options": [
    "x = 1",
    "x = -1",
    "x = 0",
    "Em nenhum ponto"
  ],
  "correct": 2,
  "explanation": "1/x não está definida em x = 0, então é descontínua lá."
}
```

```question
{
  "id": "math-foundations-q89",
  "type": "multiple-choice",
  "question": "Como Madhava usou limites?",
  "options": [
    "Para medir distâncias",
    "Para derivar séries infinitas",
    "Para construir pirâmides",
    "Para navegação"
  ],
  "correct": 1,
  "explanation": "Madhava usou limites para descobrir séries para π, seno e cosseno."
}
```

```question
{
  "id": "math-foundations-q90",
  "type": "multiple-choice",
  "question": "Explique o Teorema do Valor Intermediário em termos simples.",
  "options": [
    "Funções contínuas atingem todos os valores",
    "Se f(a) < k < f(b), existe c onde f(c) = k",
    "Funções são sempre crescentes",
    "Limites sempre existem"
  ],
  "correct": 1,
  "explanation": "Se uma função contínua passa de um valor para outro, ela atingirá todos os valores intermediários."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Limites descrevem comportamento近似
- Limites laterais devem ser iguais para o limite existir
- Continuidade significa "sem saltos ou buracos"
- Teorema do Valor Intermediário é intuitivo mas poderoso
- Limites são a base de derivadas e integrais
