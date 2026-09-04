# Mermaid.js ER Diagram Reference

## Entities and Relationships
```
USER ||--o{ ORDER : places
ORDER ||--|{ PRODUCT : contains
```

## Cardinality Markers
```
||--||  — One to one
||--o{  — One to zero/many
||--|{  — One to one/many
}o--o{  — Many to many
```

## Identification
```
--  — Identifying (solid line)
..  — Non-identifying (dashed line)
```

## Entity Attributes
```
USER {
    int id PK
    string name
    string email UK
    date created "Account creation date"
}
```

## Attribute Keys
- `PK` — Primary Key
- `FK` — Foreign Key
- `UK` — Unique Key
- `PK, FK` — Multiple constraints

## Optional Types (v11.16.0+)
```
USER {
    string? nickname
    int age
}
```

## Aliases
```
USER["Customer Table"] ||--o{ ORDER
```

## Subgraphs (v11.17.0+)
```
subgraph Customer Domain
    USER ||--o{ ORDER
end
```

## Direction
```
erDiagram
    direction TB
```

## Styling
```
classDef entity fill:#e3f2fd,stroke:#1976d2
class USER entity
USER:::entity
```

## Comments
```
%% This is a comment
```
