import { useState, useMemo, useEffect } from 'react'
import { useCommissions } from '@/contexts/CommissionContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBrokers } from '@/contexts/BrokerContext'
import { CommissionSummary } from '@/components/CommissionSummary'
import { CommissionSummaryModal, SummaryData } from '@/components/CommissionSummaryModal'
import { UnregisteredBrokersModal, MissingNameInfo } from '@/components/UnregisteredBrokersModal'
import {
  saveCommission,
  verifyRecordId,
  CommissionPayload,
  CommissionLinePayload,
} from '@/services/supabase'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Broker } from '@/types'

const isValidUUID = (uuid: any) =>
  typeof uuid === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid)

export default function Commissions() {
  const { teams } = useCommissions()
  const { addTransaction } = useTransactions()
  const { brokers, addBrokers } = useBrokers()

  const [teamId, setTeamId] = useState<string>(teams[0]?.id || '')
  const [grossValueRaw, setGrossValueRaw] = useState('1000000') // R$ 10.000,00
  const [useTax, setUseTax] = useState(true)
  const [useLegal, setUseLegal] = useState(true)

  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [missingNamesModalOpen, setMissingNamesModalOpen] = useState(false)
  const [missingNames, setMissingNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const team = useMemo(() => teams.find((t) => t.id === teamId), [teamId, teams])
  const grossValue = Number(grossValueRaw) / 100

  useEffect(() => {
    if (!team) return
    const initialVars: Record<string, string> = {}
    team.rules.forEach((r) => {
      initialVars[r.id] = r.variations[0]?.id
    })
    setSelectedVariations(initialVars)
    setUseTax(team.defaultTax)
    setUseLegal(team.defaultLegal)
  }, [team])

  const summaryData = useMemo(() => {
    if (!team) return []
    const taxAmount = useTax ? grossValue * 0.15 : 0
    const legalAmount = useLegal ? 200 : 0
    const netBase = Math.max(0, grossValue - taxAmount - legalAmount)

    const data: SummaryData[] = []

    team.rules.forEach((rule) => {
      const varId = selectedVariations[rule.id]
      const variation = rule.variations.find((v) => v.id === varId) || rule.variations[0]
      const rawName = participantNames[rule.id]
      const name = typeof rawName === 'string' ? rawName : ''

      let amount = 0
      if (variation.type === 'percentage') {
        amount = netBase * (variation.value / 100)
      } else {
        amount = variation.value
      }

      if (amount > 0) {
        data.push({
          id: rule.id,
          role: rule.role,
          name,
          value: amount,
          variation_name: variation.name,
          percentage: variation.type === 'percentage' ? variation.value : null,
        })
      }
    })

    if (taxAmount > 0) {
      data.push({ id: 'impostos', role: 'Impostos', name: 'Imposto Nota Fiscal', value: taxAmount })
    }
    if (legalAmount > 0) {
      data.push({ id: 'juridico', role: 'Jurídico', name: 'Despesa Jurídica', value: legalAmount })
    }

    return data
  }, [team, grossValue, useTax, useLegal, selectedVariations, participantNames])

  const handleReviewAndLaunch = () => {
    if (!team) return

    const enteredNames = Object.values(participantNames)
      .filter((n): n is string => typeof n === 'string')
      .flatMap((n) => n.split(','))
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    const existingNamesLower = brokers
      .filter((b) => b && typeof b.name === 'string')
      .map((b) => b.name.trim().toLowerCase())
      .filter((n) => n.length > 0)

    const missing = enteredNames.filter(
      (name) => name && !existingNamesLower.includes(name.toLowerCase()),
    )

    const uniqueMissing = Array.from(new Set(missing))

    if (uniqueMissing.length > 0) {
      setMissingNames(uniqueMissing)
      setMissingNamesModalOpen(true)
    } else {
      setModalOpen(true)
    }
  }

  const handleRegisterMissing = (resolvedNames: MissingNameInfo[]) => {
    setParticipantNames((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((ruleId) => {
        const currentVal = updated[ruleId]
        if (typeof currentVal === 'string') {
          const parts = currentVal.split(',').map((part) => {
            const cleanPart = part.trim()
            const match = resolvedNames.find(
              (r) => r?.original?.toLowerCase() === cleanPart.toLowerCase(),
            )
            return match?.edited ? match.edited : cleanPart
          })
          updated[ruleId] = parts.join(', ')
        }
      })
      return updated
    })

    const newBrokers: Broker[] = resolvedNames
      .filter((r) => r && typeof r.edited === 'string' && r.edited.trim() !== '')
      .map((r) => ({
        id: crypto.randomUUID(),
        name: r.edited.trim(),
        level: 'Pleno',
        percentage: 0,
      }))

    addBrokers(newBrokers)

    setMissingNamesModalOpen(false)
    setModalOpen(true)
  }

  const handleConfirm = async () => {
    if (!team) return
    setLoading(true)
    try {
      const brokerData = summaryData.find((d) => {
        const roleStr = d?.role
        return typeof roleStr === 'string' && roleStr.toLowerCase().includes('corretor')
      })

      const capturerData = summaryData.find((d) => {
        const roleStr = d?.role
        return typeof roleStr === 'string' && roleStr.toLowerCase().includes('captador')
      })

      const brokerRecord = brokerData?.name
        ? brokers.find((b) => b?.name?.toLowerCase() === brokerData.name?.toLowerCase())
        : null

      const capturerRecord = capturerData?.name
        ? brokers.find((b) => b?.name?.toLowerCase() === capturerData.name?.toLowerCase())
        : null

      let finalBrokerId: string | null = null
      let finalCapturerId: string | null = null
      let finalTeamId: string | null = null

      if (brokerRecord?.id && isValidUUID(brokerRecord.id)) {
        const isValid = await verifyRecordId('colaboradores', brokerRecord.id)
        if (isValid) finalBrokerId = brokerRecord.id
      }

      if (capturerRecord?.id && isValidUUID(capturerRecord.id)) {
        const isValid = await verifyRecordId('colaboradores', capturerRecord.id)
        if (isValid) finalCapturerId = capturerRecord.id
      }

      if (team.id && isValidUUID(team.id)) {
        const isValid = await verifyRecordId('equipes', team.id)
        if (isValid) finalTeamId = team.id
      }

      const commissionData: CommissionPayload = {
        description: `Comissão ${typeof team?.name === 'string' ? team.name : 'Desconhecida'}`,
        total_value: grossValue,
        team_id: finalTeamId,
        broker_id: finalBrokerId,
        capturer_id: finalCapturerId,
        has_invoice: useTax,
        has_legal: useLegal,
        legal_value: useLegal ? 200 : 0,
        created_at: new Date().toISOString(),
      }

      const linesData: CommissionLinePayload[] = summaryData.map((item) => ({
        role_name: typeof item?.role === 'string' ? item.role : '',
        participant_name: item.name || null,
        level: item.variation_name || null,
        percentage: item.percentage || null,
        value: typeof item?.value === 'number' ? item.value : 0,
        created_at: new Date().toISOString(),
      }))

      await saveCommission(commissionData, linesData)

      summaryData.forEach((item) => {
        const isTax = item.id === 'impostos'
        const isLegal = item.id === 'juridico'
        const safeRole = typeof item?.role === 'string' ? item.role : ''
        const safeName =
          typeof item?.name === 'string'
            ? item.name
            : typeof team?.name === 'string'
              ? team.name
              : ''

        const baseTx: Parameters<typeof addTransaction>[0] = {
          tipo: 'despesa',
          descricao: isTax
            ? `Imposto Nota Fiscal - ${typeof team?.name === 'string' ? team.name : ''}`
            : isLegal
              ? `Despesa Jurídica - ${typeof team?.name === 'string' ? team.name : ''}`
              : `Repasse ${safeRole} - ${safeName}`,
          valor: typeof item.value === 'number' ? item.value : 0,
          data: new Date().toISOString(),
          categoria: isTax ? 'Impostos' : isLegal ? 'Fornecedores' : 'Comissão',
          unidade: 'Geral',
          banco: 'Outros',
          classificacao: 'variavel',
          equipe: typeof team?.name === 'string' ? team.name : undefined,
        }

        if (safeRole.toLowerCase().includes('corretor')) {
          baseTx.corretor = safeName
          baseTx.corretorNivel = item.variation_name
          baseTx.corretorPorcentagem = item.percentage || undefined
        }

        if (safeRole.toLowerCase().includes('captador')) {
          baseTx.captador = safeName
          baseTx.captadorNivel = item.variation_name
          baseTx.captadorPorcentagem = item.percentage || undefined
        }

        addTransaction(baseTx)
      })

      addTransaction({
        tipo: 'receita',
        descricao: `Receita Comissão ${typeof team?.name === 'string' ? team.name : ''}`,
        valor: grossValue,
        data: new Date().toISOString(),
        categoria: 'Trabalho',
        unidade: 'Geral',
        banco: 'Outros',
        receitaTipo: 'comissao',
        equipe: typeof team?.name === 'string' ? team.name : undefined,
      })

      toast({ title: 'Sucesso', description: 'Comissão salva e sincronizada com sucesso!' })

      setModalOpen(false)
      setGrossValueRaw('0')
      setParticipantNames({})

      const initialVars: Record<string, string> = {}
      team.rules.forEach((r) => {
        initialVars[r.id] = r.variations[0]?.id
      })
      setSelectedVariations(initialVars)
      setUseTax(team.defaultTax)
      setUseLegal(team.defaultLegal)
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Falha ao processar a comissão',
        description: e.message || 'Verifique a conexão ou os dados preenchidos e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!team) return <div className="p-8">Nenhuma equipe cadastrada.</div>

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Nova Comissão</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Equipe / Regra</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Bruto (R$)</Label>
                  <Input
                    value={formatCurrency(grossValue)}
                    onChange={(e) => {
                      const val = e?.target?.value
                      setGrossValueRaw(typeof val === 'string' ? val.replace(/\D/g, '') : '')
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={useTax} onCheckedChange={setUseTax} />
                  <Label>Nota Fiscal (15%)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={useLegal} onCheckedChange={setUseLegal} />
                  <Label>Desp. Jurídica (R$ 200)</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes e Variações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-2">
                    <Label>{rule.role}</Label>
                    <Input
                      placeholder="Nome (opcional)"
                      value={
                        typeof participantNames[rule.id] === 'string'
                          ? participantNames[rule.id]
                          : ''
                      }
                      onChange={(e) => {
                        const val = e?.target?.value
                        if (typeof val === 'string') {
                          setParticipantNames((prev) => ({
                            ...prev,
                            [rule.id]: val,
                          }))
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Variação / Nível</Label>
                    <Select
                      value={
                        typeof selectedVariations[rule.id] === 'string'
                          ? selectedVariations[rule.id]
                          : ''
                      }
                      onValueChange={(v) =>
                        setSelectedVariations((prev) => ({ ...prev, [rule.id]: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rule.variations.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.value}
                            {v.type === 'percentage' ? '%' : 'R$'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleReviewAndLaunch}>
            Revisar e Lançar Comissão
          </Button>
        </div>

        <div>
          <CommissionSummary
            grossValue={grossValue}
            useTax={useTax}
            useLegal={useLegal}
            team={team}
            selectedVariations={selectedVariations}
            participantNames={participantNames}
          />
        </div>
      </div>

      <CommissionSummaryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        data={summaryData}
        onConfirm={handleConfirm}
        loading={loading}
      />

      <UnregisteredBrokersModal
        open={missingNamesModalOpen}
        onOpenChange={setMissingNamesModalOpen}
        unregisteredNames={missingNames}
        onConfirm={handleRegisterMissing}
      />
    </div>
  )
}
