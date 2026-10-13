---
id: intro-to-software-engineering
title: "Introducción a la Ingeniería de Software"
description: "Ruta completa de aprendizaje desde conceptos fundamentales hasta prácticas avanzadas de desarrollo de software. Domina procesos, algoritmos, paradigmas de programación, arquitectura y desarrollo asistido por IA."
icon: "Map"
order: 1
difficulty: "beginner"
estimatedDuration: "120 horas"
---

## Step: Procesos
- id: processes
- type: course
- contentRef: processes-flowchart/01-what-are-processes
- description: Fundamentos teóricos de procesos y diagramas de flujo. Aprende a pensar sistemáticamente sobre flujos de trabajo, puntos de decisión y optimización de procesos.
- prerequisites: []
- conditionals: []
- comments: Comprender los procesos es fundamental para toda la ingeniería de software. Antes de escribir código, debes entender el problema y cómo desglosarlo en pasos.
- ideas: ["Crea un diagrama de flujo de tu rutina matutina", "Mapea el proceso de pedir comida en un restaurante", "Documenta un proceso de trabajo usando símbolos de diagramas de flujo"]
- estimatedDuration: 4 horas
- relationships:
  - leadsTo: foundation-of-algorithms
    type: required

## Step: Fundamentos de Algoritmos
- id: foundation-of-algorithms
- type: course
- contentRef: algorithm-foundations/01-what-are-algorithms
- description: Fundamentos de algoritmos y principios de calidad sin código. Aprende a pensar algorítmicamente mediante ejemplos conceptuales, pseudocódigo y analogías del mundo real. Entiende qué hace que un algoritmo sea eficiente, legible y mantenible.
- prerequisites: ["processes"]
- conditionals: []
- comments: Aún sin código: céntrate en pensar algorítmicamente. Esta base conceptual hará mucho más fácil aprender a programar.
- ideas: ["Resuelve acertijos lógicos pensando paso a paso", "Escribe pseudocódigo para preparar un sándwich", "Analiza el algoritmo de buscar una palabra en un diccionario"]
- estimatedDuration: 6 horas
- relationships:
  - leadsTo: computing-imperative-algorithm
    type: required

## Step: Algoritmo Imperativo Computacional
- id: computing-imperative-algorithm
- type: course
- contentRef: computing-imperative-python/01-how-computers-work
- description: Cómo funcionan las computadoras, estructuras de datos básicas y algoritmos imperativos en Python. Aprende variables, control de flujo, bucles, funciones y estructuras de datos básicas programando en Python.
- prerequisites: ["foundation-of-algorithms"]
- conditionals: []
- comments: ¡Aquí es donde escribes tu primer código! Se eligió Python por su legibilidad y simplicidad. Céntrate en entender cómo la computadora ejecuta tus instrucciones.
- ideas: ["Escribe un programa que calcule el factorial", "Crea una calculadora simple", "Implementa el algoritmo de ordenamiento burbuja", "Construye un juego de adivinar números"]
- estimatedDuration: 10 horas
- relationships:
  - leadsTo: clean-code-design-patterns
    type: required

## Step: Código Limpio y Patrones de Diseño
- id: clean-code-design-patterns
- type: course
- contentRef: clean-code-design-patterns/01-what-is-clean-code
- description: Escribir código mantenible y legible y entender patrones de diseño comunes. Aprende convenciones de nombres, organización de código, técnicas de refactorización y patrones clásicos como Singleton, Factory, Observer y Strategy.
- prerequisites: ["computing-imperative-algorithm"]
- conditionals: []
- comments: Código limpio no se trata solo de que funcione: se trata de que sea comprensible para los humanos. Tu yo del futuro te lo agradecerá.
- ideas: ["Refactoriza un trozo de código desordenado", "Identifica patrones de diseño en objetos cotidianos", "Practica el nombrado significativo de variables"]
- estimatedDuration: 8 horas
- relationships:
  - leadsTo: solid-principles-oop
    type: required

## Step: Principios SOLID y POO
- id: solid-principles-oop
- type: course
- contentRef: solid-principles-oop/01-oop-fundamentals-review
- description: Principios SOLID y el paradigma de Programación Orientada a Objetos. Domina los principios de Responsabilidad Única, Abierto/Cerrado, Sustitución de Liskov, Segregación de Interfaces e Inversión de Dependencias con ejemplos prácticos de POO.
- prerequisites: ["clean-code-design-patterns"]
- conditionals: []
- comments: Los principios SOLID son la base de un buen diseño orientado a objetos. Te ayudan a crear sistemas flexibles y mantenibles.
- ideas: ["Identifica violaciones SOLID en código existente", "Diseña una jerarquía de clases para un sistema de biblioteca", "Refactoriza código para seguir el Principio de Responsabilidad Única"]
- estimatedDuration: 9 horas
- relationships:
  - leadsTo: clean-architecture
    type: required

