import { CommissionTeam } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface SummaryProps {
  grossValue: number
  useTax: boolean
  useLegal: boolean
  team: CommissionTeam
  selectedVariations: Record<string, string>
  participantNames: Record<string, string>
}

export function CommissionSummary({
  grossValue,
  useTax,
  useLegal,
  team,
  selectedVariations,
  participantNames,
}: SummaryProps) {
  const taxAmount = useTax ? grossValue * 0.15 : 0
  const legalAmount = useLegal ? 200 : 0
  const netBase = Math.max(0, grossValue - taxAmount - legalAmount)

  let totalPercentage = 0
  let totalFixed = 0

  const shares = (team?.rules || []).map((rule) => {
    const varId = selectedVariations?.[rule.id]
    const variation = rule.variations?.find((v) => v.id === varId) || rule.variations?.[0]

    const rawName = participantNames?.[rule.id]
    const name = typeof rawName === 'string' && rawName.trim() !== '' ? rawName : 'Não informado'

    let amount = 0
    if (variation?.type === 'percentage') {
      amount = netBase * ((variation?.value || 0) / 100)
      totalPercentage += variation?.value || 0
    } else {
      amount = variation?.value || 0
      totalFixed += amount
    }

    return {
      ruleId: rule.id,
      role: rule.role || '',
      name,
      varName: variation?.name || 'Padrão',
      isPct: variation?.type === 'percentage',
      val: variation?.value || 0,
      amount,
    }
  })

  const totalDistributed = shares.reduce((acc, s) => acc + s.amount, 0)
  const remaining = netBase - totalDistributed

  return (
    <Card className="shadow-md border-primary/20 sticky top-6 bg-slate-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          Resumo do Repasse
          {totalPercentage > 100 && (
            <Badge variant="destructive" className="flex gap-1 text-xs px-2">
              <AlertCircle className="w-3 h-3" /> Soma &gt; 100%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between font-medium text-slate-800">
            <span>Valor Bruto (100%)</span>
            <span>{formatCurrency(grossValue)}</span>
          </div>
          {useTax && (
            <div className="flex justify-between text-red-600">
              <span>Nota Fiscal (15%)</span>
              <span>- {formatCurrency(taxAmount)}</span>
            </div>
          )}
          {useLegal && (
            <div className="flex justify-between text-red-600">
              <span>Despesa Jurídica</span>
              <span>- {formatCurrency(legalAmount)}</span>
            </div>
          )}
        </div>

        <Separator className="bg-slate-200" />

        <div className="flex justify-between font-bold text-base text-primary">
          <span>Base Líquida de Divisão</span>
          <span>{formatCurrency(netBase)}</span>
        </div>

        <div className="bg-white rounded-md border p-4 mt-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Divisão por Participante
          </h4>
          {shares.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center">Nenhuma regra definida</p>
          ) : (
            shares.map((share) => (
              <div key={share.ruleId} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-medium text-slate-800">{share.role}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {share.name} • {share.varName !== 'Padrão' ? `${share.varName} ` : ''}(
                    {share.val}
                    {share.isPct ? '%' : 'R$'})
                  </p>
                </div>
                <span className="font-medium text-emerald-600">{formatCurrency(share.amount)}</span>
              </div>
            ))
          )}
        </div>

        {remaining !== 0 && shares.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground pt-2">
            <span>Saldo Restante na Base</span>
            <span className={remaining < 0 ? 'text-red-500' : ''}>{formatCurrency(remaining)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
