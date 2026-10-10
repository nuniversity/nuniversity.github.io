# Course: AWS Certified Data Engineer – Associate (DEA-C01) Complete Course

## Course Metadata

| Field | Value |
|-------|-------|
| **Slug** | `aws-dea-c01` |
| **Title** | AWS Certified Data Engineer – Associate (DEA-C01) Complete Course |
| **Area** | Data & Analytics |
| **Difficulty** | Intermediate |
| **Duration** | 12 weeks |
| **Lessons** | 16 |
| **Icon** | `database` |
| **Author** | NUniversity |
| **Prerequisites** | Not declared in `course.json` |
| **Languages** | EN only (PT, ES deferred) |
| **Source directory** | `content/courses/aws-dea-c01/` (`course.json` + `en/`) |
| **Research digests** | `.scratch/aws-dea/` — 19 files (`01-…` through `19-…`) |
| **Document statistics verified** | 10 October 2026 (every number below re-derived with `wc` / `grep` / the validators on the files themselves) |

### Verified Course Statistics

| Metric | Value | Verification |
|--------|-------|--------------|
| Lesson files | **16** | `ls content/courses/aws-dea-c01/en/*.md \| wc -l` |
| Total lesson lines | **16,816** | `cat *.md \| wc -l` in `en/` |
| Total lesson bytes | **1,420,697** | `cat *.md \| wc -c` |
| Total lesson words | **215,236** | `cat *.md \| wc -w` |
| Shortest / longest lesson | **960** (L15) / **1,203** (L06) lines | `wc -l` per file |
| Average lesson length | **1,051** lines | 16,816 ÷ 16 |
| Lesson time budget | **1,185 minutes (19 h 45 min)** | sum of frontmatter `duration:` (90+75+75+75+75+60+75+75+60+60+60+75+75+75+90+90) |
| Per-lesson duration range | **60 min (L06, L09, L10, L11) – 90 min (L01, L15, L16)** | frontmatter |
| Multiple-choice `question` blocks | **240** | `grep -c '^```question'` over all 16 files |
| `matching` blocks | **17** | `grep -c '^```matching'` |
| `fillblank` blocks | **16** | `grep -c '^```fillblank'` |
| `dragdrop` blocks | **15** | `grep -c '^```dragdrop'` |
| Typed interactive blocks (matching + fillblank + dragdrop) | **48** | 17 + 16 + 15 |
| `interactive` wrapper blocks (L16 only) | **4** | 2 typed `matching`, 1 `fillblank`, 1 `dragdrop` inside a ` ```interactive ` fence |
| **Interactive exercises, all forms** | **52** | matching 19 · fillblank 17 · dragdrop 16 |
| Mermaid diagrams | **91** | `grep -c '^```mermaid'` |
| ASCII reference cards (`text`) | **148** | `grep -c '^```text'` |
| `sql` / `python` / `json` / `plot` blocks | **17 / 6 / 15 / 7** | `grep -c` per fence |
| Labelled fence openers | **576** | 240 q + 91 mermaid + 48 typed interactive + 4 wrapper + 148 text + 17 sql + 15 json + 7 plot + 6 python |
| Bare fence lines (closers) | **576** | `cat *.md \| grep -cx '```'` — 1:1 match, **0** labelled closing fences anywhere |
| "Did you know?" curiosities | **122** | `grep -h 'Did you know'` |
| `[!WARNING]` callouts | **37** | `grep -c '\[!WARNING\]'` — all 37 are block starts (`^> [!WARNING]`) |
| `[!IMPORTANT]` callouts | **28** | `grep -c '\[!IMPORTANT\]'` — all 28 are block starts |
| `[!NOTE]` / `[!SUCCESS]` callouts | **25 / 16** | `grep -c` |
| Total admonition callouts | **106** | 37 + 28 + 25 + 16 |
| `Key Takeaways` blocks | **16 / 16** | one per lesson, inside the closing `[!SUCCESS]` |
| `Comparative Verdict` blocks | **16 / 16** | one per lesson (cloud × self-managed × another AWS service × financial lever) |
| `Real-World Case Studies` sections | **15 / 16** | absent only in L16 (which carries four `Real-World Case Drills` instead) |
| `### 2026 Updates (as of October 2026)` boxes | **16 / 16** | one per lesson |
| `## Practice Questions` sections | **16 / 16** | the last `##` in 15 lessons; in L16 it is `## 4.` with four strategy sections after it |
| Named case headings (`### Case …`) | **64** | 4 per lesson, 5 in L06, 3 in L08, 4 each in L15 and L16 |
| `as of Oct 2026` / `as of October 2026` stamps in lessons | **307** | `grep -o` over both spellings |
| Full `https://` URLs inside lessons | **0** | lessons cite scheme-less first-party paths (20 unique `aws.amazon.com` / `docs.aws.amazon.com` paths) |
| Unfinished-work markers in lessons | **0** | `grep -riE 'TODO\|FIXME\|TBD\|XXX\|lorem ipsum\|PLACEHOLDER'` → the single hit is the legitimate Redshift term *query-editor `${param}` placeholders* |
| Locales shipped | **`en/` only** | `course.json` carries an `en` key only; no `pt/` or `es/` directory |
| Digest files | **19** (numbered 01–19) | `ls .scratch/aws-dea/[01]*.md \| wc -l` |
| Digest lines / bytes | **5,648 / 680,811** | `cat .scratch/aws-dea/[01]*.md \| wc -l` / `wc -c` |
| Digest size per file | **29,579 – 93,995 bytes** (18 of 19 sit in the 29–49 KB band; digest 15 is the 94 KB question bank) | `wc -c` per file |
| Source entries pinned in digest section (A) | **767** | distinct `S#`/`A#` identifiers or numbered/bulleted entries per digest (see inventory) |
| Draft exam questions in digest 15 | **40** (Q01–Q40) | `grep -c '^\*\*Q[0-9]'` |
| Unique `https://` URLs in digests | **26** (30 occurrences) | most sources are pinned as shorthand paths against the prefix table in section (A) |
| Question IDs | **240 total, 240 unique, 0 duplicates** | `"id": "dea-NN-qN"` — every ID matches the pattern, `sort -u` equals the total |

### Validation

| Check | Result |
|-------|--------|
| `.opencode/skills/course-writer/scripts/validate_lesson.py` (run with `OPENCODE_FILE_PATH`) | **16 / 16 lessons exit 0** |
| `.opencode/skills/course-writer/scripts/validate_course.py` (run with `OPENCODE_SKILL_DIR=content/courses/aws-dea-c01`) | **exit 1 — 4 warnings, all locale-related**: missing `pt`/`es` sections in `course.json` and missing `pt/`/`es/` directories. No structural, naming, ordering or frontmatter error is reported. |
| Integrity: question IDs | **240 IDs parsed from the 240 ` ```question ` blocks, 240 unique, 0 duplicates**, all matching `dea-NN-qN` |
| Integrity: JSON parse | `course.json` parses clean; all 240 question payloads and all 48 typed interactive payloads parse clean |
| `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |

> **Language status.** The course is **English-only today**. PT and ES are **deferred**: the directory contains a single locale folder (`en/`), `course.json` defines an `en` block only, and the course validator's entire output is the four missing-`pt`/`es` warnings quoted above. The `course-writer` and `i18n-translator` skills are the intended path for the later PT/ES pass; nothing in the shipped EN content blocks that translation.

> **Two description strings lag the shipped files.** `en/06-programming-for-data-ops.md` and `en/07-choosing-data-stores.md` still say *twelve exam-style questions* in their frontmatter `description`, and L07 still says *two AWS customer case studies*; the shipped files carry **14 `question` blocks in each** and **5 (L06) / 4 (L07) named case headings**. L06's description carries its own inline correction ("expanded scope of this edition… fourteen practice questions… five AWS customer case studies"). No validator checks `description` prose, so this drift is documentation-only — the counts in this document are the re-derived ones.

---

## Course Description

> "Comprehensive preparation for the AWS Certified Data Engineer – Associate (DEA-C01) exam covering data ingestion and transformation, data store management, data operations and support, and data security and governance — with architecture diagrams, real AWS customer case studies, worked pipeline examples, and exam-style practice questions including multiple-response drills."
> — `content/courses/aws-dea-c01/course.json`, `en.description`

Sixteen lessons take a candidate from the official exam guide to a second timed, scored simulation. Lessons 01–06 build Domain 1 (34 %): the guide and the data-engineer role, batch versus streaming ingestion, transformation on Glue and DataBrew, Redshift warehouse SQL, orchestration, and the programming concepts Task 1.4 tests. Lessons 07–09 are Domain 2 (26 %): choosing stores and formats, the Glue Data Catalog plus dimensional/NoSQL modeling, and lifecycle, migration and lake organization. Lessons 10–12 are Domain 3 (22 %): monitoring and observability, in-flight data quality, and the troubleshooting/performance/cost triage loop. Lessons 13–14 are Domain 4 (18 %): KMS, encryption and IAM, then Lake Formation governance and PII. Lessons 15 and 16 are the two simulations — Set A with the test-craft strategy that decides the clock, and Set B with the twenty trap pairs, the exam-day checklist and a dip-driven 7-day plan.

Every lesson is written to the same contract: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), a hook that states the exam-relevant failure mode, a numbered `##` section map, mermaid architecture and decision diagrams, worked arithmetic pinned to an October-2026 rate card or quota sheet, a sourced `### 2026 Updates (as of October 2026)` box, a `## Real-World Case Studies` section built from digest 16, a closing `## Practice Questions` set of multiple-choice items plus interactive matching, fill-in-the-blank and drag-and-drop exercises, a `> [!WARNING]` trap box, a `> **Comparative Verdict` block (other cloud × self-managed/on-premises × another AWS service × a purely financial lever), and a `> [!SUCCESS]` block carrying the numbered **Key Takeaways**.

