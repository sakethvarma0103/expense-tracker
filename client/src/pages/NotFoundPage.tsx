import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

export function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
      <Box>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          This page doesn&apos;t exist.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Go home
        </Button>
      </Box>
    </Box>
  )
}
