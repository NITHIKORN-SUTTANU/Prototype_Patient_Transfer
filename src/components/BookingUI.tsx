import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const icons = { medical: ['f113c', 54], ambulance: ['078c5', 54], pin: ['ffb39', 54], shield: ['c0c49', 54], user: ['52219', 31], smallPin: ['35260', 31], smallMedical: ['92c41', 31], walk: ['afd5f', 36], wheel: ['02815', 36], bed: ['135fe', 36], smallWheel: ['4de73', 31], check: ['0695c', 54], smallCheck: ['b4975', 31], clock: ['96e75', 31], emergency: ['8b653', 27] } as const
export function BookingIcon({ name }: { name: keyof typeof icons }) {
  const [file, size] = icons[name]
  return <span className="booking-icon" style={{ width: size, height: size }} aria-hidden="true"><img src={`/figma/${file}.svg`} alt="" /></span>
}
export function BookingButton({ secondary = false, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button type="button" className={`booking-button ${secondary ? 'booking-secondary' : ''} ${className}`} {...props} />
}
export function BookingHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="booking-header"><p>เทศบาลตำบลบ้านกลาง</p><h1 tabIndex={-1}>{title}</h1>{subtitle && <p className="booking-subtitle">{subtitle}</p>}</header>
}
export function BookingProgress({ step }: { step: number }) {
  return <div className="booking-progress" aria-label={`ขั้นตอนที่ ${step} จาก 3`}><div aria-hidden="true">{[1, 2, 3].map(n => <span key={n} className={n <= step ? 'active' : ''} />)}</div><p>ขั้นตอนที่ {step} จาก 3</p></div>
}
export function BookingCard({ icon, title, children, action }: { icon?: keyof typeof icons; title: string; children?: ReactNode; action?: ReactNode }) {
  return <section className="booking-card">{icon && <span className="booking-icon-tile"><BookingIcon name={icon} /></span>}<div className="booking-card-copy"><h2>{title}</h2>{children}</div>{action}</section>
}
export function EmergencyLink() { return <a className="booking-emergency" href="tel:1669"><BookingIcon name="emergency" />ฉุกเฉิน โทร 1669</a> }
export function BookingModal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className={`booking-modal ${className}`} aria-labelledby="booking-modal-title" onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}><div className="booking-modal-inner"><header><h2 id="booking-modal-title">{title}</h2><button type="button" aria-label="ปิด" onClick={onClose}>×</button></header>{children}</div></dialog>
}
