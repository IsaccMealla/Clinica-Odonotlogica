'use client'
import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react'

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
  const viewersRef = useRef<Map<string, (state: DicomViewerState) => void>>(new Map())

  const registerViewer = useCallback((id: string, updateState: (state: DicomViewerState) => void) => {
    viewersRef.current.set(id, updateState)
  }, [])

  const unregisterViewer = useCallback((id: string) => {
    viewersRef.current.delete(id)
  }, [])

  const syncViewers = useCallback((id: string, state: DicomViewerState) => {
    viewersRef.current.forEach((updateState, viewerId) => {
      if (viewerId !== id) {
        updateState(state)
      }
    })
  }, [])

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
