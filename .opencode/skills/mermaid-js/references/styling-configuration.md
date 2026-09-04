# Mermaid.js Styling and Configuration Reference

## Themes
- `default` — Default theme
- `forest` — Green tones
- `dark` — Dark background
- `neutral` — Grayscale
- `base` — Minimal

## Directives
```
%%{init: {'theme': 'dark'}}%%
%%{init: {'themeVariables': {'primaryColor': '#ff0000'}}}%%
```

## Theme Variables (Flowchart)
- `primaryColor` — Primary node fill
- `primaryTextColor` — Primary node text
- `primaryBorderColor` — Primary node border
- `lineColor` — Edge color
- `secondaryColor` — Secondary node fill
- `tertiaryColor` — Tertiary node fill

## Theme Variables (GitGraph)
- `git0` to `git7` — Branch colors
- `gitBranchLabel0` to `gitBranchLabel7` — Label colors
- `commitLabelColor` — Commit label text
- `commitLabelBackground` — Commit label bg
- `commitLabelFontSize` — Commit label size
- `tagLabelColor` — Tag text
- `tagLabelBackground` — Tag bg
- `tagLabelBorder` — Tag border

## Theme Variables (Timeline)
- `cScale0` to `cScale11` — Section colors
- `cScaleLabel0` to `cScaleLabel11` — Label colors

## classDef Syntax
```
classDef className fill:#f9f,stroke:#333,stroke-width:4px
classDef first,second font-size:12pt
```

## Applying Classes
```
class nodeId className
class nodeId1,nodeId2 className
nodeId:::className
```

## Default Class
```
classDef default fill:#f9f,stroke:#333,stroke-width:4px
```

## CSS Classes
```html
<style>
  .styleClass > * > g {
    fill: #ff0000;
    stroke: #ffff00;
    stroke-width: 4px;
  }
</style>
```

## Layout Algorithms
- `dagre` — Default layout
- `elk` — Advanced layout (requires configuration)

## ELK Configuration
```yaml
---
config:
  layout: elk
  elk:
    mergeEdges: true
    nodePlacementStrategy: LINEAR_SEGMENTS
    nodePlacementAlignment: NONE
---
```

## Node Placement Strategies
- `SIMPLE`
- `NETWORK_SIMPLEX`
- `LINEAR_SEGMENTS`
- `BRANDES_KOEPF` (default)

## Node Placement Alignment
- `NONE` (default)
- `LEFTUP`, `LEFTDOWN`
- `RIGHTUP`, `RIGHTDOWN`
- `BALANCED`

## Configuration via initialize()
```javascript
mermaid.initialize({
  theme: 'dark',
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 75,
    rightPadding: 75,
    leftPadding: 75,
    fontSize: 12,
    sectionFontSize: 24,
    numberSectionStyles: 1,
    axisFormat: '%d/%m',
    tickInterval: '1week',
    topAxis: true,
    displayMode: 'compact',
    weekday: 'sunday',
  },
});
```

## Security Levels
- `strict` — Interaction disabled
- `loose` — Interaction enabled
