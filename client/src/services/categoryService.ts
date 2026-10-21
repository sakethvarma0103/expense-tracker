import { api } from './api'
import type { Category, CategoryIconName, CategoryType } from '../types/category'

export interface CategoryInput {
  name: string
  type: CategoryType
  color: string
  icon: CategoryIconName
}

/** Type can't be changed after a category is created */
export type CategoryUpdate = Partial<Omit<CategoryInput, 'type'> & { archived: boolean }>

export async function fetchCategories(type?: CategoryType): Promise<Category[]> {
  const { data } = await api.get<{ categories: Category[] }>('/categories', { params: { type } })
  return data.categories
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await api.post<{ category: Category }>('/categories', input)
  return data.category
}

export async function updateCategory(id: string, update: CategoryUpdate): Promise<Category> {
  const { data } = await api.patch<{ category: Category }>(`/categories/${id}`, update)
  return data.category
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`)
}