### Learning Outcomes

Upon completing this course, students will be able to:

1. Read the official DEA-C01 exam guide as a specification — candidate profile, in-scope and out-of-scope service lists (14 categories / 78 line items as of Oct 2026), the four domains with their published weights **34 / 26 / 22 / 18 %**, all **17 task statements and 120 skill bullets**, the two question formats and compensatory scoring — and convert it into a weight-driven study-hour budget.
2. Choose between bounded batch and unbounded streaming for Task 1.1, and build both lanes: S3 landing zones, AWS DMS full load / full load + CDC / CDC only, AppFlow, Transfer Family, the Snow Family and data APIs; Kinesis Data Streams shards, partition keys and retention; Firehose buffers; MSK brokers — with shard-count, throughput and cost arithmetic performed by hand.
3. Run the transformation surface: AWS Glue job types, DynamicFrame versus DataFrame, job bookmarks, triggers, worker and DPU sizing on the October-2026 rate card, Glue Studio and DataBrew recipes, error tables and small-file hygiene, and the Lambda-versus-Glue-versus-Batch envelope.
4. Design a Redshift warehouse load and physical plan — RA3 and Redshift Managed Storage, Serverless, Spectrum, cross-database queries, data sharing, `COPY`/`UNLOAD`/`MERGE`, PL/pgSQL, materialized views, distribution styles and sort keys, auto VACUUM/ANALYZE and WLM — and defend Redshift versus Athena on a decision matrix instead of habit.
5. Orchestrate a resilient pipeline: Step Functions Standard versus Express, Amazon States Language, inline versus Distributed `Map`, EventBridge rules/buses/Pipes/Scheduler with DLQs, MWAA, Glue Workflows, and the retry / DLQ / idempotency / backfill patterns that make a run replayable.
6. Apply language-agnostic programming concepts at exam depth — lazy evaluation, partitions, the UDF cost ladder, window functions, CTEs, `PIVOT`, JSON parsing, Lambda concurrency and the 900-second ceiling, at-least-once versus an exactly-once effect, watermarks and poison pills — without ever being asked for language-specific syntax.
7. Map every access pattern to exactly one store, choose storage formats and codecs from the CSV/JSON/Avro/Parquet/ORC matrix, run S3 as the lake core, reason about Iceberg/Hudi/Delta at the depth skill 2.1.7 requires, and build catalog, dimensional, SCD and DynamoDB single-table models that can evolve without breaking consumers.
8. Manage the lifecycle and operate the pipeline: S3 Lifecycle rule anatomy and cost math, versioning, replication, Object Lock, DynamoDB TTL, archive classes chosen by retrieval SLA, DMS/Snow/DataSync/Transfer Family migration, medallion zones — plus CloudWatch/CloudTrail evidence planes, per-service monitoring, in-flight data quality with Glue Data Quality and DataBrew, and the symptom → cause → fix triage loop per service.
9. Secure and govern the pipeline end to end: KMS key tiers, key policy versus IAM versus grants, envelope encryption, the per-service at-rest matrix and TLS in transit, least-privilege pipeline roles, the Lake Formation versus IAM "two doors" rule, LF-Tag ABAC, column/row/cell data filters, Macie discovery, Redshift datashares and data residency — and sit the exam with tested pacing, a five-move multiple-response procedure and a trap-pair reflex.

---

## Deep-Research Methodology

No lesson in this course was written from memory. Each one was produced from a **research digest** first: a single file of source-pinned facts, dated numbers, case material, trap lists and explicit non-assertions, from which the lesson was then written. The digests live in `.scratch/aws-dea/` (a git-ignored scratch directory — `research scratch (never commit)` in `.gitignore`) and each of the 19 follows the same eight-section skeleton from `.scratch/aws-dea/SPEC.md`:

| Section | Content |
|---------|---------|
| **A. Official / primary sources** | URLs or first-party paths + the access date (`2026-10`), verbatim quotes for every exam fact |
| **B. Core facts & concepts** | precise, teachable statements organised by task statement |
| **C. Numbers, prices, limits** | each with a source **and** a date — "as of Oct 2026" |
| **D. Real-world examples / case material** | AWS-published customer stories only |
| **E. AWS services in scope** | per the official DEA-C01 exam-guide in-scope list |
| **F. Exam traps & common confusions** | the wrong-but-plausible pairs the exam weaponises |
| **G. Could NOT verify** | items AWS does not confirm — **never stated as fact** |
| **H. Suggested worked examples & diagram ideas** | lesson seeds: arithmetic, mermaid sketches, scenario stems |

All 19 digests carry all eight headings (verified with a per-file `grep -qE '^## [A-H]\. '` loop). Three disciplines run through the whole set: **no number without a source and a date**, **third-party sources are never the sole basis for an exam fact** (tagged `(T)` and demoted behind `(G)` official AWS pages), and **unverified claims are isolated in section (G) rather than silently dropped**. That is why every lesson carries a `Points this lesson deliberately does not assert` block or a trap box, and why the two simulation lessons label anything they could not confirm against a first-party AWS page as *do not assert*.

### Digest Inventory (01–19)

| Digest | File | Lines | Bytes | §A sources | Focus — what it grounds |
|--------|------|-------|-------|-----------|-------------------------|
| 01 | `01-exam-guide-dea-c01.md` | 307 | 29,962 | 13 | Official exam guide and logistics: 130 min / 65 Q / 150 USD / cut 720, the four weights 34-26-22-18, 17 tasks and 120 skills, in-scope vs out-of-scope lists (feeds **L01**) |
| 02 | `02-ingestion-streaming.md` | 248 | 29,984 | 53 | Batch and streaming ingestion: S3 landing zone, DMS, AppFlow/Transfer/Snow/data APIs, Kinesis shards, Firehose buffers, MSK (feeds **L02**) |
| 03 | `03-transformation-glue-databrew.md` | 303 | 32,868 | 40 | Transformation: Glue job model, DynamicFrame vs DataFrame, bookmarks, triggers, DPU/worker pricing, Glue Studio, DataBrew (feeds **L03**) |
| 04 | `04-redshift-warehouse-sql.md` | 294 | 29,989 | 35 | Redshift architecture and SQL: RA3/RMS, Serverless, Spectrum, COPY/UNLOAD/MERGE, stored procedures, MVs, dist/sort, WLM (feeds **L04**) |
| 05 | `05-orchestration-pipelines.md` | 223 | 30,692 | 30 | Orchestration: Step Functions Standard/Express, ASL states, EventBridge rules/Pipes/Scheduler, MWAA, Glue Workflows, SNS/SQS alerts (feeds **L05**) |
| 06 | `06-programming-data-ops.md` | 187 | 30,017 | 67 | Programming concepts and Lambda data operations: lazy evaluation, partitions, SQL patterns, Lambda limits, idempotency/watermarks/poison pills, nested data (feeds **L06**) |
| 07 | `07-data-stores-formats.md` | 278 | 29,978 | 32 | Store selection and formats: access pattern → service map, S3 lake core numbers, CSV/JSON/Avro/Parquet/ORC, codecs, Iceberg/Hudi/Delta (feeds **L07**) |
| 08 | `08-data-modeling-catalog-schema.md` | 365 | 48,892 | 45 | Catalog and modeling: Glue Data Catalog object model, crawlers, partition sync/index/prune/projection, table versioning, star/snowflake, SCDs, DynamoDB single-table (feeds **L08**) |
| 09 | `09-lifecycle-migration.md` | 255 | 29,995 | 20 | Lifecycle and migration: S3 Lifecycle anatomy and cost, versioning/MFA Delete, replication, Object Lock, DynamoDB TTL, DMS/Snow/DataSync, medallion zones (feeds **L09**) |
| 10 | `10-monitoring-observability.md` | 231 | 29,985 | 37 | Monitoring and observability: CloudWatch metrics/alarms/Logs Insights, CloudTrail planes, and the per-service metrics of Glue, Kinesis, Redshift, EMR, Lambda, DMS, Step Functions, S3, EventBridge (feeds **L10**) |
| 11 | `11-data-quality.md` | 248 | 29,945 | 42 | Data quality "while processing": six dimensions, Glue Data Quality DQDL, DataBrew rule sets, quarantine patterns, schema-drift detection, sampling and skew (feeds **L11**) |
| 12 | `12-troubleshooting-performance-cost.md` | 348 | 46,115 | 59 | Troubleshooting, performance and cost: symptom→cause→fix taxonomy per service, cost levers, cost-versus-performance tradeoffs (feeds **L12**) |
| 13 | `13-security-encryption-iam.md` | 248 | 36,755 | 40 | Security, encryption and IAM: KMS tiers and envelope encryption, key policy vs IAM vs grants, at-rest matrix, TLS, least privilege, cross-account, secrets (feeds **L13**) |
| 14 | `14-governance-lakeformation-pii.md` | 261 | 29,987 | 56 | Governance, Lake Formation and PII: the two-doors rule, permission anatomy, LF-Tag ABAC, data filters, RAM/resource links, Macie, datashares, residency (feeds **L14**) |
| 15 | `15-exam-question-bank.md` | 901 | 93,995 | 9 | **40 original exam-style questions (Q01–Q40)** distributed D1 14 · D2 10 · D3 9 · D4 7 to match the weights, plus the official question-style analysis and the top-20 trap pairs (feeds **L15 and L16**) |
| 16 | `16-aws-data-case-studies.md` | 171 | 29,579 | 39 | **Verified AWS-published customer case studies for D1/D2/D3/D4** — the source of every `Real-World Case Studies` section and every case drill (feeds **L01–L15, L15/L16 drills**) |
| 17 | `17-aws-updates-2026.md` | 245 | 30,666 | 70 | 2026 change log valid in October 2026: exam-guide news, service changes, pricing changes, in-scope deltas, rebrands and stale-fact warnings (feeds **all 16 `2026 Updates` boxes**) |
| 18 | `18-exam-strategy.md` | 264 | 30,715 | 31 | Exam strategy and prep resources: pacing math, multiple-choice and multiple-response technique, top-25 traps, study plan, retake/recertification rules (feeds **L15 and L16**) |
| 19 | `19-consumption-analytics-apis.md` | 271 | 30,692 | 49 | Consumption/analytics/serving layer cross-cutting D1/D2/D3: Athena engine, workgroups and money, CTAS/INSERT INTO, projection, federated query, OpenSearch, QuickSight, data APIs (feeds **L04, L07, L10, L12**) |
| **Total** | **19 files** | **5,648** | **680,811** | **767** | **40 draft exam questions in digest 15; case evidence in digest 16** |

