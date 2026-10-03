---
title: "Contabilidade e Gestão Financeira de ONGs"
description: "Curso profundo de contabilidade e gestão financeira de ONGs brasileiras: ITG 2002 (R1) item por item, NBC TG 26 e a transição para a NBC TG 51, segregação de recursos com e sem restrição, imunidade e custo do IBS/CBS pela LC nº 214/2025, calendário de obrigações (ECD, ECF, DCTFWeb, eSocial, EFD-Reinf), comparativo Brasil × EUA × IPSAS × Reino Unido, sete exemplos resolvidos com aritmética completa, procedimentos de fechamento e rateio, benchmarks sinalizados como não verificados e dez questões de exame comentadas."
order: 10
difficulty: "intermediate"
duration: "120 min"
---
# Contabilidade e Gestão Financeira de ONGs

Toda ONG já tem contabilidade — a questão é se ela é contabilidade de *quem*. Uma entidade sem fins lucrativos não mede sucesso em lucro: mede em missão cumprida, em gratuidade prestada e em prestação de contas honesta. Por isso a contabilidade das OSC é uma contabilidade **adaptada**: nasce das normas empresariais, é reelaborada pelo **ITG 2002 (R1)** do Conselho Federal de Contabilidade e é sustentada por um marco tributário que hoje inclui a reforma da **LC nº 214/2025**. Contar o dinheiro dessa entidade é, ao mesmo tempo, um ato de transparência com doadores e beneficiários e a **condição de manutenção das imunidades** que sustentam a missão.

A arquitetura é em camadas — e confundir as camadas é a origem de quase todos os erros de gestão, de edital e de prova:

```text
====================================================================
 CAMADA 1 — CONSTITUIÇÃO E CTN            (o direito que habilita)
====================================================================
   CF, art. 150, VI, "c" .... imunidade das instituições de
                              educação e assistência sem fins
                              lucrativos (redação da EC 132/2023)
   CTN, art. 14 .............. sete condições CUMULATIVAS para
                              gozar da imunidade (ver seção 1.2)
--------------------------------------------------------------------
         |  informa, limita e condiciona
         v
====================================================================
 CAMADA 2 — REFORMA TRIBUTÁRIA            (o custo do futuro)
====================================================================
   LC nº 214/2025 (16/01/2025) ... IBS, CBS e IS
     art. 9º, III  ... imunidade dos fornecimentos às instituições
     art. 9º, § 3º  ... condiciona ao cumprimento do art. 14 CTN
     art. 9º, § 4º  ... AQUISIÇÕES NÃO SÃO IMUNES -> viram custo
   LC nº 227/2026 (13/01/2026) .... alteração
   Decreto nº 12.955/2026 (CBS) .... art. 10 espelha a imunidade
--------------------------------------------------------------------
         |  convive com, sem substituir
         v
====================================================================
 CAMADA 3 — LEI nº 6.404/1976 POR ANALOGIA  (a estrutura)
====================================================================
   art. 176 ... OSCs NÃO são obrigadas a publicar
   art. 179 ... estrutura de classificação do balanço, adaptada
                pelo ITG 2002: Patrimônio Social; Superávit
--------------------------------------------------------------------
         |  é a moldura sobre a qual se aplica a norma de OSC
         v
====================================================================
 CAMADA 4 — ITG 2002 (R1) + NBC            (a norma do setor)
====================================================================
   Res. CFC nº 1.409/2012 (vigência para exercícios desde 01/01/2012)
   ITG 2002 (R1), de 21/08/2015 (DOU 02/09/2015)
   NAE nº 29/2024 ..... escopo a partir de períodos iniciados
                        em 01/01/2025
   NBC TG 07 (subvenções) · NBC TG 03 (fluxo de caixa)
   NBC TG 26 -> NBC TG 51 (obrigatória desde 01/01/2027)
--------------------------------------------------------------------
         |  gera demonstrações, notas e contas segregadas
         v
====================================================================
 CAMADA 5 — OBRIGAÇÕES DE DECLARAÇÃO       (o calendário)
====================================================================
   ECD · ECF · DCTFWeb · eSocial · EFD-Reinf
   Demonstrações contábeis (ITG 2002, item 22)
   Prestação de contas do MROSC (Lei nº 13.019/2014)
====================================================================
```

> [!NOTE]
> A expressão **"tradição contábil"** traduz o seguinte: a Lei nº 6.404/1976 **não se aplica diretamente** a entidades sem fins lucrativos — não existe obrigação de publicação pelo art. 176, e a lei foi pensada para sociedades anônimas. Ela é empregada **por analogia** para dar estrutura ao balanço, e o **ITG 2002 (R1)** faz o ajuste semântico: **Patrimônio Social** no lugar de "Capital" e **Superávit/Déficit do Período** no lugar de lucro/prejuízo. Errar esse vocabulário é sinal imediato de que a demonstração foi copiada de um modelo comercial.

Nesta lição você vai:

- ler a **arquitetura em cinco camadas** e entender o que cada uma responde;
- dominar a **LC nº 214/2025**, inclusive o art. 9º, § 4º, que transforma imposto em **custo permanente**;
- aplicar o **ITG 2002 (R1) item por item** (4, 8, 9, 9A, 9B, 10, 11, 12, 15, 19, 22, 23, 24 e 27);
- montar a **estrutura do Balanço Patrimonial** e os **blocos da DRE** com e sem restrição;
- fechar o **calendário de obrigações** de um ano (ECD, ECF, DCTFWeb, eSocial, EFD-Reinf e MROSC);
- ler o **comparativo internacional** Brasil × EUA × IPSAS × Reino Unido;
- calcular **sete conjuntos de indicadores** com aritmética completa: subvenção vinculada, razão de programa e qualificação, orçamento de 12 meses, imunidade na compra, trabalho voluntário e renúncia fiscal, custo de captação e reservas, rateio de custos indiretos;
- executar **procedimentos passo a passo** de fechamento mensal, do ciclo do recurso vinculado e do rateio;
- separar **benchmarks de heurística** de exigência normativa real.

---

## 1. A base legal e tributária da contabilidade de OSC

### 1.1 A LC nº 214/2025: IBS, CBS e a imunidade do art. 9º, III

A **Lei Complementar nº 214, de 16/01/2025**, instituiu o **IBS (Imposto sobre Bens e Serviços)**, a **CBS (Contribuição sobre Bens e Serviços)** e o **IS (Imposto Seletivo)**, e foi alterada pela **LC nº 227, de 13/01/2026**. Para o terceiro setor, três dispositivos formam o núcleo de leitura:

| Dispositivo | Conteúdo | Efeito contábil imediato |
|---|---|---|
| **Art. 9º, III** | Imunidade sobre os fornecimentos a *instituições de educação e de assistência social, sem fins lucrativos* (e também a partidos e entidades sindicais), limitada pelo art. 14 do CTN | A **oferta** da entidade não recolhe IBS/CBS; receita reconhecida sem tributo embutido |
| **Art. 9º, § 3º** | Condiciona a imunidade ao cumprimento **cumulativo** do art. 14 do CTN | Descumprir **uma** das sete condições derruba o benefício da operação |
| **Art. 9º, § 4º** | A imunidade **não se aplica às aquisições** de bens materiais e imateriais (inclusive direitos) e de serviços pela entidade | O imposto da **compra** é **não recuperável**: vira custo |

A regulamentação da CBS veio pelo **Decreto nº 12.955, de 29/04/2026**, cujo **art. 10** espelha a mesma imunidade. A consequência orçamentária é direta e é a decisão nº 1 do planejamento financeiro: **modele IBS e CBS como aumento permanente de custo**, e nunca como crédito a recuperar.

> [!IMPORTANT]
> **O § 4º do art. 9º é o ponto em que o orçamento da ONG é desenhado errado com mais frequência.** A imunidade protege a **oferta** (o que a entidade faz), não a **aquisição** (o que a entidade compra). Uma escola imune pode prestar serviços sem IBS/CBS e, ainda assim, **pagar o tributo embutido em cada material, equipamento, software e contratação** — sem saldo a compensar, sem crédito e sem restituição. O erro clássico é orçar a compra pelo preço de "entidade imune" e descobrir o rombo no fechamento do trimestre. Trate o tributo da compra como **custo permanente e crescente**, escalonado ano a ano.

### 1.2 As sete condições cumulativas do art. 14 do CTN

O § 3º do art. 9º remete ao **art. 14 do Código Tributário Nacional**, que lista exigências **cumulativas** — basta falhar em uma para perder a imunidade da operação:

| # | Condição do art. 14 do CTN | Tradução para a gestão e para a contabilidade |
|---|---|---|
| 1 | Finalidade exclusivamente sem fins lucrativos | Vedação de distribuição de lucros a associados, sócios, conselheiros ou doadores |
| 2 | Destinação do patrimônio, em dissolução, a entidade assemelhada | Cláusula estatutária compatível com o art. 61 do Código Civil |
| 3 | Não distribuição de lucros nem de parcela de sua receita ou de seus resultados, a qualquer título | Superávit volta à missão; registrado como Superávit/Déficit no Patrimônio Social |
| 4 | Prestação de serviços em caráter gratuito ou a preços reduzidos | Gratuidade **demonstrável** nas demonstrações (itens 10, 24 e 27, "m" e "n") |
| 5 | Não remuneração de dirigentes acima do ressarcimento de despesas | Remuneração apenas da gestão executiva efetiva, com critério objetivo |
| 6 | Controle interno e disponibilização pública de contas | Escrituração regular (ITG 2000 (R1)) e divulgação das demonstrações |
| 7 | Aplicação das receitas e dos resultados nas atividades-fim, no País | Aplicações no exterior exigem autorização expressa em lei |

