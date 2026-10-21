import { Alert, Button, Snackbar } from '@mui/material'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registers the service worker (production builds) and, when a new version has been
 * downloaded, offers a reload instead of swapping it in under the user mid-task.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 80, sm: 24 } }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => setNeedRefresh(false)}
        action={
          <Button color="inherit" size="small" onClick={() => void updateServiceWorker(true)}>
            Reload
          </Button>
        }
      >
        A new version is available.
      </Alert>
    </Snackbar>
  )
}
