---
title: "Pipeline CI/CD Completo"
description: "Construa um pipeline CI/CD completo com GitHub Actions integrando testes, linting, formatação, verificação de tipo, varredura de segurança, portões de cobertura e deploy"
order: 9
duration: "65 minutos"
difficulty: "intermediário"
---

# Pipeline CI/CD Completo

Esta lição de capstone reúne tudo que você aprendeu — testes, cobertura, linting, formatação, verificação de tipo e varredura de segurança — em um pipeline CI/CD completo. Você construirá um workflow profissional do GitHub Actions com portões de qualidade em cada estágio.

## Arquitetura do Pipeline

```mermaid
flowchart LR
    A["Developer Push"] --> B["Lint & Format"]
    B --> C{"Passa?"}
    C -->|"Não ❌"| D["Corrigir & Re-enviar"]
    D --> A
    C -->|"Sim ✅"| E["Verificação de Tipo"]
    E --> F{"Passa?"}
    F -->|"Não ❌"| D
    F -->|"Sim ✅"| G["Varredura de Segurança"]
    G --> H{"Passa?"}
    H -->|"Não ❌"| D
    H -->|"Sim ✅"| I["Testes Unitários + Cobertura"]
    I --> J{"Cobertura >=\n85%?"}
    J -->|"Não ❌"| D
    J -->|"Sim ✅"| K["Testes de Integração"]
    K --> L{"Todos Passam?"}
    L -->|"Não ❌"| D
    L -->|"Sim ✅"| M["Build & Empacotamento"]
    M --> N["Publicar no\nRegistry"]
    N --> O["Deploy em\nStaging"]
    O --> P["Testes E2E"]
    P --> Q{"Passam?"}
    Q -->|"Não ❌"| R["Rollback"]
    Q -->|"Sim ✅"| S["Deploy em\nProdução"]
    
    style A fill:#e1f5fe
    style M fill:#bbdefb
    style N fill:#bbdefb
    style O fill:#fff9c4
    style S fill:#c8e6c9
    style R fill:#ffcdd2
```

## O Workflow Completo do GitHub Actions

### 1. Workflow Principal (Acionado por PR e Push)

```yaml
# .github/workflows/ci.yml
name: Pipeline CI/CD

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
  # ESTÁGIO 1: Verificações de Qualidade (feedback rápido)
  # ============================================================
  quality:
    name: Qualidade de Código
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache de dependências pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Instalar dependências
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt

      - name: Verificar formatação (Black)
        run: |
          black --check --diff --line-length 100 src/ tests/
        continue-on-error: false

      - name: Verificar ordem de imports (isort)
        run: |
          isort --check-only --diff --profile black src/ tests/
        continue-on-error: false

      - name: Lint com Ruff
        run: |
          ruff check src/ tests/
        continue-on-error: false

      - name: Lint com Flake8
        run: |
          flake8 src/ tests/ --statistics --max-line-length=100
        continue-on-error: false

  # ============================================================
  # ESTÁGIO 2: Análise Estática
  # ============================================================
  static-analysis:
    name: Análise Estática
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Instalar dependências
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt
          pip install mypy types-requests types-PyYAML

      - name: Verificação de tipo com mypy
        run: |
          mypy src/ --strict --ignore-missing-imports
        continue-on-error: false

      - name: Varredura de segurança com bandit
        run: |
          bandit -r src/ -ll -f json -o bandit_report.json
        continue-on-error: false

      - name: Upload relatório de segurança
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-reports
          path: bandit_report.json

  # ============================================================
  # ESTÁGIO 3: Testes & Cobertura
  # ============================================================
  test:
    name: Testes & Cobertura
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

      - name: Instalar dependências
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt
          pip install -e .

      - name: Executar testes unitários com cobertura
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

      - name: Executar testes de integração
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

      - name: Combinar relatórios de cobertura
        run: |
          pip install coverage
          coverage combine
          coverage report --fail-under=${{ env.COVERAGE_THRESHOLD }}
          coverage xml -o coverage.xml

      - name: Upload cobertura para Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
          flags: unittests,integration
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload relatórios de teste
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: |
            coverage*.xml
            test-report*.xml

  # ============================================================
  # ESTÁGIO 4: Build & Empacotamento
  # ============================================================
  build:
    name: Build do Pacote
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Build do pacote
        run: |
          pip install build
          python -m build

      - name: Upload artefato do build
        uses: actions/upload-artifact@v4
        with:
          name: package
          path: dist/

  # ============================================================
  # ESTÁGIO 5: Deploy (apenas em push para main)
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

      - name: Deploy para produção
        run: |
          echo "Fazendo deploy para produção..."
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}

      - name: Health check
        run: |
          echo "Executando health check..."
```

## Visualização do Pipeline

