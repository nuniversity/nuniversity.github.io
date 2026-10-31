---
id: ai-agentic-development
title: "Desenvolvimento de IA Agêntica"
description: "Caminho completo de aprendizagem desde a literacia em IA até agentes de IA de nível de produção. Domine prompting, Python, LangGraph, memória de agentes e RAG, orquestração multi-agente, observabilidade, guardrails e avaliação - além de uma trilha opcional de ferramentas OpenCode."
icon: "Bot"
order: 2
difficulty: "beginner"
estimatedDuration: "36 Semanas"
---

## Step: Fundamentos de IA Prática
- id: ai-literacy
- type: course
- contentRef: practical-ai/01-introducao
- description: Construa literacia em IA sem escrever código. Entenda o que são os LLMs como as pessoas usam ferramentas de IA no dia a dia e o que torna a IA agêntica fundamentalmente diferente de um simples chat.
- prerequisites: []
- conditionals: []
- comments: Dez minutos com o modelo mental certo valem mais que dez horas de tentativa e erro confusa. Se já usa o ChatGPT diariamente pode ler esta etapa rapidamente - o objetivo é compreender tokens janelas de contexto e por que os agentes precisam de ciclos.
- ideas: ["Peça a mesma pergunta a dois assistentes de IA e compare", "Liste três tarefas diárias que uma IA poderia automatizar", "Anote uma tarefa que nunca deveria ser totalmente automatizada"]
- estimatedDuration: 2 Horas
- relationships:
  - leadsTo: prompt-engineering
    type: required
  - leadsTo: python-foundations
    type: required

