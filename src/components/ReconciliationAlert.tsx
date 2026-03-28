import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTransactions } from '@/contexts/TransactionContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ReconciliationAlert() {
  const { transactions } = useTransactions()

  const discrepancy = useMemo(() => {
    const checkpoints = transactions.filter((t) => t.isCheckpoint)
    if (checkpoints.length === 0) return null

    const sortedCheckpoints = [...checkpoints].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    )
    const latestCheckpoint = sortedCheckpoints[0]

    const latestDate = new Date(latestCheckpoint.data).getTime()

    const transactionsUpTo = transactions.filter(
      (t) => !t.isCheckpoint && new Date(t.data).getTime() <= latestDate,
    )

    const expectedBalance = transactionsUpTo.reduce(
      (acc, t) => acc + (t.tipo === 'receita' ? t.valor : -t.valor),
      0,
    )
    const reportedBalance =
      latestCheckpoint.tipo === 'despesa' ? -latestCheckpoint.valor : latestCheckpoint.valor

    const difference = expectedBalance - reportedBalance

    return { difference, expectedBalance, reportedBalance, date: latestCheckpoint.data }
  }, [transactions])

  const discrepancySignature = discrepancy
    ? `${discrepancy.date}-${discrepancy.difference.toFixed(2)}`
    : null

  const [isDismissed, setIsDismissed] = useState(() => {
    if (!discrepancySignature) return false
    return localStorage.getItem('dismissed_discrepancy') === discrepancySignature
  })

  useEffect(() => {
    if (discrepancySignature) {
      setIsDismissed(localStorage.getItem('dismissed_discrepancy') === discrepancySignature)
    } else {
      setIsDismissed(false)
    }
  }, [discrepancySignature])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (discrepancySignature) {
      localStorage.setItem('dismissed_discrepancy', discrepancySignature)
    }
  }

  if (!discrepancy) return null

  if (Math.abs(discrepancy.difference) < 0.01) {
    return (
      <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 mb-6 shadow-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800 font-semibold flex items-center gap-2">
          Saldo Reconciliado
        </AlertTitle>
        <AlertDescription className="text-emerald-700 mt-1">
          O saldo calculado do sistema bate com o último saldo informado (
          {formatCurrency(discrepancy.reportedBalance)}).
        </AlertDescription>
      </Alert>
    )
  }

  if (isDismissed) return null

  return (
    <Alert
      variant="destructive"
      className="bg-red-50 border-red-200 text-red-800 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-300"
    >
      <div className="flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <AlertTitle className="text-red-800 font-semibold text-base">
            Divergência de Saldo Encontrada
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-1 text-sm leading-relaxed">
            Foi encontrada uma divergência de{' '}
            <strong>{formatCurrency(Math.abs(discrepancy.difference))}</strong>. O saldo calculado é{' '}
            {formatCurrency(discrepancy.expectedBalance)}, mas o último saldo informado foi{' '}
            {formatCurrency(discrepancy.reportedBalance)}.
          </AlertDescription>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 ml-8 sm:ml-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="bg-transparent border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 w-full sm:w-auto"
        >
          Desconsiderar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          asChild
          className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto shadow-sm"
        >
          <Link to="/configuracoes" target="_blank" rel="noopener noreferrer">
            Ajustar Divergência
          </Link>
        </Button>
      </div>
    </Alert>
  )
}