**Numbering, stated plainly.** The digest directory contains exactly **19 files, `01-` through `19-`**, one more than the 16 lessons. Digest numbering runs one-to-one with lessons for **01–14**; **15** and **18** are the two strategy digests that feed both simulation lessons; **16** and **17** are enhancement passes with no lesson of the same number (case-study sections and the dated update boxes); **19** is a cross-cutting digest that cuts across D1, D2 and D3 rather than owning a lesson.

**Per-lesson digests vs. cross-cutting digests.** Fourteen digests (01–14) map one-to-one onto lessons 01–14. Five (15, 16, 17, 18, 19) are enhancement passes: digest 16 is why lessons 01–15 end with named customer cases and why both simulations carry case drills; digest 17 is why all 16 lessons carry a dated `2026 Updates (as of October 2026)` box; digests 15 and 18 are why lessons 15 and 16 can teach a blueprint, a 40-item bank, trap pairs and pacing instead of generic advice; digest 19 is why the Athena/OpenSearch/QuickSight serving material is consistent wherever it appears.

---

## Real-World Examples

Every case below is quoted with the numbers AWS published for it, and most are reused across several lessons — the same customer story is cited as evidence for different task statements rather than being told once and dropped. All figures come from digest 16, where every number is read off an AWS-owned property (`aws.amazon.com`, `d1.awsstatic.com`, `press.aboutamazon.com`) or from a customer quote printed **on** an AWS page, accessed **2026-10**.

> **Read every number as a customer claim, not an AWS guarantee.** AGCO's **−78 %** and Integral Ad Science's *"hundreds of permission rules down to precisely two"* are outcomes against each customer's own baseline and date. Any option phrased "AWS guarantees…" fails before you check the number — this is digest 16's first trap and lessons 15 and 16 both drill it.

### The Case Studies Mapped to the Four DEA Domains

Domain labels are digest 16 §B1 / §D.1; the lesson list is a word-boundary `grep -lw <company>` across the 16 shipped lesson files.

| Domain (weight) | AWS customer cases | Headline numbers as AWS publishes them | Lessons citing it |
|---|---|---|---|
| **D1 — Data Ingestion and Transformation (34 %)** | **Hearst** (media, clickstream) | **30 TB/day** ingested through Kinesis Data Streams + Firehose across 250+ sites | 01, 02, 06, 11, 16 |
| | **AGCO** (ag-machinery IoT) | Cost **−78 %**, screen load **8–30 s → 600 ms**, run by **1 person** instead of 3–5, **1,200 data points/min** (tested 10,000), live since Jan 2020 | 02, 05, 06, 10, 15 |
| | **Baqend** (SaaS, Germany) | **<1 min** end-to-end from event to dashboard; **100 M+ monthly users**, 5,000+ customers, on Kinesis → Managed Service for Apache Flink | 02, 06 |
| | **FINRA** (regulation) | **~6 TB and 37 billion records/day** (busy days **75 billion+**); HBase-on-EMR **>60 % cost savings**; CAT **>100 B events/day** | 01, 02, 09, 10, 11, 13, 16 |
| **D2 — Data Store Management (26 %)** | **Nasdaq** (exchange) | **30 B → 70 billion records/day** (peak 113 B), **90 % of load 5 h sooner**, queries **32 % faster**, a **15 TB** lake queried in place, S3 Object Lock archive | 01, 03, 04, 05, 06, 07, 09, 10, 11, 14, 16 |
| | **EOS Group** (financial services) | **−50 % infrastructure cost**, **zero data loss**, minimal downtime via AWS MAP + DMS → S3 → Redshift with **dynamic data masking** of PII | 01, 02, 04, 05, 07, 09, 14 |
| | **PayU** (fintech/payments) | **$20,000/month** saved; queries **10–15 min → <1 min**; **150,000 → 35,000 queries/month (−77 %)**; data sharing across **5 clusters** | 01, 03, 04, 06, 11, 16 |
| | **BMW Group** (automotive) | **10 TB/day from 1.2 M vehicles**, a Cloud Data Hub for **500+ users**, schemas in Glue and data in S3 | 03, 08, 09 |
| | **GE Aerospace** (supply chain) | **~70 % better query performance**, **>$500,000/yr** estimated, **90 min → 7 min**, 9-month migration, 150+ reports | 01, 04, 07, 12 |
| | **EMX** (programmatic media) | **−85 %** storage cost on S3 + Athena, **>2 TB raw/hour**, queries at least **4× cheaper** than backend ETL tools | 06, 07 |
| | **AppsFlyer** (SaaS analytics) | **−80 %** monthly cost for the interactive workload after HBase → Athena | 06 |
| **D3 — Data Operations and Support (22 %)** | **Amazon Customer Service** | RA3 right-sizing cut Redshift operating cost **−55 %/yr**, dashboards **+47 %** faster, queries **+25 %** faster | 04, 12, 16 |
| | **Paytm** (payments, India) | **30–35 % savings on EMR** by moving to Graviton; 80 % of EMR on Graviton by end-2023 | 12 |
| | **Edmunds.com** (automotive media) | Fargate Spot **−25–30 %**, **$100,000 saved** Oct 2019–Aug 2020, compute **−30 %**, 99.999 % availability; a separate one-shot render job cost **$6,000** for 50 M → 700 M images | 05, 12 |
| | **PayU** (rationalisation) | same story read as a *query rationalisation* case — see D2 | 01, 03, 04, 06, 11, 16 |
| **D4 — Data Security and Governance (18 %)** | **Integral Ad Science** (adtech) | Lake Formation LF-TBAC collapsed **hundreds of permission rules down to exactly two**; column-level control; S3 reached only through a Lake Formation data access role | 01, 03, 07, 08, 13, 14, 15, 16 |
| | **GoDaddy** (internet/tech) | A Lake Formation data mesh of **2,000+ data products**, **multiple petabytes across hundreds of accounts**, one central governance account | 07, 08, 13, 14, 15 |
| | **Oportun** (fintech lender) | Macie **+95 %** discovery accuracy and **−80 %** time to discover sensitive data in S3 | 05, 10, 13, 14, 16 |
| | **EOS Group** (masking) | same story read through **Redshift dynamic data masking** — see D2 | 01, 02, 04, 05, 07, 09, 14 |

Digest 16's own lesson bundles are the reason this mapping is stable: *Streaming (D1) → Hearst, AGCO, Baqend · Stores/lake (D2) → Nasdaq, EOS, PayU, EMX/AppsFlyer · Operations and cost (D3) → Paytm, Edmunds.com, Amazon Customer Service, PayU rationalisation · Governance (D4) → IAS, GoDaddy, Oportun, EOS masking, Nasdaq Object Lock*.

### Four Cases Worth Telling in Full

**Example 1 (D1): Hearst — a stream is chosen, not assumed.** Hearst's clickstream spans 250+ sites, 15 daily and 36 weekly papers, 300+ magazines and 31 TV stations, and the pipeline **ingests 30 TB/day**. AWS publishes Peter Jaffe's line: *"I don't know how we could have made our clickstream data pipeline work without Amazon Kinesis services. It would have involved many weeks of engineering."* The examinable part is the **choice** the story proves — Kinesis Data Streams for replayable, shard-level retention plus Amazon Data Firehose (renamed from Kinesis Data Firehose on **2024-02-09**, endpoints, APIs, CLI and metrics unchanged) for buffered delivery with no consumer API. Lessons 02 and 11 reuse the case for Task 1.1's batch/streaming decision and for a volume/freshness quality gate.

**Example 2 (D2): Nasdaq — decoupled storage and compute, then an archive that cannot be rewritten.** The overnight batch load of orders, quotes and trades must finish before market open; AWS quotes Robert Hunt: *"We were able to easily support the jump from 30 billion records to 70 billion records a day because of the flexibility and scalability of Amazon S3 and Amazon Redshift."* Around that sit **90 % of the load 5 hours sooner**, **queries 32 % faster**, a **15 TB** lake queried in place through Spectrum, and S3 Object Lock for the archive. The case is the course's most-reused one (11 lessons) because it touches D1 (batch), D2 (lake house), D3 (deadline monitoring) and D4 (WORM retention) without changing a single number.

**Example 3 (D3): Amazon Customer Service — right-sizing is an architecture decision.** Migrating three `dc2.8xlarge` nodes to `RA3.16xlarge` nodes cut Redshift operating cost **55 % a year**, made dashboards **47 %** faster and queries **25 %** faster. The mechanism — Redshift Managed Storage separating compute from storage so you right-size rather than over-buy — is exactly skill 2.1.1 (*storage for specific cost and performance requirements*) and 3.2.5 (*tradeoffs between provisioned and serverless*). Lesson 12 uses it as the model answer for a "MOST operationally efficient / LEAST costly" stem; lesson 04 uses it to prove the RA3 split.

