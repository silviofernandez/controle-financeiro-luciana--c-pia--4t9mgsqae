import { useState } from 'react'
import { CommissionTeam, CommissionRule, RuleVariation } from '@/types'
import { useCommissions } from '@/contexts/CommissionContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Plus, Save } from 'lucide-react'

interface EditorProps {
  team: CommissionTeam
  onDone: () => void
}

export function CommissionTeamEditor({ team, onDone }: EditorProps) {
  const { saveTeam } = useCommissions()
  const [draft, setDraft] = useState<CommissionTeam>(team)

  const addRule = () => {
    const newRule: CommissionRule = {
      id: crypto.randomUUID(),
      role: '',
      variations: [{ id: crypto.randomUUID(), name: 'Padrão', value: 0, type: 'percentage' }],
    }
    setDraft({ ...draft, rules: [...draft.rules, newRule] })
  }

  const removeRule = (id: string) => {
    setDraft({ ...draft, rules: draft.rules.filter((r) => r.id !== id) })
  }

  const updateRule = (id: string, updates: Partial<CommissionRule>) => {
    setDraft({
      ...draft,
      rules: draft.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })
  }

  const addVariation = (ruleId: string) => {
    const rule = draft.rules.find((r) => r.id === ruleId)
    if (!rule) return
    const newVar: RuleVariation = {
      id: crypto.randomUUID(),
      name: 'Nova Variação',
      value: 0,
      type: 'percentage',
    }
    updateRule(ruleId, { variations: [...rule.variations, newVar] })
  }

  const updateVariation = (ruleId: string, varId: string, updates: Partial<RuleVariation>) => {
    const rule = draft.rules.find((r) => r.id === ruleId)
    if (!rule) return
    const vars = rule.variations.map((v) => (v.id === varId ? { ...v, ...updates } : v))
    updateRule(ruleId, { variations: vars })
  }

  const removeVariation = (ruleId: string, varId: string) => {
    const rule = draft.rules.find((r) => r.id === ruleId)
    if (!rule || rule.variations.length <= 1) return
    updateRule(ruleId, { variations: rule.variations.filter((v) => v.id !== varId) })
  }

  const handleSave = () => {
    if (!draft.name.trim()) return
    saveTeam(draft)
    onDone()
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Configurar Equipe</CardTitle>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Salvar Equipe
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Equipe</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Ex: Lançamentos Jaú"
              className="max-w-md bg-white"
            />
          </div>
          <div className="flex gap-8">
            <div className="flex items-center space-x-2">
              <Switch
                checked={draft.defaultTax}
                onCheckedChange={(c) => setDraft({ ...draft, defaultTax: c })}
              />
              <Label className="font-normal">Deduzir Nota Fiscal (15%) por padrão</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={draft.defaultLegal}
                onCheckedChange={(c) => setDraft({ ...draft, defaultLegal: c })}
              />
              <Label className="font-normal">Deduzir Jurídico (R$ 200) por padrão</Label>
            </div>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[250px]">Papel / Participante</TableHead>
                <TableHead>Variações de Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Nenhuma regra adicionada.
                  </TableCell>
                </TableRow>
              )}
              {draft.rules.map((rule) => (
                <TableRow key={rule.id} className="align-top">
                  <TableCell className="pt-4">
                    <Input
                      placeholder="Ex: Corretor"
                      value={rule.role}
                      onChange={(e) => updateRule(rule.id, { role: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="pt-4 space-y-2">
                    {rule.variations.map((v) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Nome (ex: Pleno)"
                          value={v.name}
                          onChange={(e) => updateVariation(rule.id, v.id, { name: e.target.value })}
                          className="w-[140px]"
                          disabled={rule.variations.length === 1 && v.name === 'Padrão'}
                        />
                        <Input
                          type="number"
                          value={v.value}
                          onChange={(e) =>
                            updateVariation(rule.id, v.id, { value: Number(e.target.value) })
                          }
                          className="w-[100px]"
                        />
                        <Select
                          value={v.type}
                          onValueChange={(val: any) =>
                            updateVariation(rule.id, v.id, { type: val })
                          }
                        >
                          <SelectTrigger className="w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">R$</SelectItem>
                          </SelectContent>
                        </Select>
                        {rule.variations.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariation(rule.id, v.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVariation(rule.id)}
                      className="mt-2 text-xs h-7"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Adicionar Nível
                    </Button>
                  </TableCell>
                  <TableCell className="pt-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="secondary" onClick={addRule} className="w-full border border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Papel
        </Button>
      </CardContent>
    </Card>
  )
}
