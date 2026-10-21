import axios from 'axios'
import type { ApiErrorBody, FieldErrors } from '../types/api'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Called when an authenticated request gets a 401 (e.g. the session expired).
// Auth endpoints are excluded because they handle 401s themselves.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

export interface ParsedApiError {
  status: number | null
  message: string
  fieldErrors: FieldErrors
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false
  const { error } = data
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
}

function toFieldErrors(details: unknown): FieldErrors {
  if (typeof details !== 'object' || details === null) return {}
  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(details)) {
    if (Array.isArray(messages) && messages.every((m) => typeof m === 'string')) {
      result[field] = messages
    }
  }
  return result
}

export function parseApiError(err: unknown): ParsedApiError {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return { status: null, message: 'Unable to reach the server. Check your connection.', fieldErrors: {} }
    }
    const { status, data } = err.response
    if (isApiErrorBody(data)) {
      return { status, message: data.error.message, fieldErrors: toFieldErrors(data.error.details) }
    }
    return { status, message: `Request failed (${status})`, fieldErrors: {} }
  }
  return { status: null, message: 'Something went wrong. Please try again.', fieldErrors: {} }
}
