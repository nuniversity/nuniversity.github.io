# Course: AWS Certified AI Practitioner (AIF-C01) Complete Course

## Course Metadata

| Field | Value |
|-------|-------|
| **Slug** | `aws-aif-c01` |
| **Title** | AWS Certified AI Practitioner (AIF-C01) Complete Course |
| **Area** | Cloud & AI/ML |
| **Difficulty** | Intermediate |
| **Duration** | 12 weeks |
| **Lessons** | 16 |
| **Prerequisites** | Not declared in `course.json` |
| **Languages** | EN only (PT, ES deferred) |
| **Source directory** | `content/courses/aws-aif-c01/` (`course.json` + `en/`) |
| **Research digests** | `.scratch/aws-aif/` — 13 files |
| **Document statistics verified** | 07 October 2026 (every number below re-derived with `wc` / `grep` on the files themselves) |

### Verified Course Statistics

| Metric | Value | Verification |
|--------|-------|--------------|
| Lesson files | **16** | `ls content/courses/aws-aif-c01/en/*.md \| wc -l` |
| Total lesson lines | **15,718** | `cat *.md \| wc -l` in `en/` |
| Total lesson bytes | **1,303,234** | `cat *.md \| wc -c` |
| Total lesson words | **194,635** | `cat *.md \| wc -w` |
| Shortest / longest lesson | **905** (L06) / **1,087** (L12) lines | `wc -l` per file |
| Average lesson length | **982** lines | 15,718 ÷ 16 |
| Lesson time budget | **1,560 minutes (26 hours)** | sum of frontmatter `duration:` (90+75+80+80+80+85+90+100+110+115+110+110+110+110+115+100) |
| Per-lesson duration range | **75 min (L02) – 115 min (L10, L15)** | frontmatter |
| Multiple-choice `question` blocks | **213** | `grep -c` over the `question` fence in all 16 files |
| `matching` blocks | **19** | `grep -c` over the `matching` fence |
| `fillblank` blocks | **13** | `grep -c` over the `fillblank` fence |
| `dragdrop` blocks | **15** | `grep -c` over the `dragdrop` fence |
| Interactive blocks (matching + fillblank + dragdrop) | **47** | 19 + 13 + 15 |
| Mermaid diagrams | **88** | `grep -c` over the `mermaid` fence |
| "Did you know?" curiosities | **121** | `grep -c '📚 Did you know'` |
| `[!WARNING]` callouts | **88** | `grep -c '\[!WARNING\]'` |
| `[!IMPORTANT]` callouts | **21** | `grep -c '\[!IMPORTANT\]'` |
| `[!NOTE]` / `[!SUCCESS]` callouts | **25 / 16** | `grep -c` |
| Total admonition callouts | **150** | 88 + 21 + 25 + 16 |
| Fenced blocks opened | **390** | 213 question + 88 mermaid + 47 interactive + 33 `text` + 7 `json` + 2 `plot` |
| Fenced blocks closed with a bare fence | **390** | `grep -cx` on a bare fence line — 1:1 match, no labelled closers |
| `Key Takeaways` sections | **16 / 16** | one per lesson |
| `Real-World Case Studies` sections | **15 / 16** | absent only in L16 |
| `2025–2026 Updates` sections | **15 / 16** | absent only in L04 |
| Locales shipped | **`en/` only** | `course.json` carries an `en` key only; no `pt/` or `es/` directory |
| Digest files | **13** (numbered 07–19) | `ls .scratch/aws-aif/ \| wc -l` |
| Digest lines / bytes | **4,232 / 388,831** | `cat .scratch/aws-aif/*.md \| wc -l` / `wc -c` |
| Digest size per file | **29,501 – 29,996 bytes (avg. 29,910 ≈ 30 KB)** | `wc -c` per file |
| Digest draft exam questions | **160** | `grep -c '^\*\*Q[0-9]'` — 10 per digest, 40 in digest 16 |
| Unique external URLs in digests | **239** (277 occurrences) | `grep -oE 'https?://…' \| sort -u` |
| Full `https://` URLs inside lessons | **0** | lessons cite scheme-less first-party paths (see *External Resources*) |
| Unfinished-work markers in lessons | **0** | A `grep -ri` for unfinished-work markers returns nothing; the five hits for one masking term are legitimate PII-masking language (`{NAME}`, `{EMAIL}`) |

### Validation

