import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatCurrency } from '@/lib/utils'
import { Building2, Wallet, Landmark, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export function DashboardSummary() {
  const { transactions } = useTransactions()
  const [month, setMonth] = useState('2026-02')

  const filteredTx =
    month === 'all'
      ? transactions
      : transactions.filter((t) => typeof t.data === 'string' && t.data.startsWith(month))

  const calculateUnitTotal = (unit: string) => {
    return filteredTx
      .filter((t) => t.unidade === unit && t.tipo === 'despesa' && !t.isCheckpoint)
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)
  }

  const totalJau = calculateUnitTotal('Jau')
  const totalPederneiras = calculateUnitTotal('Pederneiras')
  const totalLPaulista = calculateUnitTotal('L. Paulista')
  const totalSilvio = calculateUnitTotal('Silvio')

  const receitas = filteredTx
    .filter((t) => t.tipo === 'receita' && !t.isCheckpoint)
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)
  const despesas = filteredTx
    .filter((t) => t.tipo === 'despesa' && !t.isCheckpoint)
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)
  const saldoGeral = receitas - despesas

  const checkpoints = filteredTx
    .filter((t) => t.isCheckpoint)
    .sort((a, b) => {
      const dateA = a.data && typeof a.data === 'string' ? new Date(a.data).getTime() : 0
      const dateB = b.data && typeof b.data === 'string' ? new Date(b.data).getTime() : 0
      return dateB - dateA
    })
  const lastCheckpoint = checkpoints[0]?.valor ? Number(checkpoints[0].valor) : 0

  return (
    <Card className="mt-6 border-blue-100/50 shadow-md">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
          <CalendarDays className="w-4 h-4 text-primary" /> Visão Geral
        </CardTitle>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[130px] h-8 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-02">Fevereiro 26</SelectItem>
            <SelectItem value="2026-01">Janeiro 26</SelectItem>
            <SelectItem value="all">Todo Período</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Jau
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalJau)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Pederneiras
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalPederneiras)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> L. Paulista
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalLPaulista)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Silvio
          </p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(totalSilvio)}</p>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 flex flex-col justify-center col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Saldo Período
          </p>
          <p className={`text-sm font-bold ${saldoGeral >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(saldoGeral)}
          </p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3 flex flex-col justify-center col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Landmark className="w-3 h-3" /> Saldo Ref.
          </p>
          <p className="text-sm font-bold text-emerald-700">{formatCurrency(lastCheckpoint)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
