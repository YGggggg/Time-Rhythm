import api from './client'
import type { ApiResponse, User } from '../types'

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; username: string; password: string }
interface TokenResponse { access_token: string; token_type: string }

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<ApiResponse<TokenResponse>>('/auth/login', data).then((r) => r.data),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
}
