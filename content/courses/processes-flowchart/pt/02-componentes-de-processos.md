---
title: "Componentes de Processos"
description: "Aprenda sobre os blocos de construção fundamentais de qualquer processo: entradas, saídas, transformações, pontos de decisão, atores e controles."
order: 2
duration: "35 minutos"
difficulty: "beginner"
---

# Componentes de Processos

Todo processo, não importa quão simples ou complexo, é construído a partir de um conjunto de componentes fundamentais. Entender esses componentes é essencial para analisar, documentar e melhorar processos. Nesta lição, vamos detalhar cada componente e ver como eles trabalham juntos.

## Os Cinco Componentes Principais

Todos os processos consistem em cinco elementos fundamentais:

1. **Entradas** — Recursos que entram no processo
2. **Transformações** — Ações que modificam as entradas
3. **Saídas** — Resultados que saem do processo
4. **Pontos de Decisão** — Locais onde o processo se ramifica
5. **Atores** — Entidades que executam as ações

```mermaid
flowchart LR
    I[/"Entradas: Recursos, Dados, Materiais"/] --> T[Transformações: Ações, Operações]
    T --> D{Pontos de Decisão: Condições, Regras}
    D -->|Caminho A| T2[Transformações Adicionais]
    D -->|Caminho B| T3[Transformações Alternativas]
    T2 --> O[/"Saídas: Produtos, Resultados, Dados"/]
    T3 --> O
    
    A[Atores: Pessoas, Sistemas, Equipes] -.-> T
    A -.-> D
    A -.-> T2
    A -.-> T3
    
    style I fill:#E3F2FD
    style O fill:#E8F5E9
    style D fill:#FFF3E0
    style A fill:#F3E5F5
```

## 1. Entradas

Entradas são tudo o que um processo precisa para iniciar e operar. Elas podem ser tangíveis ou intangíveis.

### Tipos de Entradas

| Tipo | Descrição | Exemplos |
|---|---|---|
| **Material** | Recursos físicos | Matéria-prima, documentos, hardware |
| **Informação** | Dados ou conhecimento | Solicitação do cliente, especificações, requisitos |
| **Energia** | Força para impulsionar o processo | Eletricidade, esforço humano, recursos de computação |
| **Tempo** | Duração alocada | Prazos, SLAs, janelas agendadas |

### A Qualidade das Entradas Importa

> [!WARNING] Lixo Entra, Lixo Sai
> A qualidade das suas saídas é diretamente limitada pela qualidade das suas entradas. Um processo não pode produzir resultados de alta qualidade a partir de entradas de baixa qualidade.

```mermaid
flowchart TD
    A[/"Formulário de pedido do cliente"/] --> B{Formulário completo?}
    B -->|Não| C[/"Devolver para complementação"/]
    B -->|Sim| D[/"Dados válidos do pedido"/]
    D --> E[Processar pedido]
    
    style A fill:#FFCDD2
    style C fill:#FFCDD2
    style D fill:#C8E6C9
```

### Exemplo do Mundo Real: Entradas de uma Cozinha de Restaurante

```
Entradas para um Pedido de Pizza:
├── Material: Massa, molho, queijo, coberturas
├── Informação: Pedido do cliente (tamanho, tipo, extras)
├── Energia: Calor do forno, trabalho do chef
└── Tempo: Janela de preparação de 15-20 minutos
```

## 2. Transformações

Transformações são as ações que convertem entradas em saídas. Elas são o "trabalho" do processo.

### Tipos de Transformações

| Tipo | Descrição | Exemplo |
|---|---|---|
| **Física** | Mudar forma ou estado | Cortar, montar, cozinhar |
| **Informacional** | Mudar dados ou conhecimento | Calcular, traduzir, analisar |
| **Locacional** | Mudar posição | Enviar, rotear, transferir |
| **Transacional** | Mudar propriedade ou status | Aprovar, comprar, registrar |

### Exemplo de Transformação: Processo de Revisão de Código

```mermaid
flowchart TD
    A[/"Pull Request"/] --> B[Linting automatizado]
    B --> C[/"Relatório de lint"/]
    C --> D{Lint passou?}
    D -->|Não| E[/"Corrigir problemas no código"/]
    D -->|Sim| F[Revisão manual de código]
    E --> B
    F --> G{Revisor aprova?}
    G -->|Não| H[/"Endereçar feedback"/]
    G -->|Sim| I[/"PR Aprovado"/]
    H --> F
    
    style A fill:#BBDEFB
    style I fill:#C8E6C9
    style D fill:#FFF3E0
    style G fill:#FFF3E0
```