| Check | Result |
|-------|--------|
| `.opencode/skills/course-writer/scripts/validate_lesson.py` (run with `OPENCODE_FILE_PATH`) | **16 / 16 lessons exit 0** |
| `.opencode/skills/course-writer/scripts/validate_course.py` (run with `OPENCODE_SKILL_DIR`) | **exit 1 — 4 warnings, all locale-related**: missing `pt`/`es` sections in `course.json` and missing `pt/`/`es/` directories. No structural, naming, ordering or frontmatter error is reported. |
| `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |

> **Language status.** The course is **English-only today**. PT and ES are **deferred**: the directory contains a single locale folder (`en/`), `course.json` defines an `en` block only, and the course validator's entire output is the four missing-`pt`/`es` warnings quoted above. The `course-writer` and `i18n-translator` skills are the intended path for the later PT/ES pass; nothing in the shipped EN content blocks that translation.

---

## Course Description

> "Comprehensive preparation for the AWS Certified AI Practitioner (AIF-C01) exam covering AI/ML foundations, generative AI on AWS, building and operating solutions with Amazon Bedrock and SageMaker, security, cost optimization, and responsible AI — with architecture diagrams, real case studies, and exam-style practice questions."
> — `content/courses/aws-aif-c01/course.json`, `en.description`

Sixteen lessons take a candidate from the official exam guide to a timed, scored simulation. The first six lessons build the classical AI/ML spine — exam logistics, lifecycle, data engineering, algorithms and evaluation, training and tuning, deployment. Lessons 07–15 are the AWS-specific half: the ten prebuilt AI services, the generative-AI core (tokens, transformers, prompting), Amazon Bedrock, RAG and knowledge bases, agents and Flows, guardrails and responsible AI, MLOps and scaling, security/IAM/compliance, and cost/governance. Lesson 16 closes with the capstone simulation: a 15-item, domain-weighted Set A, a scoring rubric, a 40-hour study plan and a synthesis of lessons 01–15.

Every lesson is written to the same contract: a hook that states the exam-relevant failure mode, a numbered section map, mermaid architecture diagrams, worked arithmetic with AWS-published numbers, a real-world case-study section, a `Key Takeaways` block, admonition callouts where a trap exists, and a closing `Practice Questions` set of multiple-choice items plus interactive matching, fill-in-the-blank and drag-and-drop exercises.

### Learning Outcomes

Upon completing this course, students will be able to:

1. Read the official AIF-C01 exam guide as a specification — candidate profile, in/out-of-scope list, the five domains with their published weights, task statements, question formats and compensatory scoring — and convert it into a weight-driven study plan.
2. Place every stage of the machine-learning lifecycle (collection, EDA, pre-processing, feature engineering, training, tuning, evaluation, deployment, monitoring) on the correct AWS service, and choose among batch, real-time, asynchronous and serverless inference using their published limits.
3. Build and govern AI data pipelines on AWS: storage formats (CSV/Parquet/JSONL), Glue Data Catalog and Lake Formation, Glue/EMR/Athena engines, Ground Truth labeling, Feature Store online/offline semantics and PII discovery with Amazon Macie.
4. Select the learning paradigm, algorithm family and AWS route for a business problem, and defend the model with the right evaluation metric — precision, recall, F1, AUC — alongside the business metric the exam asks for.
5. Train, tune, deploy and monitor models on Amazon SageMaker: input modes and channels, `ml.*` instance families, distributed training, the four tuning strategies, Managed Spot Training with checkpoints, endpoint topologies, A/B and shadow rollouts and the drift-to-retrain loop.
6. Explain the mechanics of generative AI — tokens, transformers, embeddings, prompt engineering, inference parameters, context windows, diffusion and the prompt → RAG → fine-tune customization ladder — and compute with them.
7. Operate Amazon Bedrock end to end: model access, the `Invoke`/`Converse` surface, on-demand vs batch vs provisioned throughput vs service tiers, cross-Region inference profiles, knowledge bases (RAG), agents, Flows and the three evaluation modes.
8. Apply responsible-AI and security controls: the six Bedrock Guardrails safeguards plus Automated Reasoning checks, SageMaker Clarify bias/explainability, NIST AI RMF / ISO / EU AI Act, least-privilege IAM, SSE-KMS, VPC and PrivateLink, CloudTrail and AWS Artifact.
9. Compute and prevent AI overspend — SageMaker instance-hour and Spot arithmetic, Bedrock token, batch, caching and routing levers, prebuilt per-unit meters, Cost Explorer, budgets, tags, SCPs and Service Catalog — and sit the exam with a tested timing, elimination and guessing strategy.

---

## Deep-Research Methodology

No lesson in this course was written from memory. Each one was produced from a **research digest** first: a single file of source-pinned facts, tables, worked numbers, draft questions and explicit non-assertions, from which the lesson was then written. The digests live in `.scratch/aws-aif/` (a git-ignored scratch directory — `research scratch (never commit)` in `.gitignore`) and each one follows the same eight-section skeleton:

| Section | Content |
|---------|---------|
| **(A) KEY FACTS** | Numbered facts, each with its source and year in the same row |
| **(B) AWS OFFICIAL STANDARDS / DOCS** | Only first-party, verified statements |
| **(C) DATA & BENCHMARKS** | Quantitative material: limits, prices, thresholds, measured outcomes |
| **(D) REQUIRED TABLES** | The comparison tables the lesson must ship |
| **(E) PRACTICAL EXAMPLES** | Worked arithmetic and worked configurations, with numbers |
| **(F) EXAM QUESTIONS** | Draft multiple-choice items in official AWS style, with keys |
| **(G) UNVERIFIED** | Items AWS does not confirm — isolated so they are never taught as fact |
| **(H) SOURCES** | Real, clickable URLs, most retrieved 06 Oct 2026 |

Two disciplines run through the whole set: **no number without a source and a year**, and **unverified claims are labelled in section (G), never silently dropped**. That is why every lesson carries a `Conflicting, unverified and non-examinable facts` or `Exam traps / what not to memorise` section, and why lesson 16 ends with `What this lesson does not assert`.

### Digest Inventory (01–19)

| Digest | File | Lines | Bytes | Focus |
|--------|------|-------|-------|-------|
| 01 | — | — | — | **Not present.** No file numbered `01-*` exists in `.scratch/aws-aif/`. |
| 02 | — | — | — | **Not present.** No file numbered `02-*` exists in `.scratch/aws-aif/`. |
| 03 | — | — | — | **Not present.** No file numbered `03-*` exists in `.scratch/aws-aif/`. |
| 04 | — | — | — | **Not present.** No file numbered `04-*` exists in `.scratch/aws-aif/`. |
| 05 | — | — | — | **Not present.** No file numbered `05-*` exists in `.scratch/aws-aif/`. |
| 06 | — | — | — | **Not present.** No file numbered `06-*` exists in `.scratch/aws-aif/`. |
| 07 | `07-aws-ai-services.md` | 305 | 29,991 | Prebuilt AI services: Rekognition, Comprehend, Textract, Translate, Polly, Transcribe, Lex, Personalize, Forecast, Amazon Q — billing units, free tiers, hard limits and a which-service decision tree (feeds L07) |
| 08 | `08-generative-ai-fundamentals.md` | 259 | 29,920 | Generative-AI core: tokens, transformers, embeddings, prompt engineering, inference parameters, context windows, the customization spectrum, evaluation and Guardrails (feeds L08) |
| 09 | `09-bedrock-foundations.md` | 351 | 29,956 | Bedrock mechanics: single API and its two endpoints, model access, on-demand/batch/provisioned/service tiers, cross-Region profiles, model choice and the three evaluation modes (feeds L09) |
| 10 | `10-rag-knowledge-bases.md` | 312 | 29,994 | RAG pipelines: ingestion and runtime paths, managed vs customer-managed knowledge bases, the four chunking strategies, embedding dimensions, eight vector stores, retrieval APIs, Kendra transition (feeds L10) |
| 11 | `11-bedrock-agents-workflows.md` | 326 | 29,966 | Agents Classic → AgentCore migration, agent anatomy and the pre/orchestration/post loop, action groups, return of control, traces, memory, multi-agent collaboration, Flows nodes and pricing (feeds L11) |
| 12 | `12-genai-safety-guardrails.md` | 303 | 29,990 | Six Guardrails safeguards plus Automated Reasoning checks, content-filter strengths and Classic/Standard tiers, prompt-attack defense, attach points, Clarify, NIST/ISO/EU AI Act (feeds L12) |
| 13 | `13-mlops-scaling.md` | 318 | 29,968 | SageMaker Pipelines as a JSON DAG with 16 step types, Condition/Fail gates, parallelism and caching, Model Registry approvals, Projects, MLflow, auto scaling and the EventBridge retraining flywheel (feeds L13) |
| 14 | `14-security-iam-compliance.md` | 356 | 29,702 | IAM role types and least privilege, boundaries/SCPs, SSE-KMS vs SSE-S3, VPC and PrivateLink, CloudTrail management vs data events, GuardDuty AI Protection, HIPAA and AWS Artifact (feeds L14) |
| 15 | `15-cost-governance-optimization.md` | 271 | 29,995 | SageMaker on-demand/Spot/Savings Plans/serverless arithmetic, Bedrock token-batch-cache levers, prebuilt unit pricing, Cost Explorer, tags, Budgets actions, SCPs, Service Catalog, AWS Config (feeds L15) |
| 16 | `16-exam-simulation.md` | 453 | 29,877 | Capstone logistics and question-format rules, a **40-item** single-best-answer bank (Sets A–C), study examples and clock arithmetic (feeds L16 Set A + the rapid key) |
| 17 | `17-aws-case-studies.md` | 262 | 29,996 | Cross-cutting: **the 12 AWS customer case studies**, each with before/after numbers and a stated lesson — the source of every `Real-World Case Studies` section (feeds L01–L15) |
| 18 | `18-aws-updates-2026.md` | 412 | 29,501 | Cross-cutting: AWS AI/ML service changes, maintenance notices and release dates for 2025–2026 that are examinable — the source of the `2025–2026 Updates` sections (feeds 15 lessons) |
| 19 | `19-exam-strategy.md` | 304 | 29,975 | Cross-cutting: verified exam logistics, official rules, trap patterns, pacing and the guess protocol — the source of lesson 16's twelve trap families and pacing plan |
| **Total** | **13 files** | **4,232** | **388,831** | **160 draft exam questions across the set** |

**Numbering, stated plainly.** The digest directory contains **13 files, not 19**: everything from `07` upward. Digests **01–06 do not exist on disk** (`ls -la .scratch/aws-aif/` returns only `07-…` through `19-…`), so no digest backs lessons 01–06 — those lessons cite the official exam guide directly in their opening sections and build their tables from first-party AWS documentation. Digest numbering otherwise follows lesson numbering (07–16), and 17–19 are three cross-cutting digests with no lesson of the same number — they are pushed back into the lessons as case-study sections, update sections and the capstone's trap/pacing material.

**Per-lesson digests vs. cross-cutting digests.** Ten digests (07–16) map one-to-one onto a lesson; three (17, 18, 19) are enhancement passes. Digest 17 is why lessons 01–15 each end with named customer cases; digest 18 is why 15 of 16 lessons carry a dated `2025–2026 Updates` section; digest 19 is why lesson 16 can teach twelve trap families and an item-range pacing plan instead of generic advice.

---

## Real-World Examples

Every case below is quoted with the numbers AWS published for it, and each is cited across multiple lessons — the same case is reused as evidence for different task statements rather than being told once and dropped.

### The Twelve Case Studies (from digest 17)

| # | Company | Industry / year | AWS services | Documented outcome | Lessons citing it |
|---|---------|-----------------|--------------|--------------------|-------------------|
| 1 | **Sun Finance** | Fintech lending, 9 countries — ML Blog, 30 Apr 2026 | Textract, Rekognition, Claude Sonnet 4, Titan Multimodal Embeddings, S3 Vectors | Accuracy **79.73 → 90.80 %** (ID number 74.32 → 89.40 %), **−91 %** cost per document, **20 h → <5 s**, fraud **81 %**; attempt 1 (Claude alone) scored **61.8 %** and was rejected | **15** |
| 2 | **Adobe** | Software — ML Blog, 11 Jun 2025 | Bedrock Knowledge Bases (4 chunking strategies), Titan Text Embeddings V2, OpenSearch, Retrieve API | **+20 %** retrieval accuracy on Adobe's own test set; the **400-token / 20 %-overlap** strategy won | **12** |
| 3 | **Chronomics** | Health-tech (COVID test reader) — ML Blog, 13 Dec 2022 | Rekognition Custom Labels (AutoML), `DetectCustomLabels` | **4 months** of in-house CV → **3–4 weeks** shipped at **96.5 % accuracy / 97.9 % F1**; threshold 0.99 → 99.6 % while discarding 5 % of predictions | **12** |
| 4 | **Forethought** | SaaS customer service | Off Amazon EKS → SageMaker multi-model endpoints + Serverless Inference | **−66 %** via MME with better latency, **≈−80 %** on Serverless, **>80 %** of GPU inference on SageMaker, run by a **3-person** team for 30 M interactions/yr | **10** |
| 5 | **Alnylam Pharmaceuticals** | Biotech, 2025 | Bedrock + S3 + RAG, AskALNY Slack assistant with citations | Complaint triage **3 days → hours**, information search **15 min → 30 s**, **2,000 employees + 1,000 contractors**, **250+ use cases** | **10** |
| 6 | **Nippon India Mutual Fund** | Financial services — ML Blog, 29 Jul 2025 | Bedrock Knowledge Bases, rerankers, GraphRAG, metadata filtering, Guardrails | Accuracy **>95 %**, hallucination **−90–95 %**, reports **2 days → ~10 minutes** | **8** |
| 7 | **Bynder** | Digital asset management, 2025 | Titan Multimodal Embeddings in Bedrock | **−75 %** search time, **~+50 %** results per search; **175 M assets / 18 PB / 4,000 customers** | **8** |
| 8 | **Epilot** | Energy software, Cologne — indexed Jul 2026 | SQS → Lambda → Bedrock (Claude Sonnet) + Bedrock Evaluations | **−87 %** handling time, **55,000 summaries/month**, MVP in **2 months**, data kept in an **EU Region** | **7** |
| 9 | **Anthem** | Health insurance, 2021 | Amazon Textract (OCR + table/form detection) | Manual extraction at **20 min/claim** → **80 %** of the workflow automated, **90 %+** target, thousands of claims/day | **6** |
| 10 | **HAYAT HOLDING** | Manufacturing (MDF panels), 2023 | OPC-UA → IoT Greengrass SiteWise Edge → SageMaker training, Automatic Model Tuning, Edge Manager | **194 sensors**, **$300,000/year** saved, higher product quality | **7** |
| 11 | **RareJob** | EdTech (PROGOS speaking test), 2020 | SageMaker managed spot training + AWS Glue + Amazon Athena | **−25 %** training time, **>10×** dev efficiency, **100 hours/month** saved, scores in **2–3 minutes** | **6** |
| 12 | **Prime Focus Technologies** | Media, 2025 | Bedrock + AWS Lambda agents on CLEAR (14 M+ assets) | Localization **cost −20–30 %**, **accuracy +20–30 %**, **turnaround −30–40 %**; first attempt on external LLM APIs failed the live-latency requirement | **6** |

*Citation counts are word-boundary counts of the company name across the 16 lesson files (`grep -lw`). Lesson 16 contains no case-study section by design.*

### Four Cases Worth Telling in Full

**Example 1: Sun Finance — the LLM-only OCR trap.** Sixty percent of microloan applications needed manual review taking 10 minutes to 20 hours. The first prototype sent ID photos straight to an LLM and scored **61.8 %** overall, **43 %** on the ID number, and was rejected — AWS documents that privacy protections block direct PII extraction. The shipped pipeline separates the jobs: **Textract for OCR, Rekognition as fallback and face checks, Claude Sonnet 4 only for structuring**, validation rules afterwards, and Titan Multimodal Embeddings in S3 Vectors for fraud similarity. Result: **90.80 %** accuracy on 585 evaluation images at **−91 %** cost per document. The lesson: *separate OCR from reasoning* — it recurs as an evaluation-domain item, a prebuilt-service item and a cost item.

**Example 2: Nippon India — retrieval engineering, not a bigger model.** Naive RAG degraded as document volume grew and produced hallucinations. The fix was not a larger model but **FM-as-parser parsing, query reformulation, multi-query RAG, reranker models, GraphRAG and metadata filtering** on Bedrock Knowledge Bases, plus Guardrails and citations: accuracy **>95 %**, hallucination **−90–95 %**, report generation from **2 days to about 10 minutes**. This case carries Domain 3's "diagnose a RAG failure" shape.

**Example 3: Forethought — DIY inference is a hidden tax.** A three-person team supporting 30 M interactions a year could not run models *and* Kubernetes. Moving off their own Amazon EKS to SageMaker multi-model endpoints gave **−66 %** with better latency, Serverless Inference about **−80 %**, and **more than 80 %** of GPU inference on SageMaker. The case is the evidence behind every "managed vs. build it yourself" verdict in the course.

**Example 4: Chronomics — the threshold is a decision, not a detail.** Four months of in-house custom computer vision never reached target; Rekognition Custom Labels shipped in **3–4 weeks** at **96.5 % accuracy / 97.9 % F1**. Raising the confidence threshold to **0.99** produced **99.6 %** accuracy but discarded **5 %** of predictions, and 0.999 produced **99.87 %** while discarding **27 %**. The exam item is never the number — it is *who handles the discarded predictions*, which is why A2I and human-in-the-loop appear in the same breath.

---

## Story

> **Hook:** "Amazon Bedrock is the service the AIF-C01 exam names more than any other, and it is also the service that changes fastest."
> — lesson 09, opening line

> **Story:** AWS launched the AI Practitioner credential as a *practitioner* — not an engineer — exam: the candidate profile says **up to 6 months of exposure to AI/ML technologies on AWS** and **uses but does not necessarily build AI/ML solutions**. The exam is **65 questions in 90 minutes** (**50 scored + 15 unscored**, the unscored items never identified), scored on a **100–1,000** scale with a **700** cut, **compensatory** across five domains, with **no penalty for guessing** and a blank counted as wrong. The published weights are **D1 20 % · D2 24 % · D3 28 % · D4 14 % · D5 14 %**, and the current guide is **v1.1, published 30 April 2026**.

> **Connection:** That combination — a fast-moving service surface and a slow-moving scoring model — is why this course exists in its particular shape. Memorising a model list or a per-token price has a shelf life of weeks; memorising **mechanisms** (how on-demand, batch, provisioned throughput and service tiers behave; how a chunking strategy changes retrieval; where a guardrail attaches) stays correct for years. So every lesson pairs dated, source-pinned numbers with the mechanism underneath them, and every lesson closes with exam-style items that punish the slogan answer. The 12-week duration in `course.json` maps onto lesson 16's **40-hour, weight-driven plan** (8.0 / 9.6 / 11.2 / 5.6 / 5.6 hours for D1–D5) and its **six-week sequence** — weeks 1–5 carry lessons 01–15, week 6 carries the capstone simulation and the weak-domain repair loop.

**Exam alignment, domain by domain.**

| Domain | Weight | Where the course teaches it |
|--------|--------|-----------------------------|
| **D1** Fundamentals of AI and ML | **20 %** | L01 (guide, paradigms, metrics), L02 (lifecycle), L03 (data engineering), L04 (algorithms and evaluation), L05 (training), L06 (deployment), L07 (prebuilt services) |
| **D2** Fundamentals of Generative AI | **24 %** | L08 (tokens, transformers, prompting, context windows), L09 (Bedrock APIs, pricing tiers), L15 (token and unit cost arithmetic) |
| **D3** Applications of Foundation Models | **28 %** | L08 (customization ladder, evaluation), L09 (model choice, evaluations), L10 (RAG and knowledge bases), L11 (agents, Flows, orchestration) |
| **D4** Guidelines for Responsible AI | **14 %** | L12 (Guardrails, Clarify, transparency artifacts, NIST/ISO/EU AI Act), L08 (responsible-AI dimensions) |
| **D5** Security, Compliance, Governance | **14 %** | L14 (IAM, encryption, VPC/PrivateLink, audit, HIPAA/Artifact), L12 (guardrail enforcement), L15 (preventive governance) |

L16 then converts the map into test craft: the clock arithmetic (90 minutes ÷ 65 items ≈ 83 seconds each), distractor decoding, twelve trap families, an item-range pacing plan, Set A, a scoring rubric and the last-48-hours protocol.

---

## Lesson Structure

All 16 lessons share one skeleton: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook immediately under the H1, a numbered `##` section map, mermaid diagrams, an admonition where a trap exists, a `Key Takeaways` block, and a closing `Practice Questions` section. Counts below were re-derived per file.

