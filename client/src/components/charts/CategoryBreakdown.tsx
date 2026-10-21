import { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { CategoryTotal } from '../../types/analytics'
import type { Category } from '../../types/category'
import { formatMonth } from '../../utils/date'
import { formatINR } from '../../utils/money'
import { CategoryAvatar } from '../CategoryIcon'
import { ChartCard } from './ChartCard'
import { DataTable } from './DataTable'
import { useChartTokens } from './chartTokens'

const COLLAPSED_ROWS = 6

interface CategoryBreakdownProps {
  month: string
  items: CategoryTotal[]
  total: number
  categoriesById: Map<string, Category>
  stale?: boolean
}

/**
 * Ranked bars, one per category. Bars share the single "spent" colour; the category's own
 * icon and colour beside the name carry identity. A donut can't show 13 close values legibly.
 */
export function CategoryBreakdown({ month, items, total, categoriesById, stale }: CategoryBreakdownProps) {
  const t = useChartTokens()
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, COLLAPSED_ROWS)
  const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0)
  const pctLabel = (value: number) => {
    const p = pct(value)
    return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`
  }

  return (
    <ChartCard
      title="Spending by category"
      subtitle={`${formatMonth(month)} · ${formatINR(total)}`}
      stale={stale}
      table={
        items.length > 0 ? (
          <DataTable
            columns={[
              { label: 'Category' },
              { label: 'Spent', align: 'right' },
              { label: 'Share', align: 'right' },
              { label: 'Transactions', align: 'right' },
            ]}
            rows={items.map((i) => [
              categoriesById.get(i.categoryId)?.name ?? 'Unknown',
              formatINR(i.total),
              pctLabel(i.total),
              i.count,
            ])}
          />
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <Box sx={{ minHeight: 200, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <Typography color="text.secondary">No spending recorded in {formatMonth(month)}.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.75}>
          {visible.map((item) => {
            const category = categoriesById.get(item.categoryId)
            return (
              <Stack key={item.categoryId} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {category ? (
                  <CategoryAvatar icon={category.icon} color={category.color} size={32} />
                ) : (
                  <Box sx={{ width: 32, height: 32 }} />
                )}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {category?.name ?? 'Unknown'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(item.total)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ flexGrow: 1, height: 8, borderRadius: '0 4px 4px 0', bgcolor: t.grid }}>
                      <Box
                        sx={{
                          width: `${Math.max(pct(item.total), 1)}%`,
                          height: '100%',
                          borderRadius: '0 4px 4px 0',
                          bgcolor: t.expense,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {pctLabel(item.total)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            )
          })}
          {items.length > COLLAPSED_ROWS && (
            <Button size="small" onClick={() => setExpanded((e) => !e)} sx={{ alignSelf: 'flex-start' }}>
              {expanded ? 'Show less' : `Show all ${items.length} categories`}
            </Button>
          )}
        </Stack>
      )}
    </ChartCard>
  )
}
