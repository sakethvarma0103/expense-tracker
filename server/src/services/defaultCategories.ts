import type { CategoryIcon, CategoryType } from '../models/Category';

interface DefaultCategory {
  name: string;
  type: CategoryType;
  color: string;
  icon: CategoryIcon;
}

// Starter set every new user gets; they can rename, recolour or archive these
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { type: 'expense', name: 'Food & Dining', icon: 'restaurant', color: '#ef4444' },
  { type: 'expense', name: 'Groceries', icon: 'shopping_cart', color: '#22c55e' },
  { type: 'expense', name: 'Transport', icon: 'directions_bus', color: '#3b82f6' },
  { type: 'expense', name: 'Fuel', icon: 'local_gas_station', color: '#f97316' },
  { type: 'expense', name: 'Rent', icon: 'home', color: '#8b5cf6' },
  { type: 'expense', name: 'Bills & Utilities', icon: 'bolt', color: '#ca8a04' },
  { type: 'expense', name: 'Shopping', icon: 'shopping_bag', color: '#ec4899' },
  { type: 'expense', name: 'Health', icon: 'local_hospital', color: '#14b8a6' },
  { type: 'expense', name: 'Entertainment', icon: 'movie', color: '#a855f7' },
  { type: 'expense', name: 'Education', icon: 'school', color: '#0ea5e9' },
  { type: 'expense', name: 'Travel', icon: 'flight', color: '#06b6d4' },
  { type: 'expense', name: 'EMI & Loans', icon: 'account_balance', color: '#64748b' },
  { type: 'expense', name: 'Other', icon: 'category', color: '#78716c' },
  { type: 'income', name: 'Salary', icon: 'work', color: '#16a34a' },
  { type: 'income', name: 'Business', icon: 'storefront', color: '#0d9488' },
  { type: 'income', name: 'Interest', icon: 'savings', color: '#2563eb' },
  { type: 'income', name: 'Refunds', icon: 'replay', color: '#7c3aed' },
  { type: 'income', name: 'Other', icon: 'category', color: '#78716c' },
];
