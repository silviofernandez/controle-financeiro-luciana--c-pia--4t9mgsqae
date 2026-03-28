import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/dashboard-utils'

interface SummaryCardsProps {
  transactions: any[]
  prevTransactions: any[]
}

export function SummaryCards({ transactions, prevTransactions }: SummaryCardsProps) {
  const calcTotals = (txs: any[]) => {
    const rev = txs
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)
    const exp = txs
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)
    return { rev, exp, bal: rev - exp }
  }

  const current = calcTotals(transactions)
  const prev = calcTotals(prevTransactions)

  const calcChange = (curr: number, p: number) => {
    if (p === 0) return curr > 0 ? '+100%' : '0%'
    const change = ((curr - p) / Math.abs(p)) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const data = {
    balance: current.bal,
    revenue: current.rev,
    expenses: current.exp,
    balanceChange: calcChange(current.bal, prev.bal),
    revenueChange: calcChange(current.rev, prev.rev),
    expensesChange: calcChange(current.exp, prev.exp),
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(data.balance)}</div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span
              className={
                data.balanceChange.startsWith('+')
                  ? 'text-emerald-600 font-medium'
                  : 'text-rose-600 font-medium'
              }
            >
              {data.balanceChange}
            </span>
            <span>vs. período anterior</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(data.revenue)}</div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span
              className={
                data.revenueChange.startsWith('+')
                  ? 'text-emerald-600 font-medium'
                  : 'text-rose-600 font-medium'
              }
            >
              {data.revenueChange}
            </span>
            <span>vs. período anterior</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(data.expenses)}</div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span
              className={
                data.expensesChange.startsWith('-')
                  ? 'text-emerald-600 font-medium'
                  : 'text-rose-600 font-medium'
              }
            >
              {data.expensesChange}
            </span>
            <span>vs. período anterior</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