A leitura conjunta das linhas 4, 6 e 7 é o coração desta lição: **a imunidade é concedida em troca de demonstração**. Gratuidade sem registro segregado, contas sem controle interno e demonstrações não publicadas não são descumprimentos administrativos — são **risco fiscal**.

> [!NOTE]
> A condição 6 conecta esta lição à [Lição 4 — Estruturas Legais de ONGs](./04-legal-structures-brazil.md): o art. 4º, VII, da Lei nº 9.790/1999 (OSCIP) exige publicidade do relatório de atividades e das demonstrações com certidões negativas do INSS e do FGTS; o art. 2º, I, "f", da Lei nº 9.637/1998 (OS) manda publicar relatórios financeiros e de execução do contrato de gestão no DOU. **A exigência contábil é a mesma, o veículo é que muda.**

### 1.3 Atividade econômica: quando a ONG entra no regime comercial

Se a OSC exerce **habitualmente** atividade econômica — restaurante, locação de bens, cursos pagos fora do objeto social —, aplica-se **lucro real, IRPJ, CSLL e escrituração plena da Lei nº 6.404/1976**, e a imunidade do art. 14 do CTN **se perde para essas operações**. A fronteira entre eventualidade e habitualidade é uma fronteira **contábil e probatória**, não filosófica: ela se demonstra com faturamento recorrente, política de preços, divulgação e destino do resultado.

Na prática, a OSC que cruza essa fronteira precisa de **duas leituras de escrituração**: a do objeto social (imune, com gratuidade segregada) e a da atividade econômica (tributada, com custo cheio de IBS/CBS nas aquisições). Misturar as duas num único centro de custo é o caminho mais curto para uma glosa.

### 1.4 Escrituração, registro de livros e formalidades

- O **RIR/2018** é o **Decreto nº 9.580, de 22/11/2018**, que **revogou o Decreto nº 3.000/1999**;
- O registro de livros observa o **RIR/2018, art. 276, § 4º**, e a **IN RFB nº 1.420/2013, art. 7º, parágrafo único**;
- A escrituração regular é obrigatória para OSCs **independentemente do porte**, conforme o **ITG 2000 (R1)**;
- Não existe atalho de porte: a entidade sem fins lucrativos escritura porque é pessoa jurídica, e a dispensa que existe (a da ECD, por exemplo) é **por limite de receita**, não por "ser ONG".

- **🔢 Você sabia?** O **RIR/2018 é um decreto, não uma lei**: o Decreto nº 9.580, de 22/11/2018, é o regulamento do imposto de renda e **revogou expressamente o Decreto nº 3.000/1999** (o antigo RIR/1999). Toda apostila, modelo de contrato ou ata que ancora escrituração de ONG no "Decreto 3.000/99" está citando norma revogada.

> [!WARNING]
> **O mito do "RAPP": esse documento não existe no Conselho Federal de Contabilidade.** Não há registro, certificação ou exigência de "RAPP" para OSC no CFC. A **Resolução CFC nº 1.591/2020** trata de **escritórios representativos do CRC** — assunto totalmente distinto. O cuidado redobrado: o acrônimo "RAPP" oficial que circula na administração pública é o **Relatório Ambiental** de órgão ambiental (Ibama), nada a ver com contabilidade. Se um edital, um auditor ou um fornecedor exigir "apresentar a RAPP", peça a **base normativa exata** — muito provavelmente você receberá, em troca, a citação de uma resolução que não trata disso.

### 1.5 OSCIP: o que a contabilidade precisa entregar

Pela **Lei nº 9.790/1999**, pelo **Decreto nº 3.100/1999** e pela **Portaria MJ nº 362/2016**, o requerimento de qualificação exige:

- requerimento eletrônico;
- estatuto registrado em cartório (arts. 1º a 4º da Lei nº 9.790/1999);
- ata de eleição da diretoria;
- declaração de funcionamento regular há **no mínimo 3 anos**;
- declaração de não acumulação de finalidades;
- **Balanço Patrimonial e Demonstração do Resultado do exercício anterior, assinados por contador**;
- declaração de isenção do imposto de renda;
- prova de CNPJ.

Os dois documentos contábeis do penúltimo item são, na prática, o **primeiro teste de qualidade da escrituração** da entidade: sem DRE segregada por gratuidade e sem balanço com Patrimônio Social bem classificado, o requerimento já nasce frágil.

> [!NOTE]
> O **CSC (Cadastro de Entidades Sem Fim Lucrativo) não é requisito** da qualificação de OSCIP. E a qualificação **não gera relatório anual ao Ministério da Justiça**: o antigo CNES foi desativado e a UPF foi extinta pela **Lei nº 13.204/2015**. Quem ainda projeta calendário de "renovação anual de OSCIP" está projetando uma obrigação que não existe mais.

### 1.6 MROSC: o plano de trabalho é um documento contábil

O **art. 22 da Lei nº 13.019/2014** exige que o plano de trabalho contenha **previsão de receitas e despesas (inciso II-A)**, **cronograma de desembolso (inciso VIII)** e **prestação de contas em até 1 ano (inciso IX)**. Os repasses acontecem pelo **Transferegov.br**.

A leitura contábil é imediata: a restrição de aplicação **nasce na proposta**, é formalizada no cronograma e se encerra na prestação de contas. Não é o banco que define que o dinheiro é vinculado — é o plano de trabalho, e a contabilidade apenas o reconhece.

---

## 2. Normas contábeis: o ITG 2002 (R1) e o ecossistema NBC

### 2.1 Histórico, escopo e vigência

O **ITG 2002** foi aprovado pela **Resolução CFC nº 1.409, de 21/09/2012** (DOU 27/09/2012), vigente para exercícios a partir de **01/01/2012**, e alterado pelo **ITG 2002 (R1), de 21/08/2015** (DOU 02/09/2015). O **item 4** fixa o escopo: aplica-se a **entidades sem fins lucrativos de direito privado** e, para o que não for coberto pela norma, aplica-se a **NBC TG 1000 (PME)** ou a **IFRS completa**, conforme o porte.

### 2.2 Os itens do ITG 2002 (R1) — mapa completo

| Item | Regra essencial | O que quebra se você não cumprir |
|---|---|---|
| **4** | Escopo: sem fins lucrativos de direito privado; NBC TG 1000 (PME) ou IFRS completa no restante | Aplicação da norma errada ao ente errado |
| **8** | Receitas e despesas em regime de **competência** | Caixa registra, resultado distorce; a prestação de contas do MROSC não fecha |
| **9** | Subvenções e doações para custeio e investimento reconhecidas na **demonstração do resultado**, com confrontação com as despesas financiadas, pela **NBC TG 07** | Receita avulsa sem despesa correspondente; superávit inflado |
| **9A** | Somente subvenções concedidas **em caráter particular** (por solicitação, individualmente) são receita | Verba genérica contabilizada como receita de terceiros |
| **9B** | Imunidades tributárias **não** são subvenção → **não são receita** | Receita ficta que infla a base de indicadores |
| **10** | Segregação de receitas e despesas **com e sem gratuidade**, identificável por atividade (educação, saúde, assistência…) | Gratuidade indemonstrável; risco para o CEBAS e para o art. 14 do CTN |
| **11 e Apêndice** | Controle segregado: **Banco C/Movimento – Recursos com Restrição × Sem Restrição** e **Imobilizado – Bens com Restrição × Sem Restrição**; DRE em blocos por programa | Colchão financeiro imaginário; prestação de contas glosada |
| **12** | Recursos de convênios, editais, contratos e termos para finalidade específica → **contas próprias, segregadas** | Recurso público misturado com recursos livres |
| **15** | Superávit com aplicação restrita → **conta específica** do Patrimônio Líquido | Dinheiro de projeto lançado como reserva livre |
| **19** | Trabalho voluntário — inclusive de membros dos órgãos de gestão — avaliado a **valor justo como se desembolso houvesse**, divulgado por atividade nas notas | O custo real da missão fica invisível; a comparabilidade é destruída |
| **22** | Demonstrações obrigatórias: BP, DRE, DMPL, DFC e Notas (seção 2.5) | Pacote incompleto para auditoria, edital e qualificação |
| **23** | "Capital" → **Patrimônio Social**; lucro/prejuízo → **Superávit/Déficit do Período** | Demonstração com vocabulário de S.A.; reprovada de cara |
| **24** | A DRE evidencia **gratuidades concedidas** e **serviços voluntários obtidos** | Gratuidade sem destaque; o art. 14 do CTN fica sem prova |
| **27** | Notas explicativas mínimas (seção 2.4) | Notas genéricas; renúncia fiscal sem relação; restritores sem rastro |

### 2.3 A estrutura do Balanço Patrimonial da OSC

A moldura é o art. 179 da Lei nº 6.404/1976, **adaptada** pelo ITG 2002. O diagrama abaixo é o desenho que deve guiar o plano de contas:

