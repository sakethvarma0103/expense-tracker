import { useMediaQuery } from '@mui/material'

/**
 * Chart colours. The app follows the device's light/dark setting, so charts do too.
 * Series colours are slots 1-2 of the validated categorical palette, checked
 * (lightness, chroma, colour-blind separation, contrast) against the card surfaces
 * they render on: #ffffff light, #121212 dark.
 *
 * Each colour means one thing everywhere: `income` is income, `expense` is spending.
 */
export interface ChartTokens {
  income: string
  expense: string
  /** Card background; used for gaps and rings around marks */
  surface: string
  grid: string
  axis: string
  /** Axis tick text */
  muted: string
  /** Hover band behind bars */
  hover: string
}

const LIGHT: ChartTokens = {
  income: '#2a78d6',
  expense: '#eb6834',
  surface: '#ffffff',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#76746e',
  hover: 'rgba(11, 11, 11, 0.04)',
}

const DARK: ChartTokens = {
  income: '#3987e5',
  expense: '#d95926',
  surface: '#121212',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#9a988f',
  hover: 'rgba(255, 255, 255, 0.05)',
}

export function useChartTokens(): ChartTokens {
  return useMediaQuery('(prefers-color-scheme: dark)') ? DARK : LIGHT
}
