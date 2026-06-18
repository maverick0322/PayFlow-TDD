export interface UserInfo {
  id: number;
  email: string;
  nombre: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

export interface RegisterRequest {
  email: string;
  nombre: string;
  password: string;
  saldo_inicial?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}
