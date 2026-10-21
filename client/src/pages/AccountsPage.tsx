import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import Add from '@mui/icons-material/Add'
import Archive from '@mui/icons-material/Archive'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import Edit from '@mui/icons-material/Edit'
import MoreVert from '@mui/icons-material/MoreVert'
import Unarchive from '@mui/icons-material/Unarchive'
import { AccountFormDialog } from '../components/AccountFormDialog'
import { AccountTypeIcon } from '../components/AccountTypeIcon'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { parseApiError } from '../services/api'
import { deleteAccount, fetchAccounts, updateAccount } from '../services/accountService'
import { ACCOUNT_TYPE_LABELS, type Account } from '../types/account'
import { formatINR } from '../utils/money'

type FormState = { open: false } | { open: true; account?: Account }

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ open: false })
  const [menu, setMenu] = useState<{ anchor: HTMLElement; account: Account } | null>(null)
  const [toDelete, setToDelete] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      setAccounts(await fetchAccounts())
    } catch (err) {
      setLoadError(parseApiError(err).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const active = accounts?.filter((a) => !a.archived) ?? []
  const archived = accounts?.filter((a) => a.archived) ?? []
  const total = active.reduce((sum, a) => sum + a.balance, 0)

  const openMenu = (e: MouseEvent<HTMLElement>, account: Account) =>
    setMenu({ anchor: e.currentTarget, account })

  const handleSaved = () => {
    const isEdit = form.open && Boolean(form.account)
    setForm({ open: false })
    setToast({ message: isEdit ? 'Account updated' : 'Account added', severity: 'success' })
    void load()
  }

  const toggleArchive = async (account: Account) => {
    setMenu(null)
    try {
      await updateAccount(account.id, { archived: !account.archived })
      setToast({ message: account.archived ? 'Account restored' : 'Account archived', severity: 'success' })
      await load()
    } catch (err) {
      setToast({ message: parseApiError(err).message, severity: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteAccount(toDelete.id)
      setToDelete(null)
      setToast({ message: 'Account deleted', severity: 'success' })
      await load()
    } catch (err) {
      setToast({ message: parseApiError(err).message, severity: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const renderRow = (account: Account) => (
    <ListItem
      key={account.id}
      divider
      secondaryAction={
        <IconButton edge="end" aria-label={`Actions for ${account.name}`} onClick={(e) => openMenu(e, account)}>
          <MoreVert />
        </IconButton>
      }
      sx={{ pr: 7, '& > :not(.MuiListItemSecondaryAction-root)': { opacity: account.archived ? 0.6 : 1 } }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'action.selected', color: 'primary.main' }}>
          <AccountTypeIcon type={account.type} />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={account.name}
        secondary={ACCOUNT_TYPE_LABELS[account.type]}
        slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }}
      />
      <Typography
        sx={{
          ml: 2,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          color: account.balance < 0 ? 'error.main' : 'text.primary',
        }}
      >
        {formatINR(account.balance)}
      </Typography>
    </ListItem>
  )

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Accounts
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ open: true })}>
          Add account
        </Button>
      </Stack>

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

      {accounts === null && !loadError && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={56} />
          ))}
        </Paper>
      )}

      {accounts && accounts.length === 0 && (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No accounts yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add your bank accounts, cash, cards and UPI wallets to start tracking balances.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ open: true })}>
            Add your first account
          </Button>
        </Paper>
      )}

      {accounts && accounts.length > 0 && (
        <>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              Total balance
            </Typography>
            <Typography
              variant="h4"
              component="p"
              sx={{
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: total < 0 ? 'error.main' : 'text.primary',
              }}
            >
              {formatINR(total)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across {active.length} active {active.length === 1 ? 'account' : 'accounts'}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            {active.length > 0 && <List disablePadding>{active.map(renderRow)}</List>}
            {archived.length > 0 && (
              <List disablePadding subheader={<ListSubheader>Archived</ListSubheader>}>
                {archived.map(renderRow)}
              </List>
            )}
          </Paper>
        </>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) setForm({ open: true, account: menu.account })
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => menu && void toggleArchive(menu.account)}>
          <ListItemIcon>
            {menu?.account.archived ? <Unarchive fontSize="small" /> : <Archive fontSize="small" />}
          </ListItemIcon>
          {menu?.account.archived ? 'Restore' : 'Archive'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) setToDelete(menu.account)
            setMenu(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <AccountFormDialog
        open={form.open}
        account={form.open ? form.account : undefined}
        onClose={() => setForm({ open: false })}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete account?"
        message={
          <>
            <strong>{toDelete?.name}</strong> will be permanently deleted. To keep its history but hide
            it, archive it instead.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setToDelete(null)}
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

      <Box sx={{ height: { xs: 8, sm: 0 } }} />
    </Stack>
  )
}
