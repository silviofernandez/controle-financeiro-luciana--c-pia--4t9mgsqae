import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ParsedTransaction } from '@/lib/statement-parser'
import { useExpenseAliases } from '@/hooks/use-expense-aliases'
import { useTransactions } from '@/contexts/TransactionContext'
import { Pencil, User, Building2, Check, Search, Filter, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReviewedTransaction = ParsedTransaction & {
  included: boolean
  displayName: string
  classification: 'personal' | 'company' | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  transactions: ParsedTransaction[]
  onConfirm: (reviewedData: ReviewedTransaction[]) => void
}

function FilterBar({
  searchTerm,
  setSearchTerm,
  minDate,
  setMinDate,
  maxDate,
  setMaxDate,
  minValue,
  setMinValue,
  maxValue,
  setMaxValue,
}: any) {
  const hasFilters = minDate || maxDate || minValue || maxValue
  return (
    <div className="px-6 py-3 bg-white border-b flex-shrink-0 flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por descrição original ou apelido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="w-4 h-4" /> Filtros Avançados
            {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Data Inicial</Label>
                <Input
                  type="date"
                  value={minDate}
                  onChange={(e) => setMinDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Final</Label>
                <Input
                  type="date"
                  value={maxDate}
                  onChange={(e) => setMaxDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor Mín</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Máx</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setMinDate('')
                  setMaxDate('')
                  setMinValue('')
                  setMaxValue('')
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function StatementReviewModal({ isOpen, onClose, transactions, onConfirm }: Props) {
  const { getRule, setRule } = useExpenseAliases()
  const { transactions: existingTransactions = [] } = useTransactions() || {}
  const [data, setData] = useState<ReviewedTransaction[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setData(
        transactions.map((t) => {
          const rule = getRule(t.originalName)
          return {
            ...t,
            included: true,
            classification: rule.classification || 'personal',
            displayName: rule.alias || t.originalName,
          }
        }),
      )
      setSearchTerm('')
      setMinDate('')
      setMaxDate('')
      setMinValue('')
      setMaxValue('')
    }
  }, [isOpen, transactions, getRule])

  const updateItem = (id: string, updates: Partial<ReviewedTransaction>) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          if (updates.classification !== undefined || updates.displayName !== undefined) {
            setRule(updated.originalName, {
              classification: updated.classification,
              alias: updated.displayName === updated.originalName ? null : updated.displayName,
            })
          }
          return updated
        }
        return item
      }),
    )
  }

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const matchSearch =
          item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.originalName.toLowerCase().includes(searchTerm.toLowerCase())
        const itemDate = new Date(item.date)
        return (
          matchSearch &&
          (!minDate || itemDate >= new Date(minDate)) &&
          (!maxDate || itemDate <= new Date(maxDate)) &&
          (!minValue || item.amount >= Number(minValue)) &&
          (!maxValue || item.amount <= Number(maxValue))
        )
      }),
    [data, searchTerm, minDate, maxDate, minValue, maxValue],
  )

  const toggleAllFiltered = (checked: boolean) => {
    const filteredIds = new Set(filteredData.map((d) => d.id))
    setData((prev) =>
      prev.map((item) => (filteredIds.has(item.id) ? { ...item, included: checked } : item)),
    )
  }

  const markAllFilteredAs = (type: 'personal' | 'company') => {
    const filteredIds = new Set(filteredData.map((d) => d.id))
    setData((prev) =>
      prev.map((item) => {
        if (filteredIds.has(item.id) && item.included) {
          setRule(item.originalName, { classification: type })
          return { ...item, classification: type }
        }
        return item
      }),
    )
  }

  const checkDuplicate = (item: ReviewedTransaction) => {
    if (!existingTransactions.length) return false
    const itemDateStr = new Date(item.date).toISOString().split('T')[0]
    return existingTransactions.some(
      (et) =>
        Math.abs(et.valor - item.amount) < 0.01 &&
        new Date(et.data).toISOString().split('T')[0] === itemDateStr,
    )
  }

  const includedFilteredItems = filteredData.filter((d) => d.included)
  const readyItems = includedFilteredItems.filter((d) => d.classification)
  const allIncludedItemsToImport = data.filter((d) => d.included)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Revisão de Extrato</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 mr-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAllFilteredAs('company')}
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  Marcar Empresa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => markAllFilteredAs('personal')}
                >
                  <User className="w-3 h-3 mr-1" />
                  Marcar Pessoal
                </Button>
              </div>
              <div className="flex gap-3 text-sm font-normal">
                <Badge variant="outline">Encontrados: {filteredData.length}</Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Selecionados: {readyItems.length}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          minDate={minDate}
          setMinDate={setMinDate}
          maxDate={maxDate}
          setMaxDate={setMaxDate}
          minValue={minValue}
          setMinValue={setMinValue}
          maxValue={maxValue}
          setMaxValue={setMaxValue}
        />

        <div className="px-6 py-2 bg-slate-50 border-b flex-shrink-0 flex items-center gap-4 text-sm font-medium text-slate-500">
          <Checkbox
            checked={
              includedFilteredItems.length === filteredData.length && filteredData.length > 0
            }
            onCheckedChange={toggleAllFiltered}
          />
          <div className="w-24">Data</div>
          <div className="flex-1">Descrição</div>
          <div className="w-32 text-right">Valor</div>
          <div className="w-48 text-center">Classificação</div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-2">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <Filter className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhuma transação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((item) => {
                const isDuplicate = checkDuplicate(item)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border',
                      item.included
                        ? isDuplicate
                          ? 'bg-orange-50/50 border-orange-200'
                          : 'bg-white border-slate-200'
                        : 'bg-slate-50 opacity-60',
                    )}
                  >
                    <Checkbox
                      checked={item.included}
                      onCheckedChange={(c) => updateItem(item.id, { included: !!c })}
                    />
                    <div className="w-24 text-sm">
                      {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {editingId === item.id ? (
                          <Input
                            autoFocus
                            className="h-8 text-sm max-w-[300px]"
                            value={item.displayName}
                            onChange={(e) => updateItem(item.id, { displayName: e.target.value })}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                          />
                        ) : (
                          <div
                            className="text-sm font-medium cursor-pointer flex items-center gap-2 group truncate"
                            onClick={() => item.included && setEditingId(item.id)}
                          >
                            <span className="truncate">{item.displayName}</span>
                            {item.included && (
                              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            )}
                          </div>
                        )}
                        {isDuplicate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="destructive"
                                className="bg-orange-500 hover:bg-orange-600 h-5 px-1.5 py-0 flex items-center gap-1 cursor-help shrink-0 text-[10px]"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span className="hidden sm:inline">Possível Duplicata</span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Uma transação com mesmo valor e data já existe no sistema.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {item.displayName !== item.originalName && (
                        <div className="text-[10px] text-slate-400 truncate w-full">
                          Original: {item.originalName}
                        </div>
                      )}
                    </div>
                    <div className="w-32 text-right text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.amount)}
                    </div>
                    <div className="w-48 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.included}
                        className={cn(
                          'h-8 px-2 max-w-[90px]',
                          item.classification === 'personal'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : '',
                        )}
                        onClick={() => updateItem(item.id, { classification: 'personal' })}
                      >
                        <User className="w-4 h-4 mr-1" />
                        Pessoal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!item.included}
                        className={cn(
                          'h-8 px-2 max-w-[90px]',
                          item.classification === 'company'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : '',
                        )}
                        onClick={() => updateItem(item.id, { classification: 'company' })}
                      >
                        <Building2 className="w-4 h-4 mr-1" />
                        Empresa
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-slate-500">
            {allIncludedItemsToImport.length} itens prontos para importar
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onConfirm(allIncludedItemsToImport)
                onClose()
              }}
              disabled={allIncludedItemsToImport.length === 0}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar Importação
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
