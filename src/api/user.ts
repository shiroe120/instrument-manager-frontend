import http from './http'
import type { User, UserUpdateRequest, PasswordChangeRequest } from '@/types'

export const userApi = {
  updateProfile(data: UserUpdateRequest) {
    return http.put<User>('/users/me', data)
  },

  changePassword(data: PasswordChangeRequest) {
    return http.put<{ message: string }>('/users/me/password', data)
  },
}
