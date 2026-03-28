import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Role } from './TeamRoleForm'

interface Props {
  roles: Role[]
  onRemoveRole: (id: string) => void
}

export function TeamRoleList({ roles, onRemoveRole }: Props) {
  if (roles.length === 0) return null

  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Papel</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor / Níveis</TableHead>
            <TableHead className="w-[80px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>
                {r.name.toLowerCase() === 'corretor' && r.levels ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-medium">
                      Jr: {r.levels.junior}%
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-medium">
                      Pl: {r.levels.pleno}%
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-medium">
                      Sr: {r.levels.senior}%
                    </span>
                  </div>
                ) : r.type === 'Percentual' ? (
                  `${r.value}%`
                ) : (
                  formatCurrency(r.value || 0)
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRole(r.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
