# Mermaid.js Class Diagram Reference

## Relationships
```
A <|-- B        — Inheritance
A *-- B         — Composition
A o-- B         — Aggregation
A --> B         — Association
A ..> B         — Dependency
A <|.. B        — Implementation
A -- B          — Link (Solid)
A .. B          — Link (Dashed)
```

## Members
```
+public
-protected
#private
~package
```

## Classifiers
```
someAbstractMethod()*      — Abstract
someStaticMethod()$        — Static
String someField$          — Static field
```

## Labels
```
class Animal["`**Wild** Animal`"]
```

## Generics
```
class Grid~K,V~
class List~T~
```

## Cardinality
```
[classA] "1" --> "0..*" [ClassB]
```

## Lollipop Interfaces
```
bar ()-- foo
foo --() bar
```

## Namespaces (v11.15.0+)
```
namespace MyNamespace {
    class Foo
}
namespace A.B.C {
    class Bar
}
```

## Annotations
```
<<Interface>>
<<Abstract>>
<<Service>>
<<Enumeration>>
```

## Notes
```
note "line1\nline2"
note for ClassName "Important note"
```

## Direction
```
classDiagram
    direction LR
```

## Two-Way Relations
```
[Relation Type][Link][Relation Type]
```
Where Relation Type: `<|`, `*`, `o`, `>`, `<`, `|>`
Link: `--` (solid), `..` (dashed)
