import { useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Link,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { parseApiError } from '../services/api'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type TransactionInput,
} from '../services/transactionService'
import type { Account } from '../types/account'
import type { FieldErrors } from '../types/api'
import type { Category } from '../types/category'
import { TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS, type Transaction, type TransactionType } from '../types/transaction'
import { istInputsToIso, istParts } from '../utils/date'
import { formatINR, paiseToRupeesInput, parseRupeesToPaise } from '../utils/money'
import { AccountTypeIcon } from './AccountTypeIcon'
import { CategoryAvatar } from './CategoryIcon'
import { ConfirmDialog } from './ConfirmDialog'

const LAST_ACCOUNT_KEY = 'expense-tracker:lastAccountId'

function readLastAccountId(): string | null {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY)
  } catch {
    return null
  }
}

function rememberAccountId(id: string): void {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, id)
  } catch {
    // Storage unavailable (private mode etc.); the default is only a convenience
  }
}

interface TransactionFormDialogProps {
  open: boolean
  /** Pass a transaction to edit it; omit to add a new one */
  transaction?: Transaction
  accounts: Account[]
  categories: Category[]
  onClose: () => void
  onSaved: (transaction: Transaction) => void
  onDeleted: () => void
}

export function TransactionFormDialog(props: TransactionFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      {/* Remount the form each time the dialog opens so it starts from fresh values */}
      {props.open && <TransactionForm {...props} />}
    </Dialog>
  )
}

function TransactionForm({
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
  onDeleted,
}: TransactionFormDialogProps) {
  const isEdit = Boolean(transaction)
  // Archived accounts/categories can't be picked, except the ones an existing transaction already uses
  const usable = <T extends { id: string; archived: boolean }>(items: T[], ...keep: (string | null | undefined)[]) =>
    items.filter((i) => !i.archived || keep.includes(i.id))

  const accountOptions = usable(accounts, transaction?.accountId, transaction?.toAccountId)
  const defaultAccountId = (() => {
    if (transaction) return transaction.accountId
    const last = readLastAccountId()
    return accountOptions.find((a) => a.id === last)?.id ?? accountOptions[0]?.id ?? ''
  })()
  const initialWhen = istParts(transaction?.date ?? new Date())

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? paiseToRupeesInput(transaction.amount) : '')
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [toAccountId, setToAccountId] = useState(transaction?.toAccountId ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [date, setDate] = useState(initialWhen.date)
  const [time, setTime] = useState(initialWhen.time)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const categoryOptions = usable(
    categories.filter((c) => c.type === type),
    transaction?.categoryId,
  )

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    setFieldErrors({})
    // A category only fits one type
    if (!categories.some((c) => c.id === categoryId && c.type === next)) setCategoryId('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const paise = parseRupeesToPaise(amount)
    const errors: FieldErrors = {}
    if (paise === null || paise <= 0) errors.amount = ['Enter an amount greater than zero, e.g. 250.50']
    if (!accountId) errors.accountId = ['Choose an account']
    if (type === 'transfer' && !toAccountId) errors.toAccountId = ['Choose the account to transfer to']
    if (type === 'transfer' && toAccountId && toAccountId === accountId) {
      errors.toAccountId = ['Choose a different account']
    }
    if (type !== 'transfer' && !categoryId) errors.categoryId = ['Choose a category']
    if (!date) errors.date = ['Choose a date']
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || paise === null) return

    const base = { amount: paise, accountId, date: istInputsToIso(date, time), note: note.trim() }
    const input: TransactionInput =
      type === 'transfer' ? { ...base, type, toAccountId } : { ...base, type, categoryId }

    setSubmitting(true)
    try {
      const saved = transaction
        ? await updateTransaction(transaction.id, input)
        : await createTransaction(input)
      rememberAccountId(accountId)
      onSaved(saved)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction) return
    setDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      onDeleted()
    } catch (err) {
      setError(parseApiError(err).message)
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  const renderAccountOption = (a: Account) => (
    <MenuItem key={a.id} value={a.id}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
        <AccountTypeIcon type={a.type} fontSize="small" color="action" />
        <Box sx={{ flexGrow: 1 }}>{a.name}</Box>
        <Typography variant="body2" color="text.secondary">
          {formatINR(a.balance)}
        </Typography>
      </Stack>
    </MenuItem>
  )

  if (accountOptions.length === 0) {
    return (
      <>
        <DialogTitle>Add transaction</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            You need an account before you can record transactions.{' '}
            <Link component={RouterLink} to="/accounts" onClick={onClose}>
              Add an account
            </Link>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <DialogTitle>{isEdit ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={type}
            onChange={(_e, value: TransactionType | null) => value && handleTypeChange(value)}
          >
            {TRANSACTION_TYPES.map((t) => (
              <ToggleButton key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <TextField
            label="Amount"
            placeholder="0.00"
            autoFocus={!isEdit}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={Boolean(fieldErrors.amount)}
            helperText={fieldErrors.amount?.[0]}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontSize: '1.75rem', fontWeight: 600 }}>₹</Typography>
                  </InputAdornment>
                ),
              },
              htmlInput: { inputMode: 'decimal', style: { fontSize: '1.75rem', fontWeight: 600 } },
            }}
          />

          {type !== 'transfer' && (
            <TextField
              select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={Boolean(fieldErrors.categoryId)}
              helperText={fieldErrors.categoryId?.[0]}
            >
              {categoryOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <CategoryAvatar icon={c.icon} color={c.color} size={28} />
                    <span>{c.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            label={type === 'transfer' ? 'From account' : 'Account'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            error={Boolean(fieldErrors.accountId)}
            helperText={fieldErrors.accountId?.[0]}
          >
            {accountOptions.map(renderAccountOption)}
          </TextField>

          {type === 'transfer' && (
            <TextField
              select
              label="To account"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              error={Boolean(fieldErrors.toAccountId)}
              helperText={fieldErrors.toAccountId?.[0]}
            >
              {accountOptions.filter((a) => a.id !== accountId).map(renderAccountOption)}
            </TextField>
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              error={Boolean(fieldErrors.date)}
              helperText={fieldErrors.date?.[0]}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ maxWidth: 160 }}
            />
          </Stack>

          <TextField
            label="Note (optional)"
            placeholder={type === 'transfer' ? 'e.g. Credit card bill' : 'e.g. Dinner with friends'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={Boolean(fieldErrors.note)}
            helperText={fieldErrors.note?.[0]}
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isEdit && (
          <Button color="error" onClick={() => setConfirmDelete(true)} disabled={submitting} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submitting}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete transaction?"
        message="This can't be undone. Account balances will be updated."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmDelete(false)}
      />
    </form>
  )
}
