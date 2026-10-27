import { Link, useSearchParams } from 'react-router'
import { actors } from '../data/actors'
import { ActorCard } from '../components/ActorCard'
import { demoStore, useDemoState } from '../services/demoStore'

export function LandingPage() {
  const { state, storageAvailable } = useDemoState()
  const [params, setParams] = useSearchParams()
  const selected = actors.find(actor => actor.id === state.selectedActor)
  return <>
    <div className="max-w-3xl"><p lang="en" className="text-sm font-semibold tracking-widest text-primary">BAN KLANG / TRANSIT PROTOTYPE</p>
      <h1 className="mt-4 text-3xl leading-snug font-semibold sm:text-4xl">บริการรับส่งที่เข้าถึงง่าย<br className="hidden sm:block" /> เริ่มต้นด้วยการเลือกบทบาท</h1>
      <p className="mt-5 text-lg leading-8 text-muted">เลือกมุมมองที่ต้องการสาธิต เพื่อเตรียมสำรวจการทำงานของระบบรับส่งผู้ป่วยเทศบาลตำบลบ้านกลาง</p>
    </div>
    <section aria-labelledby="actor-heading" className="mt-10"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="actor-heading" className="text-xl font-semibold">เลือกผู้ใช้งานสำหรับการสาธิต</h2><span className="text-sm text-muted">4 บทบาท · ระบบต้นแบบ</span></div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{actors.map(actor => <ActorCard key={actor.id} actor={actor} selected={state.selectedActor === actor.id} onSelect={() => { demoStore.selectActor(actor.id); setParams({ actor: actor.id }, { replace: true }) }} />)}</div>
    </section>
    <section aria-label="สถานะการสาธิต" aria-live="polite" className="mt-6 rounded-[20px] border border-border bg-white p-6">
      <h2 className="text-lg font-semibold text-primary">{selected ? `เลือกแล้ว: ${selected.name}` : 'พร้อมสำหรับการสาธิต'}</h2>
      <p className="mt-2 text-base leading-7 text-muted">{selected?.id === 'ACT-01' ? 'พร้อมเริ่มจองรถและติดตามสถานะด้วยข้อมูลจำลอง' : selected?.id === 'ACT-02' ? 'ตรวจสอบคำขอจาก ACT-01 จัดรถและคนขับ และติดตามงานรับส่ง' : selected?.id === 'ACT-03' ? 'ดูงานที่ได้รับมอบหมายและอัปเดตสถานะการเดินทางด้วยข้อมูลจำลอง' : selected ? 'บันทึกบทบาทที่เลือกแล้ว หน้าจอของแต่ละบทบาทจะพัฒนาในขั้นตอนถัดไป' : 'เลือกบทบาทเพื่อเริ่มการสาธิต'}</p>
      {selected?.id === 'ACT-01' && <Link to="/booking" className="mt-4 flex min-h-14 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white">เข้าสู่หน้าจองรถ →</Link>}
      {selected?.id === 'ACT-02' && <Link to="/dispatcher" className="mt-4 flex min-h-14 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white">เข้าสู่หน้าจัดการงานรับส่ง →</Link>}
      {selected?.id === 'ACT-03' && <Link to="/driver" className="mt-4 flex min-h-14 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white">เข้าสู่หน้างานคนขับ →</Link>}
      {params.has('actor') && params.get('actor') !== state.selectedActor && <p className="mt-2 text-sm text-muted">โปรดเลือกบทบาทจากตัวเลือกด้านบน</p>}
      {!storageAvailable && <p role="alert" className="mt-3 text-error">เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล บทบาทที่เลือกจะคงอยู่เฉพาะการเปิดหน้านี้</p>}
      {selected && <button type="button" className="mt-4 min-h-14 rounded-xl border border-border px-5 font-semibold text-primary hover:bg-accent" onClick={() => { demoStore.reset(); setParams({}, { replace: true }) }}>เริ่มการสาธิตใหม่</button>}
    </section>
  </>
}
