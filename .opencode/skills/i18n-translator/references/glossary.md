# Locked terminology — AWS & Databricks courses (EN → PT-BR / ES)

Rules: **Never translate** items in the "Locked" tables. Translate items in the "Phrase" tables using the given equivalents (first-use gloss allowed). When in doubt, keep the English term — these audiences read English docs daily.

## Locked — never translate (product / feature / brand)

| EN | PT / ES (identical) |
|---|---|
| AWS service names | Amazon S3, Kinesis (Data Streams/Firehose), MSK, Glue, Athena, Redshift, Lake Formation, QuickSight / Quick Suite, IAM, KMS, VPC, PrivateLink, NAT, CloudTrail, CloudWatch, STS, Secrets Manager, Systems Manager, Step Functions, MWAA, EC2, RDS, DynamoDB |
| Databricks platform | Databricks, Databricks SQL (DBSQL), Unity Catalog, Delta Lake, Delta Sharing, Auto Loader, Lakeflow, Lakeflow Declarative Pipelines, Lakeflow Jobs, Lakeview, Photon, MLflow, Databricks Runtime (DBR), DBR LTS, Databricks Asset Bundles (DAB), clusters, workspace, serverless, job cluster, all-purpose cluster, SQL warehouse, notebook, Repos |
| Data engineering terms (keep EN; optional first-use gloss) | data lakehouse, bronze / silver / gold, checkpoint, pipeline, dashboard, job, commit, pull request, repo, endpoint, token, service principal, workload, scaling, spot (instances), partition, skew, watermark, schema, ETL/ELT, CDC / CDF, batch, streaming |
| Open source / third party | Apache Kafka, Apache Airflow, Spark, Parquet, Delta protocol, Terraform, dbt, GitHub Actions, Git, Python, SQL, YAML, JSON, HTTP/S |
| Exam / cert codes | DEA-xxx, AIF-C01, CLF-C02, DBU, TCO |

## Locked identifiers (byte-identical in all locales)

Frontmatter keys; `order` / `difficulty` values (`difficulty` lowercase enum: beginner/intermediate/advanced); `duration` **number** (label localized: `"75 min"`, never `"75 minutes"`/`"75 minutos"`); question ids (`dbl-NN-qN` …); `{{N}}` placeholders; JSON keys; code fences; CLI commands; ARNs; file paths; URLs; `> [!WARNING]`-style callout tags; `> [!SUCCESS]`; the literals `Practice Questions` and `Key Takeaways` inside dual headings.

## Locked heading formulas (exact strings — quality_lint.py errors on any variant)

Recurring headings are **not** re-translated per lesson — every lesson uses the identical string:

| Context | PT | ES |
|---|---|---|
| Case-studies H2 | `## Casos Reais` | `## Casos Reales` |
| Updates box H3 | `### Atualizações de 2026 (em outubro de 2026)` | `### Actualizaciones de 2026 (en octubre de 2026)` |
| Did-you-know | `📚 Você sabia?` | `📚 ¿Sabías que…?` |
| Comparative verdict box | `> **Veredito Comparativo — ` | `> **Veredicto comparativo — ` |
| Dual practice heading | `## Perguntas de Prática (Practice Questions)` | `## Preguntas de Práctica (Practice Questions)` |
| Dual takeaways | `**Pontos Principais (Key Takeaways):**` | `**Conclusiones Clave (Key Takeaways):**` |

## Phrase table — architecture prose

