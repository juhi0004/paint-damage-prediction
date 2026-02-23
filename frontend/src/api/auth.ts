import api from "./http";
import type { LoginRequest, Token, User } from "../types/auth";

export async function login(credentials: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>(
    "/auth/login",
    {
      email: credentials.email,
      password: credentials.password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return data;
}
export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
