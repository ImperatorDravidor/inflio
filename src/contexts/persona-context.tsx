"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export interface PersonaPhoto {
  id: string
  url: string
  name: string
  uploadedAt: Date
}

export interface Persona {
  id: string
  name: string
  description: string
  photos: PersonaPhoto[]
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
  tags?: string[]
  usageCount?: number
}

interface PersonaContextType {
  personas: Persona[]
  activePersona: Persona | null
  isLoading: boolean
  addPersona: (persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<Persona>
  updatePersona: (id: string, updates: Partial<Persona>) => Promise<void>
  deletePersona: (id: string) => Promise<void>
  setActivePersona: (persona: Persona | null) => void
  getPersonaById: (id: string) => Persona | undefined
  syncPersonas: () => Promise<void>
  exportPersonas: () => string
  importPersonas: (data: string) => Promise<void>
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

const STORAGE_KEY = 'inflio_global_personas'
const ACTIVE_PERSONA_KEY = 'inflio_active_persona'

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [activePersona, setActivePersona] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load personas from localStorage on mount
  useEffect(() => {
    loadPersonas()
  }, [])

  // Save personas to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && personas.length > 0) {
      savePersonas()
    }
  }, [personas, isLoading])

  const loadPersonas = async () => {
    try {
      setIsLoading(true)
      
      // Load personas
      const stored = localStorage.getItem(STORAGE_KEY)
      let personasWithDates: Persona[] = []
      
      if (stored) {
        const parsedPersonas = JSON.parse(stored)
        personasWithDates = parsedPersonas.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          photos: p.photos.map((photo: any) => ({
            ...photo,
            uploadedAt: new Date(photo.uploadedAt)
          }))
        }))
        setPersonas(personasWithDates)
      }

      // Load active persona
      const storedActive = localStorage.getItem(ACTIVE_PERSONA_KEY)
      if (storedActive && personasWithDates.length > 0) {
        const activeId = JSON.parse(storedActive)
        const active = personasWithDates.find((p: Persona) => p.id === activeId)
        if (active) {
          setActivePersona(active)
        }
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
      toast.error('Failed to load personas')
    } finally {
      setIsLoading(false)
    }
  }

  const savePersonas = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personas))
    } catch (error) {
      console.error('Failed to save personas:', error)
      toast.error('Failed to save personas')
    }
  }

  const addPersona = async (personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Persona> => {
    const newPersona: Persona = {
      ...personaData,
      id: `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isDefault: personas.length === 0 // First persona is default
    }

    setPersonas(prev => [...prev, newPersona])
    
    // If this is the first persona, set it as active
    if (personas.length === 0) {
      setActivePersona(newPersona)
      localStorage.setItem(ACTIVE_PERSONA_KEY, JSON.stringify(newPersona.id))
    }

    toast.success(`Persona "${newPersona.name}" created successfully!`)
    return newPersona
  }

  const updatePersona = async (id: string, updates: Partial<Persona>) => {
    setPersonas(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    ))

    // Update active persona if it's the one being updated
    if (activePersona?.id === id) {
      setActivePersona(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null)
    }

    toast.success('Persona updated')
  }

  const deletePersona = async (id: string) => {
    const persona = personas.find(p => p.id === id)
    if (!persona) return

    setPersonas(prev => prev.filter(p => p.id !== id))
    
    // Clear active persona if it's the one being deleted
    if (activePersona?.id === id) {
      setActivePersona(null)
      localStorage.removeItem(ACTIVE_PERSONA_KEY)
    }

    // Set a new default if we deleted the default
    if (persona.isDefault && personas.length > 1) {
      const remaining = personas.filter(p => p.id !== id)
      if (remaining.length > 0) {
        updatePersona(remaining[0].id, { isDefault: true })
      }
    }

    toast.success('Persona deleted')
  }

  const setActivePersonaWithStorage = (persona: Persona | null) => {
    setActivePersona(persona)
    if (persona) {
      localStorage.setItem(ACTIVE_PERSONA_KEY, JSON.stringify(persona.id))
      
      // Increment usage count
      updatePersona(persona.id, { 
        usageCount: (persona.usageCount || 0) + 1 
      })
    } else {
      localStorage.removeItem(ACTIVE_PERSONA_KEY)
    }
  }

  const getPersonaById = (id: string): Persona | undefined => {
    return personas.find(p => p.id === id)
  }

  const syncPersonas = async () => {
    // In a real app, this would sync with a backend
    // For now, just reload from localStorage
    await loadPersonas()
    toast.success('Personas synced')
  }

  const exportPersonas = (): string => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      personas: personas
    }
    return JSON.stringify(exportData, null, 2)
  }

  const importPersonas = async (data: string) => {
    try {
      const parsed = JSON.parse(data)
      
      if (!parsed.personas || !Array.isArray(parsed.personas)) {
        throw new Error('Invalid import format')
      }

      // Merge with existing personas (avoid duplicates by name)
      const existingNames = new Set(personas.map(p => p.name.toLowerCase()))
      const newPersonas = parsed.personas.filter((p: any) => 
        !existingNames.has(p.name.toLowerCase())
      )

      if (newPersonas.length === 0) {
        toast.info('No new personas to import')
        return
      }

      // Add new personas with new IDs
      const personasToAdd = newPersonas.map((p: any) => ({
        ...p,
        id: `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(),
        photos: p.photos.map((photo: any) => ({
          ...photo,
          uploadedAt: new Date(photo.uploadedAt)
        }))
      }))

      setPersonas(prev => [...prev, ...personasToAdd])
      toast.success(`Imported ${personasToAdd.length} personas`)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import personas. Please check the file format.')
    }
  }

  const value: PersonaContextType = {
    personas,
    activePersona,
    isLoading,
    addPersona,
    updatePersona,
    deletePersona,
    setActivePersona: setActivePersonaWithStorage,
    getPersonaById,
    syncPersonas,
    exportPersonas,
    importPersonas
  }

  return (
    <PersonaContext.Provider value={value}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersonas() {
  const context = useContext(PersonaContext)
  if (context === undefined) {
    throw new Error('usePersonas must be used within a PersonaProvider')
  }
  return context
} 