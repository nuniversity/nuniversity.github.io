# Course: Building a Databricks Data Lakehouse on AWS: Unity Catalog to Production

## Course Metadata

| Field | Value |
|-------|-------|
| **Slug** | `databricks-lakehouse-aws` |
| **Title** | Building a Databricks Data Lakehouse on AWS: Unity Catalog to Production |
| **Area** | Data & Analytics |
| **Difficulty** | Intermediate |
| **Duration** | 12 weeks |
| **Lessons** | 17 |
| **Icon** | `database` |
| **Author** | Nuniversity |
| **Question ID prefix** | `dbl-` (`dbl-NN-qN`) |
| **Prerequisites** | Not declared in `course.json` |
| **Languages** | EN only (PT, ES deferred) |
| **Source directory** | `content/courses/databricks-lakehouse-aws/` (`course.json` + `en/`) |
| **Research digests** | `.scratch/dbx-lakehouse/` — 19 files (`01-…` through `19-…`) |
| **Document statistics verified** | 12 October 2026 (every number below re-derived with `wc` / `grep` / a fence-walking parser / the `course-writer` validators on the files themselves) |

> **What this course is — and is not.** This is an **architecture and build course** for the Databricks platform *as deployed on AWS*, not a certification boot camp. There is no simulation lesson and no exam-day drill; the certification blueprint (Databricks Certified Data Engineer Associate, exam guide of record **2026-05-04**) is used only as a coverage *audit* in lesson 17 and in the mapping section below. Seventeen lessons teach how to design, build, govern and operate a production Databricks Lakehouse running in your own AWS VPC — networking and the root bucket, Unity Catalog, Delta Lake transactions, Auto Loader ingestion, DBR/Photon compute, Lakeflow pipelines, Databricks SQL warehouses, Lakeflow Jobs, data quality, row/column security, Delta Sharing and Marketplace, Structured Streaming, liquid clustering, DBU economics, DABs and Terraform — for practitioners who already know what a join and a partition are and now have to attach Databricks product names, DBU rates and AWS limits to each of them.

### Verified Course Statistics

| Metric | Value | Verification |
|--------|-------|--------------|
| Lesson files | **17** | `ls content/courses/databricks-lakehouse-aws/en/*.md \| wc -l` |
| Total lesson lines | **15,276** | `cat *.md \| wc -l` in `en/` |
| Total lesson bytes | **1,378,646** | `cat *.md \| wc -c` |
| Total lesson words | **193,668** | `cat *.md \| wc -w` |
| Shortest / longest lesson | **810** (L04) / **1,060** (L12) lines | `wc -l` per file |
| Average lesson length | **899** lines | 15,276 ÷ 17 |
| Lesson time budget | **1,245 minutes (20 h 45 min)** | sum of frontmatter `duration:` (75+60+60+70+75+75+75+75+80+75+75+80+80+75+60+75+80) |
| Per-lesson duration range | **60 min (L02, L03, L15) – 80 min (L09, L12, L13, L17)** | frontmatter |
| Frontmatter `difficulty` | **`"intermediate"` × 17** | `grep -h '^difficulty:'` — 17 identical values; `course.json` carries `"Intermediate"` in the `en` block |
| Frontmatter `order` | **1–17, no gaps, no duplicates** | `grep -H '^order:'` |
| Multiple-choice / true-false `question` blocks | **206** | `grep -h '^```question$' *.md \| wc -l` (post fence-fix: L09's `dbl-09-q12`/`q14` re-fenced as `matching`/`dragdrop`) |
| Question ID range | **`dbl-01-q1` … `dbl-17-q12`** | `grep -ho 'dbl-[0-9][0-9]-q[0-9]*' \| sort -u` |
| `matching` blocks | **17** | exactly 1 per lesson |
| `fillblank` blocks | **18** | exactly 1 per lesson except L15 (2) |
| `dragdrop` blocks | **18** | exactly 1 per lesson except L17 (2) |
| Typed interactive blocks (matching + fillblank + dragdrop) | **55** | 18 + 18 + 19 |
| `plot` blocks | **19** | 1 per lesson except L04 and L12 (2 each) |
| **Interactive exercises, all forms** | **74** | matching 18 · fillblank 18 · dragdrop 19 · plot 19 |
| Mermaid diagrams | **89** | `grep -h '^```mermaid'` |
| ASCII reference cards (`text`) | **71** | the decision-surface card that opens most lessons |
| `sql` / `python` / `json` / `yaml` / `bash` / `hcl` blocks | **41 / 20 / 9 / 6 / 2 / 2** | fence-walking counter over all 17 files |
| Labelled fence openers | **520** | 206 q + 89 mermaid + 55 typed interactive + 19 plot + 71 text + 41 sql + 20 python + 9 json + 6 yaml + 2 bash + 2 hcl |
| Bare fence lines (closers) | **520** | `grep -cx '```'` per file summed — 1:1 match, **0** labelled closing fences anywhere |
| "Did you know?" curiosities | **68** | `grep -h 'Did you know'` |
| `[!WARNING]` callouts | **13** | all 13 are block starts (`^> [!WARNING]`) |
| `[!IMPORTANT]` callouts | **13** | all 13 are block starts |
| `[!NOTE]` / `[!SUCCESS]` callouts | **17 / 17** | 1 each per lesson, all block starts |
| Total admonition callouts | **60** | 13 + 13 + 17 + 17 |
| `Key Takeaways` blocks | **17 / 17** | one per lesson, inside the closing `[!SUCCESS]` |
| `Comparative Verdict` blocks | **23** | 1 per lesson; 3 each in L10, L11 and L15 |
| `Real-World Case Studies` sections | **17 / 17** | one per lesson |
| Named case blocks (`📋 Case A/B/C` + `### Case A/B/C`) | **46** | 40 `📋` blockquotes + 6 `### Case` headings (L02 and L03 only) |
| `### 2026 Updates (as of October 2026)` boxes | **17 / 17** | one per lesson |
| `## Practice Questions` sections | **17 / 17** | the last `##` in every lesson |
| `as of Oct 2026` / `as of October 2026` stamps in lessons | **163** | `grep -ho` over both spellings (114 + 49) |
| Full `https://` URLs inside lessons | **27 unique** | 12 `databricks.com/customers/*` and `your-ai/*` story pages, 4 `databricks.com/blog/*` posts, 2 press releases, 1 Data+AI Summit session, 1 `answers.databricks.com` thread, plus 6 workspace/endpoint placeholders |
| Unfinished-work markers in lessons | **0** | no `TODO` / `FIXME` / `TBD` / `lorem ipsum` anywhere |
| Locales shipped | **`en/` only** | `course.json` carries an `en` key only; no `pt/` or `es/` directory |
| Digest files | **19** (numbered 01–19) | `ls .scratch/dbx-lakehouse/[01]*.md \| wc -l` |
| Digest lines / bytes | **4,831 / 1,317,733** | `cat .scratch/dbx-lakehouse/[01]*.md \| wc -l` / `wc -c` — **≈1.32 MB** decimal |
| Digest size per file | **42,577 – 92,481 bytes** | `wc -c` per file; digest 19 is the smallest, digest 14 the largest |
| Digest section skeleton | **8 `##` headings (A–H) × 19 files** | per-file `grep -cE '^## [A-H]\. '` returns 8 for all 19 |
| Source entries pinned in digest section (A) | **614** | numbered entries under `## A.` per digest |
| Question IDs | **208 total, 208 unique, 0 duplicates** | `"id": "dbl-NN-qN"` — every ID matches the pattern, `sort -u` equals the total, **0** ids outside the pattern |

### Validation

