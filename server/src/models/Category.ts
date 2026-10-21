import { Schema, Types, model, type HydratedDocument } from 'mongoose';

export const CATEGORY_TYPES = ['expense', 'income'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

// Icon keys the client knows how to render. Keep in sync with client/src/types/category.ts
export const CATEGORY_ICONS = [
  'restaurant', 'local_cafe', 'local_bar', 'shopping_cart', 'shopping_bag', 'checkroom',
  'directions_bus', 'local_gas_station', 'flight', 'home', 'bolt', 'wifi',
  'phone_android', 'build', 'local_hospital', 'fitness_center', 'spa', 'school',
  'child_care', 'pets', 'movie', 'sports_esports', 'card_giftcard', 'volunteer_activism',
  'account_balance', 'work', 'storefront', 'savings', 'trending_up', 'replay',
  'label', 'category',
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export interface ICategory {
  userId: Types.ObjectId;
  name: string;
  type: CategoryType;
  color: string;
  icon: CategoryIcon;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    type: { type: String, enum: CATEGORY_TYPES, required: true },
    color: { type: String, required: true, match: HEX_COLOR },
    icon: { type: String, enum: CATEGORY_ICONS, required: true },
    archived: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// Names are unique per user and type, case-insensitively ("Other" can exist as both expense and income)
categorySchema.index(
  { userId: 1, type: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export type CategoryDocument = HydratedDocument<ICategory>;

export const Category = model<ICategory>('Category', categorySchema);

export interface PublicCategory {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: CategoryIcon;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
