import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RefreshCcw, FileSpreadsheet } from 'lucide-react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Button } from './ui/button'
import { SidebarTrigger } from './ui/sidebar'

export function Header() {
  const { isSyncing, syncData } = useTransactions()
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const capitalizedDate = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md shadow-sm px-4 h-16 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-900 transition-colors" />
        <h1 className="text-xl font-bold text-primary hidden sm:block">
          Controle Financeiro - Luciana
        </h1>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground hidden lg:inline-block font-medium">
          {capitalizedDate}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={syncData}
          disabled={isSyncing}
          className="gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 transition-colors shadow-sm"
        >
          {isSyncing ? (
            <RefreshCcw className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          <span className="hidden sm:inline-block">
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </span>
        </Button>
      </div>
    </header>
  )
}
