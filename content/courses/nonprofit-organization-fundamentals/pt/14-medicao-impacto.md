---
title: "Medição de Impacto em ONGs"
description: "Curso aprofundado sobre medição e gestão de impacto no terceiro setor brasileiro: cadeia de resultados e o vocabulário exato (produto × resultado × impacto), Teoria da Mudança montada do zero, MROSC artigo por artigo (incluído o art. 56 revogado), frameworks internacionais (ToC, IRIS+, GRI, IMP, OCDE-DAC e SROI), estado da prática no país com dados e fontes, linha de base × meta com aritmética, contribuição × atribuição em diferença-em-diferenças, SROI calculado passo a passo com ajustes e sensibilidade, painel de KPIs com fonte, frequência e responsável, matriz de maturidade, tabela de erros comuns × correção e questões práticas comentadas."
order: 14
difficulty: "intermediate"
duration: "120 min"
---
# Medição de Impacto em ONGs

Medir impacto é transformar a promessa da missão em evidência verificável. Enquanto a prestação de contas prova que o dinheiro foi gasto conforme o plano, a evidência de impacto prova que a vida das pessoas mudou **por causa da intervenção** — e é essa segunda prova que financiadores, empresas e doadores individuais estão passando a exigir. A leitura do IDIS publicada em 09/12/2025 resume o movimento: monitoramento e avaliação integrados à gestão deixam de ser exigência burocrática e viram **alicerce de transparência, confiança e sustentabilidade**, em um ciclo virtuoso descrito pela própria pesquisa:

```text
┌───────────────────────────────────────────────────────────────────────┐
│ CICLO VIRTUOSO DA M&A INTEGRADA À GESTÃO (IDIS, 09/12/2025)          │
│                                                                       │
│   DADOS CLAROS ──► TRANSPARÊNCIA ──► CREDIBILIDADE                    │
│        ▲                                        │                     │
│        │                                        ▼                     │
│   MAIS FINANCIADORES ◄── CONFIANÇA ◄── MELHOR GESTÃO                 │
│        │                                                              │
│        └──► SUSTENTABILIDADE E IMPACTO AMPLIADO ──► novos dados       │
└───────────────────────────────────────────────────────────────────────┘
```

Esta lição percorre, nesta ordem: o vocabulário que evita os erros mais caros do setor; o marco legal brasileiro (MROSC), incluído o dispositivo de remanejamento que **já não existe mais**; os frameworks internacionais e o que cada um **não** resolve; o estado da prática no Brasil com números e fontes; o desenho do sistema de medição do mais barato ao mais caro; a aritmética de linha de base × meta e de contribuição × atribuição; o SROI calculado com números; um painel de KPIs pronto para copiar; a matriz de maturidade; a tabela de erros × correção; e as questões práticas.

> [!NOTE]
> **A frase que define a disciplina:** só um estudo de impacto — com desenho que permite **atribuição causal** — autoriza a dizer "graças ao nosso programa". Recibo, relatório financeiro e certidão de pagamento comprovam **conformidade**, não **mudança**. O setor brasileiro erra ao tratar recibo como resultado.

> [!NOTE]
> **Como usar esta lição.** Cada seção termina com algo aplicável no mês seguinte: uma fórmula, um parâmetro de plano de trabalho, uma coluna de painel ou uma pergunta de escuta. Se você tiver de escolher um único ponto de partida, comece pela **linha de base** (Seção 5.5) — sem ela, nenhum outro número é defensável.

---

## 1. Vocabulário: a Cadeia de Resultados e o Que Cada Termo Prova

### 1.1 A cadeia de resultados (modelo lógico)

Toda medição de impacto séria começa por separar os cinco níveis da cadeia. Confundir produto com resultado é o erro mais caro do setor — ele faz a ONG entregar relatórios bonitos que não sustentam nenhuma tese de impacto.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ CADEIA DE RESULTADOS (MODELO LÓGICO / RESULTS CHAIN)                │
├─────────────────────────────────────────────────────────────────────┤
│ 1. INSUMOS        recursos que entram                              │
│    ex.: R$ 480 mil · 12 educadores · parceria com a rede municipal  │
│         │                                                          │
│         ▼                                                          │
│ 2. ATIVIDADES     o que a ONG efetivamente faz                     │
│    ex.: 96 oficinas · 1.440 horas · 120 mentorias/mês              │
│         │                                                          │
│         ▼                                                          │
│ 3. PRODUTO        o que é entregue (resultado imediato)            │
│    ex.: 240 alunos concluintes · 92% de frequência                 │
│         │                                                          │
│         ▼                                                          │
│ 4. RESULTADO      mudança de médio prazo: comportamento/habilidade │
│    ex.: evasão de 12% → 9,6% · +38% de proficiência em leitura     │
│         │                                                          │
│         ▼                                                          │
│ 5. IMPACTO        mudança de longo prazo atribuível à intervenção  │
│    ex.: +22% de escolarização subsequente vs contragrupo           │
│                                                                     │
│  CADA SETA É UMA SUPosição CAUSAL TESTÁVEL — ver Seção 3.1         │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Outputs, outcomes e impact: a tabela que resolve a maior parte dos mal-entendidos

No jargão internacional (e em vários editais), os três níveis finais têm nomes em inglês. Traduzidos com rigor, eles respondem a perguntas diferentes, provam coisas diferentes e atendem a públicos diferentes:

| Conceito | Nível na cadeia | Pergunta que responde | Exemplo concreto | O que **não** prova | Quem costuma pedir |
|---|---|---|---|---|---|
| **Output** (produto) | Produto / resultado imediato | O que entregamos? | 80 sessões apresentadas; 240 alunos concluintes; 92% de frequência; 300 mentorias realizadas | Nenhuma mudança no público | Poder público — MROSC, art. 64 |
| **Outcome** (resultado) | Resultado de médio prazo | O que mudou em quem participou? | ampliação de repertório; hábito de frequentar; renda de artistas locais; evasão de 12% → 9,6%; autonomia declarada | **Quem** causou a mudança (atribuição) | Doadores, empresas e financiadores |
| **Impact** (impacto) | Impacto de longo prazo | A mudança é atribuível à nossa intervenção? | +22% de escolarização subsequente **vs contragrupo**; permanência escolar sustentada por 5 anos | — (é o nível máximo) | Estudo, imprensa, decisão de escala |

**Exemplo 1 — o mesmo programa cultural em três frases.** Uma companhia de teatro financiada por edital pode escrever: (i) *"apresentamos 80 sessões para 12 mil pessoas"* → **output**; (ii) *"62% do público relatou ampliação de repertório e 45% voltou a frequentar atividades culturais ao menos uma vez por mês"* → **outcome**; (iii) *"a programação gratuita expandida respondeu por 9 pontos percentuais a mais de frequência cultural no distrito, comparado a um distrito semelhante sem a programação"* → **impacto**, porque só a frase (iii) traz comparação capaz de sustentar atribuição. Apenas a segunda frase sustenta tese de impacto; a primeira, isolada, sustenta apenas execução.

> [!WARNING]
> **Confundir output com impacto é o erro que mais aparece em prestação de contas e em site institucional.** "240 alunos concluintes" é produto; "240 alunos mudaram de vida" é impacto — e a segunda frase, sem desenho de avaliação, é uma afirmação **não demonstrada**. Regra de bolso: se a frase não traz comparação (com meta, com linha de base ou com grupo externo), ela descreve **entrega**, não **mudança**.

### 1.3 Taxonomia de indicadores com exemplos (programa de educação)

| Nível | Pergunta | Exemplo | Quem pede | Frequência |
|---|---|---|---|---|
| Insumo | Quanto entrou? | R$ 480 mil; 12 educadores | Financiador | Anual |
| Atividade | O que fizemos? | 96 oficinas; 1.440h | MROSC (art. 66) | Mensal |
| **Produto** | O que entregamos? | **240 alunos concluintes; 92% de frequência** | MROSC (art. 64) | Por ciclo |
| **Resultado** | O que mudou neles? | **+38% de proficiência em leitura; evasão de 12% → 9,6%** | Doador/empresa | Semestral |
| **Impacto** | Mudança atribuível de longo prazo | **+22% de escolarização subsequente vs contragrupo** | Estudo/público | Pontual |

### 1.4 Monitoramento × avaliação × estudo de impacto

| Termo | Pergunta central | O que responde | O que prova |
|---|---|---|---|
| **Monitoramento** | Estamos entregando o que combinamos? | **Eficiência** e cumprimento de metas | Execução e progresso contínuos |
| **Avaliação** | A mudança aconteceu? | **Efetividade** e impacto | Juízo sobre mérito, relevância, eficiência, impacto e sustentabilidade |
| **Estudo de impacto** | A mudança é atribuível à nossa intervenção? | **Atribuição causal** | Grupo de comparação ou método equivalente — o único que justifica "graças ao nosso programa" |

Os seis critérios da **OCDE-DAC** (relevância, coerência, efetividade, eficiência, impacto e sustentabilidade) são o vocabulário padrão dessas avaliações externas — ver Seção 3.4.

- **🔢 Você sabia?** **90,7% dos profissionais consultados monitoram seus projetos, mas apenas 17,4% declaram fazer avaliação de impacto** (IDIS, 2018, com 86 profissionais de cerca de 80 organizações). Entre as organizações que monitoram *todos* os projetos, só **31,9%** avaliam impacto de todos. A assimetria não é de orçamento: é de desenho — o setor comprova execução, não mudança.

