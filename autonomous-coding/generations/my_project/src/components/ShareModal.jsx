import { useState, useEffect } from 'react'

function ShareModal({ isOpen, onClose, conversationId }) {
  const [shareData, setShareData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [expirationOption, setExpirationOption] = useState('never') // 'never', '1hour', '1day', '7days', '30days', 'custom'
  const [customDate, setCustomDate] = useState('')

  // Load share info when modal opens
  useEffect(() => {
    if (isOpen && conversationId) {
      loadShareInfo()
    }
  }, [isOpen, conversationId])

  const loadShareInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/share`)
      const data = await response.json()

      if (response.ok) {
        setShareData(data)
      } else {
        setError(data.error || 'Failed to load share info')
      }
    } catch (error) {
      console.error('Error loading share info:', error)
      setError('Failed to load share info')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateShare = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Calculate expiration date based on selected option
      let expiresAt = null
      const now = new Date()

      switch (expirationOption) {
        case '1hour':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
          break
        case '1day':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
          break
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'custom':
          if (customDate) {
            expiresAt = new Date(customDate).toISOString()
          }
          break
        case 'never':
        default:
          expiresAt = null
      }

      const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt })
      })
      const data = await response.json()

      if (response.ok) {
        setShareData({ ...data, shared: true })
      } else {
        setError(data.error || 'Failed to create share link')
      }
    } catch (error) {
      console.error('Error creating share:', error)
      setError('Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeShare = async () => {
    if (!confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/share`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShareData({ shared: false })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to revoke share link')
      }
    } catch (error) {
      console.error('Error revoking share:', error)
      setError('Failed to revoke share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${shareData.url}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Share Conversation</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a read-only link to share this conversation
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claude-orange dark:border-claude-orange"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : shareData?.shared ? (
            <div className="space-y-4">
              {/* Share link display */}
              <div>
                <label className="block text-sm font-medium mb-2">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${shareData.url}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Share info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm space-y-1">
                  <p className="text-blue-900 dark:text-blue-100">
                    <strong>Created:</strong> {new Date(shareData.createdAt).toLocaleString()}
                  </p>
                  {shareData.expiresAt && (
                    <p className="text-blue-900 dark:text-blue-100">
                      <strong>Expires:</strong> {new Date(shareData.expiresAt).toLocaleString()}
                    </p>
                  )}
                  <p className="text-blue-900 dark:text-blue-100">
                    <strong>Views:</strong> {shareData.viewCount}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Anyone with this link can view the conversation, but cannot edit or reply.
                </p>
              </div>

              {/* Revoke button */}
              <button
                onClick={handleRevokeShare}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Revoke Share Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This conversation is not currently shared. Create a share link to allow others to view it.
              </p>

              {/* Expiration Date Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Link Expiration</label>
                <select
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="never">Never expires</option>
                  <option value="1hour">1 hour</option>
                  <option value="1day">1 day</option>
                  <option value="7days">7 days</option>
                  <option value="30days">30 days</option>
                  <option value="custom">Custom date</option>
                </select>

                {expirationOption === 'custom' && (
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Share features:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Read-only access to conversation</li>
                  <li>No login required</li>
                  <li>Can be revoked at any time</li>
                  <li>View count tracking</li>
                  {expirationOption !== 'never' && <li>Automatic expiration</li>}
                </ul>
              </div>

              <button
                onClick={handleCreateShare}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Share Link
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
