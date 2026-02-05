import { useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'

// Map theme names to highlight.js CDN URLs
const THEME_MAP = {
  'github': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
  'github-dark': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  'monokai': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css',
  'dracula': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dracula.min.css',
  'nord': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/nord.min.css',
  'solarized-light': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/solarized-light.min.css',
  'solarized-dark': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/solarized-dark.min.css'
}

function CodeThemeLoader() {
  const { codeTheme } = useSettings()

  useEffect(() => {
    // Remove existing code theme link if it exists
    const existingLink = document.getElementById('code-theme-stylesheet')
    if (existingLink) {
      existingLink.remove()
    }

    // Add new theme link
    const link = document.createElement('link')
    link.id = 'code-theme-stylesheet'
    link.rel = 'stylesheet'
    link.href = THEME_MAP[codeTheme] || THEME_MAP['github-dark']
    document.head.appendChild(link)

    return () => {
      // Cleanup on unmount
      const linkToRemove = document.getElementById('code-theme-stylesheet')
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [codeTheme])

  return null // This component doesn't render anything
}

export default CodeThemeLoader
