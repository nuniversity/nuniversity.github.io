# Mermaid.js GitGraph Reference

## Basic Operations
```
gitGraph
    commit
    commit
    branch develop
    commit
    checkout main
    merge develop
```

## Commit Attributes
```
commit id: "abc123"
commit type: HIGHLIGHT
commit tag: "v1.0.0"
```

## Commit Types
- `NORMAL` — Default (solid circle)
- `REVERSE` — Reversed (crossed circle)
- `HIGHLIGHT` — Highlighted (filled rectangle)

## Branch Operations
```
branch feature
branch feature order: 1
checkout main
```

## Merge with Attributes
```
merge develop id: "my_id" tag: "v1.0" type: REVERSE
```

## Cherry-Pick
```
cherry-pick id: "abc123"
```

## Orientation (v10.3.0+)
```
gitGraph TB    — Top to bottom
gitGraph BT    — Bottom to top
gitGraph LR    — Left to right (default)
```

## Configuration
```yaml
---
config:
  gitGraph:
    showBranches: true
    showCommitLabel: true
    mainBranchName: main
    parallelCommits: false
---
```

## Theme Variables
- `git0` to `git7` — Branch colors
- `gitBranchLabel0` to `gitBranchLabel7` — Label colors
- `commitLabelColor` — Commit label text color
- `commitLabelBackground` — Commit label background
- `commitLabelFontSize` — Commit label size
- `tagLabelColor` — Tag text color
- `tagLabelBackground` — Tag background
- `tagLabelBorder` — Tag border