**Example 4 (D4): Integral Ad Science — the mechanism, not the number.** A self-service lake across producer and consumer accounts, GDPR/CCPA obligations, access decided by classification and job role: Lake Formation + Glue Data Catalog + S3 + Athena/EMR with identity federated from Okta. AWS publishes the outcome verbatim: *"With Lake Formation tag-based access controls, IAS reduced hundreds of permission rules down to precisely two rules."* The markable content is the **mechanism** — grant once on a tag, tag the resources, let inheritance carry the grant to every table and column beneath the database, reach S3 only through a Lake Formation data access role, and remember that a tag grant made in one Region does nothing in another. Lessons 13, 14, 15 and 16 all drill it, and lesson 15 converts it into a two-item case drill.

---

## Story

> **Hook:** "Almost nobody fails DEA-C01 because they have never heard of Amazon Macie — they fail because the stem asked for *who called `DeleteTable`* and they answered with a *finding*, or because the stem said `LEAST operational overhead` and they paid for a managed Airflow environment to run four Lambda steps."
> — lesson 16, opening paragraph

> **Audience.** This course is written for the **data analyst, ETL developer and warehouse administrator moving onto AWS** — people who already know what a join, a partition, a slow-changing dimension and a nightly batch are, and who now have to attach AWS names to them. That is exactly the profile the exam guide describes: the DEA-C01 candidate is someone who *implements* pipelines and who *monitors, troubleshoots and optimises cost and performance* — not someone who is asked to invent a data strategy.

> **The exam (as of October 2026).** **DEA-C01** is an **Associate** exam: **130 minutes**, **65 questions** (**50 scored + 15 unscored, the unscored items never identified**), **150 USD** per attempt, delivered by **Pearson VUE** at a test centre or online proctored, results within **5 business days**, valid for **3 years**, with a **14-calendar-day** wait after a fail and a full fee every attempt. It is scored on a **100–1,000** scale with a **720** cut, **compensatory** across the four domains (no per-domain pass), **no penalty for guessing**, and **a blank counts as wrong**. There are exactly two item types: **multiple choice** (one correct, three distractors) and **multiple response** (two or more correct out of five or more). The published weights are **D1 Data Ingestion and Transformation 34 % · D2 Data Store Management 26 % · D3 Data Operations and Support 22 % · D4 Data Security and Governance 18 %**, and the current guide is **v1.1, published 12 December 2025**. Arithmetic on the weights gives a derived item budget of **17 / 13 / 11 / 9 of the 50 scored items** — that column is arithmetic, not an AWS figure; only the percentages are official.

> **Connection.** Four domains with a hard **60 % in D1 + D2**, a 130-minute clock (exactly **120 seconds per item**, 130 × 60 ÷ 65) and a compensatory 720 cut is why this course is shaped the way it is. Memorising a rate card or a quota has a shelf life of months — AWS repriced Kinesis, Firehose and Redshift repeatedly in 2025–2026 — so every lesson pairs **dated, source-pinned numbers** with the **mechanism** underneath them (bookmarks versus watermarks, delivery versus stream, tag inheritance versus per-resource grants), and every lesson closes with items that punish the slogan answer. Lesson 01 turns the weights into a **40-hour plan of 13.6 / 10.4 / 8.8 / 7.2 hours** for D1–D4; lesson 15 teaches the clock and Set A; lesson 16 teaches the trap pairs and Set B.

**Exam alignment, domain by domain.**

| Domain | Weight | Where the course teaches it |
|--------|--------|-----------------------------|
| **D1** Data Ingestion and Transformation | **34 %** | L01 (guide, role, pipeline architecture), L02 (batch/streaming, Kinesis, Firehose, MSK, DMS), L03 (Glue, DataBrew, triggers, DPU), L04 (Redshift as a transform engine), L05 (Step Functions, EventBridge, MWAA), L06 (programming concepts, Lambda) |
| **D2** Data Store Management | **26 %** | L07 (access pattern → store, formats, codecs, S3, lakehouse), L08 (Glue Data Catalog, dimensional and NoSQL models, schema evolution), L09 (lifecycle, versioning, TTL, archive, migration, lake organization), L04 (RA3, Spectrum, data sharing, dist/sort) |
| **D3** Data Operations and Support | **22 %** | L10 (CloudWatch/CloudTrail, per-service metrics, logging), L11 (in-flight data quality, DQDL, drift), L12 (triage loop, per-service fixes, cost levers), L04/L09 (WLM, VACUUM, lifecycle cost math) |
| **D4** Data Security and Governance | **18 %** | L13 (KMS, encryption, IAM, cross-account, secrets, PrivateLink), L14 (Lake Formation two doors, LF-Tag ABAC, data filters, Macie, datashares, residency), L09 (Object Lock), L10 (audit plane, CloudTrail Lake) |

Lessons 15 and 16 then convert the map into test craft: the 120-second pacing math, flag-and-sweep, reading *MOST appropriate* / *LEAST costly* / *FIRST step*, the five-move multiple-response procedure, the distractor families, Set A (20 items in weight order **7 / 5 / 4 / 4**) graded by domain instead of by total, the twenty trap pairs, the official exam-day checklist and a dip-driven **7-day plan**.

**How to use the course.**

| Weeks | Lessons | What you do |
|-------|---------|-------------|
| 1–2 | L01–L02 | Read the guide as a spec; fix the ingestion vocabulary and the shard arithmetic before anything else |
| 3–4 | L03–L04 | Transformation engines and the warehouse: Glue/Databrew hands-on, then Redshift load paths and physical design |
| 5–6 | L05–L06 | Orchestration and programming: the resilience patterns and the runtime envelopes |
| 7–8 | L07–L09 | Domain 2 in order — stores, catalog/model, lifecycle — the 60 %-with-D1 block finished here |
| 9–10 | L10–L12 | Domain 3: evidence planes, in-flight quality, then the triage loop |
| 11 | L13–L14 | Domain 4: the chain of authorised calls, then the governance layer |
| 12 | **L15 → L16** | **Simulations**: sit Set A on a 40-minute timer, grade by domain, repair the weakest domain from the routing table; then Set B on 30 minutes, drill the twenty trap pairs, walk the exam-day checklist, run the 7-day plan |

The 16 lessons total **1,185 minutes (19 h 45 min)** of frontmatter time budget — under 90 minutes a week across 12 weeks even before the replay-and-repair loop, which is the point: the plan leaves room to re-sit a simulation **72 hours** after grading it, which is where the actual score movement happens.

---

## Lesson Structure

All 16 lessons share one skeleton: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook immediately under the H1, a numbered `##` section map, mermaid diagrams, a sourced `### 2026 Updates (as of October 2026)` box, a `## Real-World Case Studies` (or case-drill) section, a `## Practice Questions` section, a `> [!WARNING]` trap box, a `> **Comparative Verdict` block and a closing `> [!SUCCESS]` **Key Takeaways** list. Counts below were re-derived per file.

### Lesson 01: DEA-C01 Exam Guide and the Data Engineer Role

**Duration:** 90 minutes (981 lines)

**Hook:** "Every AWS certification begins with one document: the **official exam guide**. For DEA-C01 that single document does two jobs at once — it tells you exactly *how* the exam is built (code, minutes, questions, cut score, weights) and it defines the *data engineering job* you must already do… Candidates who skip the guide and jump straight to flashcards fall into the same three traps: they believe a third-party page that says the exam is **170 minutes** (it is **130**), they convert the scaled cut score of **720** into a percentage (it is not 72 %), and they cannot separate what is **in scope** from what merely sounds like real data work."

**Learning Objectives:**
- Read the guide as an exam writer does: target candidate, in/out-of-scope job tasks, the 130-minute / 65-question / 150-USD logistics with every third-party myth corrected
- Convert the four weights into a study-hour budget and a derived item budget
- Map all 17 task statements and 120 skill bullets onto the four domains
- Apply the two question types and compensatory scoring without a per-domain illusion
- Separate the in-scope service list (14 categories / 78 line items) from the out-of-scope list that feeds distractors
- Define the data engineer's loop — ingest → store → transform → govern → serve — and the three tasks the guide says are *not* yours

**Content Outline:**
- 1. What the DEA-C01 exam measures
- 2. Exam logistics: the numbers that change your strategy
- 3. The four domains and their weights
- 4. The task-statement map: 4 domains, 17 tasks, 120 skills
- 5. Question types and scoring mechanics
- 6. In-scope versus out-of-scope services
- 7. The data engineer role on AWS
- 8. End-to-end pipeline architecture: ingest, store, transform, govern, serve
- Real-World Case Studies · Practice Questions

**Exam alignment:** the whole guide — logistics, the 34/26/22/18 weights, the task/skill map, the two item types and the in/out-of-scope lists that govern every other lesson.

**Real-World Application:** four cases — **Nasdaq** (Domains 1, 2, 4), **Integral Ad Science** (Domain 4), **FINRA** (Domains 1, 2, 3), **GE Aerospace** (Domains 2, 3) — plus nine worked examples (time budget, derived item counts, study hours, retake cost, the 720 arithmetic, the Athena cost ladder, FINRA throughput).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 7 "Did you know?" · 2 `[!WARNING]` · 4 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 02: Data Ingestion: Batch and Streaming Patterns

**Duration:** 75 minutes (1,015 lines)

**Hook:** "Domain 1 of DEA-C01 carries **34 % of scored content**, and its first task — **1.1, ingestion** — is where most candidates lose easy marks. The reason is that ingestion questions almost never ask 'what is a stream'. They ask you to *choose*: batch or streaming, full load or CDC, `PutRecord` or `PutRecords`, shared reads or enhanced fan-out, Firehose or Kinesis Data Streams, Transfer Family or DataSync, Snowball Edge or something else entirely."

