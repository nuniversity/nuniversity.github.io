---
id: ai-agentic-development
title: "Desarrollo de IA Agéntica"
description: "Ruta completa de aprendizaje desde los conceptos básicos de IA hasta agentes de IA de nivel de producción. Domina el prompting, Python, LangGraph, la memoria de agentes y RAG, la orquestación multiagente, la observabilidad, los guardrails y la evaluación, además de una ruta opcional de herramientas OpenCode."
icon: "Bot"
order: 2
difficulty: "beginner"
estimatedDuration: "36 Semanas"
---

## Step: Fundamentos de IA Práctica
- id: ai-literacy
- type: course
- contentRef: practical-ai/01-introduction
- description: Desarmina los conceptos básicos de IA sin escribir código. Entiende qué son los LLMs cómo usa la gente las herramientas de IA a diario y qué hace que la IA agéntica sea fundamentalmente distinta de un simple chat.
- prerequisites: []
- conditionals: []
- comments: Diez minutos con el modelo mental correcto valen más que diez horas de intentos confusos. Si ya usas ChatGPT a diario puedes leer este paso rápido - el objetivo es entender tokens ventanas de contexto y por qué los agentes necesitan ciclos.
- ideas: ["Haz la misma pregunta a dos asistentes de IA y compara", "Enumera tres tareas diarias que una IA podría automatizar", "Anota una tarea que nunca debería automatizarse por completo"]
- estimatedDuration: 2 Horas
- relationships:
  - leadsTo: prompt-engineering
    type: required
  - leadsTo: python-foundations
    type: required

