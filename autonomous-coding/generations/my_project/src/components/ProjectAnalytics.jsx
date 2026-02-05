import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'

function ProjectAnalytics({ projectId, onClose }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [projectId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/analytics`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC785C] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Project Analytics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Conversations</div>
              <div className="text-3xl font-bold text-blue-900">{analytics.conversation_count}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Messages</div>
              <div className="text-3xl font-bold text-green-900">{analytics.message_count}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Total Tokens</div>
              <div className="text-3xl font-bold text-purple-900">{analytics.total_tokens.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
              <div className="text-sm text-amber-600 font-medium mb-1">Estimated Cost</div>
              <div className="text-3xl font-bold text-amber-900">${analytics.estimated_cost}</div>
            </div>
          </div>

          {/* Model Breakdown */}
          {analytics.model_breakdown && analytics.model_breakdown.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Usage</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {analytics.model_breakdown.map((model, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#CC785C]"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {model.model || 'Unknown Model'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{model.conversation_count} conversations</span>
                        <span className="font-medium">{model.tokens.toLocaleString()} tokens</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Usage Over Time */}
          {analytics.daily_usage && analytics.daily_usage.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Over Time (Last 30 Days)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {/* Simple bar chart visualization */}
                <div className="space-y-2">
                  {analytics.daily_usage.slice(-14).map((day, idx) => {
                    const maxTokens = Math.max(...analytics.daily_usage.map(d => d.tokens))
                    const width = maxTokens > 0 ? (day.tokens / maxTokens) * 100 : 0

                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-[#CC785C] h-full rounded-full transition-all duration-300"
                            style={{ width: `${width}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-xs font-medium text-gray-700">
                              {day.message_count} msgs, {day.tokens.toLocaleString()} tokens
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {analytics.daily_usage.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No usage data available for the last 30 days
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost Breakdown Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Cost estimates are approximate and based on Claude Sonnet 4.5 pricing
              ($3 per million input tokens, $15 per million output tokens).
              Actual costs may vary based on the specific model and token distribution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#CC785C] text-white rounded-lg hover:bg-[#B66A4D] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectAnalytics
