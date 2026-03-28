import { useMemo, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO, getMonth, getQuarter, getYear } from 'date-fns'
import { Receipt } from 'lucide-react'

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

export default function OperatingCosts() {
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

  const { filteredData, totalCosts } = useMemo(() => {
    const ciaCosts = transactions.filter((t) => t.tipo === 'despesa' && t.despesaTipo === 'cia')

    const filtered = ciaCosts
      .filter((t) => {
        const date = parseISO(t.data)
        const tYear = getYear(date).toString()
        const tMonth = (getMonth(date) + 1).toString()
        const tQuarter = getQuarter(date).toString()

        if (year !== 'all' && tYear !== year) return false
        if (month !== 'all' && tMonth !== month) return false
        if (quarter !== 'all' && tQuarter !== quarter) return false

        return true
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    const total = filtered.reduce((acc, t) => acc + t.valor, 0)

    return { filteredData: filtered, totalCosts: total }
  }, [transactions, year, month, quarter])

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          Custos Operacionais
        </h2>
        <p className="text-muted-foreground mt-1">
          Acompanhamento de despesas gerais da companhia (Despesa da Cia).
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
        <CardContent className="p-0">
          <div className="rounded-b-md border-x-0 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold w-[120px]">Data</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="text-right font-semibold">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-600">
                        {format(parseISO(item.data), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {item.categoria}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(item.valor)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum custo operacional encontrado para este período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-slate-50 text-slate-900 font-bold border-t-2">
                <TableRow>
                  <TableCell colSpan={3} className="text-right uppercase text-xs tracking-wider">
                    Total de Custos Operacionais
                  </TableCell>
                  <TableCell className="text-right text-lg text-red-700">
                    {formatCurrency(totalCosts)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
