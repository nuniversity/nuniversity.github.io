---
id: intro-to-software-engineering
title: "Introdução à Engenharia de Software"
description: "Caminho completo de aprendizado desde conceitos fundamentais até práticas avançadas de desenvolvimento de software. Domine processos, algoritmos, paradigmas de programação, arquitetura e desenvolvimento assistido por IA."
icon: "Map"
order: 1
difficulty: "beginner"
estimatedDuration: "120 horas"
---

## Step: Processos
- id: processes
- type: course
- contentRef: processes-flowchart/01-o-que-sao-processos
- description: Fundamentos teóricos de processos e fluxogramas. Aprenda a pensar sistematicamente sobre fluxos de trabalho, pontos de decisão e otimização de processos.
- prerequisites: []
- conditionals: []
- comments: Entender processos é fundamental para toda engenharia de software. Antes de escrever código, você deve entender o problema e como dividi-lo em etapas.
- ideas: ["Crie um fluxograma para sua rotina matinal", "Mapeie o processo de pedir comida em um restaurante", "Documente um processo de trabalho usando símbolos de fluxograma"]
- estimatedDuration: 4 horas
- relationships:
  - leadsTo: foundation-of-algorithms
    type: required

## Step: Fundamentos de Algoritmos
- id: foundation-of-algorithms
- type: course
- contentRef: algorithm-foundations/01-what-are-algorithms
- description: Fundamentos de algoritmos e princípios de qualidade sem código. Aprenda a pensar algoritmicamente através de exemplos conceituais, pseudocódigo e analogias do mundo real.
- prerequisites: ["processes"]
- conditionals: []
- comments: Sem código ainda - foque em pensar algoritmicamente. Esta base conceitual tornará o aprendizado de programação muito mais fácil.
- ideas: ["Resolva quebra-cabeças lógicos usando pensamento passo a passo", "Escreva pseudocódigo para fazer um sanduíche", "Analise o algoritmo de buscar uma palavra no dicionário"]
- estimatedDuration: 6 horas
- relationships:
  - leadsTo: computing-imperative-algorithm
    type: required

## Step: Algoritmo Imperativo Computacional
- id: computing-imperative-algorithm
- type: course
- contentRef: computing-imperative-python/01-how-computers-work
- description: Como os computadores funcionam, estruturas de dados básicas e algoritmos imperativos em Python. Aprenda variáveis, fluxo de controle, loops, funções e estruturas de dados básicas.
- prerequisites: ["foundation-of-algorithms"]
- conditionals: []
- comments: Aqui é onde você escreve seu primeiro código! Python é escolhido por sua legibilidade e simplicidade.
- ideas: ["Escreva um programa para calcular fatorial", "Crie uma calculadora simples", "Implemente o algoritmo bubble sort", "Construa um jogo de adivinhação de números"]
- estimatedDuration: 10 horas
- relationships:
  - leadsTo: clean-code-design-patterns
    type: required

## Step: Código Limpo & Padrões de Projeto
- id: clean-code-design-patterns
- type: course
- contentRef: clean-code-design-patterns/01-what-is-clean-code
- description: Escrevendo código mantível e legível e entendendo padrões de projeto comuns. Aprenda convenções de nomenclatura, organização de código, técnicas de refatoração e padrões clássicos.
- prerequisites: ["computing-imperative-algorithm"]
- conditionals: []
- comments: Código limpo não é apenas sobre fazer funcionar - é sobre tornar compreensível para humanos. Seu eu do futuro agradecerá.
- ideas: ["Refatore um código bagunçado", "Identifique padrões de projeto em objetos do cotidiano", "Pratique nomenclatura significativa de variáveis"]
- estimatedDuration: 8 horas
- relationships:
  - leadsTo: solid-principles-oop
    type: required

## Step: Princípios SOLID & POO
- id: solid-principles-oop
- type: course
- contentRef: solid-principles-oop/01-oop-fundamentals-review
- description: Princípios SOLID e paradigma de Programação Orientada a Objetos. Domine Responsabilidade Única, Aberto-Fechado, Substituição de Liskov, Segregação de Interfaces e Inversão de Dependência.
- prerequisites: ["clean-code-design-patterns"]
- conditionals: []
- comments: Os princípios SOLID são a base do bom design orientado a objetos. Eles ajudam você a criar sistemas flexíveis e mantíveis.
- ideas: ["Identifique violações SOLID em código existente", "Projete uma hierarquia de classes para um sistema de biblioteca", "Refatore código seguindo o Princípio da Responsabilidade Única"]
- estimatedDuration: 9 horas
- relationships:
  - leadsTo: clean-architecture
    type: required

