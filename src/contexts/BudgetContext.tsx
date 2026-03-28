import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

interface BudgetContextData {
  budgets: Record<string, number>
  setBudget: (category: string, amount: number) => void
}

const BudgetContext = createContext<BudgetContextData>({} as BudgetContextData)

export const useBudgets = () => useContext(BudgetContext)

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('@financeiro:budgets:v1')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return {}
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:budgets:v1', JSON.stringify(budgets))
  }, [budgets])

  const setBudget = (category: string, amount: number) => {
    setBudgets((prev) => {
      const updated = { ...prev, [category]: amount }
      if (amount <= 0 || isNaN(amount)) {
        delete updated[category]
      }
      return updated
    })
    toast({
      title: 'Orçamento Atualizado',
      description: `Teto de gasto para ${category} salvo com sucesso.`,
    })
  }

  return <BudgetContext.Provider value={{ budgets, setBudget }}>{children}</BudgetContext.Provider>
}
