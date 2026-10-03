---
title: "Impostos e Incentivos Fiscais para ONGs"
description: "Regime tributário completo das organizações sem fins lucrativos no Brasil: imunidade de impostos, imunidade previdenciária e CEBAS, incentivos ao doador PF e PJ, retenções na fonte, redução linear de 10% da LC 224/2025, transição do IBS/CBS até 2033, obrigações acessórias de 2026, contabilidade da ITG 2002 e governança fiscal, com doze exemplos numéricos resolvidos, árvores de decisão, calendário de prazos, tabela de alíquotas de teste e questões de prática."
order: 12
difficulty: "intermediate"
duration: "120 min"
---
# Impostos e Incentivos Fiscais para ONGs

Toda ONG convive, ao mesmo tempo, com dois mundos tributários: o mundo dos **benefícios** (imunidades, isenções, certificações e incentivos que fazem o doador economizar) e o mundo das **obrigações** (escrituração, declarações, retenções e prestação de contas). Separar bem esses dois mundos — e dominar a transição que está acontecendo entre eles — é o que distingue a entidade sólida da entidade que perde certificação, glosa repasse público, descobre tarde demais que a "isenção" nunca existiu ou orça compras com um custo que cresce silenciosamente.

O mapa completo do regime das organizações sem fins lucrativos (OSC) tem esta arquitetura em camadas:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ CAMADA 1 — CONSTITUIÇÃO FEDERAL                                         │
│   art. 150, VI, "c" e § 4º .... imunidade de impostos das OSC           │
│   art. 195, § 7º .............. imunidade das contribuições da          │
│                                 seguridade social (base do CEBAS)       │
│   art. 156, § 6º, I ........... livros, jornais, periódicos e papel     │
│   EC 132/2023, art. 149-B ..... IBS e CBS observam o art. 150, VI       │
├─────────────────────────────────────────────────────────────────────────┤
│ CAMADA 2 — LEIS E LEIS COMPLEMENTARES                                   │
│   Lei 9.532/1997 (arts. 12, 13, 14, 15 e 22) .. imunidade e isenção     │
│   Lei 9.249/1995 (art. 13) · Lei 9.250/1995 ..... deduções do doador    │
│   Lei 8.313/1991 (arts. 18 e 26) ............... Rouanet                │
│   Lei 8.212/1991 (art. 22) · LC 187/2021 ........ previdência e CEBAS    │
│   LC 116/2003 (arts. 2, 6, 8, 8-A e 8-B) ........ ISS                   │
│   LC 214/2025 · LC 224/2025 · LC 227/2026 · LC 235/2026 .. reforma      │
├─────────────────────────────────────────────────────────────────────────┤
│ CAMADA 3 — CERTIFICAÇÕES E QUALIFICAÇÕES                                 │
│   CEBAS saúde/educação/assistência · OSCIP (Lei 9.790/1999) ·           │
│   OS (Lei 9.637/1998) · benefícios do art. 84-B da MROSC                │
├─────────────────────────────────────────────────────────────────────────┤
│ CAMADA 4 — OBRIGAÇÕES E CONTROLE                                        │
│   ECD · ECF · DCTFWeb · EFD-Contribuições · eSocial                     │
│   ITG 2002 (R1): competência, doações no resultado, renúncia nas notas   │
└─────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> "Ser sem fins lucrativos" **não** é sinônimo de "não pagar nada". A imunidade é a regra geral do terceiro setor, mas ela é **condicionada e fiscalizada**: descumprir os requisitos do art. 12 da Lei nº 9.532/1997, perder a CEBAS ou deixar de entregar uma declaração obrigatória significa voltar a recolher normalmente — em certos casos com juros e multa sobre um período que a fiscalização pode cobrar retroativamente.

Nesta lição você vai:

- distinguir **imunidade, isenção, não incidência e benefícios do MROSC** sem confundi-los;
- aplicar os **requisitos do art. 12 da Lei nº 9.532/1997** item por item;
- calcular, com números, **quanto vale a imunidade previdenciária** com e sem CEBAS;
- medir **gratuidade, percentual de SUS e renovação** da CEBAS-Saúde;
- simular **quanto o doador PF e PJ economiza** e qual o teto real de cada incentivo;
- interpretar a **redução linear de 10%** da LC nº 224/2025 e o que a LC nº 235/2026 preservou;
- ler a **linha do tempo da reforma tributária (2023–2033)** e orçar o **IBS/CBS no custo das compras** da entidade;
- montar o **calendário de obrigações acessórias de 2026** e a divulgação da **renúncia fiscal nas notas**;
- calcular o **IRRF de aluguéis e salários** com a tabela de 2026 e o **redutor da Lei nº 15.270/2025**;
- distinguir **doação, subvenção e contraprestação** e conferir os **dois tetos** de cada doação empresarial;
- montar o **checklist de governança fiscal** e o **plano de 90 dias** que sustenta a imunidade;
- resolver **questões de exame** com o raciocínio passo a passo.

---

## 1. Três institutos e quatro portas: o mapa do regime

### 1.1 Os institutos que se confundem

O erro mais caro da gestão fiscal de uma ONG não é matemático: é conceitual. São quatro institutos distintos, com fontes distintas e efeitos distintos:

| Instituto | O que significa | Fonte típica | Exemplo concreto |
|---|---|---|---|
| **Imunidade** | A Constituição **veda** a instituição do tributo; é limite ao poder de tributar | CF art. 150, VI, "c"; CF art. 195, § 7º; Lei nº 9.532/1997, art. 12 | ONG imune não recolhe IRPJ/CSLL sobre a renda ligada ao objeto |
| **Isenção** | A lei **dispensa** a incidência em hipótese determinada (podendo ser revogada) | Lei nº 9.532/1997, art. 15 | Associação cultural isenta de IRPJ/CSLL/COFINS pelo art. 15 (item 34 da IN RFB 2.307/2026) |
| **Não incidência** | O fato gerador **não acontece** na hipótese narrada pela lei | LC nº 116/2003, art. 2 (ISS); LC nº 214/2025, art. 6 (IBS/CBS) | Doação sem contraprestação em benefício do doador |
| **Benefício do MROSC / qualificação** | Vantagem ligada a **instrumento, cadastro ou certificação** | Lei nº 13.019/2014, arts. 84-B e 84-C; LC nº 187/2021 (CEBAS) | Doação de empresa até 2% da receita bruta do doador; isenção da contribuição patronal |

**CUIDADO:** isenção pode ser revogada por lei ordinária; imunidade constitucional só pode ser afastada por emenda (dentro dos limites do art. 60, § 4º, da CF). Já o **CEBAS é certificação**: ele não cria um benefício novo — ele **destrava** a imunidade do art. 195, § 7º, enquanto durar e enquanto os requisitos forem mantidos.

### 1.2 A árvore de decisão do benefício

```text
A ENTIDADE QUER SABER QUAL REGIME SE APLICA
│
├── 1. A receita vem de atividade ligada ao OBJETO (finalidade essencial)?
│      ├── SIM --> IMUNIDADE DE IMPOSTOS
│      │          CF 150, VI, "c" + Lei 9.532/1997, art. 12
│      │          (escrituração, 5 anos de guarda, sem remunerar
│      │           dirigentes, aplicação interna dos recursos)
│      └── NÃO --> atividade econômica alheia ao objeto:
│                  tributação normal (lucro presumido/real, Simples)
│
├── 2. A entidade presta serviço em SAÚDE, EDUCAÇÃO ou ASSISTÊNCIA?
│      ├── SIM, com CEBAS vigente --> IMUNIDADE PREVIDENCIÁRIA
│      │          CF 195, § 7º + LC 187/2021, art. 4º
│      │          (zera 20% + RAT sobre a folha da própria entidade)
│      └── NÃO --> folha tributada normalmente
│                   Lei 8.212/1991, art. 22 (20% + RAT 1%/2%/3%)
│
├── 3. QUEM DOA pede incentivo?
│      ├── PF --> até 6% do IR devido (Lei 9.532/1997, arts. 12 e 22)
│      │         + Rouanet/PRONON/PRONAS conforme o caso
│      └── PJ --> até 2% do lucro operacional
│                 (Lei 9.249/1995, art. 13, § 2º, III)
│
└── 4. O que a entidade NÃO é
        ├── não é "isenta" apenas por ser sem fins lucrativos
        ├── não está dispensada de ECD, ECF, DCTFWeb e eSocial
        └── não pode distribuir resultado, a qualquer título
```

### 1.3 Imunidade × isenção × CEBAS × benefícios do MROSC na mesma tabela

| Critério | Imunidade de impostos | Isenção (art. 15) | CEBAS / imunidade previdenciária | Benefícios do MROSC (art. 84-B) |
|---|---|---|---|---|
| **Base legal** | CF art. 150, VI, "c" e § 4º; Lei nº 9.532/1997, arts. 12 a 14 | Lei nº 9.532/1997, art. 15 (red. LC 187/2021) | CF art. 195, § 7º; LC nº 187/2021 | Lei nº 13.019/2014, arts. 84-B e 84-C |
| **O que cobre** | IRPJ, CSLL e outros impostos sobre patrimônio, renda e serviços, ligados ao objeto | IRPJ, CSLL e COFINS de filantrópicas, recreativas, culturais, científicas e associações civis | Contribuições patronais sobre a folha da própria entidade (Lei nº 8.212/1991, art. 22) | Doação de empresa até 2% da receita bruta do doador; bens móveis irrecuperáveis/apreendidos da RFB |
| **Condição-chave** | Cumprir o art. 12 (alíneas "a" a "h") | Atender as exigências legais; consta do **item 34** da IN RFB 2.307/2026 | **Certificação CEBAS** vigente + requisitos do art. 3º da LC 187/2021 | A OSC deve ter **ao menos uma das 13 finalidades** do art. 84-C |
| **Quem controla** | RFB (imunidade é declarada e fiscalizada) | RFB | Ministério da Saúde (SAES/DCEBAS), MEC (e-CEBAS) e MDS (CGCEB) | A própria entidade e o doador |
| **Pode perder?** | Sim — art. 14 da Lei nº 9.532/1997 (suspensão, pelo art. 32 da Lei nº 9.430/1996) | Sim — revogação legislativa | Sim — não renovação ou descumprimento de percentuais | Sim — perda de finalidade ou de regularidade |
| **Risco típico** | Escrituração incompleta ou remuneração irregular de dirigentes | Confundir isenção com imunidade | Queda de SUS ou de gratuidade em ano de renovação | Campanha político-partidária veda o benefício (art. 84-C, parágrafo único) |

- **🔢 Você sabia?** O **PIS/PASEP e a COFINS vigem até 31/12/2026**: pela EC nº 132/2023 e pela LC nº 214/2025, a CBS só passa a ser cobrada a partir de 2027, e 2026 é o último ano do sistema atual. Quem ainda calcula PIS/COFINS "para os próximos anos" está com o plano de contas um ciclo atrás.

---

## 2. Imunidade de impostos: CF art. 150, VI, "c" e Lei nº 9.532/1997

A **CF, art. 150, VI, "c"** veda à União, aos estados, ao Distrito Federal e aos municípios instituir impostos sobre o **patrimônio, a renda ou os serviços** das entidades sem fins lucrativos dedicadas a finalidades religiosas, humanitárias, científicas, culturais e sindicais, **na forma da lei**. O **§ 4º** é a chave de leitura: a imunidade compreende **somente** o patrimônio, a renda e os serviços **relacionados com as finalidades essenciais** da entidade.