**Learning Objectives:**
- Make the Task 1.1 batch-versus-streaming call from the four-question decision every stem hides
- Design an S3 landing zone: prefixes, SSE-KMS, multipart rules and the four event-trigger destinations
- Run AWS DMS in its three modes and size the replication instance without falling for the real-time myth
- Model Kinesis Data Streams: shards, partition keys, MD5 placement, 24 h → 365-day retention, at-least-once ordering
- Do shard-count, throughput and cost math by hand, including hot partitions and KPL aggregation
- Apply the Streams versus Firehose versus MSK matrix, then trace CDC, replayability, fan-in/fan-out and state

**Content Outline:**
- 1. Batch or streaming? The Task 1.1 decision
- 2. The S3 landing zone: prefixes, multipart, triggers
- 3. AWS DMS: full load, full load + CDC, CDC only
- 4. Managed ingestion lanes: AppFlow, Transfer Family, Snow Family, data APIs
- 5. Amazon Kinesis Data Streams: shards, partition keys, retention
- 6. Worked math: shard counts, throughput and cost
- 7. Amazon Data Firehose: buffers, destinations, near-real-time
- 8. Amazon MSK: brokers, MSK Serverless, IAM authentication
- 9. Streams vs Firehose vs MSK: the decision matrix
- 10. CDC patterns end to end
- 11. Replayability, fan-in/fan-out and state (Tasks 1.1.10 – 1.1.12)
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 1, Task 1.1 — skills 1.1.1 through 1.1.12 quoted verbatim in the lesson's opening reference card.

**Real-World Application:** **Hearst** (30 TB/day clickstream), **AGCO** (telemetry fan-out), **FINRA** (37 B records/day into a replayable lake), **Baqend** (nightly batch → sub-minute dashboards).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 9 "Did you know?" · 2 `[!WARNING]` · 3 `[!IMPORTANT]` · 3 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 03: Serverless Transformation with AWS Glue and DataBrew

**Duration:** 75 minutes (1,094 lines)

**Hook:** "Transformation is where a data engineer's judgment becomes visible. Ingestion can be bought as a managed pipe; storage can be rented by the gigabyte. But deciding **which engine** runs the job, **how much capacity** it holds while it runs, **which records** are processed on the second run, and **where rejected rows** go — that is design work…"

**Learning Objectives:**
- Model the serverless Glue job: job types, anatomy, Data Catalog integration, run states and timeouts
- Separate `DynamicFrame` from `DataFrame` and drive `resolveChoice` → `apply_mapping` → `toDF()` in the right order
- Operate job bookmarks (Enable/Disable/Pause, `job.init`, `job.commit`, `transformation_ctx`) and name the five ways they break
- Wire triggers into serial, conditional and scheduled topologies and respect the two hard trigger limits
- Size workers and DPU-hours on the October-2026 price list, including the G-versus-R memory trap and the crawler's 10-minute minimum
- Design error handling (`ErrorsAsDynamicFrame`, `Spigot`, `EvaluateDataQuality`, retries, timeouts) and tune performance

**Content Outline:**
- 1. Glue ETL fundamentals: a serverless Spark engine with a catalog attached
- 2. DynamicFrame versus DataFrame: the single most-tested Glue concept
- 3. Job bookmarks: incremental batch processing without duplicates
- 4. Triggers: serial, conditional and scheduled topologies
- 5. Worker types and DPU sizing: where the bill comes from
- 6. Glue Studio: visual ETL over the same engine
- 7. AWS Glue DataBrew: preparation and profiling without code
- 8. Error handling: reject rows, retries, and where failures go
- 9. Performance: insights, partitions and the small-file tax
- 10. Connections, encryption and the version ladder
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 1's transformation task statements — *"preparing data for transformation (AWS Glue DataBrew)"*, *"using AWS Glue features to process data"* and *"using Lambda to automate data processing"*.

**Real-World Application:** **BMW Group** (Glue as the schema layer of a cloud lake), **PayU** (Glue ETL into a shared warehouse), **Integral Ad Science** (the catalog as the authorization plane), **Nasdaq** (S3 as the batch landing zone).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 04: Amazon Redshift: Warehouse SQL and Data Transformation

**Duration:** 75 minutes (1,061 lines)

**Hook:** "Lesson 3 ended with data landing in S3. This lesson is what happens next. Amazon Redshift is the service the DEA-C01 exam guide names in **every domain** — as a read source (skills 1.1.1, 1.1.2), as a transformation engine (1.2.5), as 'SQL queries to transform data … for example, Amazon Redshift stored procedures' (1.4), as a migration/remote-access method through **federated queries, materialized views and Spectrum** (2.1.5), as the subject of **load and unload operations** (2.3.1), as a schema-design target (2.4.1), and as a permissions and data-sharing surface (4.2.3, 4.2.4, 4.5.1)."

**Learning Objectives:**
- Read RA3 architecture — leader node, slices, and how Redshift Managed Storage bills separately from compute
- Size Redshift Serverless on RPUs, base capacity and the workgroup/namespace split
- Price Spectrum on bytes scanned and explain why format, compression and pruning are cost controls
- Separate cross-database queries from data sharing and from federated queries
- Master `COPY` versus `UNLOAD` versus `MERGE`, plus PL/pgSQL and materialized views (including the 27 February 2026 auto-refresh change)
- Pick distribution styles and sort keys from worked join, redistribution and skew examples

**Content Outline:**
- 1. RA3 architecture and Redshift Managed Storage
- 2. Redshift Serverless
- 3. Amazon Redshift Spectrum
- 4. Cross-database queries
- 5. Data sharing
- 6. COPY, UNLOAD and MERGE: the three load-path verbs
- 7. Stored procedures (PL/pgSQL) — the exam scope
- 8. Materialized views versus views
- 9. Federated queries and the query surface around them
- 10. Distribution styles and sort keys: where the join cost is decided
- 11. Automatic maintenance and workload management
- 12. Redshift or Athena? The decision matrix
- Real-World Case Studies · Practice Questions

**Exam alignment:** Redshift's cross-domain footprint — 1.1.1/1.1.2, 1.2.5, 1.4, 2.1.5, 2.3.1, 2.4.1, 4.2.3, 4.2.4, 4.5.1 — taught as one story because the exam never asks about it in isolation.

**Real-World Application:** **GE Aerospace** (legacy ODS rewritten on Redshift), **PayU** (consolidation plus sharing across five clusters), **Nasdaq** (a lake house with Redshift on the read path), **Amazon Customer Service** (RA3 and the compute/storage split).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 05: Orchestrating Data Pipelines: Step Functions, EventBridge and Airflow

**Duration:** 75 minutes (1,153 lines)

**Hook:** "A data pipeline that transforms correctly but **starts late**, **runs twice**, **silently skips a failed step** or **cannot be replayed** has still failed. Ingestion and transformation (Lessons 02 and 03) decide *what* moves and *how* it is reshaped; orchestration decides **when it runs, in what order, what happens when it fails, and how you recover**."

**Learning Objectives:**
- Separate Standard and Express workflows on duration, delivery guarantee, billing and integration patterns
- Read and write Amazon States Language — the eight state types, `Retry`, `Catch`, built-in error names, terminal errors
- Choose between inline and Distributed `Map` and size `ItemReader`, `ItemBatcher`, `ResultWriter`
- Build EventBridge rules, buses, targets, retry policies and DLQs; use Pipes and Scheduler correctly
- Describe an MWAA environment (DAGs in S3, Fargate workers, Aurora PostgreSQL metadata) and wire Glue Workflows
- Apply the selection matrix and the retry / DLQ / idempotency / backfill patterns

**Content Outline:**
- 1. The orchestration surface: five primitives, one job
- 2. AWS Step Functions: Standard versus Express
- 3. Amazon States Language: the eight state types
- 4. The Map state: inline versus Distributed
- 5. Amazon EventBridge: rules, buses, retries and DLQs
- 6. EventBridge Pipes and EventBridge Scheduler
- 7. Amazon MWAA: managed Apache Airflow
- 8. AWS Glue Workflows and triggers
- 9. The orchestration selection matrix
- 10. Retry, DLQ, idempotency and backfill patterns
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 1, Task 1.3 "Orchestrate data pipelines" — skills 1.3.1 orchestration services, 1.3.2 resilient and scalable pipelines, 1.3.3 serverless workflows, 1.3.4 SNS/SQS alerts.

**Real-World Application:** **Edmunds.com** (a serverless fan-out batch job), **EOS Group** (a staged migration pipeline with zero data loss), **Nasdaq** (a deadline-driven nightly batch across a lake house), **AGCO** (a streaming pipeline one person can operate).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 9 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 06: Programming Concepts for Data Operations

**Duration:** 60 minutes (1,203 lines — the longest lesson in the course)

**Hook:** "Every pipeline you have studied so far moves and reshapes data. This lesson asks the question underneath: **what code runs, and why does it behave the way it does?** DEA-C01 answers that in Domain 1, **Task 1.4**, and the task statement is deliberately narrow. The exam guide lists **'language-agnostic programming concepts'** as in scope and **'programming language-specific syntax'** as out of scope…"

**Learning Objectives:**
- Map each language-agnostic concept to the construct the exam expects (handler, `resolveChoice`, `CASE WHEN`, Choice state, layers)
- Separate pandas on one node from PySpark across partitions and name the crossover honestly
- Apply lazy evaluation: transformations build a plan, an action triggers compute, a shuffle is where the cost lands
- Size partitions, choose `coalesce` or `repartition`, and explain why gzip files hurt
- Configure Lambda for data work: event sources, concurrency pool, 900-second ceiling, memory-coupled CPU, layers
- Distinguish at-least-once delivery from an exactly-once effect; build idempotent writes, watermarks and poison-pill handling

**Content Outline:**
- 1. Programming concepts the exam actually tests
- 2. Python and PySpark patterns for data operations
- 3. SQL patterns the exam keeps re-asking
- 4. AWS Lambda for data tasks
- 5. The Lambda vs Glue vs Batch decision matrix
- 6. Idempotency, watermarks and poison pills
- 7. Nested data: flattening, and schema-on-read versus schema-on-write
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 1, Task 1.4 — skills 1.4.1–1.4.11 (SQL and query optimization, IaC, Git, CI/CD, distributed computing, data structures and algorithms, Lambda concurrency, SAM, mounting volumes), with syntax explicitly out of scope.