### Lesson 01: AIF-C01 Exam Guide and AI/ML Fundamentals

**Duration:** 90 minutes (951 lines)

**Hook:** "Every AWS certification starts with a document: the official exam guide. For AIF-C01 that document does two jobs at once — it tells you exactly *how* the exam is built (codes, minutes, questions, cut score, weights) and it defines the *conceptual vocabulary* you must command in Domain 1."

**Learning Objectives:**
- Read the exam guide as a specification: target candidate, in-scope and explicitly out-of-scope content, the service surface you must recognise
- Convert the logistics table into a per-question time budget and a cost-of-failure analysis
- Map the five domains, their published weights and their task statements onto a study plan
- Distinguish the four question types and apply compensatory scoring correctly
- Separate AI, ML, deep learning and generative AI, and choose the learning paradigm from a question stem
- Define Domain 1 terminology, diagnose underfitting/overfitting/bias-variance, and compute accuracy, precision, recall and F1

**Content Outline:**
- 1. What AIF-C01 actually measures — target candidate, in scope and explicitly out of scope, the AWS service surface you must recognize
- 2. Exam logistics: the numbers that change your strategy — the logistics table, the per-question time budget, the cost of failure
- 3. Domains, weights and task statements — official weights, the derived question budget, turning weights into a study plan
- 4. Question types and scoring mechanics — the four types, compensatory scoring, scaled vs. raw
- 5. AI, machine learning, deep learning and generative AI — the four-layer map in AWS's own words, and when AI/ML is the wrong answer
- 6. Learning paradigms: supervised, unsupervised, reinforcement, semi-supervised — the decision table and the stem-to-paradigm read
- 7. Core terminology: the vocabulary of Domain 1 — AWS-sourced definitions, epoch/batch arithmetic, inference modes, data types
- 8. Model fit: underfitting, overfitting, bias and variance — the diagnosis table, a 1,000-row split, the two senses of bias
- 9. Evaluation metrics: accuracy, precision, recall and F1 — the metric set, why F1 is a harmonic mean, model vs. business metrics
- 10. The AI/ML development lifecycle — the six phases of the Well-Architected ML Lens, phase-to-service map, business goal → monitored endpoint
- 11. Preparation roadmap, resources and caveats — Skill Builder assets, the official four-step plan, recertification, 2025–2026 updates, exam-strategy essentials
- 12. Real-World Case Studies — case × services × outcome table plus three cases in detail
- Practice Questions

**Exam alignment:** the domain-weight and task-statement map itself (D1 20 % carries the vocabulary this lesson teaches), plus the logistics and scoring rules that govern every other lesson.

**Real-World Application:** The lesson's case table (`12.1 Case × services × outcome`) is the course's first contact with the customer evidence base, and section 11 routes the candidate to official Skill Builder assets, the four-step AWS preparation plan and the recertification/retake rules.

**Practice Questions:** 13 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 6 `[!WARNING]` · 2 `[!IMPORTANT]`

---

### Lesson 02: End-to-End ML Lifecycle on AWS

**Duration:** 75 minutes (1,017 lines)

**Hook:** "Machine learning projects rarely fail because a model cannot be trained. They fail because nobody decided *which* stage of the lifecycle owns *which* service, because a notebook prototype was shipped as a permanent endpoint, or because nobody noticed the input data changed six months after launch."

**Learning Objectives:**
- Map the nine lifecycle stages of Task 1.3 onto AWS services and name the seven MLOps fundamentals behind them
- Apply the three-question framework (call an API vs customize an FM vs build your own; data modality; control required) to choose an AWS path
- Place ingestion, storage and Feature Store online/offline semantics correctly
- Compare the four inference options against their published numeric ceilings
- Read a monitoring signal and close the loop from alarm to retrained model
- Separate SageMaker from Bedrock, EC2, ECS, EKS and Lambda in a service-selection question

**Content Outline:**
- 1. The nine stages of the ML lifecycle on AWS — stage-by-stage service map, the MLOps concepts the exam tests, the lifecycle as a loop
- 2. Choosing the AWS path: the three-question framework — call an API / customize an FM / build your own, data modality, control required
- 3. Data ingestion, storage and the Feature Store — where data comes from, online vs. offline, online store tiers and write semantics
- 4. Data processing, EDA and feature engineering — which service processes which workload, the Processing job contract, the no-code tools
- 5. Training, hyperparameter tuning and orchestration — training jobs and the cost ceiling, paths that skip the loop, Pipelines, Model Registry
- 6. Evaluation, documentation and governance — SageMaker Clarify's three analyses, Model Cards and Model Dashboard
- 7. Deployment: the four inference options — batch vs. real-time vs. asynchronous vs. serverless, the numeric ceilings, choosing among the four
- 8. Monitoring, drift and the retraining loop — the four monitor types, alarm → retrained model, what AWS recommends instead
- 9. Comparative verdict: SageMaker vs. the alternatives — individual services, Bedrock vs. SageMaker, streaming inference architecture
- 10. Availability, maintenance and sunset traps — the 2026 availability snapshot, the SageMaker feature map and status, 2025–2026 updates
- 11. Cost, free tier and the numbers you can safely memorize — free tier, worked cost pattern, quotas
- 12. Worked AWS examples with numbers
- 13. Conflicting, unverified and non-examinable facts
- Real-World Case Studies
- Practice Questions (section 14)

**Exam alignment:** Task 1.3 (place the lifecycle stages against AWS services) and Task 1.1 (distinguish batch, real-time, asynchronous and serverless inferencing) — the two statements the lesson quotes in its opening paragraph.

**Real-World Application:** Six cases — HAYAT HOLDING (train → deploy → monitor on a plant floor), Forethought, RareJob, Chronomics, Sun Finance and Anthem — shown both individually and in one comparison table.

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 03: Data Engineering for AI on AWS

**Duration:** 80 minutes (920 lines)