A lei de regência é a **Lei nº 9.532/1997**.

### 2.1 Os oito requisitos do art. 12 — checklist de auditoria

| Alínea | Requisito | O que a fiscalização procura | Frequência do problema |
|---|---|---|---|
| **a** | Não remunerar ou dar vantagens a dirigentes, exceto pela gestão efetiva | Ata, contrato e folha de pagamento dos dirigentes | Alta |
| **b** | Aplicar internamente, no País, os recursos auferidos | Saídas para o exterior, aplicações fora do objeto | Média |
| **c** | Manter escrituração completa da receita e das despesas | Livros razão, balanço, conciliação bancária | **Muito alta** |
| **d** | Guardar documentos comprobatórios pelo prazo decadencial de **5 anos** | Arquivo físico/digital, notas, recibos | Alta |
| **e** | Apresentar a **Declaração de Rendimentos** anual | Recibo de entrega da DIRPF/DIRPJ | Média |
| **f** | **Recolher os tributos retidos na fonte** | DARFs de IRRF, ISS retido, contribuições retidas | **Muito alta** |
| **g** | Destinar o patrimônio, na dissolução, a entidade assemelhada (nunca aos associados) | Cláusula estatutária de destinação | Média |
| **h** | Cumprir os demais requisitos fixados em lei | Requisitos setoriais e da certificação | Variável |

> [!IMPORTANT]
> **A alínea "f" é a grande surpresa das auditorias.** A entidade imune **continua obrigada a atuar como fonte pagadora**: retém e recolhe o IRRF dos aluguéis e serviços que paga a pessoas físicas. Deixar de reter é descumprir o art. 12, "f" — ou seja, um dos pilares da própria imunidade, e não uma irregularidade acessória qualquer.

### 2.2 Os cinco artigos que a gestão precisa conhecer

| Artigo | O que regula | Ponto crítico |
|---|---|---|
| **Art. 12** | Requisitos gerais da imunidade | Descumprido **qualquer** item, a imunidade deixa de ser aplicável |
| **Art. 13** | Doações recebidas | Alínea "c" alterada pela **Lei nº 13.204/2015**: beneficiária deve ser OSC da Lei nº 13.019/2014 que cumpra os arts. 3º e 16 da Lei nº 9.790/1999 — **independentemente de certificação** |
| **Art. 14** | **Suspensão** da imunidade | Operacionalizada pelo **art. 32 da Lei nº 9.430/1996**: apurado o fato em processo fiscal, a imunidade fica suspensa |
| **Art. 15** | **Isenção de IRPJ, CSLL e COFINS** | Redação alterada pela LC nº 187/2021; alcança filantrópicas, recreativas, culturais, científicas e associações civis sem fins lucrativos |
| **Art. 22** | Limite das deduções de **pessoas físicas** | Doações (inclusive) limitadas a **6% do imposto de renda devido** |

### 2.3 Exemplo 1 — quanto vale a isenção do art. 15 para uma associação cultural

Uma associação civil cultural sem fins lucrativos apura **superávit de R$ 300.000,00** no exercício.

1. **Situação atual (com o benefício):** a entidade é isenta de IRPJ, CSLL e COFINS pelo **art. 15 da Lei nº 9.532/1997** (item 34 da IN RFB 2.307/2026, preservado pela LC nº 235/2026) → recolhimento sobre o superávit = **R$ 0,00**;
2. **Cenário contrafactual (sem o benefício):** carga aproximada de IRPJ + CSLL sobre o resultado ≈ **34%** →
   - IRPJ/adicional e CSLL somados: 300.000 × 0,34 = **R$ 102.000,00/ano**;
3. **Leitura de gestão:** o benefício equivale a **R$ 102.000,00 por ano** de capacidade de missão — ou a **34% de cada R$ 1,00** de superávit;
4. **Contrapartida:** o mesmo superávit sem escrituração regular ou com remuneração irregular de dirigentes não é "economizado": é **tributo devido + juros + multa**, calculado sobre os exercícios atingidos.

> [!NOTE]
> A isenção do art. 15 **não depende de CEBAS** — ela alcança associações civis e instituições filantrópicas, recreativas, culturais e científicas que atendam às exigências legais. Por isso ela aparece expressamente como "gasto tributário não alcançado pela redução linear" no **item 34** da IN RFB 2.307/2026.

---

## 3. Imunidade previdenciária: CF art. 195, § 7º e LC nº 187/2021

Em termos de economia real, este é o **maior benefício tributário disponível** para ONGs brasileiras — porque a folha de pagamento é o maior custo de quase toda entidade de serviço.

A **CF, art. 195, § 7º** isenta de contribuição para a seguridade social as entidades beneficentes que atendam às exigências estabelecidas em lei. A norma de regência é a **LC nº 187/2021**, que **revogou a Lei nº 12.101/2009** (ementa do art. 47, II).

### 3.1 Os quatro pontos essenciais da LC nº 187/2021

- **Art. 1º — abrangência:** as contribuições dos **incisos I, III e IV do *caput* do art. 195** e do **art. 239 da CF**, relativas à própria entidade, a todas as suas atividades e aos seus empregados e segurados;
- **Art. 3º — requisitos gerais:** vedação à remuneração de dirigentes; aplicação integral das rendas no País; **escrituração segregada** por fonte de recursos; certidões de regularidade; guarda de documentos por 10 anos; auditoria quando acima do limite do art. 3º, II, da LC nº 123/2006; destinação do remanescente a entidade beneficente certificada;
- **Art. 4º — limite:** a imunidade **não se estende a outra pessoa jurídica mantida** pela entidade — filiais, empresas operacionais e mantidas separadas continuam sendo contribuintes;
- **Vedação de campanhas político-partidárias ou eleitorais**, em eco ao art. 16 da Lei nº 9.790/1999.

### 3.2 A folha sem CEBAS: alíquotas do art. 22 da Lei nº 8.212/1991

| Contribuição | Alíquota | Base legal |
|---|---|---|
| Patronal sobre empregados e trabalhadores avulsos | **20%** | Lei nº 8.212/1991, art. 22, I |
| RAT (risco ambiental do trabalho) | **1% (leve), 2% (médio) ou 3% (grave)**, ajustado pelo FAP/AT | Lei nº 8.212/1991, art. 22, II |
| Contribuintes individuais | **20%** | Lei nº 8.212/1991, art. 22, III |
| Cooperativas (execução suspensa) | **15%** | Lei nº 8.212/1991, art. 22, IV |
| Empregador doméstico | **12%** | Lei nº 8.212/1991, arts. 24 e 24º |

> [!NOTE]
> O antigo **art. 55 da Lei nº 8.212/1991** (isenção de 60% para quem atendia o SUS) está **revogado** (MP nº 446/2008 e Lei nº 12.101/2009). Hoje **não existe "benefício de 60%" na previdência**: ou a entidade tem **CEBAS** e a imunidade integral do art. 195, § 7º, ou recolhe normalmente. Se alguém repetir "60%" em palestra ou edital, pergunte a base legal — nasce daí a divergência.

### 3.3 Exemplo 2 — economia da CEBAS sobre a folha (conta completa)

Hospital filantrópico com **folha anual de R$ 1.200.000,00**, classificação de risco **médio** (RAT 2%) e receita de serviços de saúde de R$ 1.200.000,00, com **62% de atendimentos ao SUS**.

**Passo 1 — sem CEBAS:**

- contribuição patronal: 1.200.000 × 20% = **R$ 240.000,00**;
- RAT: 1.200.000 × 2% = **R$ 24.000,00**;
- total anual: 240.000 + 24.000 = **R$ 264.000,00**.

**Passo 2 — com CEBAS vigente:** a imunidade do CF art. 195, § 7º (LC 187/2021, art. 4º) elimina a contribuição patronal sobre a folha da **própria entidade** → **R$ 0,00**.

**Passo 3 — economia bruta:**

- por ano: 264.000 − 0 = **R$ 264.000,00**;
- ao longo de um certificado de **3 anos**: 264.000 × 3 = **R$ 792.000,00**.

**Passo 4 — a contrapartida (gratuidade, art. 12, III):** com SUS ≥ 50%, a gratuidade mínima é de **5%** da receita de serviços de saúde:

- 1.200.000 × 5% = **R$ 60.000,00/ano** (→ 180.000,00 em 3 anos).

**Passo 5 — economia líquida do projeto:**

- por ano: 264.000 − 60.000 = **R$ 204.000,00**;
- em 3 anos: 792.000 − 180.000 = **R$ 612.000,00**.

**Passo 6 — teste de robustez:** mesmo que a gratuidade exigida fosse a máxima (**20%**, hipótese do art. 12, I), o custo seria 1.200.000 × 20% = R$ 240.000,00 e ainda assim restaria economia de 264.000 − 240.000 = **R$ 24.000,00/ano**. A conta, portanto, costuma fechar — o que não elimina o risco de **perder** o certificado no meio do caminho.

### 3.4 O limite que quase ninguém lê: o art. 4º da LC nº 187/2021

> [!IMPORTANT]
> **A imunidade é da entidade certificada, não do grupo.** Se a OSC mantiver uma **outra pessoa jurídica** (consórcio, empresa operadora, filial, sociedade empresária), essa PJ mantida **continua contribuinte** normalmente: o art. 4º da LC nº 187/2021 estende a imunidade à própria entidade, a todas as suas atividades e aos seus empregados e segurados, mas **não se estende a outra PJ mantida**. Antes de montar uma holding ou uma filial, simule a folha dessa PJ sem imunidade.

Adicionalmente, o **art. 149-B, parágrafo único, da CF** (incluído pela EC nº 132/2023) estabelece que IBS e CBS observam as imunidades do art. 150, VI, **não se aplicando a ambos os tributos o disposto no art. 195, § 7º** — ou seja, a isenção de contribuições da seguridade social **não se estende a IBS/CBS**. A leitura desse comando com o art. 9º da LC nº 214/2025 é o objeto da seção 7.

---

## 4. CEBAS: a certificação que abre a porta previdenciária

A **LC nº 187/2021** unificou o regime das entidades beneficentes em três áreas. O CEBAS é certificação setorial de **3 anos**, com renovação de **3 ou 5 anos** conforme a área. Regulamentação: **Decreto nº 11.791, de 21/11/2023** (saúde), MDS (assistência) e MEC/e-CEBAS (educação).

### 4.1 Os três setores lado a lado

| Área | Órgão certificador | Requisito-chave | Gratuidade / demais exigências |
|---|---|---|---|
| **Saúde** | Ministério da Saúde (SAES/DCEBAS) | Contrato/convênio com o gestor do SUS + **≥ 60% de serviços ao SUS** (art. 9º, II) | Gratuidade de 20%/10%/5% (art. 12); apoio ao SUS (art. 14) |
| **Educação** | MEC (e-CEBAS/SERES) | Autorização de funcionamento, dados anuais ao INEP e **bolsas** | Arts. 18 a 20: 1 bolsa integral para cada 5 pagantes |
| **Assistência social** | MDS (CGCEB) | Gratuidade e universalidade; inscrição no Conselho | Art. 31; normas do CNEAS |

### 4.2 CEBAS-Saúde: os números que decidem a certificação

- **≥ 60% de serviços ao SUS**, comprovados **anualmente** (art. 9º, II, e § 5º para o atendimento exclusivamente ambulatorial);
- na **renovação**, se o percentual não foi cumprido no exercício anterior, avalia-se a **média de todo o período de certificação, mínimo 60%**, observado ainda um **piso de 50% em cada ano** (art. 11 e parágrafo único);
- **Portarias GM/MS nº 7.325/2025** e **SAES/MS nº 3.251/2025** (DOU 18/09/2025) confirmam a exigência de 60% e a vigência **01/01/2026 a 31/12/2028**.

**Gratuidade obrigatória (art. 12):**

| Hipótese | Gratuidade mínima | Inciso |
|---|---|---|
| Sem interesse de contratação **ou** SUS < 30% | **20%** da receita de serviços de saúde | art. 12, I |
| SUS ≥ 30% e < 50% | **10%** | art. 12, II |
| SUS ≥ 50% | **5%** | art. 12, III |

### 4.3 Exemplo 3 — quanto custa cada faixa de gratuidade

Entidade com receita de serviços de saúde de **R$ 2.000.000,00**:

1. **55% de atendimentos ao SUS** → art. 12, III → 2.000.000 × 5% = **R$ 100.000,00/ano**;
2. **40% de atendimentos ao SUS** → art. 12, II → 2.000.000 × 10% = **R$ 200.000,00/ano**;
3. **25% de atendimentos ao SUS** → art. 12, I → 2.000.000 × 20% = **R$ 400.000,00/ano**;
4. **diferença entre as hipóteses 1 e 2:** 200.000 − 100.000 = **R$ 100.000,00/ano** — mais do que o custo de uma analista de prestação de contas;
5. **atenção ao requisito de habilitação:** com 40% de SUS a entidade **não** satisfaz o art. 9º (que exige 60%) — nesse cenário a via de habilitação seria o art. 7º, II (serviços gratuitos) ou III (promoção da saúde), com a gratuidade do art. 12, II.

> [!WARNING]
> **CEBAS é obrigação contínua, não diploma de parede.** Perder o percentual mínimo de serviços ao SUS ou de gratuidade derruba a imunidade de IRPJ, CSLL, PIS/COFINS e da contribuição previdenciária patronal **de uma vez só** — sobre um período que a fiscalização pode cobrar retroativamente. A regra de ouro da renovação é a do art. 11: **média do período, mínimo 60%, piso de 50% por ano**. Renovação vencida = certificado novo **antes** do fim da vigência, com os dados anuais em ordem.

### 4.4 Exemplo 4 — a hora H da renovação

Hospital com CEBAS-Saúde em vigor até 31/12/2026, com **62% de atendimentos no último exercício** e **54% no ano anterior**. A diretoria pergunta: "basta o último ano?".

1. **Regra aplicável:** art. 11 da LC nº 187/2021 — se o percentual do exercício anterior não foi cumprido, avalia-se a **média de todo o período de certificação**;
2. **média informada:** (62% + 54%) ÷ 2 = **58%** → **abaixo do mínimo de 60%**;
3. **piso anual:** nenhum ano pode ficar **abaixo de 50%** — 54% cumpre o piso, mas não salva a média;
4. **consequência:** o requerimento de renovação exposto a indeferimento pela média do período;
5. **plano de ação:** (i) elevar o percentual do ano em curso acima de 66% para recompor a média ((66 + 54) ÷ 2 = 60%); (ii) comprovar a gratuidade com **escrituração segregada** (art. 3º, IV); (iii) protocolar a renovação tempestivamente (a LC 187 fala em 360 dias anteriores ao fim do prazo no art. 37).

- **🔢 Você sabia?** A **IN RFB nº 2.335, de 13/07/2026** aprovou os modelos das declarações das OSCs (dispensa de retenção) e **revogou a IN SRF nº 87/1996** — norma que as entidades usavam há três décadas. Apostila que ainda manda "observar a IN SRF 87/1996" está desatualizada desde julho de 2026.

---

## 5. Incentivos ao doador: quanto o doador economiza

A política de captação de uma ONG é, em grande parte, a política de incentivos fiscais de quem doa. Saber calcular o teto de cada doador é o que separa uma campanha realista de uma promessa que a assessoria tributária desmente depois.

### 5.1 Limites de dedução por perfil de doador

| Doador | Benefício | Limite | Base legal |
|---|---|---|---|
| **PJ (geral)** | Dedução da doação na apuração do lucro | **2% do lucro operacional** (antes de computada a dedução) | Lei nº 9.249/1995, art. 13, § 2º, III (red. Lei nº 13.204/2015) |
| **PJ (ensino/pesquisa)** | Dedução adicional | **1,5%** do lucro operacional | Lei nº 9.249/1995, art. 13, § 2º, II (CF art. 213) |
| **PF (geral)** | Dedução de doações a OSC | **6% do IR devido** | Lei nº 9.532/1997, arts. 12 e 22 |
| **PF (PRONON/PRONAS)** | Deduções aprovadas | soma dos incisos I a IV ≤ **12% do IR devido** | Lei nº 9.250/1995, art. 12, VIII e § 1º |
| **PF (Rouanet, art. 18)** | 100% do valor investido em projeto aprovado | teto usual: PF **6%** / PJ **4%** do IR devido | Lei nº 8.313/1991, art. 18 |
| **PF (Rouanet, art. 26)** | **80% das doações e 60% dos patrocínios** | PJ: 40% doações / 30% patrocínios, com teto anual do Executivo | Lei nº 8.313/1991, art. 26 |
| **PF/PJ (esporte)** | Doações e patrocínios esportivos | legislação específica | Leis nº 9.615/1998 e nº 11.484/2007 |

### 5.2 Exemplo 5 — doação de PJ a ONG (IRPJ/CSLL), passo a passo

Empresa com **lucro operacional de R$ 1.000.000,00** doa **R$ 40.000,00** a associação sem fins lucrativos qualificada no MROSC.

1. **Limite legal:** 2% × 1.000.000 = **R$ 20.000,00** (Lei nº 9.249/1995, art. 13, § 2º, III);
2. **dedução efetiva:** **R$ 20.000,00** — os outros R$ 20.000,00 da doação **não** são dedutíveis;
3. **economia tributária:** 20.000 × 34% (alíquota combinada aproximada de IRPJ + CSLL) = **R$ 6.800,00**;
4. **custo líquido da empresa:** 40.000 − 6.800 = **R$ 33.200,00** → ou seja, **83% da doação sai do bolso** da empresa;
5. **simulação conservadora com a redução linear (LC nº 224/2025, art. 4º, § 4º, III):** a redução de base passa a valer por 90% → 18.000 dedutíveis → economia 18.000 × 34% = **R$ 6.120,00** → diferença de **R$ 680,00** em relação à conta nominal;
6. **o que oferecer ao doador:** o item certo não é "sua doação é dedutível", e sim "**até 2% do seu lucro operacional**" — com a ressalva da redução linear de 2026 confirmada com a assessoria tributária.

> [!NOTE]
> Pelo **art. 13, VI, da Lei nº 9.249/1995**, a pessoa jurídica **não pode deduzir outras doações** — só as enquadradas nos §§ 2º (2% e 1,5%). E pelo **art. 84-B da MROSC** (incluído pela Lei nº 13.204/2015), a OSC pode receber **doações de empresas de até 2% da receita bruta do doador** e bens móveis irrecuperáveis, apreendidos, abandonados ou disponíveis administrados pela RFB — **independentemente de certificação**, desde que enquadrada em **ao menos uma das finalidades do art. 84-C**, que **veda** campanhas político-partidárias ou eleitorais (parágrafo único).

### 5.3 Exemplo 6 — doação de PF: o teto de 6% do IR devido

Pessoa física com **imposto de renda devido de R$ 2.000,00** doa **R$ 5.000,00** a projeto cultural aprovado pelo Ministério da Cultura (Lei nº 8.313/1991, art. 18 — 100% do valor investido).

1. **teto praticado:** 6% × 2.000 = **R$ 120,00** de dedução;
2. **imposto após a dedução:** 2.000 − 120 = **R$ 1.880,00**;
3. **custo líquido da doação:** 5.000 − 120 = **R$ 4.880,00** → **97,6%** do valor doado sai do bolso do doador;
4. **se enquadrado no art. 26:** primeiro se aplica o percentual — 80% × 5.000 = **R$ 4.000,00** de doação "apurada" — e **depois** o mesmo teto de R$ 120,00; a ordem importa, mas o resultado é o mesmo: **R$ 120,00**;
5. **soma de incentivos:** combinando PRONON/PRONAS e demais itens, a soma das deduções continua limitada pelos dispositivos da Lei nº 9.532/1997 (arts. 12 e 22) e pelo **§ 1º do art. 12 da Lei nº 9.250/1995** (soma dos incisos I a IV ≤ 12% do IR devido);
6. **simulação com a redução linear de 10% (2026):** teto efetivo conservador de 6% × 90% = **5,4%** → 5,4% × 2.000 = **R$ 108,00** → IR = **R$ 1.892,00** (diferença de R$ 12,00 sobre o cenário nominal).

**Leitura prática para a captação:** quanto **menor** o IR devido do doador, **menor** o incentivo — o teto é percentual sobre o imposto, não sobre o valor doado. Uma campanha de PF para doadores de baixo IR promete pouco; o desenho de campanha deve considerar isso antes de fixar metas.

### 5.4 Exemplo 7 — Rouanet art. 26: 80% das doações e 60% dos patrocínios

Um doador **pessoa física** investe **R$ 10.000,00** em projeto cultural aprovado pelo MinC, enquadrado no **art. 26** da Lei nº 8.313/1991, com teto anual de 6% do IR devido de **R$ 3.000,00**.

1. **hipótese de doação:** 80% × 10.000 = **R$ 8.000,00** apurados;
2. **hipótese de patrocínio:** 60% × 10.000 = **R$ 6.000,00** apurados;
3. **em ambos os casos, o teto anual limita a dedução:** quanto o doador deduz é o **menor** entre o valor apurado e o teto de R$ 3.000,00 → **dedução de R$ 3.000,00**;
4. **resultado:** do R$ 10.000,00 doado, o doador recupera **30%** em tributos; a entidade recebe **R$ 10.000,00** integrais;
5. **para a PJ (lucro real), os percentuais são menores:** 40% das doações e 30% dos patrocínios, com teto anual fixado pelo Executivo.

---

## 6. A redução linear de 10% (LC nº 224/2025) e o que ficou preservado

A **LC nº 224, de 26/12/2025** determinou **redução linear de 10%** de todos os gastos tributários e incentivos federais: isenções, alíquotas zero/reduzidas, reduções de base, créditos presumidos, regimes especiais por receita e bases presumidas.

- **Art. 4º, § 1º:** alcança PIS/PASEP, COFINS, IRPJ, CSLL, II, IPI e contribuição previdenciária patronal;
- **Art. 4º, § 2º:** alcança os gastos tributários do Anexo da LOA/2026 e os regimes de tributação;
- **Efeitos (art. 14):** os dispositivos gerais valem de **1º/1/2026**; o art. 4º vale do **1º dia do 4º mês** subsequente à publicação.

