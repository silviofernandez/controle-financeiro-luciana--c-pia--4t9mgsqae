import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBudgets } from '@/contexts/BudgetContext'
import { cn, formatCurrency } from '@/lib/utils'
import { Transaction, CATEGORIES } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Target } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

function BudgetProgress({ value, indicatorColor }: { value: number; indicatorColor: string }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn('h-full w-full flex-1 transition-all duration-500', indicatorColor)}
        style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
      />
    </div>
  )
}

export function BudgetMonitoring({ transactions }: { transactions: Transaction[] }) {
  const { budgets, setBudget } = useBudgets()
  const [isOpen, setIsOpen] = useState(false)

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter((t) => t.tipo === 'despesa' && !t.isCheckpoint)
    const map = new Map<string, number>()
    expenses.forEach((t) => {
      const cat = t.categoria || 'Outros'
      map.set(cat, (map.get(cat) || 0) + Number(t.valor))
    })
    return map
  }, [transactions])

  const activeCategories = Array.from(expensesByCategory.keys()).concat(Object.keys(budgets))
  const uniqueCategories = Array.from(new Set(activeCategories))
    .filter((c) => c !== 'Comissão' && (expensesByCategory.get(c) || budgets[c]))
    .sort()

  return (
    <Card className="shadow-md border-blue-100/50 animate-fade-in-up mt-6">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Metas de Orçamento
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Definir Tetos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Definir Tetos de Gasto por Categoria</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4 py-4">
              <div className="space-y-4">
                {CATEGORIES.filter((c) => c !== 'Comissão').map((cat) => (
                  <div key={cat} className="flex flex-col gap-1.5">
                    <Label className="text-sm text-slate-600">{cat}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">R$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-9"
                        value={budgets[cat] || ''}
                        onChange={(e) => setBudget(cat, parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {uniqueCategories.map((cat) => {
          const spent = expensesByCategory.get(cat) || 0
          const limit = budgets[cat] || 0
          if (!spent && !limit) return null

          const percentage = limit > 0 ? (spent / limit) * 100 : 0
          let progressColor = 'bg-emerald-500'
          let textColor = 'text-emerald-700'

          if (percentage >= 80 && percentage <= 100) {
            progressColor = 'bg-amber-500'
            textColor = 'text-amber-700'
          }
          if (percentage > 100) {
            progressColor = 'bg-red-500'
            textColor = 'text-red-700'
          }

          return (
            <div
              key={cat}
              className="space-y-3 border border-slate-100 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-slate-700 leading-tight">{cat}</span>
                <span className="text-xs font-bold text-slate-900 whitespace-nowrap ml-2">
                  {formatCurrency(spent)}
                  {limit > 0 && (
                    <span className="text-slate-400 font-normal ml-1 text-[10px]">
                      / {formatCurrency(limit)}
                    </span>
                  )}
                </span>
              </div>
              {limit > 0 ? (
                <div className="space-y-1.5">
                  <BudgetProgress value={percentage} indicatorColor={progressColor} />
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className={cn(textColor)}>{percentage.toFixed(1)}% utilizado</span>
                    {percentage > 100 && (
                      <span className="text-red-600 animate-pulse">Excedido</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic pt-1">Sem teto definido</div>
              )}
            </div>
          )
        })}
        {uniqueCategories.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-6 text-sm flex flex-col items-center">
            <Target className="w-8 h-8 text-slate-200 mb-2" />
            <p>Nenhuma despesa ou teto definido no período.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