### Boas Práticas para Transformações

> [!TIP] Mantenha Transformações Atômicas
> Cada etapa de transformação deve fazer **uma coisa bem feita**. Se uma etapa faz múltiplas coisas, considere dividi-la em etapas menores. Isso torna os processos mais fáceis de entender, testar e melhorar.

## 3. Saídas

Saídas são os resultados produzidos pelo processo. Elas podem ser o entregável principal ou subprodutos secundários.

### Saídas Primárias vs. Secundárias

| Tipo | Descrição | Exemplo (Build de Software) |
|---|---|---|
| **Primária** | O resultado principal pretendido | Binário da aplicação compilada |
| **Secundária** | Resultados adicionais úteis | Logs de build, relatórios de teste, artefatos |
| **Desperdício** | Subprodutos não intencionais | Arquivos temporários, builds falhados |

### Validação de Saídas

Todo processo deve validar suas saídas antes da conclusão:

```mermaid
flowchart TD
    A[Transformação completa] --> B[Validar saída]
    B --> C{Atende critérios de qualidade?}
    C -->|Não| D[Tratar exceção]
    C -->|Sim| E[/"Entregar saída"/]
    D --> F{Pode ser corrigido?}
    F -->|Sim| G[Repetir transformação]
    F -->|Não| H[/"Escalar erro"/]
    G --> B
    
    style E fill:#C8E6C9
    style H fill:#FFCDD2
    style C fill:#FFF3E0
    style F fill:#FFF3E0
```

## 4. Pontos de Decisão

Pontos de decisão são onde um processo avalia condições e escolhe entre diferentes caminhos.

### Padrões de Pontos de Decisão

#### Padrão 1: Decisão Binária

```mermaid
flowchart TD
    A[Etapa do processo] --> B{Condição atendida?}
    B -->|Sim| C[Continuar caminho A]
    B -->|Não| D[Continuar caminho B]
    
    style B fill:#FFE0B2
```

#### Padrão 2: Decisão Múltipla

```mermaid
flowchart TD
    A[Receber solicitação] --> B{Tipo de solicitação?}
    B -->|Bug| C[Encaminhar para fila de bugs]
    B -->|Recurso| D[Encaminhar para fila de recursos]
    B -->|Pergunta| E[Encaminhar para FAQ]
    
    style B fill:#FFE0B2
```

#### Padrão 3: Decisão de Loop

```mermaid
flowchart TD
    A[Processar item] --> B{Mais itens?}
    B -->|Sim| A
    B -->|Não| C[Continuar para próxima etapa]
    
    style B fill:#FFE0B2
```

### Boas Práticas para Pontos de Decisão

| Prática | Por Que Importa |
|---|---|
| **Critérios claros** | Todos devem entender quando cada caminho é tomado |
| **Regras documentadas** | A lógica de decisão deve ser explícita, não implícita |
| **Caminhos de fallback** | Sempre defina o que acontece quando nenhuma condição corresponde |
| **Trilha de auditoria** | Registre qual caminho foi tomado e por quê |

> [!NOTE] Aviso de Complexidade de Decisão
> Se um ponto de decisão tem mais de 4-5 ramificações, considere se o processo pode ser simplificado. Decisões complexas frequentemente indicam que um processo deve ser dividido em sub-processos.

## 5. Atores

Atores são as entidades que realizam o trabalho em um processo. Eles podem ser humanos ou automatizados.

### Tipos de Atores

| Tipo | Descrição | Exemplos |
|---|---|---|
| **Humano** | Pessoas executando tarefas | Desenvolvedor, gerente, cliente |
| **Sistema** | Software executando tarefas | Servidor CI, banco de dados, API |
| **Híbrido** | Humano usando um sistema | Analista usando um painel |
| **Externo** | Fora da organização | Gateway de pagamento, transportadora |

### Matriz de Responsabilidade dos Atores

