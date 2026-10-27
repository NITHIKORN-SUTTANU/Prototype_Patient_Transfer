import { useState } from 'react'
import type { Booking, DemoSchedule, DemoState } from '../data/seed'
import { assignBooking, checkAssignment, DEFAULT_DEMO_TRAVEL, dispatchDate, dispatchTime, makeDemoSchedule } from '../services/dispatch'
import { DispatchButton, DispatchModal, ResourcePicker } from './DispatcherUI'

export function ScheduleSummary({ booking, schedule }: { booking: Booking; schedule: DemoSchedule }) {
  return <div className="dispatch-schedule-summary"><p>เวลานัดหมาย</p><strong>{dispatchTime(booking.appointmentAt)} น.</strong><p>ออกศูนย์ {dispatchTime(schedule.departureAt)} · รับ {dispatchTime(schedule.pickupAt)} · ถึง รพ. {dispatchTime(schedule.arrivalAt)}</p><b>นัด {dispatchTime(booking.appointmentAt)} · เผื่อก่อนนัด 20 นาที · เวลาจำลอง</b></div>
}
export function DispatchAssignment({ booking, state, onAssigned }: { booking: Booking; state: DemoState; onAssigned: () => void }) {
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [center, setCenter] = useState(String(DEFAULT_DEMO_TRAVEL.centerToPickupMinutes))
  const [hospital, setHospital] = useState(String(DEFAULT_DEMO_TRAVEL.pickupToHospitalMinutes))
  const [dialog, setDialog] = useState<'ready' | 'conflict' | 'confirm' | null>(null)
  const [error, setError] = useState('')
  let schedule: DemoSchedule | null = null
  let scheduleIssue = ''
  try { schedule = makeDemoSchedule(booking, center.trim() ? Number(center) : NaN, hospital.trim() ? Number(hospital) : NaN) }
  catch (e) { scheduleIssue = (e as Error).message }
  const check = schedule ? checkAssignment(state, booking, vehicleId, driverId, schedule) : null
  const selected = !!vehicleId && !!driverId
  function inspect() {
    setError('')
    if (!selected) { setError('กรุณาเลือกรถรับส่งและคนขับก่อนตรวจสอบ'); return }
    if (!schedule) { setError(scheduleIssue); return }
    setDialog(check?.ready ? 'ready' : 'conflict')
  }
  function confirm() {
    try { assignBooking(booking.id, vehicleId, driverId, Number(center), Number(hospital)); setDialog(null); onAssigned() }
    catch (e) { setError((e as Error).message); setDialog('conflict') }
  }
  const changeVehicle = (id: string) => { setVehicleId(id); setError('') }
  const changeDriver = (id: string) => { setDriverId(id); setError('') }
  return <section className="dispatch-panel dispatch-assignment-form">
    <h2>2 ตารางเวลาเดินทางที่ระบบคำนวณ</h2>
    {schedule ? <ScheduleSummary booking={booking} schedule={schedule} /> : <p className="dispatch-alert" role="alert">{scheduleIssue}</p>}
    <h2>3 เลือกรถและคนขับ</h2><div className="dispatch-resource-row"><ResourcePicker label="รถรับส่ง" placeholder="เลือกรถ" value={vehicleId} options={state.vehicles} onChange={changeVehicle} /><ResourcePicker label="คนขับ" placeholder="เลือกคนขับ" value={driverId} options={state.drivers.map(d => ({ ...d, label: d.name }))} onChange={changeDriver} /></div>
    <h2>4 ตรวจสอบความพร้อม</h2>
    <div className={`dispatch-availability ${selected && check?.ready ? 'ready' : ''}`} aria-live="polite"><strong>{!selected ? 'ตรวจสอบตารางอัตโนมัติเมื่อเลือกรถและคนขับ' : check?.ready ? '✓ รถและคนขับพร้อมรับงาน' : check?.conflicts.length ? '! พบ Schedule Conflict' : 'ทรัพยากรหรือข้อมูลไม่พร้อม'}</strong><p>{!selected ? 'ตรวจสอบช่วงใช้งานรถและคนขับ รวม Buffer 20 นาที' : check?.ready ? 'ไม่พบช่วงเวลาซ้อนกันในข้อมูลสาธิตที่บันทึกไว้' : [...(check?.issues || []), ...(check?.conflicts.map(c => `${c.booking.id}: ${[c.vehicle ? 'รถ' : '', c.driver ? 'คนขับ' : ''].filter(Boolean).join(' / ')}มีงานซ้อนกัน`) || []), scheduleIssue].filter(Boolean).join(' · ')}</p></div>
    {error && <p className="dispatch-alert" role="alert">{error}</p>}
    <DispatchButton onClick={inspect}>ตรวจสอบซ้ำและยืนยันการมอบหมาย</DispatchButton>
    <details className="dispatch-demo-calculation"><summary>เวลาเดินทางจำลอง · ไม่มีการคำนวณเส้นทางจริง</summary><p>ค่าเริ่มต้นจากตัวอย่าง Figma ปรับได้เพื่อสาธิตเท่านั้น เผื่อก่อนนัดคงที่ 20 นาที</p><div><label>ศูนย์ → จุดรับ (นาที)<input type="number" min="0" step="1" value={center} onChange={e => { setCenter(e.target.value); setError('') }} /></label><label>จุดรับ → โรงพยาบาล (นาที)<input type="number" min="0" step="1" value={hospital} onChange={e => { setHospital(e.target.value); setError('') }} /></label></div><p>ตรวจสอบช่วง [ออกศูนย์, เวลานัด) เท่านั้น ไม่รวมเที่ยวกลับหรือเวลาบริการที่ยังไม่มีข้อกำหนด</p>{schedule && <p>ช่วงตรวจสอบ: {dispatchDate(schedule.departureAt)} {dispatchTime(schedule.departureAt)} → {dispatchDate(schedule.endsAt)} {dispatchTime(schedule.endsAt)}</p>}</details>
    {dialog === 'ready' && schedule && <DispatchModal title="✓ รถและคนขับพร้อมรับงาน" kind="dispatch-ready-modal" onClose={() => setDialog(null)}><p className="dispatch-muted">ผลตรวจสอบข้อมูลสาธิต · ไม่ใช่ตารางเดินรถจริง</p><section className="dispatch-result-card"><h3>งาน {booking.id} · {dispatchDate(booking.appointmentAt)}</h3><p>รถรับส่ง {state.vehicles.find(v => v.id === vehicleId)?.label}</p><p>คนขับ {state.drivers.find(d => d.id === driverId)?.name}</p><p>ออกศูนย์ {dispatchTime(schedule.departureAt)} · รับ {dispatchTime(schedule.pickupAt)} · ถึง รพ. {dispatchTime(schedule.arrivalAt)}</p><strong>นัด {dispatchTime(booking.appointmentAt)} · เผื่อก่อนนัด 20 นาที</strong><p className="dispatch-small">เวลาเดินทางจำลอง · ตรวจสอบตารางรถ/คนขับรวม Buffer</p></section><div className="dispatch-dialog-actions"><DispatchButton onClick={() => setDialog('confirm')}>ยืนยันการมอบหมาย</DispatchButton><DispatchButton secondary onClick={() => setDialog(null)}>กลับไปแก้ไข</DispatchButton></div></DispatchModal>}
    {dialog === 'conflict' && <DispatchModal title={check?.conflicts.length ? '! พบ Schedule Conflict' : 'ไม่สามารถมอบหมายงานได้'} kind="dispatch-conflict-modal" onClose={() => setDialog(null)}><p className="dispatch-muted">ผลตรวจสอบข้อมูลสาธิตปัจจุบัน</p><section className="dispatch-result-card warning"><h3>{check?.conflicts.length ? 'พบงานที่ใช้ทรัพยากรซ้อนกัน' : 'กรุณาตรวจสอบทรัพยากรและข้อมูลคำขอ'}</h3>{check?.issues.map(issue => <p key={issue}>{issue}</p>)}{check?.conflicts.map(c => <p key={c.booking.id}>{c.booking.id} · {[c.vehicle ? state.vehicles.find(v => v.id === vehicleId)?.label : '', c.driver ? state.drivers.find(d => d.id === driverId)?.name : ''].filter(Boolean).join(' / ')} มีงานในช่วงเวลาที่ต้องใช้งาน</p>)}{error && <p role="alert">{error}</p>}<p>ช่วงงานรวมเวลาเดินทางจำลองและ Buffer 20 นาที</p><p>เลือกรถหรือคนขับอื่น ระบบจะตรวจสอบใหม่</p></section><DispatchButton onClick={() => setDialog(null)}>กลับไปเปลี่ยนรถหรือคนขับ</DispatchButton></DispatchModal>}
    {dialog === 'confirm' && <DispatchModal title="ยืนยันการมอบหมายงาน?" kind="dispatch-confirm-modal" onClose={() => setDialog(null)}><p>งาน {booking.id} จะถูกมอบหมายให้รถและคนขับที่เลือก</p><p className="dispatch-muted">ตรวจสอบ Conflict ซ้ำก่อนบันทึกการมอบหมาย</p><div className="dispatch-dialog-actions"><DispatchButton onClick={confirm}>ยืนยันการมอบหมาย</DispatchButton><DispatchButton secondary onClick={() => setDialog(null)}>ยกเลิก</DispatchButton></div></DispatchModal>}
  </section>
}

