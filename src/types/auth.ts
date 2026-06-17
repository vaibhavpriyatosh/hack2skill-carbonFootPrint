// ─── Auth Types ─────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
}

export interface AuthFormState {
  errors?: {
    username?: string[];
    password?: string[];
    name?: string[];
    general?: string[];
  };
  message?: string;
  success?: boolean;
}
