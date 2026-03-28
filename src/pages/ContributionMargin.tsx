import { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Building2, TrendingUp, DollarSign } from 'lucide-react'

type TargetUnit = 'Jau' | 'Pederneiras' | 'L. Paulista'

const TARGET_UNITS: TargetUnit[] = ['Jau', 'Pederneiras', 'L. Paulista']
const UNIT_DISPLAY_NAMES: Record<TargetUnit, string> = {
  Jau: 'Jaú',
  Pederneiras: 'Pederneiras',
  'L. Paulista': 'Lençóis',
}

export default function ContributionMargin() {
  const { transactions } = useTransactions()

  const { unitData, totalMarginSum, chartData, highestUnit, totalCostsSum } = useMemo(() => {
    const data = TARGET_UNITS.map((unit) => {
      const unitTxs = transactions.filter((t) => t.unidade === unit && !t.isCheckpoint)

      // Receita Total: Sum of all commissions for the unit
      const revenue = unitTxs
        .filter(
          (t) =>
            t.tipo === 'receita' && (t.receitaTipo === 'comissao' || t.categoria === 'Comissão'),
        )
        .reduce((sum, t) => sum + t.valor, 0)

      // Custos Diretos: Sum of expenses where type is "Despesa Unitária"
      const costs = unitTxs
        .filter((t) => t.tipo === 'despesa' && t.despesaTipo === 'unitaria')
        .reduce((sum, t) => sum + t.valor, 0)

      const margin = revenue - costs

      return {
        id: unit,
        name: UNIT_DISPLAY_NAMES[unit],
        revenue,
        costs,
        margin,
      }
    })

    const totalMargin = data.reduce((sum, d) => sum + d.margin, 0)
    const totalCosts = data.reduce((sum, d) => sum + d.costs, 0)

    const finalData = data.map((d) => ({
      ...d,
      percentage: totalMargin > 0 ? (d.margin / totalMargin) * 100 : 0,
    }))

    const pieData = finalData
      .filter((d) => d.margin > 0)
      .map((d) => ({
        name: d.name,
        value: d.margin,
        fill: `var(--color-${d.id.replace(/[\s.]/g, '')})`,
      }))

    const topUnit = [...finalData].sort((a, b) => b.margin - a.margin)[0]

    return {
      unitData: finalData,
      totalMarginSum: totalMargin,
      totalCostsSum: totalCosts,
      chartData: pieData,
      highestUnit: topUnit,
    }
  }, [transactions])

  const chartConfig = {
    value: { label: 'Margem' },
    Jau: { label: 'Jaú', color: '#3b82f6' }, // blue-500
    Pederneiras: { label: 'Pederneiras', color: '#10b981' }, // emerald-500
    LPaulista: { label: 'Lençóis', color: '#f59e0b' }, // amber-500
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Margem de Contribuição</h2>
        <p className="text-muted-foreground mt-1">
          Análise de rentabilidade e performance financeira por unidade de negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Margem Consolidada</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalMarginSum)}</div>
            <p className="text-xs text-blue-600/70 mt-1">Soma de todas as unidades</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Unidade Destaque</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{highestUnit?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {highestUnit?.percentage.toFixed(1)}% de contribuição
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Custos Diretos (Total)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalCostsSum)}</div>
            <p className="text-xs text-muted-foreground mt-1">Despesas unitárias apuradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md border-slate-200 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Performance por Unidade</CardTitle>
            <CardDescription>
              Detalhamento de receitas, custos e representatividade no resultado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold">Unidade</TableHead>
                    <TableHead className="text-right font-semibold">Receita Total</TableHead>
                    <TableHead className="text-right font-semibold">Custos Diretos</TableHead>
                    <TableHead className="text-right font-semibold">
                      Margem de Contribuição
                    </TableHead>
                    <TableHead className="text-right font-semibold">% Contribuição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-slate-700">{row.name}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {formatCurrency(row.costs)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-700">
                        {formatCurrency(row.margin)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {row.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-blue-50/50 text-blue-900 font-bold border-t-2 border-blue-100">
                  <TableRow>
                    <TableCell colSpan={3} className="text-right uppercase text-xs tracking-wider">
                      Soma Total de Margens
                    </TableCell>
                    <TableCell className="text-right text-base">
                      {formatCurrency(totalMarginSum)}
                    </TableCell>
                    <TableCell className="text-right text-base">100.0%</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição do Resultado</CardTitle>
            <CardDescription>Participação na margem total consolidada.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Dados insuficientes para o gráfico.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
