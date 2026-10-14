---
title: "Pipeline de CI/CD completo"
description: "Construye un pipeline de CI/CD completo con GitHub Actions que integra pruebas, linting, formateo, verificación de tipos, análisis de seguridad, puertas de cobertura y despliegue"
order: 9
duration: "65 min"
difficulty: "intermediate"
---

# Pipeline de CI/CD completo

Esta lección final reúne todo lo que has aprendido — pruebas, cobertura, linting, formateo, verificación de tipos y análisis de seguridad — en un pipeline de CI/CD completo. Construirás un workflow de GitHub Actions de nivel profesional con puertas de calidad en cada etapa.

## Arquitectura del pipeline

```mermaid
flowchart LR
    A["Push del desarrollador"] --> B["Lint y formato"]
    B --> C{"¿Pasa?"}
    C -->|"No ❌"| D["Corregir y volver a subir"]
    D --> A
    C -->|"Sí ✅"| E["Verificación de tipos"]
    E --> F{"¿Pasa?"}
    F -->|"No ❌"| D
    F -->|"Sí ✅"| G["Análisis de seguridad"]
    G --> H{"¿Pasa?"}
    H -->|"No ❌"| D
    H -->|"Sí ✅"| I["Tests unitarios + cobertura"]
    I --> J{"¿Cobertura >=\n85%?"}
    J -->|"No ❌"| D
    J -->|"Sí ✅"| K["Tests de integración"]
    K --> L{"¿Todo pasa?"}
    L -->|"No ❌"| D
    L -->|"Sí ✅"| M["Build y empaquetado"]
    M --> N["Publicar en el\nregistry"]
    N --> O["Deploy en\nstaging"]
    O --> P["Tests E2E"]
    P --> Q{"¿Pasa?"}
    Q -->|"No ❌"| R["Rollback"]
    Q -->|"Sí ✅"| S["Deploy en\nproducción"]
    
    style A fill:#e1f5fe
    style M fill:#bbdefb
    style N fill:#bbdefb
    style O fill:#fff9c4
    style S fill:#c8e6c9
    style R fill:#ffcdd2
```

## El workflow completo de GitHub Actions

### 1. Flujo de trabajo principal (se activa con PR y push)

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

## Visualización del flujo del pipeline

```mermaid
sequenceDiagram
    participant Dev as Desarrollador
    participant GH as GitHub
    participant CI as Runner de CI
    participant DB as Base de datos de pruebas
    participant CD as Destino de deploy
    
    Dev->>GH: git push feature-branch
    GH->>CI: Activa el workflow
    
    CI->>CI: Etapa 1: Calidad de código
    CI->>CI: Black (formateo)
    CI->>CI: isort (imports)
    CI->>CI: Ruff (linting)
    CI->>CI: Flake8 (linting)
    Note over CI: Respuesta rápida (< 2 min)
    
    CI->>CI: Etapa 2: Análisis estático
    CI->>CI: mypy (verificación de tipos)
    CI->>CI: bandit (seguridad)
    Note over CI: Detecta errores de lógica
    
    CI->>DB: Etapa 3: Tests
    DB-->>CI: Base de datos de pruebas lista
    CI->>CI: Tests unitarios + cobertura
    CI->>CI: Tests de integración
    CI->>CI: ¿Cobertura >= 85%?
    Note over CI: Quality gate
    
    CI->>CI: Etapa 4: Build
    CI->>CI: Construir el paquete
    Note over CI: Listo para el despliegue
    
    alt Push a main
        CI->>CD: Etapa 5: Deploy
        CI->>CD: Health check
        CD-->>CI: Correcto
        CI->>GH: ✅ Despliegue exitoso
    else PR a main
        CI->>GH: ✅ Todas las comprobaciones pasaron
        GH->>Dev: PR listo para merge
    end
```

## Puertas de calidad

Las puertas de calidad (quality gates) aseguran que cada cambio cumpla un mínimo antes de fusionarse:

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

### Script de la puerta de calidad de cobertura

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

## Requisitos de desarrollo

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

## Makefile para desarrollo local

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

## Flujos de trabajo por entorno

### Flujo de trabajo de PR (rápido)

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

### Flujo de trabajo de la rama principal (completo)

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