**Real-World Application:** five cases — **EMX**, **AppsFlyer**, **Hearst**, **Nasdaq**, **PayU** — each read as a *construct-in-production* story rather than a marketing number.

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 8 "Did you know?" · 4 `[!WARNING]` · 3 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 07: Choosing Data Stores and Storage Formats

**Duration:** 75 minutes (1,081 lines)

**Hook:** "Ask ten candidates how they choose a database and you will hear ten versions of 'it depends' — and on DEA-C01 that answer scores nothing. The exam does not reward vague architecture taste; it rewards a **deterministic mapping**: one access pattern in the stem, one service out of the in-scope list, one format at rest, one compression codec."

**Learning Objectives:**
- Read task 2.1 skill by skill and build the in-scope store taxonomy the exam draws from
- Map access pattern → service with a master table and a decision tree walkable in seconds
- Size DynamoDB with capacity-unit arithmetic and its 400 KB / 10 GB ceilings
- Separate Redshift, Athena and OpenSearch by what the query actually does
- Pick a format from the CSV/JSON/Avro/Parquet/ORC matrix and a codec from AWS's own wording
- Reason about S3 as the lake core (3,500 / 5,500 requests per partitioned prefix, no prefix limit, strong consistency since 1 December 2020) and about Iceberg, Hudi and Delta at exam depth

**Content Outline:**
- 1. What task 2.1 actually tests
- 2. Access pattern → service: the master map
- 3. Key-value, document, graph and in-memory stores
- 4. Relational OLTP: Amazon RDS and Amazon Aurora
- 5. Analytics stores: Redshift, Athena and OpenSearch
- 6. The storage-format matrix
- 7. Compression codecs: Snappy, GZIP, ZSTD, ZLIB
- 8. Amazon S3 as the data-lake core
- 9. The lakehouse layer: Iceberg, Hudi and Delta
- 10. Decision tables for exam scenarios
- 11. Cross-service consumption: Athena versus Redshift
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 2, Task 2.1 — skills 2.1.1, 2.1.2, 2.1.3, 2.1.7 (open table formats, e.g. Apache Iceberg) and 2.1.8 (vector index types, e.g. HNSW and IVF).

**Real-World Application:** **Nasdaq** (S3 write path, Redshift read path), **EMX** (S3 + Athena instead of a backend warehouse), **EOS Group** (DMS → S3 → Redshift with PII masked in place), **GE Aerospace** (modernising a legacy ODS).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 08: Data Modeling, Glue Catalog and Schema Evolution

**Duration:** 75 minutes (1,012 lines)

**Hook:** "Two DEA-C01 Domain 2 tasks meet in this lesson… The exam treats them as one story: a **model** is only as good as the **catalog** that describes it, and a catalog is only safe if you can **change** what it describes without breaking every consumer."

**Learning Objectives:**
- Read the Glue Data Catalog object model — catalog, database, table, `StorageDescriptor`, `PartitionKeys`, `classification` — and its quotas
- Run a crawler in your head: custom classifiers in order, first success wins, built-ins only if none matched
- Separate partition indexing, pruning and Athena partition projection
- Operate table versioning and assemble a blue/green table swap from verified building blocks
- Choose star versus snowflake, set grain, identify facts/dimensions/surrogate keys, implement SCD 1 versus SCD 2
- Classify schema changes as additive or breaking, and design a DynamoDB single-table model from access patterns

**Content Outline:**
- 1. The Glue Data Catalog object model
- 2. Crawlers and classifiers: how a schema gets discovered
- 3. Synchronizing partitions: indexing, pruning and projection
- 4. Table versioning, compare and blue/green swaps
- 5. Resource links and cross-account sharing
- 6. Dimensional modeling: grain, facts, dimensions, star versus snowflake
- 7. Slowly changing dimensions: Type 1 versus Type 2
- 8. Denormalization and physical design in Redshift
- 9. Schema evolution: additive versus breaking
- 10. DynamoDB single-table design: access patterns first
- 11. Partitioning, bucketing, sorting, compression — the elimination ladder
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 2, Task 2.2 (understand data cataloging systems) and Task 2.4 (design data models and schema evolution), taught as one story.

**Real-World Application:** **BMW Group** (schemas in Glue, data in S3), **GoDaddy** (a data mesh on one shared catalog), **Integral Ad Science** (hundreds of rules collapse into two tags).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` · 8 "Did you know?" · 3 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 09: Data Lifecycle, Migration and Lake Organization

**Duration:** 60 minutes (1,001 lines)

**Hook:** "**Task 2.3, 'Manage the lifecycle of data,'** is where a data engineer stops being a builder and becomes a steward… The exam therefore rewards one habit above all others: **know exactly what happens to a specific object, on a specific day, at a specific price.**"

**Learning Objectives:**
- Read an S3 Lifecycle rule as AWS defines it — `ID`, `Status`, `Filter` and the five action types — including the evaluation quirks
- Walk the one-way transition waterfall and separate minimum transition age from minimum storage duration
- Compute lifecycle money: transition request fees, Standard vs IA break-even, the minimum-duration cliff, a one-year class comparison
- Operate versioning, delete markers, MFA Delete and the CRR/SRR prerequisites; apply Object Lock modes
- Configure DynamoDB TTL (epoch seconds, deletion lag) and build the TTL + Streams archival pipeline
- Choose a Glacier class by retrieval SLA, pick the right migration tool, and lay out medallion bronze/silver/gold zones

**Content Outline:**
- 1. S3 Lifecycle: how a rule is actually built
- 2. Transitions: the waterfall and the age gates
- 3. Expiration: what "delete" means, by versioning state
- 4. Lifecycle cost math: four worked examples
- 5. Versioning, delete markers and MFA Delete
- 6. Replication: CRR and SRR prerequisites
- 7. S3 Object Lock: retention that lifecycle cannot override
- 8. DynamoDB TTL: epoch seconds, deletion lag, and the archival pipeline
- 9. Archive selection: choose by retrieval SLA, not by price
- 10. Migration tooling I: AWS DMS and schema conversion
- 11. Migration tooling II: Snow Family, DataSync and Transfer Family
- 12. Redshift load and unload: Task 2.3's first skill
- 13. Data-lake organization: medallion zones, small files and cataloging
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 2, Task 2.3 "Manage the lifecycle of data" — hot/cold storage, cost optimisation, deletion by business and legal requirement, retention, archiving and resiliency protection.

**Real-World Application:** **Nasdaq** (an S3 lake with Glacier and Object Lock), **EOS Group** (DMS-led warehouse migration), **FINRA** (a regulated S3 lake at surveillance scale), **BMW Group** (an on-premises lake replaced by S3 zones and the Glue catalog).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 8 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 10: Monitoring and Observability for Data Pipelines

**Duration:** 60 minutes (963 lines)

**Hook:** "Two exam tasks meet in this lesson. **Task 3.3, maintain and monitor data pipelines**… **Task 4.4, prepare logs for audit**… The exam treats them as one discipline with two questions: **what happened** (audit evidence) and **what is happening right now** (operational signal)."

**Learning Objectives:**
- Separate the audit plane from the operations plane and place management, data and Insights events correctly
- Choose between service metrics, custom metrics and Embedded Metric Format with the cardinality and permission traps
- Design alarms: states, state-change actions, missing data, composite and log alarms, dashboards, metric math
- Use metric filters, subscription filters and Logs Insights without mixing them
- Monitor each pipeline stage natively: Glue, Kinesis, Redshift, EMR, Lambda, DMS, Step Functions, S3, EventBridge
- Apply logging best practice: structured JSON, correlation IDs, PII data-protection policies, retention

**Content Outline:**
- 1. Two planes of evidence: audit versus operations
- 2. CloudWatch metrics: service, custom, embedded
- 3. CloudWatch alarms: states, actions and combining them
- 4. Dashboards and metric math
- 5. CloudWatch Logs: groups, retention, metric filters, subscription filters
- 6. CloudWatch Logs Insights: querying the evidence
- 7. Amazon Kinesis Data Streams (metrics)
- 8. AWS Glue: DPU, bookmarks, observability and job insights
- 9. Amazon Redshift: three planes of evidence
- 10. Amazon EMR: YARN and the 5-minute default
- 11. AWS Lambda: throttles, duration and errors
- 12. AWS DMS: CDC latency is two numbers, not one
- 13. AWS Step Functions: execution history and backlog
- 14. Amazon S3: request metrics versus storage metrics
- 15. Amazon EventBridge: invocations, failures and the dead-letter queue
- 16. Logging best practices for pipelines
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3, Task 3.3 (skills 3.3.1–3.3.8) plus Domain 4, Task 4.4 (skills 4.4.1–4.4.5) — 13 skills in one discipline; AWS X-Ray is named on the out-of-scope list.

**Real-World Application:** **AGCO** (one person running a telemetry pipeline), **FINRA** (regulated scale and the audit plane), **Nasdaq** (two paths, two sets of alarms), **Oportun** (discovering PII that nobody indexed).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 11: Automating Data Quality in Pipelines

**Duration:** 60 minutes (1,087 lines)

**Hook:** "Data quality is the one Domain 3 topic that other topics silently depend on: a perfectly orchestrated pipeline that moves wrong rows on schedule is worse than no pipeline at all… everything examinable hangs off that word **while**. A weekly profile of the landing zone is a report; a check that runs inside the job, splits the rows and gates the next step is engineering."

**Learning Objectives:**
- Defend the "while processing" rule against end-of-pipeline distractors
- Map the six quality dimensions to AWS-native expressions and to the scenarios the exam writes
- Build the seven-check in-flight checklist in DQDL, DataBrew and PySpark
- Operate Glue Data Quality: rules, analyzers, rule sets, the 26 Studio rule types, row-level outcomes, three failure actions
- Operate DataBrew quality: rule anatomy, rule sets in profile jobs, findings, the validation report
- Gate orchestration on a quality score with EventBridge payloads and a Step Functions `Choice`, then decide quarantine versus fail

**Content Outline:**
- 1. Task 3.4: what "while processing" actually means
- 2. The six dimensions, mapped to exam scenarios
- 3. The in-flight checklist: seven checks, placed at stage boundaries
- 4. AWS Glue Data Quality: DQDL, rule sets, outcomes
- 5. AWS Glue DataBrew: rules, rule sets, findings
- 6. Glue job quality patterns: assertions, error tables, quarantine
- 7. Schema drift detection: what actually sees a changed shape
- 8. Orchestration: gate the pipeline on the quality result
- 9. Quarantine versus fail-the-job — and the tradeoff the exam actually asks
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3, Task 3.4 — skills 3.4.1 "Run data quality checks **while** processing the data", 3.4.2 define rules (DataBrew), 3.4.3 investigate consistency, 3.4.4 sampling, 3.4.5 data skew.

**Real-World Application:** **Nasdaq** (timeliness as the binding dimension), **PayU** (consistency and freshness across 40 databases), **FINRA** (volume and completeness under a regulator's clock), **Hearst** (30 TB/day gated per batch).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 6 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 12: Troubleshooting, Performance and Cost Optimization

**Duration:** 75 minutes (967 lines)

**Hook:** "Domain 3 of DEA-C01 is **Data Operations and Support, 22 % of the exam**, and its task statements say the same thing four different ways: *troubleshoot performance issues* (3.3.4), *troubleshoot and maintain pipelines such as AWS Glue and Amazon EMR* (3.3.6), *analyze logs with AWS services* (3.3.8), and *implement data skew mechanisms* (3.4.5). This lesson is the union of those skills: a repeatable triage loop, one symptom→cause→fix map per service, and the arithmetic that turns 'make it cheaper' into a defensible answer."

**Learning Objectives:**
- Run the four-step triage loop (log → metric → plan → lever → measure) and the failure taxonomy
- Size and tune Glue: DPU and worker types, partition math, bookmarks, `repartition` vs `coalesce`, small files
- Diagnose Redshift: dist/sort mistakes, `SVV_TABLE_INFO` skew, auto VACUUM/ANALYZE, WLM, Spectrum pruning, `EXPLAIN`
- Right-size EMR (roles, node arithmetic, Spot task nodes, HDFS vs S3) and fix Kinesis hot shards and iterator age
- Operate Lambda concurrency, reserved vs provisioned concurrency, timeouts and asynchronous retries
- Apply the per-service cost-lever table and the MOST operationally efficient / LEAST costly stem heuristics

**Content Outline:**
- 1. The triage loop and the failure taxonomy
- 2. Data-shape failures: drift, corrupt files, encoding
- 3. AWS Glue performance: DPU, workers, bookmarks, small files
- 4. Amazon Redshift: distribution, skew, maintenance, plans
- 5. Amazon EMR: sizing, Spot task nodes, HDFS versus S3
- 6. Amazon Kinesis Data Streams: hot shards, iterator age, capacity modes
- 7. AWS Lambda: concurrency, timeouts, cold starts, retries
- 8. Cost levers per service
- 9. Cost versus performance: the tradeoff table and the stem heuristics
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 3's four troubleshooting statements plus 2.1.1 (storage for cost and performance) and 3.2.5 (provisioned vs serverless tradeoffs), with us-east-1 list prices as of October 2026.

**Real-World Application:** **Amazon Customer Service** (right-sizing a warehouse), **Paytm** (a phased cost lever on EMR), **GE Aerospace** (a legacy ODS rebuilt on Redshift), **Edmunds.com** (three levers, one bill).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 13: Security, Encryption and IAM for Data Pipelines

**Duration:** 75 minutes (1,007 lines)

**Hook:** "Every pipeline is a chain of authorised calls: a Glue job assumes a role, decrypts a CMK-wrapped data key, reads `s3://raw/`, writes `s3://curated/`, and hands Redshift a manifest. Break any link — a key policy that never enabled IAM, a grant nobody revoked, a bucket policy that denies `aws:SecureTransport` — and the pipeline fails with an error message that names the *last* hop, not the real cause."