**Hook:** "Models do not fail in training. They fail because the table they were trained on had a column that leaked the target, because a 3 TB CSV was scanned instead of 0.25 TB of Parquet, because a labeling job went out to Mechanical Turk without declaring that the images were free of personally identifiable information…"

**Learning Objectives:**
- Tie the three exam-guide statements that make data engineering examinable to their task statements
- Walk the eleven-hop data pipeline and justify the order of its stages
- Choose between CSV, Parquet and JSONL by cost and by query pattern
- Separate Glue Data Catalog permissions from Lake Formation grants
- Select among Glue, EMR and Athena on billing and scale, and pick a Glue worker size
- Run a labeling workflow with Ground Truth/A2I and prepare fine-tuning datasets in the required formats

**Content Outline:**
- 1. Where this lesson sits in the exam — the task statements, the tool-per-task matrix
- 2. The data pipeline end to end — one flowchart, eleven hops, and why the order matters
- 3. Storage and data formats: CSV vs. Parquet vs. JSONL — the comparison that decides your Athena bill, the numbers behind the defaults
- 4. Catalog and governance: Glue Data Catalog and Lake Formation — two permission families, table permissions, what replaced Governed Tables
- 5. Processing engines: Glue, EMR and Athena — billing and scale facts, Glue worker sizes, Athena pricing rules, choosing the engine
- 6. Data quality and preparation: Data Wrangler and DataBrew — rulesets and profile jobs
- 7. Human labeling: Ground Truth and A2I — the twelve-step labeling workflow, the numbers, the workflow diagram
- 8. SageMaker Feature Store: online and offline — the two stores, write semantics and capacity modes
- 9. Privacy, PII and secure data engineering with Amazon Macie — how Macie finds sensitive data, the severity table
- 10. Preparing training data for foundation-model fine-tuning — the format that is not negotiable, published dataset limits, Amazon Nova specifics
- 11. Conflicting, unverified and non-examinable facts
- 12. Comparative verdict and summary tables — quality/labeling/governance at a glance, the five examinable defaults, 2025–2026 updates
- 13. Real-World Case Studies
- 14. Practice Questions

**Exam alignment:** Task 1.3 (ML lifecycle), Task 3.3 (fine-tuning data preparation) and the secure-data-engineering statements of the security, compliance and governance domain — the three positions the lesson claims in its opening paragraph.

**Real-World Application:** Five production pipelines shown as `services, numbers, sources` and as before/after pairs — the section that proves which storage format and which engine a real team chose.

**Practice Questions:** 14 multiple-choice + 1 matching + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 0 `fillblank` · 1 `dragdrop` · 8 `mermaid` · 8 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 04: ML Algorithms and Model Evaluation on AWS

**Duration:** 80 minutes (1,032 lines)

**Hook:** "An algorithm is easy to name and hard to justify. The AIF-C01 exam almost never asks *'which algorithm exists'* — it asks *'the business needs X, the labels look like Y, and AWS gives you Z; justify the pair and defend the metric.'*"

**Learning Objectives:**
- Choose the paradigm from the question stem (labels? reward signal? neither?) and map it to AWS's implementation
- Use the algorithm → use case → AWS route matrix under time pressure
- Separate supervised families (linear, trees, boosting, neural nets) from unsupervised ones (clustering, reduction, anomaly, topics)
- Take any of the four routes to an algorithm — built-in, script mode, JumpStart, BYOC — and respect the container rules
- Compute metrics from a confusion matrix, including the 1 % fraud trap
- Diagnose underfitting/overfitting and correct it with the right tuning control, splits and class weighting

**Content Outline:**
- 1. The three learning paradigms and how AWS implements them — selection guide, workflow shape, reinforcement learning on SageMaker
- 2. The algorithm → use case → AWS route matrix — the full matrix, task type → algorithm family, the built-in lists you must reproduce
- 3. The supervised families: linear, trees, boosting and neural nets — Linear Learner, the three gradient-boosting built-ins, the XGBoost objective menu
- 4. The unsupervised families: clustering, reduction, anomaly and topics — K-Means and its missing validation set, silhouette, PCA's three hyperparameters
- 5. Four routes to an algorithm — the decision flow, BYOC container rules, container support windows as examinable dates
- 6. Evaluation metrics: formulas, directions and when to use them — the formula sheet, confusion-matrix choice, two worked matrices
- 7. Data splits, cross-validation and A/B testing — published split standards, split arithmetic on 100,000 rows, Autopilot's 50,000-instance threshold
- 8. Underfitting, overfitting and the tuning controls that fix them — the diagnosis, the mechanical controls, the diagnostic sequence
- 9. Imbalanced data: three levers and the numbers behind them — class-weight arithmetic and the documented trade-off
- 10. Evaluation by task type — the lookup table, including what Clarify actually computes for foundation models
- 11. Putting the three axes together
- 12. Worked examples with numbers
- 13. Traps, conflicts and unverified claims
- Real-World Case Studies
- 14. Practice Questions

**Exam alignment:** Task 2.1 (select appropriate ML techniques for regression, classification and clustering), Task 2.2 (describe supervised, unsupervised and reinforcement learning) and Task 1.4 (model performance metrics alongside business metrics — cost per user, development cost, customer feedback, ROI).

**Real-World Application:** Four case studies used as decision evidence — Chronomics (threshold as a decision), Sun Finance (never let one model do two jobs), HAYAT HOLDING (automatic tuning replaces the manual sweep) and Adobe (chunking and embeddings are hyperparameters too).

**Practice Questions:** 13 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 05: Training and Hyperparameter Tuning on Amazon SageMaker

**Duration:** 80 minutes (935 lines)

**Hook:** "A training job is the most expensive object you create before a model ever serves a request — and it is the object the AIF-C01 exam asks you to reason about most precisely."

**Learning Objectives:**
- List the eight required pieces of `CreateTrainingJob` and the lifecycle a job goes through
- Choose an input mode — File, FastFile, Pipe — using AWS's own thresholds, and configure channels correctly
- Size a training job across `ml.*` families and apply the two published sizing rules
- Distinguish data parallelism from model parallelism and name the libraries AWS names
- Compare Grid, Random, Bayesian and Hyperband tuning strategies against their limits
- Compute Managed Spot Training savings from the official formula and configure checkpoints that resume instead of restart

**Content Outline:**
- 1. Anatomy of a SageMaker training job — the eight required pieces, the lifecycle a job goes through, what training costs and how it is billed
- 2. Getting data into the job: input modes and channels — File / FastFile / Pipe side by side, channel enumeration, choosing a mode by AWS's thresholds
- 3. Choosing compute: the `ml.*` instance families — the naming rule, the published GPU hardware, two sizing rules that decide your bill
- 4. Distributed training: data parallelism vs. model parallelism — the one distinction the exam wants, the libraries AWS names
- 5. Automatic Model Tuning: what a tuning job does — the flow, ranges, scaling and the objective metric, the limits you should recite
- 6. Tuning strategies: Grid vs. Random vs. Bayesian vs. Hyperband — the full comparison and one section per strategy
- 7. Managed Spot Training and checkpoints — the official savings formula, the two configuration rules, checkpoints as resume not restart
- 8. Observing the run: metrics, Debugger and Experiments
- 9. Paths that skip the training loop entirely — JumpStart, Autopilot, and choosing a starting point
- 10. Comparative verdict: strategies and managed vs. DIY
- 11. Limits, quotas and cost evidence in one place — published limits, cost evidence, 2025–2026 updates
- 12. Worked AWS examples with numbers
- 13. Conflicting, unverified and non-examinable facts
- 14. Real-World Case Studies
- Practice Questions

**Exam alignment:** Domain 1 (20 % of the scored content) with Task 1.3 naming *"performing hyperparameter tuning or model optimization"* outright — the lesson's stated target.

**Real-World Application:** Four stories plus a `services, numbers, sources` table and a per-case statement of what each proves against this lesson.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 0 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 06: Deployment and Inference on Amazon SageMaker

**Duration:** 85 minutes (905 lines)

**Hook:** "Training produces an artifact; **inference is where the model meets a caller and where the bill starts**… The failure mode is never 'you did not know SageMaker can host a model'. It is that you picked **serverless** for an 800 MB payload, **batch** for a sub-second chat UI, **real-time** for a job that runs twice a night."

**Learning Objectives:**
- Explain the object model: three API calls plus an optional fourth, and which decision each owns
- Compare real-time, serverless, batch transform and asynchronous inference side by side on their ceilings
- Apply the decision matrix to a workload description without re-reading the table
- Choose an endpoint topology — multi-model, multi-container, inference components — for a shared endpoint
- Configure auto scaling, warm capacity and scale-to-zero, including the recovery path
- Design a rollout with A/B, shadow variants and deployment guardrails, then monitor drift

**Content Outline:**
- 1. The object model: three calls and one optional fourth — what each API call owns, the deployment architecture, where the async switch lives
- 2. The four inference options — real-time, serverless, batch transform, asynchronous, and the ceilings side by side
- 3. Choosing an option: the decision matrix
- 4. Endpoint topologies: five ways to share one endpoint — multi-model, multi-container, inference components
- 5. Auto scaling, warm capacity and scale-to-zero — the standard three steps, scale-to-zero and its recovery path
- 6. Testing and rollout: A/B, shadow variants and guardrails
- 7. Monitoring: data capture, Model Monitor and the drift loop — the four monitors, the 2026 availability change, the retrain loop, 2025–2026 updates
- 8. Sizing, cost and Inference Recommender
- 9. MLOps: CI/CD, Kubernetes and the edge — SageMaker Projects, Neo, the Edge Manager discontinuation
- 10. Comparative verdict
- 11. Worked AWS examples with numbers
- 12. Conflicting, unverified and non-examinable facts
- 13. Real-World Case Studies
- Practice Questions

**Exam alignment:** Task 2.1 — *"select the appropriate deployment option for an AI/ML solution"* — which the lesson calls the single most service-selection-heavy task in the whole guide.

**Real-World Application:** Five deployment cases as `services, numbers, sources`, a before/after table, and a per-case statement of what each proves for Task 2.1.

**Practice Questions:** 13 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 13 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 9 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 07: Prebuilt AWS AI Services: Vision, Language, Speech and Conversation

**Duration:** 90 minutes (1,079 lines)

