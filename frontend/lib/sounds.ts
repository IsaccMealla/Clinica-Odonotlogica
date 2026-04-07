/**
 * Clinical Sound Manager using Web Audio API
 * Reproduces different sounds for appointment status changes
 */

type SoundStatus = "arrival" | "warning" | "checkin" | "completed" | "cancelled"

interface SoundConfig {
  frequency: number
  duration: number
  type: "sine" | "square" | "triangle"
  volume: number
}

const soundConfigs: Record<SoundStatus, SoundConfig> = {
  arrival: {
    frequency: 800,
    duration: 200,
    type: "sine",
    volume: 0.3,
  },
  warning: {
    frequency: 1200,
    duration: 300,
    type: "square",
    volume: 0.4,
  },
  checkin: {
    frequency: 600,
    duration: 250,
    type: "triangle",
    volume: 0.35,
  },
  completed: {
    frequency: 1000,
    duration: 200,
    type: "sine",
    volume: 0.3,
  },
  cancelled: {
    frequency: 400,
    duration: 300,
    type: "sine",
    volume: 0.25,
  },
}

/**
 * Play a clinical sound based on appointment status
 * Uses Web Audio API to generate tones programmatically
 * @param status - The appointment status
 */
export function playClinicalSound(status: SoundStatus): void {
  if (!soundConfigs[status]) {
    console.warn(`Sound config not found for status: ${status}`)
    return
  }

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const config = soundConfigs[status]

    // Create oscillator
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = config.type
    oscillator.frequency.value = config.frequency

    // Set volume with envelope (ADSR-like)
    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000)

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Play sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + config.duration / 1000)
  } catch (error) {
    console.error("Error playing clinical sound:", error)
  }
}

/**
 * Play a sound from a local file
 * @param soundPath - Path to the sound file (e.g., '/sounds/arrival.mp3')
 */
export function playLocalSound(soundPath: string): void {
  try {
    const audio = new Audio(soundPath)
    audio.volume = 0.5
    audio.play().catch((error) => {
      console.warn(`Could not play sound ${soundPath}:`, error)
    })
  } catch (error) {
    console.error("Error playing local sound:", error)
  }
}

/**
 * Play multiple sounds in sequence
 * @param statuses - Array of statuses to play
 * @param delay - Delay between sounds in milliseconds
 */
export function playSequentialSounds(statuses: SoundStatus[], delay: number = 300): void {
  statuses.forEach((status, index) => {
    setTimeout(() => {
      playClinicalSound(status)
    }, index * delay)
  })
}
