// "use client"

// import React, { useEffect, useRef, useState } from "react"
// import mermaid from "mermaid"

// interface MermaidProps {
//   chart: string
// }

// export default function Mermaid({ chart }: MermaidProps) {
//   const containerRef = useRef<HTMLDivElement>(null)
//   const [zoom, setZoom] = useState(1)

//   useEffect(() => {
//     mermaid.initialize({ startOnLoad: false })
//     if (containerRef.current) {
//       containerRef.current.innerHTML = chart
//       mermaid.init(undefined, containerRef.current)
//     }
//   }, [chart])

//   // 🔍 Zoom with Ctrl + mouse wheel
//   const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
//     if (e.ctrlKey) {
//       e.preventDefault()
//       const delta = e.deltaY > 0 ? -0.1 : 0.1
//       setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2))
//     }
//   }

//   return (
//     <div className="mermaid-outer-container" onWheel={handleWheel}>
//       <div
//         className="mermaid-container"
//         ref={containerRef}
//         style={{
//           transform: `scale(${zoom})`,
//           transformOrigin: "center top",
//         }}
//       />
//       <div className="zoom-controls">
//         <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>＋</button>
//         <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>－</button>
//         <button onClick={() => setZoom(1)}>⟲</button>
//       </div>
//     </div>
//   )
// }

// export function ZoomableMermaid({ code }: { code: string }) {
//   const [zoom, setZoom] = useState(1)
//   const outerRef = useRef<HTMLDivElement>(null)

//   // Allow Ctrl + MouseWheel zoom
//   const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
//     if (e.ctrlKey) {
//       e.preventDefault()
//       const delta = e.deltaY > 0 ? -0.1 : 0.1
//       setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2))
//     }
//   }

//   return (
//     <div
//       ref={outerRef}
//       onWheel={handleWheel}
//       className="mermaid-outer-container"
//       style={{
//         transform: `scale(${zoom})`,
//         transformOrigin: "center top",
//       }}
//     >
//       <MermaidDiagram code={code} />
//       <div className="zoom-controls">
//         <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>＋</button>
//         <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>－</button>
//         <button onClick={() => setZoom(1)}>⟲</button>
//       </div>
//     </div>
//   )
// }
// /