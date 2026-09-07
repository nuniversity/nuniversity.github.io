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
```text

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
```text

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
```text

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
```text

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
