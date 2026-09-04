# Mermaid.js Mindmap Reference

## Shapes
```
mindmap
  root((Root))
    Square[Square]
    Rounded(Rounded)
    Circle((Circle))
    Bang Bang
    Cloud[Cloud]
    Hexagon{{Hexagon}}
    Default[Default]
```

## Icons
```
mindmap
  root((App))
    Backend::icon(fa:server)
    Frontend::icon(fa:desktop)
```

## Classes
```
mindmap
  root((App))
    Critical::urgent
    Normal::default
```

## Markdown Strings
```
mindmap
  root((Project))
    A["`**Bold** text`"]
    B["`*Italic* text`"]
```

## Indentation
- Use indentation to define hierarchy
- One node at root level
- Children indented further
- Same column = same parent

## Layouts
```yaml
---
config:
  layout: tidy-tree
---
```
