export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// Matches the server's error format: { error: { message, details? } }
export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}

export type FieldErrors = Record<string, string[] | undefined>;
