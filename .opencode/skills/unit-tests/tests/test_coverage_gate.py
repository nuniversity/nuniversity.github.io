"""Contract tests for coverage_gate.py (written before the script)."""


def metric(lines: float, statements: float, functions: float, branches: float) -> dict:
    def block(pct: float) -> dict:
        return {"pct": pct, "covered": int(pct), "total": 100}

    return {
        "lines": block(lines),
        "statements": block(statements),
        "functions": block(functions),
        "branches": block(branches),
    }


FLOOR = {"lines": 54, "statements": 54, "functions": 70, "branches": 72}


def test_passes_when_every_metric_is_at_or_above_floor(run_coverage_gate):
    result = run_coverage_gate({"total": metric(55.6, 55.6, 71.4, 73.2)}, FLOOR)

    assert result.returncode == 0, result.stdout + result.stderr
    assert "coverage gate" in result.stdout
    assert "ratchet" in result.stdout


def test_fails_when_any_metric_is_below_floor(run_coverage_gate):
    result = run_coverage_gate({"total": metric(53.0, 55.6, 69.0, 74.0)}, FLOOR)

    assert result.returncode == 2
    output = result.stdout + result.stderr
    assert "lines" in output and "53.0" in output and "54" in output
    assert "functions" in output and "69.0" in output and "70" in output


def test_missing_summary_is_blocking(run_coverage_gate):
    result = run_coverage_gate(None, FLOOR)

    assert result.returncode == 2
    assert "npm run test:coverage" in result.stdout + result.stderr


def test_malformed_summary_is_blocking(run_coverage_gate):
    result = run_coverage_gate({"total": {"lines": "not-a-number"}}, FLOOR)

    assert result.returncode == 2


def test_missing_floor_key_is_blocking(run_coverage_gate):
    result = run_coverage_gate(
        {"total": metric(60, 60, 80, 80)},
        {"lines": 54, "statements": 54, "functions": 70},
    )

    assert result.returncode == 2
    assert "branches" in result.stdout + result.stderr


def test_json_report_shape(run_coverage_gate):
    result = run_coverage_gate({"total": metric(55.6, 55.6, 71.4, 73.2)}, FLOOR)

    assert result.returncode == 0
    payload = __import__("json").loads(result.stdout.split("---JSON---", 1)[1])
    assert payload["ok"] is True
    assert payload["metrics"]["lines"]["actual"] == 55.6
    assert payload["metrics"]["lines"]["floor"] == 54


def test_summary_must_be_an_object(run_coverage_gate):
    result = run_coverage_gate(None, FLOOR, raw_summary='"not-an-object"')
    assert result.returncode == 2
    assert "must be a JSON object" in result.stderr


def test_malformed_floor_json_is_blocking(run_coverage_gate):
    result = run_coverage_gate({"total": metric(60, 60, 80, 80)}, FLOOR, raw_floor="{bad")
    assert result.returncode == 2
    assert "cannot read coverage floor" in result.stderr


def test_summary_without_total_is_blocking(run_coverage_gate):
    result = run_coverage_gate({"files": {}}, FLOOR)
    assert result.returncode == 2
    assert "no `total` object" in result.stderr