### 1.5 Quem pede o quê: a regra prática de negociação

| Interlocutor | O que ele precisa ver | Nível adequado da cadeia | O que não adianta entregar |
|---|---|---|---|
| Administração pública (MROSC) | Comprovação do alcance das metas | **Produto** + parâmetros do art. 22, IV | Relato narrativo sem fórmula |
| Doador corporativo ou filantrópico | Evidência de que a doação "faz a diferença" | **Resultado** com linha de base | Contagem de atendimentos |
| Investidor de impacto / relato ESG | Métricas padronizáveis e comparáveis | Resultado + **IRIS+/GRI** | Métrica inventada sem correspondência |
| Decisão de escala ou disputa de tese | Atribuição causal | **Estudo de impacto** | Pesquisa de satisfação |

> [!NOTE]
> **Implicação prática de quem financia:** peça **indicadores de produto** para a administração pública (MROSC), **indicadores de resultado** para doadores e empresas, e **estudo de impacto** apenas quando houver decisão de escala ou disputa de tese. Custo e tempo de um estudo causal só se pagam quando a decisão justifica.

---

## 2. Marco Legal Brasileiro: o MROSC Obriga a Pensar em Impacto

A **Lei nº 13.019/2014** (redação da Lei nº 13.204/2015) é a norma de referência de monitoramento e avaliação no terceiro setor brasileiro. Ela não usa a palavra "impacto" por acaso: ela escreve, em cinco pontos distintos, que a parceria precisa ser aferida — e aferição sem indicador não existe.

### 2.1 Os dispositivos que exigem aferição

> **Art. 22, IV:** o plano de trabalho deve conter a "definição dos parâmetros a serem utilizados para a aferição do cumprimento das metas" — a redação original exigia "indicadores, qualitativos e quantitativos".

> **Art. 58:** "A administração pública promoverá o **monitoramento e a avaliação** do cumprimento do objeto da parceria."

> **Art. 58, § 2º:** nas parcerias com vigência **superior a 1 ano**, a administração fará, sempre que possível, **pesquisa de satisfação com os beneficiários** e usará os resultados como subsídio na avaliação, na **reorientação e no ajuste das metas e atividades**.

> **Art. 59, § 1º, II:** o relatório técnico de M&A deve conter "análise das atividades realizadas, do cumprimento das metas e **do impacto do benefício social obtido** em razão da execução do objeto até o período, **com base nos indicadores estabelecidos e aprovados no plano de trabalho**".

> **Art. 64:** a prestação de contas deve permitir avaliar o andamento, com "descrição pormenorizada das atividades realizadas e a **comprovação do alcance das metas e dos resultados esperados**".

- **🔢 Você sabia?** O art. 58, § 2º, da Lei nº 13.019/2014 não manda apenas ouvir: manda **usar a escuta para reorientar e ajustar metas e atividades**. Ou seja, o ordenador de despesas tem **dever legal de corrigir rota com base no que os beneficiários dizem**. Parceria de 24 meses sem pesquisa de satisfação não é economia — é descumprimento de um comando expresso, sempre que possível executável.

### 2.2 Arts. 66 e 67: quem entrega o quê

- **Art. 66:** a entrega se divide em **Relatório de Execução do Objeto** (comparativo de metas propostas × resultados alcançados) e **Relatório de Execução Financeira** — dois relatórios, com funções distintas;
- **Art. 67:** o gestor emite **parecer técnico conclusivo** apoiado no monitoramento e avaliação;
- **Arts. 25 e 35-A:** em atuação em rede, a responsabilidade pelo M&A é **integralmente da OSC celebrante** — o M&A da rede é dela, e não se divide entre parceiros.

### 2.3 O art. 56 morreu: remanejamento de valores hoje é apostilamento

Este é o ponto em que material desatualizado continua circulando em apostilas e em modelos de plano de trabalho:

| Antes (texto revogado) | Hoje (norma vigente) |
|---|---|
| **Art. 56** da Lei nº 13.019/2014 permitia remanejar até **25%** do valor entre itens de despesa | **Revogado** pela Lei nº 13.204/2015 (art. 9º, II) |
| — | Federalmente vale o **Decreto nº 8.726/2016, art. 43**: ajuste por **apostilamento**, admitido **sem autorização prévia até 10% do valor global** (§ 4º, com redação do Decreto nº 11.948/2024) |
| "Posso remanejar 25%" | **Valores** são ajustados na forma do decreto; **metas mudam só por termo aditivo ou apostila** (art. 57) |

> [!IMPORTANT]
> **Flexibilidade de rubrica não é flexibilidade de meta — e o percentual de 25% não existe mais.** Dois erros distintos se acumulam aqui: (i) citar o art. 56 com 25% como se estivesse vigente (está **revogado**); (ii) tratar ajuste de valor como licença para recalcular entregas pelo caminho. Metas, indicadores e parâmetros de aferição do art. 22, IV mudam **só por termo aditivo ou apostila** (art. 57). Organizações que confundem os dois chegam à prestação de contas com resultado abaixo do parametrizado — e glosa.

### 2.4 Checklist de M&A em parceria MROSC (o que a fiscalização vai pedir)

| Momento | Documento | Base legal |
|---|---|---|
| Antes de assinar | Plano com **parâmetros de aferição de metas** | art. 22, IV |
| Durante | Registro de execução (atividades, presença, comprovantes) | art. 58 |
| Durante (se > 1 ano) | **Pesquisa de satisfação com beneficiários** | art. 58, § 2º |
| Por exercício | Prestação de contas parcial/final | arts. 49 e 69 |
| Contas | Relatório de Execução do Objeto + Execução Financeira | art. 66 |
| Análise | Relatório técnico de **M&A** com "impacto do benefício social" | art. 59, § 1º, II |
| Parecer | Parecer técnico conclusivo do gestor, apoiado no M&A | art. 67 |

### 2.5 Exemplo 2 — um plano de trabalho que sobrevive à fiscalização

Objetivo pactuado com a Secretaria Municipal de Educação: **"reduzir a evasão em 20% em 24 meses"**. O art. 22, IV não aceita essa frase solta: ele exige **parâmetros**. Eis a versão parametrizada, com linha de base apurada **antes** da assinatura:

| Nível | Indicador | Fórmula / parâmetro (art. 22, IV) | Linha de base | Meta | Fonte |
|---|---|---|---|---|---|
| Insumo | Educadores dedicados | nº de educadores em dedicação exclusiva | — | 4 | Contratação |
| Atividade | Mentorias realizadas | nº de mentorias por mês | — | 120/mês | Lista de presença |
| Produto | Alunos acompanhados | alunos ativos no período | — | 300 | Sistema da OSC |
| Produto | Frequência | presenças ÷ inscrições × 100 | **78%** | **≥ 85%** | Diário escolar |
| **Resultado** | Evasão | evadidos ÷ matriculados × 100 | **12,0%** | **9,6%** em 24 meses | Censo da rede |
| **Resultado** | Satisfação | média da escala 0–10 | **7,4** | **≥ 8,0** | Pesquisa semestral |
| Impacto | Retenção escolar sustentada | série histórica da rede × contragrupo | — | avaliação com série histórica | Rede + estudo |

A diferença entre "reduzir em 20%" e a fórmula acima é de **0,4 ponto percentual** — e 0,4 p.p. sobre 1.200 alunos equivale a **5 alunos por ano** (cálculo completo na Seção 6.1). É exatamente essa diferença que decide se a meta foi cumprida ou não.

---

## 3. Frameworks Internacionais em Uso

### 3.1 Teoria da Mudança (ToC): o mapa de trás para frente

A Teoria da Mudança mapeia **de trás para frente** a mudança pretendida e o **nexo causal** que a produz. É o pré-requisito de qualquer indicador de resultado: sem nexo causal explícito, indicador vira número solto. É também a atividade mais barata do sistema inteiro de medição — uma **oficina de 1 dia** com equipe e beneficiários.

**Exemplo 3 — Teoria da Mudança completa da ONG fictícia "Rede Semear"** (redução da evasão escolar em dois distritos da rede municipal):

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ TEORIA DA MUDANÇA — REDE SEMEAR (fictícia)                              │
│ lê-se de baixo para cima; cada ▲ é uma suposição causal testável        │
├──────────────────────────────────────────────────────────────────────────┤
│ IMPACTO PRETENDIDO (5 a 10 anos)                                        │
│ "Jovens do território concluem o ensino médio e acessam renda digna"    │
│    ▲ suposição: concluir o ensino médio amplia o acesso a renda formal  │
│ CADERNO DE LONGO PRAZO                                                   │
│    renda formal · continuidade de estudos · menor desigualdade local     │
│    ▲ suposição: a família apoia a frequência quando é escutada          │
│ RESULTADOS DE MÉDIO PRAZO (12 a 24 meses)                               │
│    evasão de 12,0% → 9,6% · autonomia declarada · satisfação ≥ 8,0      │
│    ▲ suposição: mentorias resolvem a barreira quando ela é familiar/    │
│       escolar (e não estrutural, como transporte ou trabalho infantil)   │
│ RESULTADOS IMEDIATOS = PRODUTO                                          │
│    300 alunos acompanhados · 85% de frequência · 80% concluem a mentoria │
│    ▲ suposição: oferta regular de mentoria gera vínculo suficiente      │
│ ATIVIDADES                                                              │
│    120 mentorias/mês · oficinas com famílias · pactuação com 2 escolas  │
│    ▲ suposição: a rede municipal fornece dados de frequência em dia     │
│ INSUMOS                                                                 │
│    4 educadores · R$ 480 mil/ano · parceria com a rede municipal         │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 De onde vem cada indicador: a seta vira pergunta