```mermaid
sequenceDiagram
    participant Dev as Desenvolvedor
    participant GH as GitHub
    participant CI as Runner CI
    participant DB as Banco de Teste
    participant CD as Alvo de Deploy
    
    Dev->>GH: git push feature-branch
    GH->>CI: Disparar workflow
    
    CI->>CI: Estágio 1: Qualidade
    CI->>CI: Black (formatação)
    CI->>CI: isort (imports)
    CI->>CI: Ruff (linting)
    CI->>CI: Flake8 (linting)
    Note over CI: Feedback rápido (< 2 min)
    
    CI->>CI: Estágio 2: Análise Estática
    CI->>CI: mypy (tipo)
    CI->>CI: bandit (segurança)
    Note over CI: Encontra erros lógicos
    
    CI->>DB: Estágio 3: Testes
    DB-->>CI: BD de teste pronto
    CI->>CI: Testes unitários + cobertura
    CI->>CI: Testes de integração
    CI->>CI: Cobertura >= 85%?
    Note over CI: Portão de qualidade
    
    CI->>CI: Estágio 4: Build
    CI->>CI: Build do pacote
    Note over CI: Pronto para deploy
    
    alt Push para main
        CI->>CD: Estágio 5: Deploy
        CI->>CD: Health check
        CD-->>CI: Saudável
        CI->>GH: ✅ Deploy bem-sucedido
    else PR para main
        CI->>GH: ✅ Todas as verificações passaram
        GH->>Dev: PR pronto para merge
    end
```

## Portões de Qualidade

Portões de qualidade garantem que toda mudança atenda a um padrão mínimo antes de merge:

```yaml
# Configuração de portão de qualidade
name: Portão de Qualidade

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
              'Qualidade de Código',
              'Análise Estática',
              'Testes & Cobertura',
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
                `Verificações necessárias falharam: ${failed.map(c => c.name).join(', ')}`
              );
            }
```

### Script de Portão de Cobertura

```python
# scripts/check_coverage_gate.py
"""
Verifica se cobertura atende ao limiar.
Uso: python scripts/check_coverage_gate.py coverage.xml 85
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
        print("Nenhuma linha encontrada no relatório de cobertura")
        return False

    coverage_pct = (covered_lines / total_lines) * 100
    print(f"Cobertura: {coverage_pct:.2f}% (limiar: {threshold}%)")

    if coverage_pct < threshold:
        print(f"❌ FALHOU: Cobertura {coverage_pct:.2f}% < {threshold}%")
        return False

    print(f"✅ PASSOU: Cobertura {coverage_pct:.2f}% >= {threshold}%")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: check_coverage_gate.py <coverage.xml> <threshold>")
        sys.exit(1)

    success = check_coverage(sys.argv[1], float(sys.argv[2]))
    sys.exit(0 if success else 1)
```

## Requisitos de Desenvolvimento

```txt
# requirements-dev.txt
# Testes
pytest>=8.0,<9.0
pytest-cov>=5.0,<6.0
pytest-xdist>=3.0,<4.0
pytest-asyncio>=0.21,<1.0

# Linting
ruff>=0.4,<1.0
flake8>=7.0,<8.0
flake8-docstrings>=1.7,<2.0
flake8-bugbear>=24.0,<25.0

# Formatação
black>=24.0,<25.0
isort>=5.13,<6.0

# Análise estática
mypy>=1.10,<2.0
bandit>=1.7,<2.0
types-requests>=2.31
types-PyYAML>=6.0

# Pre-commit
pre-commit>=3.7,<4.0

# Cobertura
coverage>=7.0,<8.0

# Build
build>=1.0,<2.0
twine>=5.0,<6.0
```

## Makefile para Desenvolvimento Local

```makefile
# Makefile
.PHONY: help setup install lint format typecheck security test coverage build clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup       - Instalar todas as dependências"
	@echo "  make lint        - Executar todos os linters"
	@echo "  make format      - Formatar todo o código"
	@echo "  make typecheck   - Executar verificação de tipo mypy"
	@echo "  make security    - Executar varredura de segurança bandit"
	@echo "  make test        - Executar todos os testes"
	@echo "  make coverage    - Executar testes com relatório de cobertura"
	@echo "  make build       - Build de pacotes de distribuição"
	@echo "  make clean       - Remover artefatos de build"

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
	@echo "✅ Todas as verificações passaram!"
```

## Workflows Específicos por Ambiente

### Workflow de PR (Rápido)

```yaml
# .github/workflows/pr.yml
name: Verificações de PR

on: pull_request

jobs:
  quick-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Verificações rápidas
        run: |
          pip install ruff flake8 black isort mypy bandit
          ruff check src/
          black --check --diff src/
          isort --check-only --diff --profile black src/
          mypy src/ --ignore-missing-imports
          bandit -r src/ -ll
```

