import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, IconButton, List, Paper, Skeleton, Stack, Typography } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { StatTile, type StatDelta } from '../components/StatTile'
import { TransactionListItem } from '../components/TransactionListItem'
import { CategoryBreakdown } from '../components/charts/CategoryBreakdown'
import { ChartCard } from '../components/charts/ChartCard'
import { DailySpendChart } from '../components/charts/DailySpendChart'
import { TrendChart } from '../components/charts/TrendChart'
import { useAuth } from '../context/useAuth'
import { fetchAccounts } from '../services/accountService'
import { fetchMonthlyAnalytics } from '../services/analyticsService'
import { parseApiError } from '../services/api'
import { fetchCategories } from '../services/categoryService'
import { fetchTransactions } from '../services/transactionService'
import type { Account } from '../types/account'
import type { MonthlyAnalytics } from '../types/analytics'
import type { Category } from '../types/category'
import type { Transaction } from '../types/transaction'
import { currentIstMonth, formatDayHeading, formatMonth, formatMonthShort, istParts, shiftMonth } from '../utils/date'
import { formatINR } from '../utils/money'

/** Change vs the previous month, e.g. "12% more than Sep" */
function monthDelta(current: number, previous: number, previousMonth: string, upIsGood: boolean): StatDelta | undefined {
  if (previous <= 0 || current === previous) return undefined
  const change = Math.round((Math.abs(current - previous) / previous) * 100)
  const direction = current > previous ? 'up' : 'down'
  return {
    direction,
    good: (direction === 'up') === upIsGood,
    text: `${change}% ${direction === 'up' ? 'more' : 'less'} than ${formatMonthShort(previousMonth)}`,
  }
}

interface MonthData {
  analytics: MonthlyAnalytics
  recent: Transaction[]
}

export function DashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentIstMonth)
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [data, setData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [analytics, page, accs, cats] = await Promise.all([
        fetchMonthlyAnalytics(month),
        fetchTransactions({ month, limit: 5 }),
        fetchAccounts(),
        fetchCategories(),
      ])
      if (id !== requestId.current) return
      setData({ analytics, recent: page.transactions })
      setAccounts(accs)
      setCategories(cats)
    } catch (err) {
      if (id === requestId.current) setError(parseApiError(err).message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const accountsById = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts])
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const activeAccounts = (accounts ?? []).filter((a) => !a.archived)
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.balance, 0)

  // While a new month loads, keep showing the previous one, dimmed
  const stale = loading && data !== null
  const analytics = data?.analytics
  const previous = analytics?.trend[analytics.trend.length - 2]
  const isCurrentMonth = month === currentIstMonth()

  const header = (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
        Hi, {user?.name}
      </Typography>
      {/* One filter row, scoping everything below */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <IconButton aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" component="p" sx={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
          {formatMonth(month)}
        </Typography>
        <IconButton aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
          <ChevronRight />
        </IconButton>
        {!isCurrentMonth && (
          <Button size="small" onClick={() => setMonth(currentIstMonth())} sx={{ ml: 1 }}>
            This month
          </Button>
        )}
      </Stack>
    </Stack>
  )

  if (error && !data) {
    return (
      <Stack spacing={3}>
        {header}
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Stack>
    )
  }

  if (!data || !analytics || accounts === null) {
    return (
      <Stack spacing={3}>
        {header}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={96} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={300} />
      </Stack>
    )
  }

  if (accounts.length === 0) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Hi, {user?.name}
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Let&apos;s get you set up
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add the bank accounts, cash, cards and UPI wallets you use. Then record transactions to see where your money
            goes.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/accounts">
            Add your first account
          </Button>
        </Paper>
      </Stack>
    )
  }

  const { totals } = analytics

  return (
    <Stack spacing={3}>
      {header}
      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          opacity: stale ? 0.5 : 1,
          transition: 'opacity 150ms',
        }}
      >
        <StatTile
          label="Total balance"
          value={formatINR(totalBalance)}
          caption={`Now · ${activeAccounts.length} ${activeAccounts.length === 1 ? 'account' : 'accounts'}`}
          negative={totalBalance < 0}
        />
        <StatTile
          label="Spent"
          value={formatINR(totals.expense)}
          delta={previous && monthDelta(totals.expense, previous.expense, previous.month, false)}
          caption={`${formatMonthShort(month)} · ${totals.count} transactions`}
        />
        <StatTile
          label="Income"
          value={formatINR(totals.income)}
          delta={previous && monthDelta(totals.income, previous.income, previous.month, true)}
          caption={formatMonth(month)}
        />
        <StatTile
          label="Net"
          value={formatINR(totals.net)}
          caption={totals.net >= 0 ? 'Saved this month' : 'Spent more than earned'}
          negative={totals.net < 0}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 2 }}>
        <CategoryBreakdown
          month={month}
          items={analytics.expenseByCategory}
          total={totals.expense}
          categoriesById={categoriesById}
          stale={stale}
        />
        <DailySpendChart month={month} daily={analytics.daily} stale={stale} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 2 }}>
        <TrendChart trend={analytics.trend} stale={stale} />
        <ChartCard title="Recent transactions" subtitle={formatMonth(month)} stale={stale}>
          {data.recent.length === 0 ? (
            <Box sx={{ minHeight: 200, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <Typography color="text.secondary">Nothing recorded in {formatMonth(month)}.</Typography>
                <Button variant="outlined" component={RouterLink} to="/transactions">
                  Add a transaction
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              <List disablePadding sx={{ mx: { xs: -2, sm: -2.5 } }}>
                {data.recent.map((tx) => (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    accountsById={accountsById}
                    categoriesById={categoriesById}
                    prefix={formatDayHeading(istParts(tx.date).date)}
                  />
                ))}
              </List>
              <Button component={RouterLink} to="/transactions" sx={{ mt: 1.5 }}>
                View all transactions
              </Button>
            </>
          )}
        </ChartCard>
      </Box>
    </Stack>
  )
}
