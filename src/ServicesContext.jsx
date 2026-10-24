import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import { SERVICES as FALLBACK } from './config.js'

const ServicesCtx = createContext(null)

export function ServicesProvider({ children }) {
  const [services, setServices] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { services } = await api.services()
      if (Array.isArray(services) && services.length) setServices(services)
    } catch {
      /* keep the built-in fallback so the page still works offline/without DB */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <ServicesCtx.Provider value={{ services, loading, reload: load, setServices }}>
      {children}
    </ServicesCtx.Provider>
  )
}

export const useServices = () => useContext(ServicesCtx)