## Step: Arquitectura Limpia
- id: clean-architecture
- type: course
- contentRef: clean-architecture/01-what-is-software-architecture
- description: Patrones arquitectónicos y separación de responsabilidades. Aprende sobre capas, límites, reglas de dependencia y cómo estructurar aplicaciones para que sean testeables, mantenibles e independientes de frameworks.
- prerequisites: ["solid-principles-oop"]
- conditionals: []
- comments: La arquitectura consiste en tomar decisiones difíciles de cambiar después. Una buena arquitectura hace que tu sistema sea más fácil de entender, desarrollar y mantener.
- ideas: ["Dibuja la arquitectura de una aplicación conocida", "Identifica límites en proyectos existentes", "Practica la inversión de dependencias"]
- estimatedDuration: 7 horas
- relationships:
  - leadsTo: functional-declarative-coding
    type: required

## Step: Programación Funcional y Declarativa
- id: functional-declarative-coding
- type: course
- contentRef: functional-declarative-coding/01-functional-programming-concepts
- description: Conceptos de programación funcional y paradigmas declarativos. Aprende inmutabilidad, funciones puras, funciones de orden superior, map/filter/reduce y a pensar en transformaciones en lugar de mutaciones.
- prerequisites: ["clean-architecture"]
- conditionals: []
- comments: La programación funcional ofrece una forma distinta de pensar los problemas. Complementa la POO y produce código más predecible y testeable.
- ideas: ["Reescribe código imperativo en estilo funcional", "Practica el uso de map, filter y reduce", "Explora funciones lambda y clausuras"]
- estimatedDuration: 6 horas
- relationships:
  - leadsTo: ddd-software-architecture
    type: required

## Step: DDD y Arquitectura de Software
- id: ddd-software-architecture
- type: course
- contentRef: ddd-software-architecture/01-intro-to-ddd
- description: Diseño Dirigido por el Dominio y arquitectura avanzada de software. Aprende lenguaje ubicuo, contextos acotados, entidades, objetos de valor, agregados y a modelar dominios de negocio complejos de forma efectiva.
- prerequisites: ["functional-declarative-coding"]
- conditionals: []
- comments: DDD tiende el puente entre los requisitos de negocio y la implementación técnica. Es esencial para construir sistemas empresariales complejos.
- ideas: ["Modela un dominio de comercio electrónico sencillo", "Identifica contextos acotados en un sistema", "Practica la creación de lenguaje ubicuo con stakeholders no técnicos"]
- estimatedDuration: 10 horas
- relationships:
  - leadsTo: tdd-code-quality
    type: required

## Step: TDD y Herramientas de Calidad de Código
- id: tdd-code-quality
- type: course
- contentRef: tdd-code-quality-tools/01-intro-to-tdd
- description: Desarrollo Dirigido por Pruebas y ecosistema de calidad de código. Domina el ciclo Rojo-Verde-Refactor, pruebas unitarias, pruebas de integración, hooks de pre-commit, linting, formateo de código, análisis estático y herramientas de code scanning.
- prerequisites: ["ddd-software-architecture"]
- conditionals: []
- comments: TDD cambia la forma en que piensas sobre el código. Escribir primero las pruebas conduce a un mejor diseño y te da confianza para refactorizar.
- ideas: ["Practica TDD con un kata sencillo", "Configura hooks de pre-commit en un proyecto", "Configura ESLint y Prettier", "Ejecuta una herramienta de code scanning sobre código existente"]
- estimatedDuration: 8 horas
- relationships:
  - leadsTo: agentic-ai-development
    type: required

## Step: Desarrollo de Software con IA Agéntica
- id: agentic-ai-development
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: Desarrollo de software asistido por IA con agentes. Aprende sobre agentes de IA, habilidades, gestión de contexto, pipelines, mejores prácticas y cómo usar OpenCode como una potente herramienta de desarrollo. Domina el futuro del desarrollo de software.
- prerequisites: ["tdd-code-quality"]
- conditionals: []
- comments: Esta es la vanguardia del desarrollo de software. Los agentes de IA están transformando la forma en que escribimos, probamos y mantenemos el código. Aprende a aprovechar estas herramientas de forma efectiva.
- ideas: ["Configura OpenCode para un proyecto", "Crea una habilidad personalizada de agente", "Construye un pipeline automatizado de revisión de código", "Experimenta con estrategias de gestión de contexto"]
- estimatedDuration: 10 horas
- relationships: []
