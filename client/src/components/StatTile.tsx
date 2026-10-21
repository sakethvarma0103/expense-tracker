import { Paper, Stack, Typography } from '@mui/material'
import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'

export interface StatDelta {
  direction: 'up' | 'down'
  /** Whether this direction is good news (e.g. spending down = good) */
  good: boolean
  text: string
}

interface StatTileProps {
  label: string
  /** Already formatted */
  value: string
  /** Shown under the value when there's no delta */
  caption?: string
  delta?: StatDelta
  negative?: boolean
}

export function StatTile({ label, value, caption, delta, negative = false }: StatTileProps) {
  const DeltaIcon = delta?.direction === 'up' ? ArrowUpward : ArrowDownward
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" noWrap>
        {label}
      </Typography>
      {/* Proportional figures for a standalone number */}
      <Typography
        component="p"
        noWrap
        sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' }, my: 0.25, color: negative ? 'error.main' : 'text.primary' }}
      >
        {value}
      </Typography>
      {delta ? (
        <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', color: delta.good ? 'success.main' : 'error.main' }}>
          <DeltaIcon sx={{ fontSize: 14 }} aria-hidden />
          <Typography variant="caption" noWrap>
            {delta.text}
          </Typography>
        </Stack>
      ) : (
        caption && (
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {caption}
          </Typography>
        )
      )}
    </Paper>
  )
}