### 6.1 Como a redução é aplicada (art. 4º, § 4º)

| Hipótese de benefício | Regra da redução |
|---|---|
| Isenção ou alíquota zero | A alíquota passa a ser **10% da alíquota padrão** |
| Alíquota reduzida | 90% da alíquota reduzida + 10% da alíquota padrão |
| Redução de base de cálculo | Mantém-se **90% da redução** |
| Créditos presumidos / creditícios | Mantém-se 90% do benefício |
| Redução do tributo devido | Mantém-se 90% |
| Regimes por % de receita (lucro presumido, REIQ etc.) | Parâmetro aumentado em 10% |
| Bases presumidas | Aumento de 10% (§ 5º: parcela que exceder R$ 5 milhões/ano no lucro presumido) |

### 6.2 Exceções do art. 4º, § 8º — onde as OSCs estão

| Inciso | Exceção |
|---|---|
| **I** | Imunidades constitucionais |
| **V** (redação da **LC nº 235, de 27/08/2026**) | Incentivos e benefícios de PJ sem fins lucrativos previstos no **art. 15 da Lei nº 9.532/1997** e no **art. 13, IV, e art. 14, X da MP nº 2.158-35/2001** |
| **VII** | Benefícios com teto quantitativo global |
| **IX** | Prouni |
| **XII** | CPRB |
| **XIII** | TIC |

A redação anterior do inciso V citava as **Leis nº 9.790/1999 (OSCIP) e nº 9.637/1998 (OS)**; a **LC nº 235/2026** passou a citar o **art. 15 da Lei nº 9.532/1997** — leitura que os escritórios de advocacia tributária fazem como **preservação da isenção de IRPJ/CSLL/COFINS das OSCs**. A ementa da LC nº 235/2026 versa sobre renúncias de receita por choque de energia, fertilizantes e Copa 2027, mas alterou especificamente esse § 8º, V.

**Regulamentação:** Decreto nº 12.808, de 29/12/2025; Portaria MF nº 3.278, de 31/12/2025; IN RFB nº 2.305, de 31/12/2025 (alterada pela **IN RFB nº 2.307, de 20/02/2026**, DOU 23/02/2026, Ed. 35, Seção 1, p. 100).

### 6.3 A lista oficial do que NÃO foi reduzido (IN RFB nº 2.307/2026)

| Item | Gasto tributário preservado | Fundamento citado |
|---|---|---|
| **1** | Isenção de PIS/PASEP das entidades beneficentes | CF art. 195, § 7º; Lei nº 12.101/2009; Decreto nº 8.242/2014 |
| **2** | Isenção da contribuição previdenciária patronal das entidades beneficentes | CF art. 195, § 7º; LC nº 187/2021 |
| **14 e 15** | Prouni | Lei nº 11.096/2005 |
| **31 e 33** | Previdência privada fechada | legislação específica |
| **34** | Isenção de IRPJ, CSLL e COFINS de instituições filantrópicas, recreativas, culturais e científicas e de associações civis sem fins lucrativos | **Art. 15 da Lei nº 9.532/1997** |

> [!WARNING]
> **A IN RFB nº 2.307/2026 revogou o item 26** do anexo anterior (IN RFB nº 2.305/2025), que tratava das **doações de terceiros (PF/PJ) a OSC**. Consequência: as **deduções de doações a OSC passaram a ser alcançadas pela redução linear de 10%** em 2026 — a Receita confirmou nas Perguntas e Respostas de 12/02/2026 e na notícia oficial de 23/02/2026. Quem captava com a promessa de "doação 100% dedutível" precisa revisar a narrativa **antes** de publicar material novo. Em contrapartida, a **isenção do art. 15** permanece na lista dos itens não alcançados (item 34). O **PLC nº 11/2026**, que restringiria o art. 4º, § 8º, V da LC nº 224/2025, estava em tramitação no momento desta pesquisa.

- **🔢 Você sabia?** A **LC nº 227, de 13/01/2026** (DOU 14/01/2026) instituiu o **Comitê Gestor do Imposto sobre Bens e Serviços (CGIBS)**, disciplinou o processo administrativo tributário do IBS, a distribuição da arrecadação e normas gerais de ITCMD, além de alterar a própria LC nº 214/2025. Por isso toda citação de artigo da LC nº 214/2025 deve ser conferida **na redação atualizada**, e não no texto original de janeiro de 2025.

### 6.4 O que isso muda na conversa com o doador

| Mensagem antiga | Mensagem correta para 2026 |
|---|---|
| "Sua doação é 100% dedutível" | "Sua doação pode deduzir **até 2% do lucro operacional** (PJ) ou **6% do IR devido** (PF), observados a redução linear de 10% de 2026 e a orientação da sua assessoria" |
| "Somos OSCIP, então temos benefício fiscal" | OSCIP é **qualificação de parceria**; o benefício de IRPJ/CSLL/COFINS vem do **art. 15 da Lei nº 9.532/1997** |
| "Somos imunes, não pagamos nada" | A imunidade é **condicionada** (art. 12) e **não cobre as compras** no sistema IBS/CBS (LC nº 214/2025, art. 9º, § 4º) |
| "Temos CEBAS, então não temos obrigações" | CEBAS **exige** gratuidade segregada, comprovação anual de SUS e renovação tempestiva |

---

## 7. Reforma tributária: linha do tempo e o IBS/CBS no orçamento da OSC

A **EC nº 132/2023** instituiu o **IBS** e a **CBS** e extinguiu PIS/PASEP e COFINS **a partir de 1º/1/2027**, na forma da **LC nº 214/2025**. 2026 é o ano-pivô: último ano do sistema atual e ano de teste do novo.

### 7.1 Linha do tempo (2023–2033)

```text
2023 ─ EC 132/2023 .......... IBS e CBS instituídos; fim do PIS/COFINS
                               previsto para 1º/1/2027
  │
2025 ─ LC 214/2025 (16/01) .. regras gerais, imunidade (art. 9º) e transição
  │    LC 224/2025 (26/12) .. redução linear de 10% dos incentivos federais
  │
2026 ─ ANO-PIVÔ ............. último ano do PIS/COFINS (até 31/12/2026)
  │    · teste de alíquotas na NF-e: CBS 0,9% + IBS 0,1% (sem recolhimento)
  │      (LC 214/2025, art. 408, § 1º; NT SEFAZ 2025.002)
  │    · LC 227/2026 (CGIBS) · Decreto 12.955/2026 (CBS) · LC 235/2026
  │    · IN RFB 2.307/2026 (lista do que NÃO foi reduzido)
  │    · IN RFB 2.335/2026 (modelos de declarações de OSCs)
  │    · ECD 30/06 · ECF 31/07 · DCTFWeb mensal · eSocial
  │    · PLC 45/2026 (consolidação do IBS/CBS) em tramitação
  │
2027 ─ CBS passa a ser cobrada; PIS/PASEP e COFINS extintos
  │
2029 ─ piso da não-cumulatividade · início da transição do ICMS/ISS
  │    ISS com redução de 10% (LC 116/2003, art. 8-B)
2030 ─ ISS com redução de 20%
2031 ─ ISS com redução de 30%
2032 ─ fim da transição de ICMS/ISS · ISS com redução de 40%
  │
2033 ─ plenitude do novo sistema (teto de 26,5%)
```

**Tabela da linha do tempo:**

| Ano | Marco normativo | O que muda para a OSC |
|---|---|---|
| **2023** | EC nº 132/2023 | Cria IBS e CBS; art. 149-B, parágrafo único: IBS/CBS observam o art. 150, VI, **não se aplicando o art. 195, § 7º** |
| **2025** | LC nº 214/2025 (16/01) | Imunidade das OSC no art. 9º (III, §§ 3º e 4º); regras de crédito (arts. 47 a 57); arts. 378, 381 e 408, § 1º |
| **2025** | LC nº 224/2025 (26/12) | Redução linear de 10% dos gastos tributários federais, com exceções do art. 4º, § 8º |
| **2026** | Ano de teste | PIS/COFINS até **31/12/2026**; destaque de CBS 0,9% e IBS 0,1% na NF-e **sem recolhimento** |
| **2026** | LC nº 227/2026 (13/01) | Institui o **CGIBS**; processo administrativo do IBS; altera a LC nº 214/2025 |
| **2026** | Decreto nº 12.955/2026 (29/04) | **Regulamenta a CBS** (DOU 30/04/2026) — normas de incidência, base, créditos e documentos fiscais |
| **2026** | LC nº 235/2026 (27/08) | Redestina o art. 4º, § 8º, V, da LC nº 224/2025 preservando o art. 15 da Lei nº 9.532/1997 |
| **2027** | Início da CBS | PIS/COFINS extinguem-se; créditos escriturados até 31/12/2026 seguem os arts. 378 e 381 da LC nº 214/2025 |
| **2029–2032** | Transição de ICMS/ISS | ISS com reduções de 10%, 20%, 30% e 40% (LC nº 116/2003, art. 8-B) |
| **2033** | Plenitude | Sistema completo, com **teto de 26,5%** |

### 7.2 Exemplo 8 — teste de alíquotas de 2026: como ler a NF-e

Em 2026 a NF-e traz o **destaque** de CBS e IBS **sem recolhimento** (LC nº 214/2025, art. 408, § 1º; NT SEFAZ 2025.002). Uma ONG imune emite uma nota de serviços de **R$ 40.000,00** e recebe uma nota de compra de material de escritório no mesmo valor:

| Lançamento | Cálculo | Valor |
|---|---|---|
| Destaque de **CBS** (0,9%) | 40.000 × 0,009 | **R$ 360,00** |
| Destaque de **IBS** (0,1%) | 40.000 × 0,001 | **R$ 40,00** |
| Total destacado na nota | 360 + 40 | **R$ 400,00** |
| **Recolhimento exigido em 2026** | teste, sem exigência | **R$ 0,00** |
| **Crédito da entidade imune** | art. 9º, § 4º (aquisições) | **R$ 0,00** |

Se a entidade emitir NF-e de serviços ao longo de todo 2026 no total de **R$ 240.000,00**, o destaque anual somado será de 240.000 × 1% = **R$ 2.400,00** (CBS: R$ 2.160,00; IBS: R$ 240,00) — **sem recolhimento**, e **sem direito a crédito** sobre as aquisições.

**Tabela das alíquotas de teste e do regime em transição:**

| Tributo / parâmetro | Alíquota ou valor em 2026 | Base normativa | Efeito na ONG |
|---|---|---|---|
| **CBS (destaque)** | **0,9%** | LC nº 214/2025, art. 408, § 1º; NT SEFAZ 2025.002 | Apenas destaque na NF-e, sem recolhimento |
| **IBS (destaque)** | **0,1%** | idem | Apenas destaque na NF-e, sem recolhimento |
| **PIS/PASEP** | Regime vigente até **31/12/2026** | EC nº 132/2023; LC nº 214/2025 | Último ano de apuração |
| **COFINS** | Regime vigente até **31/12/2026** | idem | Último ano de apuração |
| **ISS** | Entre **2% e 5%** | LC nº 116/2003, arts. 8, II, e 8-A | Alíquota mínima de 2% (red. LC 214/2025), com exceções dos subitens 7.02, 7.05 e 16.01 |
| **RAT (previdência)** | 1%, 2% ou 3% | Lei nº 8.212/1991, art. 22, II | Zero com CEBAS |
| **Teto do sistema em 2033** | **26,5%** | EC nº 132/2023; LC nº 214/2025 | Parâmetro máximo do novo sistema |