```text
====================================================================
 BALANÇO PATRIMONIAL DE OSC
   (Lei nº 6.404/1976, art. 179, por analogia
    + ITG 2002, itens 11 e 23)
====================================================================
 ATIVO                              |  PASSIVO
---------------------------------------------------------------------
 ATIVO CIRCULANTE                   |  PASSIVO CIRCULANTE
  Banco C/Movimento – SEM Restrição |   Recursos de Projetos em
  Banco C/Movimento – COM Restrição |   Execução (subvenções e
  Contas a Receber                  |   doações com obrigação a
   (doadores, beneficiários,        |   cumprir)
   termos do MROSC)                 |   Fornecedores e Tributos a
  Estoques de materiais             |   Recolher
                                    |   Provisão de Férias e 13º
---------------------------------------------------------------------
 ATIVO NÃO CIRCULANTE               |  PASSIVO NÃO CIRCULANTE
  Imobilizado – SEM Restrição       |   Obrigações de Longo Prazo
  Imobilizado – COM Restrição       |
  Aplicações de Liquidez            |  PATRIMÔNIO SOCIAL
   (reservas com destinação         |   Capital Social (item 23:
   específica)                      |   rotulado como Patrimônio
                                    |   Social, não "Capital")
                                    |   Reservas de Capital
                                    |   Superávit com Restrição
                                    |    (item 15: conta específica)
                                    |   Superávit/Déficit do Período
                                    |    (item 23)
====================================================================
 REGRA DE OURO: cada bloco "COM Restrição" do Ativo precisa de um
 correspondente no Passivo ou no Patrimônio Social. Se o banco mostra
 R$ 500.000 com restrição e nada no passivo/PL os explica, a
 escrituração está errada — e a prestação de contas cairá.
====================================================================
```

A regra prática do diagrama é simples e implacável: **cada real com restrição no ativo precisa de um dono identificado no passivo ou no patrimônio social**. Se o balanço não fecha nessa lógica, o indicador de reservas também não fecha — e é assim que uma entidade "descobre" noventa meses de colchão que não existem (ver Ex. 6).

### 2.4 Notas explicativas mínimas (item 27)

O item 27 lista o conteúdo mínimo das notas. Agrupado por blocos:

| Rubrica | Conteúdo exigido |
|---|---|
| **(a)–(b)** | Contexto operacional e objetivos sociais; critérios de reconhecimento de receitas e despesas (gratuidade, doação, subvenção) |
| **(c)** | **Relação dos tributos objeto de renúncia fiscal** |
| **(d)–(f)** | Subvenções recebidas e suas aplicações; fundos com restrição; recursos restringidos por doadores |
| **(g)–(i)** | Fatos subsequentes; dívidas de longo prazo; seguros |
| **(j)–(k)** | Adequação de custos de pessoal no ensino superior (LDB); política de depreciação |
| **(l)–(n)** | Separação dos serviços financiados com recursos próprios; dados quantitativos de gratuidade (beneficiários, bolsistas com valores e percentuais); comparação entre **custo** e **valor cobrado** quando este não cobre o custo |

> [!NOTE]
> **Mudança-chave do R1 no item 27, "c":** a redação de 2012 pedia contabilizar a renúncia fiscal *"como se a obrigação devida fosse"*; o **R1 de 2015** substituiu por **"relação dos tributos objeto de renúncia fiscal"** — basta a listagem nas notas, entendida pela CFC como prestação de contas cívica. A afirmação *"o ITG 2002 exige contabilizar tributos renunciados como se devidos"* é **falsa** na redação vigente: hoje isso criaria passivo inexistente e distorceria o Patrimônio Social.

### 2.5 As cinco demonstrações obrigatórias (item 22)

| # | Demonstração | O que ela responde | Base normativa |
|---|---|---|---|
| 1 | **Balanço Patrimonial** | O que a entidade tem, deve e o que é Patrimônio Social em determinada data | NBC TG 26; a partir de 2027, ler NBC TG 51 |
| 2 | **Demonstração do Resultado do Período** | Quanto de Superávit/Déficit o período gerou, em blocos **com e sem restrição**, com gratuidades evidenciadas (itens 24 e 27) | NBC TG 26 → NBC TG 51 |
| 3 | **Demonstração das Mutações do Patrimônio Líquido** | Como o Patrimônio Social mudou: superávit com restrição transferido, reservas constituídas | NBC TG 26 |
| 4 | **Demonstração dos Fluxos de Caixa** | De onde veio e para onde foi o caixa (operação, investimento, financiamento) | NBC TG 03 (R3) |
| 5 | **Notas Explicativas** | Contexto, critérios, restrições, renúncia fiscal, gratuidade quantificada | ITG 2002, item 27 |

A DRE das OSCs tem uma segunda camada de leitura — os **blocos por restrição** do item 11 e do Apêndice:

```text
====================================================================
 DRE DA OSC — ESTRUTURA EM BLOCOS
   (ITG 2002, itens 11, 24 e Apêndice)
====================================================================
 SEM RESTRIÇÃO                     |  COM RESTRIÇÃO
-----------------------------------|-------------------------------
  (+) Doações sem amarra            |  (+) Subvenção vinculada a metas
  (+) Contribuições de associados   |       (Termo de Fomento /
  (+) Receita de eventos            |        Termo de Colaboração)
  (+) Receita financeira            |  (+) Recursos de editais com
  (+) Outras receitas livres        |       finalidade específica
                                    |
  (-) Despesas de PROGRAMA          |  (-) Despesas de PROGRAMA
  (-) Despesas administrativas      |       financiadas pelo recurso
  (-) Despesas de captação          |       vinculado
-----------------------------------|-------------------------------
  = Superávit/Déficit SEM restrição |  = Superávit/Déficit COM
                                    |      restrição
====================================================================
 DESTACOS OBRIGATÓRIOS (item 24 e notas):
   * gratuidades concedidas, por atividade (educação, saúde,
     assistência), com dados quantitativos (item 27, "m" e "n")
   * serviços voluntários obtidos, a valor justo (item 19)
   * relação de tributos com renúncia fiscal (item 27, "c")
====================================================================
```

### 2.6 Atualizações normativas recentes

- **NBC Revisão NAE nº 29/2024** (publicada em 12/12/2024; DOU 23/12/2024): altera os **itens 2 e 3 do ITG 2002**. O escopo passa a abranger fundação de direito privado, associação, organização social, organização religiosa **e entidade sindical**; o **partido político foi removido** (assim como a palavra "política" da lista de atividades). Aplicável a demonstrações de **períodos iniciados a partir de 01/01/2025**.
- **NBC TG 51 / CPC 51 (equivalente à IFRS 18)**: aprovada pela CFC em **13/11/2025** (DOU 22/12/2025); **substitui integralmente a NBC TG 26**; a DRE passa a **cinco categorias** — operacional, investimento (opcional), financiamento, impostos sobre lucro e operações descontinuadas —, com **subtotais obrigatórios**; é **obrigatória para períodos anuais iniciados a partir de 01/01/2027** e afeta os títulos e linhas do **item 22 do ITG 2002**.
- **Outras normas de apoio:** NBC TG 07 (R2) subvenções governamentais; NBC TG 03 (R3) fluxos de caixa; NBC TG 1001/1002 micro e pequenas entidades; **ITG 2000 (R1)** formalidades de escrituração; NBC PG 01 código de ética. A CFC publica o *Caderno de Procedimentos Aplicáveis à Prestação de Contas das Entidades do Terceiro Setor* e o manual *Contabilidade para o Terceiro Setor*.

- **🔢 Você sabia?** A **NBC TG 51** fica obrigatória apenas para períodos anuais **iniciados a partir de 01/01/2027** — o exercício de 2026 é o último fechado sob a NBC TG 26. Como ela **substitui integralmente** a TG 26 e reestrutura a DRE em cinco categorias com subtotais, o plano de contas e os modelos de relatório gerencial precisam estar prontos **antes** do primeiro dia de 2027, e não em janeiro de 2027.

---

## 3. Calendário de obrigações (exercício 2025, apurado em 2026)

| Obrigação | Quem entrega | Prazo | Base normativa |
|---|---|---|---|
| **ECD** (Diário/Razão em SPED) | PJs com escrituração; **dispensa**: entidades imunes/isenas com receita **< R$ 4.800.000** e PJs inativas | Último dia útil de **junho** → **30/06/2026** | IN RFB nº 2.003/2021, arts. 3º, IV e 5º |
| **ECF** (e-Lalur/e-Lacs) | Todas as PJs, **incluindo imunes e isentas** | Último dia útil de **julho** → **31/07/2026** (leiaute 12) | IN RFB nº 2.004/2021, art. 3º; ADE Cofis 02/2026 |
| **DCTFWeb** | Todas as PJs, inclusive imunes/isentas (sem movimento: deve ser entregue "sem movimento") | **Último dia útil do mês seguinte** ao fato gerador (**antes era dia 25**) | IN RFB nº 2.237/2024, art. 6º, alterada pela IN RFB nº 2.248/2025 |
| **eSocial** | OSC com folha CLT | Mensal, agrupada — em regra até o dia 15 por evento (*prazo por grupo de eventos: não verificado nesta pesquisa*) | Legislação eSocial; Grupo 3, Portaria Conjunta SEPRT/RFB/ME nº 71/2021 |
| **EFD-Reinf** | Retenções de IRRF e contribuições (CSRF) | Mensal — em regra dia 15 (*não verificado nesta pesquisa*) | IN RFB nº 1.701/2017 |
| **Demonstrações contábeis** | Todas as OSCs | Anual, conforme o estatuto | ITG 2002, item 22 |
| **Prestação de contas (recursos públicos)** | OSCs receptoras do MROSC | Anual + final, em até **1 ano**; via Transferegov.br | Lei nº 13.019/2014, arts. 22 e 70 a 74 |

- **🔢 Você sabia?** A **dispensa da ECD** é por **limite de receita**: entidades imunes ou isentas com receita (inclusive doações, incentivos, subvenções, contribuições, auxílios, convênios e ingressos assemelhados) **inferior a R$ 4.800.000,00** no ano-calendário ficam dispensadas (IN RFB nº 2.003/2021, art. 3º, IV). "Ser imune" **não** dispensa por si só: uma OSC imune com receita de R$ 6 milhões entrega a ECD normalmente.