```mermaid
flowchart LR
    subgraph Atores
        A[Cliente]
        B[Agente de Suporte]
        C[Sistema Automatizado]
        D[Gerente]
    end
    
    subgraph Responsabilidades
        A --> R1[Enviar solicitação]
        B --> R2[Investigar problema]
        C --> R3[Roteir e escalar]
        D --> R4[Aprovar exceções]
    end
    
    style A fill:#E1F5FE
    style B fill:#F3E5F5
    style C fill:#E8F5E9
    style D fill:#FFF3E0
```

### Modelo RACI para Atores de Processos

O modelo RACI ajuda a esclarecer as responsabilidades dos atores:

| Papel | Significado | Exemplo em Revisão de Código |
|---|---|---|
| **R**esponsável | Executa o trabalho | Desenvolvedor escrevendo código |
| **A**ccountable (Responsável final) | Dono do resultado | Líder técnico aprovando mudanças |
| **C**onsultado | Fornece input | Equipe de segurança revisando |
| **I**nformado | Mantido atualizado | Gerente de projeto notificado |

## Juntando Tudo: Exemplo Completo de Processo

Vamos examinar um processo completo com todos os cinco componentes:

### Processo de Solicitação de Recurso de Software

```mermaid
flowchart TD
    subgraph Entradas
        I1[/"Solicitação de recurso do usuário"/]
        I2[/"Requisitos de negócio"/]
        I3[/"Restrições técnicas"/]
    end
    
    subgraph Atores
        A1[Gerente de Produto]
        A2[Equipe de Engenharia]
        A3[Equipe de QA]
    end
    
    I1 --> A1
    A1 --> D1{Avaliação de prioridade}
    D1 -->|Alta| P1[Adicionar ao sprint atual]
    D1 -->|Média| P2[Adicionar ao backlog]
    D1 -->|Baixa| P3[Arquivar para revisão]
    
    P1 --> A2
    A2 --> T1[Projetar solução]
    T1 --> T2[Implementar código]
    T2 --> T3[Escrever testes]
    T3 --> A3
    A3 --> D2{Testes passaram?}
    D2 -->|Sim| O1[/"Recurso implantado"/]
    D2 -->|Não| T2
    
    I2 -.-> D1
    I3 -.-> T1
    
    style I1 fill:#BBDEFB
    style I2 fill:#BBDEFB
    style I3 fill:#BBDEFB
    style O1 fill:#C8E6C9
    style D1 fill:#FFE0B2
    style D2 fill:#FFE0B2
```

## Exercícios Práticos

### Exercício 1: Identificação de Componentes

Para o processo de "Sacar dinheiro de um caixa eletrônico," identifique:
1. Todas as entradas
2. Todas as transformações
3. Todas as saídas
4. Todos os pontos de decisão
5. Todos os atores

### Exercício 2: Desenhe um Processo

Desenhe um fluxograma para o processo de "Publicar um post de blog" que inclua:
- Pelo menos 3 entradas
- Pelo menos 4 transformações
- Pelo menos 2 pontos de decisão
- Pelo menos 2 atores diferentes
- Saídas claras

### Exercício 3: Analise um Processo com Problemas

Considere este processo problemático:
```
Reclamação do cliente → Encaminhar ao departamento → Departamento resolve → Pronto
```

Identifique o que está faltando:
- As entradas estão claramente definidas?
- Existem pontos de decisão para roteamento?
- Há validação de saída?
- Quem são os atores?

<details>
<summary>Clique para ver a análise</summary>

**Problemas identificados:**
- Sem validação de entrada (a reclamação está completa?)
- Sem pontos de decisão (e se o departamento errado receber?)
- Sem validação de saída (o cliente ficou satisfeito?)
- Atores são vagos ("departamento" não é específico)
- Sem caminho de escalonamento se o departamento não responder
- Sem loop de feedback para melhoria

</details>

## Principais Conclusões

- Todo processo tem **cinco componentes principais**: entradas, transformações, saídas, pontos de decisão e atores
- A **qualidade das entradas** determina diretamente a qualidade das saídas
- **Transformações** devem ser atômicas — uma coisa por etapa
- **Pontos de decisão** devem ter critérios claros e documentados
- **Atores** precisam de responsabilidades bem definidas (use RACI)
- Entender componentes facilita **analisar** e **melhorar** qualquer processo

> [!SUCCESS] Você Completou a Lição 2
> Agora você entende os blocos de construção de todo processo. Na próxima lição, vamos explorar **fluxogramas** — a linguagem visual usada para documentar e comunicar processos.
