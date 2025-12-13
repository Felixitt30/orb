import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'



// Suppress console errors and warnings to prevent system beeps
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = function (...args) {
  // Silently ignore errors to prevent beeps
  // Only log in development if needed
  if (import.meta.env.DEV) {
    originalConsoleError.apply(console, args)
  }
}

console.warn = function (...args) {
  // Silently ignore warnings
  if (import.meta.env.DEV) {
    originalConsoleWarn.apply(console, args)
  }
}

// Suppress unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault()
  // Silently handle
})

// Suppress errors
window.addEventListener('error', (event) => {
  event.preventDefault()
  // Silently handle
})

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister()
    }
  })
}

// Conditional audio blocking based on user preference
function blockAudio() {
  const soundEnabled = localStorage.getItem('orbSoundEnabled') === 'true'

  if (!soundEnabled) {
    console.log('🔇 Audio blocking enabled by user preference')

    // Block AudioContext
    if (window.AudioContext) {
      window.AudioContext = function () {
        console.log('AudioContext blocked')
        throw new Error('AudioContext disabled by user')
      }
    }

    if (window.webkitAudioContext) {
      window.webkitAudioContext = function () {
        console.log('webkitAudioContext blocked')
        throw new Error('webkitAudioContext disabled by user')
      }
    }

    // Block getUserMedia
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia = () => {
        console.log('getUserMedia blocked')
        return Promise.reject(new Error('Audio disabled by user'))
      }
    }

    // Block HTMLAudioElement
    if (window.HTMLAudioElement) {
      HTMLAudioElement.prototype.play = function () {
        console.log('Audio.play() blocked')
        return Promise.reject(new Error('Audio disabled by user'))
      }

      // Also block the Audio constructor
      const OriginalAudio = window.Audio
      window.Audio = function () {
        console.log('new Audio() blocked')
        const audio = new OriginalAudio()
        audio.play = () => Promise.reject(new Error('Audio disabled by user'))
        audio.muted = true
        return audio
      }
    }

    // Block Web Audio API oscillators
    if (window.OscillatorNode) {
      OscillatorNode.prototype.start = function () {
        console.log('OscillatorNode.start() blocked')
      }
    }

    // Block notification sounds
    if (window.Notification) {
      const OriginalNotification = window.Notification
      window.Notification = function (...args) {
        console.log('Notification blocked (silent mode)')
        const notif = new OriginalNotification(...args)
        notif.silent = true
        return notif
      }
      window.Notification.permission = OriginalNotification.permission
      window.Notification.requestPermission = OriginalNotification.requestPermission
    }
  } else {
    console.log('🔊 Audio enabled by user preference')
  }
}

// Initial block
blockAudio()

// Re-apply blocking when storage changes
window.addEventListener('storage', blockAudio)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
