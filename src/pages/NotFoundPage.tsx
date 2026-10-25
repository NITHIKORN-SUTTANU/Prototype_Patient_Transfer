import { Link } from 'react-router'
export function NotFoundPage() {
  return <div className="rounded-[20px] border border-border bg-white p-8"><p className="text-sm text-primary">404</p><h1 className="mt-3 text-3xl font-semibold">ไม่พบหน้านี้</h1><p className="mt-4 text-muted">กลับไปเลือกบทบาทเพื่อเริ่มต้นการสาธิต</p><Link className="mt-6 inline-flex min-h-14 items-center rounded-xl bg-primary px-6 font-semibold text-white" to="/">กลับหน้าหลัก</Link></div>
}
