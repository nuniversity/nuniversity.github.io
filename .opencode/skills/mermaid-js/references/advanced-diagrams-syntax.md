# Mermaid.js Advanced Diagrams Reference

## Quadrant Chart
```
quadrantChart
    title Reach and engagement
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
```

## Requirement Diagram
```
requirementDiagram
    requirement test_req {
        id: 1
        text: the test text
        risk: high
        verifymethod: test
    }
    element test_entity {
        type: simulation
    }
    test_entity - satisfies -> test_req
```

## Sankey Diagram (v11.1.0+)
```
sankey-beta
    Shipments,Stock,25
    Stock,Imports,5
    Stock,Exports,10
```

## XY Chart (v11.3.0+)
```
xychart-beta
    title "Sales Revenue"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500]
    line [5000, 6000, 7500, 8200, 9500]
```

## Block Diagram (v11.1.0+)
```
block-beta
    columns 3
    a["A"]:2 b
    block:c
        d e
    end
    f
```

## Packet Diagram (v11.1.0+)
```
packet-beta
    0-15: "Source Port"
    16-31: "Destination Port"
    32-63: "Sequence Number"
```

## Kanban (v11.3.0+)
```
kanban
    column1[Todo]
        task1[Design]
        task2[Prototype]
    column2[In Progress]
        task3[Coding]
    column3[Done]
```

## Radar Chart (v11.5.0+)
```
radar-beta
    title Performance
    axis Speed, "Battery Life", Price, "Camera Quality"
    "Phone A": [8, 7, 5, 9]
    "Phone B": [6, 9, 8, 7]
```

## Event Modeling (v11.3.0+)
```
eventModeling
    command PlaceOrder
    event OrderPlaced
    view OrderSummary
    command PlaceOrder --> event OrderPlaced
    event OrderPlaced --> view OrderSummary
```

## Treemap (v11.6.0+)
```
treemap-beta
    root
        "A": 10
        "B": 20
        "C":
            "D": 5
            "E": 15
```

## Venn Diagram (v11.6.0+)
```
venn-beta
    A: 10
    B: 15
    C: 8
    A&B: 5
    A&C: 3
    B&C: 4
    A&B&C: 2
```

## Ishikawa Diagram (v11.6.0+)
```
ishikawa-beta
    cause1[Root Cause 1]
    cause2[Root Cause 2]
    cause3[Root Cause 3]
    effect[Problem]
    cause1 --> effect
    cause2 --> effect
    cause3 --> effect
```

## Wardley Map (v11.3.0+)
```
wardley-beta
    visibility [0.1, 0.9]
    evolution [0.1, 0.9]
    component Genesis [0.2, 0.9]
    component Custom [0.4, 0.7]
    component Product [0.6, 0.5]
    component Commodity [0.8, 0.3]
    Genesis --> Custom
    Custom --> Product
    Product --> Commodity
```

## Cynefin Framework (v11.6.0+)
```
cynefin-beta
    complex[Complex]
    complicated[Complicated]
    clear[Clear]
    chaotic[Chaotic]
    disorder[Disorder]
    complex --> clear
    complicated --> clear
```

## TreeView (v11.6.0+)
```
treeView-beta
    root[Root]
        child1[Child 1]
            grandchild1[Grandchild 1]
            grandchild2[Grandchild 2]
        child2[Child 2]
```

## ZenUML
```
zenuml
    title My Sequence
    Client -> Server: Request
    Server -> Database: Query
    Database --> Server: Results
    Server --> Client: Response
```

## Timeline
```
timeline
    title Project History
    2024 : Planning
         : Design
    2025 : Development
```

## Timeline with Sections
```
timeline
    section Phase 1
        2024 Q1 : Research
        2024 Q2 : Design
    section Phase 2
        2024 Q3 : Development
```

## Timeline Direction (v11.14.0+)
```
timeline TD
    2024 : Event 1
```
- `LR` — Left to right (default)
- `TD` — Top to down
