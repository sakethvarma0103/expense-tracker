import type { ReactNode } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Stack spacing={1} sx={{ mb: 3, alignItems: 'center', textAlign: 'center' }}>
          <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
        {children}
      </Paper>
    </Box>
  )
}
