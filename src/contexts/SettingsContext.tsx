import React, { createContext, useContext, useState, useEffect } from 'react'
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/types'

export interface TaggingRule {
  id: string
  keyword: string
  targetType: 'categoria' | 'unidade' | 'banco'
  targetValue: string
}

interface SettingsContextData {
  categories: string[]
  addCategory: (c: string) => void
  removeCategory: (c: string) => void
  taggingRules: TaggingRule[]
  addRule: (r: Omit<TaggingRule, 'id'>) => void
  removeRule: (id: string) => void
  applyRules: (description: string) => { categoria?: string; unidade?: string; banco?: string }
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData)
export const useSettings = () => useContext(SettingsContext)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('@financeiro:categories')
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES
  })

  const [taggingRules, setTaggingRules] = useState<TaggingRule[]>(() => {
    const saved = localStorage.getItem('@financeiro:taggingRules')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('@financeiro:taggingRules', JSON.stringify(taggingRules))
  }, [taggingRules])

  const addCategory = (c: string) => {
    if (!categories.includes(c)) setCategories([...categories, c])
  }

  const removeCategory = (c: string) => {
    setCategories(categories.filter((cat) => cat !== c))
  }

  const addRule = (r: Omit<TaggingRule, 'id'>) => {
    setTaggingRules([...taggingRules, { ...r, id: crypto.randomUUID() }])
  }

  const removeRule = (id: string) => {
    setTaggingRules(taggingRules.filter((rule) => rule.id !== id))
  }

  const applyRules = (description: string) => {
    if (!description) return {}
    const lowerDesc = description.toLowerCase()
    const result: { categoria?: string; unidade?: string; banco?: string } = {}

    const sortedRules = [...taggingRules].sort((a, b) => b.keyword.length - a.keyword.length)

    for (const rule of sortedRules) {
      if (lowerDesc.includes(rule.keyword.toLowerCase())) {
        if (rule.targetType === 'categoria' && !result.categoria)
          result.categoria = rule.targetValue
        if (rule.targetType === 'unidade' && !result.unidade) result.unidade = rule.targetValue
        if (rule.targetType === 'banco' && !result.banco) result.banco = rule.targetValue
      }
    }
    return result
  }

  return (
    <SettingsContext.Provider
      value={{
        categories,
        addCategory,
        removeCategory,
        taggingRules,
        addRule,
        removeRule,
        applyRules,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
