import { useEffect, useState } from 'react'
import { appointmentTimestamp, bangkokDate, LEAD_TIME_MS, meetsLeadTime, thaiDate } from '../services/booking'
import { BookingButton, BookingModal } from './BookingUI'

const pad = (n: number) => String(n).padStart(2, '0')
export function AppointmentPicker({ kind, date, time, onConfirm, onClose }: { kind: 'date' | 'time'; date: string; time: string; onConfirm: (value: string) => void; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const minimum = bangkokDate(now + LEAD_TIME_MS)
  const [selectedDate, setSelectedDate] = useState(date || minimum)
  const [month, setMonth] = useState((date || minimum).slice(0, 7))
  const [hour, setHour] = useState(Number((time || '10:30').slice(0, 2)))
  const [minute, setMinute] = useState(Number((time || '10:30').slice(3)))
  const selectedTime = `${pad(hour)}:${pad(minute)}`
  const invalid = kind === 'date'
    ? selectedDate < minimum || (!!time && !meetsLeadTime(selectedDate, time, now))
    : !!date && !meetsLeadTime(date, selectedTime, now)
  const [year, monthNumber] = month.split('-').map(Number)
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay()
  function moveMonth(delta: number) {
    const d = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`)
  }
  function confirm() {
    const currentTime = Date.now()
    const valid = kind === 'date' ? selectedDate >= bangkokDate(currentTime + LEAD_TIME_MS) && (!time || meetsLeadTime(selectedDate, time, currentTime)) : !date || meetsLeadTime(date, selectedTime, currentTime)
    if (!valid) { setNow(currentTime); return }
    onConfirm(kind === 'date' ? selectedDate : selectedTime)
  }
  function wheel(label: string, value: number, maximum: number, change: (value: number) => void) {
    return <div className="booking-wheel-column"><label>{label}<select aria-label={label} value={value} onChange={e => change(Number(e.target.value))}>{Array.from({ length: maximum }, (_, n) => <option key={n} value={n}>{pad(n)}</option>)}</select></label><div role="group" aria-label={`วงล้อ${label}`} className="booking-wheel" onWheel={e => change((value + (e.deltaY > 0 ? 1 : maximum - 1)) % maximum)}>{[-2, -1, 0, 1, 2].map(offset => { const n = (value + offset + maximum) % maximum; return <button type="button" key={offset} aria-label={`${label} ${pad(n)}`} aria-pressed={offset === 0} className={offset === 0 ? 'selected' : ''} onClick={() => change(n)}>{pad(n)}</button> })}</div></div>
  }
  return <BookingModal title={kind === 'date' ? 'เลือกวันนัดหมาย' : 'เลือกเวลานัดหมาย'} onClose={onClose}>
    <p className="booking-picker-hint">{kind === 'date' ? 'เลือกวันและเวลาให้ห่างอย่างน้อย 48 ชม.' : 'เลือกเวลา (00:00–23:59)'}</p>
    {kind === 'date' ? <><div className="booking-calendar-month"><button type="button" aria-label="เดือนก่อนหน้า" onClick={() => moveMonth(-1)}>‹</button><h3 aria-live="polite">{new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`))}</h3><button type="button" aria-label="เดือนถัดไป" onClick={() => moveMonth(1)}>›</button></div><div className="booking-calendar" role="group" aria-label="วันที่นัดหมาย">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => <span className="weekday" key={i}>{d}</span>)}{Array.from({ length: firstDay }, (_, n) => <span key={`blank-${n}`} />)}{Array.from({ length: dayCount }, (_, n) => { const value = `${month}-${pad(n + 1)}`; const disabled = appointmentTimestamp(value, '23:59') < now + LEAD_TIME_MS; return <button type="button" key={value} disabled={disabled} aria-label={thaiDate(value, true)} aria-pressed={selectedDate === value} className={selectedDate === value ? 'selected' : ''} onClick={() => setSelectedDate(value)}>{n + 1}</button> })}</div></> : <div className="booking-wheels">{wheel('ชั่วโมง', hour, 24, setHour)}<span aria-hidden="true">:</span>{wheel('นาที', minute, 60, setMinute)}</div>}
    {invalid && <p role="alert" className="booking-error-box">{kind === 'date' ? 'วัน/เวลานัดต้องห่างอย่างน้อย 48 ชั่วโมง' : 'เวลานี้ไม่ผ่านเงื่อนไขจองล่วงหน้า 48 ชม.'}</p>}
    <p className="booking-picker-value" aria-live="polite">{kind === 'date' ? thaiDate(selectedDate, true) : `${selectedTime} น.`}</p>
    <div className="booking-modal-actions"><BookingButton secondary onClick={onClose}>ยกเลิก</BookingButton><BookingButton disabled={invalid} onClick={confirm}>{kind === 'date' ? 'ยืนยันวันที่' : 'ยืนยันเวลา'}</BookingButton></div>
  </BookingModal>
}