> [!WARNING]
> **A ECF é obrigatória para todas as pessoas jurídicas, inclusive imunes e isentas — só a ECD tem dispensa por porte.** Exemplo numérico do calendário: uma OSC imune com receita de **R$ 3.900.000** **não entrega a ECD** (está abaixo de R$ 4.800.000), mas **continua obrigada à ECF até o último dia útil de julho (31/07/2026)**. Confundir os dois prazos e as duas regras de dispensa é uma das causas mais comuns de multa no setor — e a multa é pior porque é **evitável com uma linha na agenda**.

### 3.1 Procedimento de fechamento do ano fiscal

1. **Encerrar as operações do exercício** em 31/12 — conciliação bancária, apuração de estoques e depreciação do imobilizado;
2. **Fechar por competência** (item 8) — provisões, décimos terceiros, férias, depreciação e contrapartida das subvenções recebidas (NBC TG 07);
3. **Reconhecer a receita vinculada** apenas na proporção da despesa qualificada ou do cumprimento de metas (itens 9 e 12);
4. **Separar os blocos com e sem restrição** da DRE e conferir o Balanço (item 11);
5. **Montar as notas** do item 27 — em especial a relação de renúncia fiscal (c), os fundos com restrição (e) e a gratuidade quantificada (m e n);
6. **Aprovar as demonstrações** no órgão competente conforme o estatuto e colher as assinaturas exigidas (para OSCIP: contador no Balanço e na DRE);
7. **Entregar a ECD** até o último dia útil de junho, **se acima do limite**, e **a ECF sempre**, até o último dia útil de julho;
8. **Publicar ou disponibilizar** as contas (art. 14, VI, do CTN; estatuto; cláusulas de OSCIP/OS) e guardar os livros pelo prazo da legislação.

```text
 ANO-CALENDÁRIO 2025  ->  OBRIGAÇÕES DE 2026
====================================================================
 31/12/2025  fechamento por competência
     |
 JAN-MAR     ajustes, conciliação, notas explicativas
     |
 30/06/2026  ECD  (só se receita >= R$ 4.800.000 em imunes/isenas)
     |
 31/07/2026  ECF  (SEMPRE — todas as PJs, inclusive imunes)
     |
 MENSAL      DCTFWeb: último dia útil do mês SEGUINTE
             eSocial / EFD-Reinf: mensal (confirmar grupo)
     |
 ANUAL       demonstrações do item 22 + prestação de contas
             do MROSC em até 1 ano (Transferegov.br)
====================================================================
```

---

## 4. Comparação internacional das demonstrações

| | Brasil (ITG 2002) | EUA (ASC 958) | Setor público (IPSAS) | Reino Unido (SORP 2026) |
|---|---|---|---|---|
| **Norma** | ITG 2002 (R1) + NBC TG 26 → **NBC TG 51** | ASC 958 | IPSAS 23 e 35 | FRS 102 + SORP 2026 |
| **Posição** | Balanço Patrimonial | Statement of Financial Position | Statement of Financial Position | Balance sheet |
| **Resultado** | DRE (blocos **com/sem restrição**, por atividade) | Statement of Activities (duas colunas) | Statement of Comprehensive Financial Performance | SOFA (Statement of Financial Activities) |
| **Patrimônio líquido** | Patrimônio Social; Superávit/Déficit | Net assets released from restriction | Net assets | Fundos livres, restritos e permanentes (endowment) |
| **Fluxo de caixa** | **DFC obrigatória** (item 22) | Obrigatória | Obrigatória | Só no Tier 3 (acima de £ 15 milhões) |
| **Vigência** | NAE 29 desde 01/01/2025; NBC TG 51 desde 01/01/2027 | vigente | vigente | desde 01/01/2026 (renda ≥ £ 500 mil = contas acumuladas) |

Duas leituras saem dessa tabela:

1. O Brasil é um dos poucos ordenamentos que **exige Demonstração dos Fluxos de Caixa** para entidades sem fins lucrativos **de qualquer porte** — o que torna a DFC brasileira um instrumento de prestação de contas muito mais rigoroso que o britânico, onde ela só é exigida no Tier 3 (acima de £ 15 milhões);
2. O conceito de **restrição** é universal (duas colunas nos EUA; *net assets* no IPSAS; fundos restritos no Reino Unido), mas o **rótulo** varia — e é por isso que o vocabulário do item 23 (Patrimônio Social; Superávit/Déficit) precisa estar correto para que a demonstração seja lida fora do Brasil sem prejuízo de sentido.

> [!NOTE]
> **Como usar a tabela em uma prestação de contas internacional.** Financiador estrangeiro raramente pede "ITG 2002": pede *Statement of Activities* com separação entre *net assets with donor restrictions* e *without donor restrictions*. A ponte é exatamente a coluna "bloco com/sem restrição" da DRE brasileira. Quem prepara o pacote já com esses dois blocos atende à norma brasileira **e** ao vocabulário do ASC 958 sem refazer nada depois.

---

## 5. Dados do setor e indicadores de saúde financeira

### 5.1 O panorama do investimento social privado

**Censo GIFE 2024–2025** (publicado em 08/12/2025):

| Indicador | Valor | Reflexo contábil |
|---|---|---|
| Investimento Social Privado (ISP) | **R$ 5,8 bilhões em 2024** | Escala do fluxo que passa pelas OSCs |
| Vindo de fluxos incentivados | **15% (R$ 877 milhões)** | Receita sujeita a comprovação de destinação |
| Transferidos diretamente a OSCs | **R$ 1,3 bilhão (23%)** | Base de contratos, termos e prestação de contas |
| Apoio institucional **sem restrição** | **R$ 223 milhões (17% das transferências)** | Só **~1 em cada 6 reais** transferidos chega sem amarras |

Conferência aritmética do dado: 17% de R$ 1.300.000.000 = R$ 221.000.000 ≈ **R$ 223 milhões** divulgados. É esse número que explica a obsessão do ITG 2002 por contas segregadas: **o recurso livre é minoritário** — cerca de 83% dos valores transferidos chegam com alguma amarra de aplicação. Tratar todo o caixa como livre é um erro de leitura de cinco seis dos reais que passam pela entidade.

- **🔢 Você sabia?** Se você somar as transferências incentivadas (R$ 877 milhões) e o apoio sem restrição (R$ 223 milhões), terá cerca de R$ 1,1 bilhão — **menos** do que os R$ 1,3 bilhão transferidos diretamente a OSCs. As categorias do Censo GIFE **não se somam**: são recortes distintos do mesmo investimento. Soma errada de indicadores é a forma mais rápida de parar de fazer sentido em relatório anual.

### 5.2 Heurísticas de gestão (não são normas)

| Indicador | Fórmula | Faixas de leitura |
|---|---|---|
| **Razão de programa** | despesa de programa ÷ despesa total | **≥ 70–80%** é saudável; Charity Navigator: ponto cheio em **0,85** (médias e grandes) e **0,70** (pequenas), **0,50 = zero ponto**, com média móvel de 3 anos (Guia de Metodologia, mar/2026) |
| **Custo de captação** | despesa de captação ÷ doações recebidas | **< R$ 0,15** por R$ 1: forte · **0,15 a 0,30**: normal · **> R$ 0,35**: investigar |
| **Reservas (colchão)** | caixa livre ÷ despesa mensal livre | **3 a 6 meses**: saudável · **< 1 mês**: crítico |
| **Rateio de custos indiretos** | indiretos rateados por base (horas-pessoa, despesa direta, beneficiários) | Não há percentual único: o requisito é **base coerente e consistente** (item 27, "l") |

> [!WARNING]
> **Todos os números desta seção são heurísticas de ensino, sem norma da CFC** — e alguns foram sinalizados explicitamente como **não verificados** na pesquisa que originou esta lição. Trate-os como **estimativas de gestão**, nunca como exigência legal ou como metodologia oficial de certificação:
>
> - as **faixas de reservas (3 a 6 meses)** e de **custo de captação (R$ 0,15 / R$ 0,30)** não têm norma do CFC que as adote;
> - os **estudos brasileiros de custo/eficiência** atribuídos a IDIS, Aroim ou Extrato **não foram localizados** nesta pesquisa — não os cite como fonte;
> - as **faixas de estrelas legadas do Charity Navigator** podem **não valer** na metodologia Encompass 2026;
> - os **prazos mensais de eSocial e EFD-Reinf** (regra: dia 15) **devem ser confirmados** por grupo de eventos;
> - as **alíquotas de transição de CBS/IBS entre 2027 e 2033** e a Res. CGIBS nº 6/2026 são **parciais**: trate o cronograma como estimativa de planejamento.

- **🔢 Você sabia?** A frase mais perigosa em reunião de conselho é *"nossa razão de programa está ótima"* quando ninguém definiu o **numerador**. Incluir horas administrativas no "programa" ou excluir a captação do denominador muda o indicador sem mudar a realidade — é assim que a mesma entidade aparece com 0,78 ou com 0,92 dependendo de quem calcula. Indicador sem política de cálculo documentada não é indicador: é opinião com sinal de porcentagem.

---

## 6. Exemplos resolvidos com aritmética completa

### Ex. 1 — Subvenção vinculada (Termo de Fomento) e seus lançamentos

**Fatos:** termo de **12 meses** no valor de **R$ 120.000,00**; **R$ 60.000,00** desembolsados no ato (50% do total), restante liberado por metas; custos indiretos previstos de **R$ 12.000,00**.

**Passo 1 — dimensionar o indireto.** 10% de R$ 120.000,00 = **R$ 12.000,00**. Esse indireto é parte do próprio termo (não é valor extra): ele será rateado à medida que a despesa qualificada for reconhecida.

**Passo 2 — recebimento.** O caixa entra, mas **é passivo, não receita**, porque a entidade ainda não cumpriu a obrigação (NBC TG 07):

```text
D  Banco – Recursos com Restrição .............. 60.000,00
   C  Recursos de Projetos em Execução (passivo) ... 60.000,00
```