## Step: Arquitetura Limpa
- id: clean-architecture
- type: course
- contentRef: clean-architecture/01-what-is-software-architecture
- description: Padrões arquiteturais e separação de preocupações. Aprenda sobre camadas, limites, regras de dependência e como estruturar aplicações para testabilidade e manutenibilidade.
- prerequisites: ["solid-principles-oop"]
- conditionals: []
- comments: Arquitetura é sobre tomar decisões que são difíceis de mudar depois. Boa arquitetura torna seu sistema mais fácil de entender, desenvolver e manter.
- ideas: ["Desenhe a arquitetura de uma aplicação familiar", "Identifique limites em projetos existentes", "Pratique inversão de dependência"]
- estimatedDuration: 7 horas
- relationships:
  - leadsTo: functional-declarative-coding
    type: required

## Step: Programação Funcional & Declarativa
- id: functional-declarative-coding
- type: course
- contentRef: functional-declarative-coding/01-functional-programming-concepts
- description: Conceitos de programação funcional e paradigmas declarativos. Aprenda imutabilidade, funções puras, funções de ordem superior, map/filter/reduce.
- prerequisites: ["clean-architecture"]
- conditionals: []
- comments: Programação funcional oferece uma maneira diferente de pensar sobre problemas. Complementa POO e leva a código mais previsível e testável.
- ideas: ["Reescreva código imperativo em estilo funcional", "Pratique usando map, filter e reduce", "Explore funções lambda e closures"]
- estimatedDuration: 6 horas
- relationships:
  - leadsTo: ddd-software-architecture
    type: required

## Step: DDD & Arquitetura de Software
- id: ddd-software-architecture
- type: course
- contentRef: ddd-software-architecture/01-introducao-ao-ddd
- description: Domain-Driven Design e arquitetura de software avançada. Aprenda linguagem ubíqua, contextos delimitados, entidades, objetos de valor e agregados.
- prerequisites: ["functional-declarative-coding"]
- conditionals: []
- comments: DDD preenche a lacuna entre requisitos de negócio e implementação técnica. É essencial para construir sistemas empresariais complexos.
- ideas: ["Modele um domínio de e-commerce simples", "Identifique contextos delimitados em um sistema", "Pratique criar linguagem ubíqua com partes interessadas não técnicas"]
- estimatedDuration: 10 horas
- relationships:
  - leadsTo: tdd-code-quality
    type: required

## Step: TDD & Ferramentas de Qualidade de Código
- id: tdd-code-quality
- type: course
- contentRef: tdd-code-quality-tools/01-intro-to-tdd
- description: Desenvolvimento Orientado por Testes e ecossistema de qualidade de código. Domine o ciclo Red-Green-Refactor, testes unitários, ganchos pre-commit, linting, formatação e análise estática.
- prerequisites: ["ddd-software-architecture"]
- conditionals: []
- comments: TDD muda como você pensa sobre código. Escrever testes primeiro leva a um design melhor e dá confiança para refatorar.
- ideas: ["Pratique TDD com um kata simples", "Configure ganchos pre-commit em um projeto", "Configure ESLint e Prettier", "Execute uma ferramenta de análise de código"]
- estimatedDuration: 8 horas
- relationships:
  - leadsTo: agentic-ai-development
    type: required

## Step: Desenvolvimento de Software com IA Agêntica
- id: agentic-ai-development
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: Desenvolvimento de software assistido por IA com agentes. Aprenda sobre agentes de IA, habilidades, gerenciamento de contexto, pipelines, melhores práticas e como usar OpenCode.
- prerequisites: ["tdd-code-quality"]
- conditionals: []
- comments: Esta é a fronteira do desenvolvimento de software. Agentes de IA estão transformando como escrevemos, testamos e mantemos código.
- ideas: ["Configure OpenCode para um projeto", "Crie uma habilidade personalizada de agente", "Construa um pipeline automatizado de revisão de código", "Experimente estratégias de gerenciamento de contexto"]
- estimatedDuration: 10 horas
- relationships: []
