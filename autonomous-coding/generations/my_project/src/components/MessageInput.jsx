import { useState, useRef, useEffect } from 'react'
import { useConversation } from '../contexts/ConversationContext'
import { useProject } from '../contexts/ProjectContext'

function MessageInput({ selectedPromptTemplate, onPromptUsed }) {
  const [input, setInput] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const { currentConversation, sendMessage, createConversation, loading, stopGeneration, promptSuggestion, setPromptSuggestion } = useConversation()
  const { currentProject } = useProject()

  // Auto-resize textarea with max height of 128px (max-h-32)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 128)
      textareaRef.current.style.height = newHeight + 'px'
    }
  }, [input])

  // Handle prompt suggestions from re-prompt button
  useEffect(() => {
    if (promptSuggestion) {
      setInput(promptSuggestion)
      setPromptSuggestion('') // Clear the suggestion
      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }, [promptSuggestion, setPromptSuggestion])

  // Handle selected prompt from prompt library
  useEffect(() => {
    if (selectedPromptTemplate) {
      setInput(selectedPromptTemplate)
      if (onPromptUsed) {
        onPromptUsed()
      }
      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
        // Move cursor to end
        const length = selectedPromptTemplate.length
        textareaRef.current.setSelectionRange(length, length)
      }
    }
  }, [selectedPromptTemplate, onPromptUsed])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || [])

    // Convert files to base64 data URLs for preview and sending
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            data: reader.result, // base64 data URL
            type: file.type,
            name: file.name
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises).then(images => {
      setSelectedImages(prev => [...prev, ...images])
    })
  }

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if ((!input.trim() && selectedImages.length === 0) || loading) return

    const messageText = input.trim() || ''
    const images = selectedImages
    setInput('')
    setSelectedImages([])

    // Create conversation if needed
    let convId = currentConversation?.id
    if (!convId) {
      const newConv = await createConversation(currentProject?.id)
      convId = newConv?.id
    }

    if (convId) {
      await sendMessage(messageText, convId, images)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleVoiceClick = () => {
    setShowVoiceModal(true)
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Show message after a brief delay
    setTimeout(() => {
      setShowVoiceModal(false)
    }, 1500)
  }

  const handleCloseVoiceModal = () => {
    setShowVoiceModal(false)
    setIsRecording(false)
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.data}
                  alt={image.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100"
                  title="Remove image"
                  tabIndex={0}
                  aria-label={`Remove image ${image.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Attachment button */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            disabled={loading}
            className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:scale-110 active:scale-95"
            title="Attach image"
            tabIndex={0}
            aria-label="Attach image to message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {/* Voice input button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={loading}
            className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 hover:scale-110 active:scale-95"
            title="Voice input"
            tabIndex={0}
            aria-label="Use voice input"
            data-testid="voice-input-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>

          <textarea
            data-tour-id="tour-message-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-claude-dark-bg focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 max-h-32 overflow-y-auto"
            tabIndex={0}
            aria-label="Message input"
          />
          {loading ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 active:scale-95"
              tabIndex={0}
              aria-label="Stop generating response"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && selectedImages.length === 0}
              className="px-6 py-3 bg-claude-orange text-white rounded-xl hover:bg-opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 active:scale-95"
              tabIndex={0}
              aria-label="Send message"
            >
              Send
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {input.length} characters • Press Enter to send, Shift+Enter for new line
        </div>
      </form>

      {/* Voice Input Modal */}
      {showVoiceModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseVoiceModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              {/* Microphone Icon with Animation */}
              <div className={`relative mb-6 ${isRecording ? 'animate-pulse' : ''}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-100 dark:bg-red-900'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-12 h-12 ${
                      isRecording
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 dark:border-red-400 animate-ping"></div>
                )}
              </div>

              {/* Status Text */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRecording ? 'Listening...' : 'Voice Input'}
              </h3>

              {isRecording ? (
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Speak your message clearly
                </p>
              ) : (
                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Voice input is not yet available
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This feature is coming soon!
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    data-testid="stop-recording-button"
                  >
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={handleCloseVoiceModal}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageInput
