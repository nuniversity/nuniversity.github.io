---
title: "Trigonometria"
description: "Compreenda as razões trigonométricas, o círculo unitário e aplicações na navegação, arquitetura e fenômenos ondulatórios."
order: 13
duration: "60 minutes"
difficulty: "beginner"
---

# Trigonometria

**Gancho**: "A trigonometria é a matemática de triângulos e círculos. É essencial para navegação, arquitetura e compreensão de ondas."

---

## Triângulos e Além

Matemáticos indianos inventaram a trigonometria. Aryabhata (499 d.C.) definiu o jya (seno) e o usou para cálculos astronômicos. Eruditos islâmicos adicionaram tangente, cotangente e secante. A palavra 'sine' vem do árabe 'jiba' (corda), traduzida incorretamente como 'sinus' (baía).

> [!NOTE]
> A trigonometria era originalmente usada para navegação astronômica e medição de terras. Hoje, é essencial para engenharia e física.

---

## Objetivos de Aprendizagem

Ao final desta lição, você será capaz de:

- Compreender razões trigonométricas
- Aplicar trigonometria a problemas reais
- Usar o círculo unitário
- Compreender as origens multiculturais

---

## 1. Trigonometria de Triângulos Retângulos

### Seno, Cosseno e Tangente

Em um triângulo retângulo:

$$
\sin(\theta) = \frac{\text{oposto}}{\text{hipotenusa}}
$$

$$
\cos(\theta) = \frac{\text{adjacente}}{\text{hipotenusa}}
$$

$$
\tan(\theta) = \frac{\text{oposto}}{\text{adjacente}} = \frac{\sin(\theta)}{\cos(\theta)}
$$

### Desenvolvimento Histórico

| Época | Cultura | Contribuição |
|-------|---------|--------------|
| 500 d.C. | Índia | jya (seno) |
| 800 d.C. | Islã | Tangente, cotangente |
| 1400 d.C. | Europa | Notação moderna |

### Aplicações

- **Navegação:** Calcular posições
- **Arquitetura:** Calcular alturas e distâncias
- **Astronomia:** Medir distâncias estelares

---

## 2. O Círculo Unitário

### Medida em Radianos

**Radiano:** Ângulo que subtende um arco igual ao raio

$$
180^\circ = \pi \text{ radianos}
$$

$$
360^\circ = 2\pi \text{ radianos}
$$

### Funções Trigonométricas como Coordenadas

No círculo unitário (raio 1):
- **sen(θ)** = coordenada y
- **cos(θ)** = coordenada x

### Comportamento Periódico

As funções trigonométricas são periódicas:
- sen(θ + 2π) = sen(θ)
- cos(θ + 2π) = cos(θ)

---

## 3. Aplicações

### Navegação e Agrimensura

**Triangulação:** Medir distância entre dois pontos conhecidos
**GPS:** Usa trigonometria para calcular posições

### Arquitetura

**Cálculo de alturas:** Usar tangente para medir prédios
**Distribuição de peso:** Triângulos são estruturas estáveis

### Fenômenos Ondulatórios

**Som:** Ondas sonoras são descritas por funções seno
**Luz:** Ondas eletromagnéticas
**Marés:** Movimentos periódicos

---

## 4. Exercícios Interativos

### Explorador de Triângulo

```matching
{
  "question": "Em um triângulo retângulo com lados 3, 4, 5, encontre:",
  "pairs": [
    {"left": "sen do menor ângulo", "right": "3/5 = 0.6"},
    {"left": "cos do menor ângulo", "right": "4/5 = 0.8"},
    {"left": "tan do menor ângulo", "right": "3/4 = 0.75"}
  ],
  "explanation": "O menor ângulo está oposto ao menor lado (3)."
}
```

### Visualizador do Círculo Unitário

```matching
{
  "question": "Converta graus para radianos:",
  "pairs": [
    {"left": "45°", "right": "π/4"},
    {"left": "90°", "right": "π/2"},
    {"left": "180°", "right": "π"}
  ],
  "explanation": "Para converter, multiplique por π/180."
}
```

### Trig do Mundo Real

```matching
{
  "question": "Resolva problemas práticos:",
  "pairs": [
    {"left": "Escada 5m em 60°", "right": "Altura = 5 × sen(60°) ≈ 4.33m"},
    {"left": "Sombra 10m, sol 45°", "right": "Altura = 10 × tan(45°) = 10m"},
    {"left": "Barco 30km a 30° N", "right": "Norte = 30 × sen(30°) = 15km"}
  ],
  "explanation": "Trigonometria resolve muitos problemas de medição do mundo real."
}
```

---

## Aplicação no Mundo Real

### Navegação, Música e Engenharia

**Navegação:**
- GPS usa trigonometria
- Navegação astronômica

**Música:**
- Ondas sonoras são funções seno
- Harmônicos são múltiplos de frequência

**Engenharia:**
- Análise de Fourier
- Sinais elétricos

---

## 5. Tabela de Ângulos Especiais

A memorização dos valores trigonométricos para 30°, 45° e 60° é essencial. Aqui está a tabela completa:

### Tabela de Valores

| Ângulo | Graus | Radianos | sen(θ) | cos(θ) | tan(θ) |
|:------:|:-----:|:--------:|:------:|:------:|:------:|
| 0° | 0° | 0 | 0 | 1 | 0 |
| 30° | 30° | π/6 | 1/2 | √3/2 | √3/3 |
| 45° | 45° | π/4 | √2/2 | √2/2 | 1 |
| 60° | 60° | π/3 | √3/2 | 1/2 | √3 |
| 90° | 90° | π/2 | 1 | 0 | indefinido |

### Como Derivar os Valores

**Para 45°-45°-90° (triângulo isósceles):**
- Lados: 1, 1, √2 (pitágoras: 1² + 1² = 2)
- sen(45°) = 1/√2 = √2/2
- cos(45°) = 1/√2 = √2/2
- tan(45°) = 1/1 = 1

**Para 30°-60°-90° (meta de triângulo equilátero):**
- Comece com triângulo equilátero de lado 2
- Ao dividir pela metade: lados 1, √3, 2
- sen(30°) = 1/2 (oposto/hipotenusa)
- cos(30°) = √3/2 (adjacente/hipotenusa)
- tan(30°) = 1/√3 = √3/3
- sen(60°) = √3/2
- cos(60°) = 1/2
- tan(60°) = √3

> [!NOTE]
> Dica para memorizar: sen(θ) cresce com θ (de 0 a 1), cos(θ) diminui (de 1 a 0). A soma dos ângulos complementares: sen(θ) = cos(90° - θ).

---

## 6. O Círculo Unitário — Explicação Detalhada

### Construção do Círculo Unitário

O círculo unitário é um círculo de raio 1 centrado na origem (0, 0). Qualquer ponto neste círculo pode ser descrito como:

$$
(\cos\theta, \sin\theta)
$$

onde θ é o ângulo medido a partir do eixo x positivo.

### Pontos Famosos no Círculo Unitário

```
                    90° (π/2)
                      |
                      | (0, 1)
                      |
    180° (π) ---------+--------- 0° (0 rad)
    (-1, 0)           |           (1, 0)
                      |
                      | (0, -1)
                      |
                    270° (3π/2)
```

**Quadrante I (0° a 90°):** sen e cos são positivos
- 30°: (√3/2, 1/2)
- 45°: (√2/2, √2/2)
- 60°: (1/2, √3/2)

**Quadrante II (90° a 180°):** sen positivo, cos negativo
- 120°: (-1/2, √3/2)
- 135°: (-√2/2, √2/2)
- 150°: (-√3/2, 1/2)

