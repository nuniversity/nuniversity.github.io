---
title: "Padrões de Integração CI/CD"
description: "Integre o OpenCode nos seus pipelines de CI/CD. Aprenda revisão automatizada de código, workflows de testes, automação de deploy e quality gates para integração contínua."
order: 2
duration: "60 min"
difficulty: "advanced"
---

# Padrões de Integração CI/CD

## Por que integrar o OpenCode com CI/CD?

| Benefício | Descrição |
|---------|-------------|
| **Revisão Automatizada** | IA detecta problemas antes da revisão humana |
| **Qualidade Consistente** | Mesmos padrões em cada commit |
| **Feedback Mais Rápido** | Desenvolvedores recebem feedback instantâneo |
| **Redução de Custos** | Menos ciclos de revisão humana |

---

## Integração com GitHub Actions

### Workflow Básico

Crie `.github/workflows/opencode-review.yml`:

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

## Integração com GitLab CI

Crie `.gitlab-ci.yml`:

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

## Quality Gates

### Hook Pre-commit

Crie `.husky/pre-commit`:

```bash
#!/bin/bash
opencode run "Check if staged files follow coding standards" || exit 1
```

### Validação de PR

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

## Testes Automatizados

### Geração de Testes

```yaml
- name: Generate Tests
  run: |
    opencode run "Generate unit tests for all functions in src/utils.ts" \
      --output tests/utils.test.ts
```

### Cobertura de Testes

```yaml
- name: Check Coverage
  run: |
    npm test -- --coverage
    opencode run "Analyze test coverage and suggest improvements" \
      --output coverage-analysis.md
```

---

## Automação de Deploy

### Geração de Changelog

```yaml
- name: Generate Changelog
  run: |
    opencode run "Generate changelog from git commits since last release" \
      --output CHANGELOG.md
```

### Notas de Versão

```yaml
- name: Create Release Notes
  if: starts_with(github.ref, 'refs/tags/')
  run: |
    opencode run "Create release notes for version ${{ github.ref_name }}" \
      --output release-notes.md
```

---

## Integração de Segurança

### Varredura de Vulnerabilidades

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

### Conformidade de Licenças

```yaml
- name: License Check
  run: |
    opencode run "Check all dependencies have compatible licenses" \
      --output license-report.md
```

---

## Melhores Práticas

| Prática | Motivo |
|----------|--------|
| **Cache de dependências** | Pipeline de execução mais rápido |
| **Definir timeouts** | Evitar jobs que travam |
| **Usar secrets** | Nunca committar chaves de API |
| **Jobs paralelos** | Feedback mais rápido |
| **Armazenamento de artifacts** | Manter relatórios acessíveis |

---

## Practice Questions

```question
{
  "id": "oc-cicd-q1",
  "type": "multiple-choice",
  "question": "Qual é o principal benefício de integrar o OpenCode com CI/CD?",
  "options": [
    "Deploy mais rápido",
    "Revisão automatizada de código e verificações de qualidade",
    "Custos de API mais baixos",
    "Configuração mais simples"
  ],
  "correct": 1,
  "explanation": "A integração CI/CD fornece revisão automatizada de código e verificações consistentes de qualidade em cada commit."
}
```

```question
{
  "id": "oc-cicd-q2",
  "type": "multiple-choice",
  "question": "Onde as chaves de API devem ser armazenadas no GitHub Actions?",
  "options": [
    "No arquivo de workflow",
    "Em variáveis de ambiente",
    "No GitHub Secrets",
    "No codebase"
  ],
  "correct": 2,
  "explanation": "O GitHub Secrets fornece armazenamento seguro para chaves de API que são mascaradas nos logs."
}
```

```question
{
  "id": "oc-cicd-q3",
  "type": "multiple-choice",
  "question": "O que o comando opencode run faz no CI/CD?",
  "options": [
    "Inicia uma sessão interativa",
    "Executa um único prompt e sai",
    "Executa o conjunto de testes",
    "Faz o deploy da aplicação"
  ],
  "correct": 1,
  "explanation": "O comando run executa um único prompt, sendo ideal para automação de CI/CD."
}
```

```question
{
  "id": "oc-cicd-q4",
  "type": "multiple-choice",
  "question": "Como capturar a saída do OpenCode no CI/CD?",
  "options": [
    "Usar redirecionamento stdout",
    "Usar a flag --output",
    "Ambos funcionam igualmente bem",
    "A saída não pode ser capturada"
  ],
  "correct": 1,
  "explanation": "A flag --output grava os resultados em um arquivo, que pode ser usado em etapas subsequentes."
}
```

```question
{
  "id": "oc-cicd-q5",
  "type": "multiple-choice",
  "question": "O que você deve fazer para evitar que os jobs de CI/CD travem?",
  "options": [
    "Usar runners maiores",
    "Definir timeouts para os comandos do OpenCode",
    "Desabilitar logging",
    "Usar modelos mais rápidos"
  ],
  "correct": 1,
  "explanation": "Definir timeouts evita que o OpenCode consuma recursos caso fique travado."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Integre o OpenCode com GitHub Actions ou GitLab CI para revisão automatizada
- Use a flag --output para capturar resultados em arquivos
- Armazene chaves de API no GitHub Secrets ou GitLab CI Variables
- Quality gates detectam problemas antes da revisão humana
- Varredura de segurança pode detectar vulnerabilidades automaticamente
- Cache dependências e defina timeouts para pipelines mais rápidos e confiáveis
- Jobs paralelos fornecem feedback mais rápido aos desenvolvedores
