"""Contract tests for check_unit_hygiene.py (written before the script)."""


def test_clean_tree_passes(run_hygiene, write_test_file):
    write_test_file(
        "components/clean.test.tsx",
        """
        import { describe, expect, it } from 'vitest'
        describe('clean', () => {
          it('does the thing', () => {
            expect(1 + 1).toBe(2)
          })
        })
        """,
    )

    result = run_hygiene()

    assert result.returncode == 0, result.stdout + result.stderr


def test_skip_only_console_and_nondeterminism_are_blocking(run_hygiene, write_test_file):
    write_test_file(
        "components/dirty.test.tsx",
        """
        import { describe, expect, it, vi } from 'vitest'
        it.only('focused', () => {})
        describe.skip('whole suite', () => {})
        it.todo('later')
        console.log('debug')
        expect(Date.now()).toBeGreaterThan(0)
        expect(Math.random()).toBeLessThan(1)
        expect(new Date().toISOString()).toBeTruthy()
        """,
    )

    result = run_hygiene()

    assert result.returncode == 2
    output = result.stdout + result.stderr
    for expected in ("skip/nested focus", "console.log", "Date.now", "Math.random", "new Date()"):
        assert expected in output


def test_ts_ignore_and_screen_debug_are_blocking(run_hygiene, write_test_file):
    write_test_file(
        "utils/dirty.test.ts",
        """
        // @ts-ignore deliberate
        screen.debug()
        """,
    )

    result = run_hygiene()

    assert result.returncode == 2
    assert "@ts-ignore" in result.stdout + result.stderr
    assert "screen.debug" in result.stdout + result.stderr


def test_e2e_directory_is_out_of_scope(run_hygiene, write_test_file):
    write_test_file("e2e/journey.spec.ts", "test.only('x', async () => {})\n")

    result = run_hygiene()

    assert result.returncode == 0, result.stdout + result.stderr


def test_allowlist_can_waive_a_rule(run_hygiene, write_test_file):
    write_test_file("legacy/legacy.test.ts", "console.log('kept for a reason')\n")

    allowlist = {
        "allow": [
            {
                "rule": "console-log",
                "path": "tests/legacy/legacy.test.ts",
                "reason": "legacy diagnostic retained while migrating",
            }
        ]
    }
    result = run_hygiene(allowlist)

    assert result.returncode == 0, result.stdout + result.stderr


def test_json_report_shape(run_hygiene, write_test_file):
    write_test_file("bad/bad.test.ts", "it.skip('x', () => {})\nconsole.log('x')\n")

    result = run_hygiene()

    up = result.stdout.split("---JSON---", 1)
    assert len(up) == 2
    import json

    payload = json.loads(up[1])
    assert payload["count"] == 2
    assert {violation["rule"] for violation in payload["violations"]} == {
        "skip-only",
        "console-log",
    }
    assert all("path" in v and "line" in v and "reason" in v for v in payload["violations"])


def test_missing_tests_directory_is_clean(run_hygiene):
    result = run_hygiene()
    assert result.returncode == 0
    assert "scanned 0 file(s)" in result.stdout


def test_invalid_allowlist_is_reported_without_crashing(run_hygiene):
    result = run_hygiene(raw_allowlist="{not json")
    assert result.returncode == 0
    assert "ERROR: cannot read allowlist" in result.stderr


def test_incomplete_allowlist_entry_is_warned(run_hygiene):
    result = run_hygiene({"allow": [{"rule": "console-log"}]})
    assert result.returncode == 0
    assert "WARNING: ignored incomplete allowlist entry" in result.stderr


def test_unreadable_test_file_is_skipped(tmp_path, run_hygiene):
    (tmp_path / "tests" / "broken.ts").mkdir(parents=True)
    result = run_hygiene()
    assert result.returncode == 0
    assert "WARNING: cannot read" in result.stderr
