"""Contract tests for check_e2e_hygiene.py (written before the script)."""

import json


def test_clean_spec_passes(run_hygiene, write_e2e_file):
    write_e2e_file(
        "journeys/clean.spec.ts",
        """
        import { test, expect } from '../support/fixtures'

        test('journey', async ({ page }) => {
          await page.goto('/en/')
          await expect(page.getByRole('heading', { name: 'Nuniversity' })).toBeVisible()
        })
        """,
    )

    result = run_hygiene()

    assert result.returncode == 0, result.stdout + result.stderr


def test_fixed_sleeps_and_networkidle_are_blocking(run_hygiene, write_e2e_file):
    write_e2e_file(
        "integration/sleep.spec.ts",
        """
        test('sleeps', async ({ page }) => {
          await page.waitForTimeout(500)
          await page.waitForLoadState('networkidle')
        })
        """,
    )

    result = run_hygiene()

    assert result.returncode == 2
    output = result.stdout + result.stderr
    assert "waitForTimeout" in output
    assert "networkidle" in output


def test_fixture_import_and_legacy_locators_are_blocking(run_hygiene, write_e2e_file):
    write_e2e_file(
        "journeys/legacy.spec.ts",
        """
        import { test, expect } from '@playwright/test'
        test('legacy', async ({ page }) => {
          await page.click('.button')
          await page.locator('//button').click()
        })
        """,
    )

    result = run_hygiene()

    assert result.returncode == 2
    output = result.stdout + result.stderr
    assert "fixtures.ts" in output
    assert "legacy-page-api" in output
    assert "xpath" in output


def test_skip_focus_pause_and_debug_are_blocking(run_hygiene, write_e2e_file):
    write_e2e_file(
        "journeys/debug.spec.ts",
        """
        test.only('focused', async ({ page }) => { await page.pause() })
        console.log('debug')
        """,
    )

    result = run_hygiene()

    assert result.returncode == 2
    output = result.stdout + result.stderr
    assert "skip-only" in output
    assert "page.pause" in output
    assert "console-log" in output


def test_support_files_may_be_allowlisted_for_guarded_logging(run_hygiene, write_e2e_file):
    write_e2e_file(
        "support/quiz-player.ts",
        "if (process.env.QUIZ_DEBUG) console.log('guarded')\n",
    )

    allowlist = {
        "allow": [
            {
                "rule": "console-log",
                "path": "tests/e2e/support/quiz-player.ts",
                "reason": "debug trace guarded by QUIZ_DEBUG",
            }
        ]
    }
    result = run_hygiene(allowlist)

    assert result.returncode == 0, result.stdout + result.stderr


def test_json_report_shape(run_hygiene, write_e2e_file):
    write_e2e_file("journeys/bad.spec.ts", "await page.waitForTimeout(1)\n")

    result = run_hygiene()
    payload = json.loads(result.stdout.split("---JSON---", 1)[1])

    assert payload["count"] == 1
    assert payload["violations"][0]["rule"] == "wait-timeout"
    assert payload["violations"][0]["path"] == "tests/e2e/journeys/bad.spec.ts"


def test_missing_e2e_directory_is_clean(run_hygiene):
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


def test_unreadable_spec_is_skipped(tmp_path, run_hygiene):
    path = tmp_path / "tests" / "e2e" / "broken.ts"
    path.parent.mkdir(parents=True)
    path.write_bytes(b"\xff\xfe")
    result = run_hygiene()
    assert result.returncode == 0
    assert "WARNING: cannot read" in result.stderr
