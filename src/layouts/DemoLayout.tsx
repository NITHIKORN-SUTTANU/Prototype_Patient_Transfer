import { Link, Outlet } from 'react-router'

export function DemoLayout() {
  return <div className="min-h-screen bg-canvas text-ink">
    <a className="skip-link" href="#main">ข้ามไปยังเนื้อหา</a>
    <header className="border-b border-border bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link to="/" className="rounded-md"><span className="block text-lg font-semibold text-primary">เทศบาลตำบลบ้านกลาง</span><span className="block text-sm text-muted">บริการรถรับส่งผู้ป่วย</span></Link>
      <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-primary">ต้นแบบเพื่อการศึกษา · Demo</span>
    </div></header>
    <main id="main" className="mx-auto max-w-6xl px-6 py-10 sm:py-16"><Outlet /></main>
    <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 pb-8 text-sm text-muted"><p>Ban Klang Municipal Patient Transit</p><p>ข้อมูลจำลองสำหรับการสาธิตเท่านั้น</p></footer>
  </div>
}