**Hook:** "Everything you built so far — data pipelines, algorithms, training jobs, endpoints — was **yours**: your data, your model, your bill for instance-hours. This lesson is about the other half of the AIF-C01 surface: the services where **AWS already owns the model** and you rent the answer by the unit."

**Learning Objectives:**
- Classify a workload by what the customer is handing you — image, document, text, speech, conversation — before naming a service
- Price each of the ten prebuilt services from its billing unit, volume tier and free tier
- Apply the hard limits that the exam turns into distractors (page limits, minimum charges, free-tier duration)
- Choose between Rekognition image and video APIs, and between the Textract feature switches
- Route Amazon Q to its per-user answer and Personalize/Forecast to their metered floors
- Use the decision tree to pick exactly one service for a one-sentence requirement

**Content Outline:**
- 1. The prebuilt landscape: what each service is for — ten services, four modalities, what "prebuilt" means on this exam
- 2. Amazon Rekognition: images, video, faces and moderation — two API groups, the meters, hard limits and free tier, worked AWS examples
- 3. Amazon Comprehend: what the text is saying — the unit and the minimum, the API surface, Custom Comprehend's changed meter, limits worth memorizing
- 4. Amazon Textract: structure from documents — five APIs, the price ladder, Queries priced per page, the three-month free tier
- 5. Amazon Translate: high-volume machine translation — rates, free tier, what you are not charged for, custom terminology
- 6. Amazon Polly and Amazon Transcribe: the speech pair — per-character vs. per-minute meters and their limits
- 7. Amazon Lex: intents, slots and the per-request meter — the bill, what counts as one request, free tier, where Lex stops
- 8. Amazon Personalize and Amazon Forecast — Personalize's meter with a floor, Forecast as a lifecycle question
- 9. Amazon Q: the per-user answer
- 10. Which AI service? The decision tree
- 11. Free tiers, limits and the numbers you must memorize — the outlier free tiers, hard limits, AWS worked examples, input in/output out
- 12. Comparative verdict
- 13. Exam traps for this lesson
- Service lifecycle watch (including 2025–2026 updates)
- Real-World Case Studies
- Practice Questions

**Exam alignment:** the two question shapes that recur across all five domains — *"which service?"* and *"what does it cost?"* — answered for the ten services where AWS owns the model.

**Real-World Application:** Anthem (Textract first, humans in the tail), Chronomics (four months of DIY vision → 3–4 weeks of AutoML), Sun Finance (the LLM-only OCR trap) and Alnylam (Amazon Q Business with citations under GxP).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 08: Generative AI Fundamentals: Tokens, Transformers, Prompting and Foundation Models

**Duration:** 100 minutes (997 lines)

**Hook:** "This is the highest-leverage lesson in the course. **Domain 2 carries 24 % and Domain 3 carries 28 %** of the scored content — **52 % in total** — and almost every question inside those two domains is built from the same small set of objects: a **token**, a **context window**, a **prompt**, an **inference parameter**, an **embedding** and a **foundation model (FM)**."

**Learning Objectives:**
- Define generative AI the way the exam guide does, and pair each advantage with its control and each risk with its mitigation
- Run token arithmetic with both AWS-published estimation rules and pick the binding embedding limit
- Explain self-attention (query, key, value), positional encoding and why transformers beat RNNs
- Choose a prompt-engineering technique — zero/few-shot, chain-of-thought, ReAct — against its cost
- Set inference parameters for a workload and know the defaults cold
- Budget a context window, then place a workload on the prompt → RAG → fine-tune ladder

**Content Outline:**
- 1. What generative AI is — and what it is not — the definition the exam uses, the advantages and risks AWS names, the FM lifecycle
- 2. Tokens: the unit everything is measured in — what a token is, the two AWS-published estimation rules, two worked quota/limit examples
- 3. Transformers and self-attention: how a model reads a sequence — query/key/value, the transformer block, why decoder stacks win
- 4. Embeddings, vectors and vector databases — from one-hot to embedding space, who computes similarity, verified embedding limits, byte costs
- 5. Prompt engineering: the first lever you should always pull — the vocabulary of shots, the technique table, chain-of-thought cost, the decision tree
- 6. Inference parameters: steering the next token — the full parameter table, the defaults you must know cold, three workloads three parameter sets
- 7. Context windows: the budget that silently fails — what fits, the FIFO ring buffer, a context-window budget, the end-to-end generation flow
- 8. Foundation models by modality — and how images are made — the modality table, diffusion, token math for vision, 2025–2026 updates
- 9. The customization spectrum: prompt first, custom model last — the ladder AWS publishes, the Task 3.3 vocabulary, RFT and distillation numbers
- 10. Evaluating generative AI — three evaluation families, the judge rules that appear verbatim as answers, classic text metrics, RAG metrics
- 11. Guardrails, hallucination mitigation and responsible AI — the six policies, Automated Reasoning limits, the mitigation ladder, the responsible-AI dimensions
- 12. Comparative verdict
- 13. Exam traps for this lesson
- 14. Real-World Case Studies
- Practice Questions

**Exam alignment:** Domain 2 (24 %) and Domain 3 (28 %) — **52 % of the scored content** — which the lesson states in its opening line as the reason it is the highest-leverage lesson in the course.

**Real-World Application:** Six generative-AI deployments with services and numbers, plus the three cases the exam is most likely to borrow from and a before/after block of the numbers worth carrying into the exam.

**Practice Questions:** 13 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 10 "Did you know?" · 6 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 09: Amazon Bedrock Foundations: APIs, Model Access, Pricing, Inference Types and Evaluations

**Duration:** 110 minutes (957 lines)

**Hook:** "Amazon Bedrock is the service the AIF-C01 exam names more than any other, and it is also the service that changes fastest. That combination is dangerous: memorising a model list or a per-token price is a study strategy with a shelf life of weeks, while memorising **mechanisms**… stays correct for years."

**Learning Objectives:**
- State what Bedrock is in AWS's own three words — fully managed, serverless, single API — and say what it is not
- Unblock a call: model access defaults, Marketplace permissions, the Anthropic FTU form, payment method
- Work the API surface: `Invoke`/`Converse`, the four Converse inference parameters, streaming, tool use, structured output
- Price a workload across the four mechanisms and four service tiers, including batch's exact 50 % and provisioned throughput's burn-whether-you-use-it rule
- Apply cross-Region inference profiles — geographic vs global — with their price and residency effects
- Choose a model with the published decision tree, then pick the right evaluation mode

**Content Outline:**
- 1. What Amazon Bedrock is — the definition AWS uses, the provider catalog, the two endpoints, one API/many models, the data promises, four things Bedrock is not
- 2. Model access: what actually unblocks an invocation
- 3. The API surface: Invoke, Converse and the compatibility endpoints — operation families, the four Converse parameters, streaming, tool use, structured output, request anatomy
- 4. Pricing: four mechanisms and four service tiers — on-demand/batch/provisioned arithmetic, service-tier arithmetic, verified token prices, routing and caching levers
- 5. Cross-Region inference: profiles, price and residency — geographic vs global, CloudTrail visibility, two limits candidates miss
- 6. Choosing a model: the decision tree AWS actually teaches — the tree, the verified provider × model matrix, a 5× embedding-cost example, 2025–2026 updates
- 7. Customization: four paths and the provisioned-throughput rule, including Amazon Nova prompt caching
- 8. Evaluations: three modes, one dataset location, and which evaluation uses which metric
- 9. Comparative verdict
- 10. Exam traps for this lesson
- Real-World Case Studies
- Practice Questions

**Exam alignment:** the most-named service on the exam, taught through mechanisms (on-demand, batch, provisioned throughput, service tiers, cross-Region profiles) rather than the model list — the split the lesson argues for in its hook.

**Real-World Application:** A `cases at a glance: services, numbers, sources` table plus a before/after table — the section that grounds pricing theory in what customers actually paid.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 7 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 10: RAG and Knowledge Bases on Amazon Bedrock: Chunking, Embeddings, Retrieval and Evaluation

**Duration:** 115 minutes (931 lines)

**Hook:** "Retrieval-augmented generation is the highest-frequency topic in Domain 3… the exam asks what happens **when the default chunk size is wrong, when top-k is too large, when a filter operator is unsupported, or when a metric drops below threshold**."

**Learning Objectives:**
- Define RAG in AWS's words and eliminate the three distractors that definition kills
- Trace the ingestion pipeline (fetch → parse → chunk → embed → store) and the runtime pipeline (embed → search → augment → generate)
- Choose between a managed and a customer-managed knowledge base, including connectors and reranking defaults
- Configure the four chunking strategies and their parameter ranges
- Select an embedding model by dimension, token limit and cost, then a vector store from the eight options
- Evaluate a RAG application with the metric families and diagnose which stage failed

**Content Outline:**
- 1. What RAG is, and what the exam guide really asks — the AWS definition, the three questions the guide maps to this lesson, what RAG is weak at
- 2. The RAG pipeline: ingestion and runtime — fetch/parse/chunk/embed/store, embed/search/augment/generate, what breaks at each stage
- 3. Two kinds of knowledge base: managed and customer-managed — the seven managed connectors, quotas worth memorising
- 4. Chunking: the four strategies and their parameters — the default, strategy comparison, hierarchical, semantic
- 5. Embedding models: dimensions, limits and cost — accepted models and the dimension trade-off
- 6. Vector stores: eight options, four console quick-creates
- 7. Metadata: sidecar files and retrieval filters — the sidecar pattern and the operator set
- 8. Retrieval: four APIs, top-k and the token budget — which API to call, the prompt template contract, search mode
- 9. Evaluating a RAG application — the job shape, the metric families, the diagnosis rule
- 10. Choosing a RAG option on AWS — and the Kendra transition — AWS's documented order, Kendra vs Bedrock KB, 2025–2026 updates
- 11. Comparative verdict: RAG vs fine-tuning vs prompt-only, and Bedrock KB vs Kendra
- 12. Exam traps, limits and what not to memorise
- Real-World Case Studies
- Practice Questions

**Exam alignment:** Domain 3 (28 %), where the exam guide names RAG three times — *"Define RAG and its business applications"*, *"services that store embeddings (OpenSearch, Aurora, Neptune, RDS for PostgreSQL)"* and *"RAG grounding"*.

**Real-World Application:** Nippon India, Adobe, Alnylam, Bynder and Sun Finance — five cases that each isolate one retrieval variable (engineering, chunking, citations, embeddings, store choice).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 0 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 8 "Did you know?" · 8 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 11: Amazon Bedrock Agents, Flows and Orchestration