| Seta da ToC (suposição) | Como testar | Indicador ou método que nasce dela |
|---|---|---|
| "A rede entrega dados de frequência em dia" | conferência mensal com a secretaria | % de escolas com dados atualizados até o dia 10 |
| "A mentoria gera vínculo" | taxa de permanência no programa | conclusão de mentoria ≥ 80% |
| "Mentorias resolvem a barreira familiar/escolar" | escuta qualitativa + comparação | grupos focais anuais + queda de evasão vs linha de base |
| "Família escutada apoia a frequência" | pesquisa com responsáveis | satisfação ≥ 8,0 e frequência ≥ 85% |
| "Concluir o ensino médio amplia renda" | estudo posterior | escolarização subsequente vs contragrupo |

Sem essa tabela, o painel de KPIs vira lista de desejos; com ela, cada número tem uma hipótese que justifica a coleta.

### 3.3 Comparativo dos frameworks

| Framework | Pergunta central | Saída | Melhor para | Limite |
|---|---|---|---|---|
| Teoria da Mudança | Por que deve funcionar? | Mapa de nexo causal | Desenho e negociação | Não mede |
| Modelo lógico / Cadeia de resultados | O que faremos até onde? | Tabela insumo → impacto | Editais MROSC | Superficial em causalidade |
| **IRIS+ / Core Metrics (GIIN)** | Qual métrica padronizada? | Catálogo de KPIs | Comparabilidade e investidores | Não explica o porquê |
| **IMP — 5 dimensões** | Quão bom é o impacto? | Perfil de impacto | Decisão de alocação | Requer dados robustos |
| **GRI 3 + Universal** | O que é material? | Relatório de sustentabilidade | Transparência institucional | Relato, não avaliação |
| **SROI (SVI)** | Vale a pena? | Índice R$ por R$ + narrativa | Captação e comunicação | Custo alto; risco de superestimativa |
| **OCDE-DAC** | Foi uma boa avaliação? | Juízo em 6 critérios | Avaliações externas | Pós-fato |

Resumo em uma frase: **ToC desenha, modelo lógico organiza, IRIS+ e GRI padronizam o relato, IMP qualifica, OCDE-DAC julga e SROI traduz em dinheiro** — nenhum deles substitui o outro, e nenhum mede sozinho.

### 3.4 Critérios OCDE-DAC

Os seis critérios são o vocabulário padrão de financiadores que encomendam avaliações externas: **relevância** (o problema abordado é o certo?), **coerência** (combina com outras ações?), **efetividade** (os objetivos foram alcançados?), **eficiência** (o custo foi proporcional ao resultado?), **impacto** (mudanças amplas, inclusive não intencionais?) e **sustentabilidade** (dura no tempo?). Um relatório que se diz "avaliação" sem passar por eles é, na prática, um relatório de execução.

### 3.5 IRIS+ (GIIN)

O **IRIS+** é o catálogo de métricas de desempenho de impacto do GIIN, organizado em **Core Metrics Sets** por tese (educação, clima, trabalho decente, entre outras) — útil quando o financiador pede métricas comparáveis entre investidores de impacto. O IRIS+ responde "qual métrica usar", não "por que essa métrica importa": ele é catálogo, não avaliação.

> [!NOTE]
> **Item não verificado nesta pesquisa:** a versão **IRIS+ v5.3c com 781 métricas** e a atualização dos Core Metrics Sets em **07/2025** aparecem em material secundário e **não foram confirmados na fonte primária**. Trate os números como **não conferidos** e confira em iris.ifc.org antes de citá-los em relatório ou em edital.

### 3.6 Impact Frontiers / IMP: as 5 dimensões do impacto

Sob curadoria da **Impact Frontiers**, o arcabouço do Impact Management Project organiza o perfil de impacto em **cinco dimensões** — nenhuma a menos, nenhuma a mais:

| # | Dimensão | Pergunta | Exemplo aplicado à Rede Semear |
|---|---|---|---|
| 1 | **What** (mudança) | Que mudança positiva ou negativa aconteceu? | evasão reduzida; autonomia declarada |
| 2 | **Who** (população) | Quem foi afetado e com que grau de privação? | jovens de 14 a 17 anos do 2º distrito, renda familiar ≤ 1 salário mínimo *per capita* |
| 3 | **How Much** (magnitude) | Quão grande e por quanto tempo? | 2,2 p.p. de queda por 24 meses |
| 4 | **Contribution** (atribuição) | Quanto da mudança a nossa intervenção causou? | ~91,7% estimado por diferença-em-diferenças (Seção 6.2) |
| 5 | **Risk** (risco) | Qual o risco de a mudança não acontecer (ou não durar)? | risco de interrupção da mentoria no ano letivo seguinte |

> [!WARNING]
> **São 5 dimensões, não 6.** A armadilha mais comum em provas e em relatórios é somar uma sexta dimensão (como "custo", "qualidade" ou "permanência"). What, Who, How Much, Contribution e Risk — cinco.

### 3.7 GRI: status verificado em 2026

O relato por **materialidade de impacto** segue o GRI. O **GRI 3: Temas Materiais (2021)** e os Universal Standards revisados em 2021 são a base. Status verificado nesta pesquisa:

- o **GSSB aprovou** os padrões **GRI 106/107** (01–02/06/2026) e **GRI 104/105** (16/07/2026), com **publicação postergada para 2027**;
- **Economic Impacts Phase 1 (GRI MF)** em aprovação final; **Phases 2–3 pausadas**;
- **Pollution Phase 1** em aprovação final;
- piloto setorial = **Food & Beverage**;
- **Work Programme 2026–2028** consultado até **27/03/2026** (comunidade local, impactos ambientais, digitalização).

> [!NOTE]
> **Dado não conferido:** a data exata de eficácia dos Universal Standards 2021 (01/01/2023) **não foi confirmada em nota oficial** nesta pesquisa — não cite a data sem checar em globalreporting.org. Lembre-se também do que o GRI **não** é: é **relato**, não avaliação — ele não demonstra atribuição causal.

### 3.8 SROI no Brasil: a referência técnica do IDIS

O **SROI (Social Return on Investment)** segue o protocolo da **Social Value International (SVI)**. No Brasil, a referência técnica é o **IDIS**: Paula Fabiani (CEO) foi a **1ª brasileira certificada** pela SVI e Daniel Barretti (M&A Manager do IDIS) tornou-se o **2º brasileiro** com o nível *Social Value Practitioner*, anunciado pela SVI em 22/05/2026.

- **🔢 Você sabia?** O **Impact Management Project** descreve **5 dimensões** de impacto, não 6 — e a governança do arcabouço passou para a **curadoria da Impact Frontiers**. Citações que ainda falam em "6 dimensões do IMP" ou no IMP como instituição permanente estão desatualizadas em duas frentes: no número e na governança.

---

## 4. Estado da Prática no Brasil

### 4.1 Monitorar é comum, avaliar é raro

A pesquisa do IDIS com **86 profissionais de ~80 organizações** (publicada em 2018) mostrou a assimetria central do setor:

| Indicador de maturidade | Valor | Fonte |
|---|---|---|
| Monitoram seus projetos | **90,7%** (65%: todos) | IDIS 2018, n=86 / ~80 OSCs |
| Fazem **avaliação de impacto** | **17,4%** | idem |
| Monitoram **e** avaliam impacto de todos os projetos | **31,9%** (entre as que monitoram tudo) | idem |
| Acreditam que M&A atrai recursos | **61,6%** (× 27,9% de opinião contrária) | idem |

> [!NOTE]
> **Como usar este dado com honestidade:** é uma amostra **pequena e não probabilística** — sirva-se dela como **indicador de assimetria monitoramento × avaliação**, nunca como estatística nacional. A leitura válida é uma só: o setor comprova execução, não mudança.

### 4.2 A demanda real do doador (Pesquisa Doação Brasil 2024)

| Comportamento do doador | Valor |
|---|---|
| Quer evidência de que a doação "pode fazer a diferença" | **89%** |
| Pesquisa antes de doar | **83%** (+8 p.p. vs 2022) |
| Desistiu após notícia ruim | **49%** |
| Acha que as ONGs deixam claro o uso do dinheiro | **33%** |
| Fidelização ao mesmo ano | **69% (2015) → 49% (2024)** |

- **🔢 Você sabia?** A **fidelização dos doadores caiu de 69% (2015) para 49% (2024)**, enquanto **83% pesquisam antes de doar** (+8 pontos percentuais frente a 2022) e **49% já desistiram após uma notícia ruim**. Só **33%** acham que as ONGs deixam claro o uso do dinheiro. A medição de impacto, aqui, não é exercício acadêmico: é peça de retenção de base.

### 4.3 Panorama de financiamento

