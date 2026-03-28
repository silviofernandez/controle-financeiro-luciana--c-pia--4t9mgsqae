import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = '@financeiro:expense-aliases'

export function useExpenseAliases() {
  const [aliases, setAliases] = useState<Record<string, string>>({})

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setAliases(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse aliases', e)
      }
    }
  }, [])

  const getAlias = useCallback(
    (originalName: string) => {
      return aliases[originalName.toUpperCase()] || null
    },
    [aliases],
  )

  const setAlias = useCallback((originalName: string, alias: string) => {
    setAliases((prev) => {
      const next = { ...prev, [originalName.toUpperCase()]: alias }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeAlias = useCallback((originalName: string) => {
    setAliases((prev) => {
      const next = { ...prev }
      delete next[originalName.toUpperCase()]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { getAlias, setAlias, removeAlias }
}
