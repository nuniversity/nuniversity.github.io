# Course: AWS Certified Cloud Practitioner (CLF-C02) Complete Course

## Course Metadata

| Field | Value |
|-------|-------|
| **Slug** | `aws-clf-c02` |
| **Title** | AWS Certified Cloud Practitioner (CLF-C02) Complete Course |
| **Area** | Cloud & AI/ML |
| **Difficulty** | Beginner (root `course.json`: `beginner`; `en.difficulty`: `Beginner`; all 16 lesson frontmatters: `beginner`) |
| **Duration** | 8 weeks (`duration`: `8 weeks`, `en.duration`: `8 Weeks`) |
| **Icon** | `cloud-architecture` |
| **Author** | NUniversity |
| **Lessons** | 16 (`order` 1–16, sequential, kebab-case filenames) |
| **Prerequisites** | Not declared in `course.json` |
| **Languages** | EN only (`en` block only in `course.json`; a single `en/` locale directory). **PT and ES are deferred**: no `pt/` or `es/` directory exists and the course validator's entire output is the four missing-`pt`/`es` warnings quoted below |
| **Source directory** | `content/courses/aws-clf-c02/` (`course.json` + `en/`) |
| **Research digests** | `.scratch/aws-clf/` — 19 files (`01`–`19`) plus `SPEC.md` |
| **Document statistics verified** | 09 October 2026 (every number below re-derived with `wc` / `grep` / `python3` on the shipped files themselves) |

### Verified Course Statistics