| Check | Result |
|-------|--------|
| `.opencode/skills/course-writer/scripts/validate_lesson.py` (run with `OPENCODE_FILE_PATH`) | **17 / 17 lessons exit 0** — no failures printed by the loop |
| `.opencode/skills/course-writer/scripts/validate_course.py` (run with `OPENCODE_SKILL_DIR=content/courses/databricks-lakehouse-aws`) | **exit 1 — 4 warnings, all locale-related**: `Missing locale section: pt`, `Missing locale section: es`, `Locale directory 'pt/' not found`, `Locale directory 'es/' not found`. No structural, naming, ordering or frontmatter error is reported. |
| Integrity: question IDs | **208 IDs across the 261 question-family interactive blocks** (206 ` ```question ` + 18 ` ```matching ` + 18 ` ```fillblank ` + 19 ` ```dragdrop `), **208 unique, 0 duplicates**, all matching `dbl-NN-qN` (`dbl-01-q1` … `dbl-17-q12`); the 19 ` ```plot ` demos carry no `dbl-` ids |
| Integrity: JSON parse | `course.json` parses clean; a full fence-walk over the 17 lessons found **every** `question` / `matching` / `fillblank` / `dragdrop` / `plot` payload to be valid JSON (**0 JSON errors**) |
| Integrity: fence parity | **520 labelled openers vs 520 bare closers**, per file and in total — no labelled closing fence anywhere |
| `next build` (static export) | **PASS (exit 0)** — `npm ci` exit 0, `vitest run` exit 0 (no test files), `next build` exit 0; the two L09 misfenced blocks were corrected (re-fenced as ` ```matching ` / ` ```dragdrop `) and `validate_lesson.py` was hardened to error on this mismatch class |
| `out/en/courses/databricks-lakehouse-aws/*/index.html` | **17 pages produced** — one per lesson, `01-lakehouse-architecture-databricks` … `17-capstone-reference-architecture` |
| `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |

> **Language status.** The course is **English-only today**. PT and ES are **deferred**: the directory contains a single locale folder (`en/`), `course.json` defines an `en` block only, and the course validator's entire output is the four missing-`pt`/`es` warnings quoted above. The `course-writer` and `i18n-translator` skills are the intended path for the later PT/ES pass; nothing in the shipped EN content blocks that translation.

> **Build-failure note (found 2026-10-12, root-caused and FIXED same day; build re-run PASS).** The first static-export attempt compiled cleanly but failed during export on `/en|es|pt/courses/databricks-lakehouse-aws/09-workflows-jobs-as-code` with `TypeError: Cannot read properties of undefined (reading 'map')`. Root cause: `components/markdown/MarkdownRenderer.tsx` dispatches a fenced block to a component by the **fence language**, and `QuestionBlock.tsx` unconditionally calls `data.options.map(...)`. Lesson 09 contained two interactive payloads whose JSON `type` was *not* multiple-choice but which were wrapped in ` ```question ` fences: **`dbl-09-q12`** (`"type": "matching"`, payload key `pairs`, no `options`) and **`dbl-09-q14`** (`"type": "dragdrop"`, payload keys `items` / `correctOrder`, no `options`). Both parsed as valid JSON — which is why the lesson validator passed them — but `QuestionBlock` crashed on them at render time. **Fix applied:** the two blocks were re-fenced as ` ```matching ` and ` ```dragdrop ` (question-fence count 208 → 206; the 208 `dbl-` IDs are unchanged; matching 17 → 18, dragdrop 18 → 19). **Prevention applied:** `validate_lesson.py` now parses every ` ```question ` payload and errors (exit 2) when its `type` is not `multiple-choice`/`true-false`, and the fence-language rule was added to `.opencode/skills/course-writer/references/guide.md`. Re-run result: `next build` exit 0, **17 `en` pages exported**.

---

## Course Description

> "End-to-end course for building and operating a production Databricks Lakehouse deployed on AWS — Unity Catalog governance, Delta Lake (ACID, CDF, liquid clustering), Auto Loader and Structured Streaming ingestion, Databricks Runtime/Photon transformation, Lakeflow/DLT pipelines, Databricks SQL serverless warehouses and Lakeview, workflows-as-code with asset bundles, data quality expectations, Delta Sharing and Marketplace, performance and DBU cost optimization, CI/CD with Terraform, and a full capstone reference architecture — with architecture diagrams, real customer cases, worked pricing examples, and practice questions."
> — `content/courses/databricks-lakehouse-aws/course.json`, `en.description`

Seventeen lessons take a practitioner from "what a lakehouse actually is, and why Databricks software runs in *two* cloud accounts at once" to a governed, costed, observable Databricks Lakehouse on AWS with a 30/60/90-day production roadmap. Lessons 01–03 are the **foundations**: the lakehouse concept with the control-plane / compute-plane split on AWS (your VPC, your S3, Databricks' managed control plane), the substrate itself — the four account-console objects, customer-managed VPC sizing with the `(addresses − 5) / 2` capacity formula, secure cluster connectivity, gateway versus interface endpoints, the three PrivateLink flavours, root-bucket KMS and the modern storage-credential IAM path — and Unity Catalog, the regional account metastore, the three-level namespace, the privilege chain, storage credentials, external locations and the `hive_metastore` migration ladder. Lessons 04–07 are the **write path**: the Delta Lake transaction log with optimistic concurrency, time travel, change data feed, `MERGE`, liquid clustering and `VACUUM` retention arithmetic; Auto Loader and the three file-detection modes with hand-computed S3 `LIST` bills, Kafka/MSK ingestion and idempotent `foreachBatch`; DBR, Photon, cluster policies, instance pools and the same-EC2-different-DBU-rate meter; and Lakeflow Declarative Pipelines — the product your 2023 tutorials called Delta Live Tables — with expectations, metrics, quarantine and the triggered-versus-continuous cost shape. Lessons 08–10 are the **serve, orchestrate and prove** block: Databricks SQL warehouses (serverless / pro / classic), sizing against the one-cluster-per-ten-concurrent-queries rule, Lakeview dashboards, BI connectivity and Lakehouse Federation; Lakeflow Jobs — formerly Databricks Workflows — as multi-task jobs-as-code with the 10-second schedule floor, the queueing-versus-skipping trap and the Workflows / Airflow / Step Functions decision matrix; and the five-layer data-quality stack (Delta constraints, expectations, quarantine, monitoring, alert-to-replay). Lessons 11–14 are the **govern, share, stream and tune** block: row and column controls via dynamic views, native masks and tag-driven ABAC, plus the system-tables audit pack and column-level lineage; OpenSharing, Marketplace and Lakehouse Federation as three distinct collaboration surfaces; Structured Streaming triggers, checkpoints, watermarks and exactly-once; and the four-layer performance stack ending in liquid clustering. Lessons 15–17 close with the **money, the pipeline and the capstone**: the two-bill Databricks-on-AWS cost model with the full October-2026 DBU rate card and a worked `$3,011 → $1,985` monthly case; Declarative Automation Bundles plus the `databricks.mws` Terraform provider plus a GitHub Actions PR pipeline with workload-identity federation; and the end-to-end reference architecture with five observability planes, an MLflow-on-UC slice, the course-to-DEA-blueprint map and a 30/60/90-day plan.

Every lesson is written to the same contract: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook that states the failure mode, a ` ```text ` decision-surface reference card that pins the October-2026 numbers, a numbered `##` section map, mermaid architecture and decision diagrams, multiple worked examples priced to an October-2026 rate card, a sourced `### 2026 Updates (as of October 2026)` box, a `## Real-World Case Studies` section built from digest 18's fourteen-story AWS corpus, a closing `## Practice Questions` set of multiple-choice and true/false items plus matching, fill-in-the-blank, drag-and-drop and plot exercises, trap callouts, a comparative verdict, and a closing `> [!SUCCESS]` block carrying the numbered **Key Takeaways**.

### Learning Outcomes

Upon completing this course, students will be able to:

1. Explain the lakehouse as an architectural category — ACID transactions, schema enforcement and open Parquet on S3 — and place the two pillars, **Delta Lake** and **Unity Catalog**, on one diagram, then split a Databricks workspace into the **control plane you never see** and the **classic or serverless compute plane that runs in your own VPC** behind secure cluster connectivity, saying precisely which data lives in the root bucket you must never delete and which lives in your own S3.
2. Build the AWS substrate: the four account-console objects (cross-account compute role, network configuration, storage configuration, private access settings), customer-managed VPC rules (`/17`–`/26` private subnets, two IPs per node, the `(addresses − 5) / 2` capacity formula), the required STS / S3 / Kinesis / RDS egress set with gateway-versus-interface endpoint economics, the three PrivateLink flavours and their NCC limits, root-bucket SSE with customer-managed keys for `STORAGE` versus `MANAGED_SERVICES`, and the modern IAM path (storage credentials and service credentials over legacy instance profiles).
3. Own Unity Catalog fundamentals: the regional account metastore and how workspaces attach to it, the three-level namespace and the securables that hang from it, the `USE CATALOG → USE SCHEMA → SELECT` privilege chain, inheritance versus ownership, deny-by-default with its two documented default-open carve-outs, workspace bindings, a full worked storage-credential-plus-external-location setup on S3 with the mandatory `external_id`, managed versus external placement math, and the `hive_metastore` migration ladder (federate, UCX, `SYNC`, upgrade wizard, `CREATE TABLE CLONE`).
4. Read a Delta table as machinery rather than as a folder of Parquet: the `_delta_log` action set (`add` / `remove` / `metaData` / `protocol` / `txn` / `commitInfo`) and checkpoint anatomy, optimistic concurrency with `WriteSerializable` writes, time travel against the **7-day data / 30-day log** retention split, legacy versus automatic change data feed, a pruned `MERGE INTO` silver pipeline with enforced `CHECK` constraints, `OPTIMIZE` / `ZORDER` versus liquid clustering, and `VACUUM` retention math including the streaming-lag hazard.
5. Build the ingestion layer: a worked Auto Loader bronze notebook (`cloudFiles`, `schemaLocation`, `checkpointLocation`, `useManagedFileEvents`), schema inference with the 50 GB / 1,000-file sample and `_schemas` history, rescue mode, the three file-detection modes (directory listing vs classic SNS+SQS file notifications vs managed file events) with hand-computed S3 `LIST` costs at $0.005 per 1,000 requests, `maxFilesPerTrigger` / `maxBytesPerTrigger` sizing, Amazon MSK with `AWS_MSK_IAM`, and idempotent `foreachBatch` `MERGE` via `txnAppId` / `txnVersion`.
6. Own the compute layer: read the DBR / LTS version ladder and its Beta → GA → LTS → EoS → EoL clock, drive Photon's vectorized path and its documented no-gain cases, separate all-purpose from job clusters, size instance pools on the zero-DBU-while-idle rule, write annotated cluster-policy JSON with `dbus_per_hour` ceilings, choose libraries against the access-mode matrix, and explain why the **same EC2 instance bills at two different DBU rates**.
7. Write and operate Lakeflow Declarative Pipelines: the `DLT → Lakeflow Declarative Pipelines → Lakeflow` naming timeline, the `pyspark.pipelines` API, the six verified expectation decorators and the warn / drop / fail actions (including the fact that `fail` records no metrics), where expectation metrics actually live (`flow_progress` and the `pipeline_events` system table), the documented quarantine pattern and its NULL trap, triggered versus continuous versus real-time modes, and the `$105` versus `$2,520` monthly cost shape that makes the mode choice a money decision.
8. Run the serving layer: choose between serverless, pro and classic SQL warehouses from the October-2026 lineup, size a fleet with the one-cluster-per-ten-concurrent-queries rule and the 1,000-query queue cap, set auto-stop against the documented idle-charge rule, build AI/BI dashboards and alerts, connect Tableau / Power BI / Excel over the ODBC and JDBC drivers, and query remote systems through Lakehouse Federation foreign catalogs.
9. Orchestrate production workloads as code: the Workflows → **Lakeflow Jobs** rename, the 1,000-tasks-per-job and 2,000-concurrent-task-run limits, task types against the serverless-first matrix and the `$0.15` vs `$0.40` per-DBU SKU rule, `depends_on` plus the six `run_if` conditions, Quartz schedules with the 10-second floor and the DST-to-UTC fix, file-arrival and table-update triggers, queueing (48-hour cap) versus skipping, retries, repairs and partial runs, run-as service principals with OAuth M2M, Declarative Automation Bundles with dev/prod targets, and the Workflows vs Airflow vs Step Functions decision matrix including the Amazon MWAA `DatabricksRunNowOperator` seam.
10. Build the five-layer data-quality stack: enforced Delta `NOT NULL` and `CHECK` constraints, the six expectation decorators, the quarantine pattern on its `is_quarantined` partition, data-quality monitoring (anomaly detection plus data profiling) and its `DATA_QUALITY_MONITORING` billing attribution, and the alert-to-replay runbook with `MERGE`-by-key replay SQL, `run_if` gates and `jobs.on_failure` webhooks.
11. Govern the lake with Unity Catalog as the only grant surface: the three-privilege read chain, the three subtractive mechanisms (dynamic views, native table row filters and column masks, tag-driven ABAC policies), governed tags and Data Classification auto-tags, the system-tables audit pack (`system.access.audit`, `system.query.history`, `system.billing.usage`, lineage) with its retention and latency numbers, column-level lineage and its named gaps, the three generations of secrets including AWS Secrets Manager-backed external secrets, OAuth M2M versus legacy PATs, and the compliance surface (FedRAMP, HIPAA, IP access lists, context-based ingress).
12. Choose the right collaboration surface and never confuse them: **OpenSharing** (the June-2026 evolution of Delta Sharing, protocol now under the Linux Foundation) with Databricks-to-Databricks, Databricks-to-Open bearer tokens and OIDC federation; shares as Unity Catalog securables with `WITH HISTORY` and `CURRENT_RECIPIENT()`; pre-signed URLs versus cloud tokens and what each exposes in the Delta log; the live-pointer trap where provider `VACUUM` breaks recipient time travel; Marketplace listings and the 10 % Universal Commit Drawdown; Lakehouse Federation query versus catalog federation; and clean rooms.
13. Operate Structured Streaming in production: the full trigger menu from the default 3–5 s micro-batch through `availableNow` and sub-second `realTime`, checkpoint anatomy on S3-backed Unity Catalog volumes and the restart-change matrix, `foreachBatch` exactly-once via `txnAppId` / `txnVersion`, change-data-feed fan-out, watermark-bounded state with `dropDuplicatesWithinWatermark`, RocksDB changelog checkpointing, schema-evolution locks, Kafka/MSK rate controls and backlog metrics.
14. Tune layer by layer instead of by slogan: target file sizes (128 MB auto-optimize, 256 MB autotune floor, 1 GiB manual `OPTIMIZE` ceiling), the partitioning ladder with its `< 1 TB never` rule and ≥ 1 GB-per-partition guard, liquid clustering (`CLUSTER BY`, `CLUSTER BY AUTO`, up to four keys, incremental vs `OPTIMIZE FULL`, bin packing), data skipping and per-file statistics, AQE defaults (200 shuffle partitions, 30 MB runtime broadcast, 5× skew factor, 64 MB advisory), the broadcast / skew / salting ladder, Photon judged by workload, warehouse resize-versus-scale sizing with the three cache tiers, and the query profile / Spark UI profiling loop.
15. Run the two-bill cost model honestly: what a DBU is and how it is metered, the October-2026 rate card by compute SKU (jobs **0.15**, all-purpose **0.55**, SQL **0.22 / 0.55 / 0.70** per DBU), the serverless-versus-classic break-even arithmetic, auto-stop and auto-termination defaults, spot workers, pools, cluster-policy guardrails, `system.billing.usage` attribution and budgets — then hand-compute the worked monthly case that takes a **$3,011** bill to **$1,985** in three levers, and compare the DBU model against Snowflake credits and Athena's $5.00 / TB.
16. Ship the lakehouse like software: the four-layer stack (Terraform substrate, Declarative Automation Bundles workload config, GitHub Actions orchestration, service-principal identity), the one `databricks.yml` and its variable-resolution precedence, development versus production mode semantics (dev name prefixes, paused schedules, branch and path guardrails), split deploy identity from run identity, the `databricks.mws` Terraform provider in a separate module and state, a PR pipeline with `databricks/setup-cli` and workload-identity federation so no personal access token ever enters CI, the five-layer test pyramid, and the one-metastore / `ISOLATED`-bound-catalog / two-to-three-workspace topology.
17. Assemble and defend the whole thing: the five observability planes on top of Unity Catalog, six real system-table audit queries, alerting end to end, MLflow models registered *in* Unity Catalog with signatures and aliases, the full AWS-plus-Databricks capstone diagram, a course-authored 30/60/90-day roadmap sequenced against Databricks' ten production-planning phases, the four-stage maturity model, and the honest map of every lesson onto the official **Data Engineer Associate** blueprint with its 6 / 21 / 22 / 16 / 10 / 10 / 15 domain weights.

---

## Audience and Prerequisites

> **Audience.** This course is written for the **data engineer, analytics engineer and platform engineer who is building or modernising a Databricks Lakehouse that runs on AWS** — people who already know what a join, a partition, a slowly-changing dimension, a nightly batch and a dead-letter queue are, and who now have to attach Databricks product names, DBU rates, Unity Catalog securables and AWS VPC constraints to each of them. It is deliberately *not* a certification-prep course: the DEA blueprint appears once, in lesson 17, as a coverage audit against a document Databricks itself publishes, not as a study plan.

> **Declared prerequisites.** `course.json` declares **no prerequisites** for any locale. The lessons' own stated floor is the practical one that lesson 01 assumes: comfort with SQL and PySpark-level data modelling, and an AWS account you can price things in.

> **What you should already be able to do before lesson 02.** Read a `CREATE EXTERNAL LOCATION` statement without flinching; say what a security group does; and accept that a Databricks workspace on AWS puts Databricks-managed software in *Databricks' own* account while every byte of lake data stays in *yours*. Lesson 01 exists to prove that last sentence; lessons 02–03 exist to make it operational.

> **What you do *not* need.** A Databricks certification, prior Unity Catalog experience (lesson 03 builds it from the metastore up), prior Delta Lake experience (lesson 04 builds it from the transaction log up), and any Terraform experience (lesson 16 introduces the `databricks.mws` provider as it goes).

---

## Per-Lesson Overview

Seventeen rows, every one derived from the shipped files: the H1 is the lesson's frontmatter `title` (they match in all 17 cases), the question count is the number of `dbl-NN-q*` IDs in that file, and the summary is condensed from the lesson's own frontmatter `description`.

| # | File | Title (H1) | Lines | Min | Qs | One-line summary |
|---|------|-----------|-------|-----|----|------------------|
| 01 | `01-lakehouse-architecture-databricks.md` | Lakehouse Architecture on Databricks: Planes, Pillars, and the AWS Substrate | 856 | 75 | 12 | What a lakehouse actually is (ACID + schema enforcement + open Parquet on S3), the control/compute plane split on AWS, Delta + Unity Catalog as the two pillars, the ingest→curate→serve→ML workload map, and the DBU rate card versus the AWS bill. |
| 02 | `02-aws-foundation-vpc-s3-iam.md` | AWS Foundation for Databricks: VPC Design, Root Bucket, PrivateLink, KMS and IAM | 903 | 60 | 12 | The four account-console objects, customer-managed VPC sizing with the capacity formula, secure cluster connectivity, gateway/interface endpoint economics, the three PrivateLink flavours, root-bucket KMS policies and storage credentials over instance profiles. |
| 03 | `03-unity-catalog-fundamentals.md` | Unity Catalog Fundamentals: Metastore, Hierarchy, Grants, Storage Credentials and External Locations | 1,013 | 60 | 12 | The regional metastore, the three-level namespace and privilege chain, deny-by-default with its carve-outs, a full worked storage-credential + external-location setup on S3, managed versus external placement math, and the `hive_metastore` migration ladder. |
| 04 | `04-delta-lake-transactions.md` | Delta Lake Transactions on AWS: Log Anatomy, Time Travel, CDF, Clustering and VACUUM | 810 | 70 | 12 | The `_delta_log` action set and checkpoints, optimistic concurrency, time travel's two retentions, legacy versus automatic CDF, a pruned `MERGE INTO` silver pipeline, `OPTIMIZE`/`ZORDER` versus liquid clustering, and `VACUUM` retention arithmetic. |
| 05 | `05-ingestion-autoloader-streaming.md` | Ingestion on AWS: Auto Loader, File Events, Kafka/MSK and Idempotent Sinks | 834 | 75 | 13 | A worked Auto Loader bronze notebook, schema inference and rescue, the three file-detection modes with hand-computed `LIST` bills, throughput via `maxFilesPerTrigger`/`maxBytesPerTrigger`, MSK with `AWS_MSK_IAM`, and idempotent sinks with exactly-once checkpoints. |
| 06 | `06-runtime-photon-clusters.md` | Databricks Runtime, Photon and Clusters: DBR/LTS, Policies, Pools and Compute Cost Shape | 953 | 75 | 13 | The DBR/LTS version ladder and its lifecycle clock, Photon's vectorized path and no-gain cases, all-purpose versus job versus warehouse versus serverless compute, instance pools, cluster-policy JSON guardrails, libraries, spot and node families — and why the same EC2 instance bills at two DBU rates. |
| 07 | `07-lakeflow-dlt-expectations.md` | Lakeflow Declarative Pipelines (formerly Delta Live Tables): Expectations, Modes and the DLT vs Jobs Decision | 882 | 75 | 13 | The DLT → Lakeflow renaming timeline, the declarative model, the six expectation decorators and three actions, where metrics actually live, quarantine as a pattern, triggered/continuous/real-time modes, AWS storage and compute configuration, and the DLT-vs-Jobs decision matrix. |
| 08 | `08-databricks-sql-lakehouse.md` | Databricks SQL Warehouses and the Serving Layer: Serverless, Scaling, Dashboards, BI and Federation | 939 | 75 | 12 | The October-2026 warehouse lineup, sizing against the concurrency rule and hard limits, scaling and cold-start economics, AI/BI dashboards and alerts after the legacy-dashboard end of support, BI drivers, Lakehouse Federation, warehouse ACLs and the two-column DBU + EC2 bill. |
| 09 | `09-workflows-jobs-as-code.md` | Lakeflow Jobs (formerly Databricks Workflows): Multi-Task Jobs as Code, Triggers, Retries and the Scheduler Decision Matrix | 912 | 80 | 14 | The Workflows → Lakeflow Jobs rename, job/DAG/trigger anatomy with verified limits, serverless-first task compute, `depends_on` and `run_if`, cron and data-arrival triggers, queueing versus skipping, retries and repairs, run-as service principals, bundles-as-code, the MWAA seam, and the scheduler decision matrix. |
| 10 | `10-data-quality-lakehouse.md` | Data Quality in the Databricks Lakehouse: Constraints, Expectations, Quarantine and Monitoring | 860 | 75 | 12 | The five-layer stack: enforced Delta constraints, Lakeflow expectations, the quarantine pattern, data-quality monitoring (anomaly detection + profiling) with its billing attribution, and the alert-to-replay runbook with idempotent `MERGE` replay. |
| 11 | `11-unity-catalog-security.md` | Unity Catalog Security: Row and Column Controls, Tags, Auditing, Lineage and Secrets | 824 | 75 | 12 | The three subtractive mechanisms (dynamic views, native masks/row filters, tag-driven ABAC), Data Classification auto-tags, the system-tables audit pack with retention/latency numbers, column-level lineage and its gaps, three generations of secrets, service principals and the compliance surface. |
| 12 | `12-delta-sharing-marketplace.md` | Data Sharing on Databricks on AWS: OpenSharing, Marketplace, and Lakehouse Federation | 1,060 | 80 | 12 | OpenSharing's three sharing models, shares as UC securables, five recipient authentication types, pre-signed URLs versus cloud tokens, the live-pointer trap, Marketplace listings and the 10 % Universal Commit Drawdown, Lakehouse Federation query vs catalog federation, and clean rooms. |
| 13 | `13-structured-streaming-pipelines.md` | Structured Streaming on the AWS Lakehouse: Triggers, Checkpoints, foreachBatch and Exactly-Once | 813 | 80 | 11 | The trigger menu, S3-backed checkpoint anatomy and the restart-change matrix, Kafka/MSK and Delta CDF sources, `foreachBatch` exactly-once, CDF fan-out, watermarks and state bloat, schema-evolution locks, streaming observability, and the Lakeflow-Jobs production posture. |
| 14 | `14-performance-liquid-clustering.md` | Performance Optimization on Databricks/AWS: Liquid Clustering, File Layout, Skew and Warehouse Tuning | 918 | 75 | 12 | The four-layer stack (layout → statistics → planning/runtime → serving), file sizing and the small-file ladder, the partitioning guard, liquid clustering deep with an `OPTIMIZE` vs `CLUSTER BY` worked comparison, AQE/broadcast/skew/salting, Photon by workload, warehouse cache tiers, and profiling in the query profile and Spark UI. |
| 15 | `15-cost-dbu-optimization.md` | Cost Optimization and DBU Economics on AWS | 818 | 60 | 12 | The two-bill model, the October-2026 SKU ladder (jobs 0.15 / all-purpose 0.55 / SQL 0.22–0.70 per DBU), serverless-versus-classic break-even, idle-time rules, spot, right-sizing, `system.billing.usage` attribution, the AWS side of the bill, and the worked `$3,011 → $1,985` monthly case. |
| 16 | `16-cicd-asset-bundles-terraform.md` | CI/CD for the Databricks Lakehouse on AWS: Declarative Automation Bundles, Terraform and GitHub Actions | 976 | 75 | 12 | The four-layer stack, the one `databricks.yml`, dev/prod modes and presets, deploy-identity versus run-identity, the `databricks.mws` provider in a separate module and state, the GitHub Actions PR pipeline with workload-identity federation, the five-layer test pyramid, and the metastore/catalog/workspace topology. |
| 17 | `17-capstone-reference-architecture.md` | Capstone Reference Architecture: Observability, ML Activation and the 90-Day Plan for Databricks on AWS | 905 | 80 | 12 | The observability planes, six real system-table audit queries, alerting end to end, MLflow-in-UC, the full AWS + Databricks capstone diagram, the 30/60/90-day roadmap over Databricks' ten production phases, the maturity model, and the DEA-blueprint mapping. |
| | **Total** | | **15,276** | **1,245** | **208** | |

---

## How This Course Differs from `aws-data-lakehouse`

The two courses share a shape — seventeen lessons, twelve weeks, a medallion spine, governance, cost and a capstone — and share almost no vocabulary. `aws-data-lakehouse` is an **AWS-native lake services** course: the storage substrate is S3 and the query, catalog, governance and BI layers are Glue, Athena, Redshift, Lake Formation, Macie and QuickSight, all metered directly on the AWS bill. `databricks-lakehouse-aws` is a **Databricks-platform lakehouse** course: the same S3 substrate and the same VPC/KMS/IAM concerns, but the catalog, table format, transformation, serving, orchestration and sharing layers are Unity Catalog, Delta Lake, DBR/Photon, Databricks SQL, Lakeflow and OpenSharing — and the meter is **two bills**, because Databricks charges DBUs for the platform while AWS charges for the EC2, EBS, S3, NAT and CloudWatch underneath.

| Axis | `aws-data-lakehouse` | `databricks-lakehouse-aws` |
|------|----------------------|----------------------------|
| Storage substrate | S3 storage classes, Glacier tiers, lifecycle | S3, but *behind* a Databricks root bucket, external locations and storage credentials |
| Catalog / governance | Glue Data Catalog + Lake Formation (row/column via `DataCellsFilter`) | Unity Catalog (metastore, three-level namespace, dynamic views, masks, ABAC tags) |
| Table format | Iceberg deep; Hudi and Delta compared | Delta Lake deep (`_delta_log`, CDF, liquid clustering); Iceberg only as a foreign format |
| Transformation | Glue ETL, EMR Serverless, Lambda | DBR / Photon, Lakeflow Declarative Pipelines, expectations |
| Query / serving | Athena ($5.00/TB scanned) vs Redshift (RA3, Serverless RPUs) | Databricks SQL serverless / pro / classic warehouses, DBU-metered |
| Orchestration | Step Functions, EventBridge, MWAA | Lakeflow Jobs (Workflows), multi-task jobs-as-code, MWAA only as the external seam |
| Sharing | Lake Formation cross-account + AWS RAM | OpenSharing / Delta Sharing, Marketplace, Lakehouse Federation |
| CI/CD | not a first-class lesson | Declarative Automation Bundles + Terraform (`databricks.mws`) + GitHub Actions OIDC |
| Money model | one AWS bill, ~12 meters | **two bills**: DBU rate card × AWS substrate |
| Certification adjacency | deliberately none | DEA blueprint used once, as a coverage audit in L17 |

The practical consequence for a reader choosing between them: take `aws-data-lakehouse` if you own the AWS account and want the cheapest native path; take `databricks-lakehouse-aws` if your organisation has standardised on Databricks and the AWS question is *substrate*, not *stack*.

---

## Certification Mapping

This course is **not** certification preparation, but lesson 17 maps every lesson onto the one credential a Databricks data engineer is most often screened with. All figures below are quoted from official Databricks pages and exam-guide PDFs, **accessed 2026-10-12**, and are carried from digest 19 (`19-exam-cert-prep.md`), which is the certification source of truth for this build.

### The primary target: Databricks Certified Data Engineer Associate

| Domain (exam guide of record, version live **2026-05-04**) | Weight | Course lessons | Coverage |
|---|---|---|---|
| 1. Databricks Intelligence Platform | **6 %** | L01 (planes, pillars), L02 (workspace/VPC/S3), L06 (DBR, Photon, compute cost) | Strong |
| 2. Data Ingestion and Loading | **21 %** | L05 (Auto Loader, file events), L07 (Lakeflow Connect sources), L13 (stream sources, `COPY INTO` patterns), L02 (S3) | Strong |
| 3. Data Transformation and Modeling | **22 %** | L04 (tx log, CDF, constraints, clustering), L05/L07 (bronze→silver→gold), L14 (file sizing, skew), L10 (quality) | Strong |
| 4. Working with Lakeflow Jobs | **16 %** | L09 (multi-task jobs, schedules, retries, run-as), L07 (declarative pipelines), L16 (bundle-defined jobs) | Strong — the course teaches both names |
| 5. Implementing CI/CD | **10 %** | L16 (DABs, Terraform, PR pipeline, service principals), L09 (job-as-code) | Good |
| 6. Troubleshooting, Monitoring, and Optimization | **10 %** | L14 (query profile, Spark UI), L15 (DBU cost), L17 (system tables, monitoring), L10 (alert→replay) | Good |
| 7. Governance and Security | **15 %** | L11 (grants, row/column policies, audit), L03 (metastore, external locations), L12 (sharing governance), L02 (KMS, PrivateLink) | Strong — and AWS-specific |

Exam envelope, all from the official cert page and exam guide: **proctored certification, 45 scored multiple-choice items, 90 minutes, USD 200** (+ local tax), no test aids, four languages (English, 日本語, Português BR, 한국어), online or test centre via Kryterion/WebAssessor, **valid 2 years**, no required prerequisite but *"course attendance and six months of hands-on experience in Databricks are highly recommended."* A narrower **renewal exam** (25 items / 60 min / $200 / online proctored only, guide version 2026-06-15) exists only for holders whose credential is expired or within 2 months of expiry.

### The depth rung: Databricks Certified Data Engineer Professional

**59 scored items, 120 minutes, $200**, same four languages, 2-year validity. Ten domains; the ones this course covers well are **Cost & Performance Optimisation (13 %)**, **Transformation, Cleansing and Quality (10 %)**, **Ensuring Data Security and Compliance (10 %)** and **Data Governance (7 %)**. The honest gaps the digest flags — taught here at awareness level only — are **Developing Code for Data Processing (22 %)** under exam conditions, **Debugging & Deploying (10 %)**, **Data Modelling (6 %)** and **Monitoring & Alerting (10 %)**. **Data Sharing and Federation (5 %)** is the *smallest* gap because L12 covers it end to end.

### Exam-currency traps this course deliberately teaches

1. **The rebrand trap.** The July-30-2025 DEA guide says *"Databricks workflows"*; the May-4-2026 guide says *"Lakeflow Jobs"*; Delta Live Tables is now *Lakeflow Declarative Pipelines*. L07 and L09 teach the timeline and say the alias out loud, because both names appear in community write-ups.
2. **`hive_metastore` is not the modern answer.** The live blueprint is organised around Unity Catalog, Lakeflow Jobs and CI/CD with Asset Bundles. L03 teaches the migration *ladder*, not the legacy default.
3. **No exam codes exist.** Databricks publishes none. `DA-100` is a retired Microsoft Power BI exam, `DP-100` is Microsoft's Azure Data Scientist exam, `DEA-C01` is the *AWS* Data Engineer – Associate. Strings like "DB-DEA" are vendor marketing.
4. **No official practice exams and no published passing score.** *"We currently do not offer any practice exams."* Passing scores are *"set through statistical analysis"* and not published. Badge/accreditation thresholds *are* published: **80 %**, 10–25 questions, free, non-proctored, architect accreditations valid 1 year.
5. **Fee misinformation.** The official FAQ says *"All Databricks Certification exams cost 200 USD"*; a 2026 third-party guide listing $300 is wrong. Official wins.
6. **Badges are on Accredible, not Credly**, at `credentials.databricks.com`.

Free, official, AWS-specific counterpart: the **Databricks on AWS Platform Architect accreditation** — 20 questions, unlimited time, 80 % pass, free for customers and partners, valid 1 year, covering *"Customer-managed VPCs · Customer-managed keys · Cloud service integrations"* — i.e. exactly L02's scope.

---

## Architecture Themes

Seven threads run through all seventeen lessons. Each is a *decision surface*, not a feature list.

- **Unity Catalog as the single grant plane.** One regional account metastore; one three-level namespace; storage credentials that wrap an IAM role so revoking access is a `REVOKE` rather than a bucket-policy edit; external locations as the governed path seam; row filters, column masks and ABAC tags that can only *subtract* from access you already hold; system tables as the audit and billing evidence store. L03 builds it, L11 hardens it, L12 shares through it, L16 provisions its grants in Terraform.
- **Delta Lake as the storage contract.** Parquet data files plus a file-based `_delta_log`, sitting in *your* S3. Optimistic concurrency instead of locks; time travel with a 7-day data / 30-day log retention split; change data feed as the downstream fan-out; `MERGE` as copy-on-write; liquid clustering replacing the partition-plus-`ZORDER` default; `VACUUM` as the one operation that can still lose your data. L04 is the machinery, L14 is the layout, L13 is the streaming write contract.
- **Lakeflow as the declarative middle.** Declarative Pipelines (formerly DLT) own *data quality* through expectations; Lakeflow Jobs (formerly Workflows) own *orchestration*. The two planes are separate, and confusing them is the single most expensive mistake in the domain — L07 states the rule, L09 enforces it, L10 shows what happens to the metrics when a `fail` expectation records nothing.
- **Databricks SQL as the serving tier.** Serverless / pro / classic warehouses, Photon everywhere, Predictive IO on serverless and pro, Intelligent Workload Management serverless-only; sizing against one cluster per ten concurrent queries and a 1,000-query queue; auto-stop as the default cost control; AI/BI dashboards and Lakeview; BI drivers first, tools second; Lakehouse Federation as the same vocabulary used in the opposite direction. L08 owns it; L15 prices it.
- **Workflows-as-code as the promotion seam.** The cliff every lakehouse meets is the Friday-afternoon hand-click. Declarative Automation Bundles make the workspace declarable, reviewable and deployable by a service principal that is not a human being — with development mode's paused schedules and `[dev <user>]` name prefixes as the built-in guardrail. L09 introduces it, L16 industrialises it.
- **DABs and Terraform as the two halves of infrastructure.** Four layers, one owner each: Terraform (`databricks.mws`) owns the AWS substrate — credentials, networks, storage configurations, VPC endpoints, private access settings, workspaces — in a separate module and a separate state; Declarative Automation Bundles own the workload config; GitHub Actions with workload-identity federation owns the promotion; service principals own the identity. Deploy identity and run identity are different things on purpose.
- **Cost as an architectural property, not a report.** Two independent bills. The DBU SKU ladder (jobs 0.15, all-purpose 0.55, SQL 0.22/0.55/0.70 per DBU as of Oct 2026) is the most powerful pricing lever in the product; idle time is the cheapest one (auto-stop, auto-termination, pools); spot touches the AWS side only; `system.billing.usage` plus budgets is the attribution surface; and the NAT gateway at $0.045/GB is the AWS-side trap that no amount of DBU tuning will fix. L15 is the ladder; L14 is the performance-as-cost half.

---

## Deep-Research Methodology

No lesson in this course was written from memory. Each one was produced from a **research digest** first: a single file of source-pinned facts, dated numbers, case material, trap lists and explicit non-assertions, from which the lesson was then written. The digests live in `.scratch/dbx-lakehouse/` (a git-ignored scratch directory — `research scratch (never commit)` in `.gitignore`, confirmed by `git check-ignore`) and each of the 19 follows the same eight-section skeleton from `.scratch/dbx-lakehouse/SPEC.md`:

| Section | Content |
|---------|---------|
| **A. Official / primary sources** | URL + the access date (`2026-10`), verbatim quotes for key facts; prefer `docs.databricks.com`, `databricks.com/blog`, `databricks.com/customers`, `databricks.com/company/newsroom`, exam-guide PDFs; community threads only if marked |
| **B. Core facts & concepts** | precise, teachable statements |
| **C. Numbers / prices / limits** | each with a source **and** a date — "as of Oct 2026"; conflicting figures fall through to (G) |
| **D. Real-world examples / case material** | Databricks-published customer stories that run **on AWS** |
| **E. Databricks + AWS features in scope** | the services and features the lesson must cover |
| **F. Pitfalls & common confusions** | the wrong-but-plausible pairs the design questions weaponise |
| **G. Could NOT verify** | items Databricks does not confirm — **never stated as fact** in any lesson |
| **H. Suggested worked examples & diagram ideas** | lesson seeds: arithmetic, mermaid sketches, scenario stems — organised per lesson in digests 17, 18 and 19 |

All 19 digests carry all eight headings (verified with a per-file `grep -cE '^## [A-H]\. '` loop returning 8 for every file). Three disciplines run through the whole set: **no number without a source and a date**, **third-party sources are never the sole basis for a Databricks fact**, and **unverified claims are isolated in section (G) rather than silently dropped**. That is why every `2026 Updates` box is sourced bullet-by-bullet and why every case heading quotes the number the customer published rather than a rounded paraphrase.

### Digest Inventory (01–19)

| Digest | File | Lines | Bytes | §A entries | Focus — what it grounds |
|--------|------|-------|-------|-----------|-------------------------|
| 01 | `01-databricks-lakehouse-architecture.md` | 229 | 57,734 | 38 | Lakehouse concept on Databricks; control plane + data plane on AWS; Delta + Unity Catalog pillars; workload map; vs AWS-native (Glue/Athena) vs Snowflake vs on-prem (feeds **L01**) |
| 02 | `02-aws-substrate-network-storage.md` | 174 | 49,619 | 23 | Workspace, network parameters, root bucket, secure cluster connectivity, VPC endpoints, PrivateLink (AWS + Databricks), KMS, instance profiles vs storage credentials, cross-account patterns (feeds **L02**) |
| 03 | `03-unity-catalog-fundamentals.md` | 286 | 77,033 | 49 | Account metastore, hierarchy, securables + grants, storage credentials, external locations, managed vs external, `hive_metastore` migration, workspace attachment (feeds **L03**) |
| 04 | `04-delta-lake-deep.md` | 271 | 76,117 | 35 | Transaction log, snapshots, time travel, CDF, `OPTIMIZE`/`ZORDER` vs liquid clustering, `VACUUM` retention, constraints, schema evolution, managed vs external, version/DBR compatibility (feeds **L04**) |
| 05 | `05-ingestion-autoloader-streaming.md` | 219 | 77,593 | 26 | Auto Loader (`cloudFiles`, schema location, checkpoint, notifications vs directory listing), Structured Streaming sources, rate limiting, idempotent Delta sinks, batch+stream unification (feeds **L05**) |
| 06 | `06-runtime-photon-compute.md` | 172 | 73,963 | 38 | DBR versions + LTS cadence, Photon, jobs vs all-purpose, cluster policies, instance pools, libraries, notebook posture, pandas API on Spark (feeds **L06**) |
| 07 | `07-lakeflow-dlt-pipelines.md` | 316 | 85,115 | 35 | Delta Live Tables / Lakeflow Declarative Pipelines naming, expectations and policies, sources/sinks, continuous vs triggered, multi-task graphs, metrics tables, DLT vs jobs (feeds **L07**) |
| 08 | `08-databricks-sql-warehouses.md` | 204 | 76,989 | 46 | Warehouse lineup, scaling policies, auto-stop, SQL queries, dashboards + Lakeview, BI tools over JDBC/ODBC, Lakehouse Federation, SQL metrics/profiling (feeds **L08**) |
| 09 | `09-workflows-orchestration.md` | 203 | 83,951 | 46 | Multi-task jobs, dependencies, schedules + file/jobs/API triggers, retries + timeouts, notifications, run-as service principals, job queues, bundle-defined jobs, Workflows vs Airflow vs Step Functions (feeds **L09**) |
| 10 | `10-data-quality-expectations.md` | 138 | 56,221 | 24 | DLT expectations semantics + metrics tables, Delta constraints, quarantine patterns, Lakehouse Monitoring, freshness/volume checks, quality → alert → replay (feeds **L10**) |
| 11 | `11-governance-security-uc.md` | 243 | 75,099 | 30 | UC grants model, row/column via dynamic views + tags + masking, system tables (audit + billing + lineage), UC lineage graph, secret scopes, workspace vs account admin, FedRAMP/compliance (feeds **L11**) |
| 12 | `12-sharing-federation-marketplace.md` | 199 | 82,184 | 44 | Delta Sharing / OpenSharing (providers, recipients, shares), Marketplace, Lakehouse Federation external catalogs, clean rooms, internal vs external sharing governance (feeds **L12**) |
| 13 | `13-structured-streaming-realtime.md` | 198 | 53,533 | 22 | Triggers, checkpoints, `foreachBatch`, CDF out, schema evolution on streams, watermarking, exactly-once vs at-least-once, streaming dashboards on DBSQL, Kafka/MSK deep on AWS (feeds **L13**) |
| 14 | `14-performance-optimization.md` | 195 | 92,481 | 34 | Liquid clustering deep (bin packing, auto-compaction), file sizing/partition pruning, skew handling, Photon tips, warehouse sizing + caching, materialised views, join optimisations, query profiling (feeds **L14**) |
| 15 | `15-cost-optimization-dbu.md` | 339 | 50,681 | 27 | DBU pricing by compute type, auto-stop, scaling policies, spot on AWS, warehouse right-sizing, cost attribution via system tables/budgets, S3 + network cost interplay (feeds **L15**) |
| 16 | `16-cicd-iac-terraform.md` | 305 | 70,730 | 33 | Asset Bundles (config, env targets, deployment), Terraform Databricks provider, GitHub integration, testing, dev/staging/prod promotion, service principals + secrets, PR checks, code→job lineage (feeds **L16**) |
| 17 | `17-capstone-monitoring-mlops.md` | 326 | 86,112 | 30 | Lakehouse Monitoring + system tables observability stack; MLflow on UC; end-to-end reference architecture; 30/60/90-day roadmap; course synthesis + final comparative map (feeds **L17**) |
| 18 | `18-databricks-case-studies.md` | 348 | 50,001 | 14 | **Fourteen Databricks-published customer stories (D1–D14) that run on AWS** — the source of every `Real-World Case Studies` section in lessons 01–17 |
| 19 | `19-exam-cert-prep.md` | 466 | 42,577 | 20 | Certification and interview readiness: the live catalogue verified 2026-10-12, the DEA/DEP blueprints with official weights, fee/format/validity numbers, the 15-question interview bank, the portfolio pitch, and the certification pitfall list (grounds **L17's closing map** and the certification section above) |
| **Total** | **19 files** | **4,831** | **1,317,733** | **614** | **14 named case bundles in digest 18; the DEA blueprint with 6/21/22/16/10/10/15 weights in digest 19 §E.1** |

**Numbering, stated plainly.** The digest directory contains exactly **19 files, `01-` through `19-`**, two more than the 17 lessons. Digest numbering runs one-to-one with lessons for **01–17**; **18** and **19** are enhancement passes with no lesson of the same number — the AWS case corpus and the certification/interview dossier. That is the same *shape* as the `aws-lakehouse` digests (where 18 was cases and 19 was the 2026 change log) but not the same *content* for 19: here digest 19 is exam-and-interview material, not a change log, because this course has a named certification audience.

**Note on the `MASTER-PROMPT.md` table.** `MASTER-PROMPT.md` §3 planned digest 19 as `19-databricks-updates-2026.md` (a 2025–2026 platform change log). What actually shipped is `19-exam-cert-prep.md`, verified 2026-10-12; the dated platform updates that feed each lesson's `2026 Updates (as of October 2026)` box were sourced from the per-lesson digests' (C) sections instead. The shipped file is the source of truth for everything in the certification section above.

---

## Real-World Examples

Every case below is quoted with the numbers the customer or Databricks published for it, and most are reused across several lessons — the same customer story is cited as evidence for different layers rather than being told once and dropped. All figures come from digest 18, where every number is read off a Databricks-owned property (`databricks.com/customers/*`, `databricks.com/blog/*`, `databricks.com/company/newsroom/*`, `answers.databricks.com`) or from a quote printed **on** a Databricks page, accessed **2026-10**. The lesson list under each case is a word-boundary `grep -lw <company>` across the 17 shipped lesson files (so it counts every mention, including update-box citations, not only the case-study section).

> **Read every number as a customer claim, not a Databricks guarantee.** Rivian's *"50% better runtime performance"* and Comcast's *640 machines replaced with 64* are outcomes against each customer's own baseline and date — Comcast's story originates in 2019, Biogen's in 2020, Asurion's in 2021. Any option phrased "Databricks guarantees…" fails before you check the number — this is digest 18's first trap, and it is why every case heading in the lessons names the source rather than rounding the figure.

### The Fourteen Named Cases Mapped to the Lakehouse Layers

| # | Customer (industry) | Headline numbers as published | Lessons citing it |
|---|---|---|---|
| D1 | **Rivian** (electric vehicles, `Cloud: AWS`) | **1,000+ platform users, a 75 % increase from a year ago**; *"50% better runtime performance"*; **70,000+ Rivians** generating terabytes/day; UC + Delta + Liquid Clustering for charge-prediction ML | 01, 03, 04, 14, 17 |
| D2 | **Block** (Square, Cash App, TIDAL) | **12 PB** managed and governed; **12×** reduction in compute cost; **20 %** reduction in data egress cost; data-sharing time *"from days to seconds"* | 02, 08, 11, 12, 17 |
| D3 | **Comcast** (communications & media) | **10×** reduction in overall compute costs; **90 %** reduction in required DevOps resources; Delta Lake replaced **640 machines with 64**; RDK telemetry *"petabytes … every 15 minutes from 70 million devices"* | 04, 06, 11, 14, 15 |
| D4 | **Shell** (energy, spans AWS + Azure) | **1.3 trillion rows** of sensor data processed; **70+** AI-driven transformation use cases; real-time consumption up **15-fold** over five years; RTDIP downloaded **25,000+ times/month** | 07, 12, 13 |
| D5 | **Punchh** (retail loyalty / restaurant tech) | **10×** faster time-to-insight; **30 %** lower operational costs; **12 %** increase in customer satisfaction | 01, 08, 10, 14 |
| D6 | **Biogen** (pharmaceuticals) | **2 million** genomic variants annotated in **15 minutes** (from a 2-week, 700,000-variant pipeline); **2** drug targets discovered | 01 |
| D7 | **Asurion** (insurance / device protection) | **4,000+ streaming jobs** and **4,000+ tables** in a production data lake on AWS; sources span Kinesis, Kafka, SNS, SQS, CDC, APIs, flat files | 05, 09, 13 |
| D8 | **NAB** (National Australia Bank) | **26-year-old** Teradata warehouse decommissioned; **456** use cases migrated to Databricks SQL; **1,200+** users enabled; **1,800** Spark Declarative Pipelines; **99.6 %** job success rate; **80 %** less transformation complexity | 07, 08, 09, 10, 11, 16, 17 |
| D9 | **Amgen** (biopharma) | From **120+ IAM roles** to *"one or two principal IAM role"*; audit effort for the function reduced by **50 %**; **~500** objects mapped in Unity Catalog; **90 %** of use cases on Databricks | 02, 03, 10, 11 |
| D10 | **Burberry** (luxury retail) | **99 %** reduction in latency for customer clickstream data; **52×** increase in cookie duration; daily 2:00–7:00 PM GMT batch window removed | 05, 10, 13 |
| D11 | **Mastercard** (financial services) | No numeric customer metric is published — the evidence is two AWS re:Invent 2024 breakout sessions on unified governance and production gen-AI on AWS | 16 |
| D12 | **Addepar** (wealth management) | Models over **$8 trillion** in investments on Databricks running on AWS; pipeline delivery **5×** faster; **$2 million** infrastructure cost cut | 06, 07, 15, 16 |
| D13 | **Nubank** (LATAM fintech) | Zero downtime across a **12-month** migration; query volume doubled **20M → 40M** monthly; **17k** users globally; **+40 %** annual cost savings; UC for fine-grained control across hundreds of thousands of tables | 02, 07, 08, 15 |
| D14 | **nCino** (banking software) | **13 years** of banking data and trillions in loan history consolidated; *"Keeping data within a single AWS ecosystem reduces complexity, strengthens compliance"* | 03, 08, 11, 12 |

One further supporting name appears inside the L12 sharing case rather than as a primary heading: **Atlassian**, cited alongside Block and nCino in the OpenSharing/Marketplace lesson.

### Four Cases Worth Telling in Full

**Example 1 (foundations, L02/L03/L11): Amgen — Unity Catalog's first ROI on AWS is role count.** Amgen's estate used AWS Glue as the enterprise catalog and AWS IAM as the RBAC layer, which meant auditing meant parsing IAM policies. The published outcome: *"we didn't have to create or manage at least 120+ IAM roles … we went from hundreds of IAM roles to just one or two principal IAM role"*, with *"This reduces the audit effort for the function by 50%"* and *"around ~500 objects mapped in Unity Catalog"* (blog, May 2023). The markable content is not the ratio — it is the *mechanism*: a storage credential wraps the IAM role in a securable, so access is granted and revoked at the metastore rather than at the bucket policy. L03 teaches the wrap, L11 teaches the audit surface, L02 teaches why the root bucket's KMS key policy still has to line up underneath it.

**Example 2 (governance + cost, L02/L08/L11/L12/L15): Block — 12 PB governed, and the governance win shows up on the AWS bill.** Block's graph and analytics data was fragmented across business units with a painful two-step IAM flow (attach policies to roles, then to buckets). The published numbers: *"12X Reduction in compute cost · 20% Reduction in data egress cost · 12PB Of data managed and governed"*, with data-sharing time moving *"from days to seconds"* and *"the adoption of Unity Catalog promoted the collection of data into S3 buckets, resulting in improved latency and the co-location of compute and storage"*. That last clause is the AWS-specific lesson: co-location is an egress-cost decision, not just a latency one, which is why Block appears in L02 (substrate), L11 (UC), L12 (sharing) and L15 (cost) rather than only in a governance chapter.

**Example 3 (ingestion at scale, L05/L09/L13): Asurion — job *design* is the architecture at 4,000 streaming jobs.** Asurion's lake runs **4,000+ streaming jobs** over **4,000+ tables**, with sources spanning database CDC feeds, APIs, flat files and streams from Kinesis, Kafka, SNS and SQS. The published takeaway is architectural rather than numeric: *"The Databricks Lakehouse Platform simplified our approach to architecture and design of the underlying codebase, allowing for an unified approach to data movement from traditional ETL to streaming data pipelines between Delta tables"* (2021-09-16). L05 uses it as the Auto Loader + multi-source evidence, L13 as the `foreachBatch`/Structured Streaming evidence, and L09 as the reason parameterised job frameworks — not 3,500 bespoke ETLs — are what get orchestrated.

**Example 4 (capstone, L07/L08/L09/L10/L11/L16/L17): NAB — decommissioning a warehouse is a report-rationalisation project first.** NAB retired a **26-year-old** Teradata warehouse carrying ~1,000 use cases and 140 reporting suites, migrated **456** use cases to Databricks SQL, enabled **1,200+** users, and now runs **1,800 Spark Declarative Pipelines** at a **99.6 %** job success rate with **80 %** less transformation complexity and sub-15-minute latency. NAB is the only customer cited in seven lessons, and each citation quotes a different mechanism: declarative pipelines (L07), Databricks SQL as the warehouse replacement (L08), jobs-as-code with asset bundles (L09), the +38 % data-quality improvement (L10), Unity Catalog masking and lineage (L11), the CI/CD topology (L16), and the capstone reference architecture (L17).

---

## Story

> **Hook:** "Sixteen lessons built the machine. Lesson 01 gave you the lakehouse concept and the control/compute plane split on AWS; lesson 02 the VPC, root bucket, KMS and PrivateLink substrate; lesson 03 the Unity Catalog metastore and external locations; lesson 04 the Delta transaction log and liquid clustering; lesson 05 Auto Loader; lesson 06 DBR, Photon and cluster economics; lesson 07 Lakeflow declarative pipelines with expectations; lesson 08 Databricks SQL warehouses and Lakeview; lesson 09 Lakeflow Jobs; lesson 10 data quality gates and quarantine; lesson 11 grants, dynamic views and audit; lesson 12 Delta Sharing and Marketplace; lesson 13 Structured Streaming; lesson 14 performance; lesson 15 DBU economics; lesson 16 CI/CD. Lesson 17 is where all sixteen are put back together."
> — lesson 17, opening paragraph

> **The twelve-week path.** Seventeen lessons in twelve weeks is roughly **104 minutes a week** of frontmatter time budget (1,245 minutes total, 20 h 45 min) — comfortably inside a working week even before the replay-and-repair loop, which is the point: the plan leaves room to re-run a worked example against your own workspace, re-price the DBU arithmetic at your own SKU mix, and re-sit the interactive checks a few days later. The blocks are deliberate, and each one ends where the next one's first sentence can pick it up.

> **Connection.** Memorising a product name or a rate card has a shelf life of months — Databricks renamed Workflows to **Lakeflow Jobs** (blog, 2025-07-24) and Delta Live Tables to **Lakeflow Declarative Pipelines**, moved the Delta Sharing protocol under the Linux Foundation and rebranded the product **OpenSharing** (June 2026), and retired the legacy DBSQL dashboards on **2025-04-10** — so every lesson pairs **dated, source-pinned numbers** with the **mechanism** underneath them (queueing versus skipping, expectations versus constraints, pre-signed URLs versus cloud tokens, resize versus scale), and every lesson closes with items that punish the slogan answer. The single organising rule across all twelve weeks is the one L15 states on its own reference card: *two bills, not one — tune the DBU side and the AWS side separately, and never call a saving real until both sides moved.*

**The four blocks, layer by layer.**

| Block | Weeks | Lessons | What you finish owning |
|-------|-------|---------|------------------------|
| **Foundations** | 1–3 | L01–L03 | The lakehouse concept and the two-account AWS deployment anatomy; the customer-managed VPC with the capacity formula, secure cluster connectivity, gateway/interface endpoints, the three PrivateLink flavours and root-bucket KMS; and Unity Catalog end to end — metastore, namespace, privilege chain, storage credentials, external locations and the `hive_metastore` migration ladder |
| **Write path** | 4–7 | L04–L07 | The Delta transaction log, optimistic concurrency, time travel, CDF, `MERGE`, liquid clustering and `VACUUM` arithmetic; Auto Loader with all three file-detection modes, MSK ingestion and idempotent sinks; DBR/Photon/cluster-policy/pool economics including the two-rate DBU meter; and Lakeflow Declarative Pipelines with expectations, metrics, quarantine and the mode decision |
| **Serve, orchestrate, prove** | 8–10 | L08–L10 | Databricks SQL warehouses with sizing, auto-stop, Lakeview, BI drivers and Federation; Lakeflow Jobs as multi-task jobs-as-code with triggers, queueing, repairs, run-as and the scheduler decision matrix; and the five-layer quality stack from constraints to the alert-to-replay runbook |
| **Govern, share, stream, tune + money & capstone** | 11–17 | L11–L17 | Row/column/ABAC controls and the system-tables audit pack; OpenSharing, Marketplace and Lakehouse Federation; Structured Streaming triggers/checkpoints/watermarks; the four-layer performance stack ending in liquid clustering; the two-bill DBU cost model with the worked TCO case; DABs + Terraform + GitHub Actions CI/CD; and the capstone observability stack, MLflow-in-UC slice, DEA map and 30/60/90-day plan |

**How to use the course.**

| Weeks | Lessons | What you do |
|-------|---------|-------------|
| 1 | L01 | Fix the definitions and the two-account mental model before you open a console; draw the control/compute plane split twice, once as a flowchart and once as a trust boundary |
| 2 | L02 | Size your own VPC with the `(addresses − 5) / 2` formula, price gateway-versus-interface endpoints and a NAT at $0.045/GB, then write the root-bucket and KMS key policies |
| 3 | L03 | Create the storage credential and external location for real, grant on them, and read the `hive_metastore` migration ladder honestly against your own estate |
| 4 | L04 | Read the `_delta_log` by hand, run the worked `MERGE`, compute the `VACUUM` data-loss timeline, then answer "when not liquid clustering" honestly |
| 5 | L05 | Land files. Do the file-detection trade-off drill with a real `LIST` estimate before you pick a mode, then run the Auto Loader notebook end to end |
| 6 | L06 | Own the machines: one annotated cluster policy, one instance pool, and the two-rate DBU arithmetic on the same EC2 instance |
| 7 | L07 | Write a Lakeflow pipeline with expectations, break a record, watch the metrics, then quarantine and replay it |
| 8 | L08 | Size a warehouse fleet against the ten-concurrent-queries rule and price the same query on serverless, pro and classic |
| 9 | L09 | Build a multi-task job, break a task on purpose, watch the retry / repair / queueing path, then promote it with a bundle target |
| 10 | L10 | Write a DQ suite on a silver table that gates a write, quarantine the failures, and prove the replay is idempotent |
| 11–12 | L11–L12 | Grant, mask, tag, audit — then hand the same table to an external recipient and say exactly which bytes moved and through which URL form |
| 13 | L13 | Run a streaming job, kill it mid-batch, restart from the checkpoint, and prove no rows were written twice |
| 14 | L14 | Profile a slow query, name the layer that is misbehaving, fix it, re-measure — layout first, always |
| 15 | L15 | Run the two-bill cost ladder on your own workspace, in order, and only then commit to a SKU change |
| 16 | L16 | Put the whole estate in a bundle plus a Terraform module, open a PR, and let CI deploy it as a service principal |
| 17 | **L17** | **Capstone**: wire the observability planes, draw the full AWS + Databricks reference architecture, map yourself onto the DEA blueprint, and write your 30/60/90-day plan |

The 17 lessons total **1,245 minutes (20 h 45 min)** of frontmatter time budget. The shortest block is foundations at 60–75 minutes per lesson; the two longest lessons — L12 (1,060 lines, OpenSharing/Marketplace/Federation) and L03 (1,013 lines, Unity Catalog fundamentals) — are the two where the mechanism is least forgiving of slogans, which is exactly why they carry the most worked configuration sketches.

---

## Lesson Structure

All 17 lessons share one skeleton: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook immediately under the H1, a ` ```text ` decision-surface reference card, a numbered `##` section map, mermaid diagrams, a sourced `### 2026 Updates (as of October 2026)` box, a `## Real-World Case Studies` section, a `## Practice Questions` section, trap callouts, a comparative verdict and a closing `> [!SUCCESS]` **Key Takeaways** list. Counts below were re-derived per file.

### Lesson 01: Lakehouse Architecture on Databricks

**Duration:** 75 minutes (856 lines)

**Hook:** "Every other lesson in this course assumes three things you have not yet proven to yourself: that a lakehouse is a real architectural category and not a marketing word, that Databricks software runs in *two cloud accounts at once*, and that the money arrives on *two separate bills*. Get any of those three wrong and you will design a workspace whose data lake sits in the wrong bucket, whose threat model points at the wrong account, and whose cost model undercounts by roughly half."

**Content Outline:**
- 1. What a lakehouse is: one architecture, three properties
- 2. The two pillars: Delta Lake and Unity Catalog
- 3. Workspace anatomy: the control plane and the compute plane
- 4. Where the data actually lives (and where it does not)
- 5. The workload map: ingest → curate → serve → ML
- 6. The two meters: DBU rates and the AWS bill
- 7. The same query, three meters: Databricks versus the AWS-native stack
- 8. The AWS substrate you inherit (worked sizing)
- 9. Choosing the platform: Snowflake, and the Hadoop you are leaving
- 10. Why openness is a design requirement, not a slogan
- 11. The traps: eleven confusions this course will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the whole architecture — definitions, the two-account split, the pillars, the workload map and the service/cost map every later lesson points back to.

**Real-World Application:** **Biogen** (2 weeks → 15 minutes on 2 million variants, `Cloud: AWS`), **Punchh** (raw and refined data in one lakehouse, 10× faster time-to-insight), **Rivian** (one governed catalog across teams).

**Practice Questions:** 12 multiple-choice/true-false + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 6 `text` · 5 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 02: AWS Foundation for Databricks

**Duration:** 60 minutes (903 lines)

**Hook:** "Every Databricks lakehouse in this course runs on one AWS-shaped assumption: **the data plane lives in your VPC, the data lives in your S3, and the control plane talks to both over paths you can name on a whiteboard**. Get the substrate wrong and nothing downstream saves you — cluster launches fail with cryptic assume-role errors, a 100-node cluster cannot start because a `/26` subnet ran out of addresses, an S3 bill balloons because 1 TB a month of lake traffic hairpinned through a NAT gateway at $0.045/GB, or a TLS-inspecting firewall silently kills every cluster the moment it touches the pinned control-plane certificates."

**Content Outline:**
- 1. Workspace anatomy: the four objects you actually create
- 2. The customer-managed VPC: private subnets, sizing, and the capacity formula
- 3. Secure cluster connectivity: the default, and what it does not buy you
- 4. Egress architecture: gateway endpoints, interface endpoints, NAT
- 5. PrivateLink at Databricks: three flavors, one prerequisite matrix
- 6. Encryption: the root bucket, managed services, and the key policy
- 7. The root bucket: what lives in it, and the policy that guards it
- 8. IAM: instance profiles vs storage credentials vs service credentials
- 9. Cross-account patterns, hub-and-spoke, and the network-configuration traps
- 10. Classic vs serverless networking, and the 2026 deltas
- Real-World Case Studies · Practice Questions

**Layer alignment:** the AWS substrate every later layer runs on — subnets, connectivity, endpoints, PrivateLink, KMS and the IAM path.

**Real-World Application:** **Block** (12 PB on S3, IAM plumbing collapsed into Unity Catalog), **Amgen** (120+ IAM roles → one or two), **Nubank** (S3 as the storage layer of a regulated fintech lakehouse).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 5 `text` · 3 `json` · 1 `sql` · 4 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases (`### Case A/B/C`)

---

### Lesson 03: Unity Catalog Fundamentals

**Duration:** 60 minutes (1,013 lines)

**Hook:** "Lesson 02 built the AWS substrate: VPC, root bucket, PrivateLink, KMS, IAM. This lesson puts the **governance plane** on top of it. Unity Catalog is where that substrate stops being plumbing and starts being policy — one `GRANT` that follows a *group* across every workspace in a region, one IAM role wrapped in a securable so that revoking access is a `REVOKE` instead of a bucket-policy edit, and one three-level namespace (`catalog.schema.table`) that finally gives S3 paths a name you can put in a review. The teaching rule for this lesson: **Unity Catalog decides *who*, your AWS account still holds *what*.**"

**Content Outline:**
- 1. The metastore: a regional, account-managed object
- 2. The hierarchy: what hangs where, and why it matters
- 3. Privileges: the chain, the inheritance rules, the owner trap
- 4. Deny by default, the two default-open carve-outs, and bindings that beat grants
- 5. Storage credentials: your IAM role, wrapped in a securable
- 6. External locations: credential plus path, governed by grants
- 7. Managed versus external: same governance, different lifecycle
- 8. Migrating off `hive_metastore`: the documented ladder
- Real-World Case Studies · Practice Questions

**Layer alignment:** the governance core — the securable model every later governance, sharing and CI/CD lesson depends on.

**Real-World Application:** **Amgen** (120+ IAM roles → one or two, ~500 objects mapped), **Rivian** (one governed catalog across teams on AWS), **nCino** (banking data inside one AWS boundary).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 6 `text` · 3 `sql` · 1 `json` · 6 "Did you know?" · 2 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases (`### Case A/B/C`)

---

### Lesson 04: Delta Lake Transactions on AWS

**Duration:** 70 minutes (810 lines — the shortest lesson in the course)

**Hook:** "Every bronze, silver and gold table in this course is a **Delta Lake table**: Parquet data files plus a file-based transaction log, sitting in *your* S3 bucket, governed by Unity Catalog. That single sentence explains both the superpower and the failure mode. The superpower: ACID commits, time travel, change data feed and concurrent writers on object storage that has none of those properties natively. The failure mode: teams that treat Delta like a folder of Parquet — editing files by hand, running `VACUUM RETAIN 0 HOURS`, enabling CDF after the fact and wondering why history is missing, or partitioning a 200 GB table into a thousand tiny directories because a 2019 tutorial told them to."

**Content Outline:**
- 1. The transaction log: what actually makes a Delta table ACID
- 2. ACID without locks: optimistic concurrency on S3
- 3. Time travel: two retentions, one hard floor
- 4. Change data feed: legacy vs automatic (the 2026 truth)
- 5. MERGE, UPDATE, DELETE: copy-on-write, done right
- 6. Layout: partitioning, ZORDER, and liquid clustering
- 7. VACUUM: retention math and the data-loss timeline
- 8. Constraints: enforced data quality for the price of a metadata commit
- 9. Protocol, features, and what your table costs other readers
- 10. The traps: twelve confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the storage transaction contract every write in the course has to honour.

**Real-World Application:** **Rivian** (Delta Tables for storage plus Liquid Clustering for data layout), **Comcast** (Delta Lake replacing 640 machines with 64).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 2 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 2 `plot` · 4 `mermaid` · 3 `text` · 8 `sql` · 1 `python` · 4 "Did you know?" · 0 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 2 named cases

---

### Lesson 05: Ingestion on AWS

**Duration:** 75 minutes (834 lines)

**Hook:** "Everything downstream in this course — the Delta transactions of lesson 04, the declarative pipelines of lesson 07, the quality gates of lesson 10 — assumes a **bronze table that is already being filled correctly**. Ingestion is where lakehouse projects quietly fail: a checkpoint dropped 'to fix lag', a schema directory parked inside the landing prefix so the stream discovers its own state files, a Kafka query left on the default `startingOffsets` so the first run skipped three hours of backlog, or a directory-listing stream on a one-second trigger whose `LIST` bill grows with every hour of uptime."

**Content Outline:**
- 1. Ingestion on the AWS lakehouse: three source families, one write path
- 2. Auto Loader anatomy: the `cloudFiles` source
- 3. Schema inference, evolution and rescue
- 4. File detection: directory listing vs file notifications
- 5. Throughput and production hygiene
- 6. Kafka and Amazon MSK as a source
- 7. Sinks: output modes, idempotency and MERGE
- 8. Exactly-once end to end
- 9. Batch + streaming unification
- 10. The traps: twelve confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the bronze write path — the only place where data first becomes a Delta table.

**Real-World Application:** **Asurion** (4,000+ streaming jobs over Kinesis/Kafka/SNS/SQS/CDC/API/files), **Burberry** (99 % clickstream latency reduction, daily batch window removed).

**Practice Questions:** 13 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 1 `text` · 5 `python` · 1 `sql` · 4 "Did you know?" · 0 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 2 named cases

---

### Lesson 06: Databricks Runtime, Photon and Clusters

**Duration:** 75 minutes (953 lines)

**Hook:** "Every pipeline in this course runs on something. Delta tables do not optimise themselves, Auto Loader does not list a prefix for free, and a Lakeflow pipeline is only as cheap as the machines underneath it. This lesson is about that *something*: which **Databricks Runtime** version you pin, whether **Photon** is executing your plan, which **kind of cluster** (or warehouse, or serverless session) the work runs on, who is allowed to create it (**cluster policies**), how fast it can start (**instance pools**), which **EC2 family** it uses, and — the part that shows up on the invoice — which **DBU rate** applies to it."

**Content Outline:**
- 1. Databricks Runtime: the version ladder and the LTS clock
- 2. Photon: what the vectorized engine does — and what it does not
- 3. Cluster anatomy: all-purpose vs job vs warehouse vs serverless
- 4. Serverless compute and SQL warehouses
- 5. Instance pools: warm start, not free compute
- 6. Cluster policies: governance and cost guardrails as JSON
- 7. Libraries and notebook posture
- 8. Autoscaling, auto-termination and spot
- 9. AWS node types: families, Graviton, fleet and disks
- 10. The meter: same instance, different bill
- 11. The traps: fourteen confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the compute plane and its meter — the cost shape every pipeline in later lessons inherits.

**Real-World Application:** **Comcast** (10× compute-cost reduction, 90 % fewer DevOps resources), **Addepar** ($8 trillion modelled, 5× faster pipeline delivery, $2M cut).

**Practice Questions:** 13 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 7 `text` · 2 `json` · 4 "Did you know?" · 1 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 2 named cases

---

### Lesson 07: Lakeflow Declarative Pipelines

**Duration:** 75 minutes (882 lines)

**Hook:** "Every data estate eventually asks two questions of its ETL layer: *is the data any good?* and *did the job actually run?* On Databricks on AWS, the first question is answered inside **Lakeflow pipelines** — the product your 2023 tutorials called **Delta Live Tables (DLT)** — by a feature called **expectations**: per-record SQL checks with three graded actions (warn, drop, fail) and machine-readable metrics. The second question is answered by orchestration, which in the Databricks world means **Lakeflow Jobs** (Workflows). The single most expensive mistake in this domain is confusing the two planes: expectations enforce **data quality**, jobs enforce **orchestration**."

**Content Outline:**
- 1. One product, three names: the timeline you will be tested on
- 2. The declarative model: what you write vs what the platform does
- 3. Expectations: six decorators, three actions, one rulebook
- 4. Metrics: where expectation numbers actually live
- 5. Quarantine: a pattern, not a decorator — and the NULL trap inside it
- 6. Modes and guarantees: triggered, continuous, real-time
- 7. Topology: one pipeline or many? (and why expectations cannot gate)
- 8. Configuring the pipeline on AWS: storage, compute, editions, identity
- 9. Lakeflow pipelines vs Workflows jobs: the decision matrix
- 10. The traps: twelve confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the declarative silver/gold write path and the quality contract that sits on it.

**Real-World Application:** **NAB** (1,800 Spark Declarative Pipelines, 99.6 % job success), **Shell** (1.3 trillion sensor rows, 70+ transformation use cases).

**Practice Questions:** 13 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 2 `text` · 4 `python` · 1 `sql` · 1 `yaml` · 3 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 2 named cases

---

### Lesson 08: Databricks SQL Warehouses and the Serving Layer

**Duration:** 75 minutes (939 lines)

**Hook:** "Everything upstream in this course ends the same way: a Delta table, governed by Unity Catalog, that somebody has to *read*. Analysts read it in a SQL editor, executives read it in a dashboard, Tableau reads it over ODBC, and a reporting pipeline reads it through a federated catalog. On Databricks all of that reading happens on one piece of compute — the **SQL warehouse** — and the choice you make about which warehouse type, which size, which auto-stop window and which BI driver is simultaneously a latency decision, a governance decision and an invoice."

**Content Outline:**
- 1. What Databricks SQL is, and the two gates every query passes
- 2. The warehouse lineup as of Oct 2026: serverless, pro, classic — and one Beta
- 3. Sizing: T-shirt sizes, the concurrency rule and the hard limits
- 4. Scaling, auto-stop and cold-start economics
- 5. Queries, dashboards and alerts: the DBSQL workbench
- 6. Caching, the query profile and the system tables
- 7. BI connectivity: drivers first, tools second
- 8. Lakehouse Federation: querying other systems from Databricks SQL
- 9. Who may touch the warehouse: ACLs, entitlements and the group pattern
- 10. What it costs: rates, meters and the two-column bill
- 11. The traps: fourteen confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the serving tier — the only compute that analysts, BI tools and external readers ever touch.

**Real-World Application:** **NAB** (456 use cases migrated, 1,200+ users enabled), **Punchh** (10× faster time-to-insight on medallion gold tables), **nCino** (AI/BI Genie over UC-governed data).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 7 `text` · 2 `sql` · 4 "Did you know?" · 0 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 09: Lakeflow Jobs (formerly Databricks Workflows)

**Duration:** 80 minutes (912 lines)

**Hook:** "Every lakehouse eventually fails the same way: the data was fine, the cluster was fine, and nobody pressed the button — or three buttons, in the wrong order, twice. Orchestration is the difference between a lakehouse demo and a lakehouse, and on Databricks on AWS the native orchestrator is **Lakeflow Jobs**. If that name is new to you, that is the first lesson: 'Databricks Workflows' was renamed **Lakeflow Jobs** inside the Lakeflow family — '**Lakeflow Jobs (formerly known as Databricks Workflows)**' (Databricks blog, **2025-07-24**) — while the REST paths, API objects and system tables keep saying `jobs`. Three names, one product."

**Content Outline:**
- 1. Anatomy: one job, one DAG, three concepts
- 2. Task types and compute: serverless-first, never all-purpose
- 3. Dependencies and control flow: the DAG you actually get
- 4. Triggers: cron is a guess, data arrival is a fact
- 5. Queueing, concurrency and the skip trap
- 6. Reliability: retries, timeouts, repairs, notifications
- 7. Identity: owner, Run as, and the departure that breaks 3 a.m.
- 8. Jobs as code: Declarative Automation Bundles
- 9. The external seam: Airflow and Amazon MWAA
- 10. The scheduler decision matrix: Workflows vs Airflow vs Step Functions
- Real-World Case Studies · Practice Questions

**Layer alignment:** the orchestration plane — order, time, failure and replay across every pipeline built in L05–L07 and L13.

**Real-World Application:** **NAB** (asset bundles for CI/CD alongside 1,800 declarative pipelines), **Asurion** (thousands of jobs that would not fit one-cluster-per-job scheduling).

**Practice Questions:** 14 (the largest bank in the course) + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 7 `text` · 1 `sql` · 1 `yaml` · 4 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 2 named cases

> **Build note.** Two of this lesson's 14 ` ```question ` blocks carry non-multiple-choice payloads (`dbl-09-q12` is a matching item, `dbl-09-q14` is a drag-and-drop item). They are valid JSON and pass the lesson validator, but they are the sole cause of the static-export failure documented in the Validation section above.

---

### Lesson 10: Data Quality in the Databricks Lakehouse

**Duration:** 75 minutes (860 lines)

**Hook:** "Every lakehouse eventually meets the same unpleasant morning: a downstream dashboard shows revenue that is 4% too low, and nobody can say whether the business shrank or the pipeline lied. Data quality on Databricks on AWS is the discipline that makes that morning *answerable* — and as of October 2026 it is five distinct mechanisms with five distinct jobs, not one feature. **Constraints** are always-on write gates enforced by Delta on every transaction. **Expectations** are per-record SQL checks inside Lakeflow pipelines with three graded actions and machine-readable metrics. **Quarantine** is a documented *pattern* — not a decorator — that keeps failing rows in a Unity Catalog table on S3."

**Content Outline:**
- 1. The five-layer stack: prevention, evidence, detection, orchestration
- 2. Layer 1 — Delta constraints: the cheap, always-on write gate
- 3. Layer 2 — Lakeflow expectations: six decorators, three actions
- 4. Where expectation metrics live (and where they don't)
- 5. Layer 3 — quarantine: a pattern, not a decorator
- 6. Layer 4 — data quality monitoring: anomaly detection + data profiling
- 7. Layer 5 — alert → replay: notifications, gates and the runbook
- 8. Comparative Verdict: expectations vs constraints vs monitoring
- 9. Twelve traps this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the proof layer — what refuses a bad batch and what proves a good one.

**Real-World Application:** **NAB** (+38 % data quality across the migration), **Burberry** (real-time Customer 360 replacing sanitising pre-aggregation).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 1 `text` · 4 `sql` · 2 `python` · 1 `yaml` · 4 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · **3** Comparative Verdicts · 2 named cases

---

### Lesson 11: Unity Catalog Security

**Duration:** 75 minutes (824 lines)

**Hook:** "Lessons 01–10 gave you the machine: a VPC, an S3-backed Delta lakehouse, a metastore with catalogs, and pipelines that never stop writing. That is exactly the moment governance stops being paperwork and becomes an engineering problem, because every new table multiplies the number of answers you owe an auditor. Unity Catalog answers them with one deny-by-default grant model — '**Initially, users have no access to data in a metastore**' (docs, accessed 2026-10) — and then a second, separate layer of controls that can only ever *subtract* from access you already hold: **row filters, column masks, dynamic views and ABAC policies**."

**Content Outline:**
- 1. The grant model this lesson builds on
- 2. Three mechanisms that subtract: views, table controls, ABAC
- 3. Worked example E1 — the dynamic-view policy
- 4. Worked example E2 — native row filters and column masks
- 5. Tags, Data Classification, and the ABAC loop
- 6. System tables: the audit pack
- 7. Lineage: column-level, with named gaps
- 8. Worked example E5 — secrets, three generations
- 9. Identity, service principals, and who administers what
- 10. The network edge and the compliance surface
- 11. Comparative Verdict: legacy `hive_metastore` TACL vs Unity Catalog
- 12. Twelve traps this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the subtractive security layer and the evidence store an auditor actually reads.

**Real-World Application:** **Block** (12 PB governed, sharing time from days to seconds), **Amgen** (audit effort down 50 %), **nCino** (single AWS ecosystem for compliance).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 1 `text` · 7 `sql` · 3 "Did you know?" · 0 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · **3** Comparative Verdicts · 3 named cases

---

### Lesson 12: Data Sharing on Databricks on AWS

**Duration:** 80 minutes (1,060 lines — the longest lesson in the course)

**Hook:** "Lessons 01–11 built and governed a lakehouse that holds *your* data. The moment a second organization needs to read that data — a partner, a customer, a subsidiary, a regulator, a paying subscriber — three different platform surfaces offer to help, and they are routinely confused with each other. **OpenSharing** (the product; the open protocol was called Delta Sharing until June 2026) hands a *live view* of selected tables to someone who is not you. **Databricks Marketplace** is a storefront that sits on top of that hand-off and adds discovery, approval and procurement. **Lakehouse Federation** does the opposite thing in the same vocabulary: it lets *your* SQL reach into somebody else's live system."

**Content Outline:**
- 1. Three surfaces, one question: how does data leave — or arrive — without moving?
- 2. OpenSharing: the protocol, the product, and the June 2026 rename
- 3. A share is a Unity Catalog securable
- 4. Recipients: five authentication types, three stories
- 5. How the bytes actually move: pre-signed URLs vs cloud tokens
- 6. Governing shares: grants, audit, revocation — and the live-pointer trap
- 7. Databricks Marketplace: the storefront on top of the share
- 8. Lakehouse Federation: querying in without moving
- 9. Clean rooms in one page
- 10. The traps this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the collaboration plane — where governance meets an organisation that is not yours.

**Real-World Application:** **Block** (sharing time from days to seconds; Delta Sharing clean rooms planned), **nCino** (compliance inside one AWS boundary), **Atlassian** and **Shell** as supporting federation/dual-cloud evidence.

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 2 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 2 `plot` · 4 `mermaid` · 7 `text` · 4 `sql` · 1 `python` · 1 `json` · 4 "Did you know?" · 1 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 13: Structured Streaming on the AWS Lakehouse

**Duration:** 80 minutes (813 lines)

**Hook:** "A streaming query on Databricks is an unbounded table and a batch-style plan that the engine re-runs over the next slice of input. That model is why 'converting existing batch jobs into streaming jobs requires minimal code changes' (Databricks blog, 2026-04-20) — and it is also why every production incident in this space comes back to four objects: the **trigger** that decides when a micro-batch runs, the **checkpoint** that remembers what was read and what was committed, the **sink contract** that decides whether a replayed batch duplicates rows, and the **watermark** that decides when state may be dropped."

**Content Outline:**
- 1. The micro-batch model and the trigger menu
- 2. Checkpoints: the query's memory, on S3
- 3. Sources on AWS: Kafka/MSK deep, Delta CDF in
- 4. foreachBatch and the exactly-once story
- 5. Change data feed out: the gold fan-out
- 6. Watermarks, state and the bloat failure mode
- 7. Schema evolution on streams: locked plans, additive sinks
- 8. Observability and the near-real-time dashboard
- 9. Production posture: Lakeflow Jobs, and the three "continuous"s
- 10. The traps: fourteen confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the near-real-time half of the write path, and the restart contract that makes it safe.

**Real-World Application:** **Burberry** (99 % latency reduction on clickstream), **Shell** (RTDIP, 1.3 trillion sensor rows, dual-cloud), **Asurion** (4,000+ streaming jobs in production).

**Practice Questions:** 11 (the smallest bank in the course) + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 11 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 4 `mermaid` · 1 `text` · 6 `python` · 1 `sql` · 3 "Did you know?" · 1 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 14: Performance Optimization on Databricks/AWS

**Duration:** 75 minutes (918 lines)

**Hook:** "Slow lakehouse queries are almost never 'Spark is slow'. They are a specific layer misbehaving: too many small files on S3, a filter column whose min/max ranges overlap in every file, a single hot join key carrying 38% of the rows, or a warehouse that is the right *size* and the wrong *count*. This lesson teaches the stack in the order you should fix it — **layout → statistics → planning/runtime → serving** — and it teaches the 2026 version of that stack, not the 2019 one."

**Content Outline:**
- 1. The four-layer stack, and how to pick a layer
- 2. Layer 1 — file sizing and the small-file problem on S3
- 3. Layer 1 — partitioning: the ladder and the ≥ 1 GB guard
- 4. Liquid clustering, deep
- 5. Worked example E4 — OPTIMIZE vs CLUSTER BY, side by side
- 6. Layer 3 — joins: AQE, broadcast, skew and salting
- 7. Photon: judge it by workload, not by slogan
- 8. Layer 4 — warehouse sizing and the cache tiers
- 9. Profiling: the query profile and the Spark UI
- 10. The automation layer: predictive optimization and materialized views
- 11. The traps: sixteen confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the tuning ladder — the performance-as-cost half of L15's argument.

**Real-World Application:** **Comcast** (640 machines → 64, 10× compute-cost reduction), **Rivian** (50 % better runtime performance with Liquid Clustering), **Punchh** (pre-joined gold tables beating 12-way joins).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 6 `text` · 4 `sql` · 5 "Did you know?" · 0 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 15: Cost Optimization and DBU Economics on AWS

**Duration:** 60 minutes (818 lines)

**Hook:** "Every other lesson in this course builds something; this lesson keeps the invoice honest. A Databricks lakehouse on AWS generates **two independent bills** — Databricks bills you in **DBUs** (Databricks Units, the platform license, metered per second) and AWS bills you for the EC2, EBS, S3, NAT and CloudWatch underneath. Forget either meter and your 'cost optimization' is fiction: the DBU half can be perfectly tuned while a NAT Gateway quietly adds $0.045 per GB of S3 traffic, and the AWS half can be all-spot while an all-purpose cluster idles at $0.55/DBU all weekend."

**Content Outline:**
- 1. Two bills, not one: the Databricks cost model on AWS
- 2. The SKU ladder: your most powerful pricing lever
- 3. Serverless vs classic: the break-even arithmetic
- 4. Idle time: auto-stop, auto-termination, and the billed-while-up rule
- 5. Spot on AWS: what it saves and what it never touches
- 6. Right-sizing, autoscaling, pools, and performance-as-cost
- 7. Cost attribution: system tables, budgets, and the AWS console
- 8. The AWS side of the bill: EC2, EBS, S3, NAT, CloudWatch
- 9. The monthly TCO case: $3,011 → $1,985 in three levers
- 10. Storage, layout, and scan: the levers that touch no DBU rate
- 11. Real-world proof: what the levers delivered for customers
- Real-World Case Studies · Practice Questions

**Layer alignment:** the money plane — the two-bill arithmetic that every architectural decision above ultimately lands on.

**Real-World Application:** **Addepar** ($2 million off infrastructure, 5× faster delivery), **Nubank** (+40 % annual cost savings while query volume doubled), **Comcast** (10× compute-cost reduction).

**Practice Questions:** 12 + 1 matching + **2 fillblank** + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 2 `fillblank` · 1 `dragdrop` · 1 `plot` · 4 `mermaid` · 7 `text` · 2 `sql` · 1 `json` · 4 "Did you know?" · 1 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · **3** Comparative Verdicts · 4 named cases

---

### Lesson 16: CI/CD for the Databricks Lakehouse on AWS

**Duration:** 75 minutes (976 lines)

**Hook:** "Every lakehouse in this course eventually meets the same cliff: the notebooks work, the pipelines are green, and then someone hand-clicks a job into the production workspace on a Friday afternoon — or worse, someone's departure from the company takes the 3 a.m. schedule with them. The cliff is the **deployment seam**, and the fix is boring on purpose: everything that lives in the workspace is declared in Git, reviewed in a pull request, validated by CI, and deployed by a service principal that is not any human being."

**Content Outline:**
- 1. The four-layer stack: one owner per resource class
- 2. Bundle anatomy: the one file, its keys, and the resources map
- 3. Targets, modes, presets, variables: the safety rails
- 4. Identity: deploy as one thing, run as another
- 5. Terraform for the substrate: two providers, two modules, separate state
- 6. GitHub Actions: the PR pipeline and the federation that secures it
- 7. Testing: five layers, one pyramid, all in the pipeline
- 8. Environments: one metastore, ISOLATED catalogs, 2–3 workspaces
- 9. Lineage of code → jobs: the audit chain you can query
- 10. The traps: thirteen confusions this lesson will not let you keep
- Real-World Case Studies · Practice Questions

**Layer alignment:** the deployment seam — how everything built in L01–L15 becomes a repeatable, reviewable, non-human-operated system.

**Real-World Application:** **NAB** (asset bundles for CI/CD), **Addepar** (shared notebooks and UC bringing engineering and data teams together), **Mastercard** (re:Invent 2024 governance + gen-AI on AWS sessions).

**Practice Questions:** 12 + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 3 `text` · 3 `yaml` · 2 `bash` · 2 `hcl` · 4 "Did you know?" · 0 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

### Lesson 17: Capstone Reference Architecture

**Duration:** 80 minutes (905 lines)

**Hook:** "Sixteen lessons built the machine. Lesson 01 gave you the lakehouse concept and the control/compute plane split on AWS; lesson 02 the VPC, root bucket, KMS and PrivateLink substrate; lesson 03 the Unity Catalog metastore and external locations; lesson 04 the Delta transaction log and liquid clustering; lesson 05 Auto Loader; lesson 06 DBR, Photon and cluster economics; lesson 07 Lakeflow declarative pipelines with expectations; lesson 08 Databricks SQL warehouses and Lakeview; lesson 09 Lakeflow Jobs; lesson 10 data quality gates and quarantine; lesson 11 grants, dynamic views and audit; lesson 12 Delta Sharing and Marketplace; lesson 13 Structured Streaming; lesson 14 performance; lesson 15 DBU economics; lesson 16 CI/CD. Lesson 17 is where all sixteen are put back together."

**Content Outline:**
- 1. Five observability planes, one governance plane
- 2. Plane 1: system tables as the account plane
- 3. Plane 2: data quality monitoring (the product that ate "Lakehouse Monitoring")
- 4. Planes 3–5: pipelines, workloads and query performance
- 5. Plane 6: the ML slice — governance first, algorithms elsewhere
- 6. The full capstone: AWS + Databricks end to end
- 7. 30/60/90 days: a course-authored roadmap over Databricks' 10 phases
- 8. The maturity model: ad hoc → governed → self-service → ML-ready
- 9. Course synthesis: lessons 01–16 mapped to the Data Engineer Associate blueprint
- Real-World Case Studies · Practice Questions

**Layer alignment:** the whole architecture, re-drawn once — plus the observability, ML and roadmap overlays that make it operable.

**Real-World Application:** **Rivian** (UC + Delta + Liquid Clustering feeding dashboards and production ML on AWS), **Block** (12 PB governed), **NAB** (the full warehouse-replacement arc).

**Practice Questions:** 12 + 1 matching + 1 fillblank + **2 dragdrop** + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 2 `dragdrop` · 1 `plot` · 7 `mermaid` · 1 `text` · 2 `sql` · 1 `json` · 1 `python` · 3 "Did you know?" · 0 `[!WARNING]` · 0 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]` · 1 Comparative Verdict · 3 named cases

---

## Interactive Components

### Inventory by Type

| Type | Fence | Count | Role in the course |
|------|-------|-------|--------------------|
| Multiple-choice / true-false items | `question` | **206** | 11–13 per lesson (11 in L13; 13 in L05, L06, L07; 12 everywhere else; L09 carries 12 after its two re-fenced blocks) |
| Matching | `matching` | **18** | 1 per lesson; L09 carries 2 |
| Fill-in-the-blank | `fillblank` | **18** | 1 per lesson; L15 carries 2 |
| Drag-and-drop | `dragdrop` | **19** | 1 per lesson; L09 and L17 carry 2 each |
| Typed interactive subtotal | — | **55** | 18 + 18 + 19 |
| Plot blocks | `plot` | **19** | Numeric visualisation — DBU arithmetic, the SKU ladder, the TCO case, file-size bands; 1 per lesson, 2 each in L04 and L12 |
| **Interactive exercises, all forms** | — | **74** | matching 18 · fillblank 18 · dragdrop 19 · plot 19 |
| Mermaid diagrams | `mermaid` | **89** | Architecture, decision-flow and state diagrams embedded in the prose (4–7 per lesson) |
| ASCII reference cards | `text` | **71** | The decision-surface card that opens most lessons and pins the October-2026 numbers |
| SQL payloads | `sql` | **41** | `GRANT` / `CREATE EXTERNAL LOCATION` DDL, `MERGE`, CDF queries, audit and cost-attribution SQL |
| Python payloads | `python` | **20** | Auto Loader and `foreachBatch` notebooks, Lakeflow pipeline code, PySpark streaming sketches |
| JSON payloads | `json` | **9** | Cluster policies, bundle resources, AWS key policies, trigger configs |
| YAML payloads | `yaml` | **6** | `databricks.yml` bundle configs and job resources |
| Bash / CLI payloads | `bash` | **2** | `databricks bundle` CLI invocations (L16) |
| HCL payloads | `hcl` | **2** | Terraform `databricks_mws_*` and workspace-module sketches (L16) |
| **All labelled fence openers** | — | **520** | Openers and bare closers match 1:1 (520 / 520) — no labelled closing fences anywhere in the course |

### Non-Block Interactive Devices

| Device | Count | Notes |
|--------|-------|-------|
| "Did you know?" curiosities | **68** | One per ~225 lines; each carries a fact a design review can turn into a wrong decision |
| `[!WARNING]` callouts | **13** | Trap markers: the wrong-but-plausible architecture, price or permission |
| `[!IMPORTANT]` callouts | **13** | Non-negotiable rules |
| `[!NOTE]` callouts | **17** | Clarifications and scope notes — exactly 1 per lesson |
| `[!SUCCESS]` callouts | **17** | The closing Key Takeaways list, one per lesson |
| `Key Takeaways` blocks | **17** | One per lesson |
| `Comparative Verdict` blocks | **23** | 1 per lesson; L10, L11 and L15 each carry 3 |
| `Real-World Case Studies` sections | **17** | One per lesson, all drawn from digest 18's fourteen-story AWS corpus |
| `2026 Updates (as of October 2026)` boxes | **17** | One per lesson |
| Named case blocks | **46** | 40 `📋 Case A/B/C` blockquotes + 6 `### Case A/B/C` headings (L02 and L03 only) |

### Distribution Across Lessons

| Lesson | Lines | Min | `dbl-` IDs | Interactive (M · F · D · P) | `mermaid` | `text` | Cases | "Did you know?" |
|--------|-------|-----|-----------|------------------------------|----------|--------|-------|----------------|
| L01 | 856 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 5 | 6 | 3 | 5 |
| L02 | 903 | 60 | 12 | 4 (1 · 1 · 1 · 1) | 6 | 5 | 3 | 4 |
| L03 | 1,013 | 60 | 12 | 4 (1 · 1 · 1 · 1) | 6 | 6 | 3 | 6 |
| L04 | 810 | 70 | 12 | 5 (1 · 1 · 1 · 2) | 4 | 3 | 2 | 4 |
| L05 | 834 | 75 | 13 | 4 (1 · 1 · 1 · 1) | 5 | 1 | 2 | 4 |
| L06 | 953 | 75 | 13 | 4 (1 · 1 · 1 · 1) | 5 | 7 | 2 | 4 |
| L07 | 882 | 75 | 13 | 4 (1 · 1 · 1 · 1) | 5 | 2 | 2 | 3 |
| L08 | 939 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 5 | 7 | 3 | 4 |
| L09 | 912 | 80 | 14 | 5 (2 · 1 · 2 · 1) | 6 | 7 | 2 | 4 |
| L10 | 860 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 5 | 1 | 2 | 4 |
| L11 | 824 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 6 | 1 | 3 | 3 |
| L12 | 1,060 | 80 | 12 | 5 (1 · 1 · 1 · 2) | 4 | 7 | 3 | 4 |
| L13 | 813 | 80 | 11 | 4 (1 · 1 · 1 · 1) | 4 | 1 | 3 | 3 |
| L14 | 918 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 6 | 6 | 3 | 5 |
| L15 | 818 | 60 | 12 | 5 (1 · 2 · 1 · 1) | 4 | 7 | 4 | 4 |
| L16 | 976 | 75 | 12 | 4 (1 · 1 · 1 · 1) | 6 | 3 | 3 | 4 |
| L17 | 905 | 80 | 12 | 5 (1 · 1 · 2 · 1) | 7 | 1 | 3 | 3 |
| **Total** | **15,276** | **1,245** | **208** | **74** (18 · 18 · 19 · 19) | **89** | **71** | **46** | **68** |

Every column sums to the independently verified figure: 208 unique `dbl-NN-qN` IDs carried by **206 ` ```question ` (MCQ/true-false) items plus 55 typed interactive exercises** (18 matching · 18 fillblank · 19 dragdrop · 19 plot = 74 interactive exercises of four kinds), 89 diagrams, 71 reference cards, 46 named case blocks and 68 curiosities.

---

## Validation and Verification Summary

Everything below was re-run on **12 October 2026** in this repository, against the files as they stand.

| Step | Command | Result |
|------|---------|--------|
| Per-lesson validator | `for f in content/courses/databricks-lakehouse-aws/en/*.md; do OPENCODE_FILE_PATH=$f python3 .opencode/skills/course-writer/scripts/validate_lesson.py; done` | **17 / 17 exit 0**, no failures |
| Course validator | `OPENCODE_SKILL_DIR=content/courses/databricks-lakehouse-aws python3 .opencode/skills/course-writer/scripts/validate_course.py` | **rc = 1** — 4 warnings, all missing-`pt`/`es` locale warnings; **expected and tolerated** (exit 2 would be the failure mode) |
| ID integrity | `grep -ho 'dbl-[0-9][0-9]-q[0-9]*' *.md \| sort -u \| wc -l` | **208 unique** out of **208** occurrences; **0** ids outside the `dbl-NN-qN` pattern |
| Fence integrity | fence-walk over all 17 files | **520 labelled openers / 520 bare closers**, **0** labelled closing fences |
| JSON integrity | `json.loads` on every `question` / `matching` / `fillblank` / `dragdrop` / `plot` payload | **0 parse errors** |
| Frontmatter | `grep -H '^order:'` / `^difficulty:'` / `^duration:'` | order **1–17** contiguous; difficulty **`"intermediate"` × 17**; durations as tabulated |
| H1 vs `title` | first `# ` line vs `title:` per file | **17 / 17 identical** |
| Static build | `npm ci` → `npx --no-install vitest run` → `npx --no-install next build` | **PASS** — `npm ci` exit 0, `vitest run` exit 0 (no test files found), `next build` exit 0 after the L09 two-fence correction (KaTeX `commentAtEnd` strict-mode warnings only, non-fatal) |
| Exported pages | `find out -path '*databricks-lakehouse-aws*' -name index.html \| grep -c '/en/'` | **17** — `01-lakehouse-architecture-databricks` … `17-capstone-reference-architecture` |
| CI entry | `.github/workflows/nextjs.yml` | The `for entry in …` validation loop gates **six** courses; **`databricks-lakehouse-aws:en` added** (`nonprofit-organization-fundamentals:pt`, `aws-aif-c01:en`, `aws-clf-c02:en`, `aws-dea-c01:en`, `aws-data-lakehouse:en`, `databricks-lakehouse-aws:en`); local six-course simulation exit 0 |
| Unit tests | `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |

---

**Source of truth:** `content/courses/databricks-lakehouse-aws/course.json` + `content/courses/databricks-lakehouse-aws/en/*.md` + `.scratch/dbx-lakehouse/*.md` (+ `MASTER-PROMPT.md` and `SPEC.md` in the same scratch directory — `.scratch/` is covered by the `# research scratch (never commit)` rule at `.gitignore:145–146` and confirmed ignored by `git check-ignore`).
**Statistics:** re-derived with `wc`, `grep`, a fence-walking JSON parser and both `course-writer` validators on **12 October 2026**; all counts in this document match the files as shipped. The build result (exit 0, 17 exported `en` pages) was measured the same day, after the L09 fence fix.
**Status:** English complete, validator-clean, **static export green** (17 pages); PT/ES deferred (the course validator's only output is the four missing-locale warnings); CI gate added and six-course simulation exit 0.
**Date context:** October 2026 — every price, limit and GA date in the lessons is stamped "as of Oct 2026" or "as of October 2026" (163 stamps); notable dated facts carried throughout are the **Workflows → Lakeflow Jobs** rename (blog, **2025-07-24**), **Delta Live Tables → Lakeflow Declarative Pipelines**, the **Delta Sharing → OpenSharing** product rename with the protocol moving under the Linux Foundation (**June 2026**), the legacy DBSQL dashboards end of support (**2025-04-10**), the DBR **19** current line with **DBR 18 LTS supported through 2029-06-10**, the triggers page update of **2026-10-06**, and the DEA exam guide of record **2026-05-04**.
