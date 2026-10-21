export const CATEGORY_TYPES = ['expense', 'income'] as const
export type CategoryType = (typeof CATEGORY_TYPES)[number]

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Expense',
  income: 'Income',
}

// Keep in sync with server/src/models/Category.ts
export const CATEGORY_ICONS = [
  'restaurant', 'local_cafe', 'local_bar', 'shopping_cart', 'shopping_bag', 'checkroom',
  'directions_bus', 'local_gas_station', 'flight', 'home', 'bolt', 'wifi',
  'phone_android', 'build', 'local_hospital', 'fitness_center', 'spa', 'school',
  'child_care', 'pets', 'movie', 'sports_esports', 'card_giftcard', 'volunteer_activism',
  'account_balance', 'work', 'storefront', 'savings', 'trending_up', 'replay',
  'label', 'category',
] as const
export type CategoryIconName = (typeof CATEGORY_ICONS)[number]

export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#ca8a04', '#22c55e', '#16a34a', '#14b8a6',
  '#0d9488', '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb', '#8b5cf6',
  '#7c3aed', '#a855f7', '#ec4899', '#64748b', '#78716c',
] as const

export interface Category {
  id: string
  name: string
  type: CategoryType
  /** Hex colour, e.g. "#22c55e" */
  color: string
  icon: CategoryIconName
  archived: boolean
  createdAt: string
  updatedAt: string
}