**Duration:** 110 minutes (935 lines)

**Hook:** "Everything in this course so far has been about **one model call**… Production AI is rarely one call. It is a *sequence* — look something up, check a condition, call an API, ask the user a follow-up question, try again — and the exam has a dedicated vocabulary for who owns that sequence."

**Learning Objectives:**
- Separate Agents Classic (maintenance, closed to new customers from 30 July 2026) from AgentCore and from Flows
- Build an agent: instruction, role, action groups, the build-time minimum
- Walk the runtime loop — pre-processing, orchestration, post-processing — and read a trace object by object
- Configure action groups, OpenAPI vs function schemas, and return of control
- Manage `InvokeAgent` session state, five scopes and memory across sessions
- Choose between your code, an agent, Flows or Step Functions using the decision tree and matrix

**Content Outline:**
- 1. Three names, three services: Agents Classic, AgentCore and Flows — the renames that decide the exam, what the guide officially asks about agents
- 2. Anatomy of an agent — the build-time minimum, a worked build-time example
- 3. Runtime: the orchestration loop — the three phases, the four editable base templates, the seven trace objects, a trace-by-trace booking example
- 4. Action groups, return of control and raw tool use — two schema styles, the official weather scenario, slot filling, raw tool use without an agent
- 5. InvokeAgent, session state and memory — the request contract, five session-state scopes, memory across sessions, session-management quotas
- 6. Multi-agent collaboration — one supervisor, at most ten collaborators, two modes, a triage example
- 7. Amazon Bedrock Flows (formerly Prompt Flows) — what a Flow is, the 16 node types, a worked branch pipeline, what a Flow costs
- 8. Choosing: prompt, agent, Flows or Step Functions — the decision tree, the decision matrix, three requirements three answers
- 9. Comparative verdict, including human review today
- 10. Exam traps and the numbers worth memorizing, with 2025–2026 updates
- 11. Real-World Case Studies
- Practice Questions

**Exam alignment:** the agentic content sits in two places of the exam guide, and the lesson quotes the scope changes directly — AgentCore, Kiro, Strands Agents, Amazon Q, SageMaker JumpStart and AWS Transform added, Amazon MemoryDB removed, Amazon A2I no longer in scope.

**Real-World Application:** Four stories with a `services, numbers, sources` table and a per-case statement of what each proves against this lesson.

**Practice Questions:** 12 multiple-choice + 1 matching + 2 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 0 `fillblank` · 2 `dragdrop` · 5 `mermaid` · 6 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 12: Generative AI Safety, Guardrails and Responsible AI

**Duration:** 110 minutes (1,087 lines — the longest lesson in the course)

**Hook:** "Every other lesson in this course assumed the model behaves. This one does not. … The gap between *what the model can say* and *what your application is allowed to say* is where enterprises get hurt."

**Learning Objectives:**
- Place guardrails in the three-layer model between a prompt and a production answer
- Inventory the six safeguards plus Automated Reasoning checks and their exact limits
- Configure content-filter strengths (NONE/LOW/MEDIUM/HIGH) and the Classic vs Standard tier split
- Defend against the three prompt attacks and explain `guardContent` tagging
- Apply denied topics, word filters and sensitive-information actions per entity type
- Attach a guardrail at the five supported points and enforce it with IAM so it cannot be skipped

**Content Outline:**
- 1. Why guardrails: three layers between a prompt and a production answer — the problem guardrails solve, what a guardrail actually is
- 2. The toolbox: six safeguards plus Automated Reasoning checks — the complete map
- 3. Content filters: strengths, modalities and the two tiers — exact blocking behaviour, Classic vs Standard (24 June 2025), how Bedrock bills a guardrail call
- 4. Prompt attacks: jailbreaks, injection and leakage — the three attacks and why the system prompt must be excluded from `guardContent` tagging
- 5. Denied topics, word filters and sensitive information — natural-language definitions, exact-match word filters, per-entity actions, the three runtime options
- 6. Contextual grounding checks and Automated Reasoning checks — is the answer faithful to the source, does it violate the written rule
- 7. Where a guardrail attaches — and how you force it to — the five attach points and IAM enforcement
- 8. Defense in depth: the architecture, layer by layer, with an attack → defense matrix
- 9. Seven worked AWS examples: prompt → blocked → config
- 10. Responsible AI beyond guardrails: fairness, explainability and transparency — the eight dimensions, SageMaker Clarify, the transparency artifacts
- 11. Standards, certification and the shared-responsibility boundary — NIST, ISO, EU AI Act, the boundary sentence, 2025–2026 updates
- 12. Operations: versions, limits, logging and cost
- 13. Comparative verdict
- 14. Exam traps and the numbers worth memorizing
- 15. Real-World Case Studies
- Practice Questions

**Exam alignment:** the responsible-AI domain plus the enforcement half of the security domain — the lesson is explicit that the exam tests both how AWS closes the model/application gap and **where each AWS control stops**.

**Real-World Application:** Nippon India Mutual Fund (guardrails plus retrieval engineering), Sun Finance (the rejected LLM-only prototype), Epilot (evaluate first, keep a human in the loop, choose the Region) and Chronomics (the threshold decides who reviews the output).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 8 "Did you know?" · 7 `[!WARNING]` · 3 `[!IMPORTANT]`

---

### Lesson 13: MLOps and Scaling on AWS

**Duration:** 110 minutes (947 lines)

**Hook:** "A model that works in a notebook is not a system. The moment a second engineer must reproduce the training run, the moment traffic doubles at 09:00, and the moment the training data drifts six months later, you stop doing machine learning and start doing **operations**."

**Learning Objectives:**
- Read an organisation's MLOps maturity level (0/1/2) from a description and name the tooling that advances it
- Treat a SageMaker Pipeline as a JSON DAG: edges, properties, and the conditions that reject cycles
- Use the 16 step types, with Condition and Fail as the evaluation gate that decides promotion
- Apply parallelism (`MaxParallelExecutionSteps`) and opt-in ISO 8601 caching correctly
- Drive deployment from Model Registry `ModelApprovalStatus` through Projects and CI/CD
- Size endpoint auto scaling with target/step/scheduled policies and high-resolution metrics, including async scale-to-zero

**Content Outline:**
- 1. MLOps maturity: level 0, level 1, level 2 — the AWS three-level standard and where this sits on the exam
- 2. SageMaker Pipelines: the DAG contract — what a pipeline is, edges and rejected cycles, a worked MSE gate end to end
- 3. The 16 step types, and the two that decide outcomes — the complete step map, Condition and Fail as an evaluation gate
- 4. Parallelism and caching: the two knobs that change runtime cost — per-execution parallelism, opt-in ISO 8601 caching for successful runs only
- 5. Model Registry: versions and the approval that drives deployment — structure, `ModelApprovalStatus`, the four approval transitions
- 6. SageMaker Projects, Git and CI/CD — what a Project actually is, the CodeCommit change of 28 October 2024
- 7. Experiments and MLflow: where run tracking lives now
- 8. Endpoint auto scaling: target tracking, step scaling, scheduled actions — identifiers, metrics, capacity math, high-resolution concurrency math
- 9. Async inference: scaling from zero — why async is special, the scale-from-zero design, queue math and the wake-up
- 10. Choosing the inference option — the four options with hard limits, the decision, a 40 GB nightly example
- 11. EventBridge and the MLOps flywheel — what AWS sends, the flywheel, a monitor → retrain → deploy example, infrastructure as code, 2025–2026 updates
- 12. Comparative verdict: managed MLOps vs DIY scripts vs manual
- 13. Exam traps and the numbers worth memorizing
- 14. Real-World Case Studies
- Practice Questions

**Exam alignment:** Domain 1, Task 1.3 — the lesson states this in its hook and quotes the exam's own framing: 65 questions (50 scored + 15 unscored), no guessing penalty, weights 20 / 24 / 28 / 14 / 14 %.

**Real-World Application:** Forethought, HAYAT HOLDING, RareJob, Chronomics and Sun Finance — five cases read specifically as pipeline-and-bill decisions rather than model-quality stories.

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 7 `[!WARNING]` · 2 `[!IMPORTANT]`

---

### Lesson 14: Security, IAM and Compliance for AI Workloads

**Duration:** 110 minutes (970 lines)

**Hook:** "What makes security hard is not the vocabulary — it is that AWS phrases the *same* requirement in four different places, and the exam rewards you for knowing which place is authoritative. 'Is Bedrock HIPAA compliant?' has a different correct answer depending on whether you read a marketing page, the service's own documentation, or the AWS Services in Scope table."

**Learning Objectives:**
- Apply the shared-responsibility split layer by layer, and refuse the phrase "HIPAA certified"
- Write a least-privilege SageMaker execution role and a Bedrock customization service role that resists the confused deputy
- Explain how a request is evaluated — boundaries, SCPs and RCPs cap, none of them grant
- Choose between SSE-KMS and SSE-S3, and name the TLS number for data in transit
- Design a private layout with `VpcConfig`, gateway endpoints and the seven Bedrock PrivateLink services
- Read compliance evidence from the only authoritative chain: AWS Artifact, the Services in Scope table, HIPAA-eligible services and a BAA

**Content Outline:**
- 1. Shared responsibility, and what "AI security" adds — the sentence AWS publishes, the split layer by layer, why "HIPAA certified" does not exist
- 2. Identity: the roles behind every AI job — the role-type table, a least-privilege execution role, the `AmazonSageMakerFullAccess` S3 caveat, allow/deny one model family, a confused-deputy-resistant Bedrock service role, how evaluation caps but never grants, a permission-boundary example
- 3. Bedrock identity: managed policies, resource policies and cross-account — the seven managed policies and their dates, why guardrails need both, Allow on both sides, boundaries vs SCPs vs RCPs
- 4. Encryption: at rest and in transit — TLS 1.2, defaults and the two exceptions, SSE-KMS vs SSE-S3 in one sentence
- 5. Network isolation: VPCs, gateway endpoints and PrivateLink — the `VpcConfig` contract, the seven Bedrock PrivateLink services, four VPC patterns, a working private layout
- 6. Audit: CloudTrail, invocation logging, GuardDuty and Config — management vs data events, the invocation-logging switch that is off by default, GuardDuty AI Protection, Config packs, the October 2026 status dashboard
- 7. Compliance: HIPAA, AWS Artifact and what Bedrock actually publishes — the only authoritative chain and the numbers worth carrying
- 8. Data governance: retention, residency and content moderation — retention modes, a zero-retention SCP, geographic vs global inference, moderation limits
- 9. Comparative verdict
- 10. Exam traps and the numbers worth memorizing, including the list flagged as not verified
- Real-World Case Studies
- Regulation and AWS service changes (2025–2026 updates)
- Practice Questions

