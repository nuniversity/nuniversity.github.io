---
title: "Testes Unitários"
description: "Escreva testes confiáveis com unittest e pytest: asserções, fixtures de teste, mocking e padrões de desenvolvimento orientado a testes"
order: 9
duration: "45 minutos"
difficulty: "intermediário"
---

# Testes Unitários

Testes garantem que seu código funciona corretamente e permanece correto à medida que evolui. A biblioteca padrão do Python inclui `unittest`, e a comunidade usa amplamente `pytest` por sua simplicidade e poder.

## Por Que Testar?

| Benefício | Descrição |
|-----------|-----------|
| Detectar regressões | Mudanças que quebram comportamento existente são detectadas imediatamente |
| Documentar comportamento | Testes servem como documentação executável |
| Possibilitar refatoração | Reestruture código com confiança sabendo que testes protegem a correção |
| Melhoria de design | Código testável tende a ser melhor estruturado |

## O Módulo `unittest`

```python
import unittest

def add(a: int, b: int) -> int:
    return a + b

class TestAdd(unittest.TestCase):
    def test_add_positive(self):
        self.assertEqual(add(2, 3), 5)

    def test_add_negative(self):
        self.assertEqual(add(-1, 1), 0)

    def test_add_zero(self):
        self.assertEqual(add(0, 0), 0)

if __name__ == "__main__":
    unittest.main()
```

```bash
python -m unittest test_math.py
python -m unittest test_math.TestAdd
python -m unittest test_math.TestAdd.test_add_positive
```

## Métodos `assert` Comuns

| Método | Verifica |
|--------|----------|
| `assertEqual(a, b)` | `a == b` |
| `assertNotEqual(a, b)` | `a != b` |
| `assertTrue(x)` | `bool(x) is True` |
| `assertFalse(x)` | `bool(x) is False` |
| `assertIs(a, b)` | `a is b` |
| `assertIsNone(x)` | `x is None` |
| `assertIn(a, b)` | `a in b` |
| `assertNotIn(a, b)` | `a not in b` |
| `assertRaises(Exc, func, *args)` | `func(*args)` levanta `Exc` |
| `assertAlmostEqual(a, b)` | Floats dentro de tolerância (7 casas decimais) |
| `assertIsInstance(obj, cls)` | `isinstance(obj, cls)` |

```python
import unittest

class TestAssertions(unittest.TestCase):
    def test_assertions(self):
        self.assertAlmostEqual(0.1 + 0.2, 0.3)  # Floats!
        self.assertRaises(ValueError, int, "not_a_number")
        self.assertIn("key", {"key": 42})
        self.assertIsInstance(3.14, float)

    def test_assert_raises_context_manager(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

    def test_assert_raises_with_message(self):
        with self.assertRaisesRegex(ValueError, "invalid"):
            int("invalid")
```

## Fixtures de Teste — `setUp` e `tearDown`

```python
import unittest
import tempfile
from pathlib import Path

class TestFileProcessor(unittest.TestCase):
    def setUp(self):
        """Criar um diretório temporário e arquivo de teste antes de cada teste."""
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.test_file = Path(self.tmp_dir.name) / "test.txt"
        self.test_file.write_text("Hello, World!")

    def tearDown(self):
        """Limpar diretório temporário após cada teste."""
        self.tmp_dir.cleanup()

    def test_file_exists(self):
        self.assertTrue(self.test_file.exists())

    def test_file_content(self):
        content = self.test_file.read_text()
        self.assertEqual(content, "Hello, World!")

    def test_file_deletion(self):
        self.test_file.unlink()
        self.assertFalse(self.test_file.exists())
```

> [!NOTE]
| Método | Quando | Frequência |
|--------|--------|------------|
| `setUp` | Antes de cada método de teste | Por teste |
| `tearDown` | Após cada método de teste | Por teste |
| `setUpClass` | Antes de todos os testes na classe | Uma vez por classe |
| `tearDownClass` | Após todos os testes na classe | Uma vez por classe |

```python
class TestDatabase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("Setting up database connection...")
        cls.db = {"alice": 100, "bob": 200}  # BD simulado

    @classmethod
    def tearDownClass(cls):
        print("Closing database connection...")
        cls.db = None

    def test_get_balance(self):
        self.assertEqual(self.db["alice"], 100)

    def test_update_balance(self):
        self.db["alice"] = 150
        self.assertEqual(self.db["alice"], 150)
```

