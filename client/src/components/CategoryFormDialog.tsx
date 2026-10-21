import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import Check from '@mui/icons-material/Check'
import { parseApiError } from '../services/api'
import { createCategory, updateCategory } from '../services/categoryService'
import type { FieldErrors } from '../types/api'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_TYPES,
  CATEGORY_TYPE_LABELS,
  type Category,
  type CategoryIconName,
  type CategoryType,
} from '../types/category'
import { CategoryAvatar, CategoryIcon } from './CategoryIcon'

interface CategoryFormDialogProps {
  open: boolean
  /** Pass a category to edit it; omit to create a new one */
  category?: Category
  /** Type pre-selected when creating */
  defaultType: CategoryType
  onClose: () => void
  onSaved: (category: Category) => void
}

export function CategoryFormDialog(props: CategoryFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      {/* Remount the form each time the dialog opens so it starts from fresh values */}
      {props.open && <CategoryForm {...props} />}
    </Dialog>
  )
}

function CategoryForm({ category, defaultType, onClose, onSaved }: CategoryFormDialogProps) {
  const isEdit = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<CategoryType>(category?.type ?? defaultType)
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon] = useState<CategoryIconName>(category?.icon ?? 'label')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Show a custom colour (e.g. set via the API) alongside the palette
  const colors: readonly string[] = CATEGORY_COLORS.includes(color as (typeof CATEGORY_COLORS)[number])
    ? CATEGORY_COLORS
    : [...CATEGORY_COLORS, color]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const saved = category
        ? await updateCategory(category.id, { name, color, icon })
        : await createCategory({ name, type, color, icon })
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
      <DialogTitle>{isEdit ? 'Edit category' : 'Add category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ pt: 0.5 }}>
              <CategoryAvatar icon={icon} color={color} size={48} />
            </Box>
            <TextField
              label="Category name"
              placeholder="e.g. Pet care"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name?.[0]}
            />
          </Stack>

          {!isEdit && (
            <Stack spacing={1}>
              <FormLabel>Type</FormLabel>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={type}
                onChange={(_e, value: CategoryType | null) => value && setType(value)}
              >
                {CATEGORY_TYPES.map((t) => (
                  <ToggleButton key={t} value={t}>
                    {CATEGORY_TYPE_LABELS[t]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          )}

          <Stack spacing={1}>
            <FormLabel id="category-color-label">Colour</FormLabel>
            <Box role="radiogroup" aria-labelledby="category-color-label" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {colors.map((c) => (
                <ButtonBase
                  key={c}
                  role="radio"
                  aria-checked={c === color}
                  aria-label={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: c,
                    color: '#fff',
                    outline: c === color ? 2 : 0,
                    outlineColor: 'text.primary',
                    outlineOffset: 2,
                  }}
                >
                  {c === color && <Check fontSize="small" />}
                </ButtonBase>
              ))}
            </Box>
          </Stack>

          <Stack spacing={1}>
            <FormLabel id="category-icon-label">Icon</FormLabel>
            <Box
              role="radiogroup"
              aria-labelledby="category-icon-label"
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 1 }}
            >
              {CATEGORY_ICONS.map((i) => (
                <ButtonBase
                  key={i}
                  role="radio"
                  aria-checked={i === icon}
                  aria-label={i.replace(/_/g, ' ')}
                  onClick={() => setIcon(i)}
                  sx={{
                    height: 44,
                    borderRadius: 2,
                    border: 1,
                    borderColor: i === icon ? color : 'divider',
                    bgcolor: i === icon ? color : 'transparent',
                    color: i === icon ? '#fff' : 'text.secondary',
                  }}
                >
                  <CategoryIcon name={i} fontSize="small" />
                </ButtonBase>
              ))}
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submitting}>
          {isEdit ? 'Save' : 'Add category'}
        </Button>
      </DialogActions>
    </form>
  )
}
