import type { ActorId } from './actors'
import type { BookingDetails } from '../services/booking'

// Shared domain contracts for the next implementation steps. No patient records are seeded yet.
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed'
export type DriverStage = 'assigned' | 'going_to_pickup' | 'patient_onboard' | 'going_to_hospital' | 'delivered'
export interface DriverProgress { stage: DriverStage; events: { stage: DriverStage; at: string }[] }
export interface DemoSchedule {
  departureAt: string
  pickupAt: string
  arrivalAt: string
  endsAt: string
  centerToPickupMinutes: number
  pickupToHospitalMinutes: number
  preparationMinutes: 20
  calculation: 'demo-manual-v1'
}
export interface Booking { id: string; patientName: string; appointmentAt: string; status: BookingStatus; vehicleId?: string; driverId?: string; details?: BookingDetails; createdAt?: string; reviewedAt?: string; rejectionReason?: string; assignedAt?: string; schedule?: DemoSchedule; driverProgress?: DriverProgress }
export interface Vehicle { id: string; label: string; active: boolean }
export interface Driver { id: string; name: string; active: boolean }
export interface DemoState {
  version: 1
  selectedActor: ActorId | null
  bookings: Booking[]
  vehicles: Vehicle[]
  drivers: Driver[]
  dispatcherResourcesInitialized?: boolean
}
export function createSeedState(): DemoState {
  return { version: 1, selectedActor: null, bookings: [], vehicles: [], drivers: [] }
}
