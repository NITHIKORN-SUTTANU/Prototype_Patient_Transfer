import { isActorId } from '../data/actors'
import type { DemoState } from '../data/seed'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const timestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
function validDriverProgress(booking: Record<string, unknown>) {
  const progress = booking.driverProgress
  if (progress === undefined) return true
  if (!record(progress) || !Array.isArray(progress.events) || !booking.schedule) return false
  const stages = ['assigned', 'going_to_pickup', 'patient_onboard', 'going_to_hospital', 'delivered']
  const index = stages.indexOf(String(progress.stage))
  if (index < 0 || booking.status !== (index === 0 ? 'approved' : index === 4 ? 'completed' : 'in_transit')) return false
  let previous = 0
  let time = -Infinity
  for (const event of progress.events) {
    if (!record(event) || !timestamp(event.at)) return false
    const step = stages.indexOf(String(event.stage))
    const at = Date.parse(String(event.at))
    if (step <= previous || step > index || at < time) return false
    previous = step; time = at
  }
  return index === 0 ? progress.events.length === 0 : previous === index
}
function validSchedule(value: unknown, appointmentAt: string) {
  if (!record(value) || value.calculation !== 'demo-manual-v1' || value.preparationMinutes !== 20) return false
  if (!['departureAt', 'pickupAt', 'arrivalAt', 'endsAt'].every(key => timestamp(value[key]))) return false
  const center = value.centerToPickupMinutes
  const hospital = value.pickupToHospitalMinutes
  if (typeof center !== 'number' || typeof hospital !== 'number' || !Number.isSafeInteger(center) || !Number.isSafeInteger(hospital) || center < 0 || hospital < 0) return false
  const departure = Date.parse(String(value.departureAt))
  const pickup = Date.parse(String(value.pickupAt))
  const arrival = Date.parse(String(value.arrivalAt))
  const end = Date.parse(String(value.endsAt))
  return end === Date.parse(appointmentAt) && end - arrival === 20 * 60000 && arrival - pickup === hospital * 60000 && pickup - departure === center * 60000
}
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
  if (!Array.isArray(value.bookings) || !value.bookings.every(b => record(b) && validDriverProgress(b))) return false
  return (value.dispatcherResourcesInitialized === undefined || typeof value.dispatcherResourcesInitialized === 'boolean') && Array.isArray(value.bookings) && value.bookings.every(b => record(b) && typeof b.id === 'string' && typeof b.patientName === 'string' && typeof b.appointmentAt === 'string' && Number.isFinite(Date.parse(b.appointmentAt)) && ['pending', 'approved', 'rejected', 'in_transit', 'completed'].includes(String(b.status)) && (b.vehicleId === undefined || typeof b.vehicleId === 'string') && (b.driverId === undefined || typeof b.driverId === 'string') && (b.details === undefined || validDetails(b.details)) && (b.createdAt === undefined || timestamp(b.createdAt)) && (b.reviewedAt === undefined || timestamp(b.reviewedAt)) && (b.assignedAt === undefined || timestamp(b.assignedAt)) && (b.rejectionReason === undefined || typeof b.rejectionReason === 'string') && (b.schedule === undefined || (typeof b.vehicleId === 'string' && typeof b.driverId === 'string' && validSchedule(b.schedule, b.appointmentAt))))
    && Array.isArray(value.vehicles) && value.vehicles.every(v => record(v) && typeof v.id === 'string' && typeof v.label === 'string' && typeof v.active === 'boolean')
    && Array.isArray(value.drivers) && value.drivers.every(d => record(d) && typeof d.id === 'string' && typeof d.name === 'string' && typeof d.active === 'boolean')
}
