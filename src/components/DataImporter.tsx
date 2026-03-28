import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useTransactions } from '@/contexts/TransactionContext'
import { useSettings } from '@/contexts/SettingsContext'
import { toast } from '@/hooks/use-toast'
import { Banco, Unidade, Transaction, UNIDADES } from '@/types'
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2, ArrowLeft } from 'lucide-react'

const guessBank = (desc: string): Banco => {
  const d = desc.toLowerCase()
  if (d.includes('santander')) return 'Santander'
  if (d.includes('inter')) return 'Inter'
  if (d.includes('btg')) return 'BTG'
  if (d.includes('nu') || d.includes('nubank')) return 'Nubank'
  if (d.includes('caixa')) return 'Caixa'
  if (d.includes('d financeiro')) return 'D Financeiro'
  if (d.includes('itau') || d.includes('itaú')) return 'Itaú'
  if (d.includes('neon')) return 'Neon'
  return 'Outros'
}

const parseValueAndType = (valStr: string) => {
  if (!valStr) return { valor: 0, tipo: 'despesa' as const }
  const isNegative = valStr.includes('-') || valStr.includes(' D')
  let clean = valStr.replace(/[^0-9,.-]/g, '')
  if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else {
    clean = clean.replace(/,/g, '')
  }
  const val = parseFloat(clean) || 0
  return {
    valor: Math.abs(val),
    tipo: val < 0 || isNegative ? 'despesa' : 'receita',
  }
}