## Step: Engenharia de Prompt
- id: prompt-engineering
- type: course
- contentRef: prompt-engineering/01-fundamentals-of-prompt-engineering
- description: Domine a arte de dirigir LLMs. Aprenda os frameworks ABC CO-STAR e RISEN além de técnicas avançadas como Chain-of-Thought few-shot learning saídas estruturadas otimização de prompts e defesa contra prompt injection.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: Esta é a competência de maior alavancagem de todo o roteiro - cada agente que construir depois será tão bom quanto os prompts que o orientam. Atenção especial à lição de segurança: prompt injection é a vulnerabilidade número um dos sistemas agênticos.
- ideas: ["Reescreva um prompt vago de três maneiras e compare os resultados", "Crie um template CO-STAR para uma tarefa de trabalho recorrente", "Ataque o seu próprio prompt com injeções e depois o reforce"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: required

## Step: Fundamentos de Python
- id: python-foundations
- type: course
- contentRef: python-beginner/01-what-is-python
- description: Aprenda a programar em Python do zero. Cubra variáveis controlo de fluxo laços funções e estruturas de dados essenciais - o vocabulário exato que todo tutorial de LangGraph e CrewAI pressupõe.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: Para programadores que já escrevem código este curso é um reforço rápido. Procure fluência com dicionários e funções porque o estado de um agente são apenas dados estruturados a passar por funções.
- ideas: ["Construa um conversor de unidades na linha de comandos", "Escreva uma função que funde dois dicionários com segurança", "Modele uma única interação de chat como um dicionário"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: python-intermediate
    type: required

## Step: Python Intermediário
- id: python-intermediate
- type: course
- contentRef: python-intermediate/01-classes-objects
- description: Evolua para Python profissional. Domine classes exceções tratamento de ficheiros geradores decoradores ambientes virtuais testes unitários e depuração - o conjunto de ferramentas com que agentes são construídos.
- prerequisites: ["python-foundations"]
- conditionals: []
- comments: Decoradores e testes unitários são o mais importante para agentes - ferramentas são funções decoradas e harnesses de avaliação são testes. Se tiver pouco tempo priorize essas duas lições.
- ideas: ["Envova uma função simples como ferramenta de agente usando um decorador", "Escreva testes unitários para um pequeno script CLI", "Use um context manager para garantir a limpeza de recursos"]
- estimatedDuration: 5 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: required
  - leadsTo: python-advanced
    type: optional

## Step: Domínio Avançado de Python
- id: python-advanced
- type: course
- contentRef: python-advanced/01-threading-multiprocessing
- description: Aprofundamento opcional para programadores experientes. Concorrência asyncio otimização de desenho padrões de design FastAPI e distribuição de pacotes - faça se quiser publicar agentes como serviços robustos.
- prerequisites: ["python-intermediate"]
- conditionals: ["Pule se já programa em Python regularmente"]
- comments: Asyncio e FastAPI têm o melhor retorno aqui pois servir agentes é sobretudo um problema assíncrono. O resto é material de referência que pode rever ao construir o projeto final.
- ideas: ["Exponha um agente LangGraph através de um endpoint FastAPI", "Compare execução sequencial versus concorrente de ferramentas", "Analise o desempenho de uma execução lenta e corrija o gargalo"]
- estimatedDuration: 6 Semanas
- relationships:
  - leadsTo: llm-native-developer
    type: optional

## Step: Desenvolvedor Python Nativo em IA
- id: llm-native-developer
- type: milestone
- contentRef: null
- description: Você consegue usar prompts de LLMs de forma deliberada e escrever Python sólido. Este marco é o portal para construir agentes - garanta que as duas competências de base estão confortáveis antes de avançar.
- prerequisites: ["prompt-engineering", "python-intermediate"]
- conditionals: []
- comments: Autoavaliação honesta: consegue explicar tokens e janelas de contexto em voz alta e escrever um script de trinta linhas sem ajuda? Se sim você está pronto para a Fase 2.
- ideas: ["Explique janelas de contexto para uma pessoa não técnica", "Crie um pequeno script que chama uma API de LLM", "Reveja a lição mais fraca da Fase 1"]
- estimatedDuration: 1 Hora
- relationships:
  - leadsTo: langgraph-fundamentals
    type: required

## Step: Fundamentos de LangGraph
- id: langgraph-fundamentals
- type: course
- contentRef: langgraph-beginner/01-what-is-langgraph
- description: Comece a construir agentes reais com LangGraph. Aprenda grafos de estado nós e arestas integração com LLMs vinculação de ferramentas roteamento condicional e finalize com um agente completo de Q&A que usa ferramentas.
- prerequisites: ["llm-native-developer"]
- conditionals: []
- comments: LangGraph é o framework de agentes mais procurado nas vagas de emprego. Pense em grafos e não em prompts: esquema de estado mais nós mais arestas é o modelo mental em que toda a Fase 2 se apoia.
- ideas: ["Desenhe o grafo de uma conversa de suporte ao cliente", "Reconstrua o agente Q&A do curso com as suas próprias ferramentas", "Adicione uma rota condicional que escale perguntas difíceis"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: langgraph-intermediate
    type: required
  - leadsTo: agent-memory-rag
    type: required

## Step: LangGraph Intermediário e Fluxos de Agentes
- id: langgraph-intermediate
- type: course
- contentRef: langgraph-intermediate/01-advanced-state
- description: Torne os seus agentes com estado e controláveis. Domine redutores de estado persistência e checkpointing memória de conversa e resumos human-in-the-loop com interrupts fluxos de aprovação fundamentos de multi-agentes e streaming de tokens.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: Checkpointing e interrupts separam demonstrações de agentes de agentes de produção - nenhuma empresa publica um agente que não consegue pausar para aprovação humana. O projeto final de pesquisa multi-agente é a joia desta disciplina.
- ideas: ["Adicione checkpointing ao seu projeto iniciante", "Construa um portão de aprovação antes de uma ferramenta destrutiva", "Transfira tokens de um agente em execução para uma interface de chat"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: required
  - leadsTo: crewai-multi-agent
    type: optional
  - leadsTo: opencode-fundamentals
    type: branch

## Step: Bases de Conhecimento e Memória para Agentes
- id: agent-memory-rag
- type: course
- contentRef: agent-memory-knowledge/01-foundations-of-agent-memory
- description: Dê aos agentes conhecimento além da janela de contexto. Aprenda stores vetoriais embeddings e arquitetura RAG buffers de memória e resumos ingestão de documentos e estratégias avançadas de recuperação como HyDE MMR e multi-hop.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: RAG é a competência mais pedida ao lado dos agentes nas vagas reais. Faça em paralelo com o curso intermediário de LangGraph - um ensina memória dentro do grafo o outro ensina conhecimento fora dele.
- ideas: ["Construa um pipeline RAG sobre as suas próprias notas", "Compare recuperação ingênua versus HyDE em perguntas difíceis", "Resuma um documento longo na memória do agente"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: required

## Step: Multi-Agentes com CrewAI
- id: crewai-multi-agent
- type: course
- contentRef: crewai-agents/01-crewai-fundamentals-agents-and-tasks
- description: Segundo framework opcional. Aprenda colaboração multi-agente baseada em papéis com CrewAI - agentes com papéis objetivos e histórias orquestração sequencial e hierárquica e ferramentas personalizadas com contexto partilhado.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: ["Faça após os Fundamentos de LangGraph"]
- comments: Um segundo framework ensina o que é universal (estado ferramentas ciclos) e o que é opinião (processos do CrewAI). Frameworks mudam rápido - padrões não mudam.
- ideas: ["Recrie o seu agente de pesquisa LangGraph como uma Crew", "Dê a um agente uma história que mude o seu comportamento", "Compare uma crew sequencial versus hierárquica na mesma tarefa"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: Fundamentos do OpenCode
- id: opencode-fundamentals
- type: course
- contentRef: opencode-fundamentals/01-what-is-opencode-and-why-use-it
- description: Trilha opcional de ferramentas. Aprenda a usar o OpenCode o assistente de programação com IA de código aberto nos seus projetos: instalação primeiras sessões a interface CLI e configuração do opencode.json.
- prerequisites: ["llm-native-developer"]
- conditionals: ["Faça se quiser desenvolvimento assistido por IA"]
- comments: Esta trilha muda a forma como constrói o resto do roteiro - agentes que escrevem código aceleram todos os projetos seguintes. Pula-la livremente se preferir construir tudo à mão pois nunca é obrigatória.
- ideas: ["Instale o OpenCode e conclua uma tarefa real de programação", "Configure um opencode.json específico de projeto", "Compare implementações assistidas por IA versus manuais"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: opencode-agents
    type: branch

## Step: OpenCode - Agentes e Skills
- id: opencode-agents
- type: course
- contentRef: opencode-agents/01-opencode-architecture-agents-skills-and-mcp
- description: Aprofunde-se em ferramentas agênticas. Aprenda a arquitetura do OpenCode com agentes skills e servidores MCP construa agentes e skills personalizados e implemente permissões e colaboração multi-agente.
- prerequisites: ["opencode-fundamentals"]
- conditionals: ["Requer Fundamentos do OpenCode"]
- comments: MCP - o Model Context Protocol - está a tornar-se rapidamente o padrão como agentes se ligam a ferramentas e dados externos. Compreendê-lo aqui compensa em todos os frameworks que usar depois.
- ideas: ["Crie um agente OpenCode personalizado para uma tarefa repetida", "Escreva um manifesto de skill para um dos seus fluxos", "Ligue um servidor MCP e chame-o a partir de um agente"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: Sistemas Multi-Agente Funcionais
- id: multi-agent-systems
- type: milestone
- contentRef: null
- description: Você consegue construir agentes individuais com estado e entende sistemas multi-agente e RAG. A Fase 3 transforma demonstrações funcionais em sistemas de produção em que as equipas podem confiar.
- prerequisites: ["agent-memory-rag", "langgraph-intermediate"]
- conditionals: []
- comments: Autoavaliação: construa de raiz um pequeno agente que usa uma ferramenta mantém contexto e recupera informação de um documento. Se consegue está pronto para o tornar de nível de produção.
- ideas: ["Esboce a arquitetura de um agente que publicaria em produção", "Liste três formas como o seu melhor agente poderia falhar", "Escolha um projeto para endurecer na Fase 3"]
- estimatedDuration: 1 Hora
- relationships:
  - leadsTo: langfuse-observability
    type: required
  - leadsTo: guardrails-evaluation
    type: required

## Step: Observabilidade com LangFuse
- id: langfuse-observability
- type: course
- contentRef: langfuse-observability/01-langfuse-overview-setup-sdk-integration
- description: Veja o interior dos seus agentes. Configure o LangFuse trace de chamadas a LLMs e passos do agente conjuntos de dados e avaliações LLM-as-judge gestão de versões de prompts e dashboards de custo latência e erros.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: Observabilidade é o maior diferencial entre engenheiros de IA de nível médio e séniores - não se pode melhorar o que não se vê. Instrumente todos os projetos a partir daqui.
- ideas: ["Faça o trace completo de um dos seus agentes LangGraph", "Crie uma pontuação LLM-as-judge para uma tarefa real", "Defina um alerta de orçamento de tokens para uma execução"]
- estimatedDuration: 3 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: Guardrails e Avaliação
- id: guardrails-evaluation
- type: course
- contentRef: guardrails-evaluation/01-ai-guardrails-why-what-and-core-principles
- description: Torne os agentes seguros e fiáveis. Implemente guardrails de entrada saída e comportamento com NeMo e Guardrails AI crie frameworks de avaliação e pontuação LLM-as-judge teste sistemas agênticos com chamadas simuladas a LLMs e configure monitorização contínua com deteção de drift.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: Fiabilidade vence esperteza em produção. A lição de testes - simular chamadas a LLMs mais testes unitários de integração e ponta a ponta - é a competência mais transferível de todo o roteiro.
- ideas: ["Adicione um guardrail de saída resistente a injeção num agente", "Escreva um teste unitário que simula uma resposta de LLM", "Defina métricas de sucesso e um alerta de drift para um projeto"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: Fluxos de Trabalho do OpenCode
- id: opencode-workflows
- type: course
- contentRef: opencode-workflows/01-multi-agent-orchestration-patterns
- description: Passo opcional final de ferramentas. Desenhe padrões de orquestração multi-agente no OpenCode automatize com hooks depure o comportamento dos agentes otimize o uso de tokens e configure fluxos de colaboração de equipa.
- prerequisites: ["opencode-agents"]
- conditionals: ["Requer OpenCode - Agentes e Skills"]
- comments: Fecha a trilha de ferramentas - os padrões de orquestração depuração e cache aqui refletem o que usará para endurecer os agentes LangGraph no passo seguinte.
- ideas: ["Adicione um hook que valide as edições de ficheiros do agente", "Depure um agente falhando usando apenas os seus logs", "Reduza pela metade o custo em tokens de uma tarefa de agente"]
- estimatedDuration: 4 Semanas
- relationships:
  - leadsTo: langgraph-advanced
    type: optional

## Step: LangGraph Avançado e Agentes de IA em Produção
- id: langgraph-advanced
- type: course
- contentRef: langgraph-advanced/01-deployment
- description: Domine LangGraph de nível de produção. Publique agentes com o LangGraph Cloud faça trace com o LangSmith construa agentes hierárquicos agentic RAG agentes SQL reflection e plan-and-execute execução paralela e conclua com um projeto final de agente de suporte de nível de produção.
- prerequisites: ["langfuse-observability", "guardrails-evaluation"]
- conditionals: []
- comments: Tudo converge aqui. As lições de publicação e otimização preenchem as últimas lacunas e o projeto final é o projeto de destaque do seu portfólio - um sistema de suporte multi-agente com RAG transferência para humanos e monitorização.
- ideas: ["Publique um pequeno agente no LangGraph Cloud", "Adicione reflection para melhorar a saída de um agente fraco", "Construa o agente de suporte final e monitorize-o durante uma semana"]
- estimatedDuration: 5 Semanas
- relationships:
  - leadsTo: agentic-ai-capstone
    type: required

## Step: Projeto Final de IA Agêntica
- id: agentic-ai-capstone
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: Consolide tudo. Reveja arquitetura de agentes skills gestão de contexto e pipelines como um único modelo mental completo e depois aplique-o a projetos do mundo real - geração de código revisão refatoração testes documentação e automação de DevOps.
- prerequisites: ["langgraph-advanced"]
- conditionals: []
- comments: A disciplina final costura todo o roteiro numa única arquitetura: ciclos de percepção raciocínio e ação com memória ferramentas e guardrails. Termine publicando um projeto com um resumo escrito da arquitetura.
- ideas: ["Escreva um documento de arquitetura para o seu agente final", "Execute um agente de revisão de código no seu próprio repositório", "Publique um projeto de agente com um README e uma demonstração"]
- estimatedDuration: 10 Horas
- relationships:
  - leadsTo: production-agentic-engineer
    type: required

## Step: Engenheiro de IA Agêntica em Produção
- id: production-agentic-engineer
- type: milestone
- contentRef: null
- description: Você concluiu o caminho desde a literacia em IA até IA agêntica de nível de produção. Consegue projetar construir avaliar e operar agentes em que as equipas podem confiar.
- prerequisites: ["agentic-ai-capstone"]
- conditionals: []
- comments: Celebre - e continue a construir. O campo evolui rápido: reveja regularmente as lições de observabilidade e avaliação e esteja atento a novos cursos que preencham os próximos capítulos sobre bases de dados vetoriais fine-tuning e agentes multimodais.
- ideas: ["Adicione o seu projeto final ao portfólio", "Mentore alguém nas três primeiras etapas", "Escolha uma lacuna - publicação segurança ou avaliação - para dominar a seguir"]
- estimatedDuration: 1 Hora
- relationships: []
