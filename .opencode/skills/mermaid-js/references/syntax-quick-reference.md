# Mermaid.js Syntax Quick Reference

## Diagram Types

| Type | Keyword | Use Case |
|------|---------|----------|
| Flowchart | `flowchart TD/LR` | Process flows, decision trees |
| Sequence | `sequenceDiagram` | API interactions, message flows |
| Class | `classDiagram` | OOP relationships, UML |
| State | `stateDiagram-v2` | Lifecycle, state machines |
| ER | `erDiagram` | Database schema |
| Gantt | `gantt` | Project timelines |
| Pie | `pie` | Proportional data |
| Mindmap | `mindmap` | Brainstorming |
| Timeline | `timeline` | Chronological events |
| GitGraph | `gitGraph` | Version control |
| Architecture | `architecture-beta` | Cloud/CI/CD |
| User Journey | `journey` | UX touchpoints |
| Quadrant | `quadrantChart` | Priority matrix |
| Requirement | `requirementDiagram` | Requirements traceability |
| Sankey | `sankey-beta` | Flow transfers |
| XY Chart | `xychart-beta` | Bar/line charts |
| Block | `block-beta` | Block layouts |
| Packet | `packet-beta` | Network packets |
| Kanban | `kanban-beta` | Task boards |
| Radar | `radar-beta` | Multi-axis comparison |
| Event Modeling | `eventModeling` | Event-sourced workflows |
| Treemap | `treemap-beta` | Hierarchical data |
| Venn | `venn-beta` | Set relationships |
| Ishikawa | `ishikawa-beta` | Root cause analysis |
| Wardley | `wardley-beta` | Strategy mapping |
| Cynefin | `cynefin-beta` | Decision framework |
| TreeView | `treeView-beta` | Tree display |
| ZenUML | `zenuml` | Sequence diagrams |

## Diagram Breakers

| Issue | Solution |
|-------|----------|
| `%%{}%%` in comments | Avoid `{}` in comments |
| "end" in flowcharts | Wrap in quotes or capitalize |
| "o"/"x" as first letter | Add space: `A---o B` |

## Comments
```
%% This is a comment
```

## Frontmatter
```yaml
---
config:
  layout: elk
  look: handDrawn
  theme: forest
---
```

## Themes
- `default`, `forest`, `dark`, `neutral`, `base`