| Indicador | Valor | Fonte |
|---|---|---|
| Repasse corporativo a OSCs | **76%** das empresas; mediana de **R$ 5 mi** | BISC 2025 (Comunitas) |
| Recursos restritos das ONGs | **68%** | CAF + IDIS 2025 ⚠️ |
| Projetos de SROI do IDIS em 2024 | **41** | IDIS, 30/04/2025 ⚠️ |
| Voluntariado empresarial com indicadores quantitativos | **95,12%** | CBVE 2025 ⚠️ |
| Fatia do ISP vinda de incentivos fiscais | **~15%** | Censo GIFE ⚠️ |

> [!NOTE]
> **Itens marcados com ⚠️ não foram conferidos na fonte primária:** os 68% de recursos restritos vêm da divulgação secundária do *Panorama das ONGs* (CAF + IDIS, Capítulo Brasil, World Giving Report 2025, 170 OSCs, mar–jun/2025) e a publicação original precisa ser localizada; os **41 projetos de SROI** são **divulgados pelo IDIS e não auditados**; o número **95,12%** do CBVE 2025 não foi rastreado à base original; os ~15% do Censo GIFE não foram conferidos. Trate todos como **não verificados** em apresentações externas.

### 4.4 Ferramentas e referências brasileiras

- **IDIS** — Hub de Avaliação de Impacto Social, com SROI, custo-benefício, Matriz de Transformação Social e trilhas de M&A (**41 projetos em 2024**, divulgados sem auditoria); já atendeu Instituto Ayrton Senna, Petrobras, Vale, Gerando Falcões, Chamex, Parceiros da Educação e Sesc;
- **Instituto Baccarelli** — estudo combinou ferramenta do **Insper**, dados secundários e pesquisa com beneficiários;
- **Fundação Itaú Social, IBGE Educação e IDIS** — indicadores de impacto e evidências do PISA no Brasil;
- **Gates Foundation** — glosário e taxonomia de indicadores de medição de impacto;
- **Thinking. Doing. Learning. together** (IDIS) — núcleo de apoio à monitorização e avaliação.

---

## 5. Desenho do Sistema de Medição (do Barato ao Caro)

### 5.1 Sequência recomendada

A ordem importa mais que a ferramenta: cada etapa só é defensável se a anterior existir. Pular a linha de base, por exemplo, inviabiliza qualquer comparação pré/pós posterior.

```text
 1. TEORIA DA MUDANÇA         oficina de 1 dia com equipe e beneficiários
             │
 2. MATRIZ DE INDICADORES     insumo · atividade · produto · resultado · impacto
             │
 3. BASELINE                  linha de base apurada ANTES da intervenção
             │
 4. COLETA ROTINEIRA          sistemas de informação + pesquisas
             │
 5. RELATÓRIOS POR CICLO      produto e resultado para financiadores
             │
 6. AVALIAÇÃO DE EFETIVIDADE  comparação simples (pré/pós, série histórica)
             │
 7. ESTUDO DE IMPACTO         só quando a decisão justificar o custo
```

### 5.2 Ficha de indicador (mínimo de 9 campos)

1. **Nome** do indicador;
2. **Definição operacional** (o que entra e o que não entra);
3. **Fórmula**;
4. **Tipo**: insumo / atividade / produto / resultado / impacto;
5. **Linha de base**;
6. **Meta** (curto e médio prazo);
7. **Fonte e método de coleta**;
8. **Frequência**;
9. **Responsável**;
10. **Desagregação**: gênero, raça, idade, território;
11. **Risco de viés/indesejado**.

Um indicador sem definição operacional é fonte eterna de discussão; um indicador sem responsável é um indicador que nunca é coletado.

### 5.3 Testes de qualidade do indicador

1. É **sensível à mudança** (detecta evolução real)?
2. É **não manipulável** pela própria equipe?
3. O **custo de coleta** é proporcional ao valor da informação?
4. **Não gera distorção de incentivo** — o caso clássico é contar "número de atendimentos", que estimula atendimentos rasos; troque por **taxa de conclusão + satisfação**.

### 5.4 Desenhos de avaliação, por rigor × custo

| Desenho | Rigor | Custo | Quando usar |
|---|---|---|---|
| Pesquisa de satisfação/expectativa | Baixo | Baixo | Rotina, art. 58, § 2º |
| Pré/pós sem grupo de comparação | Baixo-médio | Baixo | Comunicação interna |
| Séries temporais / comparação histórica | Médio | Médio | Programas com dados já existentes |
| Quase-experimental (diferenças em diferenças, regressão descontinuidade) | Alto | Alto | Decisão de escala, financiador exigente |
| Ensaio aleatorizado (RCT) | Máximo | Muito alto | Políticas replicáveis, doadores internacionais |
| Qualitativo profundo (entrevistas, grupos focais, etnografia) | Complementar | Médio | **Explicar** o porquê dos números; voz do beneficiário |

### 5.5 Exemplo 4 — a linha de base apurada em pesquisa piloto ANTES da assinatura

A Rede Semear contrata uma pesquisa piloto em **setembro**, antes da assinatura do termo de fomento. O recorte é explícito e a conta é auditável:

```text
LINHA DE BASE — REDE SEMEAR (pesquisa piloto, fictícia)
─────────────────────────────────────────────────────────────────
Recorte ..... 2 distritos da rede municipal, 6 escolas
Universo .... 1.200 alunos matriculados no ano anterior
Coleta ...... dados administrativos da rede + 312 entrevistas
              com responsáveis (consentimento e anonimato)

Evasão ...... 144 evadidos ÷ 1.200 matriculados = 0,120 = 12,0%
Frequência .. presenças ÷ inscrições = 78%
Satisfação .. média da escala 0–10 = 7,4 (n = 312)

Observação ... nenhuma intervenção foi iniciada até aqui:
               a linha de base é APURADA, não projetada.
```

Três decisões dessa ficha evitam anos de discussão: (i) o **universo é declarado** (1.200 alunos), então a fração é reproduzível; (ii) a **coleta é mista** (dado administrativo + escuta), então a satisfação não é opinião de quem está no evento; (iii) a linha de base foi apurada **antes** de qualquer atividade — depois que a mentoria começa, qualquer número novo é contaminado.

> [!IMPORTANT]
> **A linha de base é o que separa meta de ambição.** Sem ela, a meta vira opinião: "crescer 20%" não significa nada se não se sabe a partir de quanto. Para o art. 22, IV do MROSC, o parâmetro escrito no plano **precisa incluir a linha de base e a fórmula** — e, sempre que possível, ela deve ser apurada em **pesquisa piloto antes da assinatura**, quando ainda é possível redigir a meta com precisão.

---

## 6. Linha de Base × Meta e Contribuição × Atribuição

### 6.1 Exemplo 5 — "reduzir 20%": relativo ou absoluto?

O objetivo pactuado é **"reduzir a evasão em 20% em 24 meses"** com linha de base de **12,0%**. A frase, sozinha, admite duas contas — e elas não dão o mesmo resultado:

```text
HIPÓTESE A — redução RELATIVA de 20% sobre a linha de base
    12,0% × (1 − 0,20) = 12,0% × 0,80 = 9,6%     → META = 9,6%

HIPÓTESE B — redução ABSOLUTA de 2 pontos percentuais
    12,0% − 2,0 p.p. = 10,0%                      → META = 10,0%

DIFERENÇA ENTRE AS DUAS METAS (universo de 1.200 alunos)
    9,6% × 1.200 = 115,2 ≈ 115 evadidos
   10,0% × 1.200 = 120,0 ≈ 120 evadidos
    Δ = 4,8 ≈ 5 alunos por ano
```

Conclusão operacional: **5 alunos por ano separam o cumprimento da meta de sua violação** — e a escolha entre elas não pode ficar implícita. Por isso o art. 22, IV exige **parâmetros**, não slogans. A fórmula correta no plano de trabalho é: *"redução relativa de 20% sobre a linha de base de 12,0% apurada em pesquisa piloto, resultando em meta de 9,6% em 24 meses, medida semestralmente pelo indicador evadidos ÷ matriculados × 100"*.

> [!NOTE]
> **Redução relativa × absoluta é a armadilha silenciosa da prestação de contas.** Nenhum dos dois valores é "errado" em si; o que é errado é não escolher. Em relatório, a frase "cumprimos a meta de redução de evasão" sem a fórmula declarada é insustentável diante de uma fiscalização que leia o plano de trabalho.

### 6.2 Exemplo 6 — contribuição × atribuição, com a conta de diferença-em-diferenças

A evasão caiu de **12,0% para 9,6%** na escola atendida. Quanto disso é da Rede Semear? Duas linguagens, dois níveis de rigor:

```text
CONTRIBUIÇÃO (sem grupo de comparação)
    "Nossa mentoria contribuiu para a queda da evasão."
    Base: ToC + mecanismo evidenciado + escuta dos beneficiários.
    Frase aceita em relatório anual e em site institucional.

ATRIBUIÇÃO (com grupo de comparação)
    Escola A (com programa) ........ 12,0% → 9,6%  = queda de 2,4 p.p.
    Escola B (rede semelhante,
             sem programa) .......... 12,0% → 11,8% = queda de 0,2 p.p.
    ─────────────────────────────────────────────────────────────────
    Diferença-em-diferenças ........ 2,4 − 0,2 = 2,2 p.p. atribuíveis
    Parcela que ocorreria mesmo sem o programa = 0,2 p.p.
    Proporção atribuída = 2,2 ÷ 2,4 = 0,9167 ≈ 91,7%

    Frase permitida: "estimamos que 2,2 dos 2,4 pontos percentuais
    de queda decorrem do programa, frente a escola comparável."
```

