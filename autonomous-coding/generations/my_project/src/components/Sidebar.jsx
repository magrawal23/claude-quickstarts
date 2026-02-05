import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '../contexts/ConversationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useProject } from '../contexts/ProjectContext'
import ProjectSelector from './ProjectSelector'
import FolderTree from './FolderTree'
import SettingsModal from './SettingsModal'
import PromptLibraryModal from './PromptLibraryModal'
import TeamWorkspaceModal from './TeamWorkspaceModal'

function Sidebar({ onSelectPrompt, isMobileOpen, onMobileClose }) {
  const navigate = useNavigate()
  const { conversations, currentConversation, setCurrentConversation, createConversation, deleteConversation, loadConversations, moveConversationToProject, togglePinConversation, toggleArchiveConversation, duplicateConversation, exportConversation } = useConversation()
  const { theme, toggleTheme } = useTheme()
  const { currentProject, projects } = useProject()
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [movingConversation, setMovingConversation] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPromptLibrary, setShowPromptLibrary] = useState(false)
  const [showTeamWorkspace, setShowTeamWorkspace] = useState(false)
  const [focusedConvIndex, setFocusedConvIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth')
    return saved ? parseInt(saved) : 256
  })
  const [isResizing, setIsResizing] = useState(false)

  // Collapse/expand state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // md breakpoint
      setIsMobile(mobile)
    }

    // Check on mount
    checkMobile()

    // Check on resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Resize handlers
  const startResize = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const newWidth = e.clientX
      const minWidth = 250
      const maxWidth = 500

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        localStorage.setItem('sidebarWidth', sidebarWidth.toString())
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, sidebarWidth])

  // Helper function to highlight search term in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text

    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-600 text-black dark:text-white px-0.5 rounded">{part}</mark>
        : part
    )
  }

  // Helper function to create preview snippet with highlighted search term
  const getPreviewSnippet = (text, searchTerm, maxLength = 100) => {
    if (!text) return ''

    // Find the position of the search term
    const lowerText = text.toLowerCase()
    const lowerSearch = searchTerm.toLowerCase()
    const index = lowerText.indexOf(lowerSearch)

    if (index === -1) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')

    // Calculate snippet bounds to center around the match
    const snippetStart = Math.max(0, index - 30)
    const snippetEnd = Math.min(text.length, index + searchTerm.length + 30)

    let snippet = text.substring(snippetStart, snippetEnd)

    // Add ellipsis if needed
    if (snippetStart > 0) snippet = '...' + snippet
    if (snippetEnd < text.length) snippet = snippet + '...'

    return snippet
  }

  // Reload conversations when current project or search query changes
  useEffect(() => {
    const projectId = currentProject ? currentProject.id : 'all'
    loadConversations(projectId, searchQuery)
  }, [currentProject, searchQuery])

  // Helper function to group conversations by date
  const groupConversationsByDate = (conversations) => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const start7DaysAgo = new Date(startOfToday)
    start7DaysAgo.setDate(start7DaysAgo.getDate() - 7)
    const start30DaysAgo = new Date(startOfToday)
    start30DaysAgo.setDate(start30DaysAgo.getDate() - 30)

    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: []
    }

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at || conv.created_at)

      if (convDate >= startOfToday) {
        groups.today.push(conv)
      } else if (convDate >= startOfYesterday) {
        groups.yesterday.push(conv)
      } else if (convDate >= start7DaysAgo) {
        groups.previous7Days.push(conv)
      } else if (convDate >= start30DaysAgo) {
        groups.previous30Days.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }

  // Sort conversations: pinned first, then by updated_at
  // Use conversations directly since filtering is now done on the backend
  // Filter based on archive view state
  const filteredConversations = [...conversations]
    .filter(c => showArchived ? c.is_archived : !c.is_archived)
    .sort((a, b) => {
      // Pinned conversations come first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      // Within same pinned status, sort by updated_at
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

  // Separate pinned and unpinned for section labels
  const pinnedConversations = filteredConversations.filter(c => c.is_pinned)
  const unpinnedConversations = filteredConversations.filter(c => !c.is_pinned)

  // Group unpinned conversations by date
  const groupedConversations = groupConversationsByDate(unpinnedConversations)

  const handleDelete = async (e, conversationId, title) => {
    e.stopPropagation() // Prevent selecting the conversation

    if (window.confirm(`Delete "${title}"?\n\nThis conversation will be permanently deleted.`)) {
      try {
        await deleteConversation(conversationId)
      } catch (error) {
        alert('Failed to delete conversation')
      }
    }
  }

  const handleContextMenu = (e, conv) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation: conv
    })
  }

  const handleMoveToProject = (conv) => {
    setMovingConversation(conv)
    setShowMoveModal(true)
    setContextMenu(null)
  }

  const handleTogglePin = async (conv) => {
    try {
      await togglePinConversation(conv.id, conv.is_pinned)
      setContextMenu(null)
      // Reload conversations to reflect the change
      const projectId = currentProject ? currentProject.id : 'all'
      await loadConversations(projectId, searchQuery)
    } catch (error) {
      alert('Failed to pin/unpin conversation')
    }
  }

  const handleToggleArchive = async (conv) => {
    try {
      await toggleArchiveConversation(conv.id, conv.is_archived)
      setContextMenu(null)
      // Reload conversations to reflect the change
      const projectId = currentProject ? currentProject.id : 'all'
      await loadConversations(projectId, searchQuery)
    } catch (error) {
      alert('Failed to archive/unarchive conversation')
    }
  }

  const handleDuplicate = async (conv) => {
    try {
      await duplicateConversation(conv.id)
      setContextMenu(null)
      // Reload conversations to reflect the change
      const projectId = currentProject ? currentProject.id : 'all'
      await loadConversations(projectId, searchQuery)
    } catch (error) {
      alert('Failed to duplicate conversation')
    }
  }

  const handleExport = async (conv, format = 'json') => {
    try {
      await exportConversation(conv.id, format)
      setContextMenu(null)
    } catch (error) {
      alert('Failed to export conversation')
    }
  }

  const handleMoveConfirm = async (projectId) => {
    if (!movingConversation) return

    try {
      await moveConversationToProject(movingConversation.id, projectId)
      setShowMoveModal(false)
      setMovingConversation(null)
      // Reload conversations to reflect the change
      if (currentProject) {
        loadConversations(currentProject.id)
      } else {
        loadConversations('all')
      }
    } catch (error) {
      alert('Failed to move conversation')
    }
  }

  // Handle conversation selection with mobile close
  const handleConversationClick = (conv) => {
    handleConversationClick(conv)
    // Close mobile sidebar when conversation is selected
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  // Keyboard navigation for conversation list
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when not in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      const allConvs = [...filteredConversations]
      if (allConvs.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = focusedConvIndex < allConvs.length - 1 ? focusedConvIndex + 1 : 0
        setFocusedConvIndex(nextIndex)
        setCurrentConversation(allConvs[nextIndex])
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = focusedConvIndex > 0 ? focusedConvIndex - 1 : allConvs.length - 1
        setFocusedConvIndex(prevIndex)
        setCurrentConversation(allConvs[prevIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedConvIndex, filteredConversations, setCurrentConversation])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  return (
    <nav
      className={`border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-claude-dark-surface sidebar transition-all duration-300 ease-in-out ${
        !isMobile && isCollapsed ? 'sidebar-collapsed' : ''
      } ${
        isMobile ? 'fixed top-0 left-0 h-full z-50' : 'relative'
      } ${
        isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'
      }`}
      style={{
        width: isMobile ? '280px' : (isCollapsed ? '60px' : `${sidebarWidth}px`),
        minWidth: isMobile ? '280px' : (isCollapsed ? '60px' : '250px'),
        maxWidth: isMobile ? '280px' : (isCollapsed ? '60px' : '500px')
      }}
      aria-label="Sidebar navigation"
      aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
    >
      {/* Project Selector */}
      {(isMobile || !isCollapsed) && <ProjectSelector />}

      {/* Command Palette Hint (invisible, for tour) */}
      <div data-tour-id="tour-command-palette-hint" className="absolute top-0 left-0 w-full h-0" />

      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          {/* Close button for mobile */}
          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex-shrink-0"
              tabIndex={0}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex-shrink-0"
              tabIndex={0}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
          {(isMobile || !isCollapsed) && (
            <button
              data-tour-id="tour-new-chat-button"
              onClick={() => createConversation(currentProject?.id)}
              className="flex-1 px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 hover:shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 active:scale-95"
              tabIndex={0}
              aria-label="Create new chat conversation"
            >
              + New Chat
            </button>
          )}
        </div>
        {!isMobile && isCollapsed && (
          <button
            data-tour-id="tour-new-chat-button"
            onClick={() => createConversation(currentProject?.id)}
            className="w-full p-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 font-medium focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            tabIndex={0}
            aria-label="Create new chat conversation"
            title="New Chat"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Search */}
      {(isMobile || !isCollapsed) && (
        <div className="p-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            tabIndex={0}
            aria-label="Search conversations"
          />
        </div>
      )}

      {/* Archive View Toggle */}
      {(isMobile || !isCollapsed) && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              showArchived
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            tabIndex={0}
            aria-label={showArchived ? 'Show active conversations' : 'Show archived conversations'}
            aria-pressed={showArchived}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>
      )}

      {/* Conversations List */}
      <div className={`flex-1 overflow-y-auto p-2 ${(!isMobile && isCollapsed) ? 'hidden' : ''}`}>
        {/* Folder Tree */}
        <FolderTree currentProject={currentProject} onConversationClick={setCurrentConversation} />

        {filteredConversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No conversations yet
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pinned
                </div>
                {pinnedConversations.map(conv => (
                  <div
                    key={conv.id}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('conversation', JSON.stringify(conv))
                      e.dataTransfer.effectAllowed = 'move'
                      e.currentTarget.classList.add('dragging')
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('dragging')
                    }}
                    className={`group relative rounded-lg mb-1 cursor-move transition-all duration-150 ${
                      currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                    }`}
                    onContextMenu={(e) => handleContextMenu(e, conv)}
                  >
                    <button
                      onClick={() => handleConversationClick(conv)}
                      className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-claude-orange flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 3.5L6.5 7H2v6h4.5L10 16.5V3.5z" transform="rotate(-45 10 10)" />
                        </svg>
                        <div className="font-medium truncate flex-1">
                          {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                        </div>
                      </div>
                      {searchQuery && conv.match_preview && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv.id, conv.title)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity"
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Regular Conversations Section - Grouped by Date */}
            {unpinnedConversations.length > 0 && (
              <>
                {/* Today */}
                {groupedConversations.today.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                      Today
                    </div>
                    {groupedConversations.today.map(conv => (
                      <div
                        key={conv.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('conversation', JSON.stringify(conv))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group relative rounded-lg mb-1 cursor-move ${
                          currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                      >
                        <button
                          onClick={() => handleConversationClick(conv)}
                          className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                          tabIndex={0}
                          aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
                          aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                        >
                          <div className="font-medium truncate">
                            {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                          </div>
                          {searchQuery && conv.match_preview && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id, conv.title)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                          title="Delete conversation"
                          tabIndex={0}
                          aria-label={`Delete conversation: ${conv.title || 'Untitled'}`}
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Yesterday */}
                {groupedConversations.yesterday.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                      Yesterday
                    </div>
                    {groupedConversations.yesterday.map(conv => (
                      <div
                        key={conv.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('conversation', JSON.stringify(conv))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group relative rounded-lg mb-1 cursor-move ${
                          currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                      >
                        <button
                          onClick={() => handleConversationClick(conv)}
                          className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                          tabIndex={0}
                          aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
                          aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                        >
                          <div className="font-medium truncate">
                            {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                          </div>
                          {searchQuery && conv.match_preview && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id, conv.title)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                          title="Delete conversation"
                          tabIndex={0}
                          aria-label={`Delete conversation: ${conv.title || 'Untitled'}`}
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Previous 7 Days */}
                {groupedConversations.previous7Days.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                      Previous 7 Days
                    </div>
                    {groupedConversations.previous7Days.map(conv => (
                      <div
                        key={conv.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('conversation', JSON.stringify(conv))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group relative rounded-lg mb-1 cursor-move ${
                          currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                      >
                        <button
                          onClick={() => handleConversationClick(conv)}
                          className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                          tabIndex={0}
                          aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
                          aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                        >
                          <div className="font-medium truncate">
                            {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                          </div>
                          {searchQuery && conv.match_preview && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id, conv.title)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                          title="Delete conversation"
                          tabIndex={0}
                          aria-label={`Delete conversation: ${conv.title || 'Untitled'}`}
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Previous 30 Days */}
                {groupedConversations.previous30Days.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                      Previous 30 Days
                    </div>
                    {groupedConversations.previous30Days.map(conv => (
                      <div
                        key={conv.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('conversation', JSON.stringify(conv))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group relative rounded-lg mb-1 cursor-move ${
                          currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                      >
                        <button
                          onClick={() => handleConversationClick(conv)}
                          className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                          tabIndex={0}
                          aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
                          aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                        >
                          <div className="font-medium truncate">
                            {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                          </div>
                          {searchQuery && conv.match_preview && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id, conv.title)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                          title="Delete conversation"
                          tabIndex={0}
                          aria-label={`Delete conversation: ${conv.title || 'Untitled'}`}
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Older */}
                {groupedConversations.older.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                      Older
                    </div>
                    {groupedConversations.older.map(conv => (
                      <div
                        key={conv.id}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('conversation', JSON.stringify(conv))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group relative rounded-lg mb-1 cursor-move ${
                          currentConversation?.id === conv.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                        onContextMenu={(e) => handleContextMenu(e, conv)}
                      >
                        <button
                          onClick={() => handleConversationClick(conv)}
                          className="w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:translate-x-1"
                          tabIndex={0}
                          aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
                          aria-current={currentConversation?.id === conv.id ? 'page' : undefined}
                        >
                          <div className="font-medium truncate">
                            {searchQuery ? highlightSearchTerm(conv.title || 'Untitled', searchQuery) : (conv.title || 'Untitled')}
                          </div>
                          {searchQuery && conv.match_preview && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {highlightSearchTerm(getPreviewSnippet(conv.match_preview, searchQuery), searchQuery)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">{conv.updated_at}</div>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id, conv.title)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                          title="Delete conversation"
                          tabIndex={0}
                          aria-label={`Delete conversation: ${conv.title || 'Untitled'}`}
                        >
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => setShowPromptLibrary(true)}
          className={`w-full rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            (!isMobile && isCollapsed) ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
          tabIndex={0}
          aria-label="Open prompt library"
          title={(!isMobile && isCollapsed) ? 'Prompt Library' : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {(isMobile || !isCollapsed) && 'Prompt Library'}
        </button>
        <button
          onClick={() => navigate('/usage')}
          className={`w-full rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            (!isMobile && isCollapsed) ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
          tabIndex={0}
          aria-label="View usage dashboard"
          title={(!isMobile && isCollapsed) ? 'Usage Dashboard' : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {(isMobile || !isCollapsed) && 'Usage Dashboard'}
        </button>
        <button
          onClick={() => setShowTeamWorkspace(true)}
          className={`w-full rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            (!isMobile && isCollapsed) ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
          tabIndex={0}
          aria-label="Open team workspace"
          title={(!isMobile && isCollapsed) ? 'Team Workspace' : undefined}
          data-testid="team-workspace-button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {(isMobile || !isCollapsed) && 'Team Workspace'}
        </button>
        <button
          data-tour-id="tour-settings-button"
          onClick={() => setShowSettings(true)}
          className={`w-full rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            (!isMobile && isCollapsed) ? 'justify-center p-2' : 'gap-2 px-3 py-2'
          }`}
          tabIndex={0}
          aria-label="Open settings"
          title={(!isMobile && isCollapsed) ? 'Settings' : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {(isMobile || !isCollapsed) && 'Settings'}
        </button>
        <button
          onClick={toggleTheme}
          className={`w-full rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            (!isMobile && isCollapsed) ? 'p-2 flex justify-center' : 'px-3 py-2'
          }`}
          tabIndex={0}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={(!isMobile && isCollapsed) ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
        >
          {theme === 'light' ? '🌙' : '☀️'} {(isMobile || !isCollapsed) && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Team Workspace Modal */}
      <TeamWorkspaceModal isOpen={showTeamWorkspace} onClose={() => setShowTeamWorkspace(false)} />

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        onSelectPrompt={(template) => {
          if (onSelectPrompt) {
            onSelectPrompt(template)
          }
          setShowPromptLibrary(false)
        }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          aria-label="Conversation actions"
        >
          <button
            onClick={() => handleTogglePin(contextMenu.conversation)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
            role="menuitem"
            aria-label={contextMenu.conversation.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 3.5L6.5 7H2v6h4.5L10 16.5V3.5z" transform="rotate(-45 10 10)" />
            </svg>
            {contextMenu.conversation.is_pinned ? 'Unpin conversation' : 'Pin conversation'}
          </button>
          <button
            onClick={() => handleToggleArchive(contextMenu.conversation)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
            role="menuitem"
            aria-label={contextMenu.conversation.is_archived ? 'Unarchive conversation' : 'Archive conversation'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {contextMenu.conversation.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => handleMoveToProject(contextMenu.conversation)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
            role="menuitem"
            aria-label="Move conversation to project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Move to project
          </button>
          <button
            onClick={() => handleDuplicate(contextMenu.conversation)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
            role="menuitem"
            aria-label="Duplicate conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>
          <button
            onClick={() => handleExport(contextMenu.conversation, 'json')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
            role="menuitem"
            aria-label="Export conversation to JSON"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to JSON
          </button>
          <button
            onClick={() => handleExport(contextMenu.conversation, 'markdown')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Markdown
          </button>
          <button
            onClick={() => handleExport(contextMenu.conversation, 'pdf')}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-inset"
            tabIndex={0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to PDF
          </button>
        </div>
      )}

      {/* Move to Project Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Move to Project</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a project to move "{movingConversation?.title || 'Untitled'}" to:
            </p>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleMoveConfirm(project.id)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  tabIndex={0}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMoveModal(false)
                  setMovingConversation(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                tabIndex={0}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resize Handle - only show when not collapsed and not on mobile */}
      {!isMobile && !isCollapsed && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-claude-orange hover:w-1.5 transition-all group"
          onMouseDown={startResize}
          aria-label="Resize sidebar"
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={250}
          aria-valuemax={500}
          aria-valuenow={sidebarWidth}
        >
          <div className="absolute inset-y-0 -right-1 w-3" />
        </div>
      )}
    </nav>
  )
}

export default Sidebar