### 7.3 O art. 9º da LC nº 214/2025: a imunidade no novo sistema

O art. 9º da LC nº 214/2025 declara imunes ao IBS e à CBS os fornecimentos realizados, entre outros, por **partidos políticos, entidades sindicais dos trabalhadores e instituições de educação e de assistência social sem fins lucrativos** (inciso III), com duas balizas:

- **§ 3º:** a imunidade do inciso III aplica-se **exclusivamente** às pessoas jurídicas sem fins lucrativos que cumpram, **de forma cumulativa**, os requisitos do **art. 14 do Código Tributário Nacional** (não distribuir parcela do patrimônio ou das rendas; aplicar integralmente, no País, os recursos na manutenção dos objetivos institucionais; manter escrituração de receitas e despesas);
- **§ 4º:** as imunidades dos incisos I a III **não se aplicam às suas aquisições** de bens materiais e imateriais, inclusive direitos, e serviços.

> [!WARNING]
> **Art. 9º, § 4º — a armadilha orçamentária da década.** A imunidade cobre as **saídas** da entidade, **não as compras**: o material, a locação, o software, a manutenção, os honorários e o mobiliário que a ONG adquire **continuam sujeitos ao IBS/CBS** — e, como a entidade imune está fora do regime regular (não tem débito a compensar), **não há crédito a tomar**. Na prática, o tributo das compras vira **custo crescente embutido no preço do fornecedor**. Orçamento que não abrir uma linha específica para isso descobrirá o descompasso no fechamento do exercício. Atenção: essa é a leitura dominante do dispositivo e ela **ainda é controversa** quanto à constitucionalidade — acompanhe a tramitação antes de qualquer tese em peça.

### 7.4 Exemplo 9 — impacto do IBS/CBS no orçamento da OSC

OSC imune com **compras anuais de R$ 1.200.000,00** (material de limpeza, locação, manutenção, software, mobiliário e serviços terceirizados), ou seja, **R$ 100.000,00 por mês**.

**Passo 1 — o que acontece em 2026 (ano de teste):**

- CBS destacada: 1.200.000 × 0,9% = **R$ 10.800,00**;
- IBS destacado: 1.200.000 × 0,1% = **R$ 1.200,00**;
- total destacado: **R$ 12.000,00**, **sem recolhimento** e **sem crédito**.

**Passo 2 — regra a partir da plenitude (art. 9º, § 4º):** cada R$ 100.000,00 mensais de compras passam a carregar o tributo **como custo**, sem contrapartida de crédito. Regra de bolso: **cada 1 p.p. de alíquota combinada = R$ 1.000,00/mês = R$ 12.000,00/ano**.

**Passo 3 — cenários de sensibilidade sobre R$ 1.200.000,00 de compras:**

| Alíquota combinada hipotética (CBS + IBS) | Custo adicional anual | % da economia previdenciária de R$ 264.000,00 (Exemplo 2) |
|---|---|---|
| 6,0% | 1.200.000 × 0,06 = **R$ 72.000,00** | 27,3% |
| 8,0% | 1.200.000 × 0,08 = **R$ 96.000,00** | 36,4% |
| 10,0% | 1.200.000 × 0,10 = **R$ 120.000,00** | 45,5% |
| 12,0% | 1.200.000 × 0,12 = **R$ 144.000,00** | 54,5% |
| 26,5% (**teto do sistema**) | 1.200.000 × 0,265 = **R$ 318.000,00** | 120,5% |

**Passo 4 — conclusão de planejamento:** num cenário de 12%, o custo adicional das compras (R$ 144.000,00) consome **mais da metade** da economia previdenciária obtida com o CEBAS (R$ 264.000,00); no teto de 26,5%, **ultrapassa** essa economia. As decisões de captação, de reajuste de contratos e de compra centralizada passam, portanto, a ter peso fiscal direto.

**Passo 5 — ações recomendadas:**

1. abrir **linha orçamentária própria** para "tributos embutidos em compras" a partir de 2027;
2. negociar **preço líquido e cláusula de reajuste** nos contratos de longo prazo;
3. centralizar compras para **ganhar escopo de negociação** com fornecedores;
4. revisar anualmente o **mix de fornecedores** (contribuintes × não contribuintes) antes da assinatura;
5. conferir com a assessoria as hipóteses de redução, alíquota zero e regimes específicos da LC nº 214/2025 aplicáveis aos insumos da entidade.

> [!NOTE]
> **Créditos de PIS/COFINS escriturados até 31/12/2026** só se aproveitam se obedecidos os **arts. 378 e 381 da LC nº 214/2025**. O fechamento contábil de 2026 é, por isso, o mais importante da década para o terceiro setor: é nele que se fixa o saldo que atravessa a transição.

- **🔢 Você sabia?** O **Decreto nº 12.955, de 29/04/2026** (DOU 30/04/2026) **regulamenta a CBS** — mais de 600 artigos sobre incidência, base de cálculo, créditos, regimes diferenciados, documentos fiscais e fiscalização — e foi alterado pelo **Decreto nº 13.075, de 21/07/2026**. A obrigatoriedade de inscrição em CNPJ e de emissão de documentos fiscais para pessoas físicas e produtores rurais produz efeitos **a partir de 1º/1/2027**.

### 7.5 ISS: a parte que cabe ao município (LC nº 116/2003)

| Regra | Conteúdo |
|---|---|
| Alíquota máxima | **5%** (art. 8, II) |
| Alíquota mínima | **2%** (art. 8-A, red. LC nº 214/2025), excetuando os subitens 7.02, 7.05 e 16.01 |
| Redução transitória | **10% em 2029, 20% em 2030, 30% em 2031 e 40% em 2032** (art. 8-B) |
| Imunidade de livros, jornais, periódicos e papel | **Constitucional** — CF art. 156, § 6º, I (não está na LC nº 116/2003) |
| Responsabilidade de imune/isenta | Responde como **responsável** nas retenções (art. 6º, II) |
| Não incidência | Art. 2 |

> [!NOTE]
> **A imunidade de livros, jornais, periódicos e do papel destinado à sua impressão é constitucional** (CF art. 156, § 6º, I) e aparece também no **art. 9º, IV, da LC nº 214/2025** para o IBS/CBS. Quem cita "LC 116/2003" como fonte dessa imunidade está citando o diploma errado — ele trata de ISS e não reproduz o dispositivo constitucional.

---

## 8. Obrigações acessórias de 2026 e contabilidade da OSC

Imune e isenta **também declara**. O equívoco mais caro do setor é tratar imunidade como dispensa de obrigação acessória.

### 8.1 O calendário de 2026

| Obrigação | Prazo em 2026 | Norma | Observação |
|---|---|---|---|
| **ECD** (ano-calendário 2025) | **30/06/2026** | IN RFB nº 2.003/2021 (red. IN nº 2.142/2023) | Último dia útil de junho |
| **ECF** (ano-calendário 2025) | **31/07/2026** | IN RFB nº 2.004/2021 | **Obrigatória também para PJs imunes e isentas** |
| **DCTFWeb** | Último dia útil do mês seguinte (ex.: **30/06/2026** para maio/2026) | IN RFB nº 2.237/2024, art. 6º (red. IN RFB nº 2.248/2025) | IRPJ, CSLL, PIS, COFINS e previdenciárias retidas |
| **EFD-Contribuições** | ~15º dia útil do mês seguinte | IN RFB nº 2.121/2022 | Últimos meses do PIS/COFINS |
| **eSocial / folha** | até o dia 15 | Portal eSocial | Eventos periódicos |
| **Declarações de OSCs (dispensa de retenção)** | conforme o modelo da norma vigente | **IN RFB nº 2.335, de 13/07/2026** | **Revogou a IN SRF nº 87/1996** |

**Como montar o próprio calendário (método em 5 passos):**

1. **liste as obrigações** da tabela acima e as específicas da área (CEBAS, MROSC, Conselho de classe);
2. **marque o responsável** por obrigação — uma pessoa, não um departamento;
3. **calcule o "D-10"**: cada prazo ganha um alerta interno de 10 dias úteis antes;
4. **alinhe com o fechamento contábil**: ECD e ECF dependem de livros fechados;
5. **reconduza a revisão em fevereiro** de cada ano, quando a Receita publica a agenda tributária.

### 8.2 Contabilidade do terceiro setor: ITG 2002 (R1)

Pela **ITG 2002 (R1)** (Resolução CFC nº 1.409/2012, com revisão de 21/08/2015):

- **item 8:** **regime de competência** obrigatório (não existe "regime de caixa" opcional para OSC);
- **item 9:** doações e subvenções são reconhecidas **no resultado** (NBC TG 07);
- **item 9A:** só subvenções particulares recebidas **a pedido** seguem a NBC TG 07;
- **itens 22 a 25:** BP, DRE, DMPL, DFC — doações classificadas em fluxos **operacionais** — e notas;
- **item 24:** gratuidade e serviço voluntário devem ser **destacados na DRE**;
- **item 27:** a **renúncia fiscal deve ser divulgada nas notas explicativas**.

### 8.3 Exemplo 10 — a renúncia fiscal nas notas explicativas

A entidade do Exemplo 2 (hospital, folha de R$ 1.200.000,00, CEBAS vigente) fecha o exercício com superávit de **R$ 300.000,00**. A demonstração e as notas devem tornar visível o que o Estado deixou de arrecadar:

| Componente da renúncia | Cálculo | Valor divulgado |
|---|---|---|
| Imunidade previdenciária (CF art. 195, § 7º; LC 187/2021, art. 4º) | 1.200.000 × (20% + 2%) | **R$ 264.000,00** |
| Isenção de IRPJ/CSLL/COFINS (Lei nº 9.532/1997, art. 15) | 300.000 × 34% | **R$ 102.000,00** |
| **Total de renúncia fiscal divulgado nas notas** | 264.000 + 102.000 | **R$ 366.000,00** |

**Passos de escrituração:**

1. registrar a gratuidade e o serviço voluntário **em rubrica própria** na DRE (item 24), exigência que ecoa o art. 3º, IV, da LC nº 187/2021;
2. classificar as doações recebidas em **fluxos operacionais** na DFC (item 25);
3. **divulgar nas notas** o valor da renúncia fiscal, com a base legal de cada benefício (item 27);
4. manter a **escrituração segregada** por fonte de recursos por 10 anos (art. 3º, VI, da LC nº 187/2021);
5. cruzar o número divulgado com o **anexo de gastos tributários** da LOA — a nota e o anexo devem ser coerentes entre si.

> [!IMPORTANT]
> **A nota explicativa é o elo entre contabilidade e tributário.** Entidade que não divulga a renúncia fiscal quebra a ITG 2002 (R1) e, simultaneamente, entrega à fiscalização um mapa do que ela deixou de pagar. Transparência bem feita é defesa: quando o número é consistente com a base legal, ele protege; quando falta, ele é preenchido pelo autuador.