Atribuição, aqui, continua sendo **estimada** — não é certeza. Mas ela é infinitamente mais defensável do que atribuir 100% da queda ao programa, que é exatamente o que a maioria dos relatórios faz sem dizer.

| Situação | Linguagem correta | Rigor exigido |
|---|---|---|
| Só produto e execução | "entregamos" | Registro documental |
| Produto + linha de base, sem comparação | "observamos mudança" / "contribuímos para" | Pré/pós simples |
| Comparação com meta histórica ou grupo externo | "estimamos que X p.p. decorrem do programa" | Quase-experimental |
| Grupo de comparação desenhado (ou método equivalente) | "graças ao nosso programa" | Estudo de impacto |

> [!WARNING]
> **Medir só satisfação e chamar de impacto é o segundo erro mais comum do setor.** Pesquisa de satisfação é **obrigatória** em parcerias superiores a 1 ano (art. 58, § 2º) e é insumo valioso de correção de rota — mas ela tem **custo baixo, rigor baixo e nenhum grupo de comparação**. Dizer "8,2 de satisfação prova nosso impacto" confunde opinião de quem participou com mudança atribuível. Use satisfação para **aprender**, não para **provar**.

### 6.3 Árvore de decisão: qual desenho de avaliação usar

```text
VOCÊ JÁ TEM LINHA DE BASE?
├── não ──► colete antes de qualquer comparação (Seção 5.5)
└── sim
      │
      A MUDANÇA É ATRIBUÍVEL AO PROGRAMA?
      ├── só temos produto ──► relatamos ENTREGA (art. 64)
      │
      ├── temos pré/pós, sem comparação
      │        ──► CONTRIBUIÇÃO: "observamos mudança"
      │
      ├── temos meta histórica ou grupo externo disponível
      │        ──► ATRIBUIÇÃO ESTIMADA: diferença-em-diferenças
      │            (Seção 6.2), com a conta publicada
      │
      └── a decisão exige rigor máximo (escala, tese, capital)
               ──► ESTUDO DE IMPACTO (RCT ou quase-experimental),
                   com verificação independente (princípio 7 do SVI)
```

A árvore tem uma regra: **o nível de rigor é escolhido pela decisão, não pelo orçamento disponível**. Se a decisão é pequena, um pré/pós honesto basta; se a decisão é grande, nenhum orçamento pequeno justifica fingir rigor.

---

## 7. SROI na Prática

### 7.1 As 7 etapas do protocolo da SVI

1. **Envolver stakeholders** — quem vive a mudança define o que medir;
2. **Mapear mudanças** — construir a Teoria da Mudança;
3. **Valorar o que importa** — provações por *willingness-to-pay*, escolha discreta e aproximações (*proxies*);
4. **Incluir apenas o material** — delimitar fronteiras com evidência de quem recebe;
5. **Não superestimar** — ajustar atribuição e o que já ocorreria de qualquer forma;
6. **Ser transparente** — mostrar base, premissas e limitações, e discutir com stakeholders;
7. **Verificar o resultado** — assessoria **independente** quando houver público externo ou decisão relevante.

### 7.2 Os 8 princípios do valor social (Social Value International)

| # | Princípio | Tradução operacional |
|---|---|---|
| 1 | **Involve stakeholders** | Eles definem o que medir e como |
| 2 | **Understand what changes** | Articular e evidenciar mudanças positivas/negativas, intencionais/não intencionais |
| 3 | **Value the things that matter** | Valorar segundo a preferência de quem vive a mudança |
| 4 | **Only include what is material** | Delimitar fronteiras com evidência dos stakeholders |
| 5 | **Do not overclaim** | Só atribuir o valor que a atividade realmente gerou |
| 6 | **Be transparent** | Mostrar base, premissas e discutir com stakeholders |
| 7 | **Verify the result** | Verificação; **assessoria independente** quando houver público externo/decisão relevante |
| 8 | **Be responsive** | Decisão tempestiva apoiada em contabilidade e relato adequados |

Os princípios **4, 5 e 7** são os três que sustentam o rigor do estudo: **só o material**, **não superestimar** e **verificar**.

### 7.3 Exemplo 7 — cálculo de SROI passo a passo (dados fictícios)

O exemplo abaixo é **integralmente fictício** e serve apenas para ilustrar o método — nenhum número deve ser citado como fato real:

```text
SROI — PROGRAMA FICTÍCIO "RAÍZES" (12 meses, dados inventados)
═══════════════════════════════════════════════════════════════════
ETAPA 1 — MAPEAR E VALORAR (ToC + provações com stakeholders)
  Renda familiar estável .... 300 famílias × R$ 1.500 = R$ 450.000
  Evasão evitada ............  60 alunos  × R$ 2.000 = R$ 120.000
  Sociabilidade relatada .... 240 pessoas × R$   300 = R$  72.000
  ─────────────────────────────────────────────────────────────────
  BENEFÍCIO BRUTO .................................... = R$ 642.000

ETAPA 2 — AJUSTES (princípios 4 e 5: material e não superestimar)
  (a) Atribuição −20% ....... 642.000 × 0,80 = R$ 513.600,00
  (b) Deadweight −10% ....... 513.600 × 0,90 = R$ 462.240,00
  (c) Divisão/durabilidade
        −15% ................ 462.240 × 0,85 = R$ 392.904,00
  (d) Risco −5% ............. 392.904 × 0,95 = R$ 373.258,80
  ─────────────────────────────────────────────────────────────────
  BENEFÍCIO AJUSTADO ................................. = R$ 373.258,80

ETAPA 3 — INVESTIMENTO TOTAL
  Pessoas (R$ 96.000) + estrutura/operacional (R$ 24.000)
  INVESTIMENTO ....................................... = R$ 120.000,00

ETAPA 4 — ÍNDICE
  SROI = 373.258,80 ÷ 120.000 = 3,11049...
  SROI = R$ 3,11 de benefício social por R$ 1 investido

COMPARAÇÃO COM CASOS REAIS (verificados)
  FLUPP (1º do Brasil) R$ 4,08 · Baccarelli R$ 3,49
  Amigos do Bem ........ R$ 6,45 (auditado pela EY)
═══════════════════════════════════════════════════════════════════
```

### 7.4 Sensibilidade: o que muda se a atribuição cair

O ajuste de atribuição é a alavanca mais sensível do cálculo — e é justamente o princípio 5 do SVI ("não superestimar") que manda mexer nele com honestidade:

| Cenário de atribuição | Cálculo | Benefício ajustado | SROI |
|---|---|---|---|
| Base: −20% | 642.000 × 0,80 × 0,90 × 0,85 × 0,95 | R$ 373.258,80 | **R$ 3,11** |
| Conservador: −30% | 642.000 × 0,70 × 0,90 × 0,85 × 0,95 | R$ 326.601,45 | **R$ 2,72** |

Ler a tabela ao contrário também é útil: **um SROI publicado sem a tabela de ajustes não é auditável** — o leitor não sabe se o número é rigoroso ou otimista. Transparência (princípio 6) é parte do resultado, não enfeite do relatório.

> [!NOTE]
> **SROI não é KPI de rotina.** É estudo pontual, caro e comunicacional — serve para captação, prestação de contas especial e decisão de escala. A rotina de gestão é outra: **painel de indicadores de produto e resultado** (Seção 8). Quem publica SROI todo mês não está fazendo SROI.

> [!NOTE]
> **Ética da escuta:** pesquisa com beneficiários exige **consentimento informado e anonimato**. A diretriz é da Social Value International e **não foi relida nesta rodada de pesquisa** — confirme os detalhes na fonte primária (socialvalueinternational.org) antes de aplicar questionários com marcadores identitários.

### 7.5 Cases brasileiros de SROI (verificados)

| Case | SROI (R$ gerado por R$ 1) | Período/observação | Fonte |
|---|---|---|---|
| **Fundação Lucia e Pelerson Penido (FLUPP)** — programa VIM, Roseira/SP | **R$ 4,08** | **1º SROI do Brasil**; crianças de 0–5 anos, famílias e professores | IDIS, 2015 |
| **Amigos do Bem** (sertão nordestino) | **R$ 6,45** | Impacto acumulado de **R$ 2,1 bi** (2012–2021); 150 mil pessoas em 300 povoados; auditoria EY | IDIS, case publicado 2022–2023 |
| **Instituto Baccarelli** — Núcleo Heliópolis | **R$ 3,49** | Dados de **2023**, estudo publicado em 2024; 4 mudanças qualitativas (cognição, oportunidades, socioemocional, relações) | IDIS/Insper, 2024 |

Leituras de cada case:

