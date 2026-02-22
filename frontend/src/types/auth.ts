export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "operator" | "viewer";
  is_active: boolean;
  created_at: string;
  last_login?: string;
}