- **🔢 Você sabia?** Pela ITG 2002 (R1), a entidade sem fins lucrativo **não pode** optar por regime de caixa: o regime de competência é obrigatório (item 8), e por isso uma doação prometida em dezembro e recebida em janeiro pertence ao exercício da promessa. Isso muda o modo como metas de captação são planejadas.

---

## 9. Casos resolvidos e roteiro de decisão

**Caso 1 — a associação cultural que quer captar de empresas.**
Meta de R$ 300.000,00 em doações empresariais. A proposta comercial correta combina três camadas: (i) dedução de até **2% do lucro operacional** do doador (Lei nº 9.249/1995, art. 13, § 2º, III); (ii) recebimento qualificado pelo **art. 84-B da MROSC** (até 2% da receita bruta do doador); e (iii) a isenção do **art. 15 da Lei nº 9.532/1997** que a própria entidade goza. Como as deduções de doações sofreram a **redução linear de 10%** em 2026 (revogação do item 26 pela IN RFB nº 2.307/2026), a assessoria tributária recalcula o incentivo **antes** de qualquer material publicitário. **Conta de referência:** uma empresa com lucro operacional de R$ 1.500.000,00 deduz 2% = R$ 30.000,00 → economia ≈ 30.000 × 34% = **R$ 10.200,00** → custo líquido de R$ 19.800,00 sobre R$ 30.000,00 doados.

**Caso 2 — a OSC de assistência com folha pesada, sem CEBAS.**
40 funcionários, folha anual de **R$ 1.500.000,00**, sem certificação. Custo previdenciário: 1.500.000 × 20% = R$ 300.000,00 + RAT 2% = R$ 30.000,00 → **R$ 330.000,00/ano**. Com o CEBAS-MDS (gratuidade e universalidade, LC nº 187/2021, art. 31), a imunidade do art. 195, § 7º zera essa conta. **Prazo de retorno:** se o custo do processo de certificação (assessoria, sistemas, segregação contábil) for de R$ 60.000,00, o retorno se dá em 60.000 ÷ 330.000 = **0,18 ano ≈ 2 meses de folha** — desde que a entidade mantenha a escrituração segregada e comprove a gratuidade.

**Caso 3 — a entidade imune que descobre o art. 9º, § 4º.**
A mesma OSC planeja 2027 com compras de R$ 1.200.000,00 e nenhuma linha de "tributo embutido". Pelo Exemplo 9, num cenário de 10% a surpresa é de **R$ 120.000,00/ano**. O plano de contingência correto: (i) reabrir o orçamento em novembro de 2026; (ii) reajustar contratos com cláusula de tributos; (iii) simular a compra de ativo imobilizado **antes** e **depois** da plenitude; (iv) revisar o mix de fornecedores.

**Caso 4 — o contribuinte que esquece a retenção.**
A entidade paga R$ 8.000,00/mês de aluguel a pessoa física e não retém IRRF. Além da pendência financeira, ela descumpre o **art. 12, "f", da Lei nº 9.532/1997** — requisito da própria imunidade —, ficando exposta à suspensão do art. 14 e ao art. 32 da Lei nº 9.430/1996. A **solução** é imediata: apurar as retenções dos últimos 5 anos (prazo do art. 12, "d"), recolher com os acréscimos legais e instituir o controle mensal de retenções no fechamento.

```text
ROTEIRO DE DECISÃO FISCAL — RESUMO EM 6 PERGUNTAS
═══════════════════════════════════════════════════
 1. A receita é do objeto? ........ sim -> imunidade (Lei 9.532, art. 12)
                                      nao -> tributacao normal
 2. Ha folha? ..................... sim -> 20% + RAT (Lei 8.212, art. 22)
                                      sim + CEBAS -> R$ 0 (LC 187, art. 4o)
 3. Ha doador PF/PJ? .............. sim -> 6% do IR / 2% do lucro
 4. Ha doacao de empresa? ......... sim -> 2% do lucro operacional
                                     (Lei 9.249, art. 13, § 2º, III)
                                     + 2% da receita bruta (art. 84-B)
 5. O orcamento preve IBS/CBS? .... sim -> manter linha propria
                                     (LC 214/2025, art. 9º, § 4º)
                                     nao -> abrir ate 31/12/2026
 6. As obrigacoes estao em dia? ... sim -> imunidade defensavel
                                     nao -> regularizar antes de qualquer
                                           defesa ou captação
```

O roteiro não substitui o parecer: ele mostra **qual pergunta fazer primeiro** e **onde o custo costuma aparecer**. As quatro respostas que mais mudam o orçamento são (i) a folha sem CEBAS, (ii) a imunidade suspensa pela alínea "f", (iii) a perda do percentual de SUS no ano de renovação e (iv) o IBS/CBS embutido nas compras.

---

## 10. Retenções na fonte: o art. 12, "f" na prática

A entidade imune **é fonte pagadora**. Ela não recolhe IRPJ/CSLL sobre a renda ligada ao objeto, mas continua obrigada a **reter e recolher** os tributos devidos por terceiros — e a prova disso é o que a fiscalização confere primeiro.

### 10.1 Quem retém o quê

| Pagamento feito pela ONG | O que deve ser retido | Base legal | Se esquecer |
|---|---|---|---|
| **Aluguel a pessoa física** | IRRF pela tabela progressiva mensal (com o redutor de 2026) | Lei nº 9.250/1995; IN RFB nº 1.500/2014, art. 22, VI | Descumprimento da **alínea "f" do art. 12** da Lei nº 9.532/1997 — risco para a própria imunidade |
| **Salários, 13º e aviso** | IRRF pela tabela progressiva (com o redutor de 2026) | Lei nº 9.250/1995; Lei nº 15.270/2025 | Passivo fiscal e trabalhista |
| **Serviços prestados por PJ** (quando a ONG é responsável) | ISS retido | LC nº 116/2003, art. 6º, II | Multa e correção pelo município |
| **Pagamento a contribuinte individual** | Contribuição previdenciária retida na fonte | Lei nº 8.212/1991 | INSS retido não recolhido = débito da própria entidade |
| **Retenções de IRPJ, CSLL, PIS e COFINS na fonte** | Recolhimento e informe pela **DCTFWeb** | IN RFB nº 2.237/2024 (red. IN RFB nº 2.248/2025) | Omissão no informe é autuada como não declaração |

### 10.2 A tabela de 2026 e o redutor da Lei nº 15.270/2025

Desde **1º/1/2026** convivem **duas tabelas**: a progressiva tradicional (que permaneceu com os mesmos valores de 2025) e a **tabela de redução** instituída pela **Lei nº 15.270, de 26/11/2025** (art. 2º, que incluiu o art. 3º-A na Lei nº 9.250/1995).

**Tabela progressiva mensal:**

| Base de cálculo mensal | Alíquota | Parcela a deduzir |
|---|---|---|
| Até R$ 2.428,80 | — | — |
| De R$ 2.428,81 até R$ 2.826,65 | 7,5% | R$ 182,16 |
| De R$ 2.826,66 até R$ 3.751,05 | 15% | R$ 394,16 |
| De R$ 3.751,06 até R$ 4.664,68 | 22,5% | R$ 675,49 |
| Acima de R$ 4.664,68 | 27,5% | R$ 908,73 |

**Tabela de redução (a partir de janeiro de 2026):**

| Rendimentos tributáveis sujeitos à incidência mensal | Redução do imposto |
|---|---|
| Até R$ 5.000,00 | Até **R$ 312,89** — de modo que o imposto devido seja **zero** |
| De R$ 5.000,01 até R$ 7.350,00 | **R$ 978,62 − (0,133145 × rendimentos)** — redução decrescente, que zera a partir de R$ 7.350,00 |
| Acima de R$ 7.350,00 | **Sem redução** |

> [!NOTE]
> O **§ 1º do art. 3º-A** da Lei nº 9.250/1995 (red. Lei nº 15.270/2025) limita a redução ao **valor do imposto apurado**: o redutor **não gera imposto negativo nem restituição**. Há tabela anual equivalente para a declaração: rendimentos de até **R$ 60.000,00/ano** têm redução de até **R$ 2.694,15** (zerando o imposto) e de R$ 60.000,01 a R$ 88.200,00 a fórmula é **R$ 8.429,73 − (0,095575 × renda anual)**.

### 10.3 Exemplo 11 — o IRRF do aluguel pago pela ONG (três cenários)

A ONG ocupa um imóvel alugado de uma pessoa física, paga aluguéis em três valores distintos e precisa saber quanto retém em 2026.

**Cenário A — aluguel de R$ 3.500,00:**

1. **tabela progressiva:** faixa de 15% (de R$ 2.826,66 a R$ 3.751,05) → 3.500 × 15% = **R$ 525,00** − 394,16 = **R$ 130,84**;
2. **redutor (até R$ 5.000,00):** a redução alcança até R$ 312,89, "de modo que o imposto devido seja zero" → 130,84 < 312,89 → redução limitada ao imposto;
3. **IRRF devido: R$ 0,00/mês** → economia anual de 130,84 × 12 = **R$ 1.570,08**;
4. **registro:** a fonte mantém o controle da operação e informa o rendimento — a redução é **mensal** e não dispensa a apuração.

**Cenário B — aluguel de R$ 5.500,00:**

1. **tabela progressiva:** acima de R$ 4.664,68 → 27,5% → 5.500 × 27,5% = **R$ 1.512,50** − 908,73 = **R$ 603,77**;
2. **redutor (de R$ 5.000,01 a R$ 7.350,00):** 978,62 − (0,133145 × 5.500) = 978,62 − 732,30 = **R$ 246,32**;
3. **IRRF devido: 603,77 − 246,32 = R$ 357,45/mês** → **R$ 4.289,40/ano**;
4. **leitura:** o redutor corta **40,8%** do imposto apurado (246,32 ÷ 603,77) — benefício que só passou a existir em **janeiro de 2026** e raramente está previsto em contratos antigos.

**Cenário C — aluguel de R$ 8.000,00:**

1. **tabela progressiva:** 8.000 × 27,5% = **R$ 2.200,00** − 908,73 = **R$ 1.291,27/mês**;
2. **redutor:** acima de R$ 7.350,00 → **sem redução**;
3. **IRRF devido: R$ 1.291,27/mês** → **R$ 15.495,24/ano**;
4. **conclusão:** cerca de **16,1%** do aluguel mensal vira retenção (1.291,27 ÷ 8.000) — valor que sai do caixa junto com o aluguel e precisa estar **orçado no contrato**.

| Aluguel mensal | Tabela | Redutor | IRRF/mês | IRRF/ano |
|---|---|---|---|---|
| R$ 3.500,00 | 15% → 130,84 | −130,84 (limitado ao imposto) | **R$ 0,00** | R$ 0,00 |
| R$ 5.500,00 | 27,5% → 603,77 | −246,32 | **R$ 357,45** | R$ 4.289,40 |
| R$ 8.000,00 | 27,5% → 1.291,27 | sem redução | **R$ 1.291,27** | R$ 15.495,24 |

> [!WARNING]
> **Não reter não é economia: é descumprimento da alínea "f" do art. 12 da Lei nº 9.532/1997.** A retenção omitida gera a obrigação com **juros e correção**, expõe a diretoria (Lei nº 8.429/1992, para recursos públicos) e, no limite, autoriza a **suspensão da imunidade** pelo art. 14 da Lei nº 9.532/1997, operacionalizada pelo art. 32 da Lei nº 9.430/1996. O controle mensal de retenções — conferência do DARF ao pagamento e baixa no fechamento — custa menos de uma hora por mês.

