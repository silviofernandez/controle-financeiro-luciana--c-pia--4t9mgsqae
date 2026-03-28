import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface SummaryData {
  id: string
  role: string
  name?: string
  value: number
  variation_name?: string
  percentage?: number | null
}

interface CommissionSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SummaryData[]
  onConfirm: () => void
  loading?: boolean
}

const baseChartConfig = {
  corretor: { label: 'Corretor', color: '#3b82f6' },
  captador: { label: 'Captador', color: '#10b981' },
  imobiliaria: { label: 'Imobiliária', color: '#8b5cf6' },
  impostos: { label: 'Impostos', color: '#ef4444' },
  juridico: { label: 'Jurídico', color: '#f59e0b' },
}

export function CommissionSummaryModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  loading,
}: CommissionSummaryModalProps) {
  const dynamicConfig = useMemo(() => {
    const config: any = { ...baseChartConfig }
    const fallbackColors = [
      '#0ea5e9',
      '#ec4899',
      '#d946ef',
      '#84cc16',
      '#64748b',
      '#14b8a6',
      '#f43f5e',
    ]

    data.forEach((item, index) => {
      if (!config[item.id]) {
        config[item.id] = {
          label: item.role,
          color: fallbackColors[index % fallbackColors.length],
        }
      }
    })
    return config
  }, [data])

  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumo da Comissão</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <ChartContainer config={dynamicConfig} className="h-[250px] w-full pb-4">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-[2px]"
                            style={{ backgroundColor: item.payload.fill }}
                          />
                          <span className="text-muted-foreground">
                            {dynamicConfig[name as string]?.label || name}
                          </span>
                        </div>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="id"
                innerRadius={65}
                strokeWidth={2}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`var(--color-${entry.id})`} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2 pt-4" />
            </PieChart>
          </ChartContainer>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Papel / Profissional</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.role}
                    {item.name && item.name !== 'nao_informado' && (
                      <span className="text-xs text-muted-foreground font-normal block">
                        {item.name} {item.percentage ? `(${item.percentage}%)` : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.value)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total Bruto</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            Editar
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar e Lançar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
