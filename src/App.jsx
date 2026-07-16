import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import { Aurora } from './components/Ornament'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Movements from './pages/Movements'
import Invoice from './pages/Invoice'
import Bills from './pages/Bills'
import Goals from './pages/Goals'
import Settings from './pages/Settings'

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <Aurora />
      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand2 to-brand
                      grid place-items-center shadow-glow animate-float">
        <span className="font-display font-bold text-onbrand text-xl">M</span>
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/50 to-transparent opacity-60" />
      </div>
      <div className="w-32 h-1 rounded-full overflow-hidden shimmer animate-sheen" />
    </div>
  )
}

function Guarded({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/entrar" replace />
  return <FinanceProvider>{children}</FinanceProvider>
}

function Entry() {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />
  return <Auth />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/entrar" element={<Entry />} />
            <Route element={<Guarded><Layout /></Guarded>}>
              <Route index element={<Dashboard />} />
              <Route path="movimentacoes" element={<Movements />} />
              <Route path="fatura" element={<Invoice />} />
              <Route path="contas" element={<Bills />} />
              <Route path="metas" element={<Goals />} />
              <Route path="ajustes" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
