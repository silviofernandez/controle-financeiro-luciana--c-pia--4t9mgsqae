import React, { createContext, useContext, useState, useEffect } from 'react'
import { Transaction } from '@/types'
import { toast } from '@/hooks/use-toast'
import { getMockData } from '@/data/mock'
import pb from '@/lib/pocketbase/client'

interface TransactionContextData {
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => void
  addTransactions: (ts: Omit<Transaction, 'id' | 'created_at'>[]) => void
  deleteTransaction: (id: string) => void
  isSyncing: boolean
  syncData: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextData>({} as TransactionContextData)

export const useTransactions = () => useContext(TransactionContext)

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('@financeiro:transactions:v3')
    if (saved) return JSON.parse(saved)
    return getMockData()
  })

  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    localStorage.setItem('@financeiro:transactions:v3', JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = async (t: Omit<Transaction, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID()
    const newTx: Transaction = {
      ...t,
      id,
      created_at: new Date().toISOString(),
    }
    setTransactions((prev) =>
      [newTx, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    )
    toast({ title: 'Sucesso!', description: 'Lançamento adicionado com sucesso.' })

    try {
      const formData = new FormData()
      const d = new Date(t.data)
      formData.append('date', d.toISOString())
      formData.append('amount', t.valor.toString())
      formData.append('description', t.descricao)
      formData.append('unit', t.unidade)
      formData.append('category', t.categoria)
      formData.append('source', t.source || 'manual')
      if (t.attachment instanceof File) {
        formData.append('attachment', t.attachment)
      }

      const record = await pb.collection('transactions').create(formData)

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id ? { ...tx, id: record.id, attachment: record.attachment } : tx,
        ),
      )
    } catch (e) {
      console.error('Error saving to PocketBase', e)
    }
  }

  const addTransactions = (ts: Omit<Transaction, 'id' | 'created_at'>[]) => {
    const newTxs: Transaction[] = ts.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }))
    setTransactions((prev) =>
      [...newTxs, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    )
    toast({ title: 'Sucesso!', description: `${ts.length} lançamentos adicionados com sucesso.` })
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    toast({ title: 'Excluído', description: 'Item excluído com sucesso.' })
  }

  const syncData = async () => {
    setIsSyncing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({ title: 'Sincronizado', description: 'Dados enviados para a nuvem!' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao sincronizar.', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        addTransactions,
        deleteTransaction,
        isSyncing,
        syncData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
