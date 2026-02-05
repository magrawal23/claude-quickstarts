import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useConversation } from '../contexts/ConversationContext'
import { useTour } from '../contexts/TourContext'
import { useTouchGestures } from '../hooks/useTouchGestures'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import ArtifactPanel from '../components/ArtifactPanel'
import CommandPalette from '../components/CommandPalette'
import TourTooltip from '../components/TourTooltip'
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal'

function ChatPage() {
  const { id } = useParams()
  const { currentConversation, setCurrentConversation, loadMessages, artifacts, conversations } = useConversation()
  const { isTourActive, currentStep, totalSteps, nextStep, previousStep, skipTour, completeTour } = useTour()
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (id && (!currentConversation || currentConversation.id !== parseInt(id))) {
      // Load conversation by ID from URL parameter
      // First try to find it in the conversations list
      const conv = conversations.find(c => c.id === parseInt(id))
      if (conv) {
        setCurrentConversation(conv)
      } else {
        // If not in list, fetch it from API
        fetch(`/api/conversations/${id}`)
          .then(res => res.json())
          .then(conv => setCurrentConversation(conv))
          .catch(err => console.error('Failed to load conversation:', err))
      }
    }
  }, [id, conversations])

  // Handle touch gestures for mobile sidebar
  useTouchGestures({
    onSwipeRight: () => {
      // Only open sidebar on mobile and when it's closed
      if (window.innerWidth < 768 && !isMobileSidebarOpen) {
        setIsMobileSidebarOpen(true)
      }
    },
    onSwipeLeft: () => {
      // Close sidebar on mobile when it's open
      if (window.innerWidth < 768 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false)
      }
    },
    minSwipeDistance: 60,
    maxSwipeTime: 300,
    edgeThreshold: 50,
    requireEdgeSwipe: true // Only trigger from screen edges
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command Palette: Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      // Keyboard Shortcuts: ? key (when not in input)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        setIsKeyboardShortcutsOpen(true)
      }
      // Focus search: / key (when not in input)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput) {
          searchInput.focus()
        }
      }
      // Close modals with Escape
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false)
        setIsKeyboardShortcutsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen bg-white dark:bg-claude-dark-bg text-gray-900 dark:text-gray-100 relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-claude-orange"
        aria-label="Open sidebar menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-45"
          style={{ zIndex: 45 }}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        onSelectPrompt={setSelectedPromptTemplate}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <ChatArea selectedPromptTemplate={selectedPromptTemplate} onPromptUsed={() => setSelectedPromptTemplate(null)} />

      {/* Artifact Panel (conditional) */}
      {artifacts && artifacts.length > 0 && <ArtifactPanel />}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Feature Tour */}
      {isTourActive && currentStep && (
        <TourTooltip
          step={currentStep}
          totalSteps={totalSteps}
          position={currentStep.position}
          targetSelector={currentStep.targetSelector}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTour}
          onComplete={completeTour}
        />
      )}
    </div>
  )
}

export default ChatPage
