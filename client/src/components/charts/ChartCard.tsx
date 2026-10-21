import { useState, type ReactNode } from 'react'
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import TableRows from '@mui/icons-material/TableRows'

export interface LegendItem {
  label: string
  color: string
  shape: 'rect' | 'line'
}

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Needed for two or more series; a single series is named by the title */
  legend?: LegendItem[]
  /** Table twin of the chart, so no value is only reachable by hovering */
  table?: ReactNode
  /** Keep showing the previous render, dimmed, while new data loads */
  stale?: boolean
  children: ReactNode
}

export function ChartCard({ title, subtitle, legend, table, stale = false, children }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {table && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_e, v: 'chart' | 'table' | null) => v && setView(v)}
            aria-label={`${title} view`}
          >
            <ToggleButton value="chart" aria-label="Chart view" sx={{ px: 1, py: 0.5 }}>
              <Tooltip title="Chart">
                <BarChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view" sx={{ px: 1, py: 0.5 }}>
              <Tooltip title="Table">
                <TableRows fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>

      {legend && legend.length > 1 && view === 'chart' && (
        <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: 'wrap' }}>
          {legend.map((item) => (
            <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box
                sx={
                  item.shape === 'rect'
                    ? { width: 10, height: 10, borderRadius: '2px', bgcolor: item.color }
                    : { width: 14, height: 2, borderRadius: 1, bgcolor: item.color }
                }
              />
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <Box sx={{ flexGrow: 1, opacity: stale ? 0.5 : 1, transition: 'opacity 150ms' }}>
        {view === 'table' && table ? table : children}
      </Box>
    </Paper>
  )
}
