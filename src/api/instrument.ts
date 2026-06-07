import http from './http'
import type { Category, Instrument, InstrumentCreateRequest, InstrumentUpdateRequest } from '@/types'

export const instrumentApi = {
  // 分类管理
  getCategories() {
    return http.get<Category[]>('/categories')
  },

  createCategory(name: string) {
    return http.post<Category>('/categories', { name })
  },

  updateCategory(id: number, name: string) {
    return http.put<Category>(`/categories/${id}`, { name })
  },

  deleteCategory(id: number) {
    return http.delete<{ message: string }>(`/categories/${id}`)
  },

  // 仪器管理
  getInstruments(params?: {
    category_id?: number
    status?: string
    keyword?: string
  }) {
    return http.get<Instrument[]>('/instruments', { params })
  },

  getInstrumentById(id: number) {
    return http.get<Instrument>(`/instruments/${id}`)
  },

  createInstrument(data: InstrumentCreateRequest) {
    return http.post<Instrument>('/instruments', data)
  },

  updateInstrument(id: number, data: InstrumentUpdateRequest) {
    return http.put<Instrument>(`/instruments/${id}`, data)
  },

  deleteInstrument(id: number) {
    return http.delete<{ message: string }>(`/instruments/${id}`)
  },
}
