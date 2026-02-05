import { createContext, useContext, useState, useEffect } from 'react'

const TourContext = createContext()

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within TourProvider')
  }
  return context
}

// Tour steps configuration
const TOUR_STEPS = [
  {
    stepNumber: 1,
    title: 'Create New Conversations',
    description: 'Click the "+ New Chat" button to start a fresh conversation with Claude at any time.',
    targetSelector: 'tour-new-chat-button',
    position: 'right'
  },
  {
    stepNumber: 2,
    title: 'Type Your Message',
    description: 'Use the message input area to chat with Claude. Press Enter to send or Shift+Enter for new lines.',
    targetSelector: 'tour-message-input',
    position: 'top'
  },
  {
    stepNumber: 3,
    title: 'Choose Your Model',
    description: 'Select different Claude models based on your needs. Each model has different capabilities and speeds.',
    targetSelector: 'tour-model-selector',
    position: 'bottom'
  },
  {
    stepNumber: 4,
    title: 'Command Palette',
    description: 'Press Cmd+K (or Ctrl+K) to quickly access conversations, settings, and actions.',
    targetSelector: 'tour-command-palette-hint',
    position: 'right'
  },
  {
    stepNumber: 5,
    title: 'Settings & Customization',
    description: 'Click the settings icon to customize your experience, including theme, custom instructions, and more.',
    targetSelector: 'tour-settings-button',
    position: 'right'
  }
]

export function TourProvider({ children }) {
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [hasCompletedTour, setHasCompletedTour] = useState(false)

  // Load tour completion status from localStorage
  useEffect(() => {
    const completed = localStorage.getItem('tour_completed')
    if (completed === 'true') {
      setHasCompletedTour(true)
    }
  }, [])

  // Check if this is a first-time user (no conversations)
  useEffect(() => {
    // Only auto-show tour on first load if not completed
    if (!hasCompletedTour) {
      const shouldShowTour = localStorage.getItem('tour_should_show_on_load')
      if (shouldShowTour !== 'false') {
        // Delay to let the page render
        setTimeout(() => {
          // Check if there are conversations in the sidebar
          const hasConversations = document.querySelectorAll('[class*="conversation-item"]').length > 0
          if (!hasConversations) {
            // setIsTourActive(true) // Commented out - only show when triggered
          }
        }, 1000)
      }
    }
  }, [hasCompletedTour])

  const startTour = () => {
    setCurrentStepIndex(0)
    setIsTourActive(true)
  }

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const skipTour = () => {
    setIsTourActive(false)
    setCurrentStepIndex(0)
    localStorage.setItem('tour_should_show_on_load', 'false')
  }

  const completeTour = () => {
    setIsTourActive(false)
    setCurrentStepIndex(0)
    setHasCompletedTour(true)
    localStorage.setItem('tour_completed', 'true')
    localStorage.setItem('tour_should_show_on_load', 'false')
  }

  const resetTour = () => {
    setHasCompletedTour(false)
    localStorage.removeItem('tour_completed')
    localStorage.removeItem('tour_should_show_on_load')
  }

  const value = {
    isTourActive,
    currentStep: TOUR_STEPS[currentStepIndex],
    totalSteps: TOUR_STEPS.length,
    hasCompletedTour,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour
  }

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  )
}

export default TourContext