- **🔢 Você sabia?** Como o redutor da Lei nº 15.270/2025 zera o imposto de quem auferi até **R$ 5.000,00/mês**, o doador pessoa física nessa faixa pode ter **IR devido = R$ 0,00** — e, nesse caso, **6% de R$ 0,00 = R$ 0,00** de incentivo. A pergunta certa em campanha de PF nunca é "quanto você doa?", e sim "**quanto de IR você declara como devido?**".

---

## 11. Doações recebidas: qualificação da beneficiária e os dois tetos

Toda doação que a entidade recebe vive sob dois tetos **independentes**: o que limita a **dedução de quem doa** e o que limita a **recepção qualificada pela entidade**. Confundir os dois é a origem das promessas que a assessoria tributária desmente.

### 11.1 A beneficiária precisa estar qualificada

Pela **alínea "c" do art. 13 da Lei nº 9.532/1997** (redação da Lei nº 13.204/2015), a dedução do doador exige que a beneficiária seja **organização da sociedade civil** na forma da Lei nº 13.019/2014 que cumpra os **arts. 3º e 16 da Lei nº 9.790/1999** — **independentemente de certificação**. Na prática, a entidade precisa provar, a qualquer momento:

- estatuto com finalidades compatíveis (vedação a finalidades político-partidárias — art. 16 da Lei nº 9.790/1999);
- escrituração completa de receitas e despesas (alínea "c" do art. 12);
- prestação de contas das parcerias (MROSC), quando houver;
- comprovação de destinação integral dos recursos ao objeto.

### 11.2 Os dois tetos lado a lado

| Teto | Quem limita | Medida | Base legal |
|---|---|---|---|
| **Dedução do doador PJ** | A apuração do doador | **2% do lucro operacional** (1,5% para ensino/pesquisa) | Lei nº 9.249/1995, art. 13, § 2º, II e III |
| **Dedução do doador PF** | O imposto devido do doador | **6% do IR devido** | Lei nº 9.532/1997, arts. 12 e 22 |
| **Recepção qualificada** | A ONG (benefício do art. 84-B) | **2% da receita bruta do doador** + bens móveis irrecuperáveis/apreendidos | Lei nº 13.019/2014, art. 84-B |
| **Redução linear de 2026** | Todos os benefícios de gasto tributário | **90%** do benefício (10% de redução) | LC nº 224/2025, art. 4º; IN RFB nº 2.307/2026 |

### 11.3 Exemplo 12 — a empresa que quer doar R$ 60.000,00

Empresa com **receita bruta de R$ 5.000.000,00** e **lucro operacional de R$ 1.500.000,00** pretende doar **R$ 60.000,00** à entidade.

**Portão 1 — o que a empresa deduz (Lei nº 9.249/1995, art. 13, § 2º, III):**

1. limite: 2% × 1.500.000 = **R$ 30.000,00**;
2. a doação de R$ 60.000,00 **excede** o limite → dedutíveis apenas **R$ 30.000,00**;
3. economia: 30.000 × 34% = **R$ 10.200,00**;
4. custo líquido: 60.000 − 10.200 = **R$ 49.800,00** → **83% da doação sai do bolso** da empresa.

**Portão 2 — o que a entidade pode receber qualificadamente (art. 84-B):**

1. limite: 2% × 5.000.000 = **R$ 100.000,00**;
2. a doação de R$ 60.000,00 **cabe integralmente** nesse teto → a via do art. 84-B permanece aberta.

**Cenário invertido — quando a receita bruta vira o gargalo:** se a empresa pretendesse doar **R$ 110.000,00**, a dedução pelo lucro alcançaria 2% × 1.500.000 = R$ 30.000,00, mas o **art. 84-B só alcança R$ 100.000,00** (2% da receita bruta). Para planejar, considera-se o **menor campo seguro** — **R$ 100.000,00** — e confirma-se com a assessoria tributária antes de publicar o material da campanha.

**Efeito da redução linear de 10% (2026):** com o benefício de base reduzido a 90%, o limite de dedução passa a 1.500.000 × 2% × 90% = **R$ 27.000,00** → economia 27.000 × 34% = **R$ 9.180,00** → diferença de **R$ 1.020,00** sobre a conta nominal.

### 11.4 Doação, subvenção e contraprestação: três operações, três regimes

| Operação | Natureza | Efeito tributário | Regra contábil |
|---|---|---|---|
| **Doação privada sem contraprestação** em benefício do doador | Não incidência | ISS: LC nº 116/2003, art. 2 — **IBS/CBS: LC nº 214/2025, art. 6** | ITG 2002 (R1), item 9: reconhecimento **no resultado** |
| **Termo de colaboração, termo de fomento ou acordo de cooperação** (MROSC) | Transferência pública com plano de trabalho | Não é receita de serviço; observar o IBS/CBS conforme a contraprestação pactuada | ITG 2002 (R1) — segregação por fonte (LC nº 187/2021, art. 3º, IV) |
| **Prestação de serviço com contraprestação** | Receita de serviço | **ISS de 2% a 5%** (LC nº 116/2003, arts. 8, II, e 8-A) e IBS/CBS a partir da transição | ITG 2002 (R1), item 8: **competência** |

> [!IMPORTANT]
> **A fronteira entre doação e serviço é a contraprestação.** Se a entidade entrega à contrapartida um **serviço, cessão de direito ou benefício material** em benefício do doador, a operação **sai da** hipótese de não incidência e passa a ser **fato gerador de ISS** (e, na transição, de IBS/CBS). A promessa de "devolutiva" — nome de sala, verba de gestão, contrapartida publicitária material — deve ser **analisada caso a caso** e, havendo dúvida, a entidade deve optar pelo recolhimento, não pela omissão.

- **🔢 Você sabia?** A mesma doação pode ser **dedutível para o doador** (art. 13 da Lei nº 9.532/1997) e, ao mesmo tempo, estar **fora do art. 84-B** da MROSC se o doador ultrapassar 2% da sua receita bruta: são portões diferentes, com contadores diferentes. A conferência de uma doação grande leva três perguntas — quem doa, quanto lucra e quanto fatura.

---

## 12. Governança fiscal: checklist, erros frequentes e plano de 90 dias

### 12.1 O checklist anual da entidade

| # | Item | Frequência | Prova que deve existir |
|---|---|---|---|
| **1** | Escrituração completa da receita e das despesas (art. 12, "c") | Mensal | Livros, conciliação bancária |
| **2** | Retenções recolhidas e informadas (art. 12, "f") | Mensal | Comprovantes + DCTFWeb |
| **3** | Escrituração **segregada por fonte de recursos** (LC nº 187/2021, art. 3º, IV) | Mensal | Razão por fonte |
| **4** | Percentual de serviços ao SUS comprovado (CEBAS) | Anual | Relatório do gestor do SUS |
| **5** | Gratuidade segregada e auditada (art. 12 da LC nº 187/2021) | Mensal/Anual | DRE com rubrica própria (ITG 2002, item 24) |
| **6** | **ECD** (30/06) e **ECF** (31/07) | Anual | Recibos de entrega |
| **7** | Renúncia fiscal divulgada nas notas (ITG 2002, item 27) | Anual | Notas explicativas |
| **8** | Guarda de documentos: **5 anos** (art. 12, "d") e **10 anos** (LC nº 187/2021, art. 3º) | Contínua | Arquivo físico/digital |
| **9** | Não remunerar dirigentes sem gestão efetiva (art. 12, "a") | Contínua | Atas, contratos, folha |
| **10** | Cláusula tributária nos contratos de longo prazo (IBS/CBS) | Semestral | Contratos e aditivos |
| **11** | Conferência da lista de gastos **preservados** (IN RFB nº 2.307/2026) | Anual | Parecer ou ata de revisão |
| **12** | Renovação de CEBAS e certidões de conselhos | Conforme vencimento | Certificados e certidões |

### 12.2 Os sete erros que derrubam a imunidade ou custam caro

1. **Tratar imunidade como dispensa de declaração** — ECD, ECF, DCTFWeb e eSocial continuam obrigatórias (seção 8);
2. **Deixar de reter IRRF ou ISS** — descumprimento da alínea "f" do art. 12 e gatilho de suspensão (art. 14 + art. 32 da Lei nº 9.430/1996);
3. **Remunerar dirigente sem prestação de serviço efetiva** — quebra a alínea "a" e é o erro de maior penalidade nas auditorias;
4. **Perder o percentual de SUS ou de gratuidade no ano de renovação** — a regra é a média do período (mínimo 60%) com piso de **50% por ano** (LC nº 187/2021, art. 11);
5. **Não segregar a escrituração por fonte** — sem segregação, a gratuidade e a subvenção são indistinguíveis na prova;
6. **Orçar 2027 sem a linha de IBS/CBS nas compras** — o art. 9º, § 4º, da LC nº 214/2025 faz o tributo das compras virar custo **sem crédito** (seção 7);
7. **Prometer "doação 100% dedutível" em 2026** — a IN RFB nº 2.307/2026 revogou o item 26 (doações) da lista da IN RFB nº 2.305/2025, de modo que o benefício passou a sofrer a **redução linear de 10%**.

### 12.3 Plano de 90 dias

| Prazo | O que fazer | Entregável |
|---|---|---|
| **30 dias** | Inventário de todas as obrigações + responsável nomeado por obrigação + alerta de D-10 | Calendário fiscal assinado |
| **60 dias** | Conferência das **retenções dos 5 últimos anos** (art. 12, "d") e implantação da segregação por fonte | Relatório de pendências e regularização |
| **90 dias** | Revisão contratual (cláusula tributária), simulação de 2027 com as compras e conferência da nota de renúncia com a LOA | Orçamento 2027 com linha de "tributos embutidos em compras" |

> [!IMPORTANT]
> **A imunidade é um sistema, não uma lista de descontos.** Os requisitos do art. 12 da Lei nº 9.532/1997, os percentuais da LC nº 187/2021, as obrigações acessórias de 2026 e a escrituração da ITG 2002 (R1) **dependem uns dos outros**: cai um deles e a consequência atinge os demais. A pergunta de governança certa, todo fim de trimestre, não é "quanto economizamos?", e sim "**o que nos sustentaria diante de uma fiscalização hoje?**".

- **🔢 Você sabia?** O prazo de guarda de documentos é **duplo**: **5 anos** pela alínea "d" do art. 12 da Lei nº 9.532/1997 e **10 anos** pela LC nº 187/2021 (art. 3º). Quando as duas normas se aplicam, vale o **maior** — e o arquivo deve ser montado pensando em 10 anos, não em 5.

---

## Perguntas Práticas (Practice Questions)

Resolva com o raciocínio passo a passo de cada seção — e confira a base legal antes de olhar o gabarito.

