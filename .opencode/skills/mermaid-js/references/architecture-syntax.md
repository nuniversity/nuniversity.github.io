# Mermaid.js Architecture Diagram Reference (v11.1.0+)

## Groups
```
group public_api(cloud)[Public API]
group private_api(cloud)[Private API] in public_api
```

## Services
```
service database1(database)[My Database]
service server1(server)[Server] in private_api
```

## Edges
```
db:R --> L:server       — Right to left
db:B --> T:server       — Bottom to top
server{group}:B --> T:db{group}  — Group edge
```

## Junctions
```
junction j1
```

## Edge Direction
- `L` — Left
- `R` — Right
- `T` — Top
- `B` — Bottom

## Edge Arrows
- `<` before direction — Arrow on left
- `>` after direction — Arrow on right

## Align (v11.16.0+)
```
align row db1 db2 db3
align column srv1 srv2
```

## Icons (Default)
- `cloud`
- `database`
- `disk`
- `internet`
- `server`

## Configuration
```yaml
---
config:
  architecture:
    randomize: false
    idealEdgeLengthMultiplier: 1.5
    nodeSeparation: 75
    edgeElasticity: 0.45
    numIter: 2500
    seed: 1
---
```

## Custom Icons
Register icon packs then use:
```
service api(icon-pack:icon-name)[API]
```
