import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { useConversation } from '../contexts/ConversationContext'
import { useSettings } from '../contexts/SettingsContext'
import TypingIndicator from './TypingIndicator'
import SuggestedPrompts from './SuggestedPrompts'

function MessageList({ messages }) {
  const { fontSize, messageDensity } = useSettings()
  const {
    loading,
    loadingOlderMessages,
    messagesPagination,
    currentConversation,
    loadOlderMessages,
    suggestedPrompts,
    setPromptSuggestion
  } = useConversation()

  // Map density to spacing values (margin-bottom for messages)
  const densitySpacing = {
    compact: 'mb-3',
    comfortable: 'mb-6',
    spacious: 'mb-10'
  }

  const handleSuggestedPromptClick = (prompt) => {
    setPromptSuggestion(prompt)
  }

  const handleLoadOlderMessages = () => {
    if (currentConversation?.id && !loadingOlderMessages) {
      loadOlderMessages(currentConversation.id, 50)
    }
  }

  // Find the last assistant message index
  const lastAssistantMessageIndex = messages.reduce((lastIndex, message, index) => {
    return message.role === 'assistant' ? index : lastIndex
  }, -1)

  // Check if there are older messages to load
  const hasOlderMessages = messagesPagination.hasMore

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" style={{ fontSize: `${fontSize}px` }}>
      {/* Load older messages button */}
      {hasOlderMessages && (
        <div className="mb-6 text-center">
          <button
            onClick={handleLoadOlderMessages}
            disabled={loadingOlderMessages}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingOlderMessages ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              `Load older messages (${messagesPagination.total - messages.length} remaining)`
            )}
          </button>
        </div>
      )}

      {messages.map((message, index) => (
        <div key={message.id || index}>
          <Message message={message} densityClass={densitySpacing[messageDensity]} />
          {/* Show suggested prompts after the last assistant message */}
          {index === lastAssistantMessageIndex && !loading && suggestedPrompts.length > 0 && (
            <SuggestedPrompts
              suggestions={suggestedPrompts}
              onSelectPrompt={handleSuggestedPromptClick}
            />
          )}
        </div>
      ))}
      {loading && <TypingIndicator />}
    </div>
  )
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const code = children?.toString() || ''
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <code className={className}>
        {children}
      </code>
    </div>
  )
}

