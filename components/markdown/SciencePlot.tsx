'use client'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

interface SciencePlotProps {
  type: 'line' | 'bar' | 'scatter' | 'pie'
  title?: string
  xLabel?: string
  yLabel?: string
  data: Array<Record<string, any>>
  dataKeys?: string[]
  colors?: string[]
  height?: number
  xKey?: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function SciencePlot({
  type,
  title,
  xLabel,
  yLabel,
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  height = 350,
  xKey,
}: SciencePlotProps) {
  const [PlotComponents, setPlotComponents] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const recharts = await import('recharts')
      if (mounted) setPlotComponents(recharts)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!PlotComponents) {
    return (
      <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{title || `${type} chart`}</span>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    ScatterChart, Scatter,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } = PlotComponents

  const resolvedXKey = xKey || (data.length > 0 ? Object.keys(data[0])[0] : 'x')
  const numericKeys = dataKeys || (data.length > 0
    ? Object.keys(data[0]).filter(k => k !== resolvedXKey && typeof data[0][k] === 'number')
    : [])

  const tickProps = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
  const axisProps = { tick: tickProps, label: undefined }

  const renderChart = () => {
    if (type === 'pie') {
      const pieKey = numericKeys[0] || 'value'
      const nameKey = resolvedXKey
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={pieKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={Math.min(height * 0.4, 150)}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            animationDuration={800}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      )
    }

    if (type === 'scatter') {
      const xVals = data.map(d => d[resolvedXKey])
      const yVals = data.map(d => d[numericKeys[0]]).filter(v => v !== undefined)
      const xMin = Math.min(...xVals)
      const xMax = Math.max(...xVals)
      const yMin = Math.min(...yVals)
      const yMax = Math.max(...yVals)
      const xPadding = (xMax - xMin) * 0.05 || 1
      const yPadding = (yMax - yMin) * 0.05 || 1

      return (
        <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey={resolvedXKey}
            domain={[xMin - xPadding, xMax + xPadding]}
            name={xLabel || resolvedXKey}
            tick={tickProps}
            label={xLabel ? { value: xLabel, position: 'bottom', offset: 0, style: tickProps } : undefined}
          />
          <YAxis
            type="number"
            dataKey={numericKeys[0]}
            domain={[yMin - yPadding, yMax + yPadding]}
            name={yLabel || numericKeys[0]}
            tick={tickProps}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: tickProps } : undefined}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))' }} />
          <Scatter data={data} fill={colors[0]} animationDuration={800} />
        </ScatterChart>
      )
    }

    const Chart = type === 'bar' ? BarChart : LineChart
    const DataComp = type === 'bar' ? Bar : Line

    return (
      <Chart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={resolvedXKey}
          tick={tickProps}
          label={xLabel ? { value: xLabel, position: 'bottom', offset: 0, style: tickProps } : undefined}
        />
        <YAxis
          tick={tickProps}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: tickProps } : undefined}
        />
        <Tooltip content={<CustomTooltip />} />
        {numericKeys.length > 1 && <Legend />}
        {numericKeys.map((key, i) => (
          <DataComp
            key={key}
            type={type === 'line' ? 'monotone' : undefined}
            dataKey={key}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            strokeWidth={type === 'line' ? 2 : undefined}
            dot={type === 'line' ? { r: 3 } : undefined}
            activeDot={type === 'line' ? { r: 5 } : undefined}
            radius={type === 'bar' ? [4, 4, 0, 0] : undefined}
            animationDuration={800}
          />
        ))}
      </Chart>
    )
  }

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm overflow-hidden">
      {(title || type) && (
        <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {title || `${type} chart`}
          </span>
        </div>
      )}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