### Workflow de Branch Main (Completo)

```yaml
# .github/workflows/main.yml
name: CI/CD Branch Main

on:
  push:
    branches: [main]

jobs:
  full-pipeline:
    name: Pipeline Completo
    uses: ./.github/workflows/ci.yml
    secrets: inherit

  publish:
    name: Publicar no PyPI
    runs-on: ubuntu-latest
    needs: [full-pipeline]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Build do pacote
        run: |
          pip install build
          python -m build

      - name: Publicar no PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_API_TOKEN }}

  release:
    name: Criar GitHub Release
    runs-on: ubuntu-latest
    needs: [publish]
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## Métricas e Monitoramento do Pipeline

| Estágio | Duração | Taxa de Aprovação | O que Monitorar |
|---------|---------|-------------------|-----------------|
| **Qualidade** | ~1-2 min | > 99% | Número de avisos de lint |
| **Análise Estática** | ~2-3 min | > 99% | Erros mypy, achados bandit |
| **Testes** | ~5-15 min | > 95% | Testes instáveis, tendências de cobertura |
| **Build** | ~1-2 min | > 99% | Tempo de build, mudanças de dependência |
| **Deploy** | ~2-5 min | > 99% | Falhas de deploy, rollbacks |

```mermaid
flowchart TD
    subgraph "Dashboard CI/CD"
        A["Status do Pipeline"] --> B["Qualidade: ✅ Passou"]
        A --> C["Análise Estática: ✅ Passou"]
        A --> D["Testes: ✅ Passou<br/>Cobertura: 87.3%"]
        A --> E["Build: ✅ Passou"]
        A --> F["Deploy: 🚀 Live"]
        
        G["Commits Recentes"] --> H["main: 2m atrás ✅"]
        G --> I["develop: 5m atrás ✅"]
        G --> J["feature-x: 15m atrás ✅"]
        
        K["Tendência de Cobertura"] --> L["Seg: 84.2%"]
        L --> M["Ter: 85.1%"]
        M --> N["Qua: 86.7%"]
        N --> O["Qui: 87.3% ↗️"]
    end
    
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#c8e6c9
    style E fill:#bbdefb
    style F fill:#bbdefb
    style O fill:#c8e6c9
```

## Exercícios Práticos

1. **Crie o Workflow Completo**: Crie um `.github/workflows/ci.yml` que inclua verificações de qualidade, análise estática e testes. Envie para um repositório GitHub e verifique se executa.

2. **Adicione um Container de Serviço**: Modifique o workflow CI para incluir um container de serviço PostgreSQL ou Redis. Atualize seus testes de integração para usar este serviço.

3. **Portão de Cobertura**: Adicione um portão de cobertura personalizado que falhe o build se a cobertura cair abaixo de 80%. Use o módulo Python `coverage` para analisar o relatório XML.

4. **Deploy Condicional**: Crie um workflow que só faça deploy quando commits são enviados para a branch `main` E todos os estágios anteriores passam. Adicione uma etapa de aprovação manual usando ambientes.

5. **Jobs em Paralelo**: Estruture seu workflow para que linting, verificação de tipo e varredura de segurança executem em paralelo, depois os testes executem após todos os três completarem. Meça a economia de tempo.

6. **Detecção de Testes Instáveis**: Adicione uma etapa que re-executa testes falhos uma vez para detectar testes instáveis. Se um teste passar na re-execução, marque-o como instável mas não falhe o build.

7. **Matriz de Build**: Crie uma matriz de build que execute testes contra Python 3.10, 3.11 e 3.12. Garanta que todas as versões passem antes do deploy.

8. **Configuração Completa do Projeto**: Configure um projeto Python completo com: pyproject.toml, ganchos pre-commit, Makefile, pipeline CI/CD completo e README com badges de status de build.

## Resumo

- **GitHub Actions** fornece uma plataforma CI/CD poderosa e integrada
- **Pipelines multi-estágio** separam preocupações: qualidade → análise → teste → build → deploy
- **Portões de qualidade** em cada estágio impedem que código ruim progrida
- **Containers de serviço** permitem testes de integração reais no CI
- **Execução paralela** acelera o feedback para tarefas independentes
- **Deploy condicional** garante que apenas código testado e de qualidade chegue à produção
- **Artefatos** preservam relatórios e saídas de build entre estágios do workflow
- **Paridade local** via Makefile garante que desenvolvedores possam reproduzir verificações CI localmente

> [!SUCCESS]
> Você construiu um pipeline CI/CD completo. Cada commit agora passa por formatação, linting, verificação de tipo, varredura de segurança, testes, portões de cobertura e deploy automatizado. Isto é engenharia de software profissional na prática.