**Quadrante III (180° a 270°):** sen e cos são negativos
- 210°: (-√3/2, -1/2)
- 225°: (-√2/2, -√2/2)
- 240°: (-1/2, -√3/2)

**Quadrante IV (270° a 360°):** sen negativo, cos positivo
- 300°: (1/2, -√3/2)
- 315°: (√2/2, -√2/2)
- 330°: (√3/2, -1/2)

### Mnemônico "All Students Take Calculus"

| Quadrante | Ângulos | sen | cos | tan |
|:---------:|:-------:|:---:|:---:|:---:|
| I | 0°–90° | + | + | + |
| II | 90°–180° | + | - | - |
| III | 180°–270° | - | - | + |
| IV | 270°–360° | - | + | - |

---

## 7. Identidade Pitagórica — sin²θ + cos²θ = 1

### Prova

No círculo unitário, o ponto (cos θ, sen θ) está na circunferência x² + y² = 1. Substituindo:

$$
(\cos\theta)^2 + (\sin\theta)^2 = 1
$$

$$
\sin^2\theta + \cos^2\theta = 1
$$

### Exemplos de Uso

**Exemplo 1:** Se sen(θ) = 3/5 e θ está no quadrante I, encontre cos(θ).
- sin²θ + cos²θ = 1
- (3/5)² + cos²θ = 1
- 9/25 + cos²θ = 1
- cos²θ = 16/25
- cos(θ) = 4/5 (positivo porque quadrante I)

**Exemplo 2:** Se cos(θ) = -5/13 e θ está no quadrante II, encontre sen(θ).
- sin²θ + (-5/13)² = 1
- sin²θ + 25/169 = 1
- sin²θ = 144/169
- sen(θ) = 12/13 (positivo porque quadrante II)

**Exemplo 3:** Simplifique tan²θ + 1.
- tan²θ + 1 = sin²θ/cos²θ + 1 = (sin²θ + cos²θ)/cos²θ = 1/cos²θ = sec²θ

> [!WARNING]
> Erro comum: sin²θ significa (sen θ)², NÃO sen(θ²). Não confunda a notação!

---

## 8. Lei dos Senos e Lei dos Cossenos

### Lei dos Senos

Para qualquer triângulo com lados a, b, c e ângulos opostos A, B, C:

$$
\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}
$$

**Quando usar:** Quando conhecemos dois lados e um ângulo oposto, ou dois ângulos e um lado.

**Exemplo:** Em um triângulo, a = 10, A = 30°, B = 45°. Encontre b.
- a/sen A = b/sen B
- 10/sen(30°) = b/sen(45°)
- 10/(1/2) = b/(√2/2)
- 20 = b × 2/√2
- 20 = b√2
- b = 20/√2 = **10√2 ≈ 14.14**

### Lei dos Cossenos

Para qualquer triângulo:

$$
c^2 = a^2 + b^2 - 2ab\cos C
$$

**Quando usar:** Quando conhecemos dois lados e o ângulo entre eles (SAS), ou três lados (SSS).

**Exemplo 1:** Em um triângulo, a = 7, b = 10, C = 60°. Encontre c.
- c² = 7² + 10² - 2(7)(10)cos(60°)
- c² = 49 + 100 - 140 × (1/2)
- c² = 149 - 70
- c² = 79
- c = **√79 ≈ 8.89**

**Exemplo 2 (distância entre dois pontos):**
Dois navios partem do mesmo porto. Navio A viaja 50 km a leste, Navio B viaja 30 km a nordeste (45°). Qual a distância entre eles?
- a = 50, b = 30, C = 45°
- c² = 50² + 30² - 2(50)(30)cos(45°)
- c² = 2500 + 900 - 3000 × (√2/2)
- c² = 3400 - 2121.32
- c² = 1278.68
- c ≈ **35.76 km**

> [!WARNING]
> A Lei dos Cossenos é uma generalização do Teorema de Pitágoras. Quando C = 90°, cos(90°) = 0, e a fórmula se reduz a c² = a² + b².

