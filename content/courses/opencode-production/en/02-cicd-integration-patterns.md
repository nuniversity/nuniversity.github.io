---
title: "CI/CD Integration Patterns"
description: "Integrate OpenCode into your CI/CD pipelines. Learn automated code review, testing workflows, deployment automation, and quality gates for continuous integration."
order: 2
duration: "60 min"
difficulty: "advanced"
---

# CI/CD Integration Patterns

## Why Integrate OpenCode with CI/CD?

| Benefit | Description |
|---------|-------------|
| **Automated Review** | AI catches issues before human review |
| **Consistent Quality** | Same standards every commit |
| **Faster Feedback** | Developers get instant feedback |
| **Cost Reduction** | Fewer human review cycles |

---

## GitHub Actions Integration

### Basic Workflow

Create `.github/workflows/opencode-review.yml`:

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

## GitLab CI Integration

Create `.gitlab-ci.yml`:

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

### Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/bash
opencode run "Check if staged files follow coding standards" || exit 1
```

### PR Validation

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

## Automated Testing

### Test Generation

```yaml
- name: Generate Tests
  run: |
    opencode run "Generate unit tests for all functions in src/utils.ts" \
      --output tests/utils.test.ts
```

### Test Coverage

```yaml
- name: Check Coverage
  run: |
    npm test -- --coverage
    opencode run "Analyze test coverage and suggest improvements" \
      --output coverage-analysis.md
```

---

## Deployment Automation

### Changelog Generation

```yaml
- name: Generate Changelog
  run: |
    opencode run "Generate changelog from git commits since last release" \
      --output CHANGELOG.md
```

### Release Notes

```yaml
- name: Create Release Notes
  if: starts_with(github.ref, 'refs/tags/')
  run: |
    opencode run "Create release notes for version ${{ github.ref_name }}" \
      --output release-notes.md
```

---

## Security Integration

### Vulnerability Scanning

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

### License Compliance

```yaml
- name: License Check
  run: |
    opencode run "Check all dependencies have compatible licenses" \
      --output license-report.md
```

---

## Best Practices

| Practice | Reason |
|----------|--------|
| **Cache dependencies** | Faster pipeline execution |
| **Set timeouts** | Prevent hanging jobs |
| **Use secrets** | Never commit API keys |
| **Parallel jobs** | Faster feedback |
| **Artifact storage** | Keep reports accessible |

---

## Practice Questions

```question
{
  "id": "oc-cicd-q1",
  "type": "multiple-choice",
  "question": "What is the primary benefit of integrating OpenCode with CI/CD?",
  "options": [
    "Faster deployment",
    "Automated code review and quality checks",
    "Lower API costs",
    "Simpler configuration"
  ],
  "correct": 1,
  "explanation": "CI/CD integration provides automated code review and consistent quality checks on every commit."
}
```

```question
{
  "id": "oc-cicd-q2",
  "type": "multiple-choice",
  "question": "Where should API keys be stored in GitHub Actions?",
  "options": [
    "In the workflow file",
    "In environment variables",
    "In GitHub Secrets",
    "In the codebase"
  ],
  "correct": 2,
  "explanation": "GitHub Secrets provides secure storage for API keys that are masked in logs."
}
```

```question
{
  "id": "oc-cicd-q3",
  "type": "multiple-choice",
  "question": "What does the opencode run command do in CI/CD?",
  "options": [
    "Starts an interactive session",
    "Executes a single prompt and exits",
    "Runs the test suite",
    "Deploys the application"
  ],
  "correct": 1,
  "explanation": "The run command executes a single prompt, making it ideal for CI/CD automation."
}
```

```question
{
  "id": "oc-cicd-q4",
  "type": "multiple-choice",
  "question": "How do you capture OpenCode output in CI/CD?",
  "options": [
    "Use stdout redirection",
    "Use the --output flag",
    "Both work equally well",
    "Output cannot be captured"
  ],
  "correct": 1,
  "explanation": "The --output flag writes results to a file, which can then be used in subsequent steps."
}
```

```question
{
  "id": "oc-cicd-q5",
  "type": "multiple-choice",
  "question": "What should you do to prevent CI/CD jobs from hanging?",
  "options": [
    "Use larger runners",
    "Set timeouts for OpenCode commands",
    "Disable logging",
    "Use faster models"
  ],
  "correct": 1,
  "explanation": "Setting timeouts prevents OpenCode from consuming resources if it gets stuck."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Integrate OpenCode with GitHub Actions or GitLab CI for automated review
- Use the --output flag to capture results in files
- Store API keys in GitHub Secrets or GitLab CI Variables
- Quality gates catch issues before human review
- Security scanning can detect vulnerabilities automatically
- Cache dependencies and set timeouts for faster, reliable pipelines
- Parallel jobs provide faster feedback to developers