## Mocking com `unittest.mock`

Objetos Mock substituem dependências reais para isolar o código sob teste:

```python
from unittest.mock import Mock, patch
import unittest

class PaymentProcessor:
    def __init__(self, api_client):
        self.api = api_client

    def process_payment(self, user_id: str, amount: float) -> dict:
        user = self.api.get_user(user_id)
        if not user.get("active"):
            raise ValueError("User not active")
        result = self.api.charge(user_id, amount)
        self.api.send_receipt(user_id, result["transaction_id"])
        return result

class TestPaymentProcessor(unittest.TestCase):
    def test_process_payment_success(self):
        mock_api = Mock()
        mock_api.get_user.return_value = {"id": "42", "active": True}
        mock_api.charge.return_value = {"transaction_id": "txn_123", "status": "success"}

        processor = PaymentProcessor(mock_api)
        result = processor.process_payment("42", 50.0)

        self.assertEqual(result["status"], "success")
        mock_api.get_user.assert_called_once_with("42")
        mock_api.charge.assert_called_once_with("42", 50.0)
        mock_api.send_receipt.assert_called_once_with("42", "txn_123")
```

### Usando `patch` — substituindo objetos temporariamente

```python
from unittest.mock import patch
import unittest
import requests

def fetch_user(user_id: int) -> dict:
    response = requests.get(f"https://api.example.com/users/{user_id}")
    response.raise_for_status()
    return response.json()

class TestFetchUser(unittest.TestCase):
    @patch("requests.get")
    def test_fetch_user_success(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = {"id": 1, "name": "Alice"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = fetch_user(1)
        self.assertEqual(result["name"], "Alice")
        mock_get.assert_called_once_with("https://api.example.com/users/1")

    @patch("requests.get")
    def test_fetch_user_http_error(self, mock_get):
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("Not Found")
        mock_get.return_value = mock_response

        with self.assertRaises(requests.HTTPError):
            fetch_user(999)
```

> [!WARNING]
> Sempre aplique patch onde o objeto É PROCURADO, não onde É DEFINIDO. Use `@patch("module.function")`, não `@patch("library.module.function")`.

### Side Effects de Mock

```python
from unittest.mock import Mock

# Valores de retorno alternados
mock = Mock()
mock.side_effect = [1, 2, 3]
print(mock())  # 1
print(mock())  # 2
print(mock())  # 3

# Levantando exceções
mock.side_effect = ValueError("Bad value")
with self.assertRaises(ValueError):
    mock()

# Callable: computar retorno baseado em args
mock.side_effect = lambda x: x * 2
print(mock(5))  # 10
print(mock(10)) # 20
```

## Testando com `pytest`

```python
# test_math_pytest.py
def add(a: int, b: int) -> int:
    return a + b

def test_add_positive():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, 1) == 0

def test_add_floats():
    assert add(0.1, 0.2) == pytest.approx(0.3)
```

```bash
pytest                          # Descobrir e executar todos os testes
pytest -v                       # Saída verbosa
pytest -k "positive"            # Executar testes correspondentes à palavra-chave
pytest -x                       # Parar no primeiro erro
pytest --tb=short               # Tracebacks mais curtos
pytest test_math_pytest.py      # Executar arquivo específico
pytest --cov=src                # Com cobertura (pip install pytest-cov)
```

### Fixtures do pytest

```python
import pytest

@pytest.fixture
def sample_data():
    return {"name": "Alice", "age": 30}

@pytest.fixture
def db_connection():
    conn = create_database_connection(":memory:")
    yield conn
    conn.close()

def test_with_fixtures(sample_data, db_connection):
    assert sample_data["name"] == "Alice"
    result = db_connection.query("SELECT 1")
    assert result is not None
```

### Parametrização no pytest

```python
import pytest

@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
    (100, 200, 300),
])
def test_add(a: int, b: int, expected: int):
    assert add(a, b) == expected

# Parametrização de fixture
@pytest.fixture(params=["json", "xml", "yaml"])
def parser(request):
    if request.param == "json":
        return JSONParser()
    elif request.param == "xml":
        return XMLParser()

def test_parsing(parser):
    data = parser.parse("<root/>")
    assert data is not None
```

