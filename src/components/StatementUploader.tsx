import React, { useCallback, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, File as FileIcon, Loader2 } from 'lucide-react'
import { parseStatement, ParsedTransaction } from '@/lib/statement-parser'
import { StatementReviewModal, ReviewedTransaction } from './StatementReviewModal'
import { useExpenseAliases } from '@/hooks/use-expense-aliases'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface StatementUploaderProps {
  onExpensesConfirmed: (expenses: ReviewedTransaction[]) => void
}

export function StatementUploader({ onExpensesConfirmed }: StatementUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setAlias } = useExpenseAliases()
  const { toast } = useToast()

  const handleFile = async (file: File) => {
    if (!file || !(file instanceof File)) {
      toast({
        title: 'Arquivo inválido',
        description: 'O conteúdo fornecido não é um arquivo válido.',
        variant: 'destructive',
      })
      return
    }

    // Safe String Handling: Ensure variable before .split() is properly validated
    const fileName = file.name
    if (fileName && typeof fileName === 'string') {
      const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : ''
      const allowedExts = ['pdf', 'csv', 'ofx', 'ofc', 'xlsx', 'xls', 'txt']
      if (ext && !allowedExts.includes(ext)) {
        toast({
          title: 'Formato não suportado',
          description: `O formato .${ext} pode não ser suportado corretamente.`,
          variant: 'default',
        })
      }
    }

    setIsParsing(true)
    try {
      const data = await parseStatement(file)
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não foi possível extrair transações deste arquivo.',
          variant: 'destructive',
        })
      } else {
        setParsedData(data)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Erro na leitura:', error)
      toast({
        title: 'Erro na leitura',
        description: error instanceof Error ? error.message : 'Falha ao processar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setIsParsing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    // Input Validation: Ensure text content or missing files are handled gracefully
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
      return
    }

    try {
      const textContent = e.dataTransfer.getData('text')
      // Safe String Handling: Validate variable exists and is a string before .split()
      if (textContent && typeof textContent === 'string') {
        const lines = textContent.split('\n')
        if (lines.length > 0) {
          const textFile = new File([textContent], 'dropped-text.txt', { type: 'text/plain' })
          handleFile(textFile)
        }
      }
    } catch (err) {
      console.error('Erro ao processar conteúdo de texto:', err)
    }
  }, [])

  const onConfirmReview = (reviewed: ReviewedTransaction[]) => {
    // Save new aliases
    reviewed.forEach((item) => {
      if (item.displayName !== item.originalName) {
        setAlias(item.originalName, item.displayName)
      }
    })

    onExpensesConfirmed(reviewed)
    setParsedData([])
    toast({
      title: 'Sucesso',
      description: `${reviewed.length} transações importadas com sucesso!`,
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileIcon className="w-5 h-5 text-primary" />
            Importar Extrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              accept=".pdf,.csv,.ofx,.ofc,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Processando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Arraste seu arquivo aqui</p>
                <p className="text-xs">PDF, CSV, OFX ou XLSX</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                >
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StatementReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactions={parsedData}
        onConfirm={onConfirmReview}
      />
    </>
  )
}
