import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit2, Search, ArrowUpDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useBrokers } from '@/contexts/BrokerContext'
import { Broker } from '@/types'
import { Label } from '@/components/ui/label'

export function BrokerSettings() {
  const { brokers, addBroker, updateBroker, deleteBroker } = useBrokers()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof Broker; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc',
  })

  const [editingBroker, setEditingBroker] = useState<Broker | 'new' | null>(null)
  const [formData, setFormData] = useState<Partial<Broker>>({})

  const filteredAndSorted = useMemo(() => {
    let result = brokers.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
    result.sort((a, b) => {
      const valA = String(a[sortConfig.key] || '').toLowerCase()
      const valB = String(b[sortConfig.key] || '').toLowerCase()
      if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1
      if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [brokers, searchTerm, sortConfig])

  const handleSort = (key: keyof Broker) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const openEdit = (b: Broker) => {
    setFormData(b)
    setEditingBroker(b)
  }

  const openNew = () => {
    setFormData({ role: 'Corretor', level: 'Júnior', percentage: 0, name: '' })
    setEditingBroker('new')
  }

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: 'Atenção', description: 'Nome é obrigatório.', variant: 'destructive' })
      return
    }

    const finalBroker: Broker = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name,
      role: formData.role || 'Corretor',
      level: formData.role === 'Corretor' ? formData.level || 'Júnior' : '',
      percentage: Number(formData.percentage) || 0,
    }

    if (editingBroker === 'new') {
      addBroker(finalBroker)
      toast({ title: 'Sucesso', description: 'Colaborador adicionado com sucesso.' })
    } else {
      updateBroker(finalBroker)
      toast({ title: 'Sucesso', description: 'Colaborador atualizado com sucesso.' })
    }
    setEditingBroker(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>
              Registre e gerencie a equipe, definindo cargos, níveis e porcentagens.
            </CardDescription>
          </div>
          <Button onClick={openNew} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-md bg-white"
            />
          </div>

          <div className="border rounded-md bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div
                className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => handleSort('name')}
              >
                Nome <ArrowUpDown className="w-3 h-3" />
              </div>
              <div
                className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => handleSort('role')}
              >
                Cargo <ArrowUpDown className="w-3 h-3" />
              </div>
              <div className="col-span-2">Nível</div>
              <div className="col-span-2">Porcentagem</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredAndSorted.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-slate-50/30">
                  Nenhum colaborador encontrado.
                </div>
              ) : (
                filteredAndSorted.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="col-span-4 font-medium text-slate-700">{b.name}</div>
                    <div className="col-span-3 text-slate-600">{b.role}</div>
                    <div className="col-span-2 text-slate-600">{b.level || '-'}</div>
                    <div className="col-span-2 font-medium text-slate-700">{b.percentage}%</div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(b)}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBroker(b.id)}
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingBroker} onOpenChange={(open) => !open && setEditingBroker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingBroker === 'new' ? 'Novo Colaborador' : 'Editar Colaborador'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select
                  value={formData.role || 'Corretor'}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corretor">Corretor</SelectItem>
                    <SelectItem value="Gerente de Equipe">Gerente de Equipe</SelectItem>
                    <SelectItem value="Gerente Geral">Gerente Geral</SelectItem>
                    <SelectItem value="Apoio">Apoio</SelectItem>
                    <SelectItem value="Captador">Captador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Porcentagem (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.percentage ?? 0}
                  onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                />
              </div>
            </div>
            {formData.role === 'Corretor' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label>Nível (Apenas Corretores)</Label>
                <Select
                  value={formData.level || 'Júnior'}
                  onValueChange={(v) => setFormData({ ...formData, level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Júnior">Júnior</SelectItem>
                    <SelectItem value="Pleno">Pleno</SelectItem>
                    <SelectItem value="Sênior">Sênior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBroker(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
