# Mermaid.js State Diagram Reference

## States
```
[*] --> Idle          — Initial state
Idle --> Active       — Transition
Active --> [*]        — Final state
```

## State Descriptions
```
state "In Progress" as IP
state Done : Completed
```

## Composite States
```
state Active {
    [*] --> Running
    Running --> Paused
    Paused --> Running
}
```

## Choice
```
state Check {
    [*] --> Choosing
    Choosing <<choice>>
    Choosing --> A : valid
    Choosing --> B : invalid
}
```

## Forks
```
state Forking {
    [*] --> Fork
    Fork <<fork>>
    Fork --> A
    Fork --> B
    A --> Join
    B --> Join
    Join <<join>>
    Join --> [*]
}
```

## Concurrency
```
state Active {
    [*] --> Running
    --
    [*] --> Monitoring
}
```

## Notes
```
note right of Active: Important state
note left of Idle: Waiting
```

## Direction
```
stateDiagram-v2
    direction LR
```

## Styling
```
classDef active fill:#f00,color:white
class Active active
state Active:::active
```

## Spaces in State Names
```
state yswsii : Your state with spaces
[*] --> yswsii
yswsii --> YetAnotherState
```
