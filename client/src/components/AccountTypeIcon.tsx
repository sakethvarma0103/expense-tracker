import AccountBalance from '@mui/icons-material/AccountBalance'
import CreditCard from '@mui/icons-material/CreditCard'
import Payments from '@mui/icons-material/Payments'
import Smartphone from '@mui/icons-material/Smartphone'
import type { SvgIconProps } from '@mui/material'
import type { AccountType } from '../types/account'

const ICONS = {
  bank: AccountBalance,
  cash: Payments,
  credit_card: CreditCard,
  wallet: Smartphone,
} satisfies Record<AccountType, unknown>

export function AccountTypeIcon({ type, ...props }: { type: AccountType } & SvgIconProps) {
  const Icon = ICONS[type]
  return <Icon {...props} />
}
