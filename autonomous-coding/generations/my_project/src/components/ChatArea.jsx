import { useState, useRef, useEffect, useMemo } from 'react'
import { useConversation } from '../contexts/ConversationContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ModelSelector from './ModelSelector'
import ContextWindowIndicator from './ContextWindowIndicator'
import ConversationSettingsModal from './ConversationSettingsModal'
import ShareModal from './ShareModal'
import ConversationInfoModal from './ConversationInfoModal'
import ModelComparisonModal from './ModelComparisonModal'
import SkeletonLoader from './SkeletonLoader'

function ChatArea({ selectedPromptTemplate, onPromptUsed }) {
  const { currentConversation, messages, renameConversation, updateConversationModel, loading, loadingMessages } = useConversation()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showModelComparison, setShowModelComparison] = useState(false)
  const [selectedExamplePrompt, setSelectedExamplePrompt] = useState('')
  const titleInputRef = useRef(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleClick = () => {
    if (currentConversation) {
      setEditedTitle(currentConversation.title || '')
      setIsEditingTitle(true)
    }
  }

  const handleTitleSave = async () => {
    if (editedTitle.trim() && currentConversation && editedTitle !== currentConversation.title) {
      try {
        await renameConversation(currentConversation.id, editedTitle.trim())
      } catch (error) {
        console.error('Failed to rename:', error)
      }
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
    }
  }

  const handleModelChange = async (newModel) => {
    if (currentConversation?.id) {
      try {
        await updateConversationModel(currentConversation.id, newModel)
      } catch (error) {
        console.error('Failed to update model:', error)
      }
    }
  }

  // Calculate total tokens from all messages
  const totalTokens = useMemo(() => {
    return messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0)
  }, [messages])

  return (
    <main className="flex-1 flex flex-col" role="main" aria-label="Chat area">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-lg font-semibold bg-transparent border-b-2 border-claude-orange focus:outline-none px-1"
              aria-label="Edit conversation title"
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:text-claude-orange transition-colors"
              onClick={handleTitleClick}
              title="Click to edit title"
              role="button"
              tabIndex={0}
              aria-label={`Conversation title: ${currentConversation?.title || 'Claude AI Clone'}. Click to edit.`}
            >
              {currentConversation?.title || 'Claude AI Clone'}
            </h1>
          )}
        </div>
        {currentConversation && (
          <div className="flex items-center space-x-2">
            <ModelSelector
              selectedModel={currentConversation.model || 'claude-sonnet-4-5-20250929'}
              onModelChange={handleModelChange}
              disabled={loading}
              onOpenComparison={() => setShowModelComparison(true)}
            />
            <ContextWindowIndicator
              currentTokens={totalTokens}
              model={currentConversation.model || 'claude-sonnet-4-5-20250929'}
            />
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              title="Conversation Info & Cost"
              tabIndex={0}
              aria-label="View conversation information and cost"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              title="Share Conversation"
              tabIndex={0}
              aria-label="Share conversation"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              title="Conversation Settings"
              tabIndex={0}
              aria-label="Open conversation settings"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {loadingMessages ? (
          <SkeletonLoader />
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Claude AI Clone</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start a conversation by typing a message below
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <ExamplePrompt text="Explain quantum computing" onClick={setSelectedExamplePrompt} />
                <ExamplePrompt text="Write a Python function" onClick={setSelectedExamplePrompt} />
                <ExamplePrompt text="Help me debug code" onClick={setSelectedExamplePrompt} />
                <ExamplePrompt text="Create an HTML page" onClick={setSelectedExamplePrompt} />
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* Input */}
      <MessageInput
        selectedPromptTemplate={selectedPromptTemplate || selectedExamplePrompt}
        onPromptUsed={() => {
          if (onPromptUsed) onPromptUsed()
          setSelectedExamplePrompt('')
        }}
      />

      {/* Conversation Settings Modal */}
      <ConversationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        conversationId={currentConversation?.id}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        conversationId={currentConversation?.id}
      />

      {/* Conversation Info Modal */}
      {showInfo && (
        <ConversationInfoModal
          conversationId={currentConversation?.id}
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Model Comparison Modal */}
      <ModelComparisonModal
        isOpen={showModelComparison}
        onClose={() => setShowModelComparison(false)}
        onSelectModel={handleModelChange}
        currentModel={currentConversation?.model || 'claude-sonnet-4-5-20250929'}
      />
    </main>
  )
}

function ExamplePrompt({ text, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(text)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      tabIndex={0}
      aria-label={`Use example prompt: ${text}`}
    >
      {text}
    </button>
  )
}

export default ChatArea
