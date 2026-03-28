import { useMemo, useState } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { parseISO, getMonth, getQuarter, getYear } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp, Wallet, Receipt, Landmark } from 'lucide-react'

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const QUARTERS = [
  { value: '1', label: 'Q1 (Jan-Mar)' },
  { value: '2', label: 'Q2 (Abr-Jun)' },
  { value: '3', label: 'Q3 (Jul-Set)' },
  { value: '4', label: 'Q4 (Out-Dez)' },
]

export default function CompanyResult() {
  const { transactions } = useTransactions()
  const [year, setYear] = useState<string>('2026')
  const [month, setMonth] = useState<string>('all')
  const [quarter, setQuarter] = useState<string>('all')

  const handleMonthChange = (val: string) => {
    setMonth(val)
    if (val !== 'all') setQuarter('all')
  }

  const handleQuarterChange = (val: string) => {
    setQuarter(val)
    if (val !== 'all') setMonth('all')
  }

  const { totalMargin, totalCosts, netProfit, chartData } = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (t.isCheckpoint) return false
      const date = parseISO(t.data)
      const tYear = getYear(date).toString()
      const tMonth = (getMonth(date) + 1).toString()
      const tQuarter = getQuarter(date).toString()

      if (year !== 'all' && tYear !== year) return false
      if (month !== 'all' && tMonth !== month) return false
      if (quarter !== 'all' && tQuarter !== quarter) return false

      return true
    })

    const TARGET_UNITS = ['Jau', 'Pederneiras', 'L. Paulista'] as const
    const UNIT_NAMES = { Jau: 'Jaú', Pederneiras: 'Pederneiras', 'L. Paulista': 'Lençóis' }

    let sumMargin = 0
    const unitMargins = TARGET_UNITS.map((unit) => {
      const unitTxs = filtered.filter((t) => t.unidade === unit)
      const revenue = unitTxs
        .filter(
          (t) =>
            t.tipo === 'receita' && (t.receitaTipo === 'comissao' || t.categoria === 'Comissão'),
        )
        .reduce((sum, t) => sum + t.valor, 0)
      const costs = unitTxs
        .filter((t) => t.tipo === 'despesa' && t.despesaTipo === 'unitaria')
        .reduce((sum, t) => sum + t.valor, 0)

      const margin = revenue - costs
      sumMargin += margin

      return {
        name: UNIT_NAMES[unit],
        margin: margin,
      }
    })

    const opCosts = filtered
      .filter((t) => t.tipo === 'despesa' && t.despesaTipo === 'cia')
      .reduce((sum, t) => sum + t.valor, 0)

    return {
      totalMargin: sumMargin,
      totalCosts: opCosts,
      netProfit: sumMargin - opCosts,
      chartData: unitMargins,
    }
  }, [transactions, year, month, quarter])

  const chartConfig = {
    margin: { label: 'Margem de Contribuição', color: '#3b82f6' },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Landmark className="w-6 h-6" />
          Resultado da Empresa
        </h2>
        <p className="text-muted-foreground mt-1">
          Visão consolidada de lucratividade, margens e custos operacionais.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4 bg-slate-50/50 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
            <div>
              <CardTitle className="text-lg">Filtros de Período</CardTitle>
              <CardDescription>Refine a busca por ano, mês ou trimestre.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="space-y-1.5 flex-1 md:flex-none min-w-[120px]">
                <Label className="text-xs text-slate-500">Ano</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1 md:flex-none min-w-[140px]">
                <Label className="text-xs text-slate-500">Mês</Label>
                <Select value={month} onValueChange={handleMonthChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1 md:flex-none min-w-[140px]">
                <Label className="text-xs text-slate-500">Trimestre</Label>
                <Select value={quarter} onValueChange={handleQuarterChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Trimestres</SelectItem>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-blue-100 bg-blue-50/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Soma Total de Margens
                </CardTitle>
                <Wallet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(totalMargin)}
                </div>
                <p className="text-xs text-blue-600/70 mt-1">Margem de contribuição consolidada</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-rose-100 bg-rose-50/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-rose-900">
                  Custos Operacionais Totais
                </CardTitle>
                <Receipt className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-700">{formatCurrency(totalCosts)}</div>
                <p className="text-xs text-rose-600/70 mt-1">Despesas da companhia (Cia)</p>
              </CardContent>
            </Card>

            <Card
              className={`shadow-sm border-slate-200 ${
                netProfit >= 0
                  ? 'bg-emerald-50/30 border-emerald-100'
                  : 'bg-red-50/30 border-red-100'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle
                  className={`text-sm font-medium ${
                    netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'
                  }`}
                >
                  Lucro Líquido da Empresa
                </CardTitle>
                <TrendingUp
                  className={`h-4 w-4 ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(netProfit)}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    netProfit >= 0 ? 'text-emerald-600/70' : 'text-red-600/70'
                  }`}
                >
                  Resultado final do período
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Comparativo de Margem por Unidade</CardTitle>
          <CardDescription>
            Desempenho da Margem de Contribuição nas três principais unidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ChartContainer config={chartConfig} className="w-full h-full pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={{ fill: 'transparent' }}
                  content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                />
                <Bar
                  dataKey="margin"
                  fill="var(--color-margin)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