Conferência: Ativo (Banco com restrição) +60.000,00 = Passivo +60.000,00. O Patrimônio Social **não muda** — não houve superávit.

**Passo 3 — após 6 meses, R$ 48.000,00 de despesa qualificada.** Reconhece-se a receita no confronto:

```text
D  Recursos de Projetos em Execução ............ 48.000,00
   C  Receita de Subvenções com Restrição ......... 48.000,00
   (encerramento para Superávit com Restrição na DMPL)
```

**Passo 4 — conferências aritméticas:**

- saldo residual do passivo: 60.000,00 − 48.000,00 = **R$ 12.000,00** de obrigação ainda a cumprir;
- progresso do termo: 48.000,00 ÷ 120.000,00 = **40%**;
- indireto proporcional já embutido: 48.000,00 × 10% = **R$ 4.800,00** (o indireto total do termo continua sendo 12.000,00, reconhecido junto da despesa qualificada);
- se a meta seguinte liberar os outros 50%, entram **60.000,00** de caixa que **continuam sendo passivo** até nova despesa qualificada;
- ao fim dos 12 meses, se tudo for executado: receita total de **120.000,00**, indireto total de **12.000,00** e passivo zerado (120.000,00 − 120.000,00 = 0).

**Passo 5 — notas explicativas:** restrição de aplicação, cronograma de metas, saldo residual (R$ 12.000,00) e o rateio de indiretos. Sem essas três informações, o mesmo número que fecha o balanço **não fecha a prestação de contas**.

### Ex. 2 — Razão de programa e qualificação Charity Navigator

**Fatos:** despesas totais de **R$ 1.000.000** = programa **780.000** + administrativas **150.000** + captação **70.000**; doações recebidas de **R$ 900.000**.

**Passo 1 — razão de programa:**

$$
\text{Razão de programa} = \frac{780.000}{1.000.000} = 0{,}78 = 78\%
$$

Conferência de soma: 780.000 + 150.000 + 70.000 = 1.000.000 ✓.

**Passo 2 — qualificação do Charity Navigator para médias e grandes (ponto cheio em 0,85; zero em 0,50):**

$$
\frac{0{,}78 - 0{,}50}{0{,}85 - 0{,}50} = \frac{0{,}28}{0{,}35} = 0{,}80 \text{ de ponto}
$$

**Passo 3 — se a entidade fosse de pequeno porte (ponto cheio em 0,70):**

$$
\frac{0{,}78 - 0{,}50}{0{,}70 - 0{,}50} = \frac{0{,}28}{0{,}20} = 1{,}40
$$

O resultado acima de 1,00 **extrapola a escala**: como 0,70 é o topo da faixa para pequenas entidades, o indicador é **limitado ao ponto cheio (1,00)**. Repare no efeito prático: o **mesmo 0,78** vale 0,80 de ponto para grande porte e teto cheio para pequeno porte — a nota depende do padrão aplicado, não só do cálculo.

**Passo 4 — a conta inversa (entidade pequena com razão de programa 0,62):**

$$
\frac{0{,}62 - 0{,}50}{0{,}70 - 0{,}50} = \frac{0{,}12}{0{,}20} = 0{,}60 \text{ de ponto}
$$

Com o padrão de grandes, a mesma razão de 0,62 daria (0,62 − 0,50) ÷ (0,85 − 0,50) = 0,12 ÷ 0,35 ≈ **0,34 de ponto**.

> [!NOTE]
> O denominador do score é a **distância entre o piso (0,50) e o teto (0,85 ou 0,70)** — e a média é **móvel de 3 anos**. Por isso uma captação atípica num único ano distorce menos a nota anual do que a diretoria imagina, e por isso a tendência de três anos vale mais do que o número isolado.

### Ex. 3 — Orçamento anual de 12 meses, com conferência de caixa

| Receitas | Valor (R$) | Despesas | Valor (R$) |
|---|---:|---|---:|
| Doações | 600.000 | Pessoal de programa | 480.000 |
| Subvenção vinculada | 360.000 | Materiais | 180.000 |
| Eventos | 120.000 | Rateio indireto (12%) | 132.000 |
| Receita financeira | 20.000 | Administrativo | 150.000 |
| | | Estrutura | 60.000 |
| | | Auditoria e contabilidade | 40.000 |
| | | Captação | 38.000 |
| | | Contingência | 20.000 |
| **Total** | **1.100.000** | **Total** | **1.100.000** |

**Conferências aritméticas:**

1. Receitas: 600.000 + 360.000 + 120.000 + 20.000 = **1.100.000** ✓;
2. Despesas: 480.000 + 180.000 + 132.000 + 150.000 + 60.000 + 40.000 + 38.000 + 20.000 = **1.100.000** ✓;
3. Rateio indireto: 1.100.000 × 12% = **132.000** ✓;
4. Razão de programa do orçamento: (480.000 + 180.000) ÷ 1.100.000 = 660.000 ÷ 1.100.000 = **0,60** — **abaixo** da faixa de 70–80%: a estrutura pesada (rateio + administrativo + estrutura + auditoria + captação + contingência) consome 440.000, ou **40%** do total;
5. Custo de captação previsto: 38.000 ÷ 600.000 (doações) = **R$ 0,063 por R$ 1** captado (faixa "forte", abaixo de R$ 0,15);
6. **Ajustes de caixa:**
   - a depreciação de **48.000** é despesa **não-caixa** → se todos os ingressos forem recebidos no ano, o caixa gerado é 1.100.000 − 48.000 = **R$ 1.052.000**;
   - a subvenção de 360.000 entra **faseada pelo cronograma** de desembolso, não em bloco único. Se a liberação fosse uniforme: 360.000 ÷ 12 = **R$ 30.000/mês**; se as metas liberarem 40% na primeira metade, o caixa da 1ª metade é 360.000 × 40% = **R$ 144.000**, e não 180.000;
7. **Caixa mínimo:** custos fixos = 150.000 (administrativo) + 60.000 (estrutura) + 40.000 (auditoria) = **250.000/ano** → 250.000 ÷ 12 = **R$ 20.833,33/mês** → para 3 meses: 20.833,33 × 3 = **R$ 62.500,00** (ou, direto: 250.000 × 3 ÷ 12 = 62.500).

**Leitura:** um orçamento equilibrado (1.100.000 = 1.100.000) pode estar **desequilibrado na composição** (programa em 60%) e **frágil no caixa** (mínimo de R$ 62.500,00, contra aplicações que podem estar presas por restrição).

### Ex. 4 — Compra com imunidade: o art. 9º, § 4º da LC nº 214/2025

**Fatos:** escola imune (atende ao art. 14 do CTN) compra **R$ 10.000,00** de material didático, com **12% de IBS/CBS embutidos**.

**Passo 1 — o tributo embutido:** 10.000,00 × 12% = **R$ 1.200,00**.

**Passo 2 — a saída é imune, a entrada não:** a **oferta** de serviços educacionais é imune (art. 9º, III, c/c § 3º); mas, pelo **§ 4º**, a aquisição **não** é alcançada pela imunidade.

**Passo 3 — o custo real:** 10.000,00 + 1.200,00 = **R$ 11.200,00** de despesa total, **sem saldo a recuperar**, sem crédito e sem compensação.

**Passo 4 — o orçamento equivocado:** se a área financeira orçou R$ 10.000,00 por considerar a compra "imune", o desvio por operação é 1.200,00 ÷ 10.000,00 = **12%**. Com **50 compras equivalentes por ano**: 50 × 1.200,00 = **R$ 60.000,00 de orçamento faltante** — valor que bancaria um trimestre de materiais ou um analista de prestação de contas.

**Passo 5 — cronograma:** a **CBS** começa em **2027** e o **IBS** avança em fases entre **2029 e 2033** (*alíquotas de transição em regulamentação — dados parciais nesta pesquisa: trate o cronograma como estimativa de planejamento*). A consequência é um **aumento permanente de custo, escalonado por ano**, e não um evento único.

> [!IMPORTANT]
> **Regra de ouro orçamentária:** nenhum contrato, cotação ou centro de custo de OSC deve ser aprovado sem a linha "IBS/CBS na aquisição (não recuperável)". Enquanto a receita for imune e a compra não, **a margem de segurança do orçamento é exatamente o tributo que você não recuperará**. Essa é a tradução financeira do art. 9º, § 4º da LC nº 214/2025.

### Ex. 5 — Trabalho voluntário e renúncia fiscal

**Fatos:** um diretor contribui **10 h/mês** a valor justo de **R$ 150,00/h**; a entidade tem **R$ 45.000,00** de renúncia fiscal no ano.

**Passo 1 — o valor justo mensal:** 10 × 150,00 = **R$ 1.500,00/mês**.

**Passo 2 — lançamento (item 19 do ITG 2002, "como se desembolso houvesse"):**

```text
D  Despesa – Trabalho Voluntário ............... 1.500,00
   C  Contrapartida – Trabalho Voluntário .......... 1.500,00
   (divulgado POR ATIVIDADE nas notas explicativas)
```

**Passo 3 — dimensão anual:** 1.500,00 × 12 = **R$ 18.000,00/ano** de serviço voluntário de um único dirigente. Se outros quatro voluntários prestam valores equivalentes, a missão recebe cerca de **R$ 90.000,00/ano** de contribuição que não aparece no caixa — e que, sem o item 19, **nunca apareceria em nenhum relatório**.

**Passo 4 — a renúncia fiscal:** os **R$ 45.000,00** de renúncia **não geram lançamento algum**. Não há débito, não há passivo, não há receita. A exigência do item 27, "c", é **relação** nas notas:

