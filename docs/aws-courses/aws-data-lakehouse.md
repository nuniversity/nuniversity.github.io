# Course: Building a Complete AWS Data Lakehouse: S3 to QuickSight

## Course Metadata

| Field | Value |
|-------|-------|
| **Slug** | `aws-data-lakehouse` |
| **Title** | Building a Complete AWS Data Lakehouse: S3 to QuickSight |
| **Area** | Data & Analytics |
| **Difficulty** | Intermediate |
| **Duration** | 12 weeks |
| **Lessons** | 17 |
| **Icon** | `database` |
| **Author** | Nuniversity |
| **Question ID prefix** | `lh-` (`lh-NN-qN`) |
| **Prerequisites** | Not declared in `course.json` |
| **Languages** | EN only (PT, ES deferred) |
| **Source directory** | `content/courses/aws-data-lakehouse/` (`course.json` + `en/`) |
| **Research digests** | `.scratch/aws-lakehouse/` — 19 files (`01-…` through `19-…`) |
| **Document statistics verified** | 11 October 2026 (every number below re-derived with `wc` / `grep` / the validators on the files themselves) |

> **What this course is — and is not.** This is an **architecture and build course**, not certification exam preparation. There is no exam guide, no domain weighting, no cut score and no simulation lesson. Seventeen lessons teach how to design and operate a production AWS data lakehouse end to end — storage, formats, table formats, ingestion, catalog, transformation, two query layers, orchestration, governance, PII, security, quality, cost and BI — for practitioners who already know what a join and a partition are and now have to make them work on AWS.

### Verified Course Statistics

| Metric | Value | Verification |
|--------|-------|--------------|
| Lesson files | **17** | `ls content/courses/aws-data-lakehouse/en/*.md \| wc -l` |
| Total lesson lines | **18,191** | `cat *.md \| wc -l` in `en/` |
| Total lesson bytes | **1,573,239** | `cat *.md \| wc -c` |
| Total lesson words | **232,389** | `cat *.md \| wc -w` |
| Shortest / longest lesson | **867** (L03) / **1,295** (L14) lines | `wc -l` per file |
| Average lesson length | **1,070** lines | 18,191 ÷ 17 |
| Lesson time budget | **1,035 minutes (17 h 15 min)** | sum of frontmatter `duration:` (55+60+55+65+60+65+55+65+60+60+60+65+60+60+60+60+70) |
| Per-lesson duration range | **55 min (L01, L03, L07) – 70 min (L17)** | frontmatter |
| Frontmatter `difficulty` | **`"intermediate"` × 17** | `grep -h '^difficulty:'` — 17 identical values; `course.json` carries `"Intermediate"` in the `en` block |
| Frontmatter `order` | **1–17, no gaps, no duplicates** | `grep -H '^order:'` |
| Multiple-choice `question` blocks | **205** | `grep -c '^```question'` summed over all 17 files |
| `matching` blocks | **17** | `grep -c '^```matching'` — exactly 1 per lesson |
| `fillblank` blocks | **17** | `grep -c '^```fillblank'` — exactly 1 per lesson |
| `dragdrop` blocks | **14** | `grep -c '^```dragdrop'` — absent in L01, L03, L09 |
| Typed interactive blocks (matching + fillblank + dragdrop) | **48** | 17 + 17 + 14 |
| `plot` blocks | **18** | `grep -c '^```plot'` — absent only in L05 and L14 |
| **Interactive exercises, all forms** | **66** | matching 17 · fillblank 17 · dragdrop 14 · plot 18 |
| Mermaid diagrams | **92** | `grep -c '^```mermaid'` |
| ASCII reference cards (`text`) | **143** | `grep -c '^```text'` |
| `sql` / `json` / `bash` / `python` blocks | **23 / 22 / 6 / 4** | `grep -c` per fence |
| Labelled fence openers | **561** | 205 q + 92 mermaid + 48 typed interactive + 18 plot + 143 text + 23 sql + 22 json + 6 bash + 4 python |
| Bare fence lines (closers) | **561** | `cat *.md \| grep -cx '```'` — 1:1 match, **0** labelled closing fences anywhere |
| "Did you know?" curiosities | **99** | `grep -h 'Did you know'` |
| `[!WARNING]` callouts | **48** | `grep -c '\[!WARNING\]'` — all 48 are block starts (`^> [!WARNING]`) |
| `[!IMPORTANT]` callouts | **41** | `grep -c '\[!IMPORTANT\]'` — all 41 are block starts |
| `[!NOTE]` / `[!SUCCESS]` callouts | **26 / 17** | `grep -c` — all are block starts |
| Total admonition callouts | **132** | 48 + 41 + 26 + 17 |
| `Key Takeaways` blocks | **17 / 17** | one per lesson, inside the closing `[!SUCCESS]` |
| `Comparative Verdict` blocks | **17 / 17** | one per lesson |
| `Real-World Case Studies` sections | **17 / 17** | one per lesson |
| `### 2026 Updates (as of October 2026)` boxes | **17 / 17** | one per lesson |
| `## Practice Questions` sections | **17 / 17** | the last `##` in every lesson |
| Named case headings (`### Case …`) | **41** | 1–4 per lesson (see the distribution below) |
| `as of Oct 2026` / `as of October 2026` stamps in lessons | **275** | `grep -o` over both spellings |
| Full `https://` URLs inside lessons | **3** | all three are the Glue Iceberg REST endpoint `https://glue.<region>.amazonaws.com/iceberg` in L04; everything else cites scheme-less first-party paths (5 unique `aws.amazon.com` paths) |
| Unfinished-work markers in lessons | **0 real** | 3 grep hits, all legitimate prose: the Athena term *placeholder* in `storage.location.template` (L09, twice) and the masking example mask `Jxxx Rxxxx` (L13). No TODO / FIXME / TBD / lorem ipsum anywhere |
| Locales shipped | **`en/` only** | `course.json` carries an `en` key only; no `pt/` or `es/` directory |
| Digest files | **19** (numbered 01–19) | `ls .scratch/aws-lakehouse/[01]*.md \| wc -l` |
| Digest lines / bytes | **8,198 / 1,257,047** | `cat .scratch/aws-lakehouse/[01]*.md \| wc -l` / `wc -c` — **≈1.26 MB** decimal |
| Digest size per file | **42,149 – 111,054 bytes** | `wc -c` per file; digests 03 and 08 are the smallest, digest 14 the largest |
| Digest section skeleton | **8 `##` headings (A–H) × 19 files** | per-file `grep -cE '^## [A-H]\. '` returns 8 for all 19 |
| Source entries pinned in digest section (A) | **853** | numbered / bold-numbered entries per digest (see inventory) |
| Question IDs | **205 total, 205 unique, 0 duplicates** | `"id": "lh-NN-qN"` — every ID matches the pattern, `sort -u` equals the total |

### Validation

| Check | Result |
|-------|--------|
| `.opencode/skills/course-writer/scripts/validate_lesson.py` (run with `OPENCODE_FILE_PATH`) | **17 / 17 lessons exit 0** |
| `.opencode/skills/course-writer/scripts/validate_course.py` (run with `OPENCODE_SKILL_DIR=content/courses/aws-data-lakehouse`) | **exit 1 — 4 warnings, all locale-related**: missing `pt`/`es` sections in `course.json` and missing `pt/`/`es/` directories. No structural, naming, ordering or frontmatter error is reported. |
| Integrity: question IDs | **205 IDs parsed from the 205 ` ```question ` blocks, 205 unique, 0 duplicates**, all matching `lh-NN-qN` (`lh-01-q1` … `lh-17-q12`) |
| Integrity: JSON parse | `course.json` parses clean; a full fence-walk over the 17 lessons found **271 JSON payloads** (205 question + 66 interactive) and **0 JSON errors** |
| Integrity: fence parity | **561 labelled openers vs 561 bare closers**, per file and in total — no labelled closing fence anywhere |
| `tests/test_opencode_courses.py` | Not applicable — its `COURSES` list covers the three `opencode-*` courses only |

> **Language status.** The course is **English-only today**. PT and ES are **deferred**: the directory contains a single locale folder (`en/`), `course.json` defines an `en` block only, and the course validator's entire output is the four missing-`pt`/`es` warnings quoted above. The `course-writer` and `i18n-translator` skills are the intended path for the later PT/ES pass; nothing in the shipped EN content blocks that translation.

> **Two naming facts the shipped files carry deliberately.** First, the BI layer was rebranded on **2025-10-09**: *Amazon QuickSight is evolving into Amazon Quick Suite*, with the service now **Amazon Quick** and the BI feature **Quick Sight**; APIs, ARNs and IAM actions still say `quicksight`, which is why this course writes "QuickSight" in prose and teaches the naming map explicitly in L01 and L17. Second, **AWS Glue 6.0** (GA **2026-08-21**) is treated as the current Glue line — Spark 4.1.1 / Python 3.13 / Scala 2.13.17, Iceberg 1.11.0 with **full Iceberg v3**, a 30 % effective price reduction — and Glue 5.1 remains the default version for new jobs. Both facts, plus **S3 Tables**, run through the whole course rather than being confined to a single update box.

---

## Course Description

> "End-to-end architecture and implementation course for a production AWS data lakehouse — S3 storage tiers including Glacier, open table formats (Iceberg/Hudi/Delta), Glue Data Catalog and ETL, Athena and Redshift query layers, streaming and batch ingestion, Lake Formation governance with row/column-level security, Macie-driven PII protection, orchestration, data quality, cost optimization, and QuickSight BI — with architecture diagrams, real AWS customer cases, worked pricing examples, and practice questions."
> — `content/courses/aws-data-lakehouse/course.json`, `en.description`

Seventeen lessons take a practitioner from "what is a lakehouse, in AWS's own words" to a running, governed, costed QuickSight dashboard backed by a seventeen-layer reference architecture. Lessons 01–04 are the **foundations**: the lake / warehouse / lakehouse definitions AWS actually publishes and the medallion pattern; S3 as the storage substrate with all eight storage classes and every Glacier tier priced; the file-format and compression decision that fixes the Athena bill for years; and the open table format layer (Iceberg deep, Hudi and Delta compared) that turns a pile of Parquet into a transactional table. Lessons 05–08 are the **pipeline**: batch ingress (DMS, AppFlow, DataSync, Transfer Family, File Gateway, S3 Batch Operations, idempotent landings), streaming ingress (Kinesis Data Streams contract, Firehose, MSK, IoT Core, hot shards, at-least-once ledgers), the Glue Data Catalog as the metadata plane (crawlers, partition indexes, table versioning, Schema Registry), and the transformation engines that produce silver and gold (Glue ETL with bookmarks and triggers, EMR Serverless, Lambda as a scalpel, skew and small-file hygiene). Lessons 09–11 are the **query and orchestration layer**: Athena as the per-scan SQL engine with workgroups, partition projection, CTAS and Iceberg DML; Redshift as the governed, stateful half — RA3 and Managed Storage, Serverless RPUs, Spectrum, data shares, federation and zero-ETL; and Step Functions / EventBridge / MWAA owning order, retries, replay and backfill. Lessons 12–15 are the **govern / secure / observe block**: Lake Formation permissions from the catalog down to row, column and cell, LF-TBAC and cross-account sharing; the five-layer PII pipeline with Macie at the front; KMS, least-privilege IAM, VPC endpoints, data perimeters and secrets rotation; and Glue Data Quality (DQDL's 32 rule types), quarantine, CloudWatch/CloudTrail, DataZone lineage and freshness SLOs. Lessons 16–17 close with the **money and BI capstone**: the five-rung cost ladder with October-2026 us-east-1 rates on every meter, then QuickSight end to end — editions and personas, SPICE arithmetic, the three non-interchangeable row-level-security mechanisms, and a capstone that rebuilds all seventeen layers as one reference architecture with a 30/60/90-day roadmap.

Every lesson is written to the same contract: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook that states the failure mode, a ` ```text ` decision-surface reference card that pins the numbers, a numbered `##` section map, mermaid architecture and decision diagrams, at least five worked examples priced to an October-2026 rate card, a sourced `### 2026 Updates (as of October 2026)` box built from digest 19, a `## Real-World Case Studies` section built from digest 18, a closing `## Practice Questions` set of multiple-choice items plus matching, fill-in-the-blank, drag-and-drop and plot exercises, a `> [!WARNING]` trap box, a `> **Comparative Verdict` block, and a `> [!SUCCESS]` block carrying the numbered **Key Takeaways**.

### Learning Outcomes

Upon completing this course, students will be able to:

