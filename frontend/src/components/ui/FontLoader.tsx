'use client'

import { useEffect, useState } from 'react'

interface FontLoaderProps {
  children: React.ReactNode
}

export default function FontLoader({ children }: FontLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [fontError, setFontError] = useState(false)

  useEffect(() => {
    const checkFonts = async () => {
      try {
        // Check if document.fonts is available
        if ('fonts' in document) {
          // Wait for fonts to load
          await document.fonts.ready
          
          // Check if Inter font is available
          const interAvailable = document.fonts.check('16px Inter')
          const bungeeAvailable = document.fonts.check('16px Bungee')
          
          if (!interAvailable) {
            console.warn('Inter font failed to load, using system fallbacks')
            setFontError(true)
          }
          
          if (!bungeeAvailable) {
            console.warn('Bungee font failed to load, using system fallbacks')
          }
          
          setFontsLoaded(true)
        } else {
          // Fallback for older browsers
          setTimeout(() => {
            setFontsLoaded(true)
          }, 2000)
        }
      } catch (error) {
        console.warn('Font loading check failed:', error)
        setFontError(true)
        setFontsLoaded(true)
      }
    }

    checkFonts()
  }, [])

  // Add font-loading class to body for CSS targeting
  useEffect(() => {
    if (fontsLoaded) {
      document.body.classList.add('fonts-loaded')
      if (fontError) {
        document.body.classList.add('font-fallback')
      }
    }
  }, [fontsLoaded, fontError])

  return (
    <div className={`font-loading-wrapper ${fontsLoaded ? 'fonts-ready' : 'fonts-loading'}`}>
      {children}
    </div>
  )
}

// Font loading utility functions
export const preloadFonts = () => {
  const fonts = [
    'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    'https://fonts.googleapis.com/css2?family=Bungee:wght@400&display=swap'
  ]

  fonts.forEach(fontUrl => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = fontUrl
    link.onload = () => {
      link.rel = 'stylesheet'
    }
    document.head.appendChild(link)
  })
}

// Check if a specific font is loaded
export const isFontLoaded = (fontFamily: string, fontSize = '16px'): boolean => {
  if ('fonts' in document) {
    return document.fonts.check(`${fontSize} ${fontFamily}`)
  }
  return true // Assume loaded for older browsers
}

// Font loading status hook
export const useFontLoading = () => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    const checkFonts = async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.ready
          setStatus('loaded')
        } else {
          setTimeout(() => setStatus('loaded'), 1000)
        }
      } catch (error) {
        console.warn('Font loading failed:', error)
        setStatus('error')
      }
    }

    checkFonts()
  }, [])

  return status
}
