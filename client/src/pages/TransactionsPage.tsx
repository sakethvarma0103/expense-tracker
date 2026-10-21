import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Fab,
  IconButton,
  List,
  ListSubheader,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import Add from '@mui/icons-material/Add'
import FilterList from '@mui/icons-material/FilterList'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { TransactionFormDialog } from '../components/TransactionFormDialog'
import { TransactionListItem } from '../components/TransactionListItem'
import { fetchAccounts } from '../services/accountService'
import { parseApiError } from '../services/api'
import { fetchCategories } from '../services/categoryService'
import { fetchMonthSummary, fetchTransactions, type TransactionFilters } from '../services/transactionService'
import type { Account } from '../types/account'
import type { Category } from '../types/category'
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type MonthSummary,
  type Transaction,
  type TransactionType,
} from '../types/transaction'
import { currentIstMonth, formatDayHeading, formatMonth, istParts, shiftMonth } from '../utils/date'
import { formatINR } from '../utils/money'

type FormState = { open: false } | { open: true; transaction?: Transaction }

const PAGE_SIZE = 50

// Show the "All ..." option when a filter is empty, instead of a blank field
const filterSlotProps = { select: { displayEmpty: true }, inputLabel: { shrink: true } } as const

interface DayGroup {
  day: string
  items: Transaction[]
  /** Income minus expenses for the day, in paise (transfers excluded) */
  net: number
}

function groupByDay(transactions: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const tx of transactions) {
    const day = istParts(tx.date).date
    let group = groups[groups.length - 1] as DayGroup | undefined
    if (!group || group.day !== day) {
      group = { day, items: [], net: 0 }
      groups.push(group)
    }
    group.items.push(tx)
    if (tx.type === 'income') group.net += tx.amount
    if (tx.type === 'expense') group.net -= tx.amount
  }
  return groups
}