---

## 9. Trigonometria — Exercícios Interativos

### Valores Trigonométricos

```fillblank
{
  "question": "Complete os valores: sen(30°) = ?, cos(45°) = ?, tan(60°) = ?",
  "template": "Complete os valores: sen(30°) = {{1}}, cos(45°) = {{2}}, tan(60°) = {{3}}",
  "answers": {
    "1": "1/2",
    "2": "sqrt(2)/2",
    "3": "sqrt(3)"
  },
  "explanation": ""
}
```

```fillblank
{
  "question": "Se sen(θ) = 5/13 e θ está no quadrante I, então cos(θ) = ? e tan(θ) = ?",
  "template": "Se sen(θ) = 5/13 e θ está no quadrante I, então cos(θ) = {{1}} e tan(θ) = {{2}}",
  "answers": {
    "1": "12/13",
    "2": "5/12"
  },
  "explanation": ""
}
```

### Lei dos Senos/Cossenos

```matching
{
  "question": "Escolha a lei correta para cada situação:",
  "pairs": [
    {"left": "Conhece lados a, b e ângulo C entre eles", "right": "Lei dos Cossenos: c² = a² + b² - 2ab·cos C"},
    {"left": "Conhece ângulos A, B e lado a", "right": "Lei dos Senos: a/sen A = b/sen B"},
    {"left": "Verifica se é triângulo retângulo (C=90°)", "right": "Lei dos Cossenos reduz a Pitágoras: c² = a² + b²"}
  ],
  "explanation": "A Lei dos Cossenos é ideal para SAS e SSS. A Lei dos Senos é ideal para AAS e ASA."
}
```

---

## Practice Questions

```question
{
  "id": "math-foundations-q66",
  "type": "multiple-choice",
  "question": "Em um triângulo 3-4-5, qual é o seno do menor ângulo?",
  "options": [
    "3/5",
    "4/5",
    "5/3",
    "5/4"
  ],
  "correct": 0,
  "explanation": "sen = oposto/hipotenusa = 3/5."
}
```

```question
{
  "id": "math-foundations-q67",
  "type": "multiple-choice",
  "question": "Converta 45° para radianos.",
  "options": [
    "π/2",
    "π/4",
    "π",
    "2π"
  ],
  "correct": 1,
  "explanation": "45° × π/180° = π/4."
}
```

```question
{
  "id": "math-foundations-q68",
  "type": "multiple-choice",
  "question": "Uma escada de 10m apóia-se na parede em 60°. Que altura atinge?",
  "options": [
    "5m",
    "8.66m",
    "10m",
    "11.55m"
  ],
  "correct": 1,
  "explanation": "Altura = 10 × sen(60°) = 10 × (√3/2) ≈ 8.66m."
}
```

```question
{
  "id": "math-foundations-q69",
  "type": "multiple-choice",
  "question": "Como matemáticos indianos usavam trigonometria?",
  "options": [
    "Apenas para geometria",
    "Para cálculos astronômicos",
    "Para contabilidade",
    "Para arte"
  ],
  "correct": 1,
  "explanation": "Aryabhata usou jya (seno) para calcular posições planetárias."
}
```

```question
{
  "id": "math-foundations-q70",
  "type": "multiple-choice",
  "question": "Por que a função seno é periódica?",
  "options": [
    "Porque repete a cada 90°",
    "Porque o círculo é simétrico",
    "Porque ondas são cíclicas",
    "Todas as anteriores"
  ],
  "correct": 3,
  "explanation": "A periodicidade vem da natureza cíclica do círculo e dos fenômenos ondulatórios."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- sen, cos, tan são razões de lados em triângulos retângulos
- O círculo unitário mostra funções trigonométricas como coordenadas
- Radianos são a unidade natural para ângulos
- Trigonometria é essencial para navegação e engenharia
- A trigonometria foi inventada na Índia e expandida no mundo islâmico
