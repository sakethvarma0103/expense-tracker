import { Paper, Typography } from '@mui/material'
import { useAuth } from '../context/useAuth'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
        Hi, {user?.name}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Your dashboard will show balances, recent transactions and monthly spending here.
        </Typography>
      </Paper>
    </>
  )
}
