'use client'
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DicomViewerState {
  zoom: number
  panX: number
  panY: number
  windowCenter: number
  windowWidth: number
}

interface DicomSynchronizerContextType {
  registerViewer: (id: string, updateState: (state: DicomViewerState) => void) => void
  unregisterViewer: (id: string) => void
  syncViewers: (id: string, state: DicomViewerState) => void
}

const DicomSynchronizerContext = createContext<DicomSynchronizerContextType | undefined>(undefined)

export const DicomSynchronizerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewers, setViewers] = useState<Map<string, (state: DicomViewerState) => void>>(new Map())

  const registerViewer = useCallback((id: string, updateState: (state: DicomViewerState) => void) => {
    setViewers(prev => new Map(prev).set(id, updateState))
  }, [])

  const unregisterViewer = useCallback((id: string) => {
    setViewers(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const syncViewers = useCallback((id: string, state: DicomViewerState) => {
    viewers.forEach((updateState, viewerId) => {
      if (viewerId !== id) {
        updateState(state)
      }
    })
  }, [viewers])

  return (
    <DicomSynchronizerContext.Provider value={{ registerViewer, unregisterViewer, syncViewers }}>
      {children}
    </DicomSynchronizerContext.Provider>
  )
}

export const useDicomSynchronizer = () => {
  const context = useContext(DicomSynchronizerContext)
  if (!context) {
    return null
  }
  return context
}
