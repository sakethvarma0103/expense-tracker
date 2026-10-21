import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import type { MonthlyAnalytics } from '../../types/analytics'
import { formatMonth, formatMonthShort } from '../../utils/date'
import { formatINR, formatINRCompact } from '../../utils/money'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { DataTable } from './DataTable'
import { useChartTokens } from './chartTokens'

interface Row {
  month: string
  label: string
  income: number
  expense: number
}

interface TrendChartProps {
  trend: MonthlyAnalytics['trend']
  stale?: boolean
}

/** Income vs spending, last 6 months: grouped columns, two series */
export function TrendChart({ trend, stale }: TrendChartProps) {
  const t = useChartTokens()
  const data: Row[] = trend.map((m) => ({ ...m, label: formatMonthShort(m.month) }))

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const row = payload?.[0]?.payload as Row | undefined
    if (!active || !row) return null
    return (
      <ChartTooltip
        title={formatMonth(row.month)}
        rows={[
          { label: 'Income', color: t.income, value: row.income },
          { label: 'Spent', color: t.expense, value: row.expense },
          { label: 'Net', value: row.income - row.expense },
        ]}
      />
    )
  }

  const first = trend[0]
  const last = trend[trend.length - 1]

  return (
    <ChartCard
      title="Income vs spending"
      subtitle={first && last ? `${formatMonthShort(first.month)} – ${formatMonth(last.month)}` : undefined}
      legend={[
        { label: 'Income', color: t.income, shape: 'rect' },
        { label: 'Spent', color: t.expense, shape: 'rect' },
      ]}
      stale={stale}
      table={
        <DataTable
          columns={[
            { label: 'Month' },
            { label: 'Income', align: 'right' },
            { label: 'Spent', align: 'right' },
            { label: 'Net', align: 'right' },
          ]}
          rows={trend.map((m) => [formatMonth(m.month), formatINR(m.income), formatINR(m.expense), formatINR(m.income - m.expense)])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={240}>
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: t.axis }} tick={{ fill: t.muted, fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => formatINRCompact(v)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: t.muted, fontSize: 12 }}
            width={52}
          />
          <Tooltip cursor={{ fill: t.hover }} content={renderTooltip} />
          <Bar isAnimationActive={false} dataKey="income" name="Income" fill={t.income} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar isAnimationActive={false} dataKey="expense" name="Spent" fill={t.expense} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
