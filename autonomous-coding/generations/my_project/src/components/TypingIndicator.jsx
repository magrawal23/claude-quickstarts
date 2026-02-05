import './TypingIndicator.css'

function TypingIndicator() {
  return (
    <div className="typing-indicator-container mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-claude-orange flex items-center justify-center text-white font-semibold text-sm">
            C
          </div>
        </div>
        <div className="flex-1">
          <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">Claude</div>
          <div className="typing-indicator">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