1. Separate a data lake, a data warehouse and a lakehouse using **AWS's own published definitions** — schema-on-write versus schema-on-read, curated single source of truth versus discoverable raw corpus — and defend the medallion bronze / silver / gold split, naming what each layer owns and what it refuses to hold.
2. Choose between **batch, Lambda and Kappa** processing patterns (including the naming trap AWS's own whitepaper warns about) and place the ten core analytics services — S3, S3 Tables, Glue, Athena, Redshift, QuickSight, Kinesis, MSK, EMR, Lake Formation, Macie — on one layer map with their October-2026 list prices attached.
3. Design the S3 storage substrate: all eight storage classes with retrieval time, retrieval fee and minimum storage duration; the one-way lifecycle waterfall from Standard to Glacier Deep Archive; versioning, replication and Object Lock; SSE-S3 / SSE-KMS / DSSE-KMS / SSE-C with Bucket Keys; and the 3,500-writes-per-partitioned-prefix performance model — then do the Deep Archive TCO arithmetic by hand.
4. Pick a file format and a codec from the CSV / JSON / Avro / Parquet / ORC / Protobuf matrix with the row-group / column-chunk / footer-statistics anatomy behind the choice, and reproduce AWS's own three-step Athena cost story (uncompressed text $15.00 → gzip $5.00 → gzip + Parquet $1.25 on the same 3 TB query) as the reason the decision is made before ETL starts.
5. Explain why object storage cannot do ACID alone, read the **Iceberg metadata tree** (table JSON → manifest list → manifests → data / delete files), operate snapshots, hidden partitioning, partition evolution, time travel and `MERGE`, and defend Iceberg versus Hudi (CoW / MoR file groups) versus Delta (`_delta_log`, Z-Ordering, liquid clustering) at the depth the AWS integration matrix supports.
6. Move bytes on a schedule and on a stream: DMS full load + CDC into S3, AppFlow incremental pulls, DataSync task modes, Transfer Family partner protocols, File Gateway hybrid NFS, S3 Batch Operations reorganisation — and the four idempotent-landing patterns S3 forces on you because it has no primary keys; plus the Kinesis shard contract (1 MB/s in, 2,000 records/s, 2 MB/s out, five read TPS), partition-key design, hot-shard diagnosis, shared-read versus enhanced fan-out, Firehose buffers, and MSK Serverless economics.
7. Own the metadata layer: the Glue Data Catalog object model (`StorageDescriptor`, `PartitionKeys`, `SerdeInfo`, `SchemaReference`, `VersionId`), crawler classifier ordering and certainty scores, the three recrawl behaviours, partition indexing versus pruning versus Athena partition projection, table versioning with blue/green swap, and the Glue Schema Registry's eight compatibility modes.
8. Choose and operate a transformation engine: the Glue ETL job model with argument precedence, triggers and the 2024 queuing behaviour; DynamicFrame versus DataFrame with `resolveChoice` in the right order; job bookmarks and the five ways they break; G / R / Z workers and M-DPU arithmetic; EMR Serverless vCPU-second billing; and the idempotency ledger (bookmarks vs dynamic partition overwrite vs Iceberg `MERGE` vs staging-prefix promote vs watermarks).
9. Run both query layers and defend which one a stem deserves: **Athena** engine v3 (Trino) at **$5.00 per TB scanned** with a 10 MB minimum, workgroups, `BytesScannedCutoffPerQuery`, partition projection's four column types, CTAS / RTAS, Iceberg `MERGE` / `UPDATE` / `DELETE` / `OPTIMIZE` / `VACUUM`, result reuse and federation; and **Redshift** as the governed stateful half — RA3 and Redshift Managed Storage billed separately, Serverless on RPUs with three ceilings, Spectrum external tables, the RG node family that removes the scan charge (GA 2026-05-12), data shares, federated queries, zero-ETL, materialised views and `COPY` / `UNLOAD`.
10. Orchestrate so the second run does not write the rows twice: Step Functions Standard versus Express on duration, delivery guarantee and billing; Amazon States Language; `Map` versus Distributed `Map` with `ItemReader`, `ItemBatcher` and `ResultWriter`; EventBridge rules, buses, Pipes, Scheduler and archive; MWAA (including Serverless at $0.08/task-hour); Glue Workflows; and the scheduler decision matrix.
11. Govern the lake once, centrally: what Lake Formation replaces in the IAM-plus-S3 sprawl, LF-registered versus hybrid access mode, the permission ladder from database down to **column, row and cell** via `DataCellsFilter` and its PartiQL subset, LF-TBAC tag inheritance and AND/OR grant semantics, cross-account sharing through AWS RAM with the version-5 unlimited-tables change, and which engine actually enforces what.
12. Run the five-layer PII pipeline — **classify, route, protect, control, respond** — with Macie's bucket inventory, automated and targeted discovery jobs at the 1 % / 10 % / 100 % sampling rates, EventBridge finding routing, Glue `REDACT` / `PARTIAL_REDACT` / `SHA256_HASH` and Spark `mask()`, a token vault, Lake Formation data-filter enforcement, CloudTrail data events as the evidence store, and GDPR / CCPA / LGPD framing at AWS depth — never confusing Macie's discovery role for prevention.
13. Harden the finished lake in the order AWS's own guidance lays out — **keys → identities → storage defaults → network → organisation guardrails → secrets → audit** — including key policy versus IAM versus grants, grant tokens for machine flows, Bucket Keys cutting KMS request cost up to 99 %, `Object Ownership` ACLs disabled, Block Public Access ×4 at account and organisation level, gateway versus interface endpoints, SCPs / RCPs / endpoint policies as a data perimeter, and secrets rotation for Glue JDBC credentials.
14. Build a proof layer: Glue Data Quality end to end (DQDL's 32 rule types, expressions, where clauses, dynamic rules such as `RowCount > avg(last(10))`, labels, the 2,000-rule / 65 KB ruleset contract), the two runtimes and what each cannot do, Deequ / PyDeequ and DataBrew as verified side paths, quarantine as a pattern with warn / quarantine / halt actions, freshness SLOs with three clocks, per-layer CloudWatch dashboards, scoped CloudTrail data events and the bill they carry, and the three-plane distinction between DataZone, the Glue catalog and CloudTrail.
15. Run the five-rung cost ladder in order — **shape → temperature → accidental scale → unattributed spend → commitments** — with every meter priced: S3 GB-month and requests, Athena $5.00/TB, Glue $0.44/DPU-hour on a one-minute minimum, EMR Serverless vCPU- and GB-seconds, Redshift node-hours or RPU-hours plus Managed Storage at $0.024/GB-month, QuickSight's two pricing axes and the SPICE pool, Kinesis shard-hours, MSK Serverless cluster-hours, KMS, CloudTrail data events and the NAT tax — and only then buy a discount, on a measured size.
16. Configure QuickSight end to end on the post-rebrand stack — the QuickSight → Quick Suite → Amazon Quick naming map, Standard versus Enterprise, the five personas (Author $24, Author Pro $40, Reader $3, Reader Pro $20) and the $250 per-account infrastructure fee, SPICE at $0.38/GB-month with its logical-size arithmetic and 2-billion-row quota, SPICE versus direct query with the Athena bill as the tie-breaker, the three non-interchangeable row-level-security mechanisms (user/group rules datasets, tag rules for anonymous embedding, Lake Formation data filters through Athena with trusted identity propagation) — and re-draw the whole course as a seventeen-layer capstone reference architecture with a 30/60/90-day plan.
17. Read a real AWS customer story the way a practitioner should — the number as a **customer claim**, the mechanism as the markable content — using the fourteen named cases the course carries (FINRA, BMW Group, Nasdaq, Vanguard FAS 360, Easygo, VMware Carbon Black, TrueCar, Cisco Webex, Integral Ad Science, FanDuel, Siemens, Transport for NSW, GE Aerospace, Trustly) plus the Expedia and Oportun Macie customer-story cards quoted in L13.

---

## Deep-Research Methodology

No lesson in this course was written from memory. Each one was produced from a **research digest** first: a single file of source-pinned facts, dated numbers, case material, trap lists and explicit non-assertions, from which the lesson was then written. The digests live in `.scratch/aws-lakehouse/` (a git-ignored scratch directory — `research scratch (never commit)` in `.gitignore`) and each of the 19 follows the same eight-section skeleton from `.scratch/aws-lakehouse/SPEC.md`:

| Section | Content |
|---------|---------|
| **A. Official / primary sources** | URL + the access date (`2026-10`), verbatim quotes for key facts; prefer `docs.aws.amazon.com`, `aws.amazon.com`, `d1.awsstatic.com`, AWS Prescriptive Guidance, Well-Architected labs; blogs only if dated |
| **B. Core facts & concepts** | precise, teachable statements |
| **C. Numbers / prices / limits** | each with a source **and** a date — "as of Oct 2026"; conflicting figures fall through to (G) |
| **D. Real-world examples / case material** | AWS-published customer stories only |
| **E. AWS services & features in scope** | the services and features the lesson must cover |
| **F. Pitfalls & common confusions** | the wrong-but-plausible pairs the design questions weaponise |
| **G. Could NOT verify** | items AWS does not confirm — **never stated as fact** in any lesson |
| **H. Suggested worked examples & diagram ideas** | lesson seeds: arithmetic, mermaid sketches, scenario stems — organised per lesson in digests 17 and 19 |

All 19 digests carry all eight headings (verified with a per-file `grep -cE '^## [A-H]\. '` loop returning 8 for every file). Three disciplines run through the whole set: **no number without a source and a date**, **third-party sources are never the sole basis for an AWS fact**, and **unverified claims are isolated in section (G) rather than silently dropped**. That is why every `2026 Updates` box is sourced bullet-by-bullet and why every case heading quotes the number AWS published rather than a rounded paraphrase.

### Digest Inventory (01–19)

| Digest | File | Lines | Bytes | §A entries | Focus — what it grounds |
|--------|------|-------|-------|-----------|-------------------------|
| 01 | `01-lakehouse-architecture-patterns.md` | 263 | 57,048 | 22 | Lake vs warehouse vs lakehouse in AWS's own definitions; the medallion (bronze/silver/gold) pattern; batch vs Lambda vs Kappa; AWS reference architectures, Prescriptive Guidance and the Well-Architected Data Analytics Lens; the analytics service landscape (feeds **L01**) |
| 02 | `02-s3-storage-classes-foundation.md` | 633 | 50,313 | 17 | All eight S3 storage classes including Express One Zone and the three Glacier tiers with retrieval times, fees and minimum durations; versioning, replication, Object Lock, SSE-KMS, the prefix performance model, bucket strategies and Block Public Access (feeds **L02**) |
| 03 | `03-data-formats-compression.md` | 472 | 42,149 | 42 | CSV / JSON / Avro / Parquet / ORC / Protobuf; row vs columnar anatomy; Snappy / Gzip / Zstd / LZ4 ratios; splittability; file sizing; lakehouse landing patterns (feeds **L03**) |
| 04 | `04-open-table-formats.md` | 622 | 55,218 | 49 | Iceberg (snapshots, hidden partitioning, time travel, MERGE, catalog integration), Hudi (CoW / MoR), Delta Lake; the AWS integration matrix across Athena, EMR, Redshift, Glue, MSK and S3 Tables; compaction; ACID on S3 (feeds **L04**) |
| 05 | `05-batch-ingestion.md` | 632 | 55,085 | 55 | DMS (full + CDC, S3 target), AppFlow, Transfer Family, DataSync, S3 File Gateway, Snowball Edge's 2025–2026 status, S3 Batch Operations; loading patterns; idempotent landings (feeds **L05**) |
| 06 | `06-streaming-ingestion.md` | 730 | 67,898 | 58 | Kinesis Data Streams / Firehose / Video Streams, Amazon MSK (+ Serverless, + Connect), AWS IoT Core; put vs fan-out; streaming land to S3 / Iceberg; partition keys, ordering, hot shards; idempotency and dedup (feeds **L06**) |
| 07 | `07-glue-data-catalog.md` | 778 | 67,900 | 37 | Crawlers, partitions, partition indexes, table versioning, blue/green swaps, Glue Schema Registry, Lake Formation–managed tables, open-table-format catalog sync (feeds **L07**) |
| 08 | `08-transformation-at-scale.md` | 545 | 42,336 | 31 | Glue ETL / Spark (DynamicFrame, bookmarks, triggers, workers, capacity), Glue Studio, EMR Serverless / EMR on EKS, Lambda light transforms, skew, small files, idempotency and watermarks (feeds **L08**) |
| 09 | `09-athena-query-layer.md` | 251 | 58,935 | 53 | Engine v2 / v3 and Athena for Apache Spark, workgroups, cost per TB scanned, partition projection, CTAS / RTAS, Iceberg support, the nine performance levers, result reuse, federation (feeds **L09**) |
| 10 | `10-redshift-lake-bridge.md` | 270 | 86,421 | 70 | RA3 + Redshift Managed Storage, the RG node family, Spectrum, Redshift Serverless, data sharing, federated queries, zero-ETL, materialised views, Redshift vs Athena (feeds **L10**) |
| 11 | `11-orchestration-event-driven.md` | 275 | 78,981 | 50 | Step Functions (Standard / Express, ASL, Map / Distributed Map, error handling), EventBridge (rules, buses, Pipes, Scheduler, archive), MWAA, Glue Workflows, event-driven lakehouse patterns (feeds **L11**) |
| 12 | `12-lake-formation-governance.md` | 260 | 68,221 | 50 | Databases / tables / locations, LF-registered vs hybrid permissions, row/column-level security, data filters, data sharing (cross-account, trusted callers, managed access), LF-Tags / TBAC, Lake Formation vs IAM (feeds **L12**) |
| 13 | `13-pii-macie-privacy.md` | 246 | 68,553 | 46 | Macie jobs, findings, custom and managed PII detectors, S3 inventory; classification-driven routing; masking and tokenisation patterns; encryption; GDPR / CCPA-style handling; audit trails (feeds **L13**) |
| 14 | `14-security-kms-iam-network.md` | 295 | 111,054 | 57 | KMS (CMKs, key policies, grant tokens), bucket and identity policy least privilege, VPC endpoints (gateway / interface), PrivateLink, cross-account lake roles, SCPs / RCPs, the auth vs permission-check flow (feeds **L14**) |
| 15 | `15-quality-observability-lineage.md` | 261 | 98,140 | 62 | DataBrew quality rules, Glue Data Quality (DQDL), PyDeequ / Deequ, CloudWatch (logs / metrics / alarms / dashboards), CloudTrail data events for S3, data lineage (Glue, Lake Formation, CloudTrail), SLO thinking, quarantine patterns (feeds **L15**) |
| 16 | `16-cost-optimization-lifecycle.md` | 828 | 69,048 | 53 | S3 lifecycle → Glacier Deep Archive math, Intelligent-Tiering, Athena cost controls (workgroups, scanned bytes), Glue DPU right-sizing, QuickSight SPICE capacity, Redshift concurrency scaling and RA3, TCO worked cases (feeds **L16**) |
| 17 | `17-quicksight-bi-layer.md` | 206 | 66,217 | 42 | QuickSight / Quick Suite / Amazon Quick naming map, SPICE, dashboards, RLS and CLS, themes, embedding, capacity types and the reader-session model, Athena / Redshift / S3 as sources, the cost model (feeds **L17**) |
| 18 | `18-lakehouse-case-studies.md` | 320 | 64,228 | 14 | **Fourteen AWS-published customer stories (D1–D14)** — the source of every `Real-World Case Studies` section in lessons 01–17 |
| 19 | `19-aws-updates-2026.md` | 311 | 49,302 | 45 | 2025–2026 change log valid in October 2026: S3 Express One Zone and retention, Iceberg and the Apache projects on AWS, Athena engine updates, Lake Formation / Glue features, the Quick Suite rebrand, S3 Tables, S3 Vectors, Glue 6.0, rebrands and stale-fact warnings (feeds **all 17 `2026 Updates` boxes**) |
| **Total** | **19 files** | **8,198** | **1,257,047** | **853** | **14 named case bundles in digest 18; 17 per-lesson update seeds in digest 19 §H** |

**Numbering, stated plainly.** The digest directory contains exactly **19 files, `01-` through `19-`**, two more than the 17 lessons. Digest numbering runs one-to-one with lessons for **01–17**; **18** and **19** are enhancement passes with no lesson of the same number (the case-study corpus and the dated update log). That is the opposite of the DEA course, where the two extra digests were exam-strategy banks — here they are the case corpus and the change log, because this course has no exam to prepare for.

**Per-lesson digests vs. enhancement digests.** Seventeen digests (01–17) map one-to-one onto lessons 01–17. Two (18, 19) are enhancement passes: digest 18 is why every lesson ends with named customer cases drawn from the same fourteen-story corpus, and digest 19 is why all 17 lessons carry a dated `2026 Updates (as of October 2026)` box with sourced bullets. Digest 17 additionally seeds lesson 17's end-to-end capstone, and digest 01 seeds the reference-architecture diagrams reused in L01 and L17.

---

## Real-World Examples

Every case below is quoted with the numbers AWS published for it, and most are reused across several lessons — the same customer story is cited as evidence for different layers rather than being told once and dropped. All figures come from digest 18, where every number is read off an AWS-owned property (`aws.amazon.com`, `d1.awsstatic.com`, `press.aboutamazon.com`) or from a customer quote printed **on** an AWS page, accessed **2026-10**. The lesson list under each case is a word-boundary `grep -lw <company>` across the 17 shipped lesson files.

> **Read every number as a customer claim, not an AWS guarantee.** Transport for NSW's **~80 %** and Integral Ad Science's *"hundreds of permission rules down to precisely two"* are outcomes against each customer's own baseline and date. Any option phrased "AWS guarantees…" fails before you check the number — this is digest 18's first trap, and it is why every case heading in the lessons names the source rather than rounding the figure.

### The Fourteen Named Cases Mapped to the Lakehouse Layers

| # | Customer (industry) | Headline numbers as AWS publishes them | Lessons citing it |
|---|---|---|---|
| D1 | **FINRA** (US securities regulator) | Files validated and catalogued at regulator scale; storage, compute and catalog decoupled so surveillance data is queried in place rather than copied | 01, 02, 05, 07 |
| D2 | **BMW Group** (automotive, connected vehicles) | **10 TB/day** from connected vehicles; the Glue Data Catalog is the product, not the byproduct; layering (bronze/silver/gold) at that volume | 01, 07 |
| D3 | **Nasdaq** (exchange operator) | Query-in-place removes the overnight cliff; columnar lake files carry an exchange's load; a compliance off-ramp that never rewrites the archive | 02, 03, 10 |
| D4 | **Vanguard FAS 360** (investment management) | A "data swamp" of Parquet becomes owned data products; **600+ Glue ETL jobs** as the operating scale; a **150 TB** lake and a **20 TB** warehouse joined by data shares | 03, 04, 07, 08, 10, 15 |
| D5 | **Easygo** (digital entertainment) | A streaming-first lakehouse where Athena does the querying; zero-ETL from Aurora into Redshift Serverless; the pattern reused as the course's default reference | 01, 05, 09, 10 |
| D6 | **VMware Cybersecurity / Carbon Black** (endpoint protection) | **1 PB per day**; shard elasticity used as the cost lever rather than a capacity story | 06 |
| D7 | **TrueCar** (automotive marketplace) | Removing the schedule, not tuning the engine — orchestration cost cut by deleting a cron rather than by right-sizing it | 06, 11 |
| D8 | **Cisco Webex** (collaboration) | **12 MSK clusters** and the on-call you get back; event-driven routing at **147 TB per day** | 06, 11 |
| D9 | **Integral Ad Science** (adtech) | Lake Formation tag-based access control collapsed **hundreds of permission rules down to precisely two**; one Athena workgroup per business unit | 09, 12, 16 |
| D10 | **FanDuel Group** (sports betting) | Column grants instead of copy-based masking; two roles, one column grant, the security angle | 12, 13, 14 |
| D11 | **Siemens** (industrial / Cloud Security Operations) | **5–7 TB a day**; an **800-account** security data lake that pays for itself; centralized logs turned **days into 10 minutes**; S3 server access logs as the audit trail | 02, 14, 15 |
| D12 | **Transport for NSW** (public transport) | **400+ ingestion workflows** moved off licensed ETL onto Glue, **~80 % cheaper**, with lead time measured in weeks | 05, 08, 11, 16 |
| D13 | **GE Aerospace** (aerospace supply chain) | A legacy operational data store modernised on Redshift; warehouse density achieved behind a compliance boundary | 10, 16 |
| D14 | **Trustly** (fintech / open-banking payments) | Insights **4×** faster, cost down **50 %**, users **80 → 300**; the break-even recomputed from published rates inside the lesson | 17 |

Plus two Macie customer-story cards quoted **verbatim** in L13 from `aws.amazon.com/macie` (accessed 2026-10-11), deliberately presented as card titles rather than benchmarkable methodology: **Expedia Group** (*"Expedia used Macie for data protection at petabyte scale"*) and **Oportun** (*"Oportun increases the accuracy of sensitive-data discovery by 95% using Amazon Macie"*). L13's own curiosity box states the boundary explicitly: AWS does not publish the methodology behind the 95 %, so it is a dated customer claim, and the durable architectural lesson is tuned identifiers plus allow lists at scale instead of one regex team.

Two further supporting names appear inside case blocks rather than as named headings: **Woot.com** (why CSV broke and Parquet did not, L03), **Zeta Global** (10,000+ Iceberg tables and the 512 MB rule, L04), and **USAA** (measure the perimeter before you enforce it, L14).

### Four Cases Worth Telling in Full

**Example 1 (foundations, L01/L07): BMW Group — the catalog is the product.** BMW's cloud data hub carries **10 TB/day** of connected-vehicle data, with schemas registered in Glue and the data itself in S3 across bronze / silver / gold zones. The markable content is not the volume — it is the *ordering*: the catalog is treated as the deliverable the rest of the platform consumes, which is exactly why L07 teaches the Glue object model before it teaches crawlers, and why L01 places Glue on the service map next to S3 rather than after it. The same case reappears in L07 as the "catalog is the product, not the byproduct" heading, with the 10 TB/day number unchanged.

**Example 2 (query layer, L02/L03/L10): Nasdaq — decoupled storage, compute and catalog, then a compliance off-ramp.** Nasdaq's lake stores columnar files under an exchange's load, queries them in place so the overnight batch cliff disappears, and keeps a compliance off-ramp that never rewrites the archive. L02 uses it to justify the storage-class decision for a regulated archive; L03 uses it as the columnar-format evidence; L10 uses it as the query-in-place case that makes Spectrum and the integrated data-lake query engine worth their line items. Every lesson quotes the same mechanism and never a rounded number.

**Example 3 (governance, L09/L12/L16): Integral Ad Science — grant the tag, not the table.** A self-service lake across producer and consumer accounts, access decided by classification and job role, engines federated through Lake Formation. AWS publishes the outcome verbatim: *"With Lake Formation tag-based access controls, IAS reduced hundreds of permission rules down to precisely two rules."* L12 drills the mechanism — grant once on a tag, tag the resources, let inheritance carry the grant down to columns; L09 uses IAS as the workgroup-per-business-unit evidence for Athena cost attribution; L16 reuses it in the attribution rung of the cost ladder, because a tag ontology is also the cheapest cost-allocation mechanism AWS gives you.

**Example 4 (capstone, L17): Trustly — the break-even, computed, not quoted.** Trustly reports insights **4×** faster, cost down **50 %**, and the user base growing from **80 to 300**. L17 does the thing most courses skip: it takes Trustly's published outcome and **recomputes the break-even from the October-2026 list rates** (Author $24, Reader $3, Author Pro $40, Reader Pro $20, SPICE $0.38/GB-month, the $250 per-account infrastructure fee, Athena $5.00/TB scanned on a direct query) so the student sees where the 50 % comes from and which lever would move it. That worked example is also why L17 is the longest lesson after L14.

---

## Story

> **Hook:** "Sixteen lessons built something that produces numbers: bronze on S3, silver and gold as Iceberg tables, a Glue catalog, Step Functions holding the schedule together, Lake Formation deciding who may read which row, Macie finding the personal data, Glue Data Quality refusing the bad batches, and a cost ladder nobody is allowed to skip. None of that is the point of a lakehouse. The point is that a **regional manager in Frankfurt** opens a link on a Monday morning and sees her regions, her stores, her revenue, in under two seconds — and sees nobody else's."
> — lesson 17, opening paragraph

> **Audience.** This course is written for the **data engineer, analytics engineer and platform engineer who is building or modernising an AWS lakehouse** — people who already know what a join, a partition, a slow-changing dimension, a nightly batch and a dead-letter queue are, and who now have to attach AWS service names, AWS prices and AWS limits to each of them. It is deliberately not a certification-prep course: there is no exam guide to read as a specification and no domain weight to budget hours against. The specification here is the architecture itself — the seventeen layers L17 finally re-draws as one diagram.

> **The twelve-week path.** Seventeen lessons in twelve weeks is roughly **86 minutes a week** of frontmatter time budget (1,035 minutes total, 17 h 15 min) — comfortably inside a working week even before the replay-and-repair loop, which is the point: the plan leaves room to re-run a worked example against your own account, re-price it at your own Region's rates, and re-sit the interactive checks a few days later. The blocks are deliberate, and each one ends where the next one's first sentence can pick it up.

> **Connection.** Memorising a rate card has a shelf life of months — AWS repriced Glue (the 6.0 line is a 30 % effective reduction on the same $0.44/DPU-hour), cut Author Pro from $50 to $40, and introduced S3 Tables with compaction costs down up to 90 % — so every lesson pairs **dated, source-pinned numbers** with the **mechanism** underneath them (bookmarks versus watermarks, shared reads versus enhanced fan-out, tag inheritance versus per-resource grants, SPICE snapshot versus direct-query re-scan), and every lesson closes with items that punish the slogan answer. The single organising rule across all twelve weeks is the one L16 states on its own reference card: *never buy a discount on the wrong size, and never move a byte to a colder class before you know when you will read it back.*

**The four blocks, layer by layer.**

| Block | Weeks | Lessons | What you finish owning |
|-------|-------|---------|------------------------|
| **Foundations** | 1–4 | L01–L04 | The definitions AWS publishes; the medallion pattern and what each zone owns; the batch / Lambda / Kappa choice; the ten-service layer map with prices; the S3 storage-class ladder, the lifecycle waterfall, Object Lock and the prefix performance model; the format × codec matrix and the Athena arithmetic that makes it a cost decision; the Iceberg metadata tree, snapshots, hidden partitioning and `MERGE`, with Hudi and Delta compared against it |
| **Pipeline** | 5–8 | L05–L08 | Every batch mover (DMS, AppFlow, DataSync, Transfer Family, File Gateway, S3 Batch Operations) and the four idempotent-landing patterns; the Kinesis shard contract, partition-key design, hot-shard diagnosis, Firehose buffers and MSK Serverless; the Glue Data Catalog object model, crawlers, partition indexes, versioning and the Schema Registry; the Glue / EMR Serverless / Lambda engine ladder with bookmarks, triggers, DPU arithmetic and the idempotency ledger |
| **Query & orchestrate** | 9–11 | L09–L11 | Athena on the per-scan meter with workgroups, partition projection, CTAS and Iceberg DML; Redshift as the governed stateful half — RA3 and Managed Storage, Serverless RPUs, Spectrum, the RG integrated query engine, data shares, federation and zero-ETL; and Step Functions / EventBridge / MWAA owning time, order, failure and replay, including the Distributed-Map backfill over date partitions |
| **Govern, secure, observe + cost & BI capstone** | 12–17 | L12–L17 | Lake Formation's permission ladder down to column, row and cell, LF-TBAC and cross-account sharing; the five-layer PII pipeline with Macie at the front and a token vault behind it; the hardening spine from keys through identities, storage defaults, network, org guardrails, secrets and audit; DQDL, quarantine, SLOs, lineage and the three observability planes; the five-rung cost ladder priced end to end; and QuickSight — SPICE, the three RLS mechanisms, the naming map — closing with the seventeen-layer capstone architecture and a 30/60/90-day roadmap |

**How to use the course.**

| Weeks | Lessons | What you do |
|-------|---------|-------------|
| 1 | L01 | Fix the definitions and the medallion contract before you open a console; draw the end-to-end reference architecture twice, once as a flowchart and once as a sequence |
| 2 | L02 | Price the storage-class ladder yourself, including every Glacier retrieval fee and minimum duration; the lifecycle waterfall is a one-way door, so walk it in an interactive before you commit |
| 3 | L03 | Reproduce AWS's own three-step Athena cost story; the format × codec decision is made here and paid for in every later lesson |
| 4 | L04 | Read the Iceberg metadata tree by hand, run the worked `MERGE`, then answer "when not Iceberg" honestly |
| 5–6 | L05–L06 | Land files, then land events. Do both idempotent-landing drills — the batch one and the at-least-once streaming one — before you build anything downstream |
| 7–8 | L07–L08 | Own the metadata plane, then own the engines: the `resolveChoice` order, the bookmark state machine, the DPU arithmetic and the small-file fix |
| 9–10 | L09–L10 | Sit with both query engines and price the same query twice ($5.00/TB scanned versus RPU-hours); the decision matrix in L10 §11 is the deliverable |
| 11 | L11 | Build the state machine, break a step on purpose, watch the retry / DLQ / idempotency path, then backfill a date range with a Distributed Map |
| 12–13 | L12–L13 | Grant, revoke, tag, filter — then find the PII you just granted on, route it, mask it and prove the audit trail |
| 14–15 | L14–L15 | Harden in AWS's own order, then build the proof layer: a DQDL ruleset that gates a write, a quarantine path, a freshness SLO and a lineage story |
| 16 | L16 | Run the cost ladder on your own bill, in order, and only then buy a discount on a measured size |
| 17 | **L17** | **Capstone**: configure QuickSight end to end with row-level security, price it three ways, then re-draw all seventeen layers as one reference architecture and write your 30/60/90-day plan |

The 17 lessons total **1,035 minutes (17 h 15 min)** of frontmatter time budget. The shortest block is foundations at 55–65 minutes per lesson; the two longest lessons — L14 (1,295 lines, security hardening) and L12 (1,260 lines, Lake Formation) — are the two where the mechanism is least forgiving of slogans, which is exactly why they carry the most worked policy sketches.

---

## Lesson Structure

All 17 lessons share one skeleton: frontmatter (`title`, `description`, `order`, `difficulty`, `duration`), an opening hook immediately under the H1, a ` ```text ` decision-surface reference card, a numbered `##` section map, mermaid diagrams, a sourced `### 2026 Updates (as of October 2026)` box, a `## Real-World Case Studies` section, a `## Practice Questions` section, a `> [!WARNING]` trap box, a `> **Comparative Verdict` block and a closing `> [!SUCCESS]` **Key Takeaways** list. Counts below were re-derived per file.

### Lesson 01: Lakehouse Architecture Fundamentals

**Duration:** 55 minutes (968 lines)

**Hook:** "Three terms, three different promises. The fastest way to misuse them is to treat them as sizes ('we are too big for a warehouse') rather than as **contracts about schema, curation and access**." The lesson then quotes AWS's own compare page for each: a warehouse is *"a central repository of preprocessed data for analytics and business intelligence"* with schema written on write; a lake *"allows you to store all your structured and unstructured data at any scale"* with schema written at analysis time; and an unmanaged lake *"can lead to data swamps."*

**Learning Objectives:**
- Read the three definitions AWS actually publishes and defend the medallion bronze / silver / gold split
- Choose between batch, Lambda and Kappa processing patterns, including the naming trap AWS's whitepaper warns about
- Place ten core analytics services on a single layer map with October-2026 list prices
- Walk the end-to-end reference architecture twice — flowchart and sequence — plus the multi-account container view
- Work seven priced worked examples, including a 10 TB/day pipeline-sizing sketch
- Read the FINRA, Easygo and BMW Group cases the way a practitioner should
- Check the October 2026 update box (S3 Tables, S3 Vectors, Glue 6.0, Quick Suite) and the course roadmap

**Content Outline:**
- 1. Lake, warehouse, lakehouse: the three definitions AWS actually publishes
- 2. Why Parquet on Amazon S3 is still not a lakehouse
- 3. The medallion pattern: bronze, silver, gold
- 4. Batch, Lambda, or Kappa: choosing the processing pattern
- 5. The AWS analytics service landscape: where each service sits
- 6. End-to-end reference architecture
- 7. Why open table formats are non-negotiable
- 8. Worked mini-scenarios: sizing the thing you just designed
- 9. Course roadmap: where this lesson sits
- Real-World Case Studies · Practice Questions

**Layer alignment:** the whole architecture — definitions, medallion, processing patterns, the service map and the reference diagram every later lesson points back to.

**Real-World Application:** three cases — **FINRA** (decoupling storage, compute and catalog), **Easygo** (a modern streaming-first lakehouse), **BMW Group** (layering at 10 TB/day) — plus seven worked examples including the 10 TB/day sizing sketch and the Athena / Glue rate arithmetic.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 0 `dragdrop` · 1 `plot` · 6 `mermaid` · 5 "Did you know?" · 2 `[!WARNING]` · 3 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 02: S3 as the Data Lake Foundation

**Duration:** 60 minutes (927 lines)

**Hook:** "Every lakehouse in this course is built on one assumption: **Amazon S3 is the substrate**. Glue crawls it, Athena scans it, Redshift Spectrum mounts it, Lake Formation grants on it, Macie inspects it, QuickSight reads it. Nothing downstream can rescue a lake whose storage layer was designed by accident — and in S3, 'by accident' has a specific price. The wrong storage class bills you a retrieval fee on every byte an engine reads; the wrong prefix layout throttles ingest at 3,500 writes per second; the wrong object size adds 40 KB of archive metadata per file; the wrong retention design turns a lifecycle rule into a one-way door with a 180-day minimum bill."

**Learning Objectives:**
- Read the full eight-class storage table — Express One Zone, Standard, Standard-IA, One Zone-IA, Intelligent-Tiering and all three Glacier tiers — with retrieval time, retrieval fee and minimum storage duration
- Walk the storage-class decision tree and the one-way lifecycle waterfall, then order the waterfall yourself
- Model versioning, replication, Object Lock (WORM) and legal holds, including exactly which mutations replication does not mirror
- Choose between SSE-S3, SSE-KMS, DSSE-KMS and SSE-C, and use an S3 Bucket Key to cut KMS request cost up to 99 %
- Design bucket and prefix layout against the 3,500 / 5,500-requests-per-partitioned-prefix performance model
- Compute lifecycle money: Deep Archive TCO and the Intelligent-Tiering monitoring-fee trap

**Content Outline:**
- 1. The eight storage classes: one durability, eight economics
- 2. The Glacier family: every tier, every fee, every clock
- 3. Choosing a class: the decision tree and the waterfall
- 4. Durability, versioning and replication
- 5. Object Lock: WORM for regulated lake zones
- 6. Encryption: SSE-S3, SSE-KMS, DSSE-KMS, SSE-C and Bucket Keys
- 7. Buckets, prefixes and partition keys: the performance model
- 8. Locking the lake down: Block Public Access and bucket policies
- 9. The governance plumbing: S3 Inventory and S3 Batch Operations
- 10. Lifecycle cost math: Deep Archive TCO and the Intelligent-Tiering trap
- Real-World Case Studies · Practice Questions

**Layer alignment:** the storage substrate every later layer reads or writes — storage classes, durability features, encryption defaults and the performance model.

**Real-World Application:** **Nasdaq** (query-in-place with a compliance off-ramp), **Siemens** (5–7 TB/day and S3 server access logs as the audit trail).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 5 "Did you know?" · 4 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 03: Data Formats and Compression

**Duration:** 55 minutes (867 lines — the shortest lesson in the course)

**Hook:** "Amazon Athena prices one thing: 'Querying compressed data is faster and also cheaper because you pay for the number of bytes scanned before decompression.' Everything else in a lakehouse design — partitions, workgroups, cluster sizes, lifecycle rules — is downstream of a decision you make in the first week and then live with for years: **which file format, which compression codec, and how big each object should be.**" The hook then walks AWS's own three-step cost story: one 3 TB, four-column table, one single-column query, **$15.00** uncompressed text → **$5.00** gzip 3:1 → **$1.25** gzip plus Parquet — a 12× spread created entirely by format and compression.

**Learning Objectives:**
- Read row versus columnar anatomy properly — row groups, column chunks, data pages, footers, min/max statistics, the optional page index — and see where predicate pushdown happens
- Use the format matrix for CSV, JSON, Avro, Parquet, ORC and Protobuf: orientation, in-file schema, splittability, nested types and which AWS engine reads them
- Apply the schema-evolution matrix per format, including why Parquet reads by name while ORC reads by index
- Explain encodings — dictionary + RLE, the delta family, `BYTE_STREAM_SPLIT` — and why they run before compression
- Choose between Snappy, Gzip, Zstd and LZ4 with dated benchmark numbers in hand rather than folklore
- Size files into the 128 MB – 1 GB band and diagnose (then fix) the small-files problem

**Content Outline:**
- 1. Row versus columnar: the anatomy that sets your bill
- 2. The format matrix: CSV, JSON, Avro, Parquet, ORC and Protobuf
- 3. Encodings: what happens before compression
- 4. Compression codecs: Snappy, Gzip, Zstd, LZ4
- 5. File sizing and the small-files problem
- 6. When to use which: the decision flow
- Real-World Case Studies · Practice Questions

**Layer alignment:** the bytes on S3 that every engine in the rest of the course will scan, decompress and bill for.

**Real-World Application:** **Vanguard** (a "data swamp" of Parquet files is still a data swamp), **Nasdaq** (columnar lake files under an exchange's load), **Woot.com** (why CSV broke and Parquet did not).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 2 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 0 `dragdrop` · 2 `plot` · 5 `mermaid` · 4 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 3 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 04: Open Table Formats: Iceberg, Hudi, and Delta

**Duration:** 65 minutes (879 lines)

**Hook:** "Lesson 3 put the bytes on Amazon S3 in Parquet. Bytes on S3 are a *file lake*: readable, cheap, durable — and non-transactional. This lesson installs the layer that makes those files a **table**: the open table format (OTF). Every later lesson in this course assumes it exists. Glue crawls it (lesson 07), Athena queries it (lesson 09), Redshift bridges to it (lesson 10), Lake Formation grants on it (lesson 12), and nobody pays for a 30-million-file table twice (lesson 16)."

**Learning Objectives:**
- Explain why ACID on object storage needs a metadata layer at all, and what an OTF adds over "Parquet plus a crawler"
- Read the Iceberg metadata tree — table metadata JSON, manifest lists, manifests, data / delete files — and know what each level stores
- Operate time travel, snapshot retention and snapshot isolation, then distinguish a snapshot from a backup
- Run row-level DML — `MERGE`, `UPSERT`, `DELETE` — and know which engines actually execute it on AWS
- Perform maintenance: compaction, orphan-file removal, snapshot expiry, and the cost of not doing them
- Compare Hudi (file groups, instant timeline, CoW vs MoR) and Delta (`_delta_log`, data-skipping stats, Z-Ordering, liquid clustering) against Iceberg
- Wire the catalog: Glue Data Catalog as default, the Glue Iceberg REST endpoint, Nessie / JDBC / DynamoDB / Hive / Hadoop / REST

**Content Outline:**
- 1. Why object storage cannot do ACID
- 2. Iceberg deep dive: the metadata tree
- 3. Time travel and snapshot retention
- 4. Row-level DML: MERGE, UPSERT and DELETE
- 5. Maintenance: compaction, orphan files, snapshot expiry
- 6. Catalogs: the pointer service, and why Glue is the default
- 7. Apache Hudi: file groups, timeline, CoW vs MoR
- 8. Delta Lake: transaction log, stats, Z-Ordering, liquid clustering
- 9. AWS integration matrix (as of October 2026)
- 10. When to pick Iceberg, Hudi or Delta on AWS
- Real-World Case Studies · Practice Questions

**Layer alignment:** the transactional table layer the catalog, query, governance and cost lessons all assume exists.

**Real-World Application:** **Vanguard** (from a "data swamp" of Parquet to Iceberg data products), **Zeta Global** (10,000+ Iceberg tables and the 512 MB rule made real).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 05: Batch Ingestion Patterns

**Duration:** 60 minutes (1,027 lines)

**Hook:** "Lesson 04 put a transactional table format on top of Amazon S3. This lesson is everything that happens *before* that — the byte-moving layer. A lakehouse with a perfect Iceberg silver layer and a badly chosen ingress service is a lakehouse with a two-week batch window, a duplicated bronze folder and a partner contract you cannot renegotiate. The uncomfortable truth about batch ingestion is that the choice is almost never about throughput. Every service in this lesson can move the data. The choice is about **who controls the source** (you, a vendor API, a partner's SFTP client, a mounted share), **whether changes must keep flowing**, and **how the bill is shaped** — fixed hours versus gigabytes."

**Learning Objectives:**
- Map source type to service across RDBMS, SaaS APIs, NFS/SMB/HDFS, hybrid ongoing writes, partner feeds and offline bulk
- Run AWS DMS in full load, full load + CDC and CDC only into Amazon S3, including the `DataFormat=parquet` path
- Configure AppFlow on demand / schedule / event with `IncrementalPullConfig` and know the 15 GB per Salesforce run ceiling
- Operate DataSync (agent or agentless, Basic or Enhanced, `TransferMode=CHANGED`) and Transfer Family (SFTP / FTPS / FTP / AS2)
- Apply the four idempotent-landing patterns S3 forces on you because it has no primary keys, no updates and no referential integrity
- Recognise Snowball Edge as legacy (existing customers only since 2025-11-07; commercial EOS 2026-12-31) and price the fixed-hour versus per-GB shape

**Content Outline:**
- 1. Service selection: source type to service
- 2. AWS DMS: full load + CDC into Amazon S3
- 3. Amazon AppFlow: SaaS to S3 with incremental pulls
- 4. AWS DataSync: agents, task modes, schedules, verification
- 5. AWS Transfer Family: partner protocols into the lake
- 6. Amazon S3 File Gateway: hybrid NFS writes that land in S3
- 7. Offline bulk: the Snowball Edge pattern (and its 2026 status)
- 8. Amazon S3 Batch Operations: reorganising what already landed
- 9. Idempotent landing: the four patterns
- 10. Cost shape: fixed-hour versus per-GB
- 11. Worked end-to-end: DMS → bronze → Glue → Iceberg silver
- Real-World Case Studies · Practice Questions

**Layer alignment:** the batch half of the ingress layer, plus the idempotency contract every downstream merge depends on.

**Real-World Application:** **FINRA** (validating and cataloguing files at regulator scale), **Transport for NSW** (400+ ingestion workflows off licensed ETL), with **Easygo** referenced for the streaming-first contrast.

**Practice Questions:** 13 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 13 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 0 `plot` · 5 `mermaid` · 6 "Did you know?" · 3 `[!WARNING]` · 3 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 06: Streaming Ingestion: Kinesis, Amazon MSK

**Duration:** 65 minutes (968 lines)

**Hook:** "Lessons 02 through 05 put files, formats and tables on Amazon S3. Everything so far has been *moved* in batches. This lesson is about the other half of ingestion: **events that arrive continuously and must land in the lake without losing their order, duplicating silently, or quietly costing more than the analytics team earns back.** By the end you will be able to size a Kinesis stream from a records-per-second number, explain exactly where ordering stops, decide when a hot key is a partition-key problem rather than a capacity problem, configure a Firehose buffer that triggers on the right condition, and defend a bronze landing that is idempotent even though the pipeline is at-least-once."

**Learning Objectives:**
- Recite the Kinesis Data Streams shard contract: 1 MB/s write and 1,000 records/s in, 2 MB/s read and five read TPS out, per shard
- Separate the three capacity modes — Provisioned, On-Demand Standard, On-Demand Advantage (25 MB/s floor) — and price each
- Design partition keys, explain MD5 placement, and diagnose a hot shard as a key problem before a capacity problem
- Choose between shared `GetRecords` at 2 MB/s and enhanced fan-out at 2 MB/s **dedicated** per consumer
- Operate Amazon Data Firehose as a delivery service, not a processor: 1–128 MB / 0–900 s buffers, Lambda transform, dynamic partitioning, at-least-once to S3 and documented exactly-once only to the Iceberg destination
- Get from Amazon MSK (provisioned brokers, MSK Serverless, MSK Connect 2.7.1 / 3.7.x, S3 and Iceberg sinks, MSK streaming tables on Express) to a queryable table
- Apply the semantics ledger: at-least-once plus idempotent `MERGE` versus documented exactly-once claims

**Content Outline:**
- 1. The service map: five paths from event to lake
- 2. Kinesis Data Streams: the shard contract
- 3. Partition keys, ordering, and hot shards
- 4. Fan-out: shared reads versus enhanced fan-out
- 5. Producers and consumers: KPL, KCL, and the lease table
- 6. Amazon Data Firehose: a delivery service, not a processor
- 7. Landing in the lake with Firehose
- 8. AWS IoT Core rules and Kinesis Data Video Streams
- 9. Amazon MSK: managed Kafka, and getting from a stream to a table
- 10. Choosing: the decision matrix
- Real-World Case Studies · Practice Questions

**Layer alignment:** the streaming half of the ingress layer, and the source of the at-least-once contract L08's idempotency ledger answers.

**Real-World Application:** **Cisco Webex** (12 MSK clusters and the on-call you get back), **VMware Carbon Black** (1 PB/day and shard elasticity as the cost lever), **TrueCar** (schedule removal, not engine tuning).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 5 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 07: Glue Data Catalog: Crawlers, Partitions, and Schema Management

**Duration:** 55 minutes (1,075 lines)

**Hook:** "Lessons 02 through 06 put bytes on Amazon S3: storage classes, formats, table formats, batch and streaming ingestion. None of that is queryable by a SQL user until something else exists — a **description** of where the files are, what they contain, how to deserialize them, and which of them are worth reading. That description is the **AWS Glue Data Catalog**, and this lesson is about owning it."

**Learning Objectives:**
- Read the Data Catalog object model: account/Region → catalog → database → table → partitions, with `StorageDescriptor`, `PartitionKeys`, `Parameters`, `TableType` and `VersionId`
- Run a crawler in your head: custom classifiers in your order, first success wins, built-ins only if none matched, certainty 1.0 wins outright
- Operate the three recrawl behaviours (`CRAWL_EVERYTHING`, `CRAWL_NEW_FOLDERS_ONLY`, `CRAWL_EVENT_MODE`) and the change/delete behaviour matrix
- Separate partition indexing, pruning and Athena partition projection, and state the `partition_filtering.enabled = true` requirement
- Use table versions honestly: `GetTableVersions` exists, rollback does not — blue/green is a new version or a shadow table plus a resource-link swap
- Extend the discipline to streams with the Glue Schema Registry (free, KMS-encrypted, 8 compatibility modes, AVRO / JSON / PROTOBUF)
- Wire Iceberg catalog integration and hand permissions to Lake Formation without breaking the objects

**Content Outline:**
- 1. The Data Catalog object model
- 2. Crawlers: classification, classifiers, and the run order
- 3. Partitioning, partition indexes, and the projection lane
- 4. Table versioning and blue/green schema deployment
- 5. Glue Schema Registry: compatibility for streams and batches
- 6. Lake Formation handoff: who owns what
- 7. Iceberg catalog wiring
- 8. Worked example E6 — crawl → register → Athena, end to end
- 9. Worked example E7 — schema evolution, safe versus breaking
- 10. Glue version state: the platform under the catalog
- Real-World Case Studies · Practice Questions

**Layer alignment:** the metadata plane — the thing that turns a file lake into something a SQL user can name, and the surface Lake Formation later attaches grants to.

**Real-World Application:** **BMW Group** (the catalog is the product, not the byproduct), **Vanguard FAS 360** (from data swamp to catalogued data products), **FINRA** (cataloguing at regulator scale).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 8 `mermaid` · 5 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 08: Transformation at Scale: AWS Glue, EMR Serverless, and Lambda

**Duration:** 65 minutes (1,095 lines)

**Hook:** "Lessons 01 through 07 gave you a lake: S3 layout, file formats, open table formats, batch and streaming ingestion, and a catalog. None of that is yet *curated*. This lesson is about the layer that does the curating — **the engines that read raw and bronze, clean it, deduplicate it, and write silver and gold** — and about the three things that decide whether that layer is cheap, correct, or both: **which engine you run, how much capacity you hold while it runs, and whether the second run produces duplicates.**"

**Learning Objectives:**
- Model the Glue ETL job: anatomy, argument precedence, the 260 KB argument ceiling, triggers, concurrency quotas and the 2024 job-queuing behaviour
- Separate DynamicFrame from DataFrame and drive `resolveChoice` with the right action before any write
- Operate job bookmarks — incremental runs without re-reading everything — and name how they break
- Size workers and DPUs (1 DPU = 4 vCPU + 16 GB; M-DPU = 4 vCPU + 32 GB for R and Ray workers) on the October-2026 rate card
- Run Glue Studio (visual ETL, notebooks, script editor) over the same engine, and recognise Glue for Ray as closed to new customers since 2026-04-30
- Use EMR Serverless for the full EMR release train without a cluster, priced in vCPU-seconds and GB-seconds, including pre-initialised capacity
- Apply Lambda as the 15-minute / 10 GB control-plane scalpel — not as an ETL engine
- Fix the Spark lakehouse pathologies: partitions, AQE, skew, shuffle and small files
- Choose the idempotency mechanism: bookmarks (source side), dynamic partition overwrite, Iceberg `MERGE` + snapshots, staging prefix + atomic promote, or watermarks

**Content Outline:**
- 1. The engine ladder: five paths from raw to silver
- 2. The Glue ETL job model: anatomy, arguments, triggers, queuing
- 3. DynamicFrame versus DataFrame, and `resolveChoice`
- 4. Job bookmarks: incremental runs without re-reading everything
- 5. Workers, DPUs and M-DPUs: where the bill and the OOM come from
- 6. Glue Studio: visual ETL, notebooks and the script editor over the same engine
- 7. The Glue version matrix (Oct 2026) and Glue for Ray
- 8. EMR Serverless: the EMR release train without the cluster
- 9. Lambda for light transforms: the control-plane scalpel
- 10. Spark lakehouse patterns: partitions, AQE, skew, shuffle, small files
- 11. Idempotency: bookmarks versus MERGE versus watermarks
- 12. Worked PySpark Glue job outline: catalog read to Iceberg silver
- 13. Cost math: DPU-hours, vCPU-seconds and the Flex discount
- 14. The decision matrix
- Real-World Case Studies · Practice Questions

**Layer alignment:** the transformation engines that produce silver and gold, and the idempotency contract L11's orchestrator relies on.

**Real-World Application:** **Transport for NSW** (~80 % off data integration, and a lead time measured in weeks), **Vanguard** (600+ Glue ETL jobs as the operating scale).

**Practice Questions:** 11 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 2 plot.

**Verified block counts:** 11 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 2 `plot` · 5 `mermaid` · 5 "Did you know?" · 4 `[!WARNING]` · 3 `[!IMPORTANT]` · 3 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 09: Athena as the Lakehouse Query Engine

**Duration:** 60 minutes (992 lines)

**Hook:** "Lessons 01 through 08 gave you storage, formats, tables, pipelines and a catalog. None of that answers the question a business user actually asks: *can I query this, how fast, and what will it cost?* **Amazon Athena is the answer AWS puts in front of SQL users** — serverless, no cluster to size, no license to buy, and a bill that is a direct function of how much data your query reads. That last property is the whole lesson: **in a per-scan pricing model, tuning is billing, and billing is tuning.**"

**Learning Objectives:**
- Separate the three engine lanes: SQL engine version 3 (Trino, current), SQL engine version 2 (Presto, deprecated) and Athena for Apache Spark (PySpark v3 on Spark 3.2.1, or Apache Spark 3.5 on 3.5.6 / EMR 7.12)
- Price the meter — **$5.00 per TB scanned, 10 MB minimum per query**, DDL and failed queries free, cancelled queries billed up to cancellation — and explain why format is a cost control, not a style choice
- Operate workgroups as the control plane: engine version, result location, `BytesScannedCutoffPerQuery`, CloudWatch metrics, result reuse and managed results
- Choose partitioning versus partition projection, and configure all four projection column types (enum, integer, date, injected) with their constraints
- Use CTAS, `INSERT INTO`, `UNLOAD` and — on Iceberg, merge-on-read, engine v3 only — `MERGE INTO`, `UPDATE`, `DELETE`
- Run Iceberg maintenance in Athena: `OPTIMIZE … REWRITE DATA` and `VACUUM`
- Apply the nine performance levers and the result-caching rules
- Know what Lake Formation enforces on every query and what it does not, and how Glue-connection federation changed on 2026-04-21

**Content Outline:**
- 1. The three engine lanes: SQL v3, SQL v2 and Athena for Apache Spark
- 2. Pricing: $5.00 per TB scanned, and why format is a cost control
- 3. Workgroups: the operational control plane
- 4. Partitioning versus partition projection
- 5. CTAS: turning raw files into a table you can afford to query
- 6. Iceberg SQL: time travel, snapshots, MERGE and maintenance
- 7. Performance tuning: the nine levers
- 8. Result caching: reuse, managed results, and what is not cached
- 9. Federated queries: JDBC and friends, through Lambda
- 10. Lake Formation: what is enforced, and what is not
- Real-World Case Studies · Practice Questions

**Layer alignment:** the serverless SQL half of the query layer, and the engine Lake Formation and QuickSight both attach to.

**Real-World Application:** **Easygo** (a streaming-first lakehouse where Athena does the querying), **Integral Ad Science** (one workgroup per business unit).

**Practice Questions:** 11 multiple-choice + 1 matching + 1 fillblank + 2 plot.

**Verified block counts:** 11 `question` · 1 `matching` · 1 `fillblank` · 0 `dragdrop` · 2 `plot` · 7 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 10: Redshift in the Lakehouse: Spectrum, Serverless, Data Sharing

**Duration:** 60 minutes (1,163 lines)

**Hook:** "Lesson 09 put a query engine on top of the lake. This lesson puts a **warehouse** next to it — and then shows how that warehouse stops being a walled garden. Amazon Redshift is the *governed, stateful* half of the AWS lakehouse: it owns a warehouse (Redshift Managed Storage), and it reaches outward in three documented directions — **Spectrum / the integrated data-lake engine** (S3 open formats), **data shares** (other Redshift warehouses), and **federated external schemas** (Aurora/RDS). The teaching rule for this lesson is short: **Redshift is where repeated, governed, concurrent SQL lands.** It is not 'Athena, but bigger.'"

**Learning Objectives:**
- Explain the RA3 compute/storage split and price Redshift Managed Storage ($0.024 per GB-month) independently of node hours, then say what AQUA is now that its enable/disable switch is gone
- Read the RG announcement correctly: a Graviton node family with an integrated data-lake query engine, GA 2026-05-12, that removes the Spectrum scan charge
- Size Redshift Serverless in RPUs ($0.375/RPU-hour, 4 RPU minimum) and separate its three ceilings — base capacity, Max capacity, and the Max RPU-hours budget
- State the 1:1 namespace-to-workgroup rule and which object owns storage identity versus compute
- Build Spectrum external tables on RA3 at $5.00/TB scanned, and contrast with the integrated engine on RG and with Serverless where the scan is folded into RPU-hours
- Share out with data shares (same account, cross account, cross Region; producer keeps control) and pull in with federated queries (Aurora/RDS PostgreSQL and MySQL, read-only, predicate pushdown) and zero-ETL
- Read and write Iceberg from Redshift: `CREATE TABLE … USING ICEBERG`, `INSERT` / `DELETE` / `UPDATE` / `MERGE` (GA 2025-11-17), and correct the `UNLOAD` myth
- Price the same query twice: Athena $5.00/TB scanned versus Redshift Serverless RPU-hours

**Content Outline:**
- 1. RA3 and Redshift Managed Storage: the compute/storage split
- 2. Redshift Serverless: RPUs, namespaces and workgroups
- 3. Redshift Spectrum: external tables over the S3 lake
- 4. Data sharing: producer and consumer, without copies
- 5. Federated queries: read the operational database in place
- 6. Zero-ETL integrations: what lands in Redshift
- 7. Materialized views, auto refresh and concurrency scaling
- 8. Iceberg with Redshift: read it, write it, and the UNLOAD myth
- 9. COPY and UNLOAD: landing the gold layer
- 10. Worked cost sketch: Athena $5/TB versus Redshift Serverless RPU
- 11. Consolidating the decision: three interactive checks
- Real-World Case Studies · Practice Questions

**Layer alignment:** the governed, stateful half of the query layer, and the destination L17's capstone reads gold from.

**Real-World Application:** **Vanguard** (a 150 TB lake and a 20 TB warehouse, joined by data shares), **Nasdaq** (query-in-place removes the overnight cliff), **Easygo** (zero-ETL from Aurora into Redshift Serverless), **GE Aerospace** (warehouse density behind a compliance boundary).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 6 `mermaid` · 7 "Did you know?" · 5 `[!WARNING]` · 6 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 11: Orchestrating the Lakehouse: Step Functions, EventBridge, and MWAA

**Duration:** 60 minutes (1,242 lines)

**Hook:** "Ten lessons in, you can land files, convert them, curate them into Iceberg, query them with Athena and hand the result to Redshift. None of that answers the four questions that decide whether the lakehouse is a product or a liability: **what starts the run, in what order do the steps run, what happens when a step fails, and how do you run it again without writing the same rows twice?** That is orchestration, and it is the layer where most lakehouse incidents actually live — not in the SQL. The teaching rule for this lesson is short: **the orchestrator owns time, order, failure and replay; the compute owns bytes.**"

**Learning Objectives:**
- Separate Step Functions Standard (exactly-once, up to 1 year, 2,000 exec/s, 4,000 transitions/s, $0.000025 per state transition, 90-day history, Distributed Map allowed) from Express (at-least-once async, up to 5 minutes, 100,000 exec/s, requests + duration + 64 MB memory chunks, Request Response only)
- Read and write Amazon States Language, including the Task layer and the error-handling contract
- Choose `Map`, Distributed `Map`, `Parallel` and `ItemBatcher` / `ItemReader` / `ResultWriter` for fan-out over date partitions
- Build a worked lakehouse state machine bronze → silver → gold and break a step on purpose to watch the retry path
- Configure EventBridge: four bus types, rules (300/bus, 5 targets/rule, 2,048-character patterns), Pipes (source → filter → enrich → target, billed only on matches, 5-minute ceiling), Scheduler (rate / cron / one-time, 60-second precision) and archive (processing $0.10/GB, storage $0.023/GB-month, replay $1.00/M)
- Run idempotent orchestration that survives the second run, then backfill with a Distributed Map over date partitions
- Describe MWAA (mw1.micro … mw1.2xlarge, workers 1–25, schedulers 2–5, Airflow 3.3.1 since 2026-09-01, MWAA Serverless GA 2025-11-17 at $0.08/task-hour) and wire Glue Workflows
- Apply least-privilege execution roles and the scheduler decision matrix

**Content Outline:**
- 1. The orchestration surface: five tools, five jobs
- 2. AWS Step Functions: Standard versus Express
- 3. Amazon States Language and the Task layer
- 4. Map, Distributed Map, Parallel and ItemBatcher
- 5. A worked lakehouse state machine: bronze to silver to gold
- 6. Amazon EventBridge for the lakehouse
- 7. Idempotent orchestration: surviving the second run
- 8. Backfill with a Distributed Map over date partitions
- 9. Amazon MWAA: managed Airflow for the lakehouse
- 10. AWS Glue Workflows and event triggers
- 11. Security: least-privilege execution roles
- 12. The scheduler decision matrix
- Real-World Case Studies · Practice Questions

**Layer alignment:** the control plane — order, retries, replay and backfill — over everything the pipeline block built.

**Real-World Application:** **Transport for NSW** (400+ workflows off a licensed ETL tool), **TrueCar** (removing the schedule, not tuning the engine), **Cisco Webex** (event-driven routing at 147 TB per day).

**Practice Questions:** 14 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 14 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 8 "Did you know?" · 3 `[!WARNING]` · 4 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 12: Lake Formation Governance: Permissions, Row/Column Security, Data Sharing

**Duration:** 65 minutes (1,260 lines)

**Hook:** "Lessons 01–11 built the machine: buckets, formats, Iceberg tables, crawlers, jobs, a query engine, a warehouse and an orchestrator. Every one of those layers produced a new place where somebody had to answer the same question — *who may see this?* This lesson answers it once, centrally, with **AWS Lake Formation**. The service is not an IAM replacement and not a catalog; it is an **RDBMS-shaped permission layer** that sits on the Glue Data Catalog and vends scoped temporary credentials to integrated engines, so that one `GRANT` statement can mean something at **database, table, column, row and cell** granularity. The teaching rule: **Lake Formation decides visibility, IAM decides reachability, and the engine does the actual filtering.**"

**Learning Objectives:**
- Name the three policy surfaces Lake Formation replaces (IAM identity policies for `glue:*`, S3 bucket/prefix policies, Glue catalog resource policies) and the one it augments (IAM — which still authenticates and still gates every Lake Formation control-plane API)
- Separate the two planes — catalog (Glue + Lake Formation grants) and data (S3 + role-vended temporary credentials) — and the `RegisterResource` bridge between them
- Choose between Lake Formation mode (revoke `IAMAllowedPrincipals`) and hybrid access mode, and know the default trap that `Super` is pre-granted to `IAMAllowedPrincipals`
- Walk the permission ladder: catalog → database → table → **column** (`TableWithColumns` or a data-filter column spec, nested struct fields included) → **row / cell** (`DataCellsFilter`, PartiQL `WHERE` subset, expression < 2,048 characters, ≤100 per principal per table)
- Apply LF-Tags and LF-TBAC: key=value, inheritance database → table → column (overridable), keys ANDed, values of one key ORed
- Share cross-account and cross-Region through AWS RAM (same-org instant, out-of-org invitation; cross-account version 5 = unlimited tables per share since 2026-02-11), with resource links and separate target grants
- Build the engine support matrix: which engines actually enforce column, row and cell controls, and how QuickSight / Athena / Redshift / EMR each consume a grant
- Sketch a real Grant API call and CLI invocation, and remember that permissions, tags and sharing cost **$0** while the Storage API bills bytes scanned at a 10 MB minimum

**Content Outline:**
- 1. What Lake Formation replaces: the IAM and S3 sprawl
- 2. LF-registered versus hybrid: the two permission modes
- 3. The permission granularity ladder
- 4. Row-level and column-level security: the worked analyst policy
- 5. LF-Tags and tag-based access control (LF-TBAC)
- 6. Data sharing: cross-account databases, external engines, trusted callers
- 7. Engine support matrix: who actually enforces what
- 8. The `IAMAllowedPrincipals` default, and the migration off it
- 9. The permission-check flow: a decision tree
- 10. Worked Grant API and CLI sketch
- Real-World Case Studies · Practice Questions

**Layer alignment:** the governance plane over the catalog and the data, and the mechanism L13's PII pipeline and L17's row-level security both hook into.

**Real-World Application:** **Integral Ad Science** (hundreds of permission rules collapsed to two), **FanDuel** (column grants instead of copy-based masking), **Morningstar** (one tag ontology, two enforcement planes).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 7 "Did you know?" · 4 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 13: PII Protection on the Lakehouse: Amazon Macie

**Duration:** 60 minutes (1,103 lines)

**Hook:** "Lessons 01–12 built a lakehouse that is fast, cheap and governable. That combination creates one new obligation: sooner or later somebody puts a customer's email address, phone number or national ID into `s3://lakehouse/bronze/`, and you have to be able to **say where it is, who can see it, what you did about it, and when you would have to delete it**. This lesson is the answer, and the answer is a *pipeline*, not a product. The teaching rule: **classify, route, protect, control, respond — five layers, each with a different service, none of them optional.** Amazon Macie only ever does the first one."

**Learning Objectives:**
- Operate Macie's discovery surface — bucket inventory and monitoring, automated sensitive-data discovery (sampling), targeted discovery jobs at 1 % / 10 % / 100 % — and state its boundary: general-purpose S3 buckets only, and Macie **finds, it never prevents**
- Price Macie on the October-2026 card: $0.10 per S3 bucket / month, $0.01 per 100,000 objects monitored, $1.00 per GB inspected (1 GB / month free), 30-day free trial up to 150 GB
- Route findings through EventBridge (`source = aws.macie`, `detail-type = "Macie Finding"`) to Lambda / SNS / SQS / Security Hub custom actions
- Protect in the lake: Glue `REDACT` / `PARTIAL_REDACT` / `SHA256_HASH`, Spark `mask()` on Glue 5.0+, and a token vault (API Gateway + Lambda + DynamoDB + KMS)
- Tie back to Lake Formation: `pii = true` LF-Tags, tag-based grants, data filters as the column and row enforcement
- Assemble the evidence store: CloudTrail (who), Macie findings (what), JSONL exports in S3, 90-day retention
- Frame GDPR, CCPA and LGPD at AWS depth without inventing legal advice
- Run the worked end-to-end flow: detect bronze → tag → mask / tokenize silver → enforce → audit

**Content Outline:**
- 1. The five-layer pipeline: classify, route, protect, control, respond
- 2. Amazon Macie in depth
- 3. The classify → route pipeline: finding, Lambda, quarantine, tag
- 4. Protection in the lake: detect bronze → tag → mask/tokenize silver
- 5. Lake Formation tie-back: from tag to column and row enforcement
- 6. Audit: CloudTrail data events, Macie history, and the evidence store
- 7. Compliance framing: GDPR, CCPA and LGPD at AWS depth
- 8. The worked end-to-end flow
- Real-World Case Studies · Practice Questions

**Layer alignment:** the privacy pipeline over the governed lake, and the source of the classification tags L12's LF-TBAC grants on.

**Real-World Application:** one named heading — **FanDuel** (two roles, one column grant, the security angle) — plus the two verbatim Macie customer-story cards from `aws.amazon.com/macie`: **Expedia Group** (*"data protection at petabyte scale"*) and **Oportun** (*"increases the accuracy of sensitive-data discovery by 95%"*), each carried with its explicit "customer claim, not an AWS guarantee" boundary.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 4 `mermaid` · 7 "Did you know?" · 4 `[!WARNING]` · 1 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 14: Security Hardening: KMS, Least-Privilege IAM, and Network Isolation

**Duration:** 60 minutes (1,295 lines — the longest lesson in the course)

**Hook:** "Lessons 01–13 built a lake that works: buckets, formats, Iceberg, ingestion, a catalog, transformation, a query layer, a warehouse, orchestration, Lake Formation governance, and PII handling. Everything you built is also a set of **decisions an attacker can read and a misconfiguration can undo**. A CMK whose key policy never delegated to the account, a bucket policy that pins traffic to a VPC endpoint nobody uses, an SCP written with the strict operator instead of `IfExists`, a rotation Lambda missing one KMS action — each fails in a way that names the *last* hop in the error, not the broken control. The teaching rule: *default is not enforced, allowed is not reachable, and reachable is not audited.*"

**Learning Objectives:**
- Separate customer managed, AWS managed and AWS owned KMS keys, and evaluate access the way KMS does — key policy first, then IAM and grants, explicit Deny always winning
- Use grant tokens for the Lake Formation / Glue machine flows, and cut KMS request cost with Bucket Keys ("up to 99 %")
- Distinguish backing-key rotation (365-day automatic), on-demand rotation and data re-encryption — they are not the same thing — and use multi-Region keys (`mrk-` prefix) for S3 CRR
- Write least-privilege service roles for `glue.amazonaws.com`, `lakeformation.amazonaws.com` and `encryption.athena.amazonaws.com`, with external ID in the **role trust**, never the key policy
- Apply the condition-key vocabulary correctly: `s3:prefix` (List only), `aws:SourceVpce` / `aws:SourceVpc`, the `lakeformation:*` family, `aws:PrincipalIsAWSService`; and remember session policies and permission boundaries **intersect**, they do not union
- Harden S3 in construction order: Object Ownership ACLs disabled → Block Public Access ×4 at account and org level → SSE-KMS CMK + bucket key → deny-insecure-transport bucket policy → network pin → prefix-scoped IAM
- Design the network: gateway endpoints (S3, DynamoDB) at $0 with a route-table prefix list that beats `0.0.0.0/0`; interface endpoints / PrivateLink per-AZ hour + per-GB; NAT at $0.045/hr + $0.045/GB; endpoint policies as a fifth deny surface
- Build the data perimeter — identity × resource × network — with SCPs, RCPs and endpoint policies, remembering that SCPs **filter**, never grant
- Rotate Glue JDBC secrets, and scope the org trail and its data-event bill

**Content Outline:**
- 1. What a hardened lake is defending against
- 2. KMS for lakes: CMKs, AWS managed, AWS owned
- 3. IAM patterns: service roles, external ID, condition keys, sessions, boundaries
- 4. S3 hardening, in construction order
- 5. Network isolation: gateway endpoints, PrivateLink, NAT and endpoint policies
- 6. Data perimeters: SCPs, RCPs and the three control areas
- 7. Secrets rotation for Glue JDBC credentials
- 8. Audit: one org trail, selective data events, and the bill you must scope
- Real-World Case Studies · Practice Questions

**Layer alignment:** the hardening spine over every layer built so far — keys, identities, storage defaults, network, org guardrails, secrets, audit.

**Real-World Application:** **Siemens** (an 800-account security data lake that pays for itself), **USAA** (measure the perimeter before you enforce it).

**Practice Questions:** 11 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop.

**Verified block counts:** 11 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 0 `plot` · 6 `mermaid` · 4 "Did you know?" · 1 `[!WARNING]` · 1 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 15: Data Quality and Observability: DQDL, Quarantine, Lineage, SLOs

**Duration:** 60 minutes (1,169 lines)

**Hook:** "Lessons 01–14 built something that works: a bronze prefix, Iceberg tables, Glue jobs, a catalog, Athena and QuickSight, orchestration, Lake Formation grants, PII controls and a hardened perimeter. None of that answers the question your consumers will actually ask — **can you prove today's gold numbers are right, and can you tell me what changed when they are not?** A lakehouse without quality and observability is a very fast way to move wrong data. Two ideas carry the whole thing. First, quality is a *pipeline step with an output*, not a dashboard: it either gates a write, splits rows, or raises a signal someone is paged for. Second, observability has three distinct planes that teams constantly confuse — the **Glue catalog** holds technical metadata and permissions, **DataZone** holds business meaning and lineage, **CloudTrail** holds who called what."

**Learning Objectives:**
- Choose among four quality engines — Glue Data Quality (catalog task or `EvaluateDataQuality` in the job), Deequ / PyDeequ, DataBrew, and custom checks — and name what each cannot do
- Write DQDL: 32 rule types, expressions, where clauses, dynamic rules (`RowCount > avg(last(10))`), labels, constants, pre-processing SQL, and the 2,000-rule / 65 KB ruleset contract with its no-nested-column limit
- Separate the two runtimes: the Data Catalog task cannot name failed records; the ETL job can, but cannot run recommendations
- Consume results as S3 JSON → external table + crawler → Athena, or the service store → console / Get-List APIs, or Iceberg tables in the Data Catalog (Jul 2026)
- Wire signals through EventBridge (`source aws.glue-dataquality`, carrying score, state and rulesSucceeded/Failed/Skipped — only while "Publish metrics to Amazon CloudWatch" stays selected) and the `Glue Data Quality` CloudWatch namespace
- Build quarantine as a pattern with warn / quarantine / halt actions (InsuranceLake's three), not as a product
- Compute freshness SLOs on three clocks and wire per-layer CloudWatch dashboards
- Scope CloudTrail data events to the prefixes that matter and price the bill
- Separate DataZone (business meaning and lineage) from the Glue catalog and CloudTrail, then run the worked EventBridge → SNS → Lambda remediation

**Content Outline:**
- 1. Four quality engines, one decision
- 2. DQDL: the language, the modifiers, the ruleset contract
- 3. Two runtimes: the Data Catalog task and `EvaluateDataQuality` in the job
- 4. Deequ, PyDeequ and DataBrew — the verified side paths
- 5. Quarantine: a pattern, not a product
- 6. Freshness SLOs: three clocks and the arithmetic
- 7. Operational observability: one dashboard per layer
- 8. CloudTrail data events: scoped prefixes and the bill
- 9. Three planes: DataZone, the Glue catalog, CloudTrail
- 10. Worked example E6 — EventBridge → SNS → Lambda remediation, wired
- Real-World Case Studies · Practice Questions

**Layer alignment:** the proof layer — the thing that lets the lakehouse defend its own numbers to the consumers L17 serves.

**Real-World Application:** **Siemens** (centralized logs that turned days into 10 minutes), **Vanguard** (a "data swamp" turned into owned data products).

**Practice Questions:** 11 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 11 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 4 "Did you know?" · 2 `[!WARNING]` · 2 `[!IMPORTANT]` · 1 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 16: Cost Optimization and Lifecycle

**Duration:** 60 minutes (1,026 lines)

**Hook:** "Lessons 01–15 built a lakehouse that works: storage, formats, tables, ingestion, a catalog, transformation, querying, a warehouse, orchestration, governance, PII handling, security and observability. Every one of those decisions has a **meter** attached to it, and by now those meters run together into a single monthly bill that nobody can read line by line. The bad news: cost is the one lakehouse property that degrades silently, because the bill arrives a month after the decision that caused it. The good news: unlike correctness, cost has a **ladder** — a fixed order of operations that AWS's own Well-Architected guidance implies and that every published AWS cost case study follows. The single rule that organises everything below: *never buy a discount on the wrong size, and never move a byte to a colder class before you know when you will read it back.*"

**Learning Objectives:**
- Price every meter before touching a lever: S3 GB-month and requests; Athena $5.00/TB scanned; Glue $0.44/DPU-hour on a one-minute minimum; EMR Serverless $0.052624/vCPU-hour + $0.0057785/GB-hour; Redshift node-hours or RPU-hours plus RMS $0.024/GB-month; QuickSight $24 Author / $3 Reader / $0.38 SPICE GB-month; Kinesis $0.015/shard-hour; MSK Serverless $0.75/cluster-hour + partitions + GB; KMS $1/key + $0.03/10k requests; NAT $0.045/h + $0.045/GB
- Run Rung 1 (shape): columnar + compression + projection, because Athena bills bytes scanned **before** decompression
- Run Rung 2 (temperature): the lifecycle waterfall Standard $0.023 → Standard-IA $0.0125 (30-day min) → Glacier Instant $0.004 (90-day) → Glacier Flexible $0.0036 (90-day) → Deep Archive $0.00099 (180-day min) — and model the restore bill nobody models
- Run Rung 3 (accidental scale): workgroup `BytesScannedCutoffPerQuery`, job timeouts, Max RPU-hours budget, budget actions — remembering that a cancelled query still bills what was scanned
- Run Rung 4 (attribution): cost allocation tags activated on resources (CostCenter / Layer / Project), and know they cannot be applied retrospectively
- Run Rung 5 (commitments): only now buy Redshift reserved nodes, Serverless Reservations (24 % / 45 %) or Savings Plans — on the **measured** size
- Right-size Glue DPUs, use the Flex discount, pause/resume Redshift, bank concurrency-scaling credits, and pool SPICE

**Content Outline:**
- 1. Cost anatomy: the meter of every layer before the lever
- 2. S3: the lifecycle waterfall, and the restore bill nobody models
- 3. The query layer: Athena bills bytes scanned, so every scan is a design decision
- 4. Transformation: Glue DPU right-sizing, one-minute billing, and the EMR Serverless sketch
- 5. Redshift: pause/resume, managed storage, concurrency credits, Serverless RPUs
- 6. The BI layer: QuickSight's two pricing axes and the SPICE pool
- 7. Streaming shapes: shard-hours, GB-with-a-floor, 5 KB increments, cluster-hours
- 8. The silent multipliers: KMS, CloudTrail data events, and the NAT tax
- 9. Putting the ladder to work: interactive checks on the levers themselves
- Real-World Case Studies · Practice Questions

**Layer alignment:** the money layer over every meter the previous fifteen lessons attached something to.

**Real-World Application:** **GE Aerospace** (modernising an operational data store on Redshift), **Transport for NSW** (400+ ETL workflows moved to Glue, ~80 % cheaper), **Integral Ad Science** (the workgroup-per-business-unit attribution mechanism).

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 4 `mermaid` · 6 "Did you know?" · 1 `[!WARNING]` · 2 `[!IMPORTANT]` · 2 `[!NOTE]` · 1 `[!SUCCESS]`

---

### Lesson 17: QuickSight BI and the End-to-End Lakehouse Capstone

**Duration:** 70 minutes (1,100 lines)

**Hook:** "Sixteen lessons built something that produces numbers: bronze on S3, silver and gold as Iceberg tables, a Glue catalog, Step Functions holding the schedule together, Lake Formation deciding who may read which row, Macie finding the personal data, Glue Data Quality refusing the bad batches, and a cost ladder nobody is allowed to skip. None of that is the point of a lakehouse. The point is that a **regional manager in Frankfurt** opens a link on a Monday morning and sees her regions, her stores, her revenue, in under two seconds — and sees nobody else's. That is this lesson. The BI layer is where every upstream decision either pays for itself or embarrasses you: a missing Lake Formation grant shows up as an empty dashboard, a SPICE snapshot shows up as a stale one, a text-versus-numeric column choice shows up as row-level security silently not working, and an un-pruned direct query shows up on the Athena bill three weeks later."

**Learning Objectives:**
- State the naming map precisely — service **Amazon Quick** (was QuickSight, announced as Quick Suite 2025-10-09), BI feature **Quick Sight**, APIs / ARNs / IAM actions still `quicksight` — and say what did **not** change
- Price the October-2026 stack: Standard $9/user/mo annual (or $12 monthly) with 10 GB SPICE per user and FULL refresh only; Enterprise with incremental refresh, RLS, CLS, folders, embedding and 2 billion rows or 2 TB per dataset; Author $24 | Author Pro $40 | Reader $3 | Reader Pro $20 | Admin bills as Author; SPICE $0.38/GB-month; the $250/month per-account infrastructure fee triggered by any Pro user, Q topic or Dashboard Q&A
- Compute SPICE logical size (12 B per numeric or date cell + 24 B + UTF-8 length per text) and fill it on a schedule or on demand
- Choose SPICE (snapshot, fixed capacity, sub-second) versus direct query (fresh, re-scans, 2-minute visual timeout) versus hybrid, with the Athena $5.00/TB bill as the tie-breaker
- Wire the three lakehouse sources — Athena, the S3 JSON manifest, Redshift — and follow the content model: dataset → analysis → dashboard → theme → folders
- Apply the three **non-interchangeable** row-level-security mechanisms: user and group rules datasets (text only, ≤999 records per user), tag rules (ANONYMOMOUS embedding only), and Lake Formation data filters through Athena with trusted identity propagation and filter replication (query time, direct query only — SPICE freezes the rows it saw at ingest)
- Locate Q, ML visuals and embedding on an awareness-level map without over-claiming
- Run the capstone: gold sales → SPICE → regional RLS → a manager dashboard, then re-draw all seventeen layers as one reference architecture and write the 30/60/90-day roadmap

**Content Outline:**
- 1. Naming the thing you are configuring
- 2. Personas, editions and the October 2026 price stack
- 3. SPICE: what it is, what it costs, how you fill it
- 4. SPICE versus direct query: the Athena bill is the tie-breaker
- 5. Lakehouse sources: Athena, the S3 manifest, and Redshift
- 6. The content model: datasets, analyses, dashboards, themes and folders
- 7. Row-level security: three mechanisms that are not interchangeable
- 8. Q, ML visuals and embedding: awareness-level map
- 9. Capstone worked example: gold sales to SPICE to regional RLS to a manager dashboard
- 10. The capstone: seventeen layers as one reference architecture
- 11. The 30/60/90-day implementation roadmap
- Real-World Case Studies · Practice Questions

**Layer alignment:** the consumption layer, plus the capstone that re-draws all seventeen layers as one architecture and closes the twelve-week path.

**Real-World Application:** **Trustly** (insights 4× faster, cost down 50 %, users 80 → 300), a block of two supporting QuickSight outcomes from the same corpus, and **Trustly's break-even recomputed from published rates** inside the lesson rather than merely quoted.

**Practice Questions:** 12 multiple-choice + 1 matching + 1 fillblank + 1 dragdrop + 1 plot.

**Verified block counts:** 12 `question` · 1 `matching` · 1 `fillblank` · 1 `dragdrop` · 1 `plot` · 5 `mermaid` · 7 "Did you know?" · 3 `[!WARNING]` · 2 `[!IMPORTANT]` · 3 `[!NOTE]` · 1 `[!SUCCESS]`

---

## Interactive Components

### Inventory by Type

| Type | Fence | Count | Role in the course |
|------|-------|-------|--------------------|
| Multiple-choice items | `question` | **205** | 11–14 per lesson (11 in L08, L09, L14, L15; 13 in L05; 14 in L10, L11; 12 everywhere else) |
| Matching | `matching` | **17** | Exactly 1 per lesson |
| Fill-in-the-blank | `fillblank` | **17** | Exactly 1 per lesson — recall of exact numbers |
| Drag-and-drop | `dragdrop` | **14** | 1 per lesson except L01, L03 and L09 |
| Typed interactive subtotal | — | **48** | 17 + 17 + 14 |
| Plot blocks | `plot` | **18** | Numeric visualisation — the storage-class ladder, codec ratios, DPU and RPU arithmetic, the cost-ladder rungs; absent only in L05 and L14 |
| **Interactive exercises, all forms** | — | **66** | matching 17 · fillblank 17 · dragdrop 14 · plot 18 |
| Mermaid diagrams | `mermaid` | **92** | Architecture, decision-flow and sequence diagrams embedded in the prose (4–8 per lesson) |
| ASCII reference cards | `text` | **143** | The `====…` decision-surface card that opens most lessons and pins the October-2026 numbers |
| SQL payloads | `sql` | **23** | CTAS, Iceberg `MERGE` / `UPDATE` / `DELETE` / `OPTIMIZE`, Redshift `COPY` / `UNLOAD`, DQDL rulesets |
| JSON payloads | `json` | **22** | Event shapes, Glue job arguments, policy documents, Macie finding payloads |
| Bash / CLI payloads | `bash` | **6** | Grant API and CLI sketches, `aws s3api` invocations |
| Python payloads | `python` | **4** | PySpark Glue job outlines, `mask()` examples |
| **All labelled fence openers** | — | **561** | Openers and bare closers match 1:1 (561 / 561) — no labelled closing fences anywhere in the course |

### Non-Block Interactive Devices

| Device | Count | Notes |
|--------|-------|-------|
| "Did you know?" curiosities (`> **📚 Did you know?**`) | **99** | One per ~183 lines; each carries a fact a design review can turn into a wrong decision |
| `[!WARNING]` callouts | **48** | Trap markers: the wrong-but-plausible architecture, price or permission |
| `[!IMPORTANT]` callouts | **41** | Non-negotiable rules and the per-lesson Comparative Verdict |
| `[!NOTE]` callouts | **26** | Clarifications and scope notes |
| `[!SUCCESS]` callouts | **17** | The closing Key Takeaways list, one per lesson |
| `Key Takeaways` blocks | **17** | One per lesson |
| `Comparative Verdict` blocks | **17** | Other cloud × self-managed / on-premises × another AWS service × a financial lever |
| `Real-World Case Studies` sections | **17** | One per lesson, all drawn from digest 18's fourteen-story corpus |
| `2026 Updates (as of October 2026)` boxes | **17** | One per lesson, all sourced from digest 19 |
| Named case headings (`### Case …`) | **41** | 1 (L13) to 4 (L10) per lesson |

### Distribution Across Lessons

| Lesson | Lines | Min | `question` | Interactive | `mermaid` | Cases | "Did you know?" |
|--------|-------|-----|-----------|-------------|----------|-------|----------------|
| L01 | 968 | 55 | 12 | 3 (1 M · 1 F · 0 D · 1 P) | 6 | 3 | 5 |
| L02 | 927 | 60 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 2 | 5 |
| L03 | 867 | 55 | 12 | 4 (1 M · 1 F · 0 D · 2 P) | 5 | 3 | 4 |
| L04 | 879 | 65 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 2 | 7 |
| L05 | 1,027 | 60 | 13 | 3 (1 M · 1 F · 1 D · 0 P) | 5 | 2 | 6 |
| L06 | 968 | 65 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 6 | 3 | 5 |
| L07 | 1,075 | 55 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 8 | 2 | 5 |
| L08 | 1,095 | 65 | 11 | 5 (1 M · 1 F · 1 D · 2 P) | 5 | 2 | 5 |
| L09 | 992 | 60 | 11 | 4 (1 M · 1 F · 0 D · 2 P) | 7 | 2 | 7 |
| L10 | 1,163 | 60 | 14 | 4 (1 M · 1 F · 1 D · 1 P) | 6 | 4 | 7 |
| L11 | 1,242 | 60 | 14 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 3 | 8 |
| L12 | 1,260 | 65 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 3 | 7 |
| L13 | 1,103 | 60 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 4 | 1 | 7 |
| L14 | 1,295 | 60 | 11 | 3 (1 M · 1 F · 1 D · 0 P) | 6 | 2 | 4 |
| L15 | 1,169 | 60 | 11 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 2 | 4 |
| L16 | 1,026 | 60 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 4 | 2 | 6 |
| L17 | 1,100 | 70 | 12 | 4 (1 M · 1 F · 1 D · 1 P) | 5 | 3 | 7 |
| **Total** | **18,191** | **1,035** | **205** | **66** (17 M · 17 F · 14 D · 18 P) | **92** | **41** | **99** |

Every column sums to the independently verified figure: 205 multiple-choice items carrying **205 unique `lh-NN-qN` IDs**, 66 interactive exercises of four kinds, 92 diagrams, 41 named case headings and 99 curiosities.

---

**Source of truth:** `content/courses/aws-data-lakehouse/course.json` + `content/courses/aws-data-lakehouse/en/*.md` + `.scratch/aws-lakehouse/*.md` (+ `MASTER-PROMPT.md` and `SPEC.md` in the same scratch directory)
**Statistics:** re-derived with `wc`, `grep`, a full fence-walking JSON parse and both `course-writer` validators on 11 October 2026; all counts in this document match the files as shipped.
**Status:** English complete; PT/ES deferred (the course validator's only output is the four missing-locale warnings).
**Date context:** October 2026 — every price, limit and GA date in the lessons is stamped "as of Oct 2026" (275 stamps); notable dated facts carried throughout are the QuickSight → Quick Suite → Amazon Quick rebrand (**2025-10-09**), **AWS Glue 6.0** with full Iceberg v3 (**2026-08-21**), the Redshift **RG** node family with the integrated data-lake query engine (**GA 2026-05-12**), Redshift Iceberg writes (**GA 2025-11-17**), MWAA Serverless (**GA 2025-11-17**), the Glue Iceberg REST endpoint and catalog federation (**GA 2025-11-24**), Lake Formation cross-account sharing version 5 with unlimited tables per share (**2026-02-11**), and the Snowball Edge legacy / end-of-commercial-sale status (**2025-11-07** / **2026-12-31**).
