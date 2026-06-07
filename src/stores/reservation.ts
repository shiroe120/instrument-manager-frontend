import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reservationApi } from '@/api'
import type { Reservation, CreateReservationRequest, CreateReservationResponse } from '@/types'

export const useReservationStore = defineStore('reservation', () => {
  const reservations = ref<Reservation[]>([])
  const loading = ref(false)

  async function fetchReservations(params?: { status?: string; date_from?: string; date_to?: string }): Promise<Reservation[]> {
    loading.value = true
    try {
      const res = await reservationApi.getReservations(params)
      reservations.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createReservation(data: CreateReservationRequest): Promise<CreateReservationResponse> {
    const res = await reservationApi.createReservation(data)
    return res.data
  }

  async function cancelReservation(id: number) {
    await reservationApi.cancelReservation(id)
  }

  async function approveReservation(id: number, remark?: string) {
    await reservationApi.approveReservation(id, remark ? { remark } : undefined)
  }

  async function rejectReservation(id: number, remark?: string) {
    await reservationApi.rejectReservation(id, remark ? { remark } : undefined)
  }

  return { reservations, loading, fetchReservations, createReservation, cancelReservation, approveReservation, rejectReservation }
})