**Exam alignment:** the security, compliance and governance content of the exam — least privilege, encryption, network isolation, audit evidence and compliance scope — which the lesson frames around the fact that AWS phrases the same requirement in four different places.

**Real-World Application:** Case-study evidence mapped onto Domain 5, with an explicit `what the cases actually prove` section — plus a `flagged as not verified in this lesson` list so candidates know what not to memorise.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 1 `[!IMPORTANT]`

---

### Lesson 15: Cost Optimization and Governance for AI Workloads

**Duration:** 115 minutes (1,016 lines)

**Hook:** "Cost is where the AIF-C01 exam stops being abstract. Every other domain can be answered with a definition; this one asks you to **compute**, and then to pick the control that **prevents** the overspend rather than the one that merely reports it."

**Learning Objectives:**
- Identify the three meter families — SageMaker instance-hours, Bedrock tokens, prebuilt per-request units
- Apply the cost-lever decision framework and state what each lever cannot do
- Compare on-demand, Spot, Savings Plans and serverless for an endpoint with real arithmetic
- Price Bedrock levers: batch at 50 %, prompt caching at 0.1× read / 1.25× or 2× write, routing and service tiers
- Convert a prebuilt AI free tier into dollars and optimize a tiered per-unit meter
- Choose a preventive control — SCP, Service Catalog, AWS Config — instead of a reporting one

**Content Outline:**
- 1. The three meter families: what you are actually billed — SageMaker instance-hours plus storage, Bedrock input/output tokens, one unit per prebuilt request, and a two-idle-endpoint worked example
- 2. The cost-lever decision framework — the lever impact matrix, the decision flow, what each lever cannot do
- 3. SageMaker AI: on-demand vs Spot vs Savings Plans vs serverless — each pricing model, worked arithmetic, the endpoint pricing-model decision
- 4. Amazon Bedrock: tokens, Batch, caching, throughput and tiers — the token bill, Batch at 50 %, prompt caching, provisioned throughput, quota burndown, the Bedrock cost-lever map
- 5. Prebuilt AI services: units, tiers and the free tier — optimizing a per-unit meter, Textract tier math, Transcribe batch vs streaming, the free tier in dollars
- 6. Cost visibility: Cost Explorer, cost allocation tags and budgets — activation rules and the $0.10/day extra-action pricing
- 7. Governance: preventing the spend instead of reporting it — the preventive stack, the right control for each requirement, Service Catalog vs SageMaker Catalog, the governance layer diagram
- 8. Savings Plans, Spot and TCO: the numbers you may quote — published savings percentages verified 06 Oct 2026, the TCO figure, commitment safety rules
- 9. Governance and cost in one operating rhythm
- 10. What is verified, what is third-party, and what conflicts
- 11. 2025–2026 Updates
- Real-World Case Studies
- Practice Questions

**Exam alignment:** the only domain the lesson says you cannot answer with a definition — this one asks you to **compute**, then to pick the control that prevents the overspend rather than the one that reports it.

**Real-World Application:** The lesson's own worked examples are the application — two idle endpoints at 1,488 hours, token bills, TCO and Textract tier math — followed by the case-study section that shows where the levers were actually pulled.

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 0 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 9 `[!WARNING]` · 2 `[!IMPORTANT]`

---

### Lesson 16: Capstone Exam Simulation (AIF-C01)

**Duration:** 100 minutes (1,039 lines)

**Hook:** "Fifteen lessons gave you the content. This one gives you the **container**: how the AIF-C01 is actually built, how it is scored, how the clock behaves, and how AWS-style distractors are engineered."

**Learning Objectives:**
- Recite the published logistics and the four mechanics that decide the score
- Price each question format in seconds and attack the three formats Set A does not contain
- Run the 90-minute clock with a phase plan and a guess protocol
- Decode distractors with the three-questions-per-option test and the domain-by-domain trap map
- Convert Set A's raw result into a decision using the rubric, by domain rather than by total
- Allocate 40 study hours in proportion to the published domain weights and execute the six-week sequence

**Content Outline:**
- 1. Exam logistics: what AWS publishes — the facts each with its source, the four mechanics that decide your score, booking/delivery/retake/results
- 2. Question formats and what each one costs you — the official types, the arithmetic of the clock, attacking the three formats Set A does not contain
- 3. Exam-day strategy: the 90-minute clock — the phase plan, where the time goes, the guess protocol
- 4. Decoding the distractors — elimination that survives contact with the options, what "700" actually means, three questions for every option, the trap map domain by domain
- 5. Domain weighting and the simulation blueprint — the only weights AWS publishes, with the Set A and 40-hour allocations
- 6. The customization ladder, and the drills that decide Set A — the ladder, the two-hour fix vs the two-week fix, weight-driven hour allocation, stem keywords
- 6.5 Trap Patterns & How to Beat Them — twelve trap families and the reflex that beats each, the pacing plan keyed to item ranges, a four-item mini-drill, where each trap already lives in this course, a two-item 2025–2026 updates quiz
- 7. Practice Questions — Set A: 15 single-best-answer items, with how to sit them
- 8. Answer key and explanations, organized by domain, plus the rapid key for the rest of the 40-item bank (Sets B and C) and how to read the score by domain
- 9. Scoring rubric: turning a raw score into a decision
- 10. Study plan: 40 hours, driven by the published weights — hours per domain, the six-week sequence, the last 48 hours and the morning itself
- 11. Synthesis of lessons 01-15 — the whole course on one page, the five threads, a final integration drill
- 12. What this lesson does not assert

**Exam alignment:** all five domains at once — the blueprint, the key and the rubric are all organised by D1–D5 with their published weights (20 / 24 / 28 / 14 / 14 %).

**Real-World Application:** This lesson deliberately has **no** `Real-World Case Studies` section — its application is the simulation itself: a 15-minute timed Set A, a domain-graded answer key, a rapid key for the remaining 25 items of the 40-item bank, and the last-48-hours protocol.

**Practice Questions:** 21 multiple-choice (15 Set A + 4 trap mini-drill + 2 updates quiz) + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 21 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 6 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]`

---

## Interactive Components

### Inventory by Type

| Type | Fence | Count | Role in the course |
|------|-------|-------|--------------------|
| Multiple-choice items | `question` | **213** | The exam-shape drill: every lesson closes with a set; L16 adds the graded Set A, the trap mini-drill and the updates quiz |
| Matching | `matching` | **19** | Pair a service/limit/weight with its value — all 16 lessons carry at least one (13 lessons × 1), three carry two (L06, L10, L15) |
| Fill-in-the-blank | `fillblank` | **13** | Recall of exact numbers (ceilings, percentages, dimensions) |
| Drag-and-drop | `dragdrop` | **15** | Sequencing pipelines, ordering lifecycle stages, ranking strategies |
| **Interactive subtotal** | — | **47** | 19 + 13 + 15 |
| Mermaid diagrams | `mermaid` | **88** | Architecture and decision flowcharts embedded in the prose |
| ASCII reference cards | `text` | **33** | The `====…` at-a-glance card that opens most lessons |
| JSON payloads | `json` | **7** | Request/response shapes |
| Plot blocks | `plot` | **2** | Numeric visualisation |
| **All fenced blocks** | — | **390** | Openers and bare closers match 1:1 (390 / 390) — no labelled closing fences anywhere in the course |

### Non-Block Interactive Devices

| Device | Count | Notes |
|--------|-------|-------|
| "Did you know?" curiosities (`> **📚 Did you know?**`) | **121** | One per ~130 lines; each carries a fact the exam can turn into a distractor |
| `[!WARNING]` callouts | **88** | Trap markers: the wrong-but-plausible answer |
| `[!IMPORTANT]` callouts | **21** | Non-negotiable rules and comparative verdicts |
| `[!NOTE]` callouts | **25** | Clarifications and scope notes |
| `[!SUCCESS]` callouts | **16** | Confirmed, safe-to-memorise facts |
| `Key Takeaways` blocks | **16** | One per lesson |
| `Real-World Case Studies` sections | **15** | One per lesson except L16 |
| `2025–2026 Updates` sections | **15** | One per lesson except L04 |

### Distribution Across Lessons

| Lesson | `question` | `matching` | `fillblank` | `dragdrop` | `mermaid` | "Did you know?" |
|--------|-----------|-----------|------------|-----------|----------|----------------|
| L01 | 13 | 1 | 1 | 1 | 5 | 8 |
| L02 | 14 | 1 | 1 | 1 | 6 | 7 |
| L03 | 14 | 1 | 0 | 1 | 8 | 8 |
| L04 | 13 | 1 | 1 | 1 | 5 | 7 |
| L05 | 12 | 1 | 1 | 0 | 5 | 7 |
| L06 | 13 | 2 | 1 | 1 | 5 | 9 |
| L07 | 14 | 1 | 1 | 1 | 5 | 8 |
| L08 | 13 | 1 | 1 | 1 | 6 | 10 |
| L09 | 12 | 1 | 1 | 1 | 6 | 7 |
| L10 | 12 | 2 | 0 | 1 | 6 | 8 |
| L11 | 12 | 1 | 0 | 2 | 5 | 6 |
| L12 | 12 | 1 | 1 | 1 | 6 | 8 |
| L13 | 14 | 1 | 1 | 1 | 5 | 7 |
| L14 | 12 | 1 | 1 | 1 | 5 | 7 |
| L15 | 12 | 2 | 1 | 0 | 5 | 8 |
| L16 | 21 | 1 | 1 | 1 | 5 | 6 |
| **Total** | **213** | **19** | **13** | **15** | **88** | **121** |

Every column sums to the independently verified figure: 213 multiple-choice items, 47 interactive blocks, 88 diagrams, 121 curiosities.

---

## Assessment Rubric

### Practice-Question Strategy

Assessment is distributed, not terminal: each lesson is closed by its own `Practice Questions` section (`## Practice Questions` in all 16 files) so that retrieval happens at the point of learning, and the questions are written against that lesson's own tables rather than a generic pool.

