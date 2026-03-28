import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format, parseISO, startOfDay, addDays, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function IncomeExpenseChart({
  transactions,
  dateRange,
}: {
  transactions: any[]
  dateRange: any
}) {
  const chartData = useMemo(() => {
    if (!dateRange?.from) return []
    const from = startOfDay(dateRange.from)
    const to = dateRange.to ? startOfDay(dateRange.to) : from
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 3600 * 24)
    const groupBy = diffDays > 60 ? 'month' : 'day'

    const groups: Record<string, { receitas: number; despesas: number }> = {}

    transactions.forEach((t) => {
      const d = parseISO(t.data)
      const key =
        groupBy === 'month'
          ? format(d, 'MMM/yy', { locale: ptBR })
          : format(d, 'dd/MM', { locale: ptBR })
      if (!groups[key]) groups[key] = { receitas: 0, despesas: 0 }
      if (t.tipo === 'receita') groups[key].receitas += Number(t.valor) || 0
      if (t.tipo === 'despesa') groups[key].despesas += Number(t.valor) || 0
    })

    const result = []
    if (groupBy === 'day') {
      let curr = from
      while (curr <= to) {
        const key = format(curr, 'dd/MM', { locale: ptBR })
        result.push({
          month: key,
          receitas: groups[key]?.receitas || 0,
          despesas: groups[key]?.despesas || 0,
        })
        curr = addDays(curr, 1)
      }
    } else {
      let curr = startOfMonth(from)
      const end = startOfMonth(to)
      while (curr <= end) {
        const key = format(curr, 'MMM/yy', { locale: ptBR })
        result.push({
          month: key,
          receitas: groups[key]?.receitas || 0,
          despesas: groups[key]?.despesas || 0,
        })
        curr = addDays(curr, 32)
        curr = startOfMonth(curr)
      }
    }
    return result
  }, [transactions, dateRange])

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle>Receitas vs Despesas</CardTitle>
        <CardDescription>Evolução no período selecionado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.length > 0 ? (
          <ChartContainer
            config={{
              receitas: { label: 'Receitas', color: 'hsl(var(--primary))' },
              despesas: { label: 'Despesas', color: 'hsl(var(--destructive))' },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  dx={-10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="receitas"
                  fill="var(--color-receitas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="despesas"
                  fill="var(--color-despesas)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-slate-500">
            Nenhum dado para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
