import { useState, useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, Download, Filter } from 'lucide-react'
import { CATEGORIES, UNIDADES } from '@/types'
import { toast } from '@/hooks/use-toast'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'

export default function Reports() {
  const { transactions } = useTransactions()
  const [activeTab, setActiveTab] = useState('geral')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [unit, setUnit] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [highlightDate, setHighlightDate] = useState<string | null>(null)

  const handleExport = () => {
    toast({
      title: 'Exportando relatório',
      description: 'O documento está sendo gerado com os filtros atuais.',
    })

    setTimeout(() => {
      const headers = ['Data', 'Descrição', 'Observação', 'Categoria', 'Unidade', 'Tipo', 'Valor']
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map((t) => {
          const date = format(new Date(t.data), 'dd/MM/yyyy')
          const desc = `"${(t.descricao || '').replace(/"/g, '""')}"`
          const obs = `"${(t.observacoes || '').replace(/"/g, '""')}"`
          const cat = `"${t.categoria || ''}"`
          const unit = `"${t.unidade || ''}"`
          const type = t.tipo
          const val = t.valor
          return `${date},${desc},${obs},${cat},${unit},${type},${val}`
        }),
      ].join('\n')

      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio_${activeTab}_${format(new Date(), 'yyyyMMdd')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 500)
  }

  const handleAdjustDivergence = (date: string) => {
    setHighlightDate(date)
    setActiveTab('geral')
    setUnit('all')
    setCategory('all')
    setStartDate('')
    setEndDate('')

    setTimeout(() => {
      const tableEl = document.getElementById('transactions-table')
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => !t.isCheckpoint)

    // Tab Filter
    if (activeTab === 'operacional') {
      filtered = filtered.filter((t) => t.categoria !== 'Comissão' && t.categoria !== 'Comissões')
    } else if (activeTab === 'comissoes') {
      filtered = filtered.filter((t) => t.categoria === 'Comissão' || t.categoria === 'Comissões')
    }

    // Global Filters
    if (unit !== 'all') {
      const unitToMatch = unit === 'Lençóis' ? 'L. Paulista' : unit
      filtered = filtered.filter((t) => t.unidade === unitToMatch)
    }

    if (category !== 'all') {
      filtered = filtered.filter((t) => t.categoria === category)
    }

    if (startDate) {
      try {
        const start = startOfDay(parseISO(startDate)).getTime()
        filtered = filtered.filter((t) => {
          const tTime = parseISO(t.data).getTime()
          return !isNaN(tTime) && tTime >= start
        })
      } catch (e) {
        // Ignore invalid start date
      }
    }

    if (endDate) {
      try {
        const end = endOfDay(parseISO(endDate)).getTime()
        filtered = filtered.filter((t) => {
          const tTime = parseISO(t.data).getTime()
          return !isNaN(tTime) && tTime <= end
        })
      } catch (e) {
        // Ignore invalid end date
      }
    }

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [transactions, activeTab, unit, category, startDate, endDate])

  const summary = useMemo(() => {
    const entradas = filteredTransactions
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const saidas = filteredTransactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0)

    const saldo = entradas - saidas

    return { entradas, saidas, saldo }
  }, [filteredTransactions])

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Alimentação: 'bg-orange-100 text-orange-800',
      Transporte: 'bg-blue-100 text-blue-800',
      Casa: 'bg-teal-100 text-teal-800',
      Saúde: 'bg-red-100 text-red-800',
      Lazer: 'bg-purple-100 text-purple-800',
      Trabalho: 'bg-indigo-100 text-indigo-800',
      Impostos: 'bg-rose-100 text-rose-800',
      Fornecedores: 'bg-amber-100 text-amber-800',
      'Folha de Pagamento': 'bg-cyan-100 text-cyan-800',
      Comissão: 'bg-emerald-100 text-emerald-800',
      Outros: 'bg-slate-100 text-slate-800',
    }
    return colors[cat] || 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <ReconciliationAlert onAdjust={handleAdjustDivergence} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Central de Relatórios Avançados
          </h2>
          <p className="text-muted-foreground mt-1">
            Analise o desempenho financeiro geral, operacional e de comissões.
          </p>
        </div>
        <Button
          onClick={handleExport}
          className="whitespace-nowrap shadow-sm bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Filter className="w-4 h-4 text-primary" /> Filtros Globais
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="start-date"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Data Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="end-date"
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unidade
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas as Unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Categoria
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-3 h-auto gap-2 p-1 bg-slate-100/50">
          <TabsTrigger
            value="geral"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2"
          >
            Relatório Geral
          </TabsTrigger>
          <TabsTrigger
            value="operacional"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2"
          >
            Relatório Operacional
          </TabsTrigger>
          <TabsTrigger
            value="comissoes"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2"
          >
            Relatório de Comissões
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Entradas
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.entradas)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Saídas</CardTitle>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.saidas)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-800">Saldo do Período</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.saldo >= 0 ? 'text-blue-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(summary.saldo)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card
          id="transactions-table"
          className="shadow-sm border-slate-200 overflow-hidden print:shadow-none print:border-none"
        >
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 print:bg-transparent print:border-b-2 print:border-slate-800">
            <CardTitle className="text-lg text-slate-800">Detalhamento de Transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative scroll-smooth print:max-h-none print:overflow-visible">
              <Table>
                <TableHeader className="bg-white sticky top-0 z-10 shadow-sm print:shadow-none print:bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Descrição / Observação</TableHead>
                    <TableHead className="w-[180px]">Categoria</TableHead>
                    <TableHead className="w-[140px]">Unidade</TableHead>
                    <TableHead className="text-right w-[140px]">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => {
                    const isHighlighted =
                      highlightDate &&
                      (() => {
                        try {
                          return (
                            new Date(t.data).toISOString().split('T')[0] ===
                            new Date(highlightDate).toISOString().split('T')[0]
                          )
                        } catch {
                          return false
                        }
                      })()

                    return (
                      <TableRow
                        key={t.id}
                        className={cn(
                          'transition-colors',
                          isHighlighted
                            ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                            : 'hover:bg-slate-50/50',
                        )}
                      >
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {format(new Date(t.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{t.descricao}</div>
                          {t.observacoes && (
                            <div
                              className="text-xs text-slate-500 mt-0.5 line-clamp-1 print:line-clamp-none"
                              title={t.observacoes}
                            >
                              {t.observacoes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-medium border-none ${getCategoryColor(t.categoria)} print:border print:border-slate-300 print:bg-transparent print:text-slate-800`}
                          >
                            {t.categoria || 'Sem categoria'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{t.unidade}</TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-mono font-medium whitespace-nowrap',
                            t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600',
                          )}
                        >
                          {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(t.valor))}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum lançamento encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
