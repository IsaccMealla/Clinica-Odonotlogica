"use client"

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from "react"
import { X, AlertCircle, CheckCircle, Info, Volume2 } from "lucide-react"

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
  withSound?: boolean
}

interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (message: string, type: ToastType, duration?: number, withSound?: boolean) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)
