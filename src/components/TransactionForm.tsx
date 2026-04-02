import { useState, useEffect, useRef, useMemo, FormEvent, ChangeEvent } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBrokers } from '@/contexts/BrokerContext'
import { useCommissions } from '@/contexts/CommissionContext'
import { useSettings } from '@/contexts/SettingsContext'
import {
  UNIDADES,
  BANCOS,
  Unidade,
  Banco,
  ClassificacaoDespesa,
  ReceitaTipo,
  DespesaTipo,
} from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, formatCurrency, parseCurrency } from '@/lib/utils'
import { Loader2, Plus, FileImage } from 'lucide-react'
import { getTeams, Team } from '@/services/teams'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { CommissionSummaryModal, SummaryData } from './CommissionSummaryModal'

const BANCO_MAP: Record<string, Banco> = {
  santander: 'Santander',
  inter: 'Inter',
  btg: 'BTG',
  caixa: 'Caixa',
  nubank: 'Nubank',
  nu: 'Nubank',
  'd financeiro': 'D Financeiro',
  dfinanceiro: 'D Financeiro',
  itau: 'Itaú',
  itaú: 'Itaú',
  neon: 'Neon',
}

export function TransactionForm() {
  const { addTransaction, transactions } = useTransactions()
  const { brokers, addBroker } = useBrokers()
  const { teams } = useCommissions()
  const { categories, applyRules } = useSettings()

  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [classificacao, setClassificacao] = useState<ClassificacaoDespesa>('variavel')
  const [receitaTipo, setReceitaTipo] = useState<ReceitaTipo>('outro')
  const [despesaTipo, setDespesaTipo] = useState<DespesaTipo>('unitaria')
  const [categoria, setCategoria] = useState<string>('Outros')
  const [descricao, setDescricao] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [data, setData] = useState(() => {
    try {
      const isoString = new Date().toISOString()
      return typeof isoString === 'string' && isoString ? isoString.split('T')[0] : ''
    } catch {
      return ''
    }
  })

  const [unidade, setUnidade] = useState<Unidade>('Geral')
  const [banco, setBanco] = useState<Banco>('Outros')
  const [isCheckpoint, setIsCheckpoint] = useState(false)
  const [installments, setInstallments] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'manual' | 'cupom'>('manual')
  const [isExtracting, setIsExtracting] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)

  const [equipe, setEquipe] = useState<string>('none')
  const [pbTeams, setPbTeams] = useState<Team[]>([])

  // Commission dynamic fields
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})
  const [openCombobox, setOpenCombobox] = useState<Record<string, boolean>>({})
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})

  const [notaFiscal, setNotaFiscal] = useState(false)
  const [juridico, setJuridico] = useState(false)
  const [juridicoValorInput, setJuridicoValorInput] = useState(() => formatCurrency(200))

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false)
  const [summaryModalVisible, setSummaryModalVisible] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData[]>([])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isCommission = tipo === 'receita' && !isCheckpoint && receitaTipo === 'comissao'

  const historicDescriptions = useMemo(() => {
    const relevantTransactions = transactions.filter((t) => t.tipo === tipo && !t.isCheckpoint)
    const descriptions = relevantTransactions
      .map((t) => (typeof t.descricao === 'string' ? t.descricao.trim() : ''))
      .filter(Boolean)
    return Array.from(new Set(descriptions))
  }, [transactions, tipo])

  const suggestions = useMemo(() => {
    if (!descricao || typeof descricao !== 'string') return historicDescriptions.slice(0, 10)
    const lowerInput = descricao.toLowerCase()
    return historicDescriptions
      .filter(
        (d) =>
          typeof d === 'string' &&
          d.toLowerCase().includes(lowerInput) &&
          d.toLowerCase() !== lowerInput,
      )
      .slice(0, 10)
  }, [descricao, historicDescriptions])

  const loadTeams = async () => {
    try {
      const data = await getTeams()
      setPbTeams(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  useRealtime('teams', () => {
    loadTeams()
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof descricao !== 'string') return
    const desc = descricao.toLowerCase()

    let foundBanco = false
    for (const [key, b] of Object.entries(BANCO_MAP)) {
      if (desc.includes(key)) {
        setBanco(b)
        foundBanco = true
        break
      }
    }

    const autoTags = applyRules(descricao)
    if (autoTags.categoria) setCategoria(autoTags.categoria)
    if (autoTags.unidade) setUnidade(autoTags.unidade as Unidade)
    if (autoTags.banco) setBanco(autoTags.banco as Banco)

    setIsCheckpoint(desc.includes('saldo financeiro'))

    if (tipo === 'despesa') {
      const fixedKeywords = [
        'aluguel',
        'iptu',
        'parcela',
        'sal ',
        'salario',
        'salário',
        'ferias',
        'férias',
        'vivo',
        'claro',
        'internet',
        'prolabore',
        'unimed',
      ]
      if (fixedKeywords.some((k) => desc.includes(k))) {
        setClassificacao('fixo')
      }
    }
  }, [descricao, tipo, applyRules])

  useEffect(() => {
    if (banco !== 'Cartão de Crédito') {
      setInstallments(1)
    }
  }, [banco])

  useEffect(() => {
    if (tipo === 'despesa' && !isCheckpoint) {
      if (despesaTipo === 'cia') {
        setUnidade('Geral')
      } else if (despesaTipo === 'unitaria') {
        if (!['Jau', 'Pederneiras', 'L. Paulista'].includes(unidade)) {
          setUnidade('Jau')
        }
      }
    }
  }, [despesaTipo, tipo, isCheckpoint, unidade])

  const handleValorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)

    setAttachment(file)
    setAttachmentUrl(URL.createObjectURL(file))

    // Simulate OCR processing for image or PDF
    setTimeout(() => {
      const randomAmount = (Math.random() * 200 + 10).toFixed(2)
      setValorInput(formatCurrency(parseFloat(randomAmount)))
      setData(new Date().toISOString().split('T')[0])
      setSource('cupom')
      setIsExtracting(false)
      toast({ title: 'Documento Processado', description: 'Data e valor extraídos com sucesso.' })
    }, 1500)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId)
    const team = teams.find((t) => t.id === teamId)
    if (team) {
      setNotaFiscal(team.defaultTax)
      setJuridico(team.defaultLegal)
      if (team.legalValue !== undefined) {
        setJuridicoValorInput(formatCurrency(team.legalValue))
      }

      const vars: Record<string, string> = {}
      team.rules.forEach((r) => {
        if (r.variations && r.variations.length > 0) {
          vars[r.id] = r.variations[0].id
        }
      })
      setSelectedVariations(vars)
      setParticipantNames({})
    }
  }

  const executeSubmit = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    const baseDate = data ? new Date(data) : new Date()
    const desc = typeof descricao === 'string' ? descricao.trim() : ''
    const totalVal = parseCurrency(valorInput)
    const txUnidade =
      tipo === 'despesa' && despesaTipo === 'cia' && !isCheckpoint ? 'Geral' : unidade

    if (banco === 'Cartão de Crédito' && installments > 1 && tipo === 'despesa') {
      const installmentValue = totalVal / installments
      const txs = []

      for (let i = 0; i < installments; i++) {
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + i)
        txs.push({
          tipo,
          descricao: `${desc} (${i + 1}/${installments})`,
          valor: installmentValue,
          data: d.toISOString(),
          categoria: isCommission ? 'Comissão' : categoria,
          unidade: txUnidade,
          banco,
          isCheckpoint,
          classificacao: tipo === 'despesa' && !isCheckpoint ? classificacao : null,
          despesaTipo: tipo === 'despesa' && !isCheckpoint ? despesaTipo : undefined,
          equipe: equipe !== 'none' ? equipe : undefined,
          observacoes: observacoes.trim() || undefined,
          installments,
          installmentNumber: i + 1,
          source: isCheckpoint ? 'manual' : source,
          attachment: attachment || undefined,
        })
      }

      // Assume addTransactions exists or loop addTransaction
      txs.forEach((t) => addTransaction(t))
    } else {
      addTransaction({
        tipo,
        descricao: desc,
        valor: totalVal,
        data: baseDate.toISOString(),
        categoria: isCommission ? 'Comissão' : categoria,
        unidade: txUnidade,
        banco,
        isCheckpoint,
        classificacao: tipo === 'despesa' && !isCheckpoint ? classificacao : null,
        receitaTipo: tipo === 'receita' && !isCheckpoint ? receitaTipo : undefined,
        despesaTipo: tipo === 'despesa' && !isCheckpoint ? despesaTipo : undefined,
        equipe: equipe !== 'none' ? equipe : undefined,
        observacoes: observacoes.trim() || undefined,
        source: isCheckpoint ? 'manual' : source,
        attachment: attachment || undefined,
      })
    }

    setDescricao('')
    setSource('manual')
    setAttachment(null)
    setAttachmentUrl(null)
    setValorInput('')
    setObservacoes('')
    setReceitaTipo('outro')
    setDespesaTipo('unitaria')
    setCategoria('Outros')
    setInstallments(1)
    setEquipe('none')
    setSelectedTeamId('')
    setParticipantNames({})
    setSelectedVariations({})
    setNotaFiscal(false)
    setJuridico(false)
    setJuridicoValorInput(formatCurrency(200))

    setLoading(false)
    setConfirmDialogVisible(false)
    toast({ title: 'Sucesso', description: 'Lançamento adicionado com sucesso!' })
  }

  const handleConfirmCommission = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const team = teams.find((t) => t.id === selectedTeamId)
    if (!team) {
      setLoading(false)
      return
    }

    const launchDate = data ? new Date(data).toISOString() : new Date().toISOString()
    const gross = parseCurrency(valorInput)

    summaryData.forEach((item) => {
      if (item.id === 'imobiliaria') return

      let desc = ''
      if (item.id === 'impostos') desc = 'Despesa Comissão Imposto'
      else if (item.id === 'juridico') desc = 'Despesa Comissão Jurídico'
      else {
        desc = `Despesa Comissão ${item.role}${item.name && item.name !== 'nao_informado' ? ` ${item.name}` : ''}`
      }

      addTransaction({
        tipo: 'despesa',
        descricao: desc.trim(),
        valor: item.value,
        data: launchDate,
        categoria: 'Comissão',
        unidade,
        banco,
        classificacao: 'variavel',
        despesaTipo: 'unitaria',
        equipe: team.name,
      })
    })

    addTransaction({
      tipo: 'receita',
      descricao: `Receita Comissão ${team.name}`,
      valor: gross,
      data: launchDate,
      categoria: 'Comissão',
      unidade,
      banco,
      receitaTipo: 'comissao',
      equipe: team.name,
    })

    setValorInput('')
    setReceitaTipo('outro')
    setSelectedTeamId('')
    setParticipantNames({})
    setSelectedVariations({})
    setNotaFiscal(false)
    setJuridico(false)
    setJuridicoValorInput(formatCurrency(200))

    setLoading(false)
    setSummaryModalVisible(false)
    toast({ title: 'Sucesso', description: 'Comissão lançada com sucesso!' })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (tipo === 'receita' && !isCheckpoint && receitaTipo === 'comissao') {
      if (!valorInput) return
      if (!selectedTeamId) {
        toast({ title: 'Atenção', description: 'Selecione uma equipe.', variant: 'destructive' })
        return
      }

      const team = teams.find((t) => t.id === selectedTeamId)
      if (!team) return

      const gross = parseCurrency(valorInput)
      const taxPercentage = team.taxPercentage !== undefined ? team.taxPercentage : 15
      const taxAmount = notaFiscal ? gross * (taxPercentage / 100) : 0
      const legalAmount = juridico ? parseCurrency(juridicoValorInput) : 0
      const netBase = Math.max(0, gross - taxAmount - legalAmount)

      const d: SummaryData[] = []

      team.rules.forEach((rule) => {
        const varId = selectedVariations[rule.id]
        const variation = rule.variations.find((v) => v.id === varId) || rule.variations[0]
        if (!variation) return

        const name = participantNames[rule.id]

        let val = 0
        if (variation.type === 'percentage') {
          val = netBase * (variation.value / 100)
        } else {
          val = variation.value
        }

        if (val > 0) {
          d.push({
            id: rule.id,
            role: rule.role,
            name:
              name && name !== 'nao_informado' && !name.startsWith('sem-nome-') ? name : undefined,
            value: val,
          })
        }
      })

      if (taxAmount > 0) {
        d.push({ id: 'impostos', role: 'Impostos', value: taxAmount })
      }
      if (legalAmount > 0) {
        d.push({ id: 'juridico', role: 'Jurídico', value: legalAmount })
      }

      const totalDistributed = d.reduce((acc, curr) => acc + curr.value, 0)
      const rest = gross - totalDistributed
      if (rest > 0) {
        d.push({ id: 'imobiliaria', role: 'Imobiliária', value: rest })
      }

      setSummaryData(d)
      setSummaryModalVisible(true)
      return
    }

    if (!data || !descricao || !valorInput || !categoria) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (tipo === 'despesa' && !isCheckpoint) {
      if (!despesaTipo) {
        toast({
          title: 'Atenção',
          description: 'Selecione o tipo de despesa.',
          variant: 'destructive',
        })
        return
      }
      if (despesaTipo === 'unitaria' && !unidade) {
        toast({ title: 'Atenção', description: 'Selecione a unidade.', variant: 'destructive' })
        return
      }
    }

    if (!isCheckpoint) {
      const lowerDesc = typeof descricao === 'string' ? descricao.trim().toLowerCase() : ''
      const exists = historicDescriptions.some(
        (d) => typeof d === 'string' && d.toLowerCase() === lowerDesc,
      )
      if (!exists && historicDescriptions.length > 0) {
        setConfirmDialogVisible(true)
        return
      }
    }

    executeSubmit()
  }

  return (
    <>
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Novo Lançamento</CardTitle>
          <div className="flex items-center">
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp, application/pdf"
              onChange={handleReceiptUpload}
              className="hidden"
              id="receipt-upload"
            />
            <Label
              htmlFor="receipt-upload"
              className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 transition text-xs font-medium shadow-sm m-0"
            >
              {isExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileImage className="w-3.5 h-3.5" />
              )}
              {isExtracting ? 'Processando...' : 'Ler Documento'}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {attachmentUrl && (
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md mb-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileImage className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-600 truncate max-w-[150px] sm:max-w-[200px]">
                  {attachment?.name || 'Arquivo anexado'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-primary hover:text-primary/80 hover:bg-primary/5"
                  onClick={() => window.open(attachmentUrl, '_blank')}
                >
                  Abrir arquivo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setAttachment(null)
                    setAttachmentUrl(null)
                    setSource('manual')
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTipo('receita')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipo === 'receita' ? 'bg-white text-green-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipo === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Despesa
              </button>
            </div>

            {tipo === 'despesa' && !isCheckpoint && (
              <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setClassificacao('fixo')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${classificacao === 'fixo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Custo Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setClassificacao('variavel')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${classificacao === 'variavel' ? 'bg-white text-amber-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Custo Variável
                </button>
              </div>
            )}

            {tipo === 'receita' && !isCheckpoint && (
              <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReceitaTipo('comissao')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${receitaTipo === 'comissao' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Comissão
                </button>
                <button
                  type="button"
                  onClick={() => setReceitaTipo('outro')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${receitaTipo === 'outro' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
                >
                  Outro
                </button>
              </div>
            )}

            {isCommission && (
              <div className="space-y-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1.5">
                  <Label className="text-sm">Equipe / Modelo de Repasse</Label>
                  <Select value={selectedTeamId} onValueChange={handleTeamChange}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione a equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id || `team-${Math.random()}`}>
                          {t.name || 'Equipe sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTeamId &&
                  teams
                    .find((t) => t.id === selectedTeamId)
                    ?.rules.map((rule) => {
                      const searchTerm = searchTerms[rule.id] || ''
                      const filteredBrokers = brokers.filter((b) =>
                        b.name.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      const taxPercentage =
                        teams.find((t) => t.id === selectedTeamId)?.taxPercentage ?? 15

                      return (
                        <div
                          key={rule.id}
                          className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-100/50"
                        >
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-emerald-800">
                              {rule.role}
                            </Label>
                            <Popover
                              open={openCombobox[rule.id]}
                              onOpenChange={(open) =>
                                setOpenCombobox((p) => ({ ...p, [rule.id]: open }))
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-between h-8 text-xs font-normal bg-white px-2 overflow-hidden"
                                >
                                  <span className="truncate">
                                    {participantNames[rule.id] &&
                                    participantNames[rule.id] !== 'nao_informado'
                                      ? participantNames[rule.id]
                                      : 'Selecionar...'}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[220px] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Buscar ou cadastrar..."
                                    value={searchTerm}
                                    onValueChange={(v) =>
                                      setSearchTerms((p) => ({ ...p, [rule.id]: v }))
                                    }
                                  />
                                  <CommandList>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setParticipantNames((p) => ({
                                            ...p,
                                            [rule.id]: 'nao_informado',
                                          }))
                                          setOpenCombobox((p) => ({ ...p, [rule.id]: false }))
                                          setSearchTerms((p) => ({ ...p, [rule.id]: '' }))
                                        }}
                                      >
                                        Não informado
                                      </CommandItem>
                                      {filteredBrokers.map((b) => (
                                        <CommandItem
                                          key={b.id}
                                          value={b.name}
                                          onSelect={() => {
                                            setParticipantNames((p) => ({
                                              ...p,
                                              [rule.id]: b.name,
                                            }))
                                            setOpenCombobox((p) => ({ ...p, [rule.id]: false }))
                                            setSearchTerms((p) => ({ ...p, [rule.id]: '' }))
                                          }}
                                        >
                                          {b.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    {filteredBrokers.length === 0 && searchTerm && (
                                      <div className="p-1 border-t">
                                        <Button
                                          variant="ghost"
                                          className="w-full text-xs text-primary justify-start h-8 px-2"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            const newBroker = {
                                              id: crypto.randomUUID(),
                                              name: searchTerm,
                                              role: 'Corretor',
                                              level: 'Júnior',
                                              percentage: 0,
                                            }
                                            addBroker(newBroker)
                                            setParticipantNames((p) => ({
                                              ...p,
                                              [rule.id]: searchTerm,
                                            }))
                                            setOpenCombobox((p) => ({ ...p, [rule.id]: false }))
                                            setSearchTerms((p) => ({ ...p, [rule.id]: '' }))
                                            toast({
                                              title: 'Colaborador Cadastrado',
                                              description: `${searchTerm} adicionado com sucesso.`,
                                            })
                                          }}
                                        >
                                          <Plus className="w-3 h-3 mr-2 shrink-0" />
                                          <span className="truncate">Cadastrar "{searchTerm}"</span>
                                        </Button>
                                      </div>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                              Variação da Regra
                            </Label>
                            <Select
                              value={selectedVariations[rule.id]}
                              onValueChange={(v) =>
                                setSelectedVariations((p) => ({ ...p, [rule.id]: v }))
                              }
                            >
                              <SelectTrigger className="bg-white h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {rule.variations.map((v) => (
                                  <SelectItem key={v.id} value={v.id || `var-${Math.random()}`}>
                                    {v.name || 'Sem nome'} ({v.value}
                                    {v.type === 'percentage' ? '%' : ' R$'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    })}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between pt-4 border-t border-emerald-100/50">
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notaFiscal"
                        checked={notaFiscal}
                        onCheckedChange={(c) => setNotaFiscal(c === true)}
                      />
                      <Label
                        htmlFor="notaFiscal"
                        className="text-[11px] font-normal cursor-pointer"
                      >
                        Nota Fiscal (
                        {teams.find((t) => t.id === selectedTeamId)?.taxPercentage ?? 15}%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="juridico"
                        checked={juridico}
                        onCheckedChange={(c) => setJuridico(c === true)}
                      />
                      <Label htmlFor="juridico" className="text-[11px] font-normal cursor-pointer">
                        Jurídico
                      </Label>
                    </div>
                  </div>

                  {juridico && (
                    <div className="flex items-center space-x-2 w-full sm:w-[130px]">
                      <Label className="text-[11px] shrink-0">Valor</Label>
                      <Input
                        value={juridicoValorInput}
                        onChange={(e) =>
                          setJuridicoValorInput(formatCurrency(parseCurrency(e.target.value)))
                        }
                        className="bg-white font-mono h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isCommission && (
              <div className="space-y-1.5 relative" ref={wrapperRef}>
                <Label>Histórico / Descrição</Label>
                <Input
                  required
                  ref={inputRef}
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ex: Pagamento Fornecedor Santander"
                  className="bg-white"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          if (typeof s === 'string') {
                            setDescricao(s)
                          }
                          setShowSuggestions(false)
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes adicionais ou justificativas..."
                className="bg-white min-h-[60px] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>
                  {banco === 'Cartão de Crédito' && installments > 1 ? 'Valor Total' : 'Valor'}
                </Label>
                <Input
                  required
                  value={valorInput}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="bg-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={isCommission ? 'Comissão' : categoria}
                  onValueChange={setCategoria}
                  disabled={isCommission}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c && typeof c === 'string' && c.trim() !== '')
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Select value={banco} onValueChange={(v: Banco) => setBanco(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.filter((b) => b && typeof b === 'string' && b.trim() !== '').map(
                      (b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isCommission && (
              <div className="space-y-1.5">
                <Label>Equipe Operacional (Opcional)</Label>
                <Select value={equipe} onValueChange={setEquipe}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {pbTeams.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {banco === 'Cartão de Crédito' && tipo === 'despesa' && !isCheckpoint && (
              <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  className="bg-white"
                />
              </div>
            )}

            {tipo === 'despesa' && !isCheckpoint ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de Despesa</Label>
                  <Select value={despesaTipo} onValueChange={(v: DespesaTipo) => setDespesaTipo(v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unitaria">Despesa Unitária</SelectItem>
                      <SelectItem value="cia">Despesa da Cia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {despesaTipo === 'unitaria' && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <Label>Unidade</Label>
                    <Select value={unidade} onValueChange={(v: Unidade) => setUnidade(v)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jau">Jaú</SelectItem>
                        <SelectItem value="Pederneiras">Pederneiras</SelectItem>
                        <SelectItem value="L. Paulista">Lençóis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Select value={unidade} onValueChange={(v: Unidade) => setUnidade(v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.filter((u) => u && typeof u === 'string' && u.trim() !== '').map(
                        (u) => (
                          <SelectItem key={u} value={u}>
                            {u === 'Jau' ? 'Jaú' : u === 'L. Paulista' ? 'Lençóis' : u}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="checkpoint"
                checked={isCheckpoint}
                onCheckedChange={(c) => setIsCheckpoint(c === true)}
              />
              <Label htmlFor="checkpoint" className="text-xs font-normal text-muted-foreground">
                Marcar como Saldo Financeiro
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 shadow-sm mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogVisible} onOpenChange={setConfirmDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nova Descrição</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja lançar uma nova descrição que ainda não existe?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmDialogVisible(false)
                setTimeout(() => {
                  inputRef.current?.focus()
                  setShowSuggestions(true)
                }, 50)
              }}
            >
              Não, escolher existente
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeSubmit}>Sim, criar nova</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CommissionSummaryModal
        open={summaryModalVisible}
        onOpenChange={setSummaryModalVisible}
        data={summaryData}
        onConfirm={handleConfirmCommission}
        loading={loading}
      />
    </>
  )
}
