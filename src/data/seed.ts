import type { ActorId } from './actors'
import type { BookingDetails } from '../services/booking'

// Shared domain contracts for the next implementation steps. No patient records are seeded yet.
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed'
export interface Booking { id: string; patientName: string; appointmentAt: string; status: BookingStatus; vehicleId?: string; driverId?: string; details?: BookingDetails; createdAt?: string }
export interface Vehicle { id: string; label: string; active: boolean }
export interface Driver { id: string; name: string; active: boolean }
export interface DemoState {
  version: 1
  selectedActor: ActorId | null
  bookings: Booking[]
  vehicles: Vehicle[]
  drivers: Driver[]
}
export function createSeedState(): DemoState {
  return { version: 1, selectedActor: null, bookings: [], vehicles: [], drivers: [] }
}
