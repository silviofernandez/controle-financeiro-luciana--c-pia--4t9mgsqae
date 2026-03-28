import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = '@financeiro:expense-rules-v2'
const OLD_STORAGE_KEY = '@financeiro:expense-aliases'

export interface ExpenseRule {
  alias: string | null
  classification: 'personal' | 'company' | null
}

export function useExpenseAliases() {
  const [rules, setRules] = useState<Record<string, ExpenseRule>>({})

  useEffect(() => {
    const oldStored = localStorage.getItem(OLD_STORAGE_KEY)
    const stored = localStorage.getItem(STORAGE_KEY)

    let initialRules: Record<string, ExpenseRule> = {}

    if (stored) {
      try {
        initialRules = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse rules', e)
      }
    } else if (oldStored) {
      try {
        const parsedOld = JSON.parse(oldStored)
        Object.entries(parsedOld).forEach(([key, value]) => {
          initialRules[key] = { alias: value as string, classification: null }
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRules))
      } catch (e) {
        console.error('Failed to parse old aliases', e)
      }
    }

    setRules(initialRules)
  }, [])

  const getRule = useCallback(
    (originalName: string) => {
      return rules[originalName.toUpperCase()] || { alias: null, classification: null }
    },
    [rules],
  )

  const setRule = useCallback((originalName: string, rule: Partial<ExpenseRule>) => {
    setRules((prev) => {
      const existing = prev[originalName.toUpperCase()] || { alias: null, classification: null }
      const next = { ...prev, [originalName.toUpperCase()]: { ...existing, ...rule } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeRule = useCallback((originalName: string) => {
    setRules((prev) => {
      const next = { ...prev }
      delete next[originalName.toUpperCase()]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { getRule, setRule, removeRule }
}
