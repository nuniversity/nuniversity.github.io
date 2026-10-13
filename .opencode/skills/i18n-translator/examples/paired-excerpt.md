# Paired excerpt — EN / PT / ES, every invariant class annotated

Same passage, three locales. Read the annotations — they encode the contract.

## 1. Dual heading (the only place English survives in a heading)

```markdown
EN:  ## Practice Questions
PT:  ## Perguntas de Prática (Practice Questions)
ES:  ## Preguntas de Práctica (Practice Questions)

EN:  > [!SUCCESS]
     > **Key Takeaways:**
PT:  > [!SUCCESS]
     > **Pontos Principais (Key Takeaways):**
ES:  > [!SUCCESS]
     > **Conclusiones Clave (Key Takeaways):**
```
Why: `validate_lesson.py` regexes require the literals `Practice Questions`
and `Key Takeaways`. The parentheses pattern satisfies them while giving the
learner a native heading. The `> [!SUCCESS]` tag itself never changes.

## 2. Callout — tag invariant, body translated

```markdown
EN:  > [!WARNING]
     > Never point `cloudFiles.schemaLocation` at the same path as your data.
     > Auto Loader will ingest its own schema files as data.

PT:  > [!WARNING]
     > Nunca aponte `cloudFiles.schemaLocation` para o mesmo caminho dos seus
     > dados. O Auto Loader vai ingerir os próprios arquivos de schema como dados.

ES:  > [!WARNING]
     > Nunca apuntes `cloudFiles.schemaLocation` a la misma ruta que tus datos.
     > Auto Loader ingerirá sus propios archivos de esquema como datos.
```
Tag `[!WARNING]` [INV]; inline code [INV]; body [TR]. Warnings stay sharp —
never downgrade to NOTE.

## 3. Code fence — entire body invariant

```markdown
EN/PT/ES (identical in all three):
```python
stream = (spark.readStream.format("cloudFiles")
    .option("cloudFiles.format", "json")
    .load("s3://acme-lake/raw/events/"))
```
```
Not even comments are translated (safest rule; the verifier byte-compares).

## 4. Question JSON — keys invariant, strings translated

```json
// PT
{
  "id": "dbl-05-q1",
  "type": "multiple-choice",
  "question": "Qual modo de detecção de arquivos evita varrer o bucket S3 inteiro a cada micro-batch?",
  "options": ["Directory listing", "File notifications", "Batch lookup", "Manual crawl"],
  "correct": 1,
  "explanation": "File notifications usa eventos S3 (SNS+SQS) e só vê arquivos novos."
}
```
Note: `"options"` values here happen to be product feature names — kept in
English per glossary even though they are user-facing strings. That is
correct: `[TR]` means "allowed to translate", not "obligated".

## 5. Mermaid — structure invariant, labels translatable

```mermaid
EN:  flowchart TD
         A[Raw landing] --> B[Auto Loader]
         B --> C[(bronze Delta)]
PT:  flowchart TD
         A[Recepção raw] --> B[Auto Loader]
         B --> C[(Delta bronze)]
ES:  flowchart TD
         A[Recepción raw] --> B[Auto Loader]
         B --> C[(Delta bronze)]
```
Same nodes, same arrows, same shapes `[]`, `()`, `[( )]`. Labels [TR].
Connector count is checked (warning-level) by the verifier.

## 6. Date stamp — digits invariant, words translated

```markdown
EN:  rates as of October 2026 (2026-10-12)
PT:  taxas em outubro de 2026 (2026-10-12)
ES:  tarifas en octubre de 2026 (2026-10-12)
```
Never reformat `2026-10-12`, `$0.045/GB`, `1,000` or `48 hours`.

## 7. Fillblank placeholders

```json
// EN template: "Delta stores actions as JSON in the {{1}}."
// PT template: "O Delta registra ações como JSON no {{1}}."
// ES template: "Delta registra acciones como JSON en el {{1}}."
```
The placeholder `{{1}}` moves with the word order; the SET of placeholders
`{ {{1}}, {{2}}, … }` is invariant. `answers` keys stay `"1"`, `"2"`…; values
translate.
