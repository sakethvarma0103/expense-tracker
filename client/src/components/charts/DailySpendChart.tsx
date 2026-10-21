import { Box, Typography } from '@mui/material'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { MonthlyAnalytics } from '../../types/analytics'
import { formatDayShort, formatMonth, istParts } from '../../utils/date'
import { formatINR, formatINRCompact } from '../../utils/money'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { DataTable } from './DataTable'
import { useChartTokens } from './chartTokens'

interface Row {
  date: string
  day: number
  spent: number
  cumulative: number
}

interface DailySpendChartProps {
  month: string
  daily: MonthlyAnalytics['daily']
  stale?: boolean
}

/** Spending accumulating through the month: one series, so no legend */
export function DailySpendChart({ month, daily, stale }: DailySpendChartProps) {
  const t = useChartTokens()
  const today = istParts(new Date()).date

  // Don't draw a flat line into future days of the current month
  let running = 0
  const data: Row[] = daily
    .filter((d) => d.date <= today)
    .map((d) => {
      running += d.expense
      return { date: d.date, day: Number(d.date.slice(8, 10)), spent: d.expense, cumulative: running }
    })
  const last = data[data.length - 1]
  const daysInMonth = daily.length
  const ticks = [1, 8, 15, 22, daysInMonth]

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const row = payload?.[0]?.payload as Row | undefined
    if (!active || !row) return null
    return (
      <ChartTooltip
        title={formatDayShort(row.date)}
        rows={[
          { label: 'spent so far', color: t.expense, value: row.cumulative },
          { label: 'that day', value: row.spent },
        ]}
      />
    )
  }

  return (
    <ChartCard
      title="Spending through the month"
      subtitle={last ? `${formatINR(last.cumulative)} by ${formatDayShort(last.date)}` : formatMonth(month)}
      stale={stale}
      table={
        <DataTable
          columns={[{ label: 'Date' }, { label: 'Spent', align: 'right' }, { label: 'Running total', align: 'right' }]}
          rows={data.filter((d) => d.spent > 0).map((d) => [formatDayShort(d.date), formatINR(d.spent), formatINR(d.cumulative)])}
        />
      }
    >
      {data.length === 0 ? (
        <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
          <Typography color="text.secondary">{formatMonth(month)} hasn&apos;t started yet.</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, daysInMonth]}
              ticks={ticks}
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ fill: t.muted, fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v: number) => formatINRCompact(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: t.muted, fontSize: 12 }}
              width={52}
            />
            <Tooltip cursor={{ stroke: t.axis, strokeWidth: 1 }} content={renderTooltip} />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="cumulative"
              name="Spent so far"
              stroke={t.expense}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={t.expense}
              fillOpacity={0.1}
              activeDot={{ r: 4, fill: t.expense, stroke: t.surface, strokeWidth: 2 }}
            />
            {last && (
              <ReferenceDot x={last.day} y={last.cumulative} r={4} fill={t.expense} stroke={t.surface} strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