## Step: Ingeniería de Prompts
- id: prompt-engineering
- type: course
- contentRef: prompt-engineering/01-fundamentals-of-prompt-engineering
- description: Domina el arte de dirigir LLMs. Aprende los frameworks ABC CO-STAR y RISEN además de técnicas avanzadas como Chain-of-Thought few-shot learning salidas estructuradas optimización de prompts y defensa contra el prompt injection.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: Esta es la competencia de mayor apalancamiento de toda la ruta - cada agente que construyas después será tan bueno como los prompts que lo dirigen. Atención especial a la lección de seguridad: el prompt injection es la vulnerabilidad número uno de los sistemas agénticos.
- ideas: ["Reescribe un prompt vago de tres maneras y compara los resultados", "Crea una plantilla CO-STAR para una tarea de trabajo recurrente", "Ataca tu propio prompt con injecciones y después refuérzalo"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: required

## Step: Fundamentos de Python
- id: python-foundations
- type: course
- contentRef: python-beginner/01-what-is-python
- description: Aprende a programar en Python desde cero. Cubre variables control de flujo bucles funciones y estructuras de datos principales - el vocabulario exacto que todo tutorial de LangGraph y CrewAI da por conocido.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: Para desarrolladores que ya escriben código este curso es un repaso rápido. Busca fluidez con diccionarios y funciones porque el estado de un agente son solo datos estructurados que pasan por funciones.
- ideas: ["Construye un conversor de unidades en la línea de comandos", "Escribe una función que fusione dos diccionarios de forma segura", "Modela un turno de chat como un diccionario"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: python-intermediate
    type: required

## Step: Python Intermedio
- id: python-intermediate
- type: course
- contentRef: python-intermediate/01-classes-objects
- description: Evoluciona hacia Python profesional. Domina clases excepciones manejo de archivos generadores decoradores entornos virtuales pruebas unitarias y depuración - el conjunto de herramientas con el que se construyen agentes.
- prerequisites: ["python-foundations"]
- conditionals: []
- comments: Los decoradores y las pruebas unitarias son lo más importante para los agentes - las herramientas son funciones decoradas y los harnesses de evaluación son pruebas. Si tienes poco tiempo prioriza esas dos lecciones.
- ideas: ["Envuelve una función simple como herramienta de agente con un decorador", "Escribe pruebas unitarias para un pequeño script CLI", "Usa un context manager para garantizar la limpieza de recursos"]
- estimatedDuration: 5 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: required
  - leadsTo: python-advanced
    type: optional

## Step: Dominio Avanzado de Python
- id: python-advanced
- type: course
- contentRef: python-advanced/01-threading-multiprocessing
- description: Profundización opcional para programadores experimentados. Concurrencia asyncio optimización de rendimiento patrones de diseño FastAPI y distribución de paquetes - tómalo si quieres publicar agentes como servicios robustos.
- prerequisites: ["python-intermediate"]
- conditionals: ["Omítelo si ya programas en Python con regularidad"]
- comments: Asyncio y FastAPI tienen el mejor retorno aquí pues servir agentes es sobre todo un problema asíncrono. El resto es material de referencia que puedes revisar al construir el proyecto final.
- ideas: ["Expón un agente LangGraph detrás de un endpoint FastAPI", "Compara ejecución secuencial versus concurrente de herramientas", "Perfoma una ejecución lenta y corrige el cuello de botella"]
- estimatedDuration: 6 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: optional

## Step: Desarrollador Python Nativo en IA
- id: llm-native-developer
- type: milestone
- contentRef: null
- description: Puedes usar prompts de LLMs de forma deliberada y escribir Python sólido. Este hito es la puerta de entrada a construir agentes - asegúrate de que ambas competencias básicas estén cómodas antes de seguir.
- prerequisites: ["prompt-engineering", "python-intermediate"]
- conditionals: []
- comments: Autoevaluación honesta: ¿puedes explicar tokens y ventanas de contexto en voz alta y escribir un script de treinta líneas sin ayuda? Si es así estás listo para la Fase 2.
- ideas: ["Explica las ventanas de contexto a una persona no técnica", "Crea un pequeño script que llame a una API de LLM", "Revisa la lección más débil de la Fase 1"]
- estimatedDuration: 1 Hora
- relationships:
  - leadsTo: langgraph-fundamentals
    type: required

## Step: Fundamentos de LangGraph
- id: langgraph-fundamentals
- type: course
- contentRef: langgraph-beginner/01-what-is-langgraph
- description: Empieza a construir agentes reales con LangGraph. Aprende grafos de estado nodos y aristas integración con LLMs enlazamiento de herramientas enrutamiento condicional y termina con un agente completo de Q&A que usa herramientas.
- prerequisites: ["llm-native-developer"]
- conditionals: []
- comments: LangGraph es el framework de agentes más demandado en las ofertas de empleo. Piensa en grafos y no en prompts: esquema de estado más nodos más aristas es el modelo mental sobre el que se apoya toda la Fase 2.
- ideas: ["Dibuja el grafo de una conversación de soporte al cliente", "Reconstruye el agente Q&A del curso con tus propias herramientas", "Añade una ruta condicional que escale las preguntas difíciles"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: langgraph-intermediate
    type: required
  - leadsTo: agent-memory-rag
    type: required

## Step: LangGraph Intermedio y Flujos de Agentes
- id: langgraph-intermediate
- type: course
- contentRef: langgraph-intermediate/01-advanced-state
- description: Haz que tus agentes tengan estado y sean controlables. Domina reductores de estado persistencia y checkpointing memoria de conversación y resúmenes human-in-the-loop con interrupts flujos de aprobación fundamentos multiagente y streaming de tokens.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: El checkpointing y los interrupts separan las demos de agentes de los agentes de producción - ninguna empresa despliega un agente que no pueda pausar para aprobación humana. El proyecto final de investigación multiagente es la joya de esta disciplina.
- ideas: ["Añade checkpointing a tu proyecto inicial", "Construye un portón de aprobación antes de una herramienta destructiva", "Transmite tokens de un agente en ejecución a una interfaz de chat"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: required
  - leadsTo: crewai-multi-agent
    type: optional
  - leadsTo: opencode-fundamentals
    type: branch

## Step: Bases de Conocimiento y Memoria para Agentes
- id: agent-memory-rag
- type: course
- contentRef: agent-memory-knowledge/01-foundations-of-agent-memory
- description: Dale a tus agentes conocimiento más allá de la ventana de contexto. Aprende stores vectoriales embeddings y arquitectura RAG buffers de memoria y resúmenes ingesta de documentos y estrategias avanzadas de recuperación como HyDE MMR y multi-hop.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: RAG es la competencia más solicitada junto con los agentes en las ofertas reales. Hazlo en paralelo con el curso intermedio de LangGraph - uno enseña memoria dentro del grafo y el otro conocimiento fuera de él.
- ideas: ["Construye un pipeline RAG sobre tus propias notas", "Compara recuperación ingenua versus HyDE en preguntas difíciles", "Resume un documento largo en la memoria del agente"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: required

## Step: Colaboración Multiagente con CrewAI
- id: crewai-multi-agent
- type: course
- contentRef: crewai-agents/01-crewai-fundamentals-agents-and-tasks
- description: Segundo framework opcional. Aprende colaboración multiagente basada en roles con CrewAI - agentes con roles objetivos y trasfondos orquestación secuencial y jerárquica y herramientas personalizadas con contexto compartido.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: ["Hazlo tras los Fundamentos de LangGraph"]
- comments: Un segundo framework te enseña qué es universal (estado herramientas ciclos) y qué es opinión (los procesos de CrewAI). Los frameworks cambian rápido - los patrones no.
- ideas: ["Recrea tu agente de investigación LangGraph como una Crew", "Dale a un agente un trasfondo que cambie su comportamiento", "Compara una crew secuencial versus jerárquica en la misma tarea"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: Fundamentos de OpenCode
- id: opencode-fundamentals
- type: course
- contentRef: opencode-fundamentals/01-what-is-opencode-and-why-use-it
- description: Ruta opcional de herramientas. Aprende a usar OpenCode el asistente de programación con IA de código abierto en tus proyectos: instalación primeras sesiones la interfaz CLI y la configuración de opencode.json.
- prerequisites: ["llm-native-developer"]
- conditionals: ["Hazlo si quieres desarrollo asistido por IA"]
- comments: Esta ruta cambia la forma en que construyes el resto de la ruta - los agentes que escriben código aceleran todos los proyectos siguientes. Omítela libremente si prefieres construir todo a mano pues nunca es obligatoria.
- ideas: ["Instala OpenCode y completa una tarea real de programación", "Configura un opencode.json específico de proyecto", "Compara implementaciones asistidas por IA versus manuales"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: opencode-agents
    type: branch

## Step: OpenCode - Agentes y Skills
- id: opencode-agents
- type: course
- contentRef: opencode-agents/01-opencode-architecture-agents-skills-and-mcp
- description: Profundiza en las herramientas agénticas. Aprende la arquitectura de OpenCode con agentes skills y servidores MCP construye agentes y skills personalizados e implementa permisos y colaboración multiagente.
- prerequisites: ["opencode-fundamentals"]
- conditionals: ["Requiere Fundamentos de OpenCode"]
- comments: MCP - el Model Context Protocol - se está convirtiendo rápidamente en el estándar con el que los agentes se conectan a herramientas y datos externos. Entenderlo aquí rinde en todos los frameworks que uses después.
- ideas: ["Crea un agente OpenCode personalizado para una tarea repetida", "Escribe un manifiesto de skill para uno de tus flujos", "Conecta un servidor MCP y llámalo desde un agente"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: Sistemas Multiagente en Funcionamiento
- id: multi-agent-systems
- type: milestone
- contentRef: null
- description: Puedes construir agentes individuales con estado y entiendes los sistemas multiagente y RAG. La Fase 3 convierte demos que funcionan en sistemas de producción en los que los equipos pueden confiar.
- prerequisites: ["agent-memory-rag", "langgraph-intermediate"]
- conditionals: []
- comments: Autoevaluación: construye desde cero un pequeño agente que use una herramienta recuerde contexto y recupere información de un documento. Si puedes hacerlo estás listo para llevarlo a nivel de producción.
- ideas: ["Bosqueja la arquitectura de un agente que desplegarías", "Enumera tres formas en las que tu mejor agente podría fallar", "Elige un proyecto para endurecer en la Fase 3"]
- estimatedDuration: 1 Hora
- relationships:
  - leadsTo: langfuse-observability
    type: required
  - leadsTo: guardrails-evaluation
    type: required

## Step: Observabilidad con LangFuse
- id: langfuse-observability
- type: course
- contentRef: langfuse-observability/01-langfuse-overview-setup-sdk-integration
- description: Mira dentro de tus agentes. Configura LangFuse trazas de llamadas a LLMs y pasos del agente conjuntos de datos y evaluaciones LLM-as-judge gestión de versiones de prompts y dashboards de coste latencia y errores.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: La observabilidad es el mayor diferenciador entre ingenieros de IA de nivel medio y sénior - no se puede mejorar lo que no se ve. Instrumenta todos los proyectos a partir de aquí.
- ideas: ["Traza uno de tus agentes LangGraph de principio a fin", "Crea una puntuación LLM-as-judge para una tarea real", "Define una alerta de presupuesto de tokens para una ejecución"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: Guardrails y Evaluación
- id: guardrails-evaluation
- type: course
- contentRef: guardrails-evaluation/01-ai-guardrails-why-what-and-core-principles
- description: Haz que los agentes sean seguros y fiables. Implementa guardrails de entrada salida y comportamiento con NeMo y Guardrails AI diseña frameworks de evaluación y puntuación LLM-as-judge prueba sistemas agénticos con llamadas simuladas a LLMs y configura monitorización continua con detección de drift.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: La fiabilidad vence a la astucia en producción. La lección de pruebas - simular llamadas a LLMs más pruebas unitarias de integración y de extremo a extremo - es la competencia más transferible de toda la ruta.
- ideas: ["Añade un guardrail de salida resistente a inyecciones a un agente", "Escribe una prueba unitaria que simule una respuesta de LLM", "Define métricas de éxito y una alerta de drift para un proyecto"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: Flujos de Trabajo de OpenCode
- id: opencode-workflows
- type: course
- contentRef: opencode-workflows/01-multi-agent-orchestration-patterns
- description: Paso opcional final de herramientas. Diseña patrones de orquestación multiagente en OpenCode automatiza con hooks depura el comportamiento de los agentes optimiza el uso de tokens y configura flujos de colaboración de equipo.
- prerequisites: ["opencode-agents"]
- conditionals: ["Requiere OpenCode - Agentes y Skills"]
- comments: Cierra la ruta de herramientas - los patrones de orquestación depuración y caché aquí reflejan lo que usarás para endurecer los agentes LangGraph en el paso siguiente.
- ideas: ["Añade un hook que valide las ediciones de archivos del agente", "Depura un agente fallido usando solo sus logs", "Reduce a la mitad el coste en tokens de una tarea de agente"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: optional

## Step: LangGraph Avanzado y Agentes de IA en Producción
- id: langgraph-advanced
- type: course
- contentRef: langgraph-advanced/01-deployment
- description: Domina LangGraph de nivel de producción. Despliega agentes con LangGraph Cloud traza con LangSmith construye agentes jerárquicos agentic RAG agentes SQL reflection y plan-and-execute ejecución paralela y termina con un proyecto final de agente de soporte de nivel de producción.
- prerequisites: ["langfuse-observability", "guardrails-evaluation"]
- conditionals: []
- comments: Todo converge aquí. Las lecciones de despliegue y optimización llenan las últimas lagunas y el proyecto final es la pieza destacada de tu portafolio - un sistema de soporte multiagente con RAG transferencia a humanos y monitorización.
- ideas: ["Despliega un pequeño agente en LangGraph Cloud", "Añade reflection para mejorar la salida de un agente débil", "Construye el agente de soporte final y monitorízalo durante una semana"]
- estimatedDuration: 5 Semanas
- relationships:
  - leadsTo: agentic-ai-capstone
    type: required

## Step: Proyecto Final de IA Agéntica
- id: agentic-ai-capstone
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: Consolida todo. Revisa la arquitectura de agentes skills gestión de contexto y pipelines como un único modelo mental completo y aplícalo a proyectos del mundo real - generación de código revisión refactorización pruebas documentación y automatización de DevOps.
- prerequisites: ["langgraph-advanced"]
- conditionals: []
- comments: La disciplina final cose toda la ruta en una sola arquitectura: ciclos de percepción razonamiento y acción con memoria herramientas y guardrails. Termina publicando un proyecto con un resumen escrito de su arquitectura.
- ideas: ["Escribe un documento de arquitectura para tu agente final", "Ejecuta un agente de revisión de código en tu propio repositorio", "Publica un proyecto de agente con un README y una demostración"]
- estimatedDuration: 10 Horas
- relationships:
  - leadsTo: production-agentic-engineer
    type: required

## Step: Ingeniero de IA Agéntica en Producción
- id: production-agentic-engineer
- type: milestone
- contentRef: null
- description: Has completado el camino desde los conceptos básicos de IA hasta la IA agéntica de nivel de producción. Puedes diseñar construir evaluar y operar agentes en los que los equipos pueden confiar.
- prerequisites: ["agentic-ai-capstone"]
- conditionals: []
- comments: Celebra - y sigue construyendo. El campo avanza rápido: revisa regularmente las lecciones de observabilidad y evaluación y está atento a nuevos cursos que llenen los próximos capítulos sobre bases de datos vectoriales fine-tuning y agentes multimodales.
- ideas: ["Añade tu proyecto final a tu portafolio", "Mentorea a alguien en los tres primeros pasos", "Elige una laguna - despliegue seguridad o evaluación - para dominar después"]
- estimatedDuration: 1 Hora
- relationships: []
