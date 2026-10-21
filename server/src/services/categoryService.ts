import { isValidObjectId } from 'mongoose';
import { HttpError, isDuplicateKeyError } from '../middleware/error';
import {
  Category,
  type CategoryDocument,
  type CategoryIcon,
  type CategoryType,
  type PublicCategory,
} from '../models/Category';
import { User } from '../models/User';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
  icon: CategoryIcon;
}

// Type can't change after creation: transactions will depend on it
export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, 'type'> & { archived: boolean }>;

const duplicateName = () => new HttpError(409, 'You already have a category with this name');

function toPublicCategory(category: CategoryDocument): PublicCategory {
  return {
    id: category.id as string,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    archived: category.archived,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

/**
 * Gives a user the default categories exactly once. Safe to call repeatedly and concurrently:
 * the user's categoriesSeededAt flag is claimed atomically before inserting.
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const claim = await User.updateOne(
    { _id: userId, categoriesSeededAt: { $exists: false } },
    { $set: { categoriesSeededAt: new Date() } },
  );
  if (claim.modifiedCount === 0) return;

  try {
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
      { ordered: false },
    );
  } catch (err) {
    // Duplicates mean the user already has a category with that name: fine to skip
    if (isDuplicateKeyError(err)) return;
    // Release the claim so seeding is retried next time
    await User.updateOne({ _id: userId }, { $unset: { categoriesSeededAt: 1 } });
    throw err;
  }
}

async function findOwnedCategory(userId: string, categoryId: string): Promise<CategoryDocument> {
  const category = isValidObjectId(categoryId)
    ? await Category.findOne({ _id: categoryId, userId })
    : null;
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }
  return category;
}

export async function listCategories(userId: string, type?: CategoryType): Promise<PublicCategory[]> {
  // Covers users created before default categories existed
  await ensureDefaultCategories(userId);
  const categories = await Category.find(type ? { userId, type } : { userId })
    .collation({ locale: 'en', strength: 2 })
    .sort({ type: 1, archived: 1, name: 1 });
  return categories.map(toPublicCategory);
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<PublicCategory> {
  try {
    return toPublicCategory(await Category.create({ ...input, userId }));
  } catch (err) {
    if (isDuplicateKeyError(err)) throw duplicateName();
    throw err;
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<PublicCategory> {
  const category = await findOwnedCategory(userId, categoryId);
  category.set(input);
  try {
    await category.save();
  } catch (err) {
    if (isDuplicateKeyError(err)) throw duplicateName();
    throw err;
  }
  return toPublicCategory(category);
}

// TODO: once transactions exist, refuse to delete categories that are in use (archive instead)
export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  const category = await findOwnedCategory(userId, categoryId);
  await category.deleteOne();
}
