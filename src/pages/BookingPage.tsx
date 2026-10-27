import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AppointmentPicker } from '../components/AppointmentPicker'
import { BookingButton, BookingCard, BookingHeader, BookingIcon, BookingModal, BookingProgress, EmergencyLink } from '../components/BookingUI'
import { appointmentTimestamp, emptyBooking, thaiDate, validatePatient } from '../services/booking'
import type { BookingDetails } from '../services/booking'
import { demoStore, useDemoState } from '../services/demoStore'
import { dispatchDate, dispatchTime } from '../services/dispatch'
import type { Booking, BookingStatus } from '../data/seed'
import '../booking.css'

const statusLabels: Record<BookingStatus, string> = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ', in_transit: 'กำลังเดินทาง', completed: 'เสร็จสิ้น' }
const backgrounds: Record<string, string> = { '': 'd9e5f', privacy: '306a3', patient: '6230a', assistance: '40b1e', review: '3a66d', submitted: '0c883', status: '43b8b' }
export function BookingPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const path = pathname.replace(/^\/booking\/?/, '').split('/')
  const screen = path[0]
  const { state, storageAvailable } = useDemoState()
  const [draft, setDraft] = useState<BookingDetails>(emptyBooking)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [picker, setPicker] = useState<'date' | 'time' | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [pin, setPin] = useState<BookingDetails['pickup']>(null)
  const [sending, setSending] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const sendingRef = useRef(false)
  const submittedId = useRef<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const saved = state.bookings.find(b => b.id === path[1])
  const go = (next = '') => { setErrors({}); navigate(`/booking${next ? `/${next}` : ''}`) }
  const update = <K extends keyof BookingDetails>(key: K, value: BookingDetails[K]) => {
    setDraft(d => ({ ...d, [key]: value }))
    setErrors(e => { const next = { ...e }; delete next[key]; return next })
  }
  useEffect(() => { window.scrollTo(0, 0); root.current?.querySelector<HTMLHeadingElement>('h1')?.focus() }, [pathname])
  function showErrors(next: Record<string, string>) {
    setErrors(next)
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }
  function patientNext() {
    const next = validatePatient(draft)
    if (Object.keys(next).length) showErrors(next)
    else go('assistance')
  }
  function assistanceNext() {
    if (!draft.pickup) { showErrors({ pickup: 'กรุณาเลือกจุดรับก่อนดำเนินการ' }); return }
    go('review')
  }
  async function submit() {
    if (sendingRef.current) return
    if (submittedId.current) { go(`submitted/${submittedId.current}`); return }
    const next = validatePatient(draft)
    if (Object.keys(next).length) { go('patient'); showErrors(next); return }
    if (!draft.acknowledged) { go('privacy'); return }
    if (!draft.pickup) { go('assistance'); showErrors({ pickup: 'กรุณาเลือกจุดรับก่อนดำเนินการ' }); return }
    sendingRef.current = true
    setSending(true)
    setSaveError(false)
    // Yield a paint so the reference's submitting state is announced before the local save.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    try {
      const latestErrors = validatePatient(draft)
      if (Object.keys(latestErrors).length) { go('patient'); showErrors(latestErrors); return }
      let id = ''
      demoStore.update(current => {
        const serial = current.bookings.reduce((max, b) => Math.max(max, Number(b.id.replace('BK-', '')) || 0), 0) + 1
        id = `BK-${String(serial).padStart(4, '0')}`
        const details = { ...draft, patientName: draft.patientName.trim(), contactName: draft.bookingFor === 'self' ? '' : draft.contactName.trim(), relationship: draft.bookingFor === 'self' ? '' : draft.relationship, phone: draft.phone.replace(/[\s-]/g, ''), extras: [...draft.extras] }
        const booking: Booking = { id, patientName: details.patientName, appointmentAt: new Date(appointmentTimestamp(draft.date, draft.time)).toISOString(), status: 'pending', details, createdAt: new Date().toISOString() }
        return { ...current, bookings: [...current.bookings, booking] }
      })
      submittedId.current = id
      go(`submitted/${id}`)
    } catch { setSaveError(true) }
    finally { setSending(false); sendingRef.current = false }
  }
  const field = (key: 'patientName' | 'contactName' | 'phone', label: string, placeholder: string) => <div className="booking-field"><label htmlFor={key}>{label} *</label><input id={key} name={key} required value={draft[key]} type={key === 'phone' ? 'tel' : 'text'} inputMode={key === 'phone' ? 'tel' : 'text'} autoComplete="off" placeholder={placeholder} maxLength={key === 'phone' ? 20 : 120} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => update(key, e.target.value)} />{error(key)}</div>
  const error = (key: string) => errors[key] ? <span className="booking-error" id={`${key}-error`} role="alert">{errors[key]}</span> : null
  const selection = (key: 'hospital' | 'relationship', label: string, placeholder: string, values: string[]) => <div className="booking-field"><label htmlFor={key}>{label} *</label><select id={key} required value={draft[key]} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={e => update(key, e.target.value)}><option value="">{placeholder}</option>{values.map(value => <option key={value}>{value}</option>)}</select>{error(key)}</div>
  const edit = (target: string, label: string) => <button type="button" className="booking-edit" aria-label={`แก้ไข${label}`} onClick={() => go(target)}>แก้ไข</button>
  function start() { submittedId.current = null; setDraft(emptyBooking()); setLocationError(false); setPin(null); go('privacy') }
  function openPin() { setPin(draft.pickup); go('pickup') }
  function selectPin(x: number, y: number) {
    const boundedX = Math.max(0, Math.min(100, Math.round(x)))
    const boundedY = Math.max(0, Math.min(100, Math.round(y)))
    setPin({ x: boundedX, y: boundedY, label: `จุดรับจำลอง (${boundedX}%, ${boundedY}%)` })
  }
  let content: ReactNode
  if (['patient', 'assistance', 'pickup', 'review'].includes(screen) && !draft.acknowledged) return <Navigate to="/booking/privacy" replace />
  if (['submitted', 'status'].includes(screen) && !saved) return <Navigate to="/booking/bookings" replace />
  if (screen === '') content = <>
    <BookingHeader title="จองรถไปโรงพยาบาล" />
    <section className="booking-hero"><div className="booking-hero-icons"><BookingIcon name="medical" /><BookingIcon name="ambulance" /><BookingIcon name="pin" /></div><h2>จองรถรับส่งผู้ป่วย</h2><p>จองง่ายใน 3 ขั้นตอน</p></section>
    <BookingButton onClick={start}>เริ่มจองรถ →</BookingButton><BookingButton secondary onClick={() => go('bookings')}>ดูสถานะการจอง</BookingButton>
    <div className="booking-three-steps">{['กรอกข้อมูล', 'เลือกจุดรับ', 'รอการยืนยัน'].map((label, i) => <div key={label}><strong>{i + 1}</strong><span>{label}</span></div>)}</div>
    <p className="booking-notice">จองล่วงหน้าอย่างน้อย 48 ชั่วโมง</p><EmergencyLink />
  </>
  else if (screen === 'privacy') content = <>
    <BookingHeader title="ข้อมูลส่วนบุคคล" subtitle="ใช้ข้อมูลเพื่อจัดบริการรับส่ง" />
    <section className="booking-hero booking-privacy-hero"><BookingIcon name="shield" /><h2>ดูแลข้อมูลส่วนบุคคล</h2></section>
    <h2 className="booking-section-title">ข้อมูลที่จำเป็น</h2>
    <BookingCard icon="user" title="ข้อมูลผู้ป่วย"><p>ชื่อและเบอร์ติดต่อ</p></BookingCard><BookingCard icon="smallPin" title="จุดรับผู้ป่วย"><p>สำหรับวางแผนการรับส่ง</p></BookingCard><BookingCard icon="smallMedical" title="ข้อมูลการเดินทาง"><p>วันนัดและความช่วยเหลือ</p></BookingCard>
    <label className="booking-checkbox"><input type="checkbox" checked={draft.acknowledged} onChange={e => update('acknowledged', e.target.checked)} />รับทราบการใช้ข้อมูล</label>
    <BookingButton disabled={!draft.acknowledged} onClick={() => go('patient')}>รับทราบและถัดไป</BookingButton>
    {!draft.acknowledged && <p className="booking-info">กรุณารับทราบประกาศก่อนดำเนินการต่อ</p>}
    <BookingButton secondary onClick={() => { setDraft(emptyBooking()); go() }}>กลับหน้าหลัก</BookingButton>
    <button type="button" className="booking-text-link" onClick={() => setPrivacyOpen(true)}>อ่านประกาศความเป็นส่วนตัว</button><EmergencyLink />
  </>
  else if (screen === 'patient') content = <>
    <BookingHeader title="ข้อมูลผู้ป่วย" subtitle="ใครต้องการใช้รถรับส่ง?" /><BookingProgress step={1} />
    <div className="booking-tabs" role="group" aria-label="ประเภทการจอง">{(['self', 'other'] as const).map(value => <button type="button" aria-pressed={draft.bookingFor === value} key={value} onClick={() => { update('bookingFor', value); setErrors({}) }}>{value === 'self' ? 'จองให้ตนเอง' : 'จองให้ผู้อื่น'}</button>)}</div>
    <form className="booking-form" noValidate onSubmit={e => { e.preventDefault(); patientNext() }}>
      {field('patientName', 'ชื่อผู้ป่วย', 'ชื่อและนามสกุล')}
      {draft.bookingFor === 'other' && field('contactName', 'ชื่อผู้ดูแล / ผู้ติดต่อ', 'ชื่อผู้จองหรือผู้ดูแล')}
      {field('phone', draft.bookingFor === 'self' ? 'เบอร์โทรศัพท์ของคุณ' : 'เบอร์โทรศัพท์ผู้ติดต่อ', '08X-XXX-XXXX')}
      {draft.bookingFor === 'other' && selection('relationship', 'ความสัมพันธ์กับผู้ป่วย', 'เลือกความสัมพันธ์ เช่น บุตร / ญาติ / ผู้ดูแล', ['บุตร', 'ญาติ', 'ผู้ดูแล'])}
      {selection('hospital', 'โรงพยาบาล', 'เลือกโรงพยาบาล', ['โรงพยาบาลที่เลือก (จำลอง)'])}
      {(['date', 'time'] as const).map(kind => <div className="booking-field" key={kind}><label id={`${kind}-label`}>{kind === 'date' ? 'วันนัดหมาย' : 'เวลานัดหมาย'} *</label><button type="button" className="booking-input-trigger" aria-labelledby={`${kind}-label ${kind}-value`} aria-haspopup="dialog" aria-invalid={!!errors[kind]} aria-describedby={errors[kind] ? `${kind}-error` : undefined} onClick={() => setPicker(kind)}><span id={`${kind}-value`}>{kind === 'date' ? draft.date ? thaiDate(draft.date, true) : '📅 เลือกวันนัดหมาย' : draft.time ? `${draft.time} น.` : '◷ เลือกชั่วโมงและนาที'}</span><span aria-hidden="true">›</span></button>{error(kind)}</div>)}
      <p className="booking-notice">จองล่วงหน้าอย่างน้อย 48 ชั่วโมง</p><BookingButton type="submit">ถัดไป →</BookingButton>
    </form><BookingButton secondary onClick={() => go('privacy')}>ย้อนกลับ</BookingButton>
  </>
  else if (screen === 'assistance') content = <>
    <BookingHeader title="การช่วยเหลือและจุดรับ" subtitle="ผู้ป่วยเดินทางแบบไหน?" /><BookingProgress step={2} /><h2 className="booking-section-title">การช่วยเหลือ</h2>
    <div className="booking-assistance" role="group" aria-label="การช่วยเหลือ">{(['เดินได้', 'รถเข็น', 'เปลนอน'] as const).map((label, i) => <button type="button" key={label} aria-pressed={draft.assistance === label} onClick={() => update('assistance', label)}><BookingIcon name={(['walk', 'wheel', 'bed'] as const)[i]} />{label}</button>)}</div>
    <p>ความช่วยเหลือเพิ่มเติม (ถ้ามี)</p><p className="booking-small">เลือกได้หลายข้อ ยกเว้น “ไม่ต้องการ”</p>
    <div className="booking-extras"><label className="booking-checkbox"><input type="checkbox" checked={draft.extras.length === 0} onChange={() => update('extras', [])} />ไม่ต้องการความช่วยเหลือเพิ่มเติม</label>{['ต้องการผู้ช่วยพยุงขึ้น-ลงรถ', 'มีผู้ดูแลเดินทางไปด้วย'].map(label => <label className="booking-checkbox" key={label}><input type="checkbox" checked={draft.extras.includes(label)} onChange={e => update('extras', e.target.checked ? [...draft.extras, label] : draft.extras.filter(x => x !== label))} />{label}</label>)}</div>
    <h2 className="booking-section-title">จุดรับผู้ป่วย</h2><button type="button" className="booking-map-preview" aria-label="เลือกจุดรับบนแผนที่" onClick={openPin}><BookingIcon name="pin" /><span>เลือกจุดรับบนแผนที่</span></button>
    <BookingButton secondary onClick={() => setLocationError(true)}>ใช้ตำแหน่งปัจจุบัน</BookingButton><BookingButton secondary onClick={openPin}>เลือกจุดรับบนแผนที่</BookingButton>
    <p className="booking-info">ไม่พบตำแหน่ง? เลือกจุดรับบนแผนที่ได้</p>
    <section className="booking-pickup-value" tabIndex={errors.pickup ? -1 : undefined} aria-invalid={!!errors.pickup} aria-describedby={errors.pickup ? 'pickup-error' : undefined}><p>จุดรับที่เลือก</p><strong>{draft.pickup?.label || 'กรุณาเลือกจุดรับก่อนดำเนินการ'}</strong>{error('pickup')}</section>
    <BookingButton onClick={assistanceNext}>ถัดไป →</BookingButton><BookingButton secondary onClick={() => go('patient')}>ย้อนกลับ</BookingButton>
  </>
  else if (screen === 'pickup') content = <>
    <BookingHeader title="เลือกจุดรับผู้ป่วย" subtitle="เลื่อนแผนที่เพื่อกำหนดจุดรับ" />
    <div role="slider" tabIndex={0} aria-label="จุดรับบนแผนที่จำลอง" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pin?.x ?? 50} aria-valuetext={pin?.label || 'ยังไม่ได้เลือกจุดรับ ใช้ปุ่มลูกศรหรือแตะเพื่อเลือก'} className="booking-demo-map" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); selectPin((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100) }} onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e => { if (e.buttons === 1) { const r = e.currentTarget.getBoundingClientRect(); selectPin((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100) } }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); selectPin((pin?.x ?? 50) + (e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0), (pin?.y ?? 50) + (e.key === 'ArrowUp' ? -5 : e.key === 'ArrowDown' ? 5 : 0)) } }}>
      <span className="booking-crosshair" style={pin ? { left: `${pin.x}%`, top: `${pin.y}%` } : undefined} aria-hidden="true">⌖</span><h2>ลากแผนที่เพื่อเลือกจุดรับ</h2><p>ต้องตรวจสอบพิกัดในเขตบริการ</p>
    </div>
    <section className="booking-pickup-value"><h2>จุดรับผู้ป่วย *</h2><p aria-live="polite">{pin?.label || 'เลื่อนแผนที่เพื่อเลือกตำแหน่ง'}</p></section>
    <BookingButton disabled={!pin} onClick={() => { update('pickup', pin); go('assistance') }}>ยืนยันจุดรับ</BookingButton><BookingButton secondary onClick={() => go('assistance')}>ย้อนกลับ</BookingButton>
  </>
  else if (screen === 'review') content = sending ? <><BookingHeader title="กำลังส่งคำขอ" subtitle="กรุณารอสักครู่" /><section className="booking-hero" role="status"><h2>กำลังส่งคำขอจองรถ</h2><p>โปรดอย่ากดส่งซ้ำ</p></section><BookingButton disabled>กำลังส่งคำขอ…</BookingButton></> : <>
    <BookingHeader title="ตรวจสอบข้อมูล" subtitle="ตรวจสอบข้อมูลก่อนส่งคำขอ" /><BookingProgress step={3} />
    <BookingCard icon="user" title="ข้อมูลผู้ป่วย" action={edit('patient', 'ข้อมูลผู้ป่วย')}><p>{draft.patientName} · {draft.phone}</p>{draft.bookingFor === 'other' && <p>{draft.contactName} · {draft.relationship}</p>}</BookingCard>
    <BookingCard icon="smallMedical" title="วันนัดหมาย" action={edit('patient', 'วันนัดหมาย')}><p>{draft.hospital}<br />{thaiDate(draft.date)} · {draft.time} น.</p></BookingCard>
    <BookingCard icon="smallWheel" title="ความช่วยเหลือ" action={edit('assistance', 'ความช่วยเหลือ')}><p>{draft.assistance}<br />{draft.extras.join(' · ') || 'ไม่ต้องการความช่วยเหลือเพิ่มเติม'}</p></BookingCard>
    <BookingCard icon="smallPin" title="จุดรับผู้ป่วย" action={edit('assistance', 'จุดรับผู้ป่วย')}><p>{draft.pickup?.label}</p></BookingCard>
    {saveError && <p role="alert" className="booking-error-box">ส่งคำขอไม่สำเร็จ กรุณาลองส่งคำขออีกครั้ง</p>}
    <BookingButton onClick={() => void submit()}>{saveError ? 'ลองส่งคำขออีกครั้ง' : 'ยืนยันและส่งคำขอ'}</BookingButton><BookingButton secondary onClick={() => go('assistance')}>ย้อนกลับ</BookingButton>
  </>
  else if (screen === 'submitted' && saved) content = <>
    <BookingHeader title="ส่งคำขอแล้ว" /><section className="booking-hero"><BookingIcon name="check" /><h2>รับคำขอแล้ว</h2><p>รอเจ้าหน้าที่พิจารณา</p></section>
    <section className="booking-reference"><h2>หมายเลขคำขอ</h2><strong>{saved.id}</strong></section>
    <BookingCard icon="smallCheck" title="แจ้งผลผ่าน LINE"><p>เมื่อเจ้าหน้าที่ตรวจสอบแล้ว</p><p className="booking-small">ระบบสาธิตไม่มีการส่งข้อความจริง</p></BookingCard>
    <BookingButton onClick={() => go(`status/${saved.id}`)}>ดูสถานะการจอง</BookingButton><BookingButton secondary onClick={() => go()}>กลับหน้าหลัก</BookingButton><EmergencyLink />
  </>
  else if (screen === 'bookings') content = <>
    <BookingHeader title="รายการจองของฉัน" subtitle={state.bookings.length ? 'ดูสถานะและรายละเอียดการจอง' : 'ไม่มีคำขอจองรถในขณะนี้'} />
    {state.bookings.length ? <><div className="booking-list-title"><h2>รายการจองทั้งหมด</h2><span>{state.bookings.length} รายการ</span></div>{[...state.bookings].reverse().map(b => <button className="booking-list-card" type="button" key={b.id} onClick={() => go(`status/${b.id}`)}><div><strong>{thaiDate(b.details?.date || b.appointmentAt.slice(0, 10))}</strong><span className={`booking-badge ${b.status}`}>{b.status === 'pending' && <img alt="" src="/figma/5f886.svg" />}{b.status === 'approved' && <span className="booking-list-check" aria-hidden="true"><img src="/figma/7a9b0.svg" alt="" /><span>✓</span></span>}{statusLabels[b.status]}</span></div><p>{b.details?.hospital || 'โรงพยาบาลที่เลือก'}</p><p>{b.id} <span aria-hidden="true">รายละเอียด ›</span></p></button>)}</> : <><section className="booking-empty"><span aria-hidden="true">▱</span><h2>ยังไม่มีรายการจอง</h2><p>เริ่มส่งคำขอจองรถได้เลย</p></section><BookingButton onClick={start}>เริ่มจองรถ</BookingButton></>}
    <BookingButton secondary onClick={() => go()}>กลับหน้าหลัก</BookingButton>
  </>
  else if (screen === 'status' && saved) content = <>
    <BookingHeader title="สถานะการจอง" /><section className={`booking-reference booking-status-reference ${saved.status}`}><h2>หมายเลขการจอง</h2><strong>{saved.id}</strong><hr /><span className={`booking-badge ${saved.status}`}><img alt="" src={`/figma/${saved.status === 'pending' ? 'd0be5' : saved.status === 'rejected' ? '8697d' : '99611'}.svg`} />{statusLabels[saved.status]}</span></section>
    {saved.status === 'rejected' ? <BookingCard title="ผลการพิจารณา"><p>ไม่อนุมัติคำขอนี้</p><p>เหตุผล: {saved.rejectionReason || 'ยังไม่มีเหตุผลที่บันทึกไว้'}</p><p>หากต้องการความช่วยเหลือ กรุณาติดต่อเทศบาล</p></BookingCard> : saved.status === 'completed' ? <BookingCard title="ผลการเดินทาง"><p>ผู้ป่วยเดินทางถึงโรงพยาบาลแล้ว</p><p>หมายเลขการจอง {saved.id}</p></BookingCard> : <><h2 className="booking-section-title">ความคืบหน้า</h2><ol className={`booking-timeline ${saved.status}`}><li><span className="booking-done" aria-hidden="true">✓</span><div><strong>ส่งคำขอแล้ว</strong><p>ดำเนินการเรียบร้อย</p></div></li><li className="booking-current" aria-current="step"><span className="booking-timeline-clock" aria-hidden="true">{saved.status === 'pending' ? <img src="/figma/eaf99.svg" alt="" /> : '✓'}</span><div><span className={`booking-badge ${saved.status}`}>สถานะปัจจุบัน</span><h3>{statusLabels[saved.status]}</h3><p>{saved.status === 'pending' ? 'เจ้าหน้าที่กำลังตรวจสอบ ยังไม่ยืนยันรถรับส่ง' : saved.status === 'approved' ? 'อนุมัติคำขอแล้ว กรุณาตรวจสอบเวลารับผู้ป่วย' : 'กำลังเดินทาง'}</p></div></li>{['จัดรถและคนขับ', 'กำลังเดินทาง', 'เสร็จสิ้น'].map(label => <li key={label}><span className={saved.schedule && label === 'จัดรถและคนขับ' ? 'booking-done' : 'booking-future'} aria-hidden="true">{saved.schedule && label === 'จัดรถและคนขับ' ? '✓' : ''}</span><p>{label}</p></li>)}</ol></>}
    {saved.status !== 'rejected' && <BookingCard icon="clock" title="เวลารับผู้ป่วย"><p>{saved.status === 'pending' ? 'จะแสดงหลังเจ้าหน้าที่อนุมัติ' : saved.status === 'completed' ? 'ถึงโรงพยาบาลแล้ว' : saved.schedule ? `${dispatchDate(saved.schedule.pickupAt)} · ${dispatchTime(saved.schedule.pickupAt)} น. (เวลาจำลอง)` : 'รอจัดรถและคนขับ'}</p></BookingCard>}<BookingButton secondary onClick={() => go('bookings')}>รายการจองของฉัน</BookingButton><BookingButton secondary onClick={() => go()}>กลับหน้าหลัก</BookingButton><EmergencyLink />
  </>
  else return <Navigate to="/booking" replace />
  const background = screen === 'patient' && draft.bookingFor === 'other' ? 'd6a9d' : backgrounds[screen]
  return <div className="booking-shell"><a className="skip-link" href="#booking-main">ข้ามไปยังเนื้อหา</a><main ref={root} id="booking-main" className={`booking-screen booking-screen-${screen || 'entry'}`} data-figma-screen={screen || 'entry'}>
    {background && <img className="booking-background" src={`/figma/${background}.svg`} alt="" aria-hidden="true" />}{content}
    {!storageAvailable && <p role="alert" className="booking-error-box">เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล การจองนี้อยู่ในหน่วยความจำและจะหายเมื่อรีเฟรช</p>}
  </main><footer className="booking-demo-footer"><Link to="/">กลับเลือกบทบาท</Link><span>ข้อมูลจำลองเท่านั้น · กรุณาไม่กรอกข้อมูลผู้ป่วยจริง</span></footer>
    {picker && <AppointmentPicker kind={picker} date={draft.date} time={draft.time} onClose={() => setPicker(null)} onConfirm={value => { update(picker, value); setPicker(null) }} />}
    {privacyOpen && <BookingModal title="ข้อมูลส่วนบุคคล" onClose={() => setPrivacyOpen(false)}><p>ใช้ข้อมูลเพื่อจัดบริการรับส่ง</p><ul><li>ข้อมูลผู้ป่วย: ชื่อและเบอร์ติดต่อ</li><li>จุดรับผู้ป่วย: สำหรับวางแผนการรับส่ง</li><li>ข้อมูลการเดินทาง: วันนัดและความช่วยเหลือ</li></ul><p className="booking-info">Figma ยังไม่มีประกาศฉบับเต็ม ข้อมูลสาธิตบันทึกในเบราว์เซอร์นี้เท่านั้น</p><BookingButton onClick={() => setPrivacyOpen(false)}>ปิด</BookingButton></BookingModal>}
    {locationError && <BookingModal title="ไม่พบตำแหน่งปัจจุบัน" onClose={() => setLocationError(false)}><p>ยังจองรถต่อได้โดยปักหมุดเอง</p><section className="booking-empty"><h3>ไม่สามารถดึงตำแหน่งได้</h3><p>กรุณาเลือกจุดรับบนแผนที่แทน</p></section><p className="booking-info">ตำแหน่งปัจจุบันไม่พร้อมใช้งานในระบบสาธิต</p><BookingButton onClick={() => { setLocationError(false); openPin() }}>เลือกจุดรับบนแผนที่</BookingButton><BookingButton secondary onClick={() => setLocationError(false)}>ย้อนกลับ</BookingButton></BookingModal>}
  </div>
}
