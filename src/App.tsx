import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Commissions from './pages/Commissions'
import ContributionMargin from './pages/ContributionMargin'
import OperatingCosts from './pages/OperatingCosts'
import CompanyResult from './pages/CompanyResult'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import InsertData from './pages/InsertData'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Recovery from './pages/auth/Recovery'

import { TransactionProvider } from './contexts/TransactionContext'
import { CommissionProvider } from './contexts/CommissionContext'
import { BrokerProvider } from './contexts/BrokerContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { BudgetProvider } from './contexts/BudgetContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    {/* Public Auth Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/recovery" element={<Recovery />} />

    {/* Protected App Routes */}
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />
      <Route path="/inserir" element={<InsertData />} />
      <Route path="/resultado-empresa" element={<CompanyResult />} />
      <Route path="/relatorios" element={<Reports />} />
      <Route path="/margem-contribuicao" element={<ContributionMargin />} />
      <Route path="/custos-operacionais" element={<OperatingCosts />} />
      <Route path="/comissoes" element={<Commissions />} />
      <Route path="/configuracoes" element={<Settings />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <AuthProvider>
    <SettingsProvider>
      <TransactionProvider>
        <CommissionProvider>
          <BrokerProvider>
            <BudgetProvider>
              <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <AppRoutes />
                </TooltipProvider>
              </BrowserRouter>
            </BudgetProvider>
          </BrokerProvider>
        </CommissionProvider>
      </TransactionProvider>
    </SettingsProvider>
  </AuthProvider>
)

export default App