```text
Tributos objeto de renúncia fiscal no exercício:
  IRPJ, CSLL, demais tributos conforme a legislação vigente
  Total aproximado do exercício: R$ 45.000,00
```

**Passo 5 — a armadilha do art. 14 do CTN:** se o **mesmo dirigente** receber remuneração **acima do ressarcimento de despesas**, a condição 5 do art. 14 do CTN fica ameaçada — e a imunidade da entidade, junto com ela. O trabalho voluntário **não pode ser caminho de remuneração disfarçada**: o valor justo é reconhecido **como despesa e contrapartida**, sem saída de caixa e sem contraprestação pessoal.

### Ex. 6 — Custo de captação e reservas (o numerador que ninguém confere)

Usando os dados do Ex. 2: despesas totais de R$ 1.000.000 (programa 780.000 + administrativas 150.000 + captação 70.000), doações de R$ 900.000 e caixa livre de R$ 450.000.

**Passo 1 — custo de captação:**

$$
\frac{70.000}{900.000} = 0{,}0777\ldots \approx \text{R\$ } 0{,}078 \text{ por R\$ } 1 \text{ captado}
$$

Leitura: para cada R$ 1,00 doado, a entidade gastou cerca de **7,8 centavos** para captá-lo — faixa **"forte"** (abaixo de R$ 0,15). Em cada R$ 100,00 captados: R$ 7,80 gastos.

**Passo 2 — despesa mensal de referência:** 1.000.000 ÷ 12 = **R$ 83.333,33/mês**.

**Passo 3 — reservas livres:**

$$
\frac{450.000}{83.333,33} = 5{,}4 \text{ meses}
$$

Leitura: **5,4 meses** — dentro da faixa saudável de 3 a 6 meses (heurística, não norma).

**Passo 4 — o erro do numerador gordo.** Se a entidade incluir no "caixa" R$ 300.000 de subvenção vinculada:

- caixa "achado": 450.000 + 300.000 = **750.000**;
- reservas aparentes: 750.000 ÷ 83.333,33 = **9,0 meses** ← falsa sensação de segurança;
- reservas reais: 450.000 ÷ 83.333,33 = **5,4 meses**;
- diferença: 9,0 − 5,4 = **3,6 meses de ilusão financeira**, sem que um único real tenha mudado de lugar.

> [!NOTE]
> **Disciplina do numerador:** o caixa de subvenção vinculada **não** entra em reservas livres — ele já tem dono, prazo e prestação de contas. Excluir R$ 300.000 "mudou" a leitura de 5,4 para 9,0 meses **sem mexer no banco**. É por isso que o item 11 exige o Banco segregado em **Com Restrição × Sem Restrição**: o indicador só é honesto se o saldo for honesto.

### Ex. 7 — Rateio de custos indiretos por base de horas-pessoa

**Fatos:** custos indiretos anuais de **R$ 132.000,00** a ratear entre três programas, com base em horas-pessoa: Programa A **1.200 h**, Programa B **600 h**, Programa C **400 h**.

**Passo 1 — base total:** 1.200 + 600 + 400 = **2.200 h**.

**Passo 2 — taxa horária do rateio:** 132.000,00 ÷ 2.200 = **R$ 60,00/h**.

**Passo 3 — distribuição:**

| Programa | Horas | Cálculo | Rateio (R$) | % da base |
|---|---:|---|---:|---:|
| A | 1.200 | 1.200 × 60,00 | 72.000,00 | 54,5% |
| B | 600 | 600 × 60,00 | 36.000,00 | 27,3% |
| C | 400 | 400 × 60,00 | 24.000,00 | 18,2% |
| **Total** | **2.200** | — | **132.000,00** | **100%** |

Conferência: 72.000 + 36.000 + 24.000 = **132.000** ✓. Percentuais: 1.200 ÷ 2.200 = 54,5%; 600 ÷ 2.200 = 27,3%; 400 ÷ 2.200 = 18,2% (soma 100%).

**Passo 4 — o teste da coerência:** se o Programa C absorve 18,2% dos indiretos mas responde por **45%** da despesa total do projeto, a base de horas está provavelmente errada — e a razão de programa de cada bloco da DRE sai distorcida. O ITG 2002 **não prescreve qual base usar**: ele prescreve **consistência e evidência** (item 27, "l": segregação dos serviços financiados com recursos próprios).

---

## 7. Procedimentos passo a passo da rotina financeira

### 7.1 Fechamento contábil mensal em oito passos

1. **Conciliar bancos** por conta **e** por restrição (Banco C/Movimento – Sem Restrição × Com Restrição);
2. **Conciliar contas a receber** por doador, edital e termo, confrontando com o cronograma de desembolso;
3. **Apurar custos e despesas por competência** (item 8): provisões de férias e 13º, depreciação, amortizações;
4. **Reconhecer a receita vinculada** na proporção da despesa qualificada (itens 9 e 12) — **nunca** pelo simples recebimento;
5. **Executar o rateio de indiretos** pela base aprovada e conferir o total contra o razão auxiliar (Ex. 7);
6. **Separar os blocos com e sem restrição** da DRE e ajustar as contas do Patrimônio Líquido (item 15);
7. **Atualizar as informações das notas**: restrições, voluntariado do período (item 19) e gratuidade por atividade;
8. **Fechar o pacote de gestão**: DRE por atividade, indicadores (razão de programa, custo de captação, reservas livres) e alertas de caixa para o conselho.

### 7.2 O ciclo do recurso vinculado, do recebimento à prestação de contas

```text
 1. PROPOSTA / PLANO DE TRABALHO (Lei nº 13.019/2014, art. 22)
    -> previsão de receitas e despesas (inciso II-A)
    -> cronograma de desembolso (inciso VIII)
                        ...  a restrição NASCE aqui
                        |
 2. RECEBIMENTO
    -> D Banco – Recursos com Restrição
       C Recursos de Projetos em Execução (PASSIVO)
                        |
 3. EXECUÇÃO
    -> despesa qualificada documentada, por meta
       e por centro de custo
                        |
 4. RECONHECIMENTO (NBC TG 07)
    -> D Recursos de Projetos em Execução
       C Receita de Subvenções com Restrição
    -> encerramento para Superávit com Restrição (DMPL)
                        |
 5. DEMONSTRAÇÃO
    -> blocos "Com Restrição" na DRE
    -> notas: restrição, metas e saldo residual
                        |
 6. PRESTAÇÃO DE CONTAS
    -> anual + final, em até 1 ANO (Transferegov.br)
    -> apreciação da administração em até 150 dias
                        |
 7. ENCERRAMENTO
    -> saldo residual volta a ser PASSIVO ou é
       devolvido/reprogramado  (NUNCA migra
       automaticamente para recursos livres)
```

### 7.3 Checklist do conselho fiscal ou do órgão que aprova as contas

- o Balanço Patrimonial fecha? (Ativo = Passivo + Patrimônio Social);
- a soma dos blocos **Com Restrição + Sem Restrição** bate com a DRE total?
- o caixa "livre" do indicador de reservas **exclui** os saldos com restrição?
- a razão de programa usa **numerador e denominador documentados**?
- as notas trazem a **relação de renúncia fiscal** (item 27, "c")?
- a gratuidade está **quantificada** por atividade (item 27, "m" e "n")?
- o voluntariado está a **valor justo** e divulgado por atividade (item 19)?
- a ECD foi entregue (se acima de R$ 4.800.000) e a ECF, **sempre**?
- as contas foram **publicadas ou disponibilizadas** (art. 14, VI, do CTN)?

---

## 8. Erros comuns e armadilhas

> [!WARNING]
> **Os erros que mais aparecem em auditoria, em prestação de contas e em prova — todos ancorados em dispositivo verificado:**
>
> 1. **Tratar imunidade como crédito**: pelo art. 9º, § 4º da LC nº 214/2025, o IBS/CBS das **aquisições** é **custo não recuperável** (Ex. 4);
> 2. **Confundir ECD com ECF**: só a ECD tem dispensa por porte (receita < R$ 4.800.000, IN RFB nº 2.003/2021, art. 3º, IV); a ECF é obrigatória para **todas** as PJs, inclusive imunes e isentas;
> 3. **Receber verba global como receita**: subvenções só são receita pelo item **9A** (caráter particular, por solicitação e individualmente); imunidade **nem é subvenção** (item **9B**);
> 4. **Registrar caixa recebido como receita**: até o cumprimento da obrigação, o recurso de termo ou edital é **passivo** (NBC TG 07);
> 5. **Não segregar contas por restrição**: viola os itens **11, 12 e 15** e compromete a prestação de contas do MROSC;
> 6. **Contabilizar renúncia fiscal como débito**: o ITG 2002 (R1) pede apenas **relação nas notas** (item 27, "c");
> 7. **Ignorar a mudança de prazo da DCTFWeb**: passou do dia 25 para o **último dia útil do mês seguinte** (IN RFB nº 2.248/2025);
> 8. **Exigir ou oferecer "RAPP"**: o documento **não existe** no CFC (a Res. CFC nº 1.591/2020 trata de escritórios representativos do CRC);
> 9. **Confundir atividade eventual com habitualidade**: receita econômica habitual sai da imunidade e entra no lucro real, com IRPJ, CSLL e escrituração plena;
> 10. **Tratar benchmark como norma**: faixas de custo de captação e meses de reserva são **heurísticas de gestão**, não exigência do CFC;
> 11. **Achar que "imune" significa "dispensado de obrigações"**: a dispensa da ECD é por **limite de receita**, e a ECF continua obrigatória;
> 12. **Incluir recurso restrito no numerador de reservas**: o indicador salta de 5,4 para 9,0 meses sem mudar o caixa real (Ex. 6);
> 13. **Copiar plano de contas de empresa**: "Capital" e "Lucro do período" violam o item **23**;
> 14. **Esquecer que a NBC TG 51 chega em 01/01/2027** e manter o modelo da NBC TG 26 sem planejamento de transição.

