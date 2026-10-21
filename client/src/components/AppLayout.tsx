import { useState } from 'react'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet'
import Dashboard from '@mui/icons-material/Dashboard'
import Logout from '@mui/icons-material/Logout'
import { useAuth } from '../context/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: <Dashboard /> },
  { label: 'Accounts', to: '/accounts', icon: <AccountBalanceWallet /> },
]

function activeNavPath(pathname: string): string {
  const match = NAV_ITEMS.filter((item) => item.to !== '/').find((item) => pathname.startsWith(item.to))
  return match?.to ?? '/'
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const current = activeNavPath(pathname)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          <AccountBalanceWallet color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, mr: 3 }}>
            Expense Tracker
          </Typography>

          <Stack direction="row" spacing={0.5} component="nav" sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                color={current === item.to ? 'primary' : 'inherit'}
                sx={{ bgcolor: current === item.to ? 'action.selected' : undefined }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />

          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, mr: 1 }}>
            {user?.name}
          </Typography>
          <Tooltip title="Log out">
            <span>
              <IconButton aria-label="Log out" onClick={handleLogout} disabled={loggingOut}>
                <Logout />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
        <Outlet />
      </Container>

      {/* Bottom navigation on phones */}
      <Paper
        elevation={0}
        sx={{
          display: { xs: 'block', sm: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: 1,
          borderColor: 'divider',
          pb: 'env(safe-area-inset-bottom)',
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <BottomNavigation showLabels value={current}>
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.to}
              label={item.label}
              value={item.to}
              icon={item.icon}
              component={RouterLink}
              to={item.to}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
