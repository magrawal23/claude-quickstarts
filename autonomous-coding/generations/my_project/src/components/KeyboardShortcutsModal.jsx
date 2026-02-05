function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const shortcutCategories = [
    {
      category: 'General',
      shortcuts: [
        { action: 'Open command palette', keys: ['Ctrl', 'K'] },
        { action: 'Keyboard shortcuts', keys: ['?'] },
        { action: 'New conversation', keys: ['Ctrl', 'N'] },
        { action: 'Open settings', keys: ['Ctrl', ','] },
        { action: 'Search conversations', keys: ['Ctrl', 'F'] }
      ]
    },
    {
      category: 'Navigation',
      shortcuts: [
        { action: 'Toggle sidebar', keys: ['Ctrl', 'B'] },
        { action: 'Focus chat input', keys: ['/'] },
        { action: 'Close modal/panel', keys: ['Esc'] }
      ]
    },
    {
      category: 'Chat',
      shortcuts: [
        { action: 'Send message', keys: ['Enter'] },
        { action: 'New line in message', keys: ['Shift', 'Enter'] },
        { action: 'Copy last response', keys: ['Ctrl', 'Shift', 'C'] },
        { action: 'Regenerate response', keys: ['Ctrl', 'R'] }
      ]
    },
    {
      category: 'Conversation Management',
      shortcuts: [
        { action: 'Delete conversation', keys: ['Ctrl', 'D'] },
        { action: 'Pin conversation', keys: ['Ctrl', 'P'] },
        { action: 'Archive conversation', keys: ['Ctrl', 'A'] }
      ]
    }
  ]

  const renderKeys = (keys) => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-w-[32px] text-center">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-gray-500 text-xs">+</span>}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quick reference for all available shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close keyboard shortcuts"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {shortcutCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-lg font-semibold mb-3 text-coral-500 dark:text-coral-400">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.action}
                    </span>
                    {renderKeys(shortcut.keys)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">?</kbd> anytime to view shortcuts</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal
