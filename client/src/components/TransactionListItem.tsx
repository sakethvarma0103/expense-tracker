import { Avatar, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import type { Account } from '../types/account'
import type { Category } from '../types/category'
import type { Transaction } from '../types/transaction'
import { formatTime } from '../utils/date'
import { formatINR } from '../utils/money'
import { CategoryAvatar } from './CategoryIcon'

interface TransactionListItemProps {
  transaction: Transaction
  accountsById: Map<string, Account>
  categoriesById: Map<string, Category>
  /** When viewing one account, transfers show as money in (+) or out (−) of it */
  perspectiveAccountId?: string
  /** Extra text before the time, e.g. the day on the dashboard */
  prefix?: string
  onClick?: () => void
}

export function TransactionListItem({
  transaction: tx,
  accountsById,
  categoriesById,
  perspectiveAccountId,
  prefix,
  onClick,
}: TransactionListItemProps) {
  const account = accountsById.get(tx.accountId)
  const category = tx.categoryId ? categoriesById.get(tx.categoryId) : undefined
  const toAccount = tx.toAccountId ? accountsById.get(tx.toAccountId) : undefined

  const title = tx.type === 'transfer' ? 'Transfer' : (category?.name ?? 'Uncategorised')
  const accountText =
    tx.type === 'transfer' ? `${account?.name ?? '?'} → ${toAccount?.name ?? '?'}` : (account?.name ?? '')
  const secondary = [prefix, formatTime(tx.date), accountText, tx.note].filter(Boolean).join(' · ')

  let sign = ''
  let color = 'text.primary'
  if (tx.type === 'income') {
    sign = '+'
    color = 'success.main'
  } else if (tx.type === 'expense') {
    sign = '−'
  } else {
    color = 'text.secondary'
    if (perspectiveAccountId) sign = tx.toAccountId === perspectiveAccountId ? '+' : '−'
  }

  return (
    <ListItemButton divider onClick={onClick}>
      <ListItemAvatar>
        {category ? (
          <CategoryAvatar icon={category.icon} color={category.color} />
        ) : (
          <Avatar sx={{ bgcolor: 'action.selected', color: 'text.secondary' }}>
            <SwapHoriz />
          </Avatar>
        )}
      </ListItemAvatar>
      <ListItemText
        primary={title}
        secondary={secondary}
        slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } }, secondary: { noWrap: true } }}
        sx={{ minWidth: 0 }}
      />
      <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color, ml: 2 }}>
        {sign}
        {formatINR(tx.amount)}
      </Typography>
    </ListItemButton>
  )
}
