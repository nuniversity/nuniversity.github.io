---
id: ai-agentic-development
title: "AI Agentic Development"
description: "Complete learning path from AI literacy to production-grade AI agents. Master prompting, Python, LangGraph, agent memory and RAG, multi-agent orchestration, observability, guardrails and evaluation - plus an optional OpenCode tooling track."
icon: "Bot"
order: 2
difficulty: "beginner"
estimatedDuration: "36 Weeks"
---

## Step: Practical AI Foundations
- id: ai-literacy
- type: course
- contentRef: practical-ai/01-introduction
- description: Build AI literacy with no code required. Understand what LLMs are how people use AI tools every day and what makes agentic AI fundamentally different from plain chat.
- prerequisites: []
- conditionals: []
- comments: Ten minutes of the right mental model beats ten hours of confused hacking. If you already use ChatGPT daily you can skim this step - the goal is to understand tokens context windows and why agents need loops.
- ideas: ["Ask two different AI assistants the same question and compare", "List three daily tasks an AI could automate for you", "Write down one task that should never be fully automated"]
- estimatedDuration: 2 Hours
- relationships:
  - leadsTo: prompt-engineering
    type: required
  - leadsTo: python-foundations
    type: required

## Step: Prompt Engineering
- id: prompt-engineering
- type: course
- contentRef: prompt-engineering/01-fundamentals-of-prompt-engineering
- description: Master the craft of directing LLMs. Learn the ABC CO-STAR and RISEN frameworks plus advanced techniques like Chain-of-Thought few-shot learning structured outputs prompt optimization and prompt injection defense.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: This is the highest-leverage skill in the whole roadmap - every agent you build later is only as good as the prompts that steer it. Pay special attention to the safety lesson: prompt injection is the number one vulnerability of agentic systems.
- ideas: ["Rewrite one vague prompt three ways and compare the outputs", "Build a CO-STAR template for a recurring work task", "Attack your own prompt with injection attempts and then harden it"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: llm-native-developer
    type: required

## Step: Python Foundations
- id: python-foundations
- type: course
- contentRef: python-beginner/01-what-is-python
- description: Learn to code in Python from scratch. Cover variables control flow loops functions and core data structures - the exact vocabulary that every LangGraph and CrewAI tutorial assumes you already know.
- prerequisites: ["ai-literacy"]
- conditionals: []
- comments: For developers who already write code this is a fast refresher. Aim for fluency with dictionaries and functions because agent state is just structured data moving through functions.
- ideas: ["Build a command line unit converter", "Write a function that merges two dictionaries safely", "Model a single chat turn as a dictionary"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: python-intermediate
    type: required

## Step: Intermediate Python
- id: python-intermediate
- type: course
- contentRef: python-intermediate/01-classes-objects
- description: Level up to professional Python. Master classes exceptions file handling generators decorators virtual environments unit testing and debugging - the toolchain that agents are built with.
- prerequisites: ["python-foundations"]
- conditionals: []
- comments: Decorators and unit testing matter most for agents - tools are decorated functions and evaluation harnesses are tests. If you are short on time prioritize those two lessons.
- ideas: ["Wrap a plain function as an agent tool with a decorator", "Write unit tests for a small CLI script", "Use a context manager to guarantee resource cleanup"]
- estimatedDuration: 5 Weeks
- relationships:
  - leadsTo: llm-native-developer
    type: required
  - leadsTo: python-advanced
    type: optional

## Step: Advanced Python Mastery
- id: python-advanced
- type: course
- contentRef: python-advanced/01-threading-multiprocessing
- description: Optional deep dive for experienced coders. Concurrency asyncio performance tuning design patterns FastAPI and packaging - take it if you want to ship agents as robust services.
- prerequisites: ["python-intermediate"]
- conditionals: ["Skip if you already write Python regularly"]
- comments: Asyncio and FastAPI have the best return on investment here since serving agents is mostly an async problem. Everything else is reference material you can revisit while building the capstone.
- ideas: ["Wrap a LangGraph agent behind a FastAPI endpoint", "Benchmark sequential versus concurrent tool execution", "Profile a slow agent run and fix the bottleneck"]
- estimatedDuration: 6 Weeks
- relationships:
  - leadsTo: llm-native-developer
    type: optional

## Step: LLM-Native Python Developer
- id: llm-native-developer
- type: milestone
- contentRef: null
- description: You can prompt LLMs deliberately and write solid Python. This milestone is the gateway to building agents - make sure both foundation skills feel comfortable before moving on.
- prerequisites: ["prompt-engineering", "python-intermediate"]
- conditionals: []
- comments: Honest self-check: can you explain tokens and context windows out loud and write a thirty line Python script without help? If yes you are ready for Phase 2.
- ideas: ["Explain context windows to a non-technical friend", "Build a tiny script that calls an LLM API", "Revisit the weakest lesson from Phase 1"]
- estimatedDuration: 1 Hour
- relationships:
  - leadsTo: langgraph-fundamentals
    type: required

## Step: LangGraph Fundamentals
- id: langgraph-fundamentals
- type: course
- contentRef: langgraph-beginner/01-what-is-langgraph
- description: Start building real agents with LangGraph. Learn state graphs nodes and edges LLM integration tool binding conditional routing and finish with a complete Q&A agent that uses tools.
- prerequisites: ["llm-native-developer"]
- conditionals: []
- comments: LangGraph is the most in-demand agent framework in job listings. Think in graphs not prompts: state schema plus nodes plus edges is the mental model everything else in Phase 2 builds on.
- ideas: ["Draw the graph for a customer support conversation", "Rebuild the course Q&A agent with your own tools", "Add a conditional route that escalates hard questions"]
- estimatedDuration: 3 Weeks
- relationships:
  - leadsTo: langgraph-intermediate
    type: required
  - leadsTo: agent-memory-rag
    type: required

## Step: Intermediate LangGraph & Agent Workflows
- id: langgraph-intermediate
- type: course
- contentRef: langgraph-intermediate/01-advanced-state
- description: Make your agents stateful and controllable. Master state reducers persistence and checkpointing conversation and summary memory human-in-the-loop interrupts approval workflows multi-agent basics and token streaming.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: Checkpointing and interrupts are what separate demo agents from production agents - no enterprise deploys an agent that cannot pause for human approval. The final multi-agent research project is the crown jewel of this course.
- ideas: ["Add checkpointing to your beginner project", "Build an approval gate before a destructive tool runs", "Stream tokens from a running agent into a chat interface"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: multi-agent-systems
    type: required
  - leadsTo: crewai-multi-agent
    type: optional
  - leadsTo: opencode-fundamentals
    type: branch

## Step: Agent Knowledge Bases & Memory
- id: agent-memory-rag
- type: course
- contentRef: agent-memory-knowledge/01-foundations-of-agent-memory
- description: Give agents knowledge beyond the context window. Learn vector stores embeddings and RAG architecture memory buffers and summaries document ingestion and advanced retrieval strategies like HyDE MMR and multi-hop retrieval.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: []
- comments: RAG is the skill most requested alongside agents in real job postings. Take it in parallel with the intermediate LangGraph course - one teaches memory inside the graph the other teaches knowledge outside it.
- ideas: ["Build a RAG pipeline over your own notes", "Compare naive versus HyDE retrieval on hard questions", "Summarize a long document into agent memory"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: multi-agent-systems
    type: required

## Step: Multi-Agent Collaboration with CrewAI
- id: crewai-multi-agent
- type: course
- contentRef: crewai-agents/01-crewai-fundamentals-agents-and-tasks
- description: Optional second framework. Learn role-based multi-agent collaboration with CrewAI - agents with roles goals and backstories sequential and hierarchical orchestration and custom tools with shared context.
- prerequisites: ["langgraph-fundamentals"]
- conditionals: ["Take after LangGraph Fundamentals"]
- comments: A second framework teaches you what is universal (state tools loops) and what is opinion (CrewAI processes). Frameworks change fast - patterns do not.
- ideas: ["Recreate your LangGraph research agent as a Crew", "Give one agent a backstory that changes its behavior", "Compare a sequential versus hierarchical crew on the same task"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: OpenCode Fundamentals
- id: opencode-fundamentals
- type: course
- contentRef: opencode-fundamentals/01-what-is-opencode-and-why-use-it
- description: Optional tooling track. Learn to use OpenCode the open-source AI coding assistant in your projects: installation first sessions the CLI interface and opencode.json configuration.
- prerequisites: ["llm-native-developer"]
- conditionals: ["Take if you want AI-assisted development"]
- comments: This track changes how you build the rest of the roadmap - agents that write code speed up every later project. Skip it freely if you prefer to build everything by hand since it is never required.
- ideas: ["Install OpenCode and complete one real coding task", "Configure a project specific opencode.json", "Compare AI-assisted versus manual implementations"]
- estimatedDuration: 3 Weeks
- relationships:
  - leadsTo: opencode-agents
    type: branch

## Step: OpenCode Agents & Skills
- id: opencode-agents
- type: course
- contentRef: opencode-agents/01-opencode-architecture-agents-skills-and-mcp
- description: Go deeper into agentic tooling. Learn the OpenCode architecture of agents skills and MCP servers build custom agents and skills and implement permissions and multi-agent collaboration.
- prerequisites: ["opencode-fundamentals"]
- conditionals: ["Requires OpenCode Fundamentals"]
- comments: MCP - the Model Context Protocol - is fast becoming the standard way agents connect to external tools and data. Understanding it here pays off in every framework you use later.
- ideas: ["Create a custom OpenCode agent for a repeated task", "Write a skill manifest for one of your workflows", "Connect an MCP server and call it from an agent"]
- estimatedDuration: 3 Weeks
- relationships:
  - leadsTo: multi-agent-systems
    type: optional

## Step: Working Single- & Multi-Agent Systems
- id: multi-agent-systems
- type: milestone
- contentRef: null
- description: You can build stateful single agents and you understand multi-agent systems and RAG. Phase 3 turns working demos into production systems that teams can trust.
- prerequisites: ["agent-memory-rag", "langgraph-intermediate"]
- conditionals: []
- comments: Self-check: build one small agent from scratch that uses a tool remembers context and retrieves from a document. If you can do that you are ready to make it production-grade.
- ideas: ["Sketch the architecture of an agent you would deploy", "List three ways your best agent could fail", "Pick one project to harden in Phase 3"]
- estimatedDuration: 1 Hour
- relationships:
  - leadsTo: langfuse-observability
    type: required
  - leadsTo: guardrails-evaluation
    type: required

## Step: Observability with LangFuse
- id: langfuse-observability
- type: course
- contentRef: langfuse-observability/01-langfuse-overview-setup-sdk-integration
- description: See inside your agents. Set up LangFuse trace LLM calls and agent steps build datasets and LLM-as-judge evaluations manage prompt versions and monitor dashboards for cost latency and errors.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: Observability is the strongest differentiator between mid-level and senior AI engineers - you cannot improve what you cannot see. Instrument every project from here on.
- ideas: ["Trace one of your LangGraph agents end to end", "Build an LLM-as-judge score for a real task", "Set a token budget alert for an agent run"]
- estimatedDuration: 3 Weeks
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: Guardrails & Evaluation
- id: guardrails-evaluation
- type: course
- contentRef: guardrails-evaluation/01-ai-guardrails-why-what-and-core-principles
- description: Make agents safe and reliable. Implement input output and behavioral guardrails with NeMo and Guardrails AI design evaluation frameworks and LLM-as-judge scoring test agentic systems with mocked LLM calls and set up continuous monitoring with drift detection.
- prerequisites: ["multi-agent-systems"]
- conditionals: []
- comments: Reliability beats cleverness in production. The testing lesson - mocking LLM calls plus unit integration and end-to-end tests - is the most transferable skill in the entire roadmap.
- ideas: ["Add an injection-resistant output guardrail to an agent", "Write a unit test that mocks an LLM response", "Define success metrics and a drift alert for a project"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: langgraph-advanced
    type: required

## Step: OpenCode Developer Workflows
- id: opencode-workflows
- type: course
- contentRef: opencode-workflows/01-multi-agent-orchestration-patterns
- description: Optional final tooling step. Design multi-agent orchestration patterns in OpenCode automate with hooks debug agent behavior optimize token usage and set up team collaboration workflows.
- prerequisites: ["opencode-agents"]
- conditionals: ["Requires OpenCode Agents & Skills"]
- comments: Closes the tooling track - orchestration debugging and caching patterns here mirror what you will use to harden LangGraph agents in the next step.
- ideas: ["Add a hook that validates agent file edits", "Debug a failing agent using only its logs", "Cut one agent task's token cost in half"]
- estimatedDuration: 4 Weeks
- relationships:
  - leadsTo: langgraph-advanced
    type: optional

## Step: Advanced LangGraph & Production AI Agents
- id: langgraph-advanced
- type: course
- contentRef: langgraph-advanced/01-deployment
- description: Master production-grade LangGraph. Deploy agents with LangGraph Cloud trace with LangSmith build hierarchical agents agentic RAG SQL agents reflection and plan-and-execute patterns parallel execution and finish with a production-grade customer support agent capstone.
- prerequisites: ["langfuse-observability", "guardrails-evaluation"]
- conditionals: []
- comments: Everything converges here. The deployment and optimization lessons fill the last gaps and the capstone is the flagship project for your portfolio - a multi-agent support system with RAG human handoff and monitoring.
- ideas: ["Deploy a small agent to LangGraph Cloud", "Add reflection to improve a weak agent output", "Build the capstone support agent and monitor it for a week"]
- estimatedDuration: 5 Weeks
- relationships:
  - leadsTo: agentic-ai-capstone
    type: required

## Step: Agentic AI Capstone
- id: agentic-ai-capstone
- type: course
- contentRef: agentic-ai-development/01-intro-to-ai-agents
- description: Consolidate everything. Revisit agent architecture skills context management and pipelines as one complete mental model then apply it to real-world projects - code generation review refactoring testing documentation and DevOps automation.
- prerequisites: ["langgraph-advanced"]
- conditionals: []
- comments: The final course ties the whole roadmap together as one architecture: perception reasoning and action loops with memory tools and guardrails. Finish by shipping one project publicly with a written architecture summary.
- ideas: ["Write an architecture doc for your capstone agent", "Run a code review agent on your own repository", "Publish one agent project with a README and a demo"]
- estimatedDuration: 10 Hours
- relationships:
  - leadsTo: production-agentic-engineer
    type: required

## Step: Production Agentic AI Engineer
- id: production-agentic-engineer
- type: milestone
- contentRef: null
- description: You have completed the path from AI literacy to production-grade agentic AI. You can design build evaluate and operate agents that teams can trust.
- prerequisites: ["agentic-ai-capstone"]
- conditionals: []
- comments: Celebrate - then keep building. The field moves fast: revisit the observability and evaluation lessons regularly and watch for new courses filling the future chapters on vector databases fine-tuning and multimodal agents.
- ideas: ["Add your capstone to your portfolio", "Mentor someone through the first three steps", "Pick one gap - deployment security or evaluation - to master next"]
- estimatedDuration: 1 Hour
- relationships: []