```question
{
  "id": "npof-12-q1",
  "type": "multiple-choice",
  "question": "Qual é a base legal do teto de dedução da doação de uma pessoa jurídica ao lucro operacional, antes de computada a própria dedução?",
  "options": [
    "Lei nº 13.019/2014, art. 84-B",
    "Lei nº 9.249/1995, art. 13, § 2º, III",
    "Lei nº 9.532/1997, art. 22",
    "Lei nº 8.313/1991, art. 26"
  ],
  "correct": 1,
  "explanation": "O teto de 2% do lucro operacional é da Lei nº 9.249/1995, art. 13, § 2º, III. O art. 84-B da MROSC limita a recepção pela entidade (2% da receita bruta do doador); o art. 22 da Lei nº 9.532/1997 trata da dedução de pessoas físicas (6% do IR devido); o art. 26 da Lei nº 8.313/1991 é da Rouanet."
}
```

```question
{
  "id": "npof-12-q2",
  "type": "multiple-choice",
  "question": "Até quando vigerão o PIS/PASEP e a COFINS no sistema atual, antes da CBS?",
  "options": [
    "30 de junho de 2026",
    "31 de dezembro de 2026",
    "31 de dezembro de 2027",
    "31 de dezembro de 2033"
  ],
  "correct": 1,
  "explanation": "Pela EC nº 132/2023 e pela LC nº 214/2025, a CBS só passa a ser cobrada a partir de 1º/1/2027 — logo, PIS/PASEP e COFINS vigem até 31/12/2026. 2033 é o ano da plenitude do novo sistema (teto de 26,5%)."
}
```

```question
{
  "id": "npof-12-q3",
  "type": "multiple-choice",
  "question": "Qual norma unificou o regime das entidades beneficentes e revogou a Lei nº 12.101/2009?",
  "options": [
    "Lei nº 9.790/1999",
    "Decreto nº 8.242/2014",
    "LC nº 187/2021",
    "LC nº 116/2003"
  ],
  "correct": 2,
  "explanation": "A LC nº 187/2021 disciplina o CEBAS nas áreas de saúde, educação e assistência social e revogou a Lei nº 12.101/2009 (ementa do art. 47, II). A Lei nº 9.790/1999 trata da OSCIP, o Decreto nº 8.242/2014 foi revogado e a LC nº 116/2003 é do ISS."
}
```

```question
{
  "id": "npof-12-q4",
  "type": "multiple-choice",
  "question": "Sem CEBAS, qual a alíquota do RAT (risco ambiental do trabalho) sobre a folha de pagamento?",
  "options": [
    "2% fixa para todas as entidades",
    "0,5% e 1%, conforme o FAP",
    "1%, 2% ou 3%, conforme o grau de risco e ajustado pelo FAP",
    "Isenção automática para entidades sem fins lucrativos"
  ],
  "correct": 2,
  "explanation": "O art. 22, II, da Lei nº 8.212/1991 fixa 1% (leve), 2% (médio) ou 3% (grave), ajustado pelo FAP. Com CEBAS vigente, a imunidade do art. 195, § 7º, da CF zera a contribuição patronal e o RAT sobre a folha da própria entidade."
}
```

```question
{
  "id": "npof-12-q5",
  "type": "multiple-choice",
  "question": "O que fez a LC nº 235/2026 no art. 4º, § 8º, V, da LC nº 224/2025?",
  "options": [
    "Reduziu a alíquota mínima do ISS para 1%",
    "Instituiu o Comitê Gestor do IBS (CGIBS)",
    "Revogou a imunidade das OSC no IBS/CBS",
    "Redestinou o dispositivo preservando o art. 15 da Lei nº 9.532/1997"
  ],
  "correct": 3,
  "explanation": "A LC nº 235/2026 (27/08/2026) alterou o inciso V do art. 4º, § 8º, da LC nº 224/2025, passando a citar o art. 15 da Lei nº 9.532/1997 — leitura confirmada pela IN RFB nº 2.307/2026 (item 34) como preservação da isenção de IRPJ, CSLL e COFINS. O CGIBS veio da LC nº 227/2026."
}
```

```question
{
  "id": "npof-12-q6",
  "type": "multiple-choice",
  "question": "Qual é o prazo da ECD (ano-calendário 2025) em 2026?",
  "options": [
    "31 de maio de 2026",
    "30 de junho de 2026",
    "31 de julho de 2026",
    "31 de agosto de 2026"
  ],
  "correct": 1,
  "explanation": "A ECD vence em 30/06/2026 (último dia útil de junho) e a ECF em 31/07/2026 — esta última obrigatória também para pessoas jurídicas imunes e isentas."
}
```

```question
{
  "id": "npof-12-q7",
  "type": "multiple-choice",
  "question": "Uma entidade com CEBAS-Saúde e 55% de atendimentos ao SUS deve manter gratuidade mínima de quanto sobre a receita de serviços de saúde?",
  "options": [
    "20%",
    "10%",
    "5%",
    "Nenhuma — o percentual de SUS dispensa gratuidade"
  ],
  "correct": 2,
  "explanation": "Com SUS ≥ 50%, aplica-se o art. 12, III, da LC nº 187/2021: gratuidade mínima de 5%. SUS entre 30% e 50% exige 10%; sem interesse de contratação ou SUS < 30%, exige 20%."
}
```

```question
{
  "id": "npof-12-q8",
  "type": "multiple-choice",
  "question": "Pelo art. 9º, § 4º, da LC nº 214/2025, as imunidades do inciso III ...",
  "options": [
    "não se aplicam às aquisições de bens e serviços da própria entidade",
    "eliminam o IBS/CBS sobre todas as compras da entidade",
    "garantem crédito integral sobre as aquisições da entidade",
    "passam a se aplicar somente a partir de 2033"
  ],
  "correct": 0,
  "explanation": "O § 4º afasta as imunidades das aquisições da entidade — materiais, imateriais, inclusive direitos, e serviços. Como a entidade imune não é contribuinte regular do novo sistema, não há crédito a tomar e o tributo das compras vira custo embutido no preço do fornecedor (seção 7)."
}
```

```matching
{
  "question": "Associe cada benefício ou instituto à sua base legal correta:",
  "pairs": [
    {"left": "Imunidade de impostos das OSC", "right": "CF art. 150, VI, \"c\", e Lei nº 9.532/1997, art. 12 (alíneas a a h)"},
    {"left": "Imunidade previdenciária (base do CEBAS)", "right": "CF art. 195, § 7º, e LC nº 187/2021, art. 4º"},
    {"left": "Dedução da doação da pessoa jurídica", "right": "Lei nº 9.249/1995, art. 13, § 2º, III — 2% do lucro operacional"},
    {"left": "Dedução da doação da pessoa física", "right": "Lei nº 9.532/1997, arts. 12 e 22 — 6% do IR devido"},
    {"left": "Isenção de IRPJ, CSLL e COFINS das filantrópicas e associações civis", "right": "Lei nº 9.532/1997, art. 15 (item 34 da IN RFB nº 2.307/2026)"},
    {"left": "Redução linear de 10% dos incentivos federais em 2026", "right": "LC nº 224/2025, art. 4º (com as exceções do § 8º)"},
    {"left": "IBS/CBS devidos nas aquisições da entidade imune", "right": "LC nº 214/2025, art. 9º, § 4º — sem direito a crédito"}
  ],
  "explanation": "Cada instituto tem fonte própria: Constituição (imunidades), leis ordinárias e complementares (deduções e isenções), LC nº 224/2025 (redução de 10%) e LC nº 214/2025 (IBS/CBS na cadeia de compras). Trocar as bases legais é o erro que invalida pareceres, editais e notas explicativas."
}
```

```fillblank
{
  "question": "Complete os valores do IRRF sobre aluguel de R$ 8.000,00 na tabela de 2026:",
  "template": "8.000,00 × 27,5% = R$ 2.200,00 − parcela a deduzir de R$ {{1}} = R$ {{2}} por mês, totalizando R$ {{3}} em 12 meses.",
  "answers": {
    "1": "908,73",
    "2": "1.291,27",
    "3": "15.495,24"
  },
  "distractors": ["675,49", "394,16", "1.024,27", "14.905,24"],
  "explanation": "Acima de R$ 4.664,68 a alíquota é 27,5% com dedução de R$ 908,73: 2.200,00 − 908,73 = 1.291,27 por mês. Como o rendimento supera R$ 7.350,00, não há redução da Lei nº 15.270/2025. Em 12 meses: 1.291,27 × 12 = 15.495,24."
}
```

---

> [!WARNING]
> **Armadilhas desta lição:**
> - **Imunidade não é dispensa de declaração** — ECD (30/06), ECF (31/07), DCTFWeb e eSocial continuam obrigatórias;
> - **A alínea "f" do art. 12** pega a entidade: não reter IRRF de aluguéis e ISS é descumprimento da própria imunidade, com suspensão pelo art. 14 e pelo art. 32 da Lei nº 9.430/1996;
> - **CEBAS é obrigação contínua** — média do período ≥ 60%, piso de 50% por ano e gratuidade segregada;
> - **As compras da entidade imune continuam com IBS/CBS** (LC nº 214/2025, art. 9º, § 4º) e **sem crédito** — abra a linha orçamentária antes de 2027;
> - **Em 2026 a doação não é mais "100% dedutível"** — a IN RFB nº 2.307/2026 revogou o item 26 (doações) da IN RFB nº 2.305/2025 e o benefício sofre a redução linear de 10%;
> - **Redutor de IRRF não é regra geral:** quem ganha acima de R$ 7.350,00/mês não tem redução, e a redução é limitada ao imposto apurado;
> - **Renúncia fiscal é nota explicativa** (ITG 2002 (R1), item 27) — o que a entidade não divulga, a fiscalização calcula.

> [!SUCCESS]
> **Pontos Principais (Key Takeaways):**
> 1. **Imunidade, isenção, não incidência e benefício do MROSC** são quatro institutos com fontes e efeitos diferentes — confundi-los é o erro mais caro da gestão fiscal;
> 2. A imunidade de impostos (CF art. 150, VI, "c") depende dos **oito requisitos do art. 12 da Lei nº 9.532/1997**, e a alínea "f" (retenções) derruba a entidade que mais parece cumprir tudo;
> 3. A **imunidade previdenciária** vale cerca de **R$ 264.000,00/ano** para uma folha de R$ 1.200.000,00 (20% + RAT 2%) — e a contrapartida de gratuidade de 5% deixa **R$ 204.000,00/ano** líquidos;
> 4. O doador PJ deduz **2% do lucro operacional** (Lei nº 9.249/1995) e o doador PF **6% do IR devido** (Lei nº 9.532/1997) — em 2026, ambos alcançados pela **redução linear de 10%**;
> 5. **2026 é ano-pivô:** PIS/COFINS até 31/12/2026, destaque de CBS 0,9% e IBS 0,1% na NF-e sem recolhimento, e LC 227/2026, Decreto 12.955/2026 e IN RFB 2.307/2026 no mesmo calendário;
> 6. O **art. 9º, § 4º, da LC nº 214/2025** faz o IBS/CBS das compras virar **custo sem crédito** — num cenário de 12%, R$ 144.000,00/ano sobre compras de R$ 1.200.000,00;
> 7. A **renúncia fiscal é divulgada nas notas** (ITG 2002 (R1), item 27): no exemplo do hospital, **R$ 366.000,00** de benefício tornam-se informação pública e prova de regularidade;
> 8. Governança fiscal é calendário e evidência: **checklist, responsável, D-10 e prova arquivada por 10 anos** sustentam a imunidade diante de qualquer fiscalização.