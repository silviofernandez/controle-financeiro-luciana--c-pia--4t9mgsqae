import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { DashboardSummary } from '@/components/DashboardSummary'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'
import { StatementUploader } from '@/components/StatementUploader'
import { ReviewedTransaction } from '@/components/StatementReviewModal'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from 'sonner'
import { BestCardSuggestion } from '@/components/BestCardSuggestion'

export default function InsertData() {
  const { addTransactions } = useTransactions()

  const handleImportedExpenses = (expenses: ReviewedTransaction[]) => {
    const currentYear = new Date().getFullYear()
    const transactionsToImport: any[] = []

    expenses.forEach((exp) => {
      const dateObj = new Date(exp.date)

      // Intelligent Date Normalization safeguard
      if (!isNaN(dateObj.getTime()) && Math.abs(dateObj.getFullYear() - currentYear) > 2) {
        // Enforce 2026 reference year logic or current year if standard
        dateObj.setFullYear(Math.max(currentYear, 2026))
      }

      const safeDateStr = isNaN(dateObj.getTime())
        ? new Date().toISOString()
        : dateObj.toISOString()

      const numInstallments = exp.installments && exp.installments > 0 ? exp.installments : 1
      const isInstallment = numInstallments > 1

      for (let i = 0; i < numInstallments; i++) {
        const d = new Date(safeDateStr)
        d.setMonth(d.getMonth() + i)

        let desc = exp.displayName
        if (isInstallment) {
          desc = `${exp.displayName} (${i + 1}/${numInstallments})`
        }

        transactionsToImport.push({
          tipo: 'despesa' as const,
          descricao: desc,
          valor: exp.amount, // replicating the same amount per future installment
          data: d.toISOString(),
          categoria: 'Outros', // Default category, user can edit later
          unidade: exp.unit || 'Geral',
          banco: 'Cartão de Crédito' as const,
          classificacao:
            exp.classification === 'company' ? ('variavel' as const) : ('fixo' as const),
          observacoes: `Importado: ${exp.originalName}`,
          installments: numInstallments,
          installmentNumber: i + 1,
          source: 'extrato',
        })
      }
    })

    addTransactions(transactionsToImport)
    toast.success(`${transactionsToImport.length} transações geradas e importadas com sucesso!`)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ReconciliationAlert key="reconciliation-alert" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
          <BestCardSuggestion />
          <StatementUploader onExpensesConfirmed={handleImportedExpenses} />
          <TransactionForm key="transaction-form" />
          <DashboardSummary key="dashboard-summary" />
        </div>
        <div className="flex-1 w-full lg:h-[calc(100vh-8rem)]">
          <TransactionList key="transaction-list" />
        </div>
      </div>
    </div>
  )
}