---

## 9. Estudos de caso

**Caso 1 — Escola imune planejando a transição tributária.**
Entidade educativa com receita de **R$ 12.000.000**. Como a receita supera R$ 4.800.000, ela entrega **tanto a ECD (30/06/2026) quanto a ECF (31/07/2026)**. No orçamento, o IBS/CBS das aquisições é modelado como **custo permanente**: nas 50 compras equivalentes do Ex. 4, **R$ 60.000/ano** de impacto já foram alocados ao centro de custo "estrutura", e não a "projeto imune". O fechamento concentra esforço no rateio de indiretos por atividade e na divulgação pública das contas exigida pelo art. 14, VI, do CTN.

**Caso 2 — OSC que captou R$ 900.000 e não sabe para onde foi.**
Com razão de programa de **0,78** e custo de captação de **R$ 0,078** por real, a entidade está saudável nos indicadores. O problema é outro: **sem contas segregadas** (item 12), ela não consegue provar a um financiador que o dinheiro restrito foi usado na finalidade contratada — e perde a renovação do termo de fomento. A correção é retroativa: reconstruir o razão auxiliar por restrição, apurar o saldo residual e reemitir as notas do item 27, "d" a "f".

**Caso 3 — Entidade em risco de caixa.**
A diretoria vê **9,0 meses** de reserva (750.000 ÷ 83.333). A auditoria retira do numerador **R$ 300.000** de subvenções vinculadas e o indicador cai para **5,4 meses**. Ao conferir o plano de contas, descobre-se que outros **R$ 120.000** de aplicação financeira estão **presos** por cláusula de doador: o caixa realmente livre é 450.000 − 120.000 = **330.000**, o que dá 330.000 ÷ 83.333 = **4,0 meses**. O plano de contingência — rateio revisto, captação sem restrição e adiamento de despesa discricionária — só funciona porque a **segregação existia**: sem ela, a entidade teria descoberto o desalinhamento quando o saldo já fosse irrecuperável.

**Caso 4 — OSCIP que confundiu "documento" com "registro".**
Ao requerer a qualificação, a entidade apresentou balanço assinado por contador, ata de eleição e declaração de 3 anos, mas o pedido foi devolvido por falta da **declaração de não acumulação** e por estatuto anterior a 2005 sem a cláusula de forma de gestão administrativa e aprovação das contas. Lição: o pacote da OSCIP é **documental e estatutário ao mesmo tempo** — e o CSC não estava em nenhuma linha do pedido.

**Caso 5 — Conselho fiscal recebe DRE sem voluntariado.**
Um conselheiro pergunta por que o custo da guardaneria não aparece no orçamento, embora três voluntárias mantenham o serviço. A resposta: o item 19 exige **valor justo** do trabalho voluntário e o item 24 exige **evidenciar os serviços voluntários obtidos** na DRE. Refeito o reconhecimento (1.500,00/mês × 3 voluntárias × 12 = **R$ 54.000,00/ano**), a razão de programa **caiu de 0,74 para 0,68** — porque o serviço era real, só estava invisível. Indicador sem item 19 mede contabilidade, não missão.

---

## 10. Itens não verificados nesta pesquisa

Para você não transformar lacuna de pesquisa em afirmação categórica:

- **Faixas de reservas (3 a 6 meses) e de custo de captação (R$ 0,15 / R$ 0,30):** heurísticas de ensino, **sem norma da CFC**;
- **Estudos brasileiros de custo/eficiência** atribuídos a IDIS, Aroim ou Extrato: **não localizados** — não citar como fonte;
- **Faixas de estrelas legadas do Charity Navigator:** podem **não valer** na metodologia Encompass 2026;
- **Prazos mensais de eSocial e EFD-Reinf:** "em regra dia 15" — **confirmar por grupo de eventos**;
- **Alíquotas de transição de CBS/IBS entre 2027 e 2033 e Res. CGIBS nº 6/2026:** dados **parciais**; cronograma tratado aqui como estimativa de planejamento.

---

## Perguntas Práticas (Practice Questions)

```question
{
  "id": "npof-10-q1",
  "type": "multiple-choice",
  "question": "Qual documento NÃO é exigido para qualificar uma entidade como OSCIP?",
  "options": [
    "Registro no CSC (Cadastro de Entidades Sem Fim Lucrativo)",
    "Balanço Patrimonial e DRE do exercício anterior assinados por contador",
    "Ata de eleição da diretoria",
    "Declaração de funcionamento regular há pelo menos 3 anos"
  ],
  "correct": 0,
  "explanation": "O CSC não é requisito da qualificação de OSCIP. Exigidos: requerimento eletrônico, estatuto registrado (arts. 1º a 4º da Lei nº 9.790/1999), ata de eleição, declaração de funcionamento regular há no mínimo 3 anos, declaração de não acumulação, Balanço Patrimonial e DRE assinados por contador, declaração de isenção de IR e prova de CNPJ."
}
```

```question
{
  "id": "npof-10-q2",
  "type": "multiple-choice",
  "question": "Sob a LC nº 214/2025, o IBS/CBS pago na compra de uma van por uma OSC imune é recuperável?",
  "options": [
    "Sim, porque a imunidade do art. 9º, III, alcança a aquisição",
    "Sim, desde que a entidade informe o fato na ECF",
    "Não: pelo art. 9º, § 4º, a imunidade não se aplica às aquisições, e o imposto embutido vira custo não recuperável",
    "Não, mas pode ser compensado com a renúncia fiscal das notas"
  ],
  "correct": 2,
  "explanation": "O art. 9º, § 4º da LC nº 214/2025 afasta a imunidade das aquisições de bens materiais e imateriais (inclusive direitos) e de serviços pela entidade. O imposto embutido é não recuperável e deve ser orçado como aumento permanente de custo, escalonado por ano (CBS a partir de 2027; IBS em fases entre 2029 e 2033)."
}
```

```question
{
  "id": "npof-10-q3",
  "type": "multiple-choice",
  "question": "Um estado doa uma quantia única para fortalecer o terceiro setor a todas as OSCs do território, sem solicitação individual. Essa verba é receita para fins do ITG 2002?",
  "options": [
    "Sim, toda transferência de governo é receita no recebimento",
    "Sim, desde que registrada na rubrica de subvenções do item 9",
    "Não: subvenções só são receita quando concedidas em caráter particular (item 9A), e imunidades nem são subvenção (item 9B)",
    "Não, mas deve ser lançada como passivo até o fim do exercício"
  ],
  "correct": 2,
  "explanation": "Pelo item 9A, somente subvenções concedidas em caráter particular — por solicitação e individualmente — são receita. O item 9B reforça que imunidades tributárias não são subvenção nem receita. Verba genérica, sem amarra individual, não pode inflar a receita da entidade."
}
```

```question
{
  "id": "npof-10-q4",
  "type": "multiple-choice",
  "question": "Quando a NBC TG 51 passa a ser obrigatória e o que ela substitui?",
  "options": [
    "A partir de períodos anuais iniciados em 01/01/2027, substituindo integralmente a NBC TG 26",
    "A partir de períodos iniciados em 01/01/2025, substituindo a NBC TG 07",
    "A partir de períodos iniciados em 01/01/2026, substituindo o ITG 2002",
    "A partir de períodos iniciados em 01/01/2028, substituindo a NBC TG 03"
  ],
  "correct": 0,
  "explanation": "Aprovada pela CFC em 13/11/2025 (DOU 22/12/2025), a NBC TG 51 (CPC 51, equivalente à IFRS 18) substitui integralmente a NBC TG 26 e é obrigatória para períodos anuais iniciados a partir de 01/01/2027. Ela reestrutura a DRE em cinco categorias com subtotais obrigatórios e afeta os títulos e linhas do item 22 do ITG 2002."
}
```

```question
{
  "id": "npof-10-q5",
  "type": "multiple-choice",
  "question": "Quais são as cinco demonstrações contábeis obrigatórias para as OSCs?",
  "options": [
    "Balanço Patrimonial, DRE, DMPL, DFC e Notas Explicativas",
    "Balanço Patrimonial, DRE, Demonstração do Valor Adicionado, DFC e Relatório de Gestão",
    "Balanço Patrimonial, ECD, ECF, DCTFWeb e Notas Explicativas",
    "DRE, DMPL, Balanço de Apuração do Resultado, DFC e Relatório de Auditoria"
  ],
  "correct": 0,
  "explanation": "O item 22 do ITG 2002 exige Balanço Patrimonial, Demonstração do Resultado do Período, Demonstração das Mutações do Patrimônio Líquido, Demonstração dos Fluxos de Caixa e Notas Explicativas. A ECD, a ECF e a DCTFWeb são obrigações de declaração à Receita Federal, não demonstrações contábeis."
}
```

```question
{
  "id": "npof-10-q6",
  "type": "multiple-choice",
  "question": "Uma OSC imune, com receita de R$ 3.900.000 no ano-calendário, precisa entregar a ECD?",
  "options": [
    "Sim, toda pessoa jurídica com escrituração entrega a ECD",
    "Não: há dispensa para entidades imunes/isenas com receita abaixo de R$ 4.800.000 (IN RFB nº 2.003/2021, art. 3º, IV) — mas a ECF continua obrigatória até 31/07",
    "Não, porque entidades imunes estão dispensadas também da ECF",
    "Sim, mas apenas se houver empregados CLT"
  ],
  "correct": 1,
  "explanation": "A IN RFB nº 2.003/2021, art. 3º, IV, dispensa da ECD as entidades imunes ou isentas com receita inferior a R$ 4.800.000 no ano-calendário (e as PJs inativas). Já a ECF, pela IN RFB nº 2.004/2021, art. 3º, é obrigatória para todas as PJs, inclusive imunes e isentas, até o último dia útil de julho."
}
```

