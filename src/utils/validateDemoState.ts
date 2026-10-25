import { isActorId } from '../data/actors'
import type { DemoState } from '../data/seed'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
function validDetails(value: unknown) {
  if (!record(value) || !['self', 'other'].includes(String(value.bookingFor)) || typeof value.acknowledged !== 'boolean') return false
  if (!['patientName', 'contactName', 'phone', 'relationship', 'hospital', 'date', 'time', 'assistance'].every(key => typeof value[key] === 'string')) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value.date)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.time)) || !Number.isFinite(Date.parse(`${value.date}T${value.time}:00+07:00`))) return false
  if (!Array.isArray(value.extras) || !value.extras.every(x => typeof x === 'string')) return false
  const pin = value.pickup
  return pin === null || (record(pin) && typeof pin.label === 'string' && typeof pin.x === 'number' && typeof pin.y === 'number' && Number.isFinite(pin.x) && Number.isFinite(pin.y) && pin.x >= 0 && pin.x <= 100 && pin.y >= 0 && pin.y <= 100)
}
export function isDemoState(value: unknown): value is DemoState {
  if (!record(value) || value.version !== 1 || !(value.selectedActor === null || isActorId(value.selectedActor))) return false
  return Array.isArray(value.bookings) && value.bookings.every(b => record(b) && typeof b.id === 'string' && typeof b.patientName === 'string' && typeof b.appointmentAt === 'string' && Number.isFinite(Date.parse(b.appointmentAt)) && ['pending', 'approved', 'rejected', 'in_transit', 'completed'].includes(String(b.status)) && (b.vehicleId === undefined || typeof b.vehicleId === 'string') && (b.driverId === undefined || typeof b.driverId === 'string') && (b.details === undefined || validDetails(b.details)) && (b.createdAt === undefined || typeof b.createdAt === 'string'))
    && Array.isArray(value.vehicles) && value.vehicles.every(v => record(v) && typeof v.id === 'string' && typeof v.label === 'string' && typeof v.active === 'boolean')
    && Array.isArray(value.drivers) && value.drivers.every(d => record(d) && typeof d.id === 'string' && typeof d.name === 'string' && typeof d.active === 'boolean')
}