**Learning Objectives:**
- Separate customer managed, AWS managed and AWS owned KMS keys — who owns, who pays, who can share
- Evaluate access the way KMS does: key policy first, then IAM and grants, explicit Deny always winning
- Apply envelope encryption, its 4,096-byte direct-API cap, and what rotation does *not* re-encrypt
- Price KMS per use (key fee, request fee, free tier, Bucket Keys) with October-2026 numbers
- Build the at-rest matrix for S3, Glue, Redshift, Kinesis, DynamoDB, EMR and Athena, and enforce TLS in transit
- Write least-privilege pipeline roles, wire cross-account access through the four documents that must agree, and choose Secrets Manager vs Parameter Store SecureString

**Content Outline:**
- 1. The Domain 4 task map: where this lesson lands
- 2. AWS KMS key ownership: customer managed, AWS managed, AWS owned
- 3. Key policies versus IAM policies versus grants
- 4. Envelope encryption: how bulk data actually gets encrypted
- 5. Rotation and grants: what is automatic, what is optional, what is dangerous
- 6. KMS pricing: pay for keys and for use
- 7. Encryption at rest: the per-service matrix
- 8. Encryption in transit: TLS everywhere, and the two enforcement patterns
- 9. IAM for data services: roles, least privilege, and the anti-pattern
- 10. Cross-account access: the four documents that must agree
- 11. S3 access: bucket policies, ACLs, endpoints, presigned URLs
- 12. Secrets Manager versus Parameter Store SecureString
- 13. Security groups and PrivateLink: keeping pipeline traffic off the internet
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 4's chain — authentication (4.1), authorization (4.2), encryption and masking (4.3), audit logs (4.4), privacy and governance (4.5) — taught as decisions, defaults and sourced numbers.

**Real-World Application:** **Integral Ad Science** (hundreds of permission rules down to two), **FINRA** (a regulated stack on KMS, GuardDuty and CloudTrail), **Oportun** (finding the PII before the regulator does), **GoDaddy** (central governance over a multi-petabyte data mesh).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` · 7 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 14: Governance, Lake Formation and PII Protection

**Duration:** 75 minutes (1,189 lines)

**Hook:** "Domain 4 is worth **18 % of scored content**, and its last task — *Understand data privacy and governance* — is where the DEA-C01 exam stops asking 'can you move the data?' and starts asking 'who may see which row, in which Region, and how would you prove it a year later?' Two services carry almost all of that weight: **AWS Lake Formation**… and **Amazon Macie**… Both are routinely miscast on practice tests — Lake Formation as an IAM replacement, Macie as a blocking tool — and both miscasts cost marks."

**Learning Objectives:**
- Defend the "two doors, both must open" rule that decides most lake-access questions
- Read permission anatomy at catalog, database, table, S3-location, LF-Tag and resource-link level
- Build column-, row- and cell-level controls with Lake Formation data filters, including their PartiQL limits
- Apply LF-Tags (ABAC): predefine, assign, inherit, cascade, AND/OR grant semantics
- Share cross-account and cross-Region with AWS RAM, resource links and separate target grants
- Operate Macie discovery (never prevention), Redshift datashares, lineage and privacy at exam depth

**Content Outline:**
- 1. Domain 4's governance map: the eight skills this lesson answers
- 2. THE exam distinction: Lake Formation vs IAM for S3 lake access
- 3. The permission model: database, table, column, row
- 4. LF-Tags: attribute-based access control and the cascade
- 5. Data sharing: cross-account, cross-Region, governed tables, blue/green
- 6. Engine integration: Glue, Athena, Spectrum, QuickSight, EMR, Redshift
- 7. Amazon Macie: discovery, not prevention
- 8. Data sharing in Amazon Redshift
- 9. Lineage: SageMaker ML Lineage Tracking and catalog versioning
- 10. Privacy at exam depth: PII, residency, erasure, audit, compliance
- Real-World Case Studies · Practice Questions

**Exam alignment:** Domain 4 skills 4.2.4, 4.2.5, 4.4.1, 4.5.1, 4.5.2, 4.5.3, 4.5.5 and 4.5.7 — the governance half of the domain.

**Real-World Application:** **Integral Ad Science** (hundreds of rules collapsed to two), **Oportun** (PII discovery leadership could act on), **GoDaddy** (a central governance account feeding a data mesh), **EOS Group** (PII masking after a DMS → S3 → Redshift migration).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 7 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 15: Exam Simulation A: Practice Set and Strategy

**Duration:** 90 minutes (960 lines)

**Hook:** "Fourteen lessons gave you the content. This one gives you the **container**: how a DEA-C01 item is actually built, how the 130-minute clock behaves, how AWS writes a distractor, and then **Set A** — twenty exam-style items you sit under time and grade honestly. Everything before this lesson was domain knowledge; everything here is *test craft*, and on a compensatory 100–1,000 scale with **720** to pass, test craft is worth as much as another hour of revision."

**Learning Objectives:**
- Restate every published logistics number (65 / 50 / 15, 130 minutes, 720/1,000, 150 USD, 3 years, 14 days) without notes
- Run the 120-second pacing math and defend a two-pass flag-and-sweep plan that never leaves an item blank
- Read a superlative stem — *MOST appropriate*, *LEAST costly*, *FIRST step*, *NOT* — and know which option the qualifier buys
- Run the five-move multiple-response procedure that survives all-or-nothing scoring
- Decode the distractor factories AWS reuses across all four domains
- Sit Set A, grade it **by domain rather than by total**, and route each miss to the right lesson

**Content Outline:**
- 1. The container: what the 130 minutes actually are (1.1 logistics · 1.2 pacing · 1.3 flag-and-sweep · 1.4 reading the stem · 1.5 multiple-response technique · 1.6 domain weights and the Set A blueprint · 1.7 distractor families and what this lesson will not assert)
- `### 2026 Updates (as of October 2026)`
- Real-World Case Studies — two worked studies (the hot partition key; the Athena bill)
- Real-World Case Drills — **AGCO** (one streaming story, three domains) and **Integral Ad Science** (hundreds of rules become two)
- Practice Questions — **Set A: 20 items in published weight order (D1 7 / D2 5 / D3 4 / D4 4)**, plus extension items 21–22 built from the case drills

