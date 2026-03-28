import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { formatCurrency, toSlug } from '@/lib/dashboard-utils'

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-sm z-50">
        <p className="font-semibold text-slate-800 mb-1">{data.name}</p>
        <p className="text-slate-600 flex justify-between gap-4">
          <span>Valor:</span>
          <span className="font-medium text-slate-900">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-slate-600 flex justify-between gap-4">
          <span>Participação:</span>
          <span className="font-medium text-slate-900">{data.percentage}%</span>
        </p>
      </div>
    )
  }
  return null
}

export function CategoryDistribution({ transactions }: { transactions: any[] }) {
  const formatData = (data: Record<string, number>, total: number) =>
    Object.entries(data)
      .filter(([_, val]) => val > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => {
        const slug = toSlug(name) || `cat_${i}`
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        return { name, slug, value, percentage, fill: `var(--color-${slug})` }
      })

  const { expenses, revenues, expConfig, revConfig } = useMemo(() => {
    const exp: Record<string, number> = {}
    const rev: Record<string, number> = {}
    let totalExp = 0
    let totalRev = 0

    transactions.forEach((t) => {
      const cat = t.categoria || 'Outros'
      const val = Number(t.valor) || 0
      if (t.tipo === 'despesa') {
        exp[cat] = (exp[cat] || 0) + val
        totalExp += val
      } else {
        rev[cat] = (rev[cat] || 0) + val
        totalRev += val
      }
    })

    const expensesData = formatData(exp, totalExp)
    const revenuesData = formatData(rev, totalRev)

    const eConf: Record<string, any> = { value: { label: 'Valor' } }
    expensesData.forEach((item, i) => {
      eConf[item.slug] = { label: item.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    })

    const rConf: Record<string, any> = { value: { label: 'Valor' } }
    revenuesData.forEach((item, i) => {
      rConf[item.slug] = { label: item.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    })

    return { expenses: expensesData, revenues: revenuesData, expConfig: eConf, revConfig: rConf }
  }, [transactions])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-rose-500" />
            Distribuição de Despesas
          </CardTitle>
          <CardDescription>Por categoria no período</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <ChartContainer config={expConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenses}
                    dataKey="value"
                    nameKey="slug"
                    innerRadius="60%"
                    outerRadius="80%"
                    strokeWidth={2}
                    paddingAngle={2}
                  >
                    {expenses.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
              Nenhuma despesa no período.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-emerald-500" />
            Distribuição de Receitas
          </CardTitle>
          <CardDescription>Por categoria no período</CardDescription>
        </CardHeader>
        <CardContent>
          {revenues.length > 0 ? (
            <ChartContainer config={revConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={revenues}
                    dataKey="value"
                    nameKey="slug"
                    innerRadius="60%"
                    outerRadius="80%"
                    strokeWidth={2}
                    paddingAngle={2}
                  >
                    {revenues.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
              Nenhuma receita no período.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
