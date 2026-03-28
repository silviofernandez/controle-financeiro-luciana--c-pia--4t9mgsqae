import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export interface Role {
  id: string
  name: string
  type: 'Percentual' | 'Valor Fixo'
  value?: number
  levels?: { junior: number; pleno: number; senior: number }
}

interface Props {
  onAddRole: (role: Role) => void
}

export function TeamRoleForm({ onAddRole }: Props) {
  const [roleName, setRoleName] = useState('')
  const [roleType, setRoleType] = useState<'Percentual' | 'Valor Fixo'>('Percentual')
  const [roleValue, setRoleValue] = useState<string>('')

  const [junior, setJunior] = useState<string>('')
  const [pleno, setPleno] = useState<string>('')
  const [senior, setSenior] = useState<string>('')

  const isCorretor = roleName.trim().toLowerCase() === 'corretor'
  const isCaptador = roleName.trim().toLowerCase() === 'captador'

  const handleAdd = () => {
    if (!roleName) return

    const newRole: Role = {
      id: crypto.randomUUID(),
      name: roleName.trim(),
      type: roleType,
    }

    if (isCorretor) {
      newRole.type = 'Percentual'
      newRole.levels = { junior: Number(junior), pleno: Number(pleno), senior: Number(senior) }
    } else if (isCaptador) {
      newRole.type = 'Percentual'
      newRole.value = Number(roleValue)
    } else {
      newRole.value = Number(roleValue)
    }

    onAddRole(newRole)
    setRoleName('')
    setRoleValue('')
    setRoleType('Percentual')
    setJunior('')
    setPleno('')
    setSenior('')
  }

  return (
    <div className="border rounded-md p-4 bg-slate-50/50 space-y-4 shadow-sm">
      <h4 className="font-semibold text-slate-800">Adicionar Papel / Regra</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label>Nome (ex: Captador, Apoio)</Label>
          <Input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Nome do papel/regra"
            className="bg-white"
          />
        </div>

        {isCorretor ? (
          <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Júnior (%)</Label>
              <Input
                type="number"
                value={junior}
                onChange={(e) => setJunior(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Pleno (%)</Label>
              <Input
                type="number"
                value={pleno}
                onChange={(e) => setPleno(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Sênior (%)</Label>
              <Input
                type="number"
                value={senior}
                onChange={(e) => setSenior(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        ) : isCaptador ? (
          <>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value="Percentual" disabled>
                <SelectTrigger className="bg-white opacity-70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentual">Percentual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (%)</Label>
              <Input
                type="number"
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                className="bg-white"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={roleType} onValueChange={(v: any) => setRoleType(v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentual">Percentual</SelectItem>
                  <SelectItem value="Valor Fixo">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor {roleType === 'Percentual' ? '(%)' : '(R$)'}</Label>
              <Input
                type="number"
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                className="bg-white"
              />
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleAdd}
          variant="secondary"
          className="gap-2 border shadow-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar Regra
        </Button>
      </div>
    </div>
  )
}
