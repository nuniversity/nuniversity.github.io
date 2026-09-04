# Mermaid.js Sequence Diagram Reference

## Participants
```
participant A as "API Gateway"
actor User
boundary Gateway
control Controller
entity Entity
database DB
queue Queue
```

## Actor Stereotypes (v10.3.0+)
```
participant "Gateway" as GW <<boundary>>
actor "User" as U <<person>>
```

## Message Types
```
A->>B: Message        — Solid arrow (sync)
A-->>B: Response      — Dashed arrow (response)
A-xB: Failed          — Solid cross (failed)
A--xB: Timeout        — Dashed cross (timeout)
A->B: Request         — Solid open arrow
A-)B: Async           — Solid open (async)
A--)B: Async dashed   — Dashed open
A<<->>B: Bidirectional (v11.0.0+)
A-|\B: Half-arrow top (v11.12.3+)
A-|/B: Half-arrow bottom (v11.12.3+)
```

## Activations
```
A->>+B: Request
B-->>-A: Response
```

## Notes
```
note left of A: Important note
note right of B: Warning
note over A,B: Spans participants
```

## Loops, Alt, Parallel, Critical
```
loop Every minute
    A->>B: Heartbeat
end

alt Success
    B-->>A: OK
else Failure
    B-->>A: Error
end

opt Optional step
    A->>B: Try
end

par Action 1
    A->>B: Do X
and Action 2
    A->>C: Do Y
end

critical Must happen
    A->>B: Execute
option Failure
    A->>C: Rollback
end
```

## Break (Exception)
```
break [Error occurred]
    A->>B: Failed
end
```

## Background Highlighting
```
rect rgb(0, 255, 0)
    A->>B: Green zone
end
```

## Grouping/Box
```
box Aqua Group Description
    A
    B
end
```

## Actor Creation/Destruction (v10.3.0+)
```
create participant B
A --> B: Hello
destroy B
```

## Central Connections (v11.12.3+)
```
A -->() B
```

## Autonumber (v11.15.0+)
```
autonumber 10 5
```
