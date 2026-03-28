import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { DashboardSummary } from '@/components/DashboardSummary'
import { ReconciliationAlert } from '@/components/ReconciliationAlert'

export default function InsertData() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <ReconciliationAlert key="reconciliation-alert" />
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[420px] shrink-0">
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