- **FLUPP (Roseira/SP):** 3 meses de campo, grupos focais com educadores, crianças e famílias, construção da Teoria da Mudança, indicadores e aproximações (*willingness-to-pay* e escolha discreta). Uma das mudanças valoradas foi a **melhora na sociabilidade** — relatada por **87%** dos participantes, com valor social atribuído de aproximadamente **R$ 227 mil** de um estudo total de **R$ 3,26 milhões**. Lição: o valor social vem da **percepção de quem vive a mudança**, não de planilha interna.
- **Amigos do Bem:** SROI aplicado pelo IDIS — **R$ 6,45 de benefício social por R$ 1 investido**, com **R$ 2,1 bilhões** de impacto acumulado entre 2012 e 2021 (**trabalho e renda 38,4%; educação 35,7%**), alcançando 150 mil pessoas em 300 povoados. O número foi **auditado pela EY** e virou peça comercial: "para cada R$ 1 doado, geramos R$ 6,45 de impacto real". Lição: **evidência + auditoria + tradução simples = captação**.
- **Instituto Baccarelli (Heliópolis):** **R$ 3,49 por R$ 1** com base em dados de 2023, combinando ferramenta do Insper, dados secundários e pesquisa com beneficiários; a avaliação qualitativa apontou 4 mudanças positivas. O relatório saiu em PDF público na área de transparência e foi usado em editorial do Estadão (08/08/2024). Lição: **relato público e imprensa ampliam a captação**.

- **🔢 Você sabia?** No primeiro SROI do Brasil (FLUPP, programa VIM), a mudança **"melhora na sociabilidade"** foi relatada por **87%** dos participantes e valceu cerca de **R$ 227 mil** dos **R$ 3,26 milhões** totais do estudo — quase 7% do benefício veio de uma mudança que nenhuma planilha financeira teria registrado. Valor social é o que **quem vive a mudança** diz que mudou.

---

## 8. Painel de KPIs: a Rotina que Substitui o Relatório Bonito

### 8.1 Exemplo 8 — painel de 5 indicadores com fonte, frequência e meta

O painel abaixo é o artefato mínimo de um Nível 3 de maturidade: cinco indicadores, cada um com fórmula, linha de base, meta, **fonte de coleta**, **frequência** e **responsável**:

| # | Indicador | Fórmula | Linha de base | Meta | Fonte / método de coleta | Frequência | Responsável |
|---|---|---|---|---|---|---|---|
| 1 | Frequência média | presenças ÷ inscrições × 100 | **78%** | **≥ 85%** | Lista de presença digital + diário escolar | Mensal | Coord. pedagógica |
| 2 | Conclusão de mentoria | concluintes ÷ inscritos × 100 | — (1º ciclo) | **80%** | Sistema de gestão da mentoria | Semestral | Coord. de mentorias |
| 3 | Evasão no território | evadidos ÷ matriculados × 100 | **12,0%** | **9,6%** em 24 meses | Censo da rede municipal + verificação em escola | Semestral | Parcerias |
| 4 | Satisfação dos beneficiários | média da escala 0–10 | **7,4** | **≥ 8,0** | Pesquisa com 300 responsáveis, consentimento e anonimato | Semestral | M&A |
| 5 | Custo por aluno concluído | custo total ÷ concluintes | **R$ 1.600** | **≤ R$ 1.400** | Razão contábil com contas segregadas por projeto | Anual | Financeiro |

```text
PAINEL PÚBLICO — INSTITUTO RAÍZES (exemplo fictício)
publicado trimestralmente no portal de transparência

 KPI                        LINHA DE BASE   META        STATUS
 ───────────────────────────────────────────────────────────────
 Frequência média               78%        ≥ 85%        ▲ 83%
 Conclusão de mentoria           —          80%          ● 79%
 Evasão no território          12,0%        9,6%         ▼ 10,8%
 Satisfação (0–10)              7,4         ≥ 8,0        ● 7,9
 Custo por aluno concluído   R$ 1.600     ≤ R$ 1.400    ▲ R$ 1.470
 ───────────────────────────────────────────────────────────────
 cada linha sai desagregada: gênero · raça · idade · território
 (marcadores identitários autodeclarados, sempre com consentimento)
 ▲ aproxima-se da meta · ● estável · ▼ afasta-se da meta
```

Como cada número chega até o painel:

- **Frequência:** exportação mensal das listas, consolidada até o dia 10 — coleta barata porque é subproduto de rotina já existente;
- **Conclusão de mentoria:** extração semestral do sistema, com critério de conclusão escrito na ficha do indicador (definição operacional);
- **Evasão:** censo da rede, checado em duas escolas por amostra a cada ciclo — a checagem é o que impede a manipulação;
- **Satisfação:** survey semestral com 300 responsáveis, amostra estratificada por escola, consentimento e anonimato;
- **Custo por aluno:** razão contábil anual com contas segregadas por projeto — sem segregação, o número é opinião do financeiro.

### 8.2 A rotina de aprendizagem recomendada pelo IDIS (dez/2025)

Os elementos que transformam painel em gestão — e não em decoração de site:

- base estruturada de participantes com **marcadores identitários autodeclarados** — para enxergar **quem está sendo excluído**;
- **pesquisa de satisfação semestral** com beneficiários;
- **grupos focais anuais** com equipes e famílias;
- **painel público de indicadores**;
- **ciclo de correção de rota documentado em ata do conselho** — conexão direta com o **art. 58, § 2º** da Lei nº 13.019 e com a exigência de **89%** dos doadores por evidência de diferença.

- **🔢 Você sabia?** O art. 58, § 2º, e a rotina de aprendizagem do IDIS são a mesma ideia em dois registros: **escutar, medir e corrigir**. A ata do conselho que registra a decisão de mudar a metodologia depois de um grupo focal é, ao mesmo tempo, prova de conformidade legal e evidência de governança baseada em dados.

### 8.3 Quando o financiador só aceita metade do caminho

Sem orçamento para estudo de impacto, negocie assim:

1. **Indicadores de resultado** no plano de trabalho (não só produtos) — negociados **antes** da assinatura;
2. Registro no termo de que a **avaliação causal é fase 2**;
3. **Comparação com meta histórica** e **grupo externo disponível** (outra escola, outra rede) como aproximação — com transparência sobre a limitação (**princípios 5 e 6** do SVI: não superestimar e ser transparente).

### 8.4 Calendário mínimo de coleta (o que acontece em cada mês)

Sem calendário, painel vira enfeite. Este é o ciclo de 12 meses que sustenta os cinco indicadores da Seção 8.1:

| Mês | Ação | Indicadores atualizados | Registro gerado |
|---|---|---|---|
| 1 | Consolidação das listas de presença | Frequência | Relatório mensal de frequência |
| 2 | Checagem de dados de 2 escolas | Evasão (parcial) | Ata de verificação |
| 3 | Publicação do painel trimestral | Todos | Painel no portal de transparência |
| 6 | Pesquisa de satisfação semestral + grupos focais | Satisfação, percepção de resultados | Relatório de escuta |
| 9 | Publicação do painel trimestral | Todos | Painel no portal de transparência |
| 12 | Razão contábil com segregação por projeto + assembleia | Custo por aluno concluído | Ata com ciclo de correção de rota |
| Contínuo | Desagregação por gênero, raça, idade e território | Todos | Base estruturada de participantes |

> [!NOTE]
> **O item do mês 12 é o que mais se esquece.** Registrar em ata do conselho **o que mudou por causa dos dados** é o que fecha o ciclo do art. 58, § 2º: escuta → painel → decisão → ajuste. Sem essa ata, a organização coleta números; com ela, ela **aprende** — e pode provar que aprendeu.

---

## 9. Matriz de Maturidade de M&A

Diagnóstico rápido para saber onde a sua OSC está:

| Nível | Característica | O que muda na prática |
|---|---|---|
| **1 — Contábil** | Só Relatório de Execução Financeira | Presta contas do dinheiro, não da mudança |
| **2 — Gerencial** | Indicadores de atividade/produto e metas do plano de trabalho | Já prova execução conforme o art. 64 |
| **3 — Gerencial + aprendizagem** | Resultados, escuta de beneficiários, correção de rota (art. 58, § 2º) | Painel público, baseline, ata de correção |
| **4 — Estratégico** | Evidência de impacto, avaliação externa, relato (GRI/IRIS+) e uso na captação | Estudo de impacto e SROI pontual |

> [!NOTE]
> **Meta realista para a OSC brasileira:** sair do **Nível 1 para o Nível 3 em 12 meses**. O **Nível 4** é por **projeto prioritário** — não faz sentido estudo causal em todas as frentes simultaneamente. A sequência das Seções 5 a 8 é o roteiro exato dessa subida: ToC (mês 1), matriz de indicadores (mês 2), linha de base (mês 3), coleta (mês 4 em diante), painel (mês 6), escuta semestral e ata de correção (mês 12).

---

## 10. Erros Comuns e a Correção de Cada Um

| # | Erro comum | Por que é erro | Correção |
|---|---|---|---|
| 1 | Tratar **recibo como resultado** | Recibo prova conformidade, não mudança | Separar prestação de contas de evidência de impacto |
| 2 | Confundir **output com impacto** | "240 concluintes" é entrega | Comparação com meta, linha de base ou grupo externo |
| 3 | Medir **só satisfação** e chamar de impacto | Sem grupo de comparação, não há atribuição | Usar satisfação para aprender, nunca para provar |
| 4 | **Pular a linha de base** | Sem ela, pré/pós é indefensável | Pesquisa piloto antes da assinatura |
| 5 | Escrever meta **"reduzir 20%"** sem definir se é relativa ou absoluta | 9,6% × 10,0% = 5 alunos/ano de diferença | Declarar a fórmula no art. 22, IV |
| 6 | **Contar atendimentos** | Distorção de incentivo ao atendimento raso | Trocar por taxa de conclusão + satisfação |
| 7 | Citar o **art. 56 (25%)** como vigente | **Revogado** pela Lei nº 13.204/2015 | Decreto nº 8.726/2016, art. 43: apostilamento, ≤10% |
| 8 | Confundir **remanejamento de valor com mudança de meta** | Valores são operacionais; metas não | Termo aditivo ou apostila (art. 57) |
| 9 | Fazer **SROI como rotina mensal** | SROI é estudo pontual e caro | Rotina = painel de produto/resultado |
| 10 | Somar uma **6ª dimensão do IMP** | São 5: What, Who, How Much, Contribution, Risk | Corrigir a contagem em relatório e em prova |
| 11 | **Esquecer a desagregação** (gênero, raça, idade, território) | Sem ela, a ONG não vê quem fica de fora | Marcadores autodeclarados com consentimento |
| 12 | **Atribuir 100%** do resultado à ONG | Viola o princípio 5 do SVI | Ajustar atribuição e *deadweight* e mostrar a conta |
| 13 | Publicar **número não verificado** como fato | Quebra credibilidade quando alguém confere | Sinalizar como não conferido e citar a fonte |

> [!WARNING]
> **Erros que mais aparecem em prestação de contas, em edital e em prova — todos decorrentes de material desatualizado ou de leitura apressada:**
>
> 1. **Escrever "remanjamento de até 25% (art. 56)"** — o dispositivo foi **revogado**; no âmbito federal vale o Decreto nº 8.726/2016, art. 43, com ajuste por apostilamento e limite de **10% do valor global** sem autorização prévia (§ 4º, com redação do Decreto nº 11.948/2024);
> 2. **Dizer que "a OSC faz monitoramento e avaliação"** sem precisar quem faz — o **art. 58** atribui o M&A à **administração pública**; a OSC presta contas (arts. 64 e 66);
> 3. **Chamar pesquisa de satisfação de estudo de impacto** — rigor baixo, custo baixo, sem comparação;
> 4. **Citar "6 dimensões do IMP"** — são **5**;
> 5. **Tratar relatório GRI como avaliação** — GRI é **relato** por materialidade, não juízo de efetividade;
> 6. **Publicar IRIS+ v5.3c / 781 métricas, CBVE 95,12% ou ~15% do Censo GIFE** como fato consolidado — nenhum desses números foi conferido na fonte primária.

---

## 11. Números do Setor e Itens Não Verificados

### 11.1 Curiosidades verificadas desta lição

- **🔢 Você sabia?** A assimetria do setor cabe em uma frase: **90,7% monitoram, 17,4% avaliam impacto** (IDIS, 2018, n=86 / ~80 OSCs) — enquanto **61,6%** acreditam que M&A atrai recursos. O gargalo não é convicção: é desenho de avaliação.
- **🔢 Você sabia?** **89% dos doadores** querem evidência de que a doação "pode fazer a diferença" e **83% pesquisam antes de doar** (Pesquisa Doação Brasil 2024). Só **33%** acham que as ONGs deixam claro o uso do dinheiro — a lacuna entre 89% e 33% é exatamente o espaço que o painel de indicadores ocupa.
- **🔢 Você sabia?** O **Amigos do Bem** acumulou **R$ 2,1 bilhões** de impacto entre 2012 e 2021 (trabalho e renda 38,4%; educação 35,7%), com SROI de **R$ 6,45** auditado pela **EY** — evidência com auditoria externa é o que transforma número em peça de captação.
- **🔢 Você sabia?** O **IDIS** aplicou **41 projetos de SROI em 2024** — número **divulgado pela própria organização e não auditado**; serve para dimensionar a atividade no país, não como estatística oficial.

### 11.2 Itens sinalizados como não verificados nesta pesquisa

Para você não transformar lacuna de pesquisa em afirmação categórica:

- **IRIS+ v5.3c / 781 métricas / Core Metrics atualizados em 07/2025** — número citado em material secundário; conferir em iris.ifc.org;
- **GRI:** data exata de eficácia dos Universal Standards 2021 (01/01/2023) — não confirmada em nota oficial;
- **Censo GIFE:** ~15% do ISP vindo de incentivos fiscais — não conferido;
- **"41 projetos de SROI do IDIS em 2024"** — divulgado pelo IDIS, não auditado;
- **Panorama das ONGs (CAF + IDIS):** URL de divulgação secundária — localizar a publicação original;
- **Cases Liga STEAM / Doutores da Alegria com SROI** — não confirmados; **não citar como fato**;
- **CBVE 2025, "95,12% de voluntariado empresarial com indicadores quantitativos"** — número não rastreado à base original;
- **Ética da escuta:** pesquisa com beneficiários exige consentimento e anonimato — diretriz da SVI, não relida nesta rodada;
- **Amostra do IDIS 2018:** pequena e não probabilística — usar como indicador de assimetria, nunca como estatística nacional.

---

## Perguntas Práticas (Practice Questions)

```question
{
  "id": "npof-14-q1",
  "type": "multiple-choice",
  "question": "Quantas dimensões de impacto o arcabouço do Impact Management Project (sob curadoria da Impact Frontiers) descreve?",
  "options": ["Seis", "Três", "Cinco", "Quatro"],
  "correct": 2,
  "explanation": "São cinco dimensões: What (mudança), Who (população afetada, incluindo privação), How Much (magnitude e duração), Contribution (atribuição) e Risk (risco de a mudança não acontecer). A armadilha clássica é afirmar que são seis."
}
```

```question
{
  "id": "npof-14-q2",
  "type": "multiple-choice",
  "question": "Uma parceria MROSC com vigência de 24 meses. O que a administração pública deve fazer, sempre que possível, sobre os beneficiários?",
  "options": [
    "Realizar pesquisa de satisfação com os beneficiários e usar os resultados como subsídio na avaliação e no ajuste de metas e atividades (art. 58, § 2º)",
    "Dispensar a escuta, pois a prestação de contas financeira já encerra o ciclo",
    "Encaminhar os beneficiários apenas ao relatório de execução financeira (art. 66)",
    "Só ouvir os beneficiários no término da parceria, após o parecer do gestor"
  ],
  "correct": 0,
  "explanation": "O art. 58, § 2º da Lei nº 13.019/2014 determina que, nas parcerias com vigência superior a 1 ano, a administração faça, sempre que possível, pesquisa de satisfação com os beneficiários e use os resultados como subsídio na avaliação, na reorientação e no ajuste das metas e atividades. O M&A é promovido pela administração (art. 58); a OSC presta contas (arts. 64 e 66)."
}
```

```question
{
  "id": "npof-14-q3",
  "type": "multiple-choice",
  "question": "O que o relatório técnico de monitoramento e avaliação deve conter sobre impacto, segundo o art. 59, § 1º, II, da MROSC?",
  "options": [
    "Apenas a demonstração de que os recursos foram aplicados nas rubricas aprovadas",
    "Análise das atividades realizadas, do cumprimento das metas e do impacto do benefício social obtido, com base nos indicadores estabelecidos e aprovados no plano de trabalho",
    "Um estudo de impacto com ensaio aleatorizado obrigatório em todas as parcerias",
    "A opinião do conselho fiscal sobre a conveniência social do programa"
  ],
  "correct": 1,
  "explanation": "O art. 59, § 1º, II exige a análise das atividades, do cumprimento das metas e do impacto do benefício social obtido, sempre com base nos indicadores aprovados no plano de trabalho (art. 22, IV). A lei não exige ensaio aleatorizado — o rigor do desenho depende da decisão que o estudo vai informar."
}
```

```question
{
  "id": "npof-14-q4",
  "type": "multiple-choice",
  "question": "Qual foi o primeiro SROI aplicado no Brasil e qual foi seu resultado?",
  "options": [
    "Instituto Baccarelli, com R$ 6,45 por R$ 1 investido",
    "Amigos do Bem, com R$ 3,49 por R$ 1 investido",
    "Fundação Itaú Social, com R$ 4,08 por R$ 1 investido",
    "FLUPP — Fundação Lucia e Pelerson Penido, programa VIM (Roseira/SP), com R$ 4,08 por R$ 1 investido"
  ],
  "correct": 3,
  "explanation": "O 1º SROI do Brasil foi aplicado pela IDIS na Fundação Lucia e Pelerson Penido (FLUPP), em Roseira/SP, no programa VIM: R$ 4,08 de benefício social por R$ 1 investido. Amigos do Bem alcançou R$ 6,45 (auditado pela EY) e o Instituto Baccarelli R$ 3,49."
}
```

```question
{
  "id": "npof-14-q5",
  "type": "multiple-choice",
  "question": "Segundo a pesquisa do IDIS (2018, n=86 profissionais de cerca de 80 organizações), qual é a assimetria central do setor brasileiro?",
  "options": [
    "90,7% monitoram seus projetos, mas apenas 17,4% declaram fazer avaliação de impacto",
    "17,4% monitoram e 90,7% avaliam impacto",
    "Todas as organizações monitoram e avaliam impacto com rigor causal",
    "Apenas 61,6% monitoram projetos, e nenhuma avalia impacto"
  ],
  "correct": 0,
  "explanation": "O setor comprova execução, não mudança: 90,7% monitoram (65% todos os projetos), mas só 17,4% declaram avaliação de impacto; entre as que monitoram tudo, apenas 31,9% avaliam impacto de todos. A amostra é pequena e não probabilística — use o dado como indicador de assimetria, nunca como estatística nacional."
}
```

