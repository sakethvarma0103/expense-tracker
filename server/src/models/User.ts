import { Schema, model, type HydratedDocument } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  /** Set once the default categories have been created for this user */
  categoriesSeededAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    categoriesSeededAt: { type: Date },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<IUser>;

export const User = model<IUser>('User', userSchema);

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
