import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check } from 'lucide-react'
import { format, parseISO, startOfDay, addDays } from 'date-fns'
import { formatCurrency } from '@/lib/dashboard-utils'

export function DueDateAlerts({ transactions }: { transactions: any[] }) {
  const next7DaysBills = useMemo(() => {
    const today = startOfDay(new Date())
    const nextWeek = addDays(today, 7)

    return transactions
      .filter((t) => !t.isCheckpoint && t.tipo === 'despesa')
      .filter((t) => {
        const d = parseISO(t.data)
        return d >= today && d <= nextWeek
      })
      .sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime())
  }, [transactions])

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Alertas de Vencimento
        </CardTitle>
        <CardDescription>Contas a pagar nos próximos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto max-h-[400px]">
        {next7DaysBills.length > 0 ? (
          <div className="space-y-4 pr-2">
            {next7DaysBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{bill.descricao}</span>
                  <span className="text-xs text-slate-500">
                    Vence em {format(parseISO(bill.data), 'dd/MM/yyyy')}
                  </span>
                </div>
                <span className="text-sm font-bold text-rose-600">
                  {formatCurrency(Number(bill.valor))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center text-slate-500">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm">
              Nenhuma conta vencendo
              <br />
              nos próximos 7 dias.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
