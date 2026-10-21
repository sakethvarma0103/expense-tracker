import { api } from './api'
import type { User } from '../types/api'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
}

interface UserResponse {
  user: User
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<UserResponse>('/auth/me')
  return data.user
}

export async function loginRequest(input: LoginInput): Promise<User> {
  const { data } = await api.post<UserResponse>('/auth/login', input)
  return data.user
}

export async function registerRequest(input: RegisterInput): Promise<User> {
  const { data } = await api.post<UserResponse>('/auth/register', input)
  return data.user
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}
