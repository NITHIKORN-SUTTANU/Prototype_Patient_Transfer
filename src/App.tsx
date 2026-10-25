import { Route, Routes } from 'react-router'
import { DemoLayout } from './layouts/DemoLayout'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { BookingPage } from './pages/BookingPage'

export function App() {
  return <Routes><Route path="booking/*" element={<BookingPage />} /><Route element={<DemoLayout />}><Route index element={<LandingPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes>
}
