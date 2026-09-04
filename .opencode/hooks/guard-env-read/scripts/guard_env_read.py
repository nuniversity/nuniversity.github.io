#!/usr/bin/env python3
"""Block reads of .env files and other sensitive credentials.

Deterministic hook: exit 0 = allow, exit 2 = block.

Environment Variables:
    OPENCODE_FILE_PATH: Direct file path to check
    OPENCODE_TOOL_INPUT_PATH: Path to JSON file with tool input args

Blocked Patterns:
    - .env, .env.local, .env.production, .env.development, .env.staging
    - .key, .pem, .secret, .p12, .pfx
    - credentials.json, service-account*.json

Exit Codes:
    0 - Access allowed
    2 - Access blocked (sensitive file)
"""
import json
import os
import re
import sys
from pathlib import Path


BLOCKED_PATTERNS = [
    r"\.env$",
    r"\.env\.local$",
    r"\.env\.production$",
    r"\.env\.development$",
    r"\.env\.staging$",
    r"\.env\.[a-zA-Z0-9_]+$",
    r"\.key$",
    r"\.pem$",
    r"\.secret$",
    r"\.p12$",
    r"\.pfx$",
    r"credentials\.json$",
    r"service-account.*\.json$",
]


def is_blocked(filepath: str) -> bool:
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, filepath):
            return True
    return False


def check_path(filepath: str) -> int:
    if not filepath:
        return 0

    if not os.path.isabs(filepath):
        filepath = os.path.join(os.getcwd(), filepath)

    if is_blocked(filepath):
        print(f"BLOCKED: Access to sensitive file '{filepath}' is not allowed", file=sys.stderr)
        return 2

    return 0


def main() -> int:
    tool_input_path = os.environ.get("OPENCODE_TOOL_INPUT_PATH", "")
    if tool_input_path and os.path.isfile(tool_input_path):
        try:
            with open(tool_input_path, "r") as f:
                data = json.load(f)

            for key in ("filePath", "file_path", "path", "filename"):
                if key in data:
                    result = check_path(data[key])
                    if result != 0:
                        return result

            if "command" in data:
                for match in re.finditer(r'[^\s"\'<>|]+', data["command"]):
                    result = check_path(match.group())
                    if result != 0:
                        return result
        except (json.JSONDecodeError, OSError):
            pass

    direct_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if direct_path:
        result = check_path(direct_path)
        if result != 0:
            return result

    return 0


if __name__ == "__main__":
    sys.exit(main())