```question
{
  "id": "npof-10-q7",
  "type": "multiple-choice",
  "question": "Uma entidade de pequeno porte apresentou razão de programa de 0,62. Como o Charity Navigator pontua esse indicador para pequenas entidades (ponto cheio em 0,70 e zero em 0,50)?",
  "options": [
    "0,80 de ponto",
    "0,60 de ponto",
    "0,31 de ponto",
    "1,00 de ponto (nota máxima)"
  ],
  "correct": 1,
  "explanation": "A conta é (0,62 − 0,50) ÷ (0,70 − 0,50) = 0,12 ÷ 0,20 = 0,60 de ponto. Para médias e grandes entidades, com teto em 0,85: (0,62 − 0,50) ÷ (0,85 − 0,50) = 0,12 ÷ 0,35 ≈ 0,34 de ponto. O padrão aplicado muda a nota."
}
```

```question
{
  "id": "npof-10-q8",
  "type": "multiple-choice",
  "question": "V/F: o ITG 2002 exige contabilizar os tributos renunciados como se a obrigação devida fosse.",
  "options": [
    "Falso — o ITG 2002 (R1) pede apenas a relação dos tributos objeto de renúncia fiscal nas notas (item 27, c)",
    "Verdadeiro — a exigência vem do texto original de 2012 e foi mantida pelo R1",
    "Falso — a renúncia fiscal nem sequer precisa ser divulgada nas notas",
    "Verdadeiro — desde 2012, e o R1 de 2015 ampliou a exigência para todo o balanço"
  ],
  "correct": 0,
  "explanation": "A redação de 2012 pedia contabilizar a renúncia fiscal como se a obrigação devida fosse; o ITG 2002 (R1), de 21/08/2015, substituiu o texto por relação dos tributos objeto de renúncia fiscal — bastando a listagem nas notas explicativas, em prestação de contas cívica."
}
```

```question
{
  "id": "npof-10-q9",
  "type": "multiple-choice",
  "question": "O que mudou na Revisão NBC NAE nº 29/2024?",
  "options": [
    "Alterou os itens 2 e 3 do ITG 2002: removeu o partido político e a palavra política do escopo, com aplicação a demonstrações de períodos iniciados a partir de 01/01/2025",
    "Incluiu o partido político e a atividade política no escopo do ITG 2002",
    "Revogou integralmente o ITG 2002 a partir de 01/01/2025",
    "Alterou o item 22 para exigir a Demonstração do Valor Adicionado"
  ],
  "correct": 0,
  "explanation": "Publicada em 12/12/2024 (DOU 23/12/2024), a Revisão NAE nº 29/2024 alterou os itens 2 e 3 do ITG 2002: o escopo passou a abranger fundação de direito privado, associação, organização social, organização religiosa e entidade sindical, tendo sido removidos o partido político e a palavra política da lista de atividades. Vale para períodos iniciados a partir de 01/01/2025."
}
```

```question
{
  "id": "npof-10-q10",
  "type": "multiple-choice",
  "question": "Qual é o prazo de entrega da DCTFWeb mensal depois da alteração da IN RFB nº 2.248/2025?",
  "options": [
    "Até o dia 25 do mês seguinte ao fato gerador",
    "Até o último dia útil do mês seguinte ao fato gerador",
    "Até o último dia útil de junho do ano seguinte",
    "Até o último dia útil de julho do ano seguinte"
  ],
  "correct": 1,
  "explanation": "A IN RFB nº 2.237/2024, art. 6º, alterada pela IN RFB nº 2.248/2025, fixou o prazo da DCTFWeb no último dia útil do mês seguinte ao fato gerador — antes era o dia 25. A obrigação alcança todas as PJs, inclusive imunes e isentas, que devem apresentar a declaração mesmo quando não houver movimento."
}
```

```matching
{
  "question": "Associe cada obrigação ao seu prazo ou regra principal:",
  "pairs": [
    {"left": "ECD (Diário/Razão em SPED)", "right": "Último dia útil de junho — dispensa para imunes/isenas com receita < R$ 4.800.000 (IN RFB nº 2.003/2021, art. 3º, IV)"},
    {"left": "ECF (e-Lalur/e-Lacs)", "right": "Último dia útil de julho — obrigatória para todas as PJs, inclusive imunes e isentas (IN RFB nº 2.004/2021)"},
    {"left": "DCTFWeb", "right": "Último dia útil do mês seguinte ao fato gerador (IN RFB nº 2.248/2025) — antes era dia 25"},
    {"left": "Demonstrações contábeis", "right": "Anual, conforme o estatuto — ITG 2002, item 22 (BP, DRE, DMPL, DFC e Notas)"},
    {"left": "Prestação de contas do MROSC", "right": "Anual e final, em até 1 ano, pelo Transferegov.br (Lei nº 13.019/2014, art. 22, IX)"},
    {"left": "Subvenção vinculada recebida", "right": "Passivo (Recursos de Projetos em Execução) até o cumprimento da obrigação — NBC TG 07"}
  ],
  "explanation": "ECD e ECF têm prazos diferentes e regras de dispensa diferentes; a DCTFWeb migrou do dia 25 para o último dia útil do mês seguinte; as demonstrações do item 22 são anuais; o MROSC impõe prestação de contas em até 1 ano; e a subvenção recebida só se torna receita quando confrontada com a despesa qualificada."
}
```

```fillblank
{
  "question": "Complete as contas dos três indicadores de saúde financeira usados na lição:",
  "template": "Razão de programa = {{1}} de programa ÷ {{2}} total de despesas. Custo de captação = despesa de captação ÷ {{3}} recebidas. Reservas em meses = caixa livre ÷ {{4}} mensal livre.",
  "answers": {
    "1": "despesa",
    "2": "despesa",
    "3": "doações",
    "4": "despesa"
  },
  "distractors": ["receita bruta", "patrimônio líquido", "caixa bruto", "receita financeira"],
  "explanation": "Os três indicadores usam despesa ou doações no denominador, nunca caixa bruto: razão de programa = 780.000 ÷ 1.000.000 = 0,78; custo de captação = 70.000 ÷ 900.000 = R$ 0,078 por R$ 1; reservas = 450.000 ÷ 83.333 = 5,4 meses. Colocar recurso com restrição ou receita bruta no numerador infla os indicadores sem mudar a realidade financeira."
}
```

---

> [!WARNING]
> **Armadilhas desta lição:**
> - Imunidade **não** é crédito: pelo art. 9º, § 4º da LC nº 214/2025, o IBS/CBS na aquisição é **custo não recuperável**;
> - **ECD ≠ ECF**: só a ECD tem dispensa por porte (receita < R$ 4.800.000); a ECF é para **todas** as PJs, inclusive imunes;
> - Verba genérica "para fortalecer o setor" e imunidades **não são receita** (itens 9A e 9B do ITG 2002);
> - Caixa de subvenção vinculada é **passivo** até o cumprimento da obrigação (NBC TG 07) e **não entra** em reservas livres;
> - O ITG 2002 (R1) **não** manda contabilizar renúncia fiscal como se devida — basta **relação nas notas** (item 27, "c");
> - O **"RAPP" não existe** no CFC: exigência nesse nome deve ser submetida à base normativa;
> - A **NBC TG 51** substitui a NBC TG 26 a partir de períodos iniciados em **01/01/2027**;
> - Reservas de 3 a 6 meses e custo de captação abaixo de R$ 0,15 são **heurísticas de gestão, não norma do CFC**.

> [!SUCCESS]
> **Pontos Principais (Key Takeaways):**
> - A contabilidade de OSC é **Lei nº 6.404/1976 por analogia + ITG 2002 (R1)** (Resolução CFC nº 1.409/2012): Patrimônio Social, Superávit/Déficit e receitas em regime de competência;
> - A **LC nº 214/2025** mantém a imunidade de IBS/CBS (art. 9º, III) **condicionada** ao art. 14 do CTN, mas o **§ 4º** torna não recuperável o imposto das aquisições — orce como custo permanente;
> - São **5 demonstrações obrigatórias** (BP, DRE, DMPL, DFC e Notas) e **contas segregadas** por restrição: em média, só **1 em cada 6 reais** transferidos no setor chega sem amarras (Censo GIFE 2024–2025);
> - Calendário: **ECD** até o fim de junho (dispensa abaixo de R$ 4.800.000), **ECF** até o fim de julho (todas as PJs), **DCTFWeb** no último dia útil do mês seguinte e **prestação de contas do MROSC em até 1 ano**;
> - Subvenção vinculada é **passivo até o cumprimento da obrigação** (NBC TG 07); trabalho voluntário é reconhecido a **valor justo** (item 19) e a renúncia fiscal apenas **relacionada nas notas** (item 27, "c");
> - Indicadores se calculam com numerador honesto: razão de programa de **0,78** (0,80 de ponto para grandes; 1,00 limitado para pequenas), custo de captação de **R$ 0,078** por real e reservas de **5,4 meses** — nunca incluindo recurso restrito;
> - Use benchmarks (proporção de programa ≥ 70–80%, custo de captação < R$ 0,15, reservas de 3 a 6 meses) como **estimativas de gestão** — a saúde financeira se mede com dados segregados, não com faixas de estrelas;
> - Prepare-se para **01/01/2027**: a NBC TG 51 substitui a NBC TG 26 e reestrutura a DRE em cinco categorias — plano de contas e relatórios precisam estar prontos antes do primeiro dia do exercício.