## Métricas y monitoreo del pipeline

| Etapa | Duración | Tasa de éxito | Qué monitorear |
|-------|----------|-----------|-----------------|
| **Calidad** | ~1-2 min | > 99% | Número de avisos de lint |
| **Análisis estático** | ~2-3 min | > 99% | Errores de mypy, hallazgos de bandit |
| **Tests** | ~5-15 min | > 95% | Tests inestables, tendencias de cobertura |
| **Build** | ~1-2 min | > 99% | Tiempo de build, cambios de dependencias |
| **Deploy** | ~2-5 min | > 99% | Fallos de despliegue, rollbacks |

```mermaid
flowchart TD
    subgraph "Panel de CI/CD"
        A["Estado del pipeline"] --> B["Calidad: ✅ Pasa"]
        A --> C["Análisis estático: ✅ Pasa"]
        A --> D["Tests: ✅ Pasa<br/>Cobertura: 87.3%"]
        A --> E["Build: ✅ Pasa"]
        A --> F["Deploy: 🚀 En producción"]
        
        G["Commits recientes"] --> H["main: hace 2 min ✅"]
        G --> I["develop: hace 5 min ✅"]
        G --> J["feature-x: hace 15 min ✅"]
        
        K["Tendencia de cobertura"] --> L["Lun: 84.2%"]
        L --> M["Mar: 85.1%"]
        M --> N["Mié: 86.7%"]
        N --> O["Jue: 87.3% ↗️"]
    end
    
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#c8e6c9
    style E fill:#bbdefb
    style F fill:#bbdefb
    style O fill:#c8e6c9
```

## Ejercicios prácticos

1. **Crea el workflow completo**: Crea un `.github/workflows/ci.yml` que incluya comprobaciones de calidad, análisis estático y pruebas. Súbelo a un repositorio de GitHub y verifica que se ejecuta.

2. **Añade un service container**: Modifica el workflow del CI para incluir un service container de PostgreSQL o Redis. Actualiza tus tests de integración para usar este servicio.

3. **Puerta de cobertura**: Añade una puerta de cobertura personalizada que haga fallar la build si la cobertura baja del 80%. Usa el módulo de Python `coverage` para analizar el informe XML.

4. **Despliegue condicional**: Crea un workflow que solo haga despliegue cuando se hagan push de commits a la rama `main` Y todas las etapas anteriores pasen. Añade un paso de aprobación manual usando environments.

5. **Jobs paralelos**: Estructura tu workflow de modo que el linting, la verificación de tipos y el análisis de seguridad se ejecuten en paralelo, y luego los tests se ejecuten cuando los tres hayan terminado. Mide el ahorro de tiempo.

6. **Detección de tests inestables**: Añade un paso que vuelva a ejecutar una vez los tests fallidos para detectar tests inestables (flaky). Si un test pasa al reintentarlo, márcalo como inestable pero no hagas fallar la build.

7. **Matriz de build**: Crea una matriz de build que ejecute los tests con Python 3.10, 3.11 y 3.12. Asegúrate de que todas las versiones pasen antes del despliegue.

8. **Configuración completa del proyecto**: Configura un proyecto Python completo con: pyproject.toml, hooks de pre-commit, Makefile, pipeline de CI/CD completo y README con insignias del estado de la build.

## Resumen

- **GitHub Actions** ofrece una plataforma de CI/CD potente e integrada
- **Los pipelines por etapas** separan las responsabilidades: calidad → análisis → test → build → deploy
- **Las puertas de calidad** en cada etapa impiden que el código malo avance
- **Los service containers** permiten tests de integración reales en el CI
- **La ejecución paralela** acelera la retroalimentación en tareas independientes
- **El despliegue condicional** garantiza que solo llegue a producción código probado y de calidad
- **Los artifacts** conservan los informes y los resultados de build entre etapas del workflow
- **La paridad local** mediante el Makefile garantiza que los desarrolladores puedan reproducir localmente las comprobaciones del CI

> [!SUCCESS]
> Has construido un pipeline de CI/CD completo. Ahora cada commit pasa por formateo, linting, verificación de tipos, análisis de seguridad, pruebas, puertas de cobertura y despliegue automatizado. Esta es la ingeniería de software de nivel profesional en la práctica.