| Metric | Value | Verification |
|--------|-------|--------------|
| Lesson files | **16** | `ls content/courses/aws-clf-c02/en/*.md \| wc -l` |
| Total lesson lines | **15,621** | `cat *.md \| wc -l` in `en/` |
| Total lesson bytes | **1,392,897** | `cat *.md \| wc -c` |
| Total lesson words | **212,731** | `cat *.md \| wc -w` |
| Shortest / longest lesson | **921** (L04) / **1,109** (L10) lines | `wc -l` per file |
| Average lesson length | **976** lines | 15,621 ÷ 16 |
| Lesson time budget | **1,080 minutes (18 hours)** | sum of frontmatter `duration:` (90 + 60×11 + 75×2 + 90×2) |
| Per-lesson duration range | **60 min (11 lessons) · 75 min (L08, L09) · 90 min (L01, L15, L16)** | frontmatter |
| Multiple-choice `question` blocks | **214** | `grep -c '^```question'` over all 16 files |
| Question JSON integrity | **214 / 214 parse, 214 unique `id`s, 0 duplicates, 0 null ids, 214 × 4 options, `correct` ∈ 0–3** | `json.loads` per block in `python3` |
| Question `type` field | **214 × `multiple-choice`** (the 2 `bar` values belong to the two `plot` fences) | `grep -oh '"type": *"[^"]*"'` |
| `matching` blocks | **29** | `grep -c '^```matching'` |
| `fillblank` blocks | **17** | `grep -c '^```fillblank'` |
| `dragdrop` blocks | **17** | `grep -c '^```dragdrop'` |
| Interactive blocks (matching + fillblank + dragdrop) | **63** | 29 + 17 + 17 |
| Mermaid diagrams | **87** | `grep -c '^```mermaid'` |
| `text` blocks | **101** | `grep -c '^```text'` (the ASCII "lesson cards") |
| `plot` blocks | **2** | `grep -c '^```plot'` |
| Fenced blocks opened | **467** | 214 question + 101 text + 87 mermaid + 29 matching + 17 fillblank + 17 dragdrop + 2 plot |
| Fenced blocks closed with a bare fence | **467** | 934 total lines starting ` ``` ` ÷ 2 — a 1:1 open/close match, no labelled closers |
| "Did you know?" curiosities | **125** | `grep -c 'Did you know'` |
| `[!WARNING]` callouts | **57** | `grep -c '\[!WARNING\]'` |
| `[!IMPORTANT]` callouts | **28** | `grep -c '\[!IMPORTANT\]'` |
| `[!NOTE]` callouts | **42** | `grep -c '\[!NOTE\]'` |
| `[!SUCCESS]` callouts | **16** | `grep -c '\[!SUCCESS\]'` (one per lesson — the Key Takeaways block) |
| Total admonition callouts | **143** | 57 + 28 + 42 + 16 |
| `Key Takeaways` sections | **16 / 16** | one per lesson, always inside a `> [!SUCCESS]` block |
| `Real-World Case Studies` H2 sections | **16 / 16** | `grep -c '^## Real-World Case'` |
| `Comparative Verdict` boxes | **16 / 16** | `grep -c 'Comparative Verdict'` |
| `2026 Updates (as of October 2026)` sections | **16 / 16 lessons** (18 occurrences — L09 and L16 carry two each) | `grep -c '2026 Updates'` |
| Locales shipped | **`en/` only** | `course.json` carries an `en` key only; no `pt/` or `es/` directory |
| Digest files | **19** (numbered 01–19) | `ls .scratch/aws-clf/*.md \| wc -l` → 20 including `SPEC.md` |
| Digest lines / bytes | **5,290 / 602,775** | `cat 0*.md 1*.md \| wc -l` / `wc -c` |
| Digest size per file | **29,736 – 29,996 bytes for the 17 single-topic digests**; `16` = 58,111 and `17` = 36,407 | `wc -c` per file |
| Digest draft exam questions | **40** | `grep -c '^\*\*Q[0-9]' 16-exam-question-bank.md` (10 per digest `01`–`15`/`18`/`19` are not numbered this way) |
| Distinct external URLs in digests | **154** (158 occurrences) | `grep -ohE 'https?://…' \| sort -u \| wc -l` |
| Full `https://` URLs inside lessons | **0** | lessons cite scheme-less first-party paths |
| Unfinished-work markers in lessons | **0** | a `grep -riE 'TODO\|TBD\|FIXME\|lorem ipsum'` returns nothing; the only `xxx` hits are the legitimate AWS placeholder notation `0.0.0.0/0 → igw-xxx` |

**Component distribution, per lesson.** Every lesson ships **12 multiple-choice `question` blocks** except L10 (**14**) and the two simulations (**22** each) — which is how the 214 total is built: 13 × 12 + 14 + 22 + 22. Every lesson also carries at least one `matching`, one `fillblank` and one `dragdrop`, so no lesson can be finished without producing a second, non-multiple-choice signal of understanding.

| Lesson | `matching` | `fillblank` | `dragdrop` | interactive | `question` | mermaid | `text` card | `plot` |
|--------|-----------:|------------:|-----------:|------------:|-----------:|--------:|------------:|-------:|
| L01 | 1 | 1 | 1 | **3** | 12 | 5 | 6 | 0 |
| L02 | 2 | 1 | 1 | **4** | 12 | 5 | 13 | 0 |
| L03 | 1 | 1 | 1 | **3** | 12 | 6 | 8 | 1 |
| L04 | 3 | 1 | 1 | **5** | 12 | 5 | 7 | 0 |
| L05 | 2 | 1 | 1 | **4** | 12 | 5 | 5 | 0 |
| L06 | 2 | 1 | 1 | **4** | 12 | 6 | 1 | 0 |
| L07 | 2 | 1 | 1 | **4** | 12 | 5 | 8 | 0 |
| L08 | 2 | 1 | 1 | **4** | 12 | 7 | 3 | 0 |
| L09 | 2 | 1 | 1 | **4** | 12 | 5 | 12 | 0 |
| L10 | 2 | 1 | 1 | **4** | **14** | 6 | 12 | 0 |
| L11 | 2 | 1 | 1 | **4** | 12 | 7 | 1 | 0 |
| L12 | 2 | 1 | 1 | **4** | 12 | 4 | 15 | 0 |
| L13 | 2 | 1 | 1 | **4** | 12 | 6 | 6 | 0 |
| L14 | 1 | 1 | 1 | **3** | 12 | 5 | 2 | 1 |
| L15 | 2 | 1 | 1 | **4** | **22** | 5 | 1 | 0 |
| L16 | 1 | **2** | **2** | **5** | **22** | 5 | 1 | 0 |
| **Total** | **29** | **17** | **17** | **63** | **214** | **87** | **101** | **2** |

Verification: one `python3` pass over `content/courses/aws-clf-c02/en/*.md` counting lines whose entire content is ` ```<type> ` (so bare closers are not double-counted), summed per column against the totals above.

### Per-Lesson Statistics

Counts re-derived per file with `wc -l` and `grep -c` on 09 October 2026.

| # | File | Lines | `question` | `matching` | `fillblank` | `dragdrop` | `mermaid` | "Did you know?" | Minutes |
|---|------|------:|-----------:|-----------:|------------:|-----------:|----------:|----------------:|--------:|
| 01 | `01-exam-guide-cloud-concepts.md` | 952 | 12 | 1 | 1 | 1 | 5 | 7 | 90 |
| 02 | `02-cloud-economics-migration.md` | 951 | 12 | 2 | 1 | 1 | 5 | 8 | 60 |
| 03 | `03-global-infrastructure.md` | 1,008 | 12 | 1 | 1 | 1 | 6 | 7 | 60 |
| 04 | `04-cloud-deployment-operations.md` | 921 | 12 | 3 | 1 | 1 | 5 | 7 | 60 |
| 05 | `05-shared-responsibility.md` | 952 | 12 | 2 | 1 | 1 | 5 | 6 | 60 |
| 06 | `06-security-iam.md` | 945 | 12 | 2 | 1 | 1 | 6 | 9 | 60 |
| 07 | `07-governance-compliance.md` | 935 | 12 | 2 | 1 | 1 | 5 | 8 | 60 |
| 08 | `08-networking-content-delivery.md` | 1,052 | 12 | 2 | 1 | 1 | 7 | 10 | 75 |
| 09 | `09-compute-storage.md` | 989 | 12 | 2 | 1 | 1 | 5 | 9 | 75 |
| 10 | `10-database-services.md` | 1,109 | 14 | 2 | 1 | 1 | 6 | 7 | 60 |
| 11 | `11-integration-analytics-serverless.md` | 933 | 12 | 2 | 1 | 1 | 7 | 8 | 60 |
| 12 | `12-monitoring-support.md` | 939 | 12 | 2 | 1 | 1 | 4 | 7 | 60 |
| 13 | `13-pricing-models.md` | 1,025 | 12 | 2 | 1 | 1 | 6 | 8 | 60 |
| 14 | `14-billing-organizations.md` | 943 | 12 | 1 | 1 | 1 | 5 | 8 | 60 |
| 15 | `15-exam-simulation-a.md` | 978 | 22 | 2 | 1 | 1 | 5 | 8 | 90 |
| 16 | `16-exam-simulation-b.md` | 989 | 22 | 1 | 2 | 2 | 5 | 8 | 90 |
| | **Total** | **15,621** | **214** | **29** | **17** | **17** | **87** | **125** | **1,080** |

Every lesson clears the SPEC bars (`≥800` lines, `≥8` questions, `≥1` interactive block, `≥4` mermaid diagrams, `≥3` "Did you know?", `≥1` WARNING/IMPORTANT box, one Comparative Verdict). Lessons 15 and 16 double the question count (22 each) because they are the timed simulations.

### Validation

| Check | Result |
|-------|--------|
| `.opencode/skills/course-writer/scripts/validate_lesson.py` (run per file with `OPENCODE_FILE_PATH`) | **16 / 16 lessons exit 0** |
| `.opencode/skills/course-writer/scripts/validate_course.py` (run with `OPENCODE_SKILL_DIR=content/courses/aws-clf-c02`) | **exit 1 — 4 warnings, all locale-related**: `Missing locale section: pt`, `Missing locale section: es`, `Locale directory 'es/' not found`, `Locale directory 'pt/' not found`. No structural, naming, ordering, frontmatter or difficulty error is reported. |
| `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |
| Question-block integrity | **214 / 214** blocks parse with `json.loads`; **214 distinct `id`s** (`clf-NN-qN`), **0 duplicates**, 0 null ids |
| JSON parse of `course.json` | clean — valid JSON, required `area`, `en.title`, `en.description` present, root `difficulty: "beginner"` and `en.difficulty: "Beginner"` both in the allowed sets |

> **Language status.** The course is **English-only today**. PT and ES are **deferred**: the directory contains a single locale folder (`en/`), `course.json` defines an `en` block only, and the course validator's entire output is the four missing-`pt`/`es` warnings quoted above. The `course-writer` and `i18n-translator` skills are the intended path for the later PT/ES pass; nothing in the shipped EN content blocks that translation.

---

## Course Description

> "Comprehensive preparation for the AWS Certified Cloud Practitioner (CLF-C02) exam covering cloud concepts and economics, security and compliance, AWS global infrastructure and core services, and billing, pricing, and support — with architecture diagrams, real AWS customer case studies, and exam-style practice questions including multiple-response drills."
> — `content/courses/aws-clf-c02/course.json`, `en.description`

Sixteen lessons take a candidate from the official exam guide to a second, graded simulation. Lessons 01–02 build Domain 1 — the exam guide read as a specification, then cloud economics, the Well-Architected Framework, the AWS Cloud Adoption Framework and the 6 Rs. Lessons 03–04 and 08–11 are the Domain 3 half: global infrastructure and resilience, deployment models and ways of operating, the VPC and the edge stack, compute and storage, databases, and application integration plus every remaining in-scope service. Lessons 05–07 are the Domain 2 half: the shared responsibility model, IAM and data protection, and governance/auditing/compliance. Lessons 12–14 close the content with monitoring, operations, support and the Well-Architected Tool, then pricing models, cost tools, AWS Organizations and billing. Lessons 15 and 16 are the two simulations — Set A and Set B, twenty items each in published weight order, with a grading rubric, a miss→lesson routing table, trap drills and an exam-day checklist.

Every lesson is written to the same contract: an opening hook that names the exam-relevant failure mode, a numbered `##` section map, an ASCII "lesson card" that compresses the whole lesson into one screen, mermaid diagrams, worked arithmetic with AWS-published numbers date-stamped *as of Oct 2026*, a `Real-World Case Studies` section with named customers, a `Comparative Verdict` box (on-premises × other clouds × DIY/managed), a `2026 Updates` box, admonition callouts where a trap exists, a `Key Takeaways` block, and a closing `Practice Questions` set of four-option multiple-choice items plus interactive matching, fill-in-the-blank and drag-and-drop exercises.

### Learning Outcomes

Upon completing this course, students will be able to:

1. Read the official CLF-C02 exam guide as a specification — target candidate, the verbatim out-of-scope job tasks, the four domains with their published weights (24 / 30 / 34 / 12), the 19 task statements, the two question formats and compensatory scoring — and convert the weights into a study-hour budget.
2. Separate a scaled score from a percentage, run the clock arithmetic (90 minutes ÷ 65 items ≈ 83 seconds), and defend a no-blanks, no-penalty guessing strategy for a 100–1,000 scale cut at 700.
3. Argue the business case: the six advantages of the AWS Cloud in AWS's own wording, the six Well-Architected pillars and six design principles, the six AWS CAF perspectives, the 6 Rs (and the 7 Rs-only Relocate), the Assess → Mobilize → Migrate & Modernize journey, and fixed vs variable cost, capex → opex, TCO/ROI, BYOL and rightsizing with worked arithmetic.
4. Choose where a workload runs and how it is operated: the four deployment models, IaaS/PaaS/SaaS and the responsibility shift each one triggers, Console vs CLI vs SDK vs API vs infrastructure as code, one-time vs repeatable, and Elastic Beanstalk vs Lightsail vs CloudFormation.
5. Design for failure using AWS's global infrastructure: Regions vs Availability Zones vs edge locations, the ≥3-AZ design rule and AZ IDs, the three edge planes (CloudFront / Route 53 / Global Accelerator), Local Zones, Wavelength, Outposts and Snow, the RTO/RPO vocabulary and the four disaster-recovery strategies ranked by cost against recovery speed.
6. Apply the shared responsibility model and the IAM machinery underneath it — where the line sits for EC2, RDS, Lambda and S3, the inherited / shared / customer-specific control taxonomy, explicit-deny-wins policy evaluation, roles vs users, IAM Identity Center vs Cognito, security groups vs network ACLs, WAF vs Shield vs Firewall Manager, and KMS envelope encryption at rest and in transit.
7. Run governance and audit: CloudTrail (event history vs trail, organization trails, log-file integrity), AWS Config, AWS Artifact, Trusted Advisor, deny-only SCPs, AWS Control Tower guardrails, tagging strategy, data residency vs sovereignty, and the CloudWatch vs CloudTrail vs Config triage that exam stems repeat.
8. Select core services on their published limits and billing units — the seven EC2 purchasing options with their discount ceilings, Auto Scaling, Lambda, containers, the S3 storage-class lineup, EBS, EFS/FSx/Storage Gateway, RDS Multi-AZ vs read replicas, DynamoDB capacity modes, Redshift OLAP vs OLTP, SQS/SNS/EventBridge/Step Functions/API Gateway, and the analytics stack — while eliminating the explicitly out-of-scope lookalikes.
9. Compute and govern cloud spend: the four general pricing principles, the purchase-option decision tree, the three Free Tier flavours and the 15 July 2025 restructure, per-service billing dimensions, the five cost tools, consolidated billing and cost allocation tags, and sit the exam with a tested flag-and-sweep, qualifier-reading and trap-pair discrimination strategy.

---

## Deep-Research Methodology

No lesson in this course was written from memory. Each one was produced from a **research digest** first: a single file of source-pinned facts, tables, worked numbers, draft questions and explicit non-assertions, from which the lesson was then written. The digests live in `.scratch/aws-clf/` (a git-ignored scratch directory — `research scratch (never commit)` in `.gitignore`) and each one follows the same eight-section skeleton defined in `.scratch/aws-clf/SPEC.md`:

| Section | Content |
|---------|---------|
| **A. Official / primary sources** | URLs + access date (2026-10), exact quotes for exam facts |
| **B. Core facts & concepts** | Precise, teachable statements |
| **C. Numbers, prices, limits** | Each with source + date ("as of Oct 2026") |
| **D. Real-world examples / case material** | Source-backed customer stories |
| **E. AWS services in scope** | Per the official CLF-C02 exam guide in-scope list |
| **F. Exam traps & common confusions** | The distractor patterns the lessons turn into callouts |
| **G. Could NOT verify** | Never stated as fact |
| **H. Suggested worked examples & diagram ideas** | The worked arithmetic and diagrams the lesson must ship |

Two disciplines run through the whole set: **no number without a source and a date**, and **unverified claims are isolated in section (G), never taught as fact**. That is why every lesson carries a `2026 Updates (as of October 2026)` box and a "what this lesson does not assert" list — lessons 15 and 16 each end with an explicit `What this lesson deliberately does not assert` / `What this lesson does not assert` section, and lesson 16's section 6.4 is nine items long.

### Digest Inventory (01–19)

| Digest | File | Lines | Bytes | Focus — and what it grounds |
|--------|------|------:|------:|-----------------------------|
| 01 | `01-exam-guide-clf-c02.md` | 413 | 29,998 | Official exam guide and logistics: codes, 65/50/15, 90 minutes, 100–1,000 scale at 700, 100 USD, validity, retake rules, languages — feeds L01's logistics tables and L15/L16's strategy blocks |
| 02 | `02-cloud-concepts-economics-migration.md` | 362 | 29,866 | Domain 1 (24%): six advantages, Well-Architected pillars, AWS CAF, the 6 Rs, migration journey resources, cloud economics — feeds L01 §8–9 and L02 |
| 03 | `03-global-infrastructure.md` | 219 | 29,951 | Regions, AZs, edge locations, AZ IDs, CloudFront/Route 53/Global Accelerator, Local Zones/Wavelength/Outposts/Snow, resilience vocabulary — feeds L03 |
| 04 | `04-deployment-operations.md` | 199 | 29,982 | Deployment models, service models, Console/CLI/SDK/API/IaC, one-time vs repeatable, connectivity doors, Amplify/AppSync/IoT Core, Beanstalk/Lightsail/CloudFormation — feeds L04 |
| 05 | `05-shared-responsibility.md` | 253 | 29,952 | Shared Responsibility Model (Task 2.1): boundary wording, control taxonomy, the EC2/RDS/Lambda/S3 shift, patch duties — feeds L05 |
| 06 | `06-security-iam.md` | 229 | 29,801 | Domain 2 access (Tasks 2.3/2.4): root, IAM objects and evaluation, Identity Center, Cognito, MFA, security groups vs NACLs, WAF/Shield/Firewall Manager, KMS — feeds L06 |
| 07 | `07-governance-compliance.md` | 200 | 29,740 | Task 2.2: CloudTrail, Config, Artifact, Trusted Advisor, Organizations/SCPs, Control Tower, compliance programs, tagging, sovereignty — feeds L07 |
| 08 | `08-networking-content-delivery.md` | 304 | 29,736 | Domain 3 networking: VPC components, SG/NACL, peering, endpoints/PrivateLink, VPN vs Direct Connect, Route 53, CloudFront, ELB, Global Accelerator — feeds L08 |
| 09 | `09-compute.md` | 255 | 29,840 | Compute: EC2 naming and families, the seven purchasing options, Auto Scaling, Lambda, ECS/EKS/Fargate/ECR, Beanstalk, Lightsail — feeds L09 §1–6 |
| 10 | `10-storage.md` | 293 | 29,994 | Storage: S3 classes, versioning, lifecycle, EBS volume types, instance store, EFS/FSx, Storage Gateway, Snow Family status, AWS Backup — feeds L09 §7–10 |
| 11 | `11-database.md` | 256 | 29,896 | Databases: RDS and Multi-AZ vs read replicas, Aurora, DynamoDB capacity modes, ElastiCache, Redshift, Neptune, DocumentDB, DMS/SCT — feeds L10 |
| 12 | `12-integration-analytics-serverless.md` | 263 | 29,936 | Application integration, analytics and the remaining in-scope surface (Tasks 3.7/3.8): SQS/SNS/EventBridge/Step Functions/API Gateway, Athena/Glue/Kinesis/OpenSearch/QuickSight/EMR — feeds L11 |
| 13 | `13-monitoring-ops-support.md` | 230 | 29,960 | Operations: CloudWatch, AWS Health, Systems Manager, Trusted Advisor, the 2026 support-plan ladder, Well-Architected Framework and Tool — feeds L12 |
| 14 | `14-pricing-models-freetier.md` | 249 | 29,925 | Pricing models and Free Tier (Tasks 4.1/4.2): pricing principles, purchase options, Free Tier restructure, per-service billing dimensions, cost tools — feeds L13 |
| 15 | `15-billing-organizations.md` | 251 | 29,781 | Billing, Organizations and support usage (Tasks 4.2/4.3): consolidated billing, SCPs, cost allocation tags, Budgets/Cost Explorer/CUR, Marketplace, invoices — feeds L14 |
| 16 | `16-exam-question-bank.md` | 474 | 58,111 | Exam question bank and question style: **40 draft single-best-answer items** with keys and per-option explanations, plus the official sample-question and question-walkthrough formats — feeds L15/L16 Set A and Set B |
| 17 | `17-cloud-case-studies.md` | 291 | 36,407 | Cross-cutting: **39 AWS-official customer case-study URLs** and founding stories, each with published numbers and an assigned CLF domain — the source of every `Real-World Case Studies` section in all 16 lessons |
| 18 | `18-aws-updates-2026.md` | 342 | 29,903 | Cross-cutting: AWS 2025–2026 changes that are examinable (scope-list rebuild 128→111 in-scope / 11→55 out-of-scope, Free Tier restructure, Database Savings Plans, service renames) — the source of the `2026 Updates` boxes |
| 19 | `19-exam-strategy.md` | 207 | 29,996 | Cross-cutting: verified exam-day logistics, scoring rules, question technique, trap patterns, pacing and the guess protocol — the source of L15's strategy sections and L16's exam-day checklist and 7-day plan |
| **Total** | **19 files** | **5,290** | **602,775** | **154 distinct external URLs (158 occurrences); 40 draft exam questions in digest 16** |

**Numbering, stated plainly.** The digest directory contains **19 files, numbered 01–19 with no gaps** — unlike the AIF-C01 set, which starts at 07. Digests **01–15** map onto lessons by topic (01→L01, 02→L01/L02, 03→L03, 04→L04, 05→L05, 06→L06, 07→L07, 08→L08, 09+10→L09, 11→L10, 12→L11, 13→L12, 14→L13, 15→L14). Digests **16–19** are cross-cutting: 16 is the question bank behind both simulations, 17 is why every lesson ends with named customer cases, 18 is why every lesson carries a `2026 Updates` box, and 19 is why lessons 15/16 can teach pacing, trap families and an exam-day checklist instead of generic advice.

**Source discipline.** Section A of every digest is a source table or numbered list with exact quotes and an `2026-10` access date; the 17 single-topic digests are each held to a 18–30 KB budget (16 and 17 legitimately exceed it because they are the question bank and the case-study library). Scheme-less first-party paths (`docs.aws.amazon.com/…`, `aws.amazon.com/…`) are the norm inside the digests, and lessons deliberately ship **zero** full `https://` URLs.

---

## Real-World Examples

Every case below is quoted with the numbers AWS published for it, and each is reused as evidence for different task statements rather than told once and dropped. Citation counts are word-boundary counts of the company name across the 16 lesson files (`grep -lw`).

### The Case Studies Mapped to the Four CLF Domains (from digest 17)

| # | Company | Industry / headline numbers (AWS-published) | CLF domain | Lessons citing it |
|---|---------|---------------------------------------------|------------|-------------------|
| 1 | **Capital One** | Banking — exited **8** data centers; **80 %** of ~**2,000** apps cloud-built; dev environment **3 months → minutes**; DR test time **−70 %**; resilience page: critical-severity events **−80–90 %**, recovery **hours → minutes**; one app **−90 %** cost on Lambda | **D1** migration/agility (also D3) | **12** |
| 2 | **Philip Morris International** | Regulated manufacturing — **400** applications migrated in **2 years** from Aug 2020, now "all in"; **+50 %** performance; 70 % of apps on automated pipelines | **D1** | **3** |
| 3 | **Netflix** | Entertainment — **billions of hours** monthly; thousands of servers + TB in minutes; Aurora migration **+75 %** performance / **−28 %** cost across **four** AWS Regions | **D1** origin story / **D3** managed databases | **3** |
| 4 | **Shutterfly / SBS** | E-commerce printing — VMware on-prem → VMC on AWS → native (Mar 2025, 6 months early); **2,000 → 1,200** VMs; **~25 %** opex cut via right-sizing and licence avoidance; **~400 TB** across **~800** systems | **D4** right-sizing/licensing (also D3) | **4** |
| 5 | **Bangkok Flight Services** | Aviation cargo — pure rehost with AWS Application Migration Service in **7 months**, no rollback; IT infrastructure management time **−50 %**; multi-AZ DR | **D1** rehost / **D3** multi-AZ | **5** |
| 6 | **athenahealth** | Healthcare software — centralized AWS Network Firewall across **hundreds of VPCs in 120 accounts** in a few days; inspection costs **−95 %**; designed by a team of **8** | **D2** | **7** |
| 7 | **Avalon Healthcare Solutions** | Healthcare lab insights — AWS Verified Access replaces VPN sprawl; perimeter setup **days → ~1 hour**; **700+** audit controls still met; 50 users by Feb 2024 | **D2** | **3** |
| 8 | **Smartsheet Gov** | Gov SaaS — FedRAMP ready in **< 90 days** vs typical **12–18 months** on AWS GovCloud (US) (29 Aug 2019) | **D2** | **3** |
| 9 | **Socure** | Identity/fraud — **46+** FedRAMP-required controls inherited from AWS GovCloud (US) (14 Nov 2024) | **D2** inheritance | **3** |
| 10 | **Amazon Prime Video** | Sports streaming — NFL Thursday Night Football: **11** games, **18.4 M** fans, **224** countries, **six** AWS Regions; DynamoDB partitions doubled from the console at ad breaks | **D3** | **4** |
| 11 | **NASA JPL / Perseverance** | Government/space — **4.4 TB/day** downlinked → up to **70 TB/day** of products; Auto Scaling with Spot (up to **90 %** off), On-Demand and Capacity Reservations | **D3** elasticity / **D4** Spot | **5** |
| 12 | **Gourmeat** | Meat boutique — Amazon Lightsail; reporting **~4 h/week → < 20 min**; productivity **+40 %**; test + prod in **6 weeks** (Oct 2020) | **D3** Lightsail / **D4** predictable pricing | **1** |
| 13 | **NFL** | Sports league — fan-facing analytics product, **1 M+** fans, updates every **3 min**, **500 M+** data points/season, built in **6 weeks** | **D3** analytics | **4** |
| 14 | **Paytm** | Fintech — Graviton economics: compute **−35 %**, **60 %** of EC2 on Graviton, EMR **30–35 %** | **D3** analytics / **D4** price-performance | **2** |
| 15 | **Box** | Enterprise SaaS — Well-Architected review found **$2.23 M**: inter-AZ **$438 K** + egress **$1.1 M/yr** + storage **>$500 K/yr** + logging **$192 K/yr** | **D4** | **9** |
| 16 | **Canva** | SaaS design — purchase-model mix (Spot for free-tier projects, Savings Plans for Pro, RI fallback): compute **−46 % in < 2 years** | **D4** | **4** |
| 17 | **FarEye** | SaaS logistics — Compute Savings Plans + Spot + Graviton: compute **−65 %**, **$1 M/year** saved, Graviton **+30 %** performance | **D4** | **4** |
| 18 | **Zendesk** | SaaS — Aurora on Graviton + right-sizing across **1,200+** clusters: **+30 %** performance, **−42 %** cost (May 2023) | **D4** price-performance | **4** |
| 19 | **SmartNews** | Media — main workload **−50 %** on Spot; ML latency **190 → 60 ms** | **D4** Spot (supplementary, L13) | **1** |
| 20 | **Coinbase** | Fintech — **−62 %** cost since 2022, **+50 %** faster scaling | **D4** (supplementary, L13) | **1** |
| 21 | **WOMBO** | AI startup — Amazon ECS/Fargate managing **12,000 GPUs**; **74 M** downloads in **10 months** across **180+** countries | **D3** containers (supplementary, L09) | **1** |

**Domain coverage in one line each.**

| Domain | Weight | Case evidence the course leans on |
|--------|--------|-----------------------------------|
| **D1 Cloud Concepts** | **24 %** | Capital One (all-in, 3-month→minutes), Philip Morris (400 apps/2 years), Netflix (elasticity origin), Bangkok Flight Services (rehost), Box/Canva/FarEye (economics in L01–L02) |
| **D2 Security and Compliance** | **30 %** | athenahealth (centralized firewall, 120 accounts), Avalon (identity-based access, 700+ controls), Smartsheet Gov (FedRAMP <90 days), Socure (46+ inherited controls) |
| **D3 Cloud Technology and Services** | **34 %** | Prime Video (six Regions, DynamoDB peak), NASA JPL (Spot + Auto Scaling), Netflix/Aurora, Gourmeat (Lightsail), NFL (analytics), Paytm (Graviton/EMR), Capital One (Lambda, Step Functions, Route 53 failover) |
| **D4 Billing, Pricing, and Support** | **12 %** | Box ($2.23 M architecture levers), Canva (purchase-model mix), FarEye (SP+Spot+Graviton), Zendesk (Graviton), Shutterfly (right-sizing/licence), NASA JPL (Spot ceiling) |

### Four Cases Worth Telling in Full

**Example 1: Box — $2.23 million that came from architecture, not a discount code.** AWS's headline is the *sum* of four separately published lines: **$438,000** from inter-AZ traffic, **over $1.1 M/yr** from internet egress, **over $500 K/yr** from storage tiering, and **$192 K/yr** from logging — **$438 K + $1.1 M + $500 K + $192 K = $2.23 M**. None of the four is a negotiated rate cut: they are billing dimensions (how much data crosses an AZ, how much leaves, which storage class, how long logs are retained). The lesson reads this as Domain 4's core teaching — *know which dimension you are being billed on before you look for a commitment discount* — and it recurs as a cost item, an operations item (log retention is a CloudWatch Logs group setting) and a strategy-drill item in lessons 15 and 16.

**Example 2: Capital One — "all in on AWS" as a Domain 1 argument.** Eight on-premises data centers exited, **80 %** of roughly **2,000** applications built cloud-native, **103 tonnes** of copper and steel recycled, a development environment that used to take **3 months** now taking **minutes**, DR test time down **70 %**, and on the resilience page critical-severity events down **80–90 %** with recovery moving from hours to minutes. Capital One is cited in **12 of the 16 lessons** because the same story teaches four different things: fixed → variable expense (L01), the value proposition behind the 6 Rs (L02), automated Regional failover (L03), repeatable IaC operations (L04), Route 53 failover (L08), serverless at bank scale (L11), operational excellence (L12), and the domain-drill stems in L15/L16.

**Example 3: athenahealth — governance and security with a team of eight.** A centralized deployment model with AWS Network Firewall, AWS RAM policy fan-out and CloudFormation rules-as-code pushed a consistent security design across **hundreds of VPCs in 120 accounts** in a few days, cut inspection costs by **95 %**, and was designed and rolled out by **eight people** with no disruptions. This is the course's standing evidence for Domain 2: shared responsibility in practice (AWS supplies the firewall hardware and the managed service, the customer writes the rules), Infrastructure as Code as a governance control (L04, L06, L07), Transit Gateway as the network answer (L08), centralized visibility (L12) and consolidated billing across accounts (L14).

**Example 4: Amazon Prime Video — six Regions for one live broadcast.** Thursday Night Football streamed **11** NFL games to **18.4 million** fans in **224** countries and territories through **six AWS Regions** and AWS Elemental, with DynamoDB partitions doubled from the console during ad breaks and **300,000+** clients polling per ad break. The case is the course's concrete answer whenever an exam stem needs *global infrastructure* (L03), an edge CDN plus load balancing choice (L08), a managed NoSQL store under a live peak (L10), or an integration topology at scale (L11) — and the pull quote ("every lost second negatively impacts viewers") is the reason latency, not cost, drives the architecture.

---

## Story

> **Hook:** "Every CLF-C02 security question eventually collapses into one sentence: *who fixes this?* The exam calls it **Domain 2, Task 2.1 — "Recognizing the components of the AWS shared responsibility model"**, and Domain 2 is worth **30% of your score (as of Oct 2026)**, so this single model is statistically the most profitable concept on the whole test."
> — lesson 05, opening paragraph

> **Story:** AWS positioned CLF-C02 as the *foundational* certification, and lesson 01 reads the guide's candidate profile straight: the audience is **non-IT entrants — sales, product and project-management people — who need cloud literacy**, not cloud engineering, and the guide publishes a verbatim list of job tasks the target candidate is **not** expected to perform (**Coding, Designing cloud architecture, Troubleshooting, Implementation, Load and performance testing**). You are tested on judgment, vocabulary, service selection and cost awareness. The exam is **65 questions in 90 minutes** (**50 scored + 15 unscored**, the unscored items never identified), two question types only (multiple choice: one correct of four; multiple response: two or more correct of five or more), scored on a **100–1,000** scale with a **700** cut, **compensatory** across the four domains, with **no penalty for guessing** and a blank counted as wrong, costing **100 USD** per attempt, valid for **3 years**, delivered by Pearson VUE at a test centre or online proctored, with results posted within **5 business days** (all figures as of October 2026).

> **Connection:** CLF-C02 replaced CLF-C01 on **19 September 2023** (CLF-C01 ran until 18 September 2023), and the four published domain weights have not moved since: **D1 Cloud Concepts 24 % · D2 Security and Compliance 30 % · D3 Cloud Technology and Services 34 % · D4 Billing, Pricing, and Support 12 %**. Those weights are the whole design of this course. Domain 3 alone is a third of the paper, so it gets seven lessons (03, 04, 08, 09, 10, 11 plus L12's support/operations half); Domain 2 is 30 % and gets three full lessons (05, 06, 07); Domain 1 is 24 % and gets two (01, 02); Domain 4 is 12 % and gets two (13, 14). The 8-week duration in `course.json` maps cleanly onto that shape: lessons 01–14 are content (two per week across weeks 1–7), and week 8 carries lessons 15 and 16 — the two timed simulations — because on a compensatory scale with 700 to pass, test craft is worth as much as another hour of revision.

**Exam alignment, domain by domain.**

| Domain | Weight | Where the course teaches it |
|--------|--------|-----------------------------|
| **D1** Cloud Concepts | **24 %** | L01 (exam guide, cloud basics, six advantages, Well-Architected, cloud economics), L02 (value proposition, CAF, 6 Rs, migration journey, TCO/ROI/BYOL/rightsizing) |
| **D2** Security and Compliance | **30 %** | L05 (shared responsibility), L06 (root, IAM, Identity Center, Cognito, MFA, SG/NACL, WAF/Shield, KMS), L07 (CloudTrail, Config, Artifact, Trusted Advisor, SCPs, Control Tower, sovereignty), L12 §1 (CloudWatch for task 2.2) |
| **D3** Cloud Technology and Services | **34 %** | L03 (global infrastructure), L04 (deployment and operating methods), L08 (networking and content delivery), L09 (compute and storage), L10 (databases), L11 (integration, analytics, remaining in-scope services), L12 §6 (AWS Support as a customer-enablement service) |
| **D4** Billing, Pricing, and Support | **12 %** | L13 (pricing models, Free Tier, billing dimensions, cost tools), L14 (billing console, Organizations, consolidated billing, tags, Budgets/Cost Explorer/CUR, Marketplace), L12 §2/§4/§5 (Health Dashboard, Trusted Advisor, support plans), L09 §2 (the seven purchasing options) |

L12 deliberately spans all four domains — its own exam-task table maps §7 (Well-Architected pillars) to task 1.2/D1, §1 to task 2.2/D2, §6 to task 3.8/D3 and §2/§4/§5 to task 4.3/D4 — which is why it sits between the Domain 3 block and the Domain 4 block.

**The 19 task statements the paper is built from.** The exam guide does not publish topics; it publishes task statements, each a "Knowledge of" plus a "Skills in" pair. L01 §4 maps all 19, and every other lesson's section map names the task it serves:

| Task | One-line focus (as the course teaches it) |
|------|-------------------------------------------|
| 1.1 | Benefits of the AWS Cloud — global infrastructure, speed of deployment, high availability, elasticity, agility |
| 1.2 | Design principles — the Well-Architected pillars and the differences between them |
| 1.3 | Migration benefits and strategies — AWS CAF, the 6 Rs, resources that support the journey |
| 1.4 | Cloud economics — fixed vs variable, on-premises cost drivers, BYOL vs included, rightsizing, automation |
| 2.1 | Shared responsibility — AWS, customer and shared controls, and how the line **shifts by service** (EC2, RDS, Lambda) |
| 2.2 | Security, governance and compliance concepts — Artifact, encryption, CloudTrail, Config, CloudWatch |
| 2.3 | Access management — IAM, root-user protection, least privilege, MFA, IAM Identity Center, federation |
| 2.4 | Components and resources for security — WAF, Shield, GuardDuty, Inspector, Marketplace third parties, Trusted Advisor |
| 3.1 | Deploying and operating — programmatic access (APIs, SDKs, CLI) vs console vs IaC; cloud, hybrid, on-premises |
| 3.2 | Global infrastructure — Regions, Availability Zones, edge locations; multi-AZ high availability |
| 3.3 | Compute services — EC2 instance types, ECS/EKS, Fargate/Lambda, auto scaling, load balancers |
| 3.4 | Database services — RDS, Aurora, DynamoDB, ElastiCache; migration with DMS and SCT |
| 3.5 | Network services — VPC subnets and gateways, NACLs and security groups, Route 53, VPN, Direct Connect |
| 3.6 | Storage services — S3 classes, EBS/instance store, EFS/FSx, Storage Gateway, lifecycle policies, AWS Backup |
| 3.7 | AI/ML and analytics — SageMaker AI, Lex; Athena, Kinesis, Glue, QuickSight |
| 3.8 | Other in-scope categories — EventBridge/SNS/SQS; Connect/SES; CodeBuild/CodePipeline/X-Ray; AppStream 2.0/WorkSpaces; Amplify; IoT Core; AWS Support |
| 4.1 | Compare AWS pricing models — On-Demand, Reserved, Spot, Savings Plans, Dedicated, Capacity Reservations; storage tiers; data transfer |
| 4.2 | Billing, budget and cost management — Budgets, Cost Explorer, Pricing Calculator, Organizations, cost allocation tags, the CUR |
| 4.3 | Technical resources and AWS Support — whitepapers, Prescriptive Guidance, Knowledge Center, re:Post, support plans, Trusted Advisor, Health Dashboard |

D1 contributes **4** tasks, D2 **4**, D3 **8**, D4 **3** — which is why D3 (34 %) receives seven lessons while D4 (12 %) receives two.

**Exam facts at a glance** (every figure as of October 2026; verified against the live exam guide and repeated verbatim in L01, L15 and L16):

| Fact | Value |
|------|-------|
| Exam code / level | **CLF-C02**, Foundational (replaced CLF-C01 on **19 September 2023**) |
| Questions / duration | **65 questions / 90 minutes** |
| Scored vs unscored | **50 scored + 15 unscored**; unscored items are never identified |
| Question types | **multiple choice** (1 correct of 4) and **multiple response** (2+ correct of 5+) |
| Score scale / cut | **100–1,000**, pass at **700** |
| Scoring model | **Compensatory** — each domain scored independently; no compensating a D2 gap with a D3 surplus |
| Guessing | **No penalty**; an unanswered item is scored wrong |
| Cost / validity | **100 USD** per attempt; certification valid **3 years** |
| After a fail | **14 calendar days** before re-taking |
| Result latency | Posted within **5 business days** |
| Delivery | Pearson VUE, test centre or online proctored |
| AWS's own prep rhythm | **2–3 weeks** in **30–60 minute** chunks |

**How to use this course.**

| Weeks | Lessons | What you do |
|-------|---------|-------------|
| **1** | 01 + 02 | Read the guide as a specification, then learn to argue the business case (Domain 1, 24 %) |
| **2** | 03 + 04 | Global infrastructure and resilience, then deployment and operating methods (Domain 3 opening) |
| **3** | 05 + 06 | The shared responsibility model, then IAM and data protection (Domain 2 core) |
| **4** | 07 + 08 | Governance and compliance, then networking and content delivery |
| **5** | 09 + 10 | Compute and storage, then databases |
| **6** | 11 + 12 | Integration/analytics/remaining services, then monitoring, support and Well-Architected |
| **7** | 13 + 14 | Pricing models and cost tools, then billing, Organizations and cost governance (Domain 4) |
| **8** | 15 + 16 | **Simulations.** Sit Set A on a 20-minute timer, grade by domain block, route each miss with the lesson's routing table, repair the dip; then sit Set B, drill the ten trap pairs, and run L16's weight-driven **final 7-day study plan** (≈ 4.4 hours across six study days plus exam morning) |

The week-8 sequence and the 7-day plan are the course's own reading of the `8 weeks` duration in `course.json`, not an AWS-published schedule — AWS's own stated rhythm for a Foundational certification is **2–3 weeks in 30–60 minute chunks**, and lessons 15 and 16 both say so explicitly. What *is* AWS-published, and what both simulations repeat: 65 / 50 / 15, 90 minutes, 700 on a 100–1,000 scale, compensatory scoring, no guessing penalty, 100 USD, 3-year validity, 14 calendar days after a fail, results within 5 business days.

---

## Lesson Structure

All 16 lessons share one skeleton: frontmatter (`title`, `description`, `order`, `difficulty: beginner`, `duration`), an opening hook immediately under the H1, an ASCII lesson card that compresses the lesson into one screen, a numbered `##` section map with `###` subsections, mermaid diagrams, worked examples numbered `E1…`, a `Comparative Verdict` box, a `2026 Updates (as of October 2026)` box, a `Real-World Case Studies` section, an admonition where a trap exists, a `Key Takeaways` block inside `> [!SUCCESS]`, and a closing `Practice Questions` section. Counts below were re-derived per file.

### Lesson 01: CLF-C02 Exam Guide and Cloud Concepts

**Duration:** 90 minutes (952 lines)

**Hook:** "Every AWS certification begins with one document: the **official exam guide**. For CLF-C02 that single document does two jobs at once — it tells you exactly *how* the exam is built (codes, minutes, questions, cut score, weights) and it defines the *cloud vocabulary* you must command in Domain 1 (Cloud Concepts, 24% of scored content)."

**Learning Objectives:**
- Read the exam guide the way an exam writer does: candidate profile, verbatim out-of-scope job tasks, Appendix A's technologies-and-concepts list
- Convert the logistics table into a per-question time budget, a scored-vs-unscored analysis and the cost of a retake
- Map the four domain weights and all **19 task statements** onto a study plan, and derive item counts (12/15/17/6) as arithmetic, not as an AWS figure
- Separate the two question types and apply compensatory scoring correctly — including why **700 is not 70 %**
- Separate the in-scope service list from the out-of-scope list that feeds distractors, and resolve HTML-guide vs PDF-guide differences
- Define cloud computing, on-premises vs cloud, the three deployment models and the service-model ladder
- State the six advantages, the Well-Architected pillars and the cloud economics vocabulary (fixed vs variable, rightsizing, BYOL)

**Content Outline:**
- 1. What the CLF-C02 exam measures — target candidate, the out-of-scope job tasks verbatim, Appendix A
- 2. Exam logistics: the numbers that change your strategy — the logistics table, E1 per-question budget, E2 scored vs unscored, E3 cost of a retake
- 3. The four domains and their weights — official weights, E4 derived item counts, CLF-C01 → CLF-C02, E5 weights into study hours
- 4. The task-statement map: 4 domains → 19 tasks — Domain 1 in detail, the other 15 in one line each
- 5. Question types and scoring mechanics — exactly two types, the scoring pipeline, E6 "700 is not 70 %"
- 6. In-scope versus out-of-scope services — two lists one rule, the out-of-scope list, naming traps, which guide wins
- 7. Cloud basics — what cloud computing is, on-premises vs cloud, E7 the hidden on-premises cost list, deployment models, the service-model ladder, four words the exam keeps apart
- 8. AWS value proposition: the six advantages — AWS's wording, E8 economies of scale, E9 twenty years of the same price unit, the Well-Architected Framework (Task 1.2)
- 9. Cloud economics — fixed vs variable, on-premises cost drivers, E10 rightsizing, BYOL vs included, automation and managed services
- Real-World Case Studies · Practice Questions, with the sourced **2026 Updates (as of October 2026)** box sitting inside section 6

**Exam alignment:** the whole Domain 1 vocabulary (24 %) plus the logistics and scoring rules that govern every other lesson; §3–§5 are also the source of L15/L16's strategy blocks.

**Real-World Application:** Four cases in one table plus three in detail — **Capital One** (exiting the data centre), **Box** (Well-Architected cost optimization), **Philip Morris International** (400 applications in two years), **Canva** (a portfolio of pricing models).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` (including the domain-weight pie) · 7 "Did you know?" · 4 `[!WARNING]` · 3 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 02: Cloud Economics, Migration Strategies and the Cloud Journey

**Duration:** 60 minutes (951 lines)

**Hook:** "Domain 1 of the CLF-C02 exam carries **24% of the scored content** — the second-largest domain on the paper — and it is the one domain where AWS asks you to argue in the language of a **business case** rather than a service feature. Everything else in the exam (security, global infrastructure, services, billing) assumes you already accept the premise; Domain 1 *is* the premise."

**Learning Objectives:**
- State the six advantages in AWS's own wording and separate economies of scale, global reach, speed, elasticity, scalability and high availability
- Walk the six Well-Architected pillars and six general design principles, and show how the pillars trade off against each other
- Map the six AWS CAF perspectives to owners and to the four examinable outcomes
- Choose between the 6 Rs and the 7 Rs with a decision tree, and name the tools behind database replication
- Place Assess → Mobilize → Migrate & Modernize and its supporting resources on one map
- Convert fixed/capex on-premises spend into variable/opex cloud spend, and build a TCO/ROI comparison you can reproduce in 90 seconds
- Decide BYOL vs license-included, order rightsizing before discounts, and explain how the responsibility line moves across EC2, RDS and Lambda

**Content Outline:**
- 1. The value proposition of the AWS Cloud (task 1.1) — the six advantages verbatim, E1 economies of scale arithmetically, E2 "stop guessing capacity" in numbers
- 2. Design principles: the Well-Architected Framework (task 1.2) — what the Framework is, the six pillars, the six general design principles, E3 the pillars are not interchangeable
- 3. The AWS Cloud Adoption Framework (task 1.3) — six perspectives, six owners, four examinable outcomes, CAF → MAP → Well-Architected on one map
- 4. Migration strategies: the 6 Rs (task 1.3) — the strategies and their glosses, E4 sorting a 40-application portfolio, the two named tools, E5 the Snowball reality check
- 5. The cloud migration journey and its resources (task 1.3) — the three phases and the resources that support them
- 6. Cloud economics (task 1.4) — fixed vs variable, on-premises cost drivers, E7 hidden on-premises inputs, capex → opex, E8 TCO and ROI worked, BYOL vs license-included, rightsizing
- 7. Automation, managed services and the responsibility shift (task 1.4) — automation benefits, undifferentiated work, EC2 vs RDS vs Lambda
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box

**Exam alignment:** all four Domain 1 task statements (1.1 benefits, 1.2 design principles, 1.3 migration, 1.4 economics) — the 24 % domain in a single lesson.

**Real-World Application:** Five cases — **Capital One** ("all in on AWS"), **Shutterfly/SBS** (VMware to AWS), **Netflix** (global streaming at AWS scale), **Box** (Well-Architected cost optimization), **FarEye** (Savings Plans + Spot + Graviton).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` (including the domain-weight pie) · 8 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]` · 3 `[!NOTE]`

---

### Lesson 03: AWS Global Infrastructure and Resilience

**Duration:** 60 minutes (1,008 lines)

**Hook:** "Every AWS workload eventually answers one question: *where does it run, and what happens when that place breaks?* The exam calls this **Domain 3, Task 3.2 — 'Define the AWS global infrastructure'**… AWS's own framing is blunt: Amazon CTO Werner Vogels says **'Everything fails, all the time'**, and the Well-Architected Framework exists so you can *'prepare your workload for failure'* rather than pretend it will not happen."

**Learning Objectives:**
- Separate Regions, Availability Zones and edge locations by definition, count and capability
- Explain why Regions are isolated — fault tolerance, data residency and latency
- Choose a Region on compliance, latency, price and features, and apply the AZ design rule (AWS ships ≥ 3, your app uses ≥ 2)
- Distinguish AZ IDs from AZ codes and check whether a design uses the AZs it was actually given
- Tell CloudFront, Route 53 and Global Accelerator apart by their entry plane (cache / DNS / anycast IP)
- Place Local Zones, Wavelength, Outposts and Snow on the hybrid edge continuum
- Define resiliency, availability, fault tolerance, high availability and disaster recovery precisely; compute RTO and RPO; rank the four DR strategies by cost against recovery speed

**Content Outline:**
- 1. Regions, Availability Zones and edge locations — three definitions in AWS's own words, E1 reconciling the AZ count, what each layer is for, where the Regions are (as of Oct 2026)
- 2. Why Regions are isolated — fault tolerance, data residency and sovereignty, latency, E2 redundancy multiplies availability
- 3. Choosing a Region — the four factors plus two you forget, E3 the availability budget per year, E4 why "39 Regions" is not what your account sees
- 4. The Availability Zone design rule — two numbers both correct, AZ IDs vs AZ codes, E5 does your design use the AZs you were given?
- 5. Edge services — CloudFront, Route 53, Global Accelerator, the three-plane comparison, E6 the DNS TTL window is part of your failover time
- 6. The hybrid edge continuum — Local Zones, Wavelength, Outposts and Snow
- 7. Resilience vocabulary — five terms five meanings, RTO and RPO, E7 reading them off a timeline, turning a stem into the right term
- 8. Disaster recovery strategies — the four strategies and their published bands, E8 which strategy fits, traffic shifting and testing, active/passive vs hot/warm
- 9. Design for failure — the Well-Architected reliability design principles and the anti-patterns the exam calls wrong
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box (early in the lesson, inside section 1)

**Exam alignment:** Domain 3 Task 3.2 (global infrastructure) plus the resilience vocabulary that Task 3.2 and the Well-Architected reliability pillar share.

**Real-World Application:** Four resilience cases — **Capital One** (automated Regional failover), **Amazon Prime Video** (six Regions for one live broadcast), **Bangkok Flight Services** (multi-AZ disaster recovery), **NASA JPL / Perseverance** (fault-tolerant scale for a mission you cannot retry), plus a "what all four cases share" synthesis.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 2 `[!IMPORTANT]` · 4 `[!NOTE]`

---

### Lesson 04: Cloud Deployment Models and Operating on AWS

**Duration:** 60 minutes (921 lines)

**Hook:** "Every workload has to answer two questions before it ships: *where does it run?* and *how will we operate it again tomorrow?* The exam calls this **Domain 3, Task 3.1**… and it is the most decision-shaped task on CLF-C02… The trap is that Task 3.1 looks like a coding task and is not one — 'Implementation' is listed as an out-of-scope job task, so you are never asked *how* to write the script, only *which* door to walk through."

**Learning Objectives:**
- Name the four deployment models in AWS's own words and separate hybrid from multi-cloud
- Map IaaS, PaaS and SaaS to AWS examples and read the responsibility shift each one triggers
- Choose between Console, CLI, SDKs, APIs and IaC, and apply the one-time vs repeatable rule
- Distinguish CloudFormation from CDK and know why Terraform is background, not syllabus
- Pick the right connectivity door: internet, Direct Connect, Site-to-Site VPN, or VPC endpoint / PrivateLink
- Place Amplify, AppSync and IoT Core where the exam guide actually tests them
- Tell Elastic Beanstalk, Lightsail and CloudFormation apart by the job each does

**Content Outline:**
- 1. What Task 3.1 actually asks — knowledge vs skills, the scope line as a decision not a build, the three service lists you must keep apart
- 2. Deployment models: public, private, hybrid and multi-cloud — AWS's four definitions, two taxonomies, the in-scope hybrid toolkit
- 3. Service models: IaaS, PaaS, SaaS and the responsibility shift — E1 counting the shift, the security of vs in invariant, patching nuance
- 4. Ways to access AWS: Console, CLI, SDKs, APIs and IaC — the five doors, one-time vs repeatable, E2 arithmetic of manual operations, E3 one template four environments with drift arithmetic, the IaC trio
- 5. Connectivity: the four doors into and out of a VPC — E4 two tunnels four numbers, E5 what a resiliency SLA costs in minutes, E6 choosing the Direct Connect port, PrivateLink and gateway endpoints precisely
- 6. Frontend, mobile and IoT (task 3.8) — Amplify, AppSync naming caveat, IoT Core
- 7. Elastic Beanstalk, Lightsail and CloudFormation — three distinct roles, E7 the Lightsail bundle priced two ways, E8 Beanstalk is $0 to run as a service, the three-in-one decision
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box (early in the lesson, inside section 1)

**Exam alignment:** Domain 3 Task 3.1 in full, with tasks 3.5 (connectivity) and 3.8 (frontend/mobile/IoT) picked up at their examinable depth.

**Real-World Application:** Four cases — **Gourmeat** (Lightsail as the small predictable entry point), **athenahealth** (repeatable operations across 120 accounts), **Capital One** (development environments from months to minutes), **Bangkok Flight Services** (a repeatable migration with multi-AZ operations).

**Practice Questions:** 12 multiple-choice + 3 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 3 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]` · 4 `[!NOTE]`

---

### Lesson 05: The AWS Shared Responsibility Model

**Duration:** 60 minutes (952 lines)

**Hook:** "Every CLF-C02 security question eventually collapses into one sentence: *who fixes this?*… Shared does **not** mean split down the middle — it means *two different organizations, each fully responsible for their own layer*."

**Learning Objectives:**
- Separate security OF the cloud (AWS) from security IN the cloud (you) using AWS's own wording
- Place the boundary exactly: host OS and virtualization layer down = AWS, guest OS and up = you
- Read the full responsibility breakdown — facility, hardware, hypervisor, data, identity, encryption, compliance
- Watch the line shift across EC2, RDS, Lambda and S3, including the RDS Custom and Lambda runtime-mode wrinkles
- Classify every control as inherited, shared or customer specific, and understand why shared ≠ 50/50
- List what customers still own and what AWS owns, and recognise the classic misattribution traps

**Content Outline:**
- 1. Security OF versus security IN the cloud — AWS's own wording, the preposition is the whole trick, E1 sorting six statements in under a minute
- 2. Where the line sits in the stack — the boundary sentence, resiliency uses the same two prepositions, E2 the 124-AZ arithmetic and what it does not buy you
- 3. The full responsibility breakdown — every row every owner, E3 the same workload in three columns
- 4. How the line shifts across services (Task 2.1's hardest skill) — the three exam exemplars plus one, E4 the patch-duty audit, the RDS Custom escape hatch, the Lambda runtime nuance, E5 a deprecated runtime nobody patched, single-tenant vs multi-tenant patching
- 5. The control taxonomy — AWS's three official categories, the five-question heuristic, E6 bucket-sorting twelve controls, shared controls in continuous operation
- 6. What customers still own — the monitoring duty, E7 the root-account exposure audit, the duties that never move
- 7. What AWS owns — 8. Classic misattribution traps — the nine wrong answers corrected, E8 rewriting three distractors, where the exam plants the trap
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box

**Exam alignment:** Domain 2 Task 2.1 in full — statistically the most profitable single concept on the paper at 30 % domain weight.

**Real-World Application:** Four Domain 2 cases — **athenahealth** (centralized network security across 120 accounts), **Avalon Healthcare Solutions** (Zero Trust access to PHI), **Socure** (counting the 46+ FedRAMP controls you inherit), **Smartsheet Gov** (FedRAMP-ready in under 90 days).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 6 "Did you know?" · 5 `[!WARNING]` · 3 `[!IMPORTANT]` · 4 `[!NOTE]`

---

### Lesson 06: Identity, Access Control and Data Protection

**Duration:** 60 minutes (945 lines)

**Hook:** "Security is the heaviest single domain on CLF-C02: **Domain 2 carries 30% of the scored content**, and its two access tasks (2.3 … and 2.4 …) are the most reliably tested of the whole exam. AWS's own framing starts from one uncomfortable sentence about the root user: it has *'complete access to all AWS services and resources'*."

**Learning Objectives:**
- Protect the root user — MFA device limits, the 35-day rule, no root access keys, and the tasks only root can do
- Build IAM from its four objects and run the evaluation logic: explicit deny wins, identity ∪ resource, ceilings, cross-account
- Choose roles vs users from the stem — cross-account, EC2 instance profiles, federation, external ID
- Place IAM Identity Center, Cognito and Directory Service correctly
- Compare security groups and network ACLs on scope, rules, statefulness and defaults
- Choose WAF vs Shield vs Firewall Manager, and encrypt at rest and in transit with KMS envelope encryption
- Name every in-scope detection service in one line each and score an account against the least-privilege checklist

**Content Outline:**
- 1. The root account — what root is, tasks only root can perform, E1 day-1 root hardening step by step
- 2. IAM building blocks — users, groups, roles, policies; identity-based vs resource-based; how AWS evaluates a request (explicit deny wins); E2 effective permissions for John across three layers; permissions boundaries and least-privilege tooling
- 3. Roles versus users — the use-case table, E3 the cross-account audit role, E4 the EC2 instance profile with zero shipped keys
- 4. IAM Identity Center: the workforce answer — 5. Amazon Cognito at exam depth
- 6. Authentication options and MFA — the five ways to prove who you are, where secrets live, E5 counting the credentials in one account
- 7. Security groups versus network ACLs — the packet walk, defaults are not "secure", E6 layered network defence
- 8. AWS WAF, Shield and Firewall Manager — E7 the WAF bill, E8 Shield Advanced arithmetic
- 9. Data protection: at rest, in transit and KMS — the two directions, keys and envelope encryption, E9 envelope encryption on a 1 GB object
- 10. Threat detection, audit and posture — in-scope one-liners · 11. The least-privilege best-practice checklist (E10)
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box (early in the lesson, inside section 1)

**Exam alignment:** Domain 2 Tasks 2.3 (access management capabilities) and 2.4 (components and resources for security).

**Real-World Application:** The same four security cases as L05, each pinned to what it proves — **athenahealth**, **Avalon**, **Smartsheet Gov**, **Socure** — plus a "what the security cases share" synthesis.

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 9 "Did you know?" · 4 `[!WARNING]` · 3 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 07: Governance, Auditing and Compliance on AWS

**Duration:** 60 minutes (935 lines)

**Hook:** "Domain 2 carries **30% of the CLF-C02 score**, and task 2.2 is its governance half… That single sentence names almost every tool in this lesson — and it also plants the trap, because **monitoring is CloudWatch while auditing is CloudTrail and Config**."

**Learning Objectives:**
- Decode the one-sentence stem that tells you which governance tool the exam wants
- Use CloudTrail for who did what — event history vs trails, organization trails, log-file integrity — and resist the CloudWatch Logs trap
- Use AWS Config for configuration history, rules, compliance state, conformance packs and aggregators
- Find AWS's SOC / ISO / PCI reports and sign a BAA in AWS Artifact, free and self-service
- Map Trusted Advisor's six check categories to what each support plan unlocks
- Apply SCPs correctly: deny-only, an allow at every level, any deny wins, management account untouched
- Place Control Tower guardrails, design an audit-surviving tagging strategy, separate residency from sovereignty, and triage CloudWatch vs CloudTrail vs Config vs Trusted Advisor

**Content Outline:**
- 1. One question, one tool — the stem decoder and the exam guide's own division of labour
- 2. AWS CloudTrail — what it records, event history is not a trail, organization trails, E1 the CloudTrail bill, E2 one trail for 40 accounts, the CloudWatch Logs trap
- 3. AWS Config — the recorder and configuration items, rules and remediation, E3 continuous vs periodic recording, E4 pricing a conformance bundle, CloudTrail records actions / Config records state
- 4. AWS Artifact — reports on demand and free, agreements (BAA and NDA)
- 5. AWS Trusted Advisor — six check categories, availability by support plan, E5 what each plan unlocks
- 6. AWS Organizations and SCPs — structure and feature sets, SCPs never grant, how evaluation runs, E6 a deny-by-default SCP, E7 consolidated billing pools usage, limits worth memorising
- 7. AWS Control Tower — what it builds, the three kinds of guardrail, data-residency guardrails
- 8. Compliance programs and shared responsibility — three buckets, the three questions students get wrong
- 9. Tagging strategy as governance — the four-layer stack · 10. Data sovereignty and residency — three words three meanings, the residency control stack
- 11. Security-event identification — the triage table, E8 the auditor's four questions, evidence request → tool and feature
- 12. The live exam guide: what changed by 2026 · Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 2 Task 2.2 in full — compliance and governance concepts, log capture, AWS Artifact, and the monitoring/auditing/reporting split.

**Real-World Application:** **athenahealth** (governance as code across 120 accounts), **Smartsheet Gov** (FedRAMP-ready in under 90 days), **Avalon** (700+ audit controls without a VPN), **Socure** (inheriting controls, not responsibility).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 4 `[!WARNING]` · 2 `[!IMPORTANT]` · 3 `[!NOTE]`

---

### Lesson 08: Networking, Content Delivery and Hybrid Connectivity

**Duration:** 75 minutes (1,052 lines)

**Hook:** "Domain 3 (**Cloud Technology and Services**) carries **34% of the scored content** on CLF-C02, and its task 3.5 — *'Identify AWS network services'* — is the most mechanical block of knowledge on the exam. Everything in it is a definition plus a rule: a subnet lives in exactly one Availability Zone, a public subnet is a **routing decision** rather than a checkbox, a NAT gateway is **outbound-only**, a security group is **stateful** while a network ACL is **stateless**, VPC peering is **not transitive**…"

**Learning Objectives:**
- Name every VPC component and decide public vs private from the route table alone
- Explain why NAT is outbound-only and separate the default VPC from a custom VPC
- Win security group vs network ACL on every axis: scope, rule action, state, evaluation, defaults, referencing
- Apply the non-transitive peering rule, and choose gateway endpoint vs interface endpoint vs PrivateLink
- Separate Site-to-Site VPN from Direct Connect on provisioning time, bandwidth consistency and encryption
- Use Route 53 hosted zones, all eight routing policies and health checks; put CloudFront in front of a private S3 origin with Origin Access Control
- Pick ALB over NLB, state the Global Accelerator one-liner, and audit the idle-cost traps

**Content Outline:**
- 1. The VPC — the component set, public vs private is a routing decision, NAT is outbound-only, default vs custom VPC, E1 the three-tier VPC end to end, E2 the NAT bill
- 2. Security groups versus network ACLs — the packet walk, defaults are permissive, E3 deny one CIDR subnet-wide
- 3. VPC peering: pairwise, never transitive — E4 the peering trap
- 4. VPC endpoints and PrivateLink — E5 gateway vs interface endpoint arithmetic, E6 the private-subnet S3 pattern, a SaaS provider scenario
- 5. Hybrid connectivity: Site-to-Site VPN versus Direct Connect — E7 DX vs VPN, the price of consistency
- 6. Amazon Route 53 — hosted zones, the eight routing policies, health checks drive failover, E8 the global storefront
- 7. Amazon CloudFront and edge locations — the private S3 pattern and the two wrong versions, E9 the CloudFront bill
- 8. Elastic Load Balancing: ALB versus NLB — E10 ALB vs NLB arithmetic
- 9. AWS Global Accelerator and the four-way edge choice — E11 the disabled accelerator still bills
- 10. Network cost: what is free and what quietly bills you · 11. 2026 updates that touch networking, edge and data transfer
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3 Tasks 3.5 (network services), 3.3 (purposes of load balancers) and 3.2 (edge locations and their benefits).

**Real-World Application:** **Amazon Prime Video / Thursday Night Football** (six Regions and an edge CDN), **Box** ($2.23 million found in the data-transfer bill), **Capital One** (Route 53 failover and automated Regional recovery), **athenahealth** (hundreds of VPCs behind one Transit Gateway hub).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` (including a `timeline`) · 10 "Did you know?" · 4 `[!WARNING]` · 2 `[!IMPORTANT]` · 4 `[!NOTE]`

---

### Lesson 09: Compute and Storage Services

**Duration:** 75 minutes (989 lines)

**Hook:** "**Domain 3 (Cloud Technology and Services) carries 34% of the CLF-C02 score**, and two of its task statements do most of the work: **Task 3.3 'Identify AWS compute services'** and **Task 3.6 'Identify AWS storage services'**… Add the compute half of **Domain 4 Task 4.1** — the seven purchasing options — and this single lesson covers material that shows up across **two domains**."

**Learning Objectives:**
- Decode an EC2 instance name into series, generation, silicon and size, and map families to stems
- Choose among the seven purchasing options with sourced discount ceilings (as of Oct 2026)
- Run Auto Scaling arithmetic on min / desired / max and explain why multi-AZ is the default HA answer
- Price a Lambda invocation in requests and GB-seconds, and know when Lambda is the wrong answer
- One-line ECS, EKS, Fargate, ECR and Batch, then place Elastic Beanstalk and Lightsail
- Walk the S3 storage-class lineup, versioning, lifecycle, encryption and static hosting; choose an EBS volume type; separate EBS from instance store
- Compare EFS vs FSx, place Storage Gateway, know the Snow Family's status, use AWS Backup, and decide S3 vs EBS vs EFS in one table

**Content Outline:**
- 1. Amazon EC2 — what an instance is, reading an instance name (the most testable EC2 skill), families → workloads, sizing, the launch checklist
- 2. The seven EC2 purchasing options — the purchasing table, RI vs Savings Plans vs Spot tie-breaker, worked arithmetic behind the discounts
- 3. Auto Scaling — min / desired / max, why multi-AZ is the high-availability answer
- 4. AWS Lambda — what Lambda actually charges for
- 5. Containers: ECS, EKS, Fargate and ECR · 6. Elastic Beanstalk and Lightsail: PaaS and VPS
- 7. Amazon S3 — the storage-class lineup, versioning, lifecycle and replication, encryption and static websites
- 8. Amazon EBS and instance store — volume types, snapshots, instance store vs EBS
- 9. File, hybrid and backup — EFS vs FSx, Storage Gateway, Snow Family status, AWS Backup
- 10. S3 vs EBS vs EFS — the decision table · 2026 Updates · Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3 Tasks 3.3 (compute) and 3.6 (storage), plus Domain 4 Task 4.1's purchasing-option half.

**Real-World Application:** Five cases — **NASA JPL** (Auto Scaling with Spot, On-Demand and Capacity Reservations), **Box** (cost optimization, mostly in storage), **Canva** (one workload, three purchasing options), **Shutterfly Business Solutions** (400 TB of objects plus a file-service lift-and-shift), **FarEye** (three compute levers stacked in one story); **WOMBO** appears as a supplementary ECS/Fargate scale-up line.

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 9 "Did you know?" · 3 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 10: Database Services: Choosing the Right Store

**Duration:** 60 minutes (1,109 lines — the longest lesson)

**Hook:** "**Domain 3 (Cloud Technology and Services) carries 34% of the CLF-C02 score**, and inside it sits a task that is pure decision work: **Task 3.4 'Identify AWS database services'**… Every question built on this task has the same skeleton: a workload stem, four database names, and one right answer. The service names are easy; reading the stem is the exam."

**Learning Objectives:**
- Sort every database question into the five buckets of Task 3.4
- Separate what Amazon RDS manages from what you still own, and defeat the Multi-AZ vs read-replica trap in both directions
- Place Amazon Aurora by compatibility, storage auto-scaling and replica count
- Size DynamoDB capacity in RCU and WCU, and pick the right capacity mode
- One-line ElastiCache Redis OSS vs Memcached; separate OLAP from OLTP so Redshift stops being a distractor
- Place Neptune and DocumentDB from two-word stems; split a migration between AWS SCT (schema) and AWS DMS (data)
- Run the workload → database decision table end to end under exam pressure

**Content Outline:**
- 1. Task 3.4: five buckets and one decision — the skill statements decoded, the in-scope and out-of-scope lists, E1 bucket a stem in one pass
- 2. Amazon RDS — what "managed" buys you, engines and storage, **Multi-AZ vs Read Replicas — THE trap**, E2 the reporting spike, RDS vs self-managed on EC2, backups and retention
- 3. Amazon Aurora — compatibility and the shared cluster volume, Aurora vs RDS as a two-word tie-breaker
- 4. Amazon DynamoDB — what it is and what it refuses to be, capacity modes, worked RCU/WCU arithmetic, when the exam picks DynamoDB
- 5. Amazon ElastiCache — Redis OSS vs Memcached one-liners
- 6. Amazon Redshift — the OLAP vs OLTP trap, Redshift Spectrum
- 7. Amazon Neptune and Amazon DocumentDB — the two specialised stores, the MongoDB tie-breaker
- 8. Migration — AWS Schema Conversion Tool vs AWS DMS, E11 an Oracle exit
- 9. The decision table: workload → store, E12 one stem two wrong answers each time
- 10. Staying current: what changed for databases · Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3 Task 3.4 in full (relational, NoSQL, memory-based, migration tools, EC2-hosted vs managed).

**Real-World Application:** **Netflix** (consolidating relational infrastructure on Amazon Aurora), **Amazon Prime Video** (DynamoDB behind a live sports peak), **Zendesk** (better price-performance on the same Aurora engine), **Philip Morris International** (Amazon RDS as the landing zone for 400 applications).

**Practice Questions:** 14 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop — the joint-highest question count of the content lessons.

**Verified block counts:** 14 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` (including an `erDiagram`) · 7 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 11: Application Integration, Analytics and Other In-Scope Services

**Duration:** 60 minutes (933 lines)

**Hook:** "Domain 3 (Cloud Technology and Services, **34%** of the score) hides two task statements that carry a huge, scattered surface area: **Task 3.7 'Identify AWS artificial intelligence and machine learning (AI/ML) services and analytics services'** … and **Task 3.8 'Identify services from other in-scope AWS service categories'**…"

**Learning Objectives:**
- Read Amazon SQS as the decoupling answer and separate standard from FIFO delivery guarantees
- Work the queue mechanics: visibility timeout, long polling, retention, dead-letter queues
- Design an SNS fanout and say why it is SNS *plus* SQS, not SNS alone
- Route event-driven architectures through EventBridge buses, rules, targets and schedules
- Pick Step Functions Standard vs Express and price a workflow in state transitions
- Use API Gateway as the front door (REST vs HTTP vs WebSocket, throttling), and price an Athena query and a Glue job
- Separate Kinesis Data Streams from Data Firehose, then place OpenSearch, QuickSight, EMR and Redshift
- One-line every remaining in-scope service — ML suite, Connect, SES, DevTools, IoT Core, end-user computing, Amplify, Marketplace — and eliminate the four lookalike out-of-scope services

**Content Outline:**
- 1. Amazon SQS — what a queue decouples, the mechanics that appear in stems, point-to-point to queue
- 2. Amazon SNS — push not poll, the fanout pattern, subscription types at exam depth
- 3. Amazon EventBridge — buses rules targets, schedules, EventBridge vs SNS vs SQS when the stem says "react to something"
- 4. AWS Step Functions — Standard vs Express, choosing among the four integration services, E8 walking a claims approval end to end
- 5. Amazon API Gateway — three API types, throttling, what the front door actually handles
- 6. Serverless analytics on S3 — Amazon Athena (SQL without a cluster) and AWS Glue (catalog and ETL engine)
- 7. Streaming, search and BI — Kinesis vs Firehose, OpenSearch, QuickSight, EMR, Redshift, the AppFlow lookalike, the analytics decision tree
- 8. Every remaining in-scope service, one line each — the ML suite (Task 3.7), business applications/developer tools/IoT (Task 3.8), a summary table, and a stem → service cheat sheet
- 2026 Updates · Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3 Tasks 3.7 and 3.8 — the two tasks with the widest, most scattered service surface on the paper.

**Real-World Application:** Five cases — **Capital One** (serverless and application integration at bank scale), **Paytm** (Graviton economics applied to EMR analytics), **Amazon Prime Video** (integration at a global live-sports peak), **NASA JPL** (telemetry at analytics scale), **NFL** (a fan-facing analytics product).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` · 8 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]`

---

### Lesson 12: Monitoring, Operations, Support and the Well-Architected Framework

**Duration:** 60 minutes (939 lines)

**Hook:** "A cloud workload you cannot see is a workload you do not run. Everything in this lesson answers one of three questions: **is it healthy**, **is it well built**, and **who do I call when it is not**… the exam's favourite trick is to put a monitoring answer inside a support question and a support answer inside a monitoring question."

**Learning Objectives:**
- Separate CloudWatch vs AWS Health vs Trusted Advisor vs CloudTrail by reading the symptom, not the service list
- Build CloudWatch metrics, alarms, dashboards and Logs the way the exam tests them — granularity, dimensions, states, missing-data policies
- Work alarm-threshold logic (period × datapoints, state-change-only actions)
- Split the Health Dashboard into public service health and personalised account health, and know what is free
- Place Trusted Advisor availability by plan — 56 free checks versus the full set
- Read the 2026 support-plan table: response times, channels, Trusted Advisor access, IEM and minimums, all date-stamped
- Name the six Well-Architected pillars exactly and drive the Well-Architected Tool (workload → lens → high-risk issues → improvement plan → milestone)

**Content Outline:**
- 1. Amazon CloudWatch — the definition and the three-way trap, metrics and the two granularities, alarms (threshold in, action out), E1 alarm-threshold logic, E2 dashboards and the free tier, logs (group, stream, event)
- 2. AWS Health Dashboard — two views one word, what is free and what is not, E3 the five-step "is it us or AWS?" drill
- 3. AWS Systems Manager: two one-liners · 4. AWS Trusted Advisor: availability per plan
- 5. AWS Support plans — the 2026 lineup, the support plans table, the first-response ladder, E4 what the plan costs (worked arithmetic), incident-flavoured extras
- 6. Opening a case: console, severity, expectations
- 7. The Well-Architected Framework and the Well-Architected Tool — the six pillars by exact name, reviews, high-risk issues, milestones
- 8. Operational excellence at exam depth · 2026 Updates · Real-World Case Studies · Practice Questions

**Exam alignment:** spans four tasks — 1.2 (design principles, D1), 2.2 monitoring with CloudWatch (D2), 3.8 AWS Support (D3), 4.3 support plans / Trusted Advisor / Health Dashboard (D4) — the lesson's own exam-task table states this mapping.

**Real-World Application:** **Bangkok Flight Services** (monitoring and audit shipped *with* the migration), **Capital One** (operational excellence as an engineering discipline), **Box** (a Well-Architected review used as an operating routine), **athenahealth** (central visibility run by a team of eight).

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 4 `mermaid` · 7 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 13: AWS Pricing Models and Cost Tools

**Duration:** 60 minutes (1,025 lines)

**Hook:** "**Domain 4 (Billing, Pricing, and Support) carries 12% of the CLF-C02 score**, and two of its three task statements live inside this lesson… Roughly **six scored items** come from Domain 4, and most of them are arithmetic-and-judgement questions rather than definitions. Students who fail this area rarely fail because they never heard of Savings Plans; they fail because they cannot say *which* tool answers *which* question…"

**Learning Objectives:**
- State the four general pricing principles in AWS's own wording and name the three cost drivers
- Explain why the same instance type costs different amounts in different Regions, and work the arithmetic
- Read the compute purchasing comparison table and walk the purchase-option decision tree from free lab to committed fleet
- Separate Standard vs Convertible RIs and Compute vs EC2 Instance Savings Plans by discount ceiling *and* flexibility
- Explain exactly what Spot costs in interruption risk, and what a Dedicated Host buys over a Dedicated Instance
- Name the three Free Tier flavours plus the post-15-July-2025 credit structure
- List the billing dimensions of S3, EBS, RDS, Lambda, data transfer, Route 53 and CloudFront, and price requests, egress and hosted zones
- Choose the right cost tool: Pricing Calculator, TCO/Migration Evaluator, Billing console, Cost Explorer, Budgets

**Content Outline:**
- 1. The four general pricing principles — the principle ladder, pay less by using more, commitment as the only downward unit-price lever, prices set per service *and* per Region
- 2. Compute purchasing options — the master comparison table, E2 the discount ladder, RI fine print, Savings Plans types, Spot and its catch, Dedicated Host vs Instance vs Capacity Reservation, the decision tree, reading the stem's keyword map
- 3. Free Tier: three flavors plus the 2025 restructure — what changed on 15 July 2025, E3 what "750 hours per month" actually buys
- 4. What you are actually billed for — the billing-dimension matrix, E4–E6 request/egress/DNS arithmetic, the "stopped is not free" rule, data transfer every direction priced, storage tiers
- 5. Cost tools: five questions five answers — the tool ladder, E9 picking the tool before doing the math, inside Cost Explorer and Budgets
- Real-World Case Studies · Practice Questions, plus the sourced **2026 Updates (as of October 2026)** box (which closes the case-studies section)

**Exam alignment:** Domain 4 Tasks 4.1 (compare AWS pricing models) and 4.2 (billing, budget, cost management resources).

**Real-World Application:** Four cost cases with a stated lever each — **Box** ($2.23 M from billing dimensions, not from commitments), **Canva** (the purchase-model mix), **FarEye** (three levers pulled at once), **NASA JPL** (Spot where interruption is survivable) — plus a table of further AWS-published results including **SmartNews** and **Coinbase**.

**Practice Questions:** 12 multiple-choice + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 8 "Did you know?" · 3 `[!WARNING]` · 3 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 14: Billing, AWS Organizations and Cost Governance

**Duration:** 60 minutes (943 lines)

**Hook:** "Money is where cloud exams get personal. Domain 4 (**Billing, Pricing, and Support**, **12%** of scored content) carries roughly six scored questions… The pattern of failure is always the same: candidates know the services but not **which page answers which question**, and they fall for the two traps AWS reuses endlessly — *'an SCP grants access'* and *'the bill follows the OU tree'*. Neither is true."

**Learning Objectives:**
- Open the Billing and Cost Management console and name the exact page for every common money question
- Build AWS Organizations: one root, up to five OU levels, management account as payer, member accounts as users
- Explain consolidated billing — one bill, no extra fee, pooled volume discounts, shared RI/SP discounts — and compute the pooling and blended-rate examples from scratch
- Separate SCPs from IAM: deny-only, intersection, management-account immunity
- Activate cost allocation tags and run a showback → chargeback flow
- Choose between Budgets, Cost Explorer, CUR, Pricing Calculator and anomaly detection, including what each costs
- Read RI/SP reservation, utilization and coverage reports and diagnose over-buying vs under-buying

**Content Outline:**
- 1. The Billing and Cost Management console — the Bills page (invoice view), the billing dashboard Home (exploratory view)
- 2. AWS Organizations — roots, OUs, management vs member, two feature sets and what a billing-only organization cannot do
- 3. Consolidated billing — the four documented benefits, pooled tier thresholds, blended vs unblended (the trap that never dies), support is never pooled
- 4. Reserved Instances and Savings Plans across accounts — the sharing rules
- 5. SCPs versus IAM — the deny-only ceiling
- 6. Tagging and cost allocation tags — two kinds of tag one activation rule each, what the cost allocation report can and cannot split, showback vs chargeback
- 7. Cost management — AWS Budgets (alert first, act second), Cost Explorer, reservation/utilization/coverage, the Cost and Usage Report, awareness items
- 8. AWS Marketplace — how it bills, private offers and Private Marketplace
- 9. Invoices, currencies, payment basics and who to ask · 10. One-minute decision drill
- 2026 Updates · Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 4 Tasks 4.2 (billing, budget and cost management resources) and 4.3 (AWS Organizations, support usage), plus 4.1's "Reserved Instance behavior in AWS Organizations" line.

**Real-World Application:** Five cases — **Box** ($2.23 M from architecture, not from a discount code), **Canva** (the pricing-model ladder as a business), **FarEye** (three levers in one bill), **athenahealth** (governance across 120 accounts), **Shutterfly** (right-sizing and licence avoidance).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 5 `[!WARNING]` · 2 `[!IMPORTANT]` · 3 `[!NOTE]`

---

### Lesson 15: Exam Simulation A: Full-Length Practice Set + Strategy

**Duration:** 90 minutes (978 lines)

**Hook:** "Fourteen lessons gave you the content. This one gives you the **container**: how a CLF-C02 item is actually built, how the 90-minute clock behaves, how AWS writes a distractor, and then **Set A** — twenty exam-style items you sit under time and grade honestly. Everything before this lesson was domain knowledge; everything here is *test craft*, and on a compensatory 100–1,000 scale with 700 to pass, test craft is worth as much as another hour of revision."

**Learning Objectives:**
- Restate every published logistics number (65 / 50 / 15, 90 minutes, 700/1,000, 100 USD, 3 years, 14 days) without notes
- Run the 83-second pacing math and defend a two-pass plan that never leaves an item blank
- Apply the flag-and-sweep technique in under a minute per item
- Read a superlative stem — *most cost-effective*, *least operationally intensive*, *MINIMUM*, *first MUST* — and know which option the qualifier is buying
- Decode the seven distractor families AWS reuses across all four domains
- Sit Set A, grade it **by domain rather than by total**, and route each miss to the right lesson
- Defend the comparative verdict on self-study versus bootcamp versus AWS training

**Content Outline:**
- 1. Strategy: the four techniques that decide Set A — 1.1 the logistics you must not re-derive on exam day, 1.2 the pacing plan (65 items, 90 minutes), 1.3 flag-and-sweep item by item, 1.4 reading the stem (superlatives, negations, ordering words), 1.5 the seven distractor families, 1.6 domain weights and the Set A blueprint, 1.7 what this lesson deliberately does not assert
- Real-World Case Drills — Case Drill 1 **Capital One** "all in on AWS": which domain does an agility story test? · Case Drill 2 **Box**: reading a $2.23 M saving as four exam levers · 2026 Updates box
- 2. Practice Questions — **Set A: 20 items in published weight order**: D1 items 1–5, D2 items 6–11, D3 items 12–18, D4 items 19–20, plus items 21–22 (case-drill and 2026-update stems, outside the 20-minute clock) — each block followed by a per-option teardown
- 3. Grading Set A and routing your next 72 hours — the rubric, reading the score (18–20 / 15–17 / 12–14 / ≤11 bands), the miss → lesson routing table, the last 48 hours, and **what Set A cannot tell you** (six stated limits: scaled score, endurance, form composition, difficulty calibration, pass prediction, blueprint coverage)

**Exam alignment:** not a domain lesson — it converts the four weights into a clock plan, a flag budget (12 flags in a 14.2-minute review window), a grading rubric and a repair loop.

**Real-World Application:** Two case drills only (**Capital One**, **Box**), deliberately reused in L16 so the same numbers are read as different exam levers.

**Practice Questions:** 22 multiple-choice (20 timed + 2 bonus) + 2 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 22 `question` · 2 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` (including the domain-weight pie and the score-routing flowchart) · 8 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]`

---

### Lesson 16: Exam Simulation B: Second Practice Set, Trap Drills and Exam Day

**Duration:** 90 minutes (989 lines)

**Hook:** "Fifteen lessons gave you the content and Set A gave you a first simulation. This is the **second sitting**, and a second sitting measures something different: not whether you know the material, but whether you can hold two neighbouring services apart *while the clock runs*. Almost nobody fails CLF-C02 because they have never heard of AWS Config; they fail because the stem asked for **AWS's** evidence and they supplied **their own**…"

**Learning Objectives:**
- Frame any trap pair in one clause per member and test an option against **both** halves
- Handle CLF-C02's item shapes: multiple response without partial credit, calculation stems and selection stems
- Sit Set B in published weight order (5 / 6 / 7 / 2) and grade it against the ready-versus-not-ready thresholds
- Rehearse the official exam-day logistics checklist: IDs, check-in, breaks, comment time, score timing
- Run the ten-pair trap drill until every framing is one clause each
- Execute the weight-driven, dip-driven final 7-day study plan (~4.4 hours across six study days plus exam morning)

**Content Outline:**
- 1. Strategy: trap pairs — what a pair is and what a distractor really looks like, the three questions for any pair item
- 2. Strategy: the three item shapes — multiple response without partial credit, calculation and selection shapes, the Set B blueprint with its clock and weights
- Real-World Case Drills — Case drill 1 **Capital One**: eight data centers to zero · Case drill 2 **Box**: $2.23 million found in four line items · 2026 Updates
- 3. Practice Questions — **Set B: 20 items in published weight order** (5 / 6 / 7 / 2) plus bonus items 21–22, each block with a per-option teardown
- 4. TRAP DRILL — the ten pairs framed correctly: SG/NACL, Trail/CloudWatch, RI/SP/Spot, Multi-AZ/replica, SNS/SQS, SCP/IAM, WAF/Shield, Config/Artifact, Redshift/RDS, CloudFront/Global Accelerator
- 5. EXAM DAY — the official logistics checklist: before the day, check-in, during the exam, after the exam
- 6. Grading Set B and the ready-versus-not-ready verdict — the rubric (benchmark **18–20 of 20, zero blanks, no block below 70 %**), reading the score, the miss → lesson routing table, **what this lesson does not assert** (nine items: on-screen pass/fail, raw-to-scaled conversion, per-question pacing, support-plan rendering, new question types, and more)
- 7. The final 7-day study plan — Day 1 diagnose both sets, Day 2 weakest block, Day 3 Domain 2 pairs, Day 4 Domain 3 patterns, Day 5 Domains 1 and 4, Day 6 re-sit Set B at ≥ 18/20 with zero blanks, Day 7 logistics and retrieval only

**Exam alignment:** the whole paper — discrimination practice plus the exam-day protocol; §7's 7-day plan is the terminal artifact of the 8-week path.

**Real-World Application:** The same two cases as L15 (**Capital One**, **Box**) as domain-mapping drills, plus the ten trap pairs, all framed so that each half of a pair is stated before the options appear.

**Practice Questions:** 22 multiple-choice (20 timed + 2 bonus) + 1 matching + 2 fillblank + 2 dragdrop — the only lesson with two fill-in-the-blank and two drag-and-drop blocks.

**Verified block counts:** 22 `question` · 1 `matching` · 2 `fillblank` · 2 `dragdrop` · 5 `mermaid` (including the domain-weight pie and the 7-day plan flowchart with its below-18-of-20 loop-back) · 8 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]`

---

**Source of truth:** `content/courses/aws-clf-c02/course.json` + `content/courses/aws-clf-c02/en/*.md` + `.scratch/aws-clf/*.md` (SPEC + digests 01–19)
**Statistics:** re-derived with `wc`, `grep` and `python3` on 09 October 2026; all counts in this document match the files as shipped.
**Validation:** `validate_lesson.py` 16/16 exit 0; `validate_course.py` exit 1 with four locale warnings only; 214/214 question blocks parse with 214 unique ids.
**Status:** English complete; PT/ES deferred.
