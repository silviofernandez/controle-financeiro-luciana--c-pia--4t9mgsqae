import { useMemo } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, Sparkles } from 'lucide-react'

export function BestCardSuggestion() {
  const { creditCards } = useSettings()

  const bestCard = useMemo(() => {
    if (!creditCards || creditCards.length === 0) return null

    const today = new Date().getDate()

    // Calculate days passed since best purchase day.
    // We want the card where the best purchase day just passed or is today,
    // giving us the maximum days until the next closing.

    let best = creditCards[0]
    let maxDaysToPay = -1

    creditCards.forEach((card) => {
      // Approximate days to pay:
      // If today is >= bestPurchaseDay, we have roughly ~40 days minus (today - bestPurchaseDay).
      // If today < bestPurchaseDay, we are nearing the closing day, so days to pay is smaller.
      let daysSinceBest = today - card.bestPurchaseDay
      if (daysSinceBest < 0) daysSinceBest += 30 // rough month length

      const currentDaysToPay = 40 - daysSinceBest
      if (currentDaysToPay > maxDaysToPay) {
        maxDaysToPay = currentDaysToPay
        best = card
      }
    })

    return best
  }, [creditCards])

  if (!bestCard) return null

  return (
    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md mb-6">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 bg-white/20 rounded-full shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white/90">Melhor cartão para hoje:</p>
          <div className="flex items-center gap-2 mt-0.5">
            <CreditCard className="w-4 h-4" />
            <p className="font-bold text-lg">{bestCard.name}</p>
          </div>
        </div>
        <div className="text-right text-xs text-white/80 shrink-0">
          <p>Fechamento: dia {bestCard.closingDay}</p>
          <p>Melhor dia: dia {bestCard.bestPurchaseDay}</p>
        </div>
      </CardContent>
    </Card>
  )
}
