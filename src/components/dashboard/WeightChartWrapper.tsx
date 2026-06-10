'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; weight_kg?: number | null }[]
}

export function WeightChartWrapper({ data }: Props) {
  const chartData = data
    .filter(e => e.weight_kg != null)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }),
      weight: e.weight_kg as number,
    }))

  if (chartData.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        მინ. 2 ჩანაწერი საჭიროა გრაფიკისთვის
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [value != null ? `${value} კგ` : '—', 'წონა']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