```mermaid
flowchart LR
    subgraph "Ciclo de Vida do Teste (pytest)"
        A[Coleta] --> B[Configuração da fixture]
        B --> C[Execução do teste]
        C --> D{Asserção}
        D -->|Passa| E[Limpeza da fixture]
        D -->|Falha| E
        E --> F[Próximo teste]
    end
```

## Mundo Real: Testando um Pipeline de Dados

```python
# pipeline.py
import csv
from pathlib import Path

def load_csv(path: Path) -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def filter_adults(people: list[dict]) -> list[dict]:
    return [p for p in people if int(p["age"]) >= 18]

def compute_average_age(people: list[dict]) -> float:
    if not people:
        raise ValueError("Cannot compute average of empty list")
    ages = [int(p["age"]) for p in people]
    return sum(ages) / len(ages)
```

```python
# test_pipeline.py
import pytest
from pathlib import Path
from pipeline import load_csv, filter_adults, compute_average_age

class TestLoadCSV:
    def test_load_csv_success(self, tmp_path: Path):
        test_file = tmp_path / "test.csv"
        test_file.write_text("name,age\nAlice,30\nBob,15\nCarol,25\n")
        result = load_csv(test_file)
        assert len(result) == 3
        assert result[0]["name"] == "Alice"

    def test_load_csv_empty(self, tmp_path: Path):
        test_file = tmp_path / "empty.csv"
        test_file.write_text("name,age\n")
        result = load_csv(test_file)
        assert result == []

class TestFilterAdults:
    def test_filters_minors(self):
        people = [
            {"name": "Alice", "age": "30"},
            {"name": "Bob", "age": "15"},
            {"name": "Carol", "age": "25"},
        ]
        result = filter_adults(people)
        assert len(result) == 2
        assert all(p["name"] != "Bob" for p in result)

class TestComputeAverageAge:
    def test_average(self):
        people = [{"name": "A", "age": "20"}, {"name": "B", "age": "30"}]
        assert compute_average_age(people) == 25.0

    def test_empty_raises(self):
        with pytest.raises(ValueError, match="Cannot compute"):
            compute_average_age([])
```

## Ciclo de Desenvolvimento Orientado a Testes (TDD)

```mermaid
flowchart LR
    A[Escrever teste que falha] --> B[Escrever código mínimo]
    B --> C{Teste passa?}
    C -->|Não| B
    C -->|Sim| D[Refatorar código]
    D --> E[Escrever próximo teste]
    E --> A
```

> [!SUCCESS]
| Princípio | Porquê |
|-----------|--------|
| Teste uma coisa por teste | Depuração simples, mensagens de falha claras |
| Use nomes de teste descritivos | `test_withdraw_reduces_balance` não `test_1` |
| Isole testes | Cada teste deve configurar e limpar seu próprio estado |
| Teste casos extremos | Entrada vazia, valores limite, condições de erro |
| Faça testes rápidos | Testes lentos não são executados com frequência |

## Perguntas de Prática

1. Qual é a diferença entre `setUp` / `tearDown` e `setUpClass` / `tearDownClass`?
2. Escreva um `unittest.TestCase` que testa uma função `is_palindrome(s: str) -> bool`.
3. O que `@patch` faz e onde você deve aplicá-lo em relação ao módulo sob teste?
4. Escreva uma fixture do pytest que cria um diretório temporário com arquivos de dados de teste.
5. Como você usa `@pytest.mark.parametrize` para testar uma função com múltiplas entradas?
6. Qual é o propósito de `Mock.side_effect`? Dê um exemplo com uma lista e um callable.
7. Escreva um teste para uma função que lê um arquivo e retorna seu conteúdo. Mock a operação de abertura de arquivo.
8. Quais métodos `unittest.mock.Mock` fornece para verificar como um mock foi chamado?
9. Como o `pytest` descobre arquivos e funções de teste? Quais convenções de nomenclatura ele segue?
10. Escreva uma suíte de testes completa (usando pytest) para uma classe `ShoppingCart` com métodos add, remove e total.
