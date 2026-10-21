import { useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { parseApiError } from '../services/api'
import { createAccount, updateAccount } from '../services/accountService'
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type Account, type AccountType } from '../types/account'
import type { FieldErrors } from '../types/api'
import { paiseToRupeesInput, parseRupeesToPaise } from '../utils/money'

interface AccountFormDialogProps {
  open: boolean
  /** Pass an account to edit it; omit to create a new one */
  account?: Account
  onClose: () => void
  onSaved: (account: Account) => void
}

export function AccountFormDialog(props: AccountFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      {/* Remount the form each time the dialog opens so it starts from fresh values */}
      {props.open && <AccountForm {...props} />}
    </Dialog>
  )
}

function AccountForm({ account, onClose, onSaved }: AccountFormDialogProps) {
  const isEdit = Boolean(account)
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'bank')
  const [openingBalance, setOpeningBalance] = useState(
    account ? paiseToRupeesInput(account.openingBalance) : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const paise = openingBalance.trim() === '' ? 0 : parseRupeesToPaise(openingBalance)
    if (paise === null) {
      setFieldErrors({ openingBalance: ['Enter a valid amount, e.g. 1,250.50'] })
      return
    }

    setSubmitting(true)
    try {
      const input = { name, type, openingBalance: paise }
      const saved = account ? await updateAccount(account.id, input) : await createAccount(input)
      onSaved(saved)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
      setSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <DialogTitle>{isEdit ? 'Edit account' : 'Add account'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Account name"
            placeholder="e.g. HDFC Savings"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name?.[0]}
          />
          <TextField
            select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            error={Boolean(fieldErrors.type)}
            helperText={fieldErrors.type?.[0]}
          >
            {ACCOUNT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Opening balance"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            error={Boolean(fieldErrors.openingBalance)}
            helperText={
              fieldErrors.openingBalance?.[0] ??
              (type === 'credit_card'
                ? 'Enter money you owe as a negative amount, e.g. -5,000'
                : 'Balance before any transactions you record here')
            }
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { inputMode: 'decimal' },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submitting}>
          {isEdit ? 'Save' : 'Add account'}
        </Button>
      </DialogActions>
    </form>
  )
}
