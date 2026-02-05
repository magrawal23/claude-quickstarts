import { createContext, useContext, useState, useEffect } from 'react'
import { useSettings } from './SettingsContext'

const ConversationContext = createContext()

export function ConversationProvider({ children }) {
  const { customInstructions, advancedSettings } = useSettings()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [messagesPagination, setMessagesPagination] = useState({ total: 0, hasMore: false, offset: 0 })
  const [abortController, setAbortController] = useState(null)
  const [artifactPanelVisible, setArtifactPanelVisible] = useState(true)
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0)
  const [promptSuggestion, setPromptSuggestion] = useState('')
  const [suggestedPrompts, setSuggestedPrompts] = useState([])
  const [pollingEnabled, setPollingEnabled] = useState(true)
  const [lastPolledAt, setLastPolledAt] = useState(Date.now())

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Poll for updates every 5 seconds when enabled
  useEffect(() => {
    if (!pollingEnabled) return

    const interval = setInterval(async () => {
      // Only poll if not currently loading or sending a message
      if (!loading && !loadingMessages) {
        // Refresh conversations list
        const params = new URLSearchParams()
        params.append('limit', '100')
        params.append('offset', '0')

        try {
          const response = await fetch(`/api/conversations?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            const conversationsData = data.data || data

            // Only update if there are actual changes
            if (JSON.stringify(conversationsData) !== JSON.stringify(conversations)) {
              setConversations(conversationsData)
            }
          }

          // If viewing a conversation, refresh its messages
          if (currentConversation?.id) {
            const msgResponse = await fetch(`/api/conversations/${currentConversation.id}/messages?limit=50&offset=0&order=desc`)
            if (msgResponse.ok) {
              const msgData = await msgResponse.json()
              const messagesData = (msgData.data || msgData).reverse()

              // Only update if there are actual changes
              if (JSON.stringify(messagesData) !== JSON.stringify(messages)) {
                setMessages(messagesData)
                setMessagesPagination(msgData.pagination || { total: messagesData.length, hasMore: false, offset: 0 })
              }
            }
          }

          setLastPolledAt(Date.now())
        } catch (error) {
          console.error('Polling error:', error)
        }
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [pollingEnabled, loading, loadingMessages, currentConversation?.id, conversations, messages])

  // Load messages when current conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      loadMessages(currentConversation.id)
      loadArtifacts(currentConversation.id)
    } else {
      setMessages([])
      setArtifacts([])
    }
  }, [currentConversation?.id])

  // Open artifact panel when artifacts are loaded
  useEffect(() => {
    if (artifacts && artifacts.length > 0) {
      setArtifactPanelVisible(true)
    }
  }, [artifacts.length])

  const loadConversations = async (projectId = null, searchQuery = '') => {
    try {
      const params = new URLSearchParams()

      if (projectId !== null && projectId !== undefined) {
        params.append('project_id', projectId)
      }

      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      // Default to loading all conversations (high limit for backward compatibility)
      // In future, implement infinite scroll or proper pagination UI
      params.append('limit', '100')
      params.append('offset', '0')

      const url = `/api/conversations${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Handle both paginated and non-paginated responses
        const conversationsData = data.data || data
        setConversations(conversationsData)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const createConversation = async (projectId = null) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          project_id: projectId
        })
      })

      if (response.ok) {
        const newConv = await response.json()
        setConversations(prev => [newConv, ...prev])
        setCurrentConversation(newConv)
        setMessages([])
        return newConv
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const loadMessages = async (conversationId, limit = 50) => {
    try {
      setLoadingMessages(true)
      // Load most recent messages first (order=desc fetches recent, then reverses to chronological)
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=0&order=desc`)
      if (response.ok) {
        const result = await response.json()
        // Handle both paginated and legacy non-paginated responses
        const messagesData = result.data || result
        const pagination = result.pagination || { total: messagesData.length, hasMore: false, offset: 0 }

        setMessages(messagesData)
        setMessagesPagination(pagination)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadOlderMessages = async (conversationId, limit = 50) => {
    try {
      setLoadingOlderMessages(true)
      // Calculate offset: total messages - already loaded - how many more to fetch
      const currentOffset = messages.length

      // Fetch older messages by increasing offset
      // We still use order=desc to get the next batch of older messages
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=${limit}&offset=${currentOffset}&order=desc`)
      if (response.ok) {
        const result = await response.json()
        const olderMessagesData = result.data || result
        const pagination = result.pagination || { total: olderMessagesData.length, hasMore: false, offset: currentOffset }

        // Prepend older messages to the beginning of the array
        setMessages(prev => [...olderMessagesData, ...prev])
        setMessagesPagination(pagination)
      }
    } catch (error) {
      console.error('Failed to load older messages:', error)
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  const loadArtifacts = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/artifacts`)
      if (response.ok) {
        const data = await response.json()
        setArtifacts(data)
      }
    } catch (error) {
      console.error('Failed to load artifacts:', error)
    }
  }

  const renameConversation = async (conversationId, newTitle) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error)
      throw error
    }
  }

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))

        // If deleting current conversation, clear it
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null)
          setMessages([])
        }

        return true
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  }

  const updateConversationModel = async (conversationId, model) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to update model:', error)
      throw error
    }
  }

  const updateConversationSettings = async (conversationId, settings) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: JSON.stringify(settings) })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  const moveConversationToProject = async (conversationId, projectId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to move conversation:', error)
      throw error
    }
  }

  const togglePinConversation = async (conversationId, isPinned) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinned })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to toggle pin conversation:', error)
      throw error
    }
  }

  const toggleArchiveConversation = async (conversationId, isArchived) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !isArchived })
      })

      if (response.ok) {
        const updatedConv = await response.json()
        setConversations(prev =>
          prev.map(conv => conv.id === conversationId ? updatedConv : conv)
        )
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv)
        }
        return updatedConv
      }
    } catch (error) {
      console.error('Failed to toggle archive conversation:', error)
      throw error
    }
  }

  const duplicateConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const newConversation = await response.json()
        // Add the new conversation to the list
        setConversations(prev => [newConversation, ...prev])
        // Switch to the duplicated conversation
        setCurrentConversation(newConversation)
        return newConversation
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate conversation')
      }
    } catch (error) {
      console.error('Failed to duplicate conversation:', error)
      throw error
    }
  }

  const exportConversation = async (conversationId, format = 'json') => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })

      if (!response.ok) {
        throw new Error('Failed to export conversation')
      }

      // Get conversation title for filename
      const conversation = conversations.find(c => c.id === conversationId)
      const baseFilename = `${conversation?.title || 'conversation'}-${new Date().toISOString().split('T')[0]}`

      let blob, filename

      if (format === 'pdf') {
        // For PDF, get blob response
        const pdfBlob = await response.blob()
        blob = pdfBlob
        filename = `${baseFilename}.pdf`
      } else if (format === 'markdown') {
        // For Markdown, get text response
        const markdownContent = await response.text()
        blob = new Blob([markdownContent], { type: 'text/markdown' })
        filename = `${baseFilename}.md`
      } else {
        // For JSON, parse and format
        const exportData = await response.json()
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        filename = `${baseFilename}.json`
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true, format, filename }
    } catch (error) {
      console.error('Failed to export conversation:', error)
      throw error
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setLoading(false)
    }
  }

  const openArtifactPanel = (artifactId) => {
    // Find the artifact index by ID
    if (artifactId) {
      const index = artifacts.findIndex(a => a.id === artifactId)
      if (index >= 0) {
        setSelectedArtifactIndex(index)
      }
    }
    setArtifactPanelVisible(true)
  }

  const closeArtifactPanel = () => {
    setArtifactPanelVisible(false)
  }

  const editMessage = async (messageId, newContent) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (!response.ok) {
        throw new Error('Failed to edit message')
      }

      const data = await response.json()

      // Update the local message
      setMessages(prev => prev.map(msg => msg.id === messageId ? data.message : msg))

      // If regeneration occurred, reload messages and artifacts
      if (data.regenerated) {
        await loadMessages(currentConversation.id)
        await loadArtifacts(currentConversation.id)
      }

      return data
    } catch (error) {
      console.error('Failed to edit message:', error)
      throw error
    }
  }

  const regenerateMessage = async (messageId) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/messages/${messageId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInstructions,
          thinkingMode: advancedSettings.thinkingMode || false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate message')
      }

      const data = await response.json()

      // Reload messages and artifacts to get the new content
      if (currentConversation) {
        await loadMessages(currentConversation.id)
        await loadArtifacts(currentConversation.id)
      }

      return data
    } catch (error) {
      console.error('Failed to regenerate message:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const branchConversation = async (conversationId, messageId, branchName = null) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          newBranchName: branchName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to branch conversation')
      }

      const data = await response.json()

      // Reload conversations to include the new branch
      await loadConversations()

      // Switch to the new branch
      const newBranch = data.branch
      setCurrentConversation(newBranch)

      return data
    } catch (error) {
      console.error('Failed to branch conversation:', error)
      throw error
    }
  }

  const sendMessage = async (content, conversationId, images = null) => {
    setLoading(true)

    // Clear any existing suggested prompts when sending a new message
    setSuggestedPrompts([])

    // Create new abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)

    try {
      const requestBody = {
        content,
        customInstructions,
        temperature: advancedSettings.temperature,
        maxTokens: advancedSettings.maxTokens,
        topP: advancedSettings.topP,
        thinkingMode: advancedSettings.thinkingMode || false
      }
      if (images && images.length > 0) {
        requestBody.images = images
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let userMessage = null
      let assistantMessage = { role: 'assistant', content: '', id: 'temp-' + Date.now() }
      let buffer = ''

      // Add temporary assistant message that will be updated as we stream
      setMessages(prev => {
        // User message will come first from the stream
        return prev
      })

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'user_message') {
                userMessage = data.message
                setMessages(prev => [...prev, data.message])
              } else if (data.type === 'content_delta') {
                assistantMessage.content += data.delta
                setMessages(prev => {
                  const newMessages = [...prev]
                  const assistantIndex = newMessages.findIndex(m => m.id === assistantMessage.id)
                  if (assistantIndex >= 0) {
                    newMessages[assistantIndex] = { ...assistantMessage }
                  } else {
                    newMessages.push({ ...assistantMessage })
                  }
                  return newMessages
                })
              } else if (data.type === 'title_updated') {
                // Update conversation title in the list
                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === data.conversation.id ? data.conversation : conv
                  )
                )
                setCurrentConversation(data.conversation)
              } else if (data.type === 'message_complete') {
                // Replace temp message with final message from server
                // Include usage data with the message
                const messageWithUsage = {
                  ...data.message,
                  input_tokens: data.usage?.input_tokens || 0,
                  output_tokens: data.usage?.output_tokens || 0
                }
                setMessages(prev => {
                  const filtered = prev.filter(m => m.id !== assistantMessage.id)
                  return [...filtered, messageWithUsage]
                })
                // Add artifacts if present
                if (data.artifacts && data.artifacts.length > 0) {
                  setArtifacts(prev => [...prev, ...data.artifacts])
                }
                // Set suggested prompts if present
                if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
                  setSuggestedPrompts(data.suggestedPrompts)
                }
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }

      return { userMessage, assistantMessage }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user')
        // Leave partial message in place
      } else {
        console.error('Failed to send message:', error)
        throw error
      }
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }

  return (
    <ConversationContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      artifacts,
      loading,
      loadingMessages,
      loadingOlderMessages,
      messagesPagination,
      artifactPanelVisible,
      selectedArtifactIndex,
      promptSuggestion,
      suggestedPrompts,
      pollingEnabled,
      lastPolledAt,
      setCurrentConversation,
      createConversation,
      loadConversations,
      loadMessages,
      loadOlderMessages,
      loadArtifacts,
      sendMessage,
      editMessage,
      regenerateMessage,
      branchConversation,
      stopGeneration,
      renameConversation,
      deleteConversation,
      updateConversationModel,
      updateConversationSettings,
      moveConversationToProject,
      togglePinConversation,
      toggleArchiveConversation,
      duplicateConversation,
      exportConversation,
      openArtifactPanel,
      closeArtifactPanel,
      setSelectedArtifactIndex,
      setPromptSuggestion,
      setSuggestedPrompts,
      setPollingEnabled
    }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider')
  }
  return context
}
