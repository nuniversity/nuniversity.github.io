---
title: "Patrones de Integración CI/CD"
description: "Integra OpenCode en tus pipelines CI/CD. Aprende revisión automática de código, flujos de trabajo de pruebas, automatización de despliegue y compuertas de calidad para integración continua."
order: 2
duration: "60 min"
difficulty: "advanced"
---

# Patrones de Integración CI/CD

## ¿Por Qué Integrar OpenCode con CI/CD?

| Beneficio | Descripción |
|-----------|-------------|
| **Revisión Automatizada** | La IA detecta problemas antes de la revisión humana |
| **Calidad Consistente** | Los mismos estándares en cada commit |
| **Retroalimentación Más Rápida** | Los desarrolladores reciben retroalimentación instantánea |
| **Reducción de Costos** | Menos ciclos de revisión humana |

---

## Integración con GitHub Actions

### Flujo de Trabajo Básico

Crear `.github/workflows/opencode-review.yml`:

```yaml
name: OpenCode Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install OpenCode
        run: npm install -g opencode
      
      - name: Run Code Review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          opencode run "Review this pull request for security vulnerabilities and code quality issues" \
            --output review.md
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: review
            });
```

---

## Integración con GitLab CI

Crear `.gitlab-ci.yml`:

```yaml
stages:
  - review
  - test
  - deploy

opencode-review:
  stage: review
  image: node:18
  script:
    - npm install -g opencode
    - opencode run "Review changed files for issues" > review.txt
  artifacts:
    paths:
      - review.txt
  only:
    - merge_requests
```

---

## Compuertas de Quality Gates

### Hook Pre-commit

Crear `.husky/pre-commit`:

```bash
#!/bin/bash
opencode run "Check if staged files follow coding standards" || exit 1
```

### Validación de PR

```yaml
- name: Validate PR
  run: |
    opencode run "Validate: 
    1. All tests pass
    2. No security vulnerabilities
    3. Code follows style guide
    4. Documentation is updated" \
    --output validation-report.md
```

---

## Pruebas Automatizadas

### Generación de Pruebas

```yaml
- name: Generate Tests
  run: |
    opencode run "Generate unit tests for all functions in src/utils.ts" \
      --output tests/utils.test.ts
```

### Cobertura de Pruebas

```yaml
- name: Check Coverage
  run: |
    npm test -- --coverage
    opencode run "Analyze test coverage and suggest improvements" \
      --output coverage-analysis.md
```

---

## Automatización de Despliegue

### Generación de Changelog

```yaml
- name: Generate Changelog
  run: |
    opencode run "Generate changelog from git commits since last release" \
      --output CHANGELOG.md
```

### Notas de Release

```yaml
- name: Create Release Notes
  if: starts_with(github.ref, 'refs/tags/')
  run: |
    opencode run "Create release notes for version ${{ github.ref_name }}" \
      --output release-notes.md
```

---

## Integración de Seguridad

### Escaneo de Vulnerabilidades

```yaml
- name: Security Scan
  run: |
    opencode run "Scan codebase for:
    1. SQL injection vulnerabilities
    2. XSS vulnerabilities
    3. Hardcoded secrets
    4. Insecure dependencies" \
    --output security-report.md
```

### Cumplimiento de Licencias

```yaml
- name: License Check
  run: |
    opencode run "Check all dependencies have compatible licenses" \
      --output license-report.md
```

---

## Mejores Prácticas

| Práctica | Razón |
|----------|-------|
| **Cachear dependencias** | Ejecución más rápida del pipeline |
| **Establecer timeouts** | Prevenir trabajos colgados |
| **Usar secrets** | Nunca commitear API keys |
| **Trabajos paralelos** | Retroalimentación más rápida |
| **Almacenamiento de artefactos** | Mantener reportes accesibles |

---

## Practice Questions

```question
{
  "id": "oc-cicd-q1",
  "type": "multiple-choice",
  "question": "¿Cuál es el beneficio principal de integrar OpenCode con CI/CD?",
  "options": [
    "Despliegue más rápido",
    "Revisión automatizada de código y verificaciones de calidad",
    "Costos de API más bajos",
    "Configuración más simple"
  ],
  "correct": 1,
  "explanation": "La integración CI/CD proporciona revisión automática de código y verificaciones de calidad consistentes en cada commit."
}
```

```question
{
  "id": "oc-cicd-q2",
  "type": "multiple-choice",
  "question": "¿Dónde se deben almacenar las API keys en GitHub Actions?",
  "options": [
    "En el archivo de flujo de trabajo",
    "En variables de entorno",
    "En GitHub Secrets",
    "En el código fuente"
  ],
  "correct": 2,
  "explanation": "GitHub Secrets proporciona almacenamiento seguro para API keys que se enmascaran en los logs."
}
```

```question
{
  "id": "oc-cicd-q3",
  "type": "multiple-choice",
  "question": "¿Qué hace el comando opencode run en CI/CD?",
  "options": [
    "Inicia una sesión interactiva",
    "Ejecuta un solo prompt y termina",
    "Ejecuta la suite de pruebas",
    "Despliega la aplicación"
  ],
  "correct": 1,
  "explanation": "El comando run ejecuta un solo prompt, lo que lo hace ideal para automatización CI/CD."
}
```

```question
{
  "id": "oc-cicd-q4",
  "type": "multiple-choice",
  "question": "¿Cómo capturas la salida de OpenCode en CI/CD?",
  "options": [
    "Usando redirección de stdout",
    "Usando el flag --output",
    "Ambos funcionan igual de bien",
    "La salida no se puede capturar"
  ],
  "correct": 1,
  "explanation": "El flag --output escribe los resultados en un archivo, que puede usarse en pasos posteriores."
}
```

```question
{
  "id": "oc-cicd-q5",
  "type": "multiple-choice",
  "question": "¿Qué debes hacer para prevenir que los trabajos de CI/CD se cuelguen?",
  "options": [
    "Usar runners más grandes",
    "Establecer timeouts para los comandos de OpenCode",
    "Deshabilitar el registro",
    "Usar modelos más rápidos"
  ],
  "correct": 1,
  "explanation": "Establecer timeouts previene que OpenCode consuma recursos si se queda trabado."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Integra OpenCode con GitHub Actions o GitLab CI para revisión automatizada
- Usa el flag --output para capturar resultados en archivos
- Almacena API keys en GitHub Secrets o Variables de GitLab CI
- Las comppuertas de quality gates detectan problemas antes de la revisión humana
- El escaneo de seguridad puede detectar vulnerabilidades automáticamente
- Cachear dependencias y establecer timeouts para pipelines más rápidos y confiables
- Los trabajos paralelos proporcionan retroalimentación más rápida a los desarrolladores