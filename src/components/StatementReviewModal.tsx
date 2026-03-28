import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ParsedTransaction } from '@/lib/statement-parser'
import { useExpenseAliases } from '@/hooks/use-expense-aliases'
import { Pencil, User, Building2, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReviewedTransaction = ParsedTransaction & {
  included: boolean
  displayName: string
  classification: 'personal' | 'company' | null
}

interface StatementReviewModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: ParsedTransaction[]
  onConfirm: (reviewedData: ReviewedTransaction[]) => void
}

export function StatementReviewModal({
  isOpen,
  onClose,
  transactions,
  onConfirm,
}: StatementReviewModalProps) {
  const { getAlias } = useExpenseAliases()
  const [data, setData] = useState<ReviewedTransaction[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setData(
        transactions.map((t) => ({
          ...t,
          included: true,
          classification: null,
          displayName: getAlias(t.originalName) || t.originalName,
        })),
      )
    }
  }, [isOpen, transactions, getAlias])

  const updateItem = (id: string, updates: Partial<ReviewedTransaction>) => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const toggleAll = (checked: boolean) => {
    setData((prev) => prev.map((item) => ({ ...item, included: checked })))
  }

  const totalFound = data.length
  const includedItems = data.filter((d) => d.included)
  const pendingItems = includedItems.filter((d) => !d.classification)
  const readyItems = includedItems.filter((d) => d.classification)
  const readySum = readyItems.reduce((acc, curr) => acc + curr.amount, 0)

  const allIncluded = includedItems.length === data.length && data.length > 0

  const handleConfirm = () => {
    onConfirm(includedItems)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Revisão de Extrato</span>
            <div className="flex gap-3 text-sm font-normal">
              <Badge variant="outline" className="text-slate-600">
                Total: {totalFound}
              </Badge>
              {pendingItems.length > 0 && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                >
                  Pendentes: {pendingItems.length}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
              >
                Prontos: {readyItems.length} (
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  readySum,
                )}
                )
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2 bg-slate-50 border-b flex items-center gap-4 text-sm font-medium text-slate-500">
          <Checkbox checked={allIncluded} onCheckedChange={toggleAll} />
          <div className="w-24">Data</div>
          <div className="flex-1">Descrição</div>
          <div className="w-32 text-right">Valor</div>
          <div className="w-48 text-center">Classificação</div>
        </div>

        <ScrollArea className="flex-1 px-6 py-2">
          <div className="space-y-2">
            {data.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                  item.included
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-transparent opacity-60',
                  item.included && !item.classification && 'border-red-200 bg-red-50/30',
                )}
              >
                <Checkbox
                  checked={item.included}
                  onCheckedChange={(c) => updateItem(item.id, { included: !!c })}
                />

                <div className="w-24 text-sm text-slate-600">
                  {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  {editingId === item.id ? (
                    <Input
                      autoFocus
                      className="h-8 text-sm"
                      value={item.displayName}
                      onChange={(e) => updateItem(item.id, { displayName: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    />
                  ) : (
                    <div
                      className="text-sm font-medium cursor-pointer hover:text-primary flex items-center gap-2 group"
                      onClick={() => item.included && setEditingId(item.id)}
                    >
                      {item.displayName}
                      {item.included && (
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  )}
                </div>

                <div className="w-32 text-right text-sm font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.amount,
                  )}
                </div>

                <div className="w-48 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!item.included}
                    className={cn(
                      'h-8 px-2 w-full max-w-[90px]',
                      item.classification === 'personal'
                        ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                        : 'hover:bg-slate-100',
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
                      'h-8 px-2 w-full max-w-[90px]',
                      item.classification === 'company'
                        ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                        : 'hover:bg-slate-100',
                    )}
                    onClick={() => updateItem(item.id, { classification: 'company' })}
                  >
                    <Building2 className="w-4 h-4 mr-1" />
                    Empresa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between sm:justify-between">
          <div className="text-sm text-slate-500 flex items-center gap-2">
            {pendingItems.length > 0 && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 font-medium">
                  Classifique os itens pendentes para continuar.
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={pendingItems.length > 0 || includedItems.length === 0}
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
