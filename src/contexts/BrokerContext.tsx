import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Broker } from '@/types'

interface BrokerContextData {
  brokers: Broker[]
  addBroker: (b: Broker) => void
  addBrokers: (brokers: Broker[]) => void
  updateBroker: (b: Broker) => void
  deleteBroker: (id: string) => void
}

const INITIAL_BROKERS: Broker[] = [
  {
    id: 'bbbbbbbb-1111-4111-a111-111111111111',
    role: 'Corretor',
    name: 'João Silva',
    level: 'Pleno',
    percentage: 38,
  },
  {
    id: 'bbbbbbbb-2222-4222-a222-222222222222',
    role: 'Gerente Geral',
    name: 'Maria Souza',
    level: '',
    percentage: 10,
  },
]

const BrokerContext = createContext<BrokerContextData>({} as BrokerContextData)

export const useBrokers = () => useContext(BrokerContext)

export const BrokerProvider = ({ children }: { children: ReactNode }) => {
  const [brokers, setBrokers] = useState<Broker[]>(() => {
    // Bumped local storage key to v2 to clean invalid UUIDs
    const saved = localStorage.getItem('@financeiro:brokers:v2')
    if (saved) return JSON.parse(saved)
    return INITIAL_BROKERS
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:brokers:v2', JSON.stringify(brokers))
  }, [brokers])

  const addBroker = (b: Broker) => {
    setBrokers((prev) => [...prev, b])
  }

  const addBrokers = (newBrokers: Broker[]) => {
    setBrokers((prev) => [...prev, ...newBrokers])
  }

  const updateBroker = (b: Broker) => {
    setBrokers((prev) => prev.map((existing) => (existing.id === b.id ? b : existing)))
  }

  const deleteBroker = (id: string) => {
    setBrokers((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <BrokerContext.Provider value={{ brokers, addBroker, addBrokers, updateBroker, deleteBroker }}>
      {children}
    </BrokerContext.Provider>
  )
}
