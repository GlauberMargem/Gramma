// Contratos espelhados dos schemas do backend (backend/app/models.py).

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserPublic {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  full_name: string | null;
  created_at: string | null;
}

export interface Message {
  message: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
}
