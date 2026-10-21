import { Box, Paper, Stack, Typography } from '@mui/material'
import { formatINR } from '../../utils/money'

export interface TooltipRow {
  label: string
  /** Series colour; omit for a supporting row that isn't its own series */
  color?: string
  /** Paise */
  value: number
}

interface ChartTooltipProps {
  title: string
  rows: TooltipRow[]
}

/** Value first (strong), series name second, keyed by a short line in the series colour */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <Paper elevation={4} sx={{ px: 1.5, py: 1, minWidth: 150, pointerEvents: 'none' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      <Stack spacing={0.5}>
        {rows.map((row) => (
          <Stack key={row.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 2, borderRadius: 1, bgcolor: row.color ?? 'transparent', flexShrink: 0 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatINR(row.value)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
