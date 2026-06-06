---
title: "Complete CI/CD Pipeline"
description: "Build a complete CI/CD pipeline with GitHub Actions integrating testing, linting, formatting, type checking, security scanning, coverage gates, and deployment"
order: 9
duration: "65 minutes"
difficulty: "intermediate"
---

# Complete CI/CD Pipeline

This capstone lesson brings together everything you've learned — testing, coverage, linting, formatting, type checking, and security scanning — into a complete CI/CD pipeline. You'll build a professional-grade GitHub Actions workflow with quality gates at every stage.

## Pipeline Architecture

```mermaid
flowchart LR
    A["Developer Push"] --> B["Lint & Format"]
    B --> C{"Pass?"}
    C -->|"No ❌"| D["Fix & Re-push"]
    D --> A
    C -->|"Yes ✅"| E["Type Check"]
    E --> F{"Pass?"}
    F -->|"No ❌"| D
    F -->|"Yes ✅"| G["Security Scan"]
    G --> H{"Pass?"}
    H -->|"No ❌"| D
    H -->|"Yes ✅"| I["Unit Tests + Coverage"]
    I --> J{"Coverage >=\n85%?"}
    J -->|"No ❌"| D
    J -->|"Yes ✅"| K["Integration Tests"]
    K --> L{"All Pass?"}
    L -->|"No ❌"| D
    L -->|"Yes ✅"| M["Build & Package"]
    M --> N["Publish to\nRegistry"]
    N --> O["Deploy to\nStaging"]
    O --> P["E2E Tests"]
    P --> Q{"Pass?"}
    Q -->|"No ❌"| R["Rollback"]
    Q -->|"Yes ✅"| S["Deploy to\nProduction"]
    
    style A fill:#e1f5fe
    style M fill:#bbdefb
    style N fill:#bbdefb
    style O fill:#fff9c4
    style S fill:#c8e6c9
    style R fill:#ffcdd2
```

## The Complete GitHub Actions Workflow

### 1. Main Workflow (Triggered on PR and Push)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: '3.12'
  COVERAGE_THRESHOLD: '85'

