import { useCallback } from 'react'

export const useSoundPlayer = () => {
  const playSound = useCallback((soundName: 'login' | 'errorlogin' | 'exito') => {
    try {
      const audioMap: Record<string, string> = {
        login: '/sounds/loging.mp3',
        errorlogin: '/sounds/errorlogin.mp3',
        exito: '/sounds/exito.mp3'
      }

      const audio = new Audio(audioMap[soundName])
      audio.volume = 0.7
      audio.play().catch(() => {
        // Silenciosamente no reproducir si hay error
      })
    } catch (error) {
      // Silenciosamente fallar
    }
  }, [])

  return { playSound }
}
