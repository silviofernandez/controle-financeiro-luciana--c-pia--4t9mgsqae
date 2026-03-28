import { useState } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Edit2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TeamRoleForm, Role } from './TeamRoleForm'
import { TeamRoleList } from './TeamRoleList'
import { CommissionTeam, CommissionRule } from '@/types'

export function CommissionSettings() {
  const { teams, addTeam, updateTeam, deleteTeam } = useCommissions() as any

  const [editingTeam, setEditingTeam] = useState<CommissionTeam | 'new' | null>(null)

  const [teamName, setTeamName] = useState('')
  const [taxPercentage, setTaxPercentage] = useState<string>('15')
  const [legalFixedValue, setLegalFixedValue] = useState<string>('200')
  const [defaultTax, setDefaultTax] = useState(true)
  const [defaultLegal, setDefaultLegal] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])

  const openEdit = (team: CommissionTeam) => {
    setTeamName(team.name)
    setTaxPercentage(team.taxPercentage !== undefined ? team.taxPercentage.toString() : '15')
    setLegalFixedValue(team.legalValue !== undefined ? team.legalValue.toString() : '200')
    setDefaultTax(team.defaultTax)
    setDefaultLegal(team.defaultLegal)

    const mappedRoles: Role[] = team.rules.map((r) => {
      const isCorretor = r.role.toLowerCase() === 'corretor'
      if (isCorretor && r.variations.length >= 3) {
        return {
          id: r.id,
          name: r.role,
          type: 'Percentual',
          levels: {
            junior: r.variations.find((v) => v.name === 'Júnior')?.value || 0,
            pleno: r.variations.find((v) => v.name === 'Pleno')?.value || 0,
            senior: r.variations.find((v) => v.name === 'Sênior')?.value || 0,
          },
        }
      }
      const val = r.variations[0]
      return {
        id: r.id,
        name: r.role,
        type: val?.type === 'percentage' ? 'Percentual' : 'Valor Fixo',
        value: val?.value || 0,
      }
    })
    setRoles(mappedRoles)
    setEditingTeam(team)
  }

  const openNew = () => {
    setTeamName('')
    setTaxPercentage('15')
    setLegalFixedValue('200')
    setDefaultTax(true)
    setDefaultLegal(true)
    setRoles([])
    setEditingTeam('new')
  }

  const handleSave = () => {
    if (!teamName) return

    const rules: CommissionRule[] = roles.map((r) => {
      const isCorretor = r.name.toLowerCase() === 'corretor'
      return {
        id: r.id || crypto.randomUUID(),
        role: r.name,
        variations:
          isCorretor && r.levels
            ? [
                {
                  id: crypto.randomUUID(),
                  name: 'Júnior',
                  value: r.levels.junior,
                  type: 'percentage',
                },
                {
                  id: crypto.randomUUID(),
                  name: 'Pleno',
                  value: r.levels.pleno,
                  type: 'percentage',
                },
                {
                  id: crypto.randomUUID(),
                  name: 'Sênior',
                  value: r.levels.senior,
                  type: 'percentage',
                },
              ]
            : [
                {
                  id: crypto.randomUUID(),
                  name: 'Padrão',
                  value: r.value || 0,
                  type: r.type === 'Percentual' ? 'percentage' : 'fixed',
                },
              ],
      }
    })

    const finalTeam: CommissionTeam = {
      id: editingTeam === 'new' ? crypto.randomUUID() : editingTeam?.id || '',
      name: teamName,
      defaultTax,
      defaultLegal,
      taxPercentage: Number(taxPercentage),
      legalValue: Number(legalFixedValue),
      rules,
    }

    if (editingTeam === 'new') {
      if (addTeam) addTeam(finalTeam)
    } else {
      if (updateTeam) updateTeam(finalTeam)
    }
    setEditingTeam(null)
  }

  return (
    <Card className="shadow-md border-blue-100/50">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Equipes e Regras</CardTitle>
          <CardDescription>Configure os percentuais e valores por equipe.</CardDescription>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Equipe
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {teams.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Nenhuma equipe configurada.</div>
        ) : (
          <div className="grid gap-4">
            {teams.map((team: CommissionTeam) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{team.name}</h4>
                    <p className="text-xs text-muted-foreground">{team.rules.length} regras</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(team)}
                    className="h-8 w-8 text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteTeam && deleteTeam(team.id)}
                    className="h-8 w-8 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeam === 'new' ? 'Nova Equipe' : 'Editar Equipe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome da Equipe</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Imóveis Usados"
                />
              </div>

              <div className="space-y-3 p-3 border rounded-md bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tax"
                      checked={defaultTax}
                      onCheckedChange={(c) => setDefaultTax(c === true)}
                    />
                    <Label htmlFor="tax" className="font-medium cursor-pointer">
                      Deduzir Nota Fiscal
                    </Label>
                  </div>
                </div>
                {defaultTax && (
                  <div className="space-y-1 animate-in fade-in zoom-in-95">
                    <Label className="text-xs">Porcentagem (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-3 border rounded-md bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="legal"
                      checked={defaultLegal}
                      onCheckedChange={(c) => setDefaultLegal(c === true)}
                    />
                    <Label htmlFor="legal" className="font-medium cursor-pointer">
                      Deduzir Jurídico
                    </Label>
                  </div>
                </div>
                {defaultLegal && (
                  <div className="space-y-1 animate-in fade-in zoom-in-95">
                    <Label className="text-xs">Valor Fixo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={legalFixedValue}
                      onChange={(e) => setLegalFixedValue(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <TeamRoleForm onAddRole={(r) => setRoles([...roles, r])} />
              <TeamRoleList
                roles={roles}
                onRemoveRole={(id) => setRoles(roles.filter((r) => r.id !== id))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!teamName || roles.length === 0}>
              Salvar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