export function TransactionsPage() {
  const [month, setMonth] = useState(currentIstMonth)
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')
  const [accountFilter, setAccountFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ open: false })
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isWide = useMediaQuery(useTheme().breakpoints.up('sm'))

  // Ignore responses from requests that a newer filter change has superseded
  const requestId = useRef(0)

  const filters = useMemo<TransactionFilters>(
    () => ({
      month,
      type: typeFilter || undefined,
      accountId: accountFilter || undefined,
      categoryId: categoryFilter || undefined,
      limit: PAGE_SIZE,
    }),
    [month, typeFilter, accountFilter, categoryFilter],
  )

  const loadReferences = useCallback(async () => {
    const [a, c] = await Promise.all([fetchAccounts(), fetchCategories()])
    setAccounts(a)
    setCategories(c)
  }, [])

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoadError(null)
    setTransactions(null)
    try {
      const [page, monthSummary] = await Promise.all([
        fetchTransactions(filters),
        fetchMonthSummary({ month, accountId: filters.accountId, categoryId: filters.categoryId }),
      ])
      if (id !== requestId.current) return
      setTransactions(page.transactions)
      setNextCursor(page.nextCursor)
      setSummary(monthSummary)
    } catch (err) {
      if (id === requestId.current) setLoadError(parseApiError(err).message)
    }
  }, [filters, month])

  useEffect(() => {
    loadReferences().catch((err: unknown) => setLoadError(parseApiError(err).message))
  }, [loadReferences])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = async () => {
    if (!nextCursor) return
    const id = requestId.current
    setLoadingMore(true)
    try {
      const page = await fetchTransactions({ ...filters, cursor: nextCursor })
      if (id !== requestId.current) return
      setTransactions((prev) => [...(prev ?? []), ...page.transactions])
      setNextCursor(page.nextCursor)
    } catch (err) {
      setToast({ message: parseApiError(err).message, severity: 'error' })
    } finally {
      setLoadingMore(false)
    }
  }

  const afterChange = (message: string) => {
    setForm({ open: false })
    setToast({ message, severity: 'success' })
    // Balances shown in the account picker change too
    void loadReferences()
    void load()
  }

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const groups = useMemo(() => groupByDay(transactions ?? []), [transactions])
  const activeFilterCount = [typeFilter, accountFilter, categoryFilter].filter(Boolean).length
  const hasFilters = activeFilterCount > 0
  const categoryFilterOptions = categories.filter((c) => typeFilter === '' || typeFilter === c.type)

  const renderRow = (tx: Transaction) => (
    <TransactionListItem
      key={tx.id}
      transaction={tx}
      accountsById={accountsById}
      categoriesById={categoriesById}
      perspectiveAccountId={accountFilter || undefined}
      onClick={() => setForm({ open: true, transaction: tx })}
    />
  )

  const summaryItems = summary
    ? [
        { label: 'Income', value: summary.income, color: 'success.main' },
        { label: 'Spent', value: summary.expense, color: 'text.primary' },
        { label: 'Net', value: summary.net, color: summary.net < 0 ? 'error.main' : 'text.primary' },
      ]
    : []

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Transactions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setForm({ open: true })}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Add transaction
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <IconButton aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
            {formatMonth(month)}
          </Typography>
          <IconButton aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight />
          </IconButton>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 1 }}>
          {summary
            ? summaryItems.map((s) => (
                <Box key={s.label}>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: s.color,
                      fontSize: { xs: '0.95rem', sm: '1.25rem' },
                    }}
                  >
                    {formatINR(s.value)}
                  </Typography>
                </Box>
              ))
            : [0, 1, 2].map((i) => <Skeleton key={i} height={48} />)}
        </Box>
      </Paper>

      {/* Filters: always visible on wider screens, behind a toggle on phones */}
      <Box>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<FilterList />}
        onClick={() => setFiltersOpen((o) => !o)}
        sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
      >
        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </Button>
      <Collapse in={filtersOpen || isWide}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: { xs: 2, sm: 1 } }}>
        <TextField
          select
          size="small"
          label="Type"
          slotProps={filterSlotProps}
          value={typeFilter}
          onChange={(e) => {
            const next = e.target.value as TransactionType | ''
            setTypeFilter(next)
            // Category filter only applies to matching types
            if (next === 'transfer' || (next && categoriesById.get(categoryFilter)?.type !== next)) setCategoryFilter('')
          }}
        >
          <MenuItem value="">All types</MenuItem>
          {TRANSACTION_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Account"
          slotProps={filterSlotProps}
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
        >
          <MenuItem value="">All accounts</MenuItem>
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name}
              {a.archived ? ' (archived)' : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Category"
          slotProps={filterSlotProps}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          disabled={typeFilter === 'transfer'}
        >
          <MenuItem value="">All categories</MenuItem>
          {categoryFilterOptions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
              {typeFilter === '' ? ` (${c.type})` : ''}
              {c.archived ? ' (archived)' : ''}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      </Collapse>
      </Box>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {transactions === null && !loadError && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </Paper>
      )}

      {transactions && transactions.length === 0 && (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {hasFilters ? 'No matching transactions' : `Nothing recorded in ${formatMonth(month)}`}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {hasFilters ? 'Try clearing the filters or picking another month.' : 'Add your spending and income to see where your money goes.'}
          </Typography>
          {hasFilters ? (
            <Button
              variant="outlined"
              onClick={() => {
                setTypeFilter('')
                setAccountFilter('')
                setCategoryFilter('')
              }}
            >
              Clear filters
            </Button>
          ) : (
            <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ open: true })}>
              Add transaction
            </Button>
          )}
        </Paper>
      )}

      {groups.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {groups.map((g) => (
            <List
              key={g.day}
              disablePadding
              subheader={
                <ListSubheader sx={{ display: 'flex', justifyContent: 'space-between', lineHeight: '36px', borderBottom: 1, borderColor: 'divider' }}>
                  <span>{formatDayHeading(g.day)}</span>
                  {g.net !== 0 && (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {g.net > 0 ? '+' : '−'}
                      {formatINR(Math.abs(g.net))}
                    </span>
                  )}
                </ListSubheader>
              }
            >
              {g.items.map(renderRow)}
            </List>
          ))}
          {nextCursor && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button onClick={() => void loadMore()} loading={loadingMore}>
                Load more
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Quick add on phones, above the bottom navigation */}
      <Fab
        color="primary"
        aria-label="Add transaction"
        onClick={() => setForm({ open: true })}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          right: 16,
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
        }}
      >
        <Add />
      </Fab>

      <TransactionFormDialog
        open={form.open}
        transaction={form.open ? form.transaction : undefined}
        accounts={accounts}
        categories={categories}
        onClose={() => setForm({ open: false })}
        onSaved={() => afterChange(form.open && form.transaction ? 'Transaction updated' : 'Transaction added')}
        onDeleted={() => afterChange('Transaction deleted')}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
