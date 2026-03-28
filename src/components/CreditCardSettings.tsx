import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, Edit2, CreditCard } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useSettings } from '@/contexts/SettingsContext'
import { CreditCardConfig } from '@/types'

export function CreditCardSettings() {
  const { creditCards, addCreditCard, updateCreditCard, removeCreditCard } = useSettings()
  const [editingCard, setEditingCard] = useState<CreditCardConfig | 'new' | null>(null)
  const [formData, setFormData] = useState<Partial<CreditCardConfig>>({})

  const openNew = () => {
    setFormData({ name: '', closingDay: 1, bestPurchaseDay: 2 })
    setEditingCard('new')
  }

  const openEdit = (c: CreditCardConfig) => {
    setFormData(c)
    setEditingCard(c)
  }

  const handleSave = () => {
    if (!formData.name || !formData.closingDay || !formData.bestPurchaseDay) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    const payload = {
      name: formData.name,
      closingDay: Number(formData.closingDay),
      bestPurchaseDay: Number(formData.bestPurchaseDay),
    }

    if (editingCard === 'new') {
      addCreditCard(payload)
      toast({ title: 'Sucesso', description: 'Cartão adicionado.' })
    } else if (editingCard && editingCard !== 'new') {
      updateCreditCard({ ...payload, id: editingCard.id })
      toast({ title: 'Sucesso', description: 'Cartão atualizado.' })
    }
    setEditingCard(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cartões de Crédito</CardTitle>
          <CardDescription>
            Configure os dias de fechamento e melhor dia de compra de cada cartão.
          </CardDescription>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Adicionar Cartão
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Cartão</TableHead>
                <TableHead className="text-center">Dia de Fechamento</TableHead>
                <TableHead className="text-center">Melhor Dia p/ Compra</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditCards.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    {c.name}
                  </TableCell>
                  <TableCell className="text-center">{c.closingDay}</TableCell>
                  <TableCell className="text-center">{c.bestPurchaseDay}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeCreditCard(c.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {creditCards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum cartão configurado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCard === 'new' ? 'Novo Cartão' : 'Editar Cartão'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Cartão (ex: Nubank, Santander)</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Nubank"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia de Fechamento</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.closingDay || ''}
                  onChange={(e) => setFormData({ ...formData, closingDay: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Melhor Dia p/ Compra</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.bestPurchaseDay || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, bestPurchaseDay: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