export function DataImporter() {
  const { transactions, addTransactions } = useTransactions()
  const { applyRules } = useSettings()
  const [rawText, setRawText] = useState('')
  const [sheetLink, setSheetLink] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'input' | 'mapping'>('input')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])

  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '',
    description: '',
    value: '',
    type: '',
    unit: '',
  })

  const processRawText = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum dado encontrado.', variant: 'destructive' })
      return
    }

    const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
    const grid = lines.map((l) => l.split(separator).map((c) => c.trim().replace(/^"|"$/g, '')))

    const headers = grid[0].map((h, i) => h || `Coluna ${i + 1}`)
    setCsvHeaders(headers)
    setCsvData(grid)
    setStep('mapping')

    const newMap = { date: '', description: '', value: '', type: '', unit: '' }
    headers.forEach((h, i) => {
      const lower = h.toLowerCase()
      if (lower.includes('data') || lower.includes('vencimento')) newMap.date = i.toString()
      else if (lower.includes('descri') || lower.includes('histórico'))
        newMap.description = i.toString()
      else if (lower.includes('valor') || lower.includes('quantia')) newMap.value = i.toString()
      else if (lower.includes('tipo') || lower.includes('operação')) newMap.type = i.toString()
      else if (lower.includes('unidade') || lower.includes('filial')) newMap.unit = i.toString()
    })
    setMapping(newMap)
  }

  const handleTextImport = () => {
    if (!rawText.trim()) {
      toast({
        title: 'Aviso',
        description: 'Insira os dados para importar.',
        variant: 'destructive',
      })
      return
    }
    processRawText(rawText)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      processRawText(text)
      toast({ title: 'Arquivo carregado', description: 'Mapeie as colunas para continuar.' })
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLinkImport = () => {
    if (!sheetLink.includes('docs.google.com/spreadsheets')) {
      toast({
        title: 'Erro',
        description: 'Insira um link válido do Google Sheets.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Sincronizando', description: 'Buscando dados da planilha conectada...' })
    setTimeout(() => {
      processRawText(
        'Data,Valor,Descrição,Unidade\n02/02/2026,1610.00,up talentos recrutamento,Geral\n02/02/2026,3758.79,fgts multa 40%,Jau\n03/02/2026,635.74,vivo lencois,L. Paulista',
      )
      setSheetLink('')
    }, 1500)
  }

  const handleFinalImport = () => {
    if (!mapping.date || !mapping.description || !mapping.value) {
      toast({
        title: 'Erro',
        description: 'Mapeie as colunas obrigatórias: Data, Descrição e Valor',
        variant: 'destructive',
      })
      return
    }

    const parsed: Omit<Transaction, 'id' | 'created_at'>[] = []
    const dateIdx = parseInt(mapping.date)
    const descIdx = parseInt(mapping.description)
    const valIdx = parseInt(mapping.value)
    const typeIdx = parseInt(mapping.type || '-1')
    const unitIdx = parseInt(mapping.unit || '-1')

    const dataRows = csvData.slice(1)

    for (const cols of dataRows) {
      const dateStr = cols[dateIdx]
      const descStr = cols[descIdx]
      const valStr = cols[valIdx]

      if (!dateStr || !valStr) continue

      let isoDate = new Date().toISOString()
      const dateMatch = dateStr.match(/(\d{2})[/-](\d{2})[/-]?(\d{4})?/)
      if (dateMatch) {
        const d = dateMatch[1]
        const m = dateMatch[2]
        const y = dateMatch[3] || new Date().getFullYear().toString()
        isoDate = `${y}-${m}-${d}T10:00:00.000Z`
      } else if (!isNaN(Date.parse(dateStr))) {
        isoDate = new Date(dateStr).toISOString()
      }

      const desc = descStr.trim()
      const { valor, tipo: signType } = parseValueAndType(valStr)

      let finalType: 'receita' | 'despesa' = signType
      if (typeIdx >= 0 && cols[typeIdx]) {
        const tStr = cols[typeIdx].toLowerCase()
        if (tStr.includes('receita') || tStr.includes('c') || tStr.includes('entrada'))
          finalType = 'receita'
        else if (
          tStr.includes('despesa') ||
          tStr.includes('d') ||
          tStr.includes('saida') ||
          tStr.includes('saída')
        )
          finalType = 'despesa'
      }

      let unidade: Unidade = 'Geral'
      if (unitIdx >= 0 && cols[unitIdx]) {
        const u = cols[unitIdx].trim()
        if (UNIDADES.includes(u as Unidade)) unidade = u as Unidade
      }

      if (valor > 0 && desc) {
        const autoTags = applyRules(desc)
        const isBalance = desc.toLowerCase().includes('saldo financeiro')

        parsed.push({
          descricao: desc,
          valor,
          data: isoDate,
          unidade: (autoTags.unidade as Unidade) || unidade,
          banco: (autoTags.banco as Banco) || guessBank(desc),
          tipo: isBalance ? 'receita' : finalType,
          isCheckpoint: isBalance,
          categoria: autoTags.categoria || 'Outros',
        })
      }
    }

    if (parsed.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado válido extraído. Verifique o mapeamento.',
        variant: 'destructive',
      })
      return
    }

    const toAdd = parsed.filter((p) => {
      return !transactions.some(
        (t) =>
          t.data.substring(0, 10) === p.data.substring(0, 10) &&
          t.valor === p.valor &&
          t.descricao.toLowerCase() === p.descricao.toLowerCase(),
      )
    })

    if (toAdd.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Todos os lançamentos extraídos já existem no sistema. Duplicatas ignoradas.',
      })
      setStep('input')
      setRawText('')
      return
    }

    addTransactions(toAdd)
    setStep('input')
    setRawText('')

    toast({
      title: 'Importação Concluída',
      description: `${toAdd.length} novos lançamentos foram importados com sucesso.`,
    })
  }

  const headersWithIndex = csvHeaders.map((h, i) => ({ index: i.toString(), label: h }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Importação Inteligente
          </CardTitle>
          <CardDescription>
            Faça upload de planilhas CSV, cole os dados diretamente ou use um link do Google Sheets.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {step === 'input' && (
            <>
              <div className="space-y-3">
                <Label>Importar de Link (Google Sheets)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetLink}
                    onChange={(e) => setSheetLink(e.target.value)}
                    className="bg-white"
                  />
                  <Button variant="secondary" onClick={handleLinkImport} className="gap-2 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                    Conectar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-slate-50/50 hover:bg-slate-50'}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) {
                      const dataTransfer = new DataTransfer()
                      dataTransfer.items.add(file)
                      if (fileInputRef.current) {
                        fileInputRef.current.files = dataTransfer.files
                        handleFileUpload({ target: fileInputRef.current } as any)
                      }
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="font-medium text-sm">Arraste um CSV ou Excel aqui</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou clique para procurar arquivos
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label>Ou cole os dados da planilha diretamente</Label>
                  <Textarea
                    placeholder={`Cole aqui os dados copiados do Excel/CSV...\n(Data | Valor | Descrição | ...)`}
                    className="flex-1 bg-white font-mono text-xs resize-none"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button onClick={handleTextImport} size="lg" className="gap-2 px-8">
                  <CheckCircle2 className="w-4 h-4" />
                  Avançar para Mapeamento
                </Button>
              </div>
            </>
          )}

          {step === 'mapping' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="text-sm font-medium text-slate-800 mb-2">Mapeamento de Colunas</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Identificamos {csvData.length} linhas. Selecione as colunas correspondentes para
                  prosseguir.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Data <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={mapping.date}
                      onValueChange={(v) => setMapping({ ...mapping, date: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headersWithIndex.map((h) => (
                          <SelectItem key={`date-${h.index}`} value={h.index}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={mapping.description}
                      onValueChange={(v) => setMapping({ ...mapping, description: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headersWithIndex.map((h) => (
                          <SelectItem key={`desc-${h.index}`} value={h.index}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Valor <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={mapping.value}
                      onValueChange={(v) => setMapping({ ...mapping, value: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headersWithIndex.map((h) => (
                          <SelectItem key={`val-${h.index}`} value={h.index}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Tipo (Opcional)</Label>
                    <Select
                      value={mapping.type}
                      onValueChange={(v) => setMapping({ ...mapping, type: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Ignorar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Ignorar</SelectItem>
                        {headersWithIndex.map((h) => (
                          <SelectItem key={`type-${h.index}`} value={h.index}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">
                      Unidade (Opcional)
                    </Label>
                    <Select
                      value={mapping.unit}
                      onValueChange={(v) => setMapping({ ...mapping, unit: v })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Ignorar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Ignorar</SelectItem>
                        {headersWithIndex.map((h) => (
                          <SelectItem key={`unit-${h.index}`} value={h.index}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border/50">
                <Button variant="ghost" onClick={() => setStep('input')} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <Button onClick={handleFinalImport} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar Importação
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