```question
{
  "id": "npof-14-q6",
  "type": "multiple-choice",
  "question": "Quantos são os princípios do valor social da Social Value International?",
  "options": ["Quatro", "Seis", "Oito", "Dez"],
  "correct": 2,
  "explanation": "São 8 princípios: envolver stakeholders; entender as mudanças; valorar o que importa; incluir apenas o que é material; não superestimar; ser transparente; verificar o resultado; ser responsivo. Os princípios 4, 5 e 7 são os que sustentam o rigor do SROI."
}
```

```question
{
  "id": "npof-14-q7",
  "type": "multiple-choice",
  "question": "Quais três princípios do SROI/SVI sustentam especificamente o rigor de um estudo de valor social?",
  "options": [
    "Involver stakeholders, valorar o que importa e ser responsivo",
    "Só incluir o material (4), não superestimar a atribuição (5) e verificar o resultado (7)",
    "Ser transparente, medir satisfação e publicar relatório anual",
    "Aplicar ensaio aleatorizado em todo projeto e reduzir custos de coleta"
  ],
  "correct": 1,
  "explanation": "O rigor vem dos princípios 4 (só incluir o que é material), 5 (não superestimar — ajustar atribuição e o que já ocorreria de qualquer forma) e 7 (verificar o resultado, com assessoria independente quando houver público externo ou decisão relevante). O princípio 6 (transparência) também é aceitável em algumas formulações, mas os três centrais são 4, 5 e 7."
}
```

```question
{
  "id": "npof-14-q8",
  "type": "multiple-choice",
  "question": "Qual é o status verificado do GRI em 2026?",
  "options": [
    "O GSSB aprovou GRI 106/107 (jun/2026) e GRI 104/105 (jul/2026), com publicação postergada para 2027; Economic Impacts Phase 1 em aprovação final e Phases 2–3 pausadas; piloto setorial Food & Beverage",
    "Todos os novos padrões GRI já estão formalmente vigentes desde 01/01/2023",
    "O GRI foi substituído pelo IRIS+ como padrão de relato em 2026",
    "O GSSB cancelou o Work Programme 2026–2028"
  ],
  "correct": 0,
  "explanation": "O GSSB aprovou os padrões GRI 106/107 (01–02/06/2026) e GRI 104/105 (16/07/2026), com publicação postergada para 2027; Economic Impacts Phase 1 (GRI MF) está em aprovação final, Phases 2–3 estão pausadas, Pollution Phase 1 está em aprovação, o piloto setorial é Food & Beverage e o Work Programme 2026–2028 foi consultado até 27/03/2026. A data de eficácia dos Universal Standards 2021 não foi confirmada em nota oficial."
}
```

```matching
{
  "question": "Associe cada conceito ao seu significado, fórmula ou fundamento legal correto:",
  "pairs": [
    {"left": "Monitoramento", "right": "Acompanhamento contínuo de execução e progresso: responde a eficiência e ao cumprimento de metas"},
    {"left": "Avaliação", "right": "Juízo sobre mérito, relevância, efetividade, eficiência, impacto e sustentabilidade"},
    {"left": "Estudo de impacto", "right": "Desenho com grupo de comparação ou método equivalente que permite atribuição causal"},
    {"left": "Output (produto)", "right": "\"240 alunos concluintes\" — prova entrega, não mudança no público"},
    {"left": "Outcome (resultado)", "right": "\"Evasão caiu de 12,0% para 9,6%\" — mudança de médio prazo em quem participou"},
    {"left": "Art. 22, IV da MROSC", "right": "Plano de trabalho deve conter os parâmetros para a aferição do cumprimento das metas"},
    {"left": "Art. 58, § 2º da MROSC", "right": "Parceria superior a 1 ano: pesquisa de satisfação com beneficiários e ajuste de metas e atividades"}
  ],
  "explanation": "Monitoramento cuida da execução, avaliação faz juízo de mérito e efetividade, e só o estudo de impacto sustenta a atribuição causal. Na cadeia, o output é a entrega e o outcome é a mudança observada — confundir os dois gera relatório bonito sem tese de impacto. No plano legal, o art. 22, IV traz os parâmetros de aferição das metas e o art. 58, § 2º impõe a escuta dos beneficiários nas parcerias com vigência superior a 1 ano."
}
```

```fillblank
{
  "question": "Complete o cálculo de SROI e a diferença entre meta relativa e meta absoluta apresentados na lição:",
  "template": "No exemplo fictício Raízes, o benefício bruto de R$ 642.000 foi ajustado até R$ 373.258,80 e, dividido pelo investimento de R$ 120.000, resultou em SROI de R$ {{1}} por R$ 1 investido. Já nos casos reais brasileiros, a FLUPP registrou R$ {{2}} (1º SROI do Brasil) e o Instituto Baccarelli R$ {{3}}. Por fim, uma redução relativa de 20% sobre a linha de base de 12,0% resulta em meta de {{4}}.",
  "answers": {
    "1": "3,11",
    "2": "4,08",
    "3": "3,49",
    "4": "9,6%"
  },
  "distractors": ["6,45", "3,85", "10,0%", "20%"],
  "explanation": "O SROI divide o benefício social ajustado pelo investimento total: 373.258,80 ÷ 120.000 = R$ 3,11 por R$ 1. Os valores reais do digest são R$ 4,08 (FLUPP, 1º SROI do Brasil) e R$ 3,49 (Instituto Baccarelli) — R$ 6,45 é do Amigos do Bem, usado aqui como distrator. A meta relativa é 12,0% × 0,80 = 9,6%; 10,0% seria a meta absoluta (12,0% − 2,0 p.p.)."
}
```

---

> [!WARNING]
> **Armadilhas desta lição:**
> - **Confundir output com impacto**: "240 alunos concluintes" é produto; só comparação com meta, linha de base ou grupo externo sustenta mudança;
> - **Medir só satisfação e chamar de impacto**: pesquisa de satisfação é insumo de aprendizagem (art. 58, § 2º), não estudo de impacto — não tem grupo de comparação;
> - **5 dimensões do IMP, não 6**: What, Who, How Much, Contribution, Risk;
> - **Prestação de contas ≠ evidência de impacto**: recibo prova conformidade, estudo de impacto prova mudança;
> - **O art. 56 (25%) foi revogado** — no âmbito federal vale o Decreto nº 8.726/2016, art. 43 (apostilamento, ≤10% do valor global); e ajustar valor não é mudar meta (art. 57);
> - **"Reduzir 20%" sem fórmula** pode significar meta de 9,6% ou de 10,0% — declare se é relativa ou absoluta;
> - **SROI é estudo pontual**, não KPI de rotina;
> - **Dados não conferidos** (IRIS+ v5.3c/781 métricas, 95,12% do CBVE, ~15% do Censo GIFE, 68% de recursos restritos, 41 projetos do IDIS) só podem ser citados como **não verificados**;
> - A assimetria **90,7% monitoram × 17,4% avaliam** vem de amostra pequena e não probabilística — nunca a apresente como estatística nacional.

> [!SUCCESS]
> **Pontos Principais (Key Takeaways):**
> - A cadeia de resultados separa **insumo → atividade → produto → resultado → impacto**; monitoramento responde a eficiência, avaliação a efetividade e impacto, e só o **estudo de impacto** sustenta a frase "graças ao nosso programa";
> - O **MROSC (Lei nº 13.019/2014)** obriga a pensar em impacto: parâmetros de aferição no plano (art. 22, IV), M&A pela administração (art. 58), **pesquisa de satisfação** em parcerias acima de 1 ano (art. 58, § 2º) e relatório técnico com "impacto do benefício social" (art. 59, § 1º, II);
> - O **art. 56 (remanjamento de 25%) foi revogado**: federalmente valem apostilamento pelo Decreto nº 8.726/2016 (≤10% do valor global) e a regra de que **metas mudam só por termo aditivo ou apostila** (art. 57);
> - **Sem linha de base não existe meta defensável** — e "reduzir 20%" significa 9,6% (relativa) ou 10,0% (absoluta), cerca de **5 alunos por ano** de diferença em 1.200;
> - A assimetria brasileira é clara — **90,7% monitoram, só 17,4% avaliam impacto** (IDIS 2018, amostra não probabilística) — enquanto **89% dos doadores** querem evidência de que a doação faz diferença (Doação Brasil 2024);
> - Os frameworks se complementam: **Teoria da Mudança** explica o nexo causal, o **modelo lógico** organiza indicadores, **IRIS+/GRI** padronizam o relato, **IMP** qualifica em 5 dimensões e o **SROI** traduz mudanças em R$ por R$ investido;
> - Cases reais: **FLUPP R$ 4,08** (1º SROI do Brasil), **Amigos do Bem R$ 6,45** (auditado pela EY) e **Baccarelli R$ 3,49** — evidência + auditoria + tradução simples igual a captação;
> - A rota prática é sair do **Nível 1 (contábil) para o Nível 3 (aprendizagem) em 12 meses** com painel de KPIs (fonte, frequência, meta e responsável), linha de base, escuta semestral e ciclo de correção de rota documentado — o Nível 4 fica para o projeto prioritário.
