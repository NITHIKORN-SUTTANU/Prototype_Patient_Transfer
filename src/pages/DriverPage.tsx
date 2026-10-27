import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import type { Booking, DriverStage } from '../data/seed'
import { BookingButton, BookingModal } from '../components/BookingUI'
import { useDemoState } from '../services/demoStore'
import { bangkokDate } from '../services/booking'
import { dispatchDate, dispatchTime, initializeDispatcherResources } from '../services/dispatch'
import { advanceDriverTrip, driverLabels, driverStage, driverStages } from '../services/driver'
import '../booking.css'
import '../driver.css'

function savedIdentity() { try { return sessionStorage.getItem('ban-klang-transit:driver') || '' } catch { return '' } }
export function DriverPage() {
  const { state, storageAvailable } = useDemoState()
  const [identity, setIdentity] = useState(savedIdentity)
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const screen = pathname.replace(/\/$/, '').split('/')[2] || 'dashboard'
  const [confirmation, setConfirmation] = useState<{ id: string; driverId: string; stage: DriverStage } | null>(null)
  const [mapId, setMapId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)
  const main = useRef<HTMLElement>(null)
  useEffect(() => { initializeDispatcherResources() }, [])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
  useEffect(() => { window.scrollTo(0, 0); main.current?.querySelector('h1')?.focus() }, [pathname])
  const driver = state.drivers.find(d => d.id === identity && d.active)
  const jobs = state.bookings.filter(b => driver && b.driverId === driver.id && b.schedule && ['approved', 'in_transit', 'completed'].includes(b.status)).sort((a, b) => Date.parse(a.schedule!.pickupAt) - Date.parse(b.schedule!.pickupAt))
  const open = jobs.filter(b => b.status !== 'completed')
  const today = bangkokDate(now)
  const todays = open.filter(b => bangkokDate(Date.parse(b.schedule!.pickupAt)) === today || b.status === 'in_transit')
  const future = open.filter(b => !todays.includes(b))
  const history = jobs.filter(b => b.status === 'completed').reverse()
  const selected = params.has('booking') ? jobs.find(b => b.id === params.get('booking')) : open.find(b => b.status === 'in_transit') || todays[0] || open[0]
  const current = selected ? driverStage(selected) : 'assigned'
  const currentIndex = driverStages.indexOf(current)
  const next = driverStages[currentIndex + 1]
  const modalBooking = confirmation ? jobs.find(b => b.id === confirmation.id) : undefined
  const stale = !!confirmation && (!modalBooking || driverStage(modalBooking) !== confirmation.stage || identity !== confirmation.driverId)
  const mapBooking = jobs.find(b => b.id === mapId)
  function choose(value: string) { setIdentity(value); try { sessionStorage.setItem('ban-klang-transit:driver', value) } catch { /* Memory fallback */ } setParams({}); setNotice(''); setError('') }
  function confirmTrip() {
    if (!confirmation) return
    try { advanceDriverTrip(confirmation.id, confirmation.driverId, confirmation.stage); setConfirmation(null); setNotice('บันทึกสถานะงานแล้ว'); navigate(`/driver/status?booking=${encodeURIComponent(confirmation.id)}`) }
    catch (e) { setError((e as Error).message) }
  }
  function requestUpdate() { if (selected && driver) { setError(''); setConfirmation({ id: selected.id, driverId: driver.id, stage: current }) } }
  function tripCard(b: Booking, primary = false) {
    const active = b.status === 'in_transit'
    return <article className={`driver-card driver-trip ${active ? 'is-active' : ''} ${primary ? 'is-primary' : ''}`} key={b.id}>
      <div className="driver-card-top"><span>เวลารับผู้ป่วย</span><span>{b.id}</span></div>
      <strong className="driver-time">{dispatchTime(b.schedule!.pickupAt)} น.</strong>
      {b.status === 'completed' && <span className="driver-badge">✓ เสร็จสิ้น</span>}
      <dl>{primary && <div><dt>จุดรับ</dt><dd>{b.details?.pickup?.label || 'ไม่มีข้อมูลจุดรับ'}</dd></div>}<div><dt>ปลายทาง</dt><dd>{b.details?.hospital || 'ไม่มีข้อมูลโรงพยาบาล'}</dd></div></dl>
      <BookingButton className="driver-button" secondary={!primary} onClick={() => navigate(`/driver/${active && primary ? 'status' : 'details'}?booking=${encodeURIComponent(b.id)}`)}>{active && primary ? 'ติดตามสถานะงาน' : primary ? 'ดูรายละเอียดงาน' : 'ดูรายละเอียด'} <span aria-hidden="true">→</span></BookingButton>
    </article>
  }
  if (!['dashboard', 'details', 'status', 'history'].includes(screen)) return <Navigate to="/driver" replace />
  const title = { dashboard: 'งานวันนี้', details: 'รายละเอียดงาน', status: 'สถานะงาน', history: 'ประวัติงาน' }[screen]
  return <div className="driver-shell"><a className="skip-link" href="#driver-main">ข้ามไปยังเนื้อหา</a>
    <div className="driver-demo"><Link to="/">เลือกบทบาท</Link><label>คนขับสาธิต<select aria-label="คนขับสาธิต" value={driver?.id || ''} onChange={e => choose(e.target.value)}><option value="">เลือกคนขับ</option>{state.drivers.filter(d => d.active).map(d => <option value={d.id} key={d.id}>{d.name}</option>)}</select></label><span>ข้อมูลจำลองเท่านั้น</span></div>
    <main id="driver-main" ref={main}><header className="driver-header">{screen === 'dashboard' ? <p>งานรับส่งผู้ป่วย</p> : <Link to="/driver">‹ ย้อนกลับ</Link>}<h1 tabIndex={-1}>{title}</h1><p>{screen === 'dashboard' ? `งานที่ได้รับมอบหมาย • ${todays.length} งาน` : screen === 'history' ? `งานรับส่งที่เสร็จสิ้นแล้ว • ${history.length} งาน` : selected ? `${selected.id} • ${screen === 'details' && current === 'assigned' ? `นัดรับ ${dispatchTime(selected.schedule!.pickupAt)} น.` : driverLabels[current]}` : 'เลือกงานที่ได้รับมอบหมาย'}</p></header>
      <div className="driver-content">
        {!storageAvailable && <p role="alert" className="driver-error">ไม่สามารถบันทึกในเบราว์เซอร์ได้ ข้อมูลจะหายเมื่อรีเฟรช</p>}
        {notice && <p role="status" className="driver-notice">{notice}</p>}
        {!driver ? <section className="driver-card driver-empty"><h2>เลือกคนขับสาธิตเพื่อดูงาน</h2><p>แสดงเฉพาะงานที่ ACT-02 มอบหมายให้คนขับที่เลือก</p></section> : <>
          {screen === 'dashboard' && <><div className="driver-grid"><section><div className="driver-section-heading"><h2>งานที่ต้องทำ</h2>{todays.some(b => b.status === 'in_transit') && <span className="driver-badge active">● กำลังดำเนินการ</span>}</div>{todays.length ? tripCard(todays.find(b => b.status === 'in_transit') || todays[0], true) : <div className="driver-card driver-empty">ไม่มีงานรับส่งวันนี้</div>}</section>{todays.length > 1 && <section><h2>งานถัดไป</h2>{todays.filter(b => b.id !== (todays.find(b => b.status === 'in_transit') || todays[0]).id).map(b => tripCard(b))}</section>}</div>{future.length > 0 && <section><h2>งานที่ได้รับมอบหมายวันอื่น</h2><div className="driver-grid">{future.map(b => <div key={b.id}><h3>{dispatchDate(b.schedule!.pickupAt)}</h3>{tripCard(b)}</div>)}</div></section>}{!open.length && <p className="driver-helper">ยังไม่มีงานที่ต้องดำเนินการ รอเจ้าหน้าที่มอบหมายงานจาก ACT-02</p>}</>}
          {screen === 'history' && (history.length ? <div className="driver-grid">{history.map(b => <section key={b.id}><h2>{dispatchDate(b.schedule!.pickupAt)}</h2>{tripCard(b)}</section>)}</div> : <section className="driver-card driver-empty"><h2>ยังไม่มีประวัติงาน</h2><p>งานที่ส่งถึงโรงพยาบาลแล้วจะแสดงที่นี่</p></section>)}
          {['details', 'status'].includes(screen) && (!selected ? <section className="driver-card driver-empty"><h2>{params.has('booking') ? 'ไม่พบงานที่มอบหมายให้คนขับนี้' : 'ยังไม่มีงานที่ได้รับมอบหมาย'}</h2><Link to="/driver">กลับไปดูงาน</Link></section> : <>
            {screen === 'details' && <div className="driver-grid driver-details"><section><h2>จุดรับผู้ป่วย</h2><div className="driver-card driver-lines"><p>จุดรับ • {selected.details?.pickup?.label || 'ไม่มีข้อมูล'}</p><p>ผู้รับบริการ • {selected.patientName}</p><p>โทร • {selected.details?.phone || 'ไม่มีข้อมูล'}</p><BookingButton secondary className="driver-button" onClick={() => setMapId(selected.id)}>เปิดแผนที่ไปจุดรับ</BookingButton></div></section><div><section><h2>ปลายทาง</h2><div className="driver-card driver-lines"><p>{selected.details?.hospital || 'ไม่มีข้อมูล'}</p><p>เวลานัดหมาย • {dispatchTime(selected.appointmentAt)} น.</p></div></section><section><h2>การช่วยเหลือ</h2><div className="driver-card driver-lines"><p>การเดินทาง • {selected.details?.assistance || 'ไม่มีข้อมูล'}</p><p>{selected.details?.extras.join(' · ') || 'ไม่มีรายการเพิ่มเติม'}</p></div></section></div></div>}
            {screen === 'status' && <div className="driver-grid"><section><h2>สถานะปัจจุบัน</h2><div className="driver-card driver-current"><h3>{driverLabels[current]}</h3><p>{current === 'assigned' ? 'ยังไม่ได้เริ่มออกไปรับผู้ป่วย' : current === 'delivered' ? '✓ เสร็จสิ้น' : 'งานที่กำลังดำเนินการ'}</p>{next && <p className="driver-next">ขั้นตอนถัดไป · {driverLabels[next]}</p>}</div><Link className="driver-detail-link" to={`/driver/details?booking=${encodeURIComponent(selected.id)}`}>ดูรายละเอียดงาน →</Link></section><section><h2>ความคืบหน้าของงาน</h2><ol className="driver-card driver-timeline">{driverStages.map((stage, index) => <li key={stage} className={index <= currentIndex ? index === currentIndex ? 'current' : 'done' : ''} aria-current={index === currentIndex ? 'step' : undefined}><span aria-hidden="true">{index < currentIndex ? '✓' : index === currentIndex ? '●' : index + 1}</span><div>{driverLabels[stage]}{selected.driverProgress?.events.find(e => e.stage === stage) && <small>{dispatchDate(selected.driverProgress.events.find(e => e.stage === stage)!.at)} · {dispatchTime(selected.driverProgress.events.find(e => e.stage === stage)!.at)}</small>}</div></li>)}</ol></section></div>}
            <section className="driver-schedule"><h2>ตารางที่ได้รับมอบหมาย</h2><div className="driver-card"><p>{dispatchDate(selected.schedule!.pickupAt)} · {state.vehicles.find(v => v.id === selected.vehicleId)?.label || selected.vehicleId}</p><dl>{[['ออกศูนย์', selected.schedule!.departureAt], ['รับผู้ป่วย', selected.schedule!.pickupAt], ['ถึงโรงพยาบาลตามแผน', selected.schedule!.arrivalAt], ['นัดหมาย', selected.appointmentAt]].map(([label, time]) => <div key={label}><dt>{label}</dt><dd>{dispatchTime(time)} น.</dd></div>)}</dl><p className="driver-helper">เวลาเดินทางจำลองจาก ACT-02 · เผื่อเตรียมตัว 20 นาที</p></div></section>
            <div className="driver-action">{screen === 'details' ? <BookingButton className="driver-button" onClick={() => navigate(`/driver/status?booking=${encodeURIComponent(selected.id)}`)}>{current === 'assigned' ? 'เริ่มออกไปรับผู้ป่วย' : 'ดูสถานะงาน'}</BookingButton> : next ? <BookingButton className="driver-button" onClick={requestUpdate}>อัปเดตสถานะงาน</BookingButton> : <Link className="driver-button booking-button" to="/driver/history">ดูประวัติงาน</Link>}</div>
          </>)}
        </>}
      </div>
    </main>
    <nav className="driver-nav" aria-label="เมนูคนขับ">{[['/driver', '▦', 'งานวันนี้'], ['/driver/status', '◉', 'สถานะงาน'], ['/driver/history', '▤', 'ประวัติ']].map(([path, icon, label]) => <NavLink end key={path} to={path} className={({ isActive }) => isActive || path === '/driver' && screen === 'details' ? 'active' : ''}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav>
    {confirmation && <BookingModal title="ยืนยันการอัปเดตสถานะ" className="driver-modal" onClose={() => { setConfirmation(null); setError('') }}><p className="driver-helper">สถานะปัจจุบัน</p><strong>{driverLabels[confirmation.stage]}</strong><p className="driver-arrow" aria-hidden="true">↓</p><h3>{driverLabels[driverStages[driverStages.indexOf(confirmation.stage) + 1]]}</h3>{(error || stale) && <p role="alert" className="driver-error">{error || 'งานหรือสถานะเปลี่ยนแล้ว กรุณาปิดหน้าต่างและตรวจสอบข้อมูลล่าสุด'}</p>}<BookingButton className="driver-button" disabled={stale} onClick={confirmTrip}>ยืนยันการอัปเดต</BookingButton><BookingButton className="driver-button" secondary onClick={() => setConfirmation(null)}>ยกเลิก</BookingButton></BookingModal>}
    {mapId && <BookingModal title="จุดรับจำลอง" className="driver-modal" onClose={() => setMapId(null)}>{mapBooking?.details?.pickup ? <><p>{mapBooking.details.pickup.label}</p><div className="driver-map" role="img" aria-label={`ตำแหน่งจุดรับจำลอง ${mapBooking.details.pickup.x}%, ${mapBooking.details.pickup.y}%`}><span style={{ left: `${mapBooking.details.pickup.x}%`, top: `${mapBooking.details.pickup.y}%` }}>●</span></div><p className="driver-helper">ตำแหน่งบนแผนที่จำลองจาก ACT-01 · ไม่มี GPS หรือเส้นทางจริง</p></> : <p>ไม่พบข้อมูลจุดรับของงานนี้</p>}<BookingButton secondary className="driver-button" onClick={() => setMapId(null)}>ปิดแผนที่</BookingButton></BookingModal>}
  </div>
}