jobs:
  # ============================================================
  # STAGE 1: Code Quality Checks (fast feedback)
  # ============================================================
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt

      - name: Check formatting (Black)
        run: |
          black --check --diff --line-length 100 src/ tests/
        continue-on-error: false

      - name: Check import order (isort)
        run: |
          isort --check-only --diff --profile black src/ tests/
        continue-on-error: false

      - name: Lint with Ruff
        run: |
          ruff check src/ tests/
        continue-on-error: false

      - name: Lint with Flake8
        run: |
          flake8 src/ tests/ --statistics --max-line-length=100
        continue-on-error: false

      - name: Upload lint reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lint-reports
          path: |
            **/ruff_report.txt
            **/flake8_report.txt

  # ============================================================
  # STAGE 2: Static Analysis
  # ============================================================
  static-analysis:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt
          pip install mypy types-requests types-PyYAML

      - name: Type check with mypy
        run: |
          mypy src/ --strict --ignore-missing-imports
        continue-on-error: false

      - name: Security scan with bandit
        run: |
          bandit -r src/ -ll -f json -o bandit_report.json
        continue-on-error: false

      - name: Upload security report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-reports
          path: bandit_report.json

  # ============================================================
  # STAGE 3: Testing & Coverage
  # ============================================================
  test:
    name: Tests & Coverage
    runs-on: ubuntu-latest
    needs: [quality, static-analysis]

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt
          pip install -e .

      - name: Run unit tests with coverage
        run: |
          pytest tests/unit/ \
            --cov=src \
            --cov-report=term-missing \
            --cov-report=xml:coverage-unit.xml \
            --cov-fail-under=${{ env.COVERAGE_THRESHOLD }} \
            --junitxml=test-report-unit.xml \
            -v
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Run integration tests
        run: |
          pytest tests/integration/ \
            --cov=src \
            --cov-report=term-missing \
            --cov-report=xml:coverage-integration.xml \
            --cov-append \
            --junitxml=test-report-integration.xml \
            -v
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Combine coverage reports
        run: |
          pip install coverage
          coverage combine
          coverage report --fail-under=${{ env.COVERAGE_THRESHOLD }}
          coverage xml -o coverage.xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
          flags: unittests,integration
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: |
            coverage*.xml
            test-report*.xml

  # ============================================================
  # STAGE 4: Build & Package
  # ============================================================
  build:
    name: Build Package
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Build package
        run: |
          pip install build
          python -m build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: package
          path: dist/

  # ============================================================
  # STAGE 5: Deploy (only on main branch push)
  # ============================================================
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/download-artifact@v4
        with:
          name: package
          path: dist/

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Example: scp dist/* user@server:/app/
          # Example: docker push registry.example.com/myapp:latest
          # Example: aws s3 sync dist/ s3://myapp-releases/
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}

      - name: Health check
        run: |
          echo "Running health check..."
          # curl -f https://myapp.com/health || exit 1
```

## Pipeline Workflow Visualization

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant CI as CI Runner
    participant DB as Test Database
    participant CD as Deploy Target
    
    Dev->>GH: git push feature-branch
    GH->>CI: Trigger workflow
    
    CI->>CI: Stage 1: Code Quality
    CI->>CI: Black (formatting)
    CI->>CI: isort (imports)
    CI->>CI: Ruff (linting)
    CI->>CI: Flake8 (linting)
    Note over CI: Fast feedback (< 2 min)
    
    CI->>CI: Stage 2: Static Analysis
    CI->>CI: mypy (type check)
    CI->>CI: bandit (security)
    Note over CI: Finds logic errors
    
    CI->>DB: Stage 3: Tests
    DB-->>CI: Test DB ready
    CI->>CI: Unit tests + coverage
    CI->>CI: Integration tests
    CI->>CI: Coverage >= 85%?
    Note over CI: Quality gate
    
    CI->>CI: Stage 4: Build
    CI->>CI: Build package
    Note over CI: Ready for deployment
    
    alt Push to main
        CI->>CD: Stage 5: Deploy
        CI->>CD: Health check
        CD-->>CI: Healthy
        CI->>GH: ✅ Deployment successful
    else PR to main
        CI->>GH: ✅ All checks passed
        GH->>Dev: PR ready to merge
    end
```

## Quality Gates

Quality gates ensure that every change meets a minimum bar before merging:

```yaml
# Quality gate configuration
name: Quality Gate

on:
  pull_request_review:
    types: [submitted]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/github-script@v7
        with:
          script: |
            const requiredChecks = [
              'Code Quality',
              'Static Analysis',
              'Tests & Coverage',
            ];

            const { data: checks } = await github.rest.checks.listForRef({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.payload.pull_request.head.sha,
            });

            const failed = checks.check_runs
              .filter(c => requiredChecks.includes(c.name))
              .filter(c => c.conclusion !== 'success');

            if (failed.length > 0) {
              core.setFailed(
                `Required checks failed: ${failed.map(c => c.name).join(', ')}`
              );
            }
```

### Coverage Quality Gate Script

```python
# scripts/check_coverage_gate.py
"""
Check if coverage meets the threshold.
Usage: python scripts/check_coverage_gate.py coverage.xml 85
"""
import sys
import xml.etree.ElementTree as ET


def check_coverage(coverage_file: str, threshold: float) -> bool:
    tree = ET.parse(coverage_file)
    root = tree.getroot()

    total_lines = 0
    covered_lines = 0

    for package in root.findall(".//package"):
        for cls in package.findall(".//class"):
            lines = cls.find("lines")
            if lines is not None:
                for line in lines.findall("line"):
                    total_lines += 1
                    if line.get("hits") != "0":
                        covered_lines += 1

    if total_lines == 0:
        print("No lines found in coverage report")
        return False

    coverage_pct = (covered_lines / total_lines) * 100
    print(f"Coverage: {coverage_pct:.2f}% (threshold: {threshold}%)")

    if coverage_pct < threshold:
        print(f"❌ FAILED: Coverage {coverage_pct:.2f}% < {threshold}%")
        return False

    print(f"✅ PASSED: Coverage {coverage_pct:.2f}% >= {threshold}%")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: check_coverage_gate.py <coverage.xml> <threshold>")
        sys.exit(1)

    success = check_coverage(sys.argv[1], float(sys.argv[2]))
    sys.exit(0 if success else 1)
```

## Development Requirements

```txt
# requirements-dev.txt
# Testing
pytest>=8.0,<9.0
pytest-cov>=5.0,<6.0
pytest-xdist>=3.0,<4.0
pytest-asyncio>=0.21,<1.0

# Linting
ruff>=0.4,<1.0
flake8>=7.0,<8.0
flake8-docstrings>=1.7,<2.0
flake8-bugbear>=24.0,<25.0

# Formatting
black>=24.0,<25.0
isort>=5.13,<6.0

# Static analysis
mypy>=1.10,<2.0
bandit>=1.7,<2.0
types-requests>=2.31
types-PyYAML>=6.0

# Pre-commit
pre-commit>=3.7,<4.0

# Coverage
coverage>=7.0,<8.0

# Build
build>=1.0,<2.0
twine>=5.0,<6.0
```

## Makefile for Local Development

```makefile
# Makefile
.PHONY: help setup install lint format typecheck security test coverage build clean

help:
	@echo "Available commands:"
	@echo "  make setup       - Install all dependencies"
	@echo "  make lint        - Run all linters"
	@echo "  make format      - Format all code"
	@echo "  make typecheck   - Run mypy type checking"
	@echo "  make security    - Run bandit security scan"
	@echo "  make test        - Run all tests"
	@echo "  make coverage    - Run tests with coverage report"
	@echo "  make build       - Build distribution packages"
	@echo "  make clean       - Remove build artifacts"

setup:
	python -m pip install --upgrade pip
	pip install -r requirements-dev.txt
	pre-commit install

lint:
	ruff check src/ tests/
	flake8 src/ tests/ --statistics --max-line-length=100

format:
	isort --profile black src/ tests/
	black --line-length 100 src/ tests/

format-check:
	isort --check-only --profile black src/ tests/
	black --check --line-length 100 src/ tests/

typecheck:
	mypy src/ --strict --ignore-missing-imports

security:
	bandit -r src/ -ll

test:
	pytest tests/ -v --cov=src

coverage:
	pytest tests/ --cov=src --cov-report=term-missing --cov-report=html --cov-fail-under=85

build:
	python -m pip install --upgrade build
	python -m build

clean:
	rm -rf dist/ build/ *.egg-info .coverage coverage.xml coverage_html/ __pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

all: lint format-check typecheck security test coverage
	@echo "✅ All checks passed!"
```

## Environment-Specific Workflows

### PR Workflow (Fast)

```yaml
# .github/workflows/pr.yml
name: PR Checks

on: pull_request

jobs:
  quick-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Quick checks
        run: |
          pip install ruff flake8 black isort mypy bandit
          ruff check src/
          black --check --diff src/
          isort --check-only --diff --profile black src/
          mypy src/ --ignore-missing-imports
          bandit -r src/ -ll
```

### Main Branch Workflow (Full)

```yaml
# .github/workflows/main.yml
name: Main Branch CI/CD

on:
  push:
    branches: [main]

jobs:
  full-pipeline:
    name: Full Pipeline
    uses: ./.github/workflows/ci.yml
    secrets: inherit

  publish:
    name: Publish to PyPI
    runs-on: ubuntu-latest
    needs: [full-pipeline]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Build package
        run: |
          pip install build
          python -m build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_API_TOKEN }}

  release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [publish]
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## Pipeline Metrics and Monitoring

| Stage | Duration | Pass Rate | What to Monitor |
|-------|----------|-----------|-----------------|
| **Quality** | ~1-2 min | > 99% | Number of lint warnings |
| **Static Analysis** | ~2-3 min | > 99% | mypy errors, bandit findings |
| **Tests** | ~5-15 min | > 95% | Flaky tests, coverage trends |
| **Build** | ~1-2 min | > 99% | Build time, dependency changes |
| **Deploy** | ~2-5 min | > 99% | Deployment failures, rollbacks |

```mermaid
flowchart TD
    subgraph "CI/CD Dashboard"
        A["Pipeline Status"] --> B["Quality: ✅ Pass"]
        A --> C["Static Analysis: ✅ Pass"]
        A --> D["Tests: ✅ Pass<br/>Coverage: 87.3%"]
        A --> E["Build: ✅ Pass"]
        A --> F["Deploy: 🚀 Live"]
        
        G["Recent Commits"] --> H["main: 2m ago ✅"]
        G --> I["develop: 5m ago ✅"]
        G --> J["feature-x: 15m ago ✅"]
        
        K["Coverage Trend"] --> L["Mon: 84.2%"]
        L --> M["Tue: 85.1%"]
        M --> N["Wed: 86.7%"]
        N --> O["Thu: 87.3% ↗️"]
    end
    
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#c8e6c9
    style E fill:#bbdefb
    style F fill:#bbdefb
    style O fill:#c8e6c9
```

## Practice Exercises

1. **Create the Complete Workflow**: Create a `.github/workflows/ci.yml` that includes quality checks, static analysis, and testing. Push it to a GitHub repository and verify it runs.

2. **Add a Service Container**: Modify the CI workflow to include a PostgreSQL or Redis service container. Update your integration tests to use this service.

3. **Coverage Gate**: Add a custom coverage gate that fails the build if coverage drops below 80%. Use the `coverage` Python module to parse the XML report.

4. **Conditional Deploy**: Create a workflow that only deploys when commits are pushed to the `main` branch AND all previous stages pass. Add a manual approval step using environments.

5. **Parallel Jobs**: Structure your workflow so that linting, type checking, and security scanning run in parallel, then tests run after all three complete. Measure the time savings.

6. **Flaky Test Detection**: Add a step that re-runs failed tests once to detect flaky tests. If a test passes on re-run, mark it as flaky but don't fail the build.

7. **Build Matrix**: Create a build matrix that runs tests against Python 3.10, 3.11, and 3.12. Ensure all versions pass before deployment.

8. **Complete Project Setup**: Set up a complete Python project with: pyproject.toml, pre-commit hooks, Makefile, full CI/CD pipeline, and README with build status badges.

## Summary

- **GitHub Actions** provides a powerful, integrated CI/CD platform
- **Multi-stage pipelines** separate concerns: quality → analysis → test → build → deploy
- **Quality gates** at each stage prevent bad code from progressing
- **Service containers** enable real integration tests in CI
- **Parallel execution** speeds up feedback for independent tasks
- **Conditional deployment** ensures only tested, quality code reaches production
- **Artifacts** preserve reports and build outputs across workflow stages
- **Local parity** via Makefile ensures developers can reproduce CI checks locally

> [!SUCCESS]
> You've built a complete CI/CD pipeline. Every commit now runs through formatting, linting, type checking, security scanning, testing, coverage gates, and automated deployment. This is professional-grade software engineering in practice.