| Layer | Where | Count | Design rule |
|-------|-------|-------|-------------|
| **Per-lesson practice set** | Closing `Practice Questions` of L01–L16 | **213 `question` blocks** | 12–21 items per lesson; each item is answerable from a table, worked example or callout inside the same lesson |
| **Interactive recall** | Body and practice sections | **47 blocks** (19 matching, 13 fillblank, 15 dragdrop) | Matching for service/limit/weight pairs, fillblank for exact numbers, dragdrop for sequencing |
| **Digest draft bank** | `.scratch/aws-aif/` section (F) | **160 draft items** (10 per digest, 40 in digest 16) | Source material for regeneration; 10 per topic digest, 40 for the capstone |
| **Graded simulation** | L16 Set A | **15 items** | Single-best-answer, domain-weighted, timed |
| **Ungraded reinforcement** | L16 rapid key (§ 8.6) | **25 items** (bank #4–#39) | Recall-hook form; the remaining part of the 40-item bank |
| **Trap drills** | L16 § 6.5.3 and § 6.5.5 | **4 + 2 = 6 items** | Four items that punish the usual reflexes; two items on 2025–2026 changes |
| **Total in the shipped EN course** | L01–L16 | **213 `question` blocks** | 15 Set A + 4 trap drill + 2 quiz + 192 across L01–L15 |

**Progression rule.** L01–L15 test *recognition of the mechanism* (which service, which limit, which metric); L16 tests *execution under the clock*. A candidate does not open Set A until the per-lesson sets are being answered without re-reading the lesson.

### Simulated-Exam Scoring (Lesson 16)

**Set A design.** Fifteen single-best-answer items — one correct response, three distractors — deliberately weighted like the published domains:

| Domain | Published weight | Derived scored items on the real exam | Set A items | Study hours (40 h plan) |
|--------|------------------|----------------------------------------|-------------|--------------------------|
| **D1** Fundamentals of AI and ML | **20 %** | ~10 | **3** (items 1–3) | 8.0 h |
| **D2** Fundamentals of Generative AI | **24 %** | ~12 | **4** (items 4–7) | 9.6 h |
| **D3** Applications of Foundation Models | **28 %** | ~14 | **4** (items 8–11) | 11.2 h |
| **D4** Guidelines for Responsible AI | **14 %** | ~7 | **2** (items 12–13) | 5.6 h |
| **D5** Security, Compliance, Governance | **14 %** | ~7 | **2** (items 14–15) | 5.6 h |
| **Total** | **100 %** | **50** | **15** | **40 h** |

The "scored items" column is arithmetic on the published weights, not an AWS figure; AWS publishes only the five percentages.

**Sitting conditions.** 15 minutes flat (60 s per item), no notes, no search, answer every item, flag anything over 90 seconds, second pass only after the timer stops, grade by **domain first and total second**, and re-sit **72 hours** later from memory.

**Scoring bands (raw → decision).**

| Set A result | Raw signal | What it predicts | What to do next |
|--------------|-----------|------------------|-----------------|
| **15 / 15** | Perfect run, no blanks | Strong margin on every domain | Move to timing: re-sit inside 12 minutes |
| **13–14 / 15** | Exam-ready band | Likely comfortably above a 700-equivalent | Repair only the missed domain, re-sit after 72 hours |
| **11–12 / 15** | Borderline band | A weak domain is hiding inside the total | Break the score down by domain; reopen the lowest two |
| **9–10 / 15** | Content gap | Recall incomplete under time pressure | Return to the mapped lessons before re-timing |
| **≤ 8 / 15** | Foundation gap | Ladder, metrics or IAM basics not yet automatic | Restart at lessons 01, 04 and 14 — do not re-sit yet |
| **Any result with blanks** | Automatic fail signal | A blank is a guaranteed zero on the live exam | Fix the process first: flag, guess, move |

**Rubric rules carried from the exam itself.**
- **Scale:** 100–1,000 with **700 to pass**; the raw→scaled mapping is not published, so never reason "X of 50 = pass".
- **Structure:** 50 scored + 15 hidden pretest items, never identified — treat **every** item as scored.
- **Compensatory:** no per-domain pass; a weak Domain 4 sinks an otherwise strong report.
- **Guessing:** no penalty; a blank is strictly worse than a guess. Eliminate to two, then pick.
- **Grading:** count each miss as a *knowledge gap* (goes to the study plan) or a *reading error* (goes to the distractor table); compute domain accuracy rather than trusting the total.
- **Target margin:** plan for **≥ 80 %** on mixed practice so that form difficulty cannot move you below the 700-equivalent.

---

## External Resources

The course cites only real, retrievable URLs. The **239 unique URLs** (277 occurrences) all live in the digests' section **(H) SOURCES**; the 16 lessons contain **zero `https://` strings** — they cite the same first-party paths scheme-less with a verification date, e.g. `aws.amazon.com/bedrock/pricing, 06 Oct 2026` (7 occurrences, all in L15). Every cell below was re-derived with `grep -F` on 07 October 2026: **Digests** = files in `.scratch/aws-aif/` holding the full URL, **Lessons** = files in `content/courses/aws-aif-c01/en/` holding the same path.

### Official Exam and Certification

| Resource | Digests | Lessons |
|----------|---------|---------|
| `https://d1.awsstatic.com/training-and-certification/docs-ai-practitioner/AWS-Certified-AI-Practitioner_Exam-Guide.pdf` — the exam guide PDF: logistics, domains, task statements | 07, 11 | — |
| `https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html` — exam-guide HTML in the AWS docs tree | 07, 08, 10, 11, 13, 14, 17, 18 | 15 (`…/latest/ai-practitioner-01/`, 2×) |
| `https://docs.aws.amazon.com/pdfs/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.pdf` — same guide, PDF endpoint | 08, 10, 18 | — |
| `https://aws.amazon.com/certification/` — certification home: booking, policies, retakes | 18 | 15 (1×) |

### Service Documentation (Bedrock and SageMaker)

| Resource | Digests | Lessons |
|----------|---------|---------|
| `https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html` — Guardrails overview, the six safeguards and limits | 08 (2×), 12 | — |
| `https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html` — Converse/Invoke parameters and their defaults | 08 (2×) | — |
| `https://docs.aws.amazon.com/sagemaker/latest/dg/pipelines.html` — Pipelines DAG contract and step types | 13 | — |
| `https://docs.aws.amazon.com/sagemaker/latest/dg/serverless-endpoints.html` — Serverless Inference limits | 13, 15 | 15 (1×) |
| `https://docs.aws.amazon.com/kendra/latest/dg/kendra-availability-change.html` — Kendra maintenance and the Bedrock knowledge-base transition | 10, 18 | 15 (1×) |
| `https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/cost-allocation-tags.html` — cost-allocation tag activation | 15 | — |

### Pricing, Product and News

| Resource | Digests | Lessons |
|----------|---------|---------|
| `https://aws.amazon.com/bedrock/pricing/` — token prices, batch, caching, provisioned and service tiers | 09, 11 (3×), 12 (2×), 15 (4×), 18 | 15 (7×) |
| `https://aws.amazon.com/sagemaker/ai/pricing` — instance-hour rates, verified 06 Oct 2026 | 15 (5×) | 15 (3×) |
| `https://aws.amazon.com/bedrock/guardrails/` — Guardrails pricing and text units | 08, 12, 18 | — |
| `https://aws.amazon.com/about-aws/whats-new/2026/06/aws-service-availability/` — the Service Availability Update that moved Agents Classic to maintenance | 11, 18 | — |
| `https://aws.amazon.com/ai/responsible-ai/` — the AWS responsible-AI programme and principles | 08 (3×), 12 | — |

### Machine Learning Blog and Case Studies

| Resource | Digests | Lessons |
|----------|---------|---------|
| `https://aws.amazon.com/blogs/machine-learning/llm-as-a-judge-on-amazon-bedrock-model-evaluation` — judge-based evaluation | 08, 09 | — |
| `https://aws.amazon.com/blogs/machine-learning/the-generative-ai-customization-spectrum-from-prompt-engineering-to-custom-models-on-aws/` — the customization ladder | 08 | — |
| `aws.amazon.com/solutions/case-studies/anthem` — Textract first, humans for the tail | 17 (2×) | 01, 02, 03, 07 — 5× |
| `aws.amazon.com/solutions/case-studies/forethought-technologies-case-study` — multi-model endpoints and Serverless savings | 17 (2×) | 01, 02, 05, 06 (2×), 13, 15 (2×) — 8× |
| `aws.amazon.com/solutions/case-studies/bynder-bedrock-case-study` — Titan Multimodal Embeddings | 17 (2×) | 01, 03, 08, 09 (2×), 10 — 6× |
| `aws.amazon.com/solutions/case-studies/epilot-genai-case-study` — Bedrock Evaluations and human-in-the-loop | 17 (2×) | 01, 06 (2×), 08, 09 (2×), 11, 12, 14 — 9× |
| `aws.amazon.com/solutions/case-studies/alnylam-case-study` — citations as the compliance feature | 17 (2×) | 07 (2×), 08, 09 (2×), 10, 11, 14 — 8× |

### Standards, Third-Party and Community (used only as cross-checks)

| Resource | Digests | Lessons |
|----------|---------|---------|
| `https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/mlops-maturity-model` — cross-vendor MLOps maturity comparison | 13 | — |
| `https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai` — EU AI Act official text for the risk tiers | 18 | — |
| `https://github.com/aws-solutions-library-samples/accelerated-intelligent-document-processing-on-aws` — the AWS reference architecture behind the IDP pattern | 07 | — |

**Citation discipline.** Non-AWS sources appear only where AWS's own documentation is silent or where a framework is external by nature (EU AI Act, ISO/NIST crosswalks, the Azure MLOps maturity model). Prices and limits are always taken from an `aws.amazon.com` or `docs.aws.amazon.com` page and dated — the digests record **06 Oct 2026** as the verification date for the cost figures — and anything AWS does not confirm is isolated in section (G) of the digest and in each lesson's `Conflicting, unverified and non-examinable facts` section rather than taught as fact.

---

**Source of truth:** `content/courses/aws-aif-c01/course.json` + `content/courses/aws-aif-c01/en/*.md` + `.scratch/aws-aif/*.md`
**Statistics:** re-derived with `wc` and `grep` on 07 October 2026; all counts in this document match the files as shipped.
**Status:** English complete; PT/ES deferred.
