import { useMemo } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function InvoiceCycleAlerts() {
  const { creditCards } = useSettings()

  const alerts = useMemo(() => {
    if (!creditCards || creditCards.length === 0) return []

    const today = new Date().getDate()
    const alertsList = []

    creditCards.forEach((card) => {
      // Alert if closing day is within the next 3 days
      let daysUntilClosing = card.closingDay - today
      if (daysUntilClosing < 0) {
        // closing day already passed this month, calculate for next month
        const daysInMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
        ).getDate()
        daysUntilClosing = daysInMonth - today + card.closingDay
      }

      if (daysUntilClosing >= 0 && daysUntilClosing <= 3) {
        alertsList.push({
          card,
          days: daysUntilClosing,
        })
      }
    })

    return alertsList
  }, [creditCards])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert) => (
        <Alert
          key={alert.card.id}
          className="bg-orange-50 border-orange-200 text-orange-800 animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 font-semibold">
            Fechamento de Fatura Próximo!
          </AlertTitle>
          <AlertDescription className="text-orange-700/90 text-sm">
            A fatura do cartão <strong>{alert.card.name}</strong> fecha em{' '}
            {alert.days === 0 ? 'hoje!' : `${alert.days} dia(s)`}.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
