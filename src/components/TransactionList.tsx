import { useState, useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { format, isSameMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, Search, X, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import { UNIDADES, BANCOS } from '@/types'

export function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions()
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [filterUnidade, setFilterUnidade] = useState<string>('all')
  const [filterBanco, setFilterBanco] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const formattedMonthTitle = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })

  const filteredTransactions = transactions.filter((t) => {
    const matchesUnidade = filterUnidade === 'all' || t.unidade === filterUnidade
    const matchesBanco = filterBanco === 'all' || t.banco === filterBanco
    const matchesSearch =
      !searchTerm ||
      (typeof t.descricao === 'string' &&
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesMonth = false
    if (t.data) {
      try {
        const tDate = typeof t.data === 'string' ? parseISO(t.data) : new Date(t.data)
        if (!isNaN(tDate.getTime())) {
          matchesMonth = isSameMonth(tDate, selectedMonth)
        }
      } catch (e) {
        matchesMonth = false
      }
    }

    return matchesUnidade && matchesBanco && matchesSearch && matchesMonth
  })

  const totals = useMemo(() => {
    let receitas = 0
    let despesas = 0
    filteredTransactions.forEach((t) => {
      if (!t.isCheckpoint) {
        if (t.tipo === 'receita') receitas += Number(t.valor) || 0
        if (t.tipo === 'despesa') despesas += Number(t.valor) || 0
      }
    })
    return { receitas, despesas, saldo: receitas - despesas }
  }, [filteredTransactions])

  const formatDateSafe = (dateString: string | undefined | null) => {
    try {
      if (!dateString || typeof dateString !== 'string') return '-'
      const date = parseISO(dateString)
      if (isNaN(date.getTime())) return '-'
      return format(date, 'dd/MM/yy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  return (
    <Card className="shadow-md border-blue-100/50 flex-1 flex flex-col h-full overflow-hidden animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg flex flex-col gap-4 shrink-0">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Extrato Detalhado
              <Badge
                variant="outline"
                className="text-[10px] bg-white border-blue-200 text-blue-700 font-medium ml-2 capitalize"
              >
                {formattedMonthTitle}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3 bg-white/60 px-3 py-1.5 rounded-md border border-blue-100/50 w-fit">
              <span className="text-xs text-muted-foreground font-medium mr-1">Resumo:</span>
              <span className="text-xs text-green-600 font-semibold" title="Total Receitas">
                + {formatCurrency(totals.receitas)}
              </span>
              <span className="text-xs text-red-500 font-semibold" title="Total Despesas">
                - {formatCurrency(totals.despesas)}
              </span>
              <div className="w-px h-3 bg-slate-200 mx-1"></div>
              <span
                className={`text-xs font-bold ${totals.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                title="Saldo do Período"
              >
                {formatCurrency(totals.saldo)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 items-center">
            <div className="flex items-center bg-white border border-blue-200 rounded-md h-8 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-8 rounded-none hover:bg-blue-50/50 text-blue-600"
                onClick={handlePrevMonth}
                title="Mês Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center px-3 min-w-[140px] text-xs font-medium text-blue-900 capitalize border-x border-blue-100/50 h-full bg-blue-50/30">
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                {formattedMonthTitle}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full w-8 rounded-none hover:bg-blue-50/50 text-blue-600"
                onClick={handleNextMonth}
                title="Próximo Mês"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-[130px] h-8 bg-white text-xs">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {UNIDADES.filter((u) => u && typeof u === 'string' && u.trim() !== '').map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBanco} onValueChange={setFilterBanco}>
              <SelectTrigger className="w-[130px] h-8 bg-white text-xs">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                {BANCOS.filter((b) => b && typeof b === 'string' && b.trim() !== '').map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar despesas ou receitas..."
            className="pl-9 pr-9 bg-white h-9 text-sm border-blue-100 focus-visible:ring-blue-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white/50">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center flex-1 animate-in fade-in duration-300">
            <CalendarIcon className="w-12 h-12 mb-4 text-slate-200" />
            <p className="font-medium text-slate-600">
              Nenhum lançamento encontrado para este período.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tente ajustar os filtros ou selecionar outro mês.
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 h-full">
            <Table className="w-full relative">
              <TableHeader className="bg-slate-50/90 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[80px] whitespace-nowrap text-xs font-semibold">
                    Data
                  </TableHead>
                  <TableHead className="min-w-[180px] text-xs font-semibold">Histórico</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold">
                    Unidade
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-xs font-semibold">
                    Status/Banco
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-xs font-semibold">
                    Observações
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-center text-xs font-semibold">
                    Tipo
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap text-xs font-semibold">
                    Valor
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow
                    key={t.id}
                    className={`group transition-colors hover:bg-slate-50/80 ${
                      t.isCheckpoint
                        ? 'bg-emerald-50/40 border-l-4 border-l-emerald-500 hover:bg-emerald-50/60'
                        : 'border-l-4 border-l-transparent hover:border-l-blue-200'
                    }`}
                  >
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium">
                      {formatDateSafe(t.data)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm block ${t.isCheckpoint ? 'text-emerald-800 italic font-medium' : 'text-slate-700'}`}
                      >
                        {typeof t.descricao === 'string' ? t.descricao : 'Sem descrição'}
                      </span>
                      <div className="flex md:hidden gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-white/50">
                          {t.unidade}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4 bg-slate-100"
                        >
                          {t.banco}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-slate-600 font-medium">{t.unidade}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="secondary"
                        className="font-normal text-[10px] bg-slate-100 text-slate-600"
                      >
                        {t.banco}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px]">
                      {t.observacoes ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block text-[11px] text-slate-500 cursor-help">
                              {t.observacoes}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px] text-xs z-50">
                            {t.observacoes}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {t.tipo === 'despesa' && t.classificacao && !t.isCheckpoint && (
                        <Badge
                          variant="outline"
                          className={`font-medium text-[9px] uppercase tracking-wider ${t.classificacao === 'fixo' ? 'text-indigo-600 border-indigo-200 bg-indigo-50/50' : 'text-amber-600 border-amber-200 bg-amber-50/50'}`}
                        >
                          {t.classificacao === 'fixo' ? 'Fixo' : 'Variável'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium whitespace-nowrap ${
                        t.isCheckpoint
                          ? 'text-emerald-700'
                          : t.tipo === 'receita'
                            ? 'text-green-600'
                            : 'text-red-600'
                      }`}
                    >
                      {t.isCheckpoint ? '' : t.tipo === 'receita' ? '+' : '-'}{' '}
                      {formatCurrency(Number(t.valor) || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