**Exam alignment:** all four domains at once — the blueprint, the rubric and the routing cues are all organised by D1–D4 with their published weights (34 / 26 / 22 / 18 %).

**Real-World Application:** the two case drills turn a published customer story into a markable stem, and the lesson's `Points this lesson deliberately does not assert` list isolates everything it could not verify against a first-party AWS page.

**Practice Questions:** 22 multiple-choice (Set A's 20 + 2 extension items) + 3 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 22 `question` · 3 `matching` · 1 `fillblank` · 1 `dragdrop` · 5 `mermaid` · 7 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 16: Exam Simulation B: Second Set, Traps and Exam Day

**Duration:** 90 minutes (1,042 lines)

**Hook:** "Fifteen lessons gave you the content and Set A gave you a first sitting. A **second** sitting measures something different: not whether you know AWS Glue, but whether you can hold **Glue job bookmarks apart from streaming watermarks**, or **Redshift distribution apart from sorting**, *while the clock runs*… On a compensatory 100–1,000 scale with **720** to pass, discrimination is what separates a comfortable pass from a 705."

**Learning Objectives:**
- State the one-line correct framing for each of the **twenty trap pairs** most likely to cost marks
- Spot a *half-true option* — the distractor that swaps exactly one attribute of a pair — and kill it in one clause
- Handle multiple-response stems with a procedure that never assumes partial credit
- Run the arithmetic the exam actually asks for: DPU-hour cost, storage-class cost, bytes-scanned billing, weights-to-items
- Recite the official exam-day logistics — IDs, arrival, check-in, in-exam controls, score timing
- Grade Set B by domain block against explicit ready-versus-not-ready thresholds and run the dip-driven 7-day plan

**Content Outline:**
- 1. Strategy: trap pairs and how the exam weaponises them
- 2. Strategy: the item shapes, the blueprint and the clock
- 3. Real-World Case Drills — **Integral Ad Science** and **Hearst**
- `## Real-World Case Drills` — **Nasdaq** (70 billion records a day, an archive that cannot be rewritten) and **Oportun** (Macie finds the PII, you respond)
- 4. Practice Questions — **Set B: 20 items in published weight order (7 / 5 / 4 / 4)**, with per-option teardowns, plus §4.5 two extra discrimination items built from the 2025–2026 changes and explicitly not counted in the /20 grade
- 5. TRAP DRILL — the top twenty pair lines
- 6. EXAM DAY — logistics, check-in and the clock
- 7. Grading Set B and routing to your weak areas
- 8. The final 7-day plan

**Exam alignment:** all four domains at once — Set B is graded in the 7 / 5 / 4 / 4 blueprint, and the routing table sends each miss back to the lesson that owns the skill.

**Real-World Application:** this lesson deliberately has **no** `Real-World Case Studies` section; its four case drills (IAS, Hearst, Nasdaq, Oportun) each state which domain the stem would test and offer three candidate stem shapes. Four ` ```interactive ` wrapper blocks carry the case-drill matcher, the trap-pair matcher, the exam-day numbers fillblank and the 7-day-plan drag-and-drop.

**Practice Questions:** 22 multiple-choice (Set B's 20 + 2 ungraded discrimination items) + 1 fillblank + 4 wrapper interactive exercises (2 matching, 1 fillblank, 1 dragdrop).

**Verified block counts:** 22 `question` · 0 `matching` fence · 1 `fillblank` · 0 `dragdrop` fence · 4 `interactive` wrappers · 5 `mermaid` · 9 "Did you know?" · 1 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

## Interactive Components

### Inventory by Type

| Type | Fence | Count | Role in the course |
|------|-------|-------|--------------------|
| Multiple-choice items | `question` | **240** | The exam-shape drill: 14 per lesson in L01–L14 (196), 22 each in L15 and L16 (44) |
| Matching | `matching` | **17** | 1 per lesson in L01–L14, 3 in L15, 0 in L16 |
| Fill-in-the-blank | `fillblank` | **16** | Exactly one per lesson — recall of exact numbers |
| Drag-and-drop | `dragdrop` | **15** | 1 per lesson in L01–L15, 0 in L16 |
| Typed interactive subtotal | — | **48** | 17 + 16 + 15 |
| Wrapper interactive blocks | `interactive` | **4** | L16 only: 2 `matching`, 1 `fillblank`, 1 `dragdrop` payload |
| **Interactive exercises, all forms** | — | **52** | matching 19 · fillblank 17 · dragdrop 16 |
| Mermaid diagrams | `mermaid` | **91** | Architecture and decision flowcharts embedded in the prose |
| ASCII reference cards | `text` | **148** | The `====…` at-a-glance card that opens most lessons and pins the task map |
| SQL payloads | `sql` | **17** | COPY/UNLOAD/MERGE, window functions, `PIVOT`, Athena queries |
| JSON payloads | `json` | **15** | Request/response and event shapes |
| Python payloads | `python` | **6** | Glue/PySpark snippets (lazy evaluation, repartition, UDF ladder) |
| Plot blocks | `plot` | **7** | Numeric visualisation (skill-density chart, price charts) |
| **All labelled fence openers** | — | **576** | Openers and bare closers match 1:1 (576 / 576) — no labelled closing fences anywhere in the course |

### Non-Block Interactive Devices

| Device | Count | Notes |
|--------|-------|-------|
| "Did you know?" curiosities (`> **📚 Did you know?**`) | **122** | One per ~138 lines; each carries a fact the exam can turn into a distractor |
| `[!WARNING]` callouts | **37** | Trap markers: the wrong-but-plausible answer |
| `[!IMPORTANT]` callouts | **28** | Non-negotiable rules and the per-lesson Comparative Verdict |
| `[!NOTE]` callouts | **25** | Clarifications and scope notes |
| `[!SUCCESS]` callouts | **16** | The closing Key Takeaways list, one per lesson |
| `Key Takeaways` blocks | **16** | One per lesson |
| `Comparative Verdict` blocks | **16** | Other cloud × self-managed/on-premises × another AWS service × financial lever |
| `Real-World Case Studies` sections | **15** | One per lesson except L16 |
| `2026 Updates (as of October 2026)` boxes | **16** | One per lesson |
| Named case headings (`### Case …`) | **64** | 4 per lesson, 5 in L06, 3 in L08, 4 each in L15/L16 |

### Distribution Across Lessons

| Lesson | Lines | Min | `question` | `matching` | `fillblank` | `dragdrop` | `mermaid` | "Did you know?" |
|--------|-------|-----|-----------|-----------|------------|-----------|----------|----------------|
| L01 | 981 | 90 | 14 | 1 | 1 | 1 | 6 | 7 |
| L02 | 1,015 | 75 | 14 | 1 | 1 | 1 | 5 | 9 |
| L03 | 1,094 | 75 | 14 | 1 | 1 | 1 | 5 | 8 |
| L04 | 1,061 | 75 | 14 | 1 | 1 | 1 | 7 | 7 |
| L05 | 1,153 | 75 | 14 | 1 | 1 | 1 | 5 | 9 |
| L06 | 1,203 | 60 | 14 | 1 | 1 | 1 | 5 | 8 |
| L07 | 1,081 | 75 | 14 | 1 | 1 | 1 | 5 | 7 |
| L08 | 1,012 | 75 | 14 | 1 | 1 | 1 | 7 | 8 |
| L09 | 1,001 | 60 | 14 | 1 | 1 | 1 | 6 | 8 |
| L10 | 963 | 60 | 14 | 1 | 1 | 1 | 5 | 7 |
| L11 | 1,087 | 60 | 14 | 1 | 1 | 1 | 6 | 7 |
| L12 | 967 | 75 | 14 | 1 | 1 | 1 | 5 | 7 |
| L13 | 1,007 | 75 | 14 | 1 | 1 | 1 | 7 | 7 |
| L14 | 1,189 | 75 | 14 | 1 | 1 | 1 | 7 | 7 |
| L15 | 960 | 90 | 22 | 3 | 1 | 1 | 5 | 7 |
| L16 | 1,042 | 90 | 22 | 0 (+4 wrapper) | 1 | 0 (+4 wrapper) | 5 | 9 |
| **Total** | **16,816** | **1,185** | **240** | **17** | **16** | **15** | **91** | **122** |

Every column sums to the independently verified figure: 240 multiple-choice items carrying **240 unique `dea-NN-qN` IDs**, 48 typed interactive blocks plus 4 wrappers, 91 diagrams and 122 curiosities.

---

**Source of truth:** `content/courses/aws-dea-c01/course.json` + `content/courses/aws-dea-c01/en/*.md` + `.scratch/aws-dea/*.md`
**Statistics:** re-derived with `wc`, `grep` and both `course-writer` validators on 10 October 2026; all counts in this document match the files as shipped.
**Status:** English complete; PT/ES deferred.
**Exam logistics:** as of October 2026 — 130 minutes, 65 questions (50 scored + 15 unscored), 150 USD, scale 100–1,000 with 720 to pass, compensatory, no guessing penalty, guide v1.1 (12 December 2025).
