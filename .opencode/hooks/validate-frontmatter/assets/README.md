# validate-frontmatter

## Purpose
Validates that Markdown lesson files have correct YAML frontmatter with all required fields.

## When It Runs
On every file write to `content/courses/**/*.md`.

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCODE_FILE_PATH` | Yes | Path to the Markdown file being validated |

## Exit Codes
| Code | Meaning |
|------|---------|
| `0` | Validation passed |
| `2` | Blocking error (missing fields, invalid values) |

## Required Frontmatter Fields
- `title` - Non-empty string
- `description` - Non-empty string
- `order` - Positive integer
- `duration` - Format: "N min", "N minutes", "N hour", or "N hours"
- `difficulty` - One of: beginner, intermediate, advanced

## Additional Checks
- H1 heading must match the `title` field
