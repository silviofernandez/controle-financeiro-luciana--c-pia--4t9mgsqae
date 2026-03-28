import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { DashboardSummary } from '@/components/DashboardSummary'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'
import { StatementUploader } from '@/components/StatementUploader'
import { ReviewedTransaction } from '@/components/StatementReviewModal'
import { useTransactions } from '@/contexts/TransactionContext'

export default function InsertData() {
  const { addTransactions } = useTransactions()

  const handleImportedExpenses = (expenses: ReviewedTransaction[]) => {
    const formatted = expenses.map((exp) => ({
      tipo: 'despesa' as const,
      descricao: exp.displayName,
      valor: exp.amount,
      data: exp.date,
      categoria: 'Outros', // Default category, user can edit later
      unidade: 'Geral' as const,
      banco: 'Outros' as const,
      classificacao: exp.classification === 'company' ? ('variavel' as const) : null,
      observacoes: `Importado: ${exp.originalName}`,
    }))
    addTransactions(formatted)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ReconciliationAlert key="reconciliation-alert" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[420px] shrink-0 space-y-6">
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
