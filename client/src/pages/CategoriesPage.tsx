import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import {
  Alert,
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
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import Add from '@mui/icons-material/Add'
import Archive from '@mui/icons-material/Archive'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import Edit from '@mui/icons-material/Edit'
import MoreVert from '@mui/icons-material/MoreVert'
import Unarchive from '@mui/icons-material/Unarchive'
import { CategoryAvatar } from '../components/CategoryIcon'
import { CategoryFormDialog } from '../components/CategoryFormDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { parseApiError } from '../services/api'
import { deleteCategory, fetchCategories, updateCategory } from '../services/categoryService'
import { CATEGORY_TYPES, CATEGORY_TYPE_LABELS, type Category, type CategoryType } from '../types/category'

type FormState = { open: false } | { open: true; category?: Category }

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<CategoryType>('expense')
  const [form, setForm] = useState<FormState>({ open: false })
  const [menu, setMenu] = useState<{ anchor: HTMLElement; category: Category } | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      setCategories(await fetchCategories())
    } catch (err) {
      setLoadError(parseApiError(err).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const ofType = categories?.filter((c) => c.type === tab) ?? []
  const active = ofType.filter((c) => !c.archived)
  const archived = ofType.filter((c) => c.archived)
  const activeCount = (type: CategoryType) =>
    categories?.filter((c) => c.type === type && !c.archived).length ?? 0

  const openMenu = (e: MouseEvent<HTMLElement>, category: Category) =>
    setMenu({ anchor: e.currentTarget, category })

  const handleSaved = (saved: Category) => {
    const isEdit = form.open && Boolean(form.category)
    setForm({ open: false })
    setTab(saved.type)
    setToast({ message: isEdit ? 'Category updated' : 'Category added', severity: 'success' })
    void load()
  }

  const toggleArchive = async (category: Category) => {
    setMenu(null)
    try {
      await updateCategory(category.id, { archived: !category.archived })
      setToast({ message: category.archived ? 'Category restored' : 'Category archived', severity: 'success' })
      await load()
    } catch (err) {
      setToast({ message: parseApiError(err).message, severity: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteCategory(toDelete.id)
      setToDelete(null)
      setToast({ message: 'Category deleted', severity: 'success' })
      await load()
    } catch (err) {
      setToast({ message: parseApiError(err).message, severity: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const renderRow = (category: Category) => (
    <ListItem
      key={category.id}
      divider
      secondaryAction={
        <IconButton edge="end" aria-label={`Actions for ${category.name}`} onClick={(e) => openMenu(e, category)}>
          <MoreVert />
        </IconButton>
      }
      sx={{ '& > :not(.MuiListItemSecondaryAction-root)': { opacity: category.archived ? 0.6 : 1 } }}
    >
      <ListItemAvatar>
        <CategoryAvatar icon={category.icon} color={category.color} />
      </ListItemAvatar>
      <ListItemText primary={category.name} slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }} />
    </ListItem>
  )

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Categories
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ open: true })}>
          Add category
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

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_e, value: CategoryType) => setTab(value)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {CATEGORY_TYPES.map((t) => (
            <Tab key={t} value={t} label={categories ? `${CATEGORY_TYPE_LABELS[t]} (${activeCount(t)})` : CATEGORY_TYPE_LABELS[t]} />
          ))}
        </Tabs>

        {categories === null && !loadError && (
          <Stack sx={{ p: 2 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={56} />
            ))}
          </Stack>
        )}

        {categories && ofType.length === 0 && (
          <Stack sx={{ p: { xs: 3, sm: 5 }, alignItems: 'center', textAlign: 'center' }} spacing={2}>
            <Typography color="text.secondary">
              No {CATEGORY_TYPE_LABELS[tab].toLowerCase()} categories yet.
            </Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setForm({ open: true })}>
              Add {CATEGORY_TYPE_LABELS[tab].toLowerCase()} category
            </Button>
          </Stack>
        )}

        {active.length > 0 && <List disablePadding>{active.map(renderRow)}</List>}
        {archived.length > 0 && (
          <List disablePadding subheader={<ListSubheader>Archived</ListSubheader>}>
            {archived.map(renderRow)}
          </List>
        )}
      </Paper>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) setForm({ open: true, category: menu.category })
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => menu && void toggleArchive(menu.category)}>
          <ListItemIcon>
            {menu?.category.archived ? <Unarchive fontSize="small" /> : <Archive fontSize="small" />}
          </ListItemIcon>
          {menu?.category.archived ? 'Restore' : 'Archive'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) setToDelete(menu.category)
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

      <CategoryFormDialog
        open={form.open}
        category={form.open ? form.category : undefined}
        defaultType={tab}
        onClose={() => setForm({ open: false })}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete category?"
        message={
          <>
            <strong>{toDelete?.name}</strong> will be permanently deleted. To hide it but keep it on past
            transactions, archive it instead.
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
    </Stack>
  )
}