| EN | PT-BR | ES |
|---|---|---|
| data lakehouse | lakehouse de dados (keep "lakehouse"; gloss "lago de dados" acceptable first use) | lakehouse de datos (keep "lakehouse") |
| control plane / data plane | plano de controle / plano de dados | plano de control / plano de datos |
| transaction log | log de transações | registro de transacciones (log de transacciones OK) |
| time travel | time travel (keep; gloss "viagem no tempo" first use) | time travel (keep) |
| change data feed | change data feed (CDF) | change data feed (CDF) |
| liquid clustering | liquid clustering (keep) | liquid clustering (keep) |
| managed table / external table | tabela gerenciada / tabela externa | tabla gestionada / tabla externa |
| storage credential | storage credential (keep) | storage credential (keep) |
| external location | external location (keep) | external location (keep) |
| metastore | metastore (keep) | metastore (keep) |
| securable | securable (keep) | securable (keep) |
| grant / revoke | conceder revogar / grant revocar | conceder revocar |
| row-level security / column-level security | segurança em nível de linha / de coluna | seguridad a nivel de fila / de columna |
| dynamic view | view dinâmica | vista dinámica |
| expectation (DLT) | expectation (keep) | expectation (keep) |
| quarantine | quarentena | cuarentena |
| data quality | qualidade de dados | calidad de datos |
| exactly-once / at-least-once | exactly-once / at-least-once (keep) | exactly-once / at-least-once (keep) |
| file arrival / table update trigger | gatilho de chegada de arquivo / de atualização de tabela | desencadenador de llegada de archivos / de actualización de tabla |
| small files problem | problema dos arquivos pequenos | problema de archivos pequeños |
| file compaction | compactação de arquivos | compactación de archivos |
| data skipping | data skipping (keep) | data skipping (keep) |
| query profile | query profile (keep) | query profile (keep) |
| cost / pricing | custo / precificação (pt-BR common) | costo / precios |
| on-demand / committed use | sob demanda / uso comprometido | bajo demanda / uso comprometido |
| shared responsibility model | modelo de responsabilidade compartilhada | modelo de responsabilidad compartida |
| well-architected | bem arquitetado (keep "Well-Architected" as product) | bien arquitecturado (keep "Well-Architected") |
| migration / modernization | migração / modernização | migración / modernización |
| lift and shift | lift and shift (keep) | lift and shift (keep) |
| serverless | serverless (keep) | serverless (keep) |
| auto-stop / auto-termination | parada automática / término automático | parada automática / terminación automática |
| instance pool | pool de instâncias | pool de instancias |
| cluster policy | política de cluster | política de cluster |
| secret scope | escopo de segredos | ámbito de secretos |
| audit log | log de auditoria | registro de auditoría |
| lineage | lineage (keep) | lineage (keep) |
| federated query / federation | consulta federada / federação | consulta federada / federación |
| share / recipient | share / recipiente (keep "share") | share / destinatario (keep "share") |
| Marketplace listing | listagem do Marketplace | listado del Marketplace |
| freshness / volume / drift | frescor / volume / desvio (drift OK) | frescura / volumen / desviación |
| runbook | runbook (keep) | runbook (keep) |
| replay | replay (keep) | replay (keep) |
| decision matrix | matriz de decisão | matriz de decisión |
| comparative verdict | veredito comparativo | veredicto comparativo |
| key takeaways | pontos principais | conclusiones clave |
| practice questions | questões/prácticas de prática | preguntas de práctica |
| did you know? | você sabia? | ¿sabías que…? |
| worked example | exemplo resolvido / exemplo prático | ejemplo resuelto / ejemplo práctico |
| pitfall | armadilha / pegadinha | trampa / trampa común |
| hands-on | hands-on (keep) / prático | hands-on (keep) / práctico |
| as of October 2026 | em outubro de 2026 | en octubre de 2026 |
| source | fonte | fuente |
| free tier | free tier (keep) | free tier (keep) |
| shared fate / shared platform | destino compartilhado | destino compartido |

## Style

- **PT-BR**: second person "você"; neutral technical register; no anglicisms where a settled term exists ("arquivos", not "files"); numbers with `.` thousands and `,` decimals as in the EN source's digit sequences preserved.
- **ES**: neutral international Spanish (avoid regionally narrow slang); second person "tú" consistent with source tone; **never vosotros forms** (`acabaréis`, `vosotros`, `-áis`) — neutral tú equivalents only; `¿ … ?` and `¡ … !` marks required; never mix stamp variants (`a octubre` vs locked `en octubre`).
- Translate **quoted documentation excerpts** in prose into the target language; keep only citation tails `(docs …, 2026-09-11)`, product names and short locked phrases (`"exactly once"`) in English.
- Translate **didactic intent**: the courses teach failure modes explicitly — keep the warnings sharp, never soften a WARNING into a NOTE.
- Company names, people names, city names in case studies: unchanged.
- Keep em-dash / parenthetical asides; do not flatten the source's rhythm.