// Extract artifact references from message content
function extractArtifacts(content) {
  const artifactRegex = /<antArtifact\s+identifier="([^"]+)"\s+type="([^"]+)"(?:\s+language="([^"]+)")?\s+title="([^"]+)">[^]*?<\/antArtifact>/g
  const artifacts = []
  let match

  while ((match = artifactRegex.exec(content)) !== null) {
    artifacts.push({
      identifier: match[1],
      type: match[2],
      language: match[3],
      title: match[4],
      fullMatch: match[0]
    })
  }

  return artifacts
}

// Extract thinking blocks from content
function extractThinkingBlock(content) {
  const thinkingRegex = /<thinking>\n?([\s\S]*?)\n?<\/thinking>\n*\n*/
  const match = content.match(thinkingRegex)

  if (match) {
    return {
      thinking: match[1].trim(),
      contentWithoutThinking: content.replace(match[0], '').trim()
    }
  }

  return {
    thinking: null,
    contentWithoutThinking: content
  }
}

// Remove artifact tags from content and replace with references
function processMessageContent(content) {
  // First extract thinking blocks
  const { thinking, contentWithoutThinking } = extractThinkingBlock(content)

  // Then extract artifacts from the remaining content
  const artifacts = extractArtifacts(contentWithoutThinking)
  let processed = contentWithoutThinking

  artifacts.forEach(artifact => {
    // Replace artifact tag with a placeholder reference
    const reference = `[Artifact: ${artifact.title}](artifact:${artifact.identifier})`
    processed = processed.replace(artifact.fullMatch, reference)
  })

  return { processed, artifacts, thinking }
}

function Message({ message, densityClass = 'mb-6' }) {
  const isUser = message.role === 'user'
  const { openArtifactPanel, artifacts: allArtifacts, editMessage, regenerateMessage, branchConversation, currentConversation, loading } = useConversation()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content || '')
  const [isHovered, setIsHovered] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isBranching, setIsBranching] = useState(false)
  const [variations, setVariations] = useState([])
  const [currentVariation, setCurrentVariation] = useState(message.variation_index || 0)
  const [totalVariations, setTotalVariations] = useState(1)
  const [loadingVariations, setLoadingVariations] = useState(false)

  // Process content to extract artifacts and thinking blocks
  const { processed, artifacts: messageArtifacts, thinking } = processMessageContent(message.content || '')
  const [showThinking, setShowThinking] = useState(true)

  const loadVariations = async () => {
    try {
      setLoadingVariations(true)
      const response = await fetch(`/api/messages/${message.id}/variations`)
      if (response.ok) {
        const data = await response.json()
        setVariations(data.variations)
        setCurrentVariation(data.currentVariation)
        setTotalVariations(data.totalVariations)
      }
    } catch (error) {
      console.error('Failed to load variations:', error)
    } finally {
      setLoadingVariations(false)
    }
  }

  const navigateToVariation = async (index) => {
    if (index < 0 || index >= totalVariations) return

    try {
      const response = await fetch(`/api/messages/${message.id}/variations/${index}`)
      if (response.ok) {
        const variation = await response.json()
        // Update the message content to show the variation
        // This is a temporary solution - ideally we'd update the parent state
        message.content = variation.content
        message.id = variation.id
        setCurrentVariation(index)
        // Force re-render by updating state
        setEditedContent(variation.content)
      }
    } catch (error) {
      console.error('Failed to navigate to variation:', error)
    }
  }

  // Load variations on mount if this message has a variation group
  useEffect(() => {
    if (message.variation_group_id && !isUser) {
      loadVariations()
    }
  }, [message.id, message.variation_group_id, isUser])

  const handleArtifactClick = (e, identifier) => {
    e.preventDefault()
    // Find artifact by identifier
    const artifact = allArtifacts.find(a => a.identifier === identifier)
    if (artifact) {
      openArtifactPanel(artifact.id)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedContent(message.content || '')
  }

  const handleSaveEdit = async () => {
    if (editedContent.trim() && editedContent !== message.content) {
      await editMessage(message.id, editedContent)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent(message.content || '')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelEdit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSaveEdit()
    }
  }

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true)
      await regenerateMessage(message.id)
    } catch (error) {
      console.error('Failed to regenerate message:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleBranch = async () => {
    try {
      setIsBranching(true)
      await branchConversation(currentConversation.id, message.id)
    } catch (error) {
      console.error('Failed to branch conversation:', error)
    } finally {
      setIsBranching(false)
    }
  }

  return (
    <div
      className={`${densityClass} ${isUser ? 'flex justify-end' : ''} message-fade-in`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${isUser ? 'max-w-[80%]' : 'w-full'} relative group`}>
        {/* Role indicator */}
        <div className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>{isUser ? 'You' : 'Claude'}</span>
          <div className="flex items-center gap-2">
            {isUser && !isEditing && isHovered && (
              <button
                onClick={handleEditClick}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                title="Edit message"
              >
                Edit
              </button>
            )}
            {!isUser && isHovered && !isRegenerating && (
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Regenerate response"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            )}
            {!isUser && isRegenerating && (
              <span className="text-xs px-2 py-1 text-gray-500 flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerating...
              </span>
            )}
            {!isUser && totalVariations > 1 && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                <button
                  onClick={() => navigateToVariation(currentVariation - 1)}
                  disabled={currentVariation === 0}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous variation"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-gray-600 dark:text-gray-400 min-w-[40px] text-center">
                  {currentVariation + 1} / {totalVariations}
                </span>
                <button
                  onClick={() => navigateToVariation(currentVariation + 1)}
                  disabled={currentVariation === totalVariations - 1}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next variation"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            {isHovered && !isBranching && (
              <button
                onClick={handleBranch}
                disabled={loading}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Branch conversation from this point"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Branch
              </button>
            )}
            {isBranching && (
              <span className="text-xs px-2 py-1 text-gray-500 flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Branching...
              </span>
            )}
          </div>
        </div>

        {/* Message content */}
        <div className={`${
          isUser
            ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3'
            : ''
        }`}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[100px] p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-claude-orange"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-sm rounded bg-claude-orange text-white hover:bg-opacity-90 transition-colors"
                >
                  Save & Regenerate
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to save, Esc to cancel
              </div>
            </div>
          ) : (
            <>
              {/* Display thinking block if present */}
              {thinking && (
                <div className="mb-4 border-l-4 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${showThinking ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Claude's Reasoning
                    </span>
                  </button>
                  {showThinking && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-800">
                      {thinking}
                    </div>
                  )}
                </div>
              )}

              {/* Display images if present */}
              {message.images && (() => {
                try {
                  const images = typeof message.images === 'string' ? JSON.parse(message.images) : message.images
                  if (Array.isArray(images) && images.length > 0) {
                    return (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.data}
                            alt={img.name || `Image ${idx + 1}`}
                            className="max-w-xs max-h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(img.data, '_blank')}
                            title="Click to view full size"
                          />
                        ))}
                      </div>
                    )
                  }
                } catch (e) {
                  console.error('Error parsing images:', e)
                }
                return null
              })()}

              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  className="prose dark:prose-invert max-w-none"
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props}>
                          {children}
                        </code>
                      ) : (
                        <CodeBlock className={className} {...props}>
                          {children}
                        </CodeBlock>
                      )
                    },
                    a({ node, href, children, ...props }) {
                      // Handle artifact links
                      if (href && href.startsWith('artifact:')) {
                        const identifier = href.replace('artifact:', '')
                        return (
                          <button
                            onClick={(e) => handleArtifactClick(e, identifier)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-claude-orange bg-opacity-10 text-claude-orange hover:bg-opacity-20 rounded border border-claude-orange border-opacity-30 transition-colors"
                            {...props}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {children}
                          </button>
                        )
                      }
                      // Regular links
                      return <a href={href} {...props}>{children}</a>
                    }
                  }}
                >
                  {processed}
                </ReactMarkdown>
              )}
            </>
          )}
        </div>

        {/* Timestamp and Token Usage */}
        {!isEditing && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
            <span>{new Date(message.created_at).toLocaleTimeString()}</span>
            {/* Token usage for assistant messages */}
            {!isUser && (message.input_tokens || message.output_tokens) && (
              <span className="flex items-center gap-2">
                <span className="text-gray-400">|</span>
                <span title="Input tokens">
                  <span className="text-gray-400">In:</span> {message.input_tokens || 0}
                </span>
                <span title="Output tokens">
                  <span className="text-gray-400">Out:</span> {message.output_tokens || 0}
                </span>
                <span title="Total tokens" className="font-medium">
                  <span className="text-gray-400">Total:</span> {(message.input_tokens || 0) + (message.output_tokens || 0)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageList
