const MODEL_DETAILS = [
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Most capable model for complex tasks',
    contextWindow: 200000,
    speed: 'Fast',
    quality: 'Excellent',
    pricing: {
      input: '$3.00 / MTok',
      output: '$15.00 / MTok'
    },
    useCases: [
      'Complex analysis and reasoning',
      'Long document processing',
      'Multi-step problem solving',
      'Creative content generation'
    ],
    strengths: [
      'Best balance of speed and intelligence',
      'Extended context understanding',
      'Nuanced reasoning capabilities'
    ]
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fast and efficient for quick responses',
    contextWindow: 200000,
    speed: 'Very Fast',
    quality: 'Good',
    pricing: {
      input: '$0.25 / MTok',
      output: '$1.25 / MTok'
    },
    useCases: [
      'Quick questions and answers',
      'Simple tasks and formatting',
      'High-volume processing',
      'Real-time applications'
    ],
    strengths: [
      'Lightning-fast responses',
      'Most cost-effective option',
      'Excellent for simple tasks'
    ]
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Powerful model for demanding workloads',
    contextWindow: 200000,
    speed: 'Moderate',
    quality: 'Outstanding',
    pricing: {
      input: '$15.00 / MTok',
      output: '$75.00 / MTok'
    },
    useCases: [
      'Advanced research and analysis',
      'Complex code generation',
      'Strategic planning',
      'Highest-quality outputs'
    ],
    strengths: [
      'Top-tier reasoning and creativity',
      'Most sophisticated responses',
      'Best for critical applications'
    ]
  }
]

function ModelComparisonModal({ isOpen, onClose, onSelectModel, currentModel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Compare Claude Models
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose the best model for your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="p-6">
            {/* Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MODEL_DETAILS.map((model) => (
                <div
                  key={model.id}
                  className={`rounded-lg border-2 p-6 transition-all ${
                    currentModel === model.id
                      ? 'border-claude-orange bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Model Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {model.name}
                      </h3>
                      {currentModel === model.id && (
                        <span className="px-2 py-1 text-xs font-medium bg-claude-orange text-white rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {model.description}
                    </p>
                  </div>

                  {/* Capabilities */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Context Window
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {model.contextWindow.toLocaleString()} tokens
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Speed
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {model.speed}
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: model.speed === 'Very Fast' ? '100%' : model.speed === 'Fast' ? '75%' : '50%'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Quality
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {model.quality}
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: model.quality === 'Outstanding' ? '100%' : model.quality === 'Excellent' ? '85%' : '70%'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Pricing
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <div>Input: {model.pricing.input}</div>
                        <div>Output: {model.pricing.output}</div>
                      </div>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Best For
                    </div>
                    <ul className="space-y-1">
                      {model.useCases.map((useCase, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strengths */}
                  <div className="mb-6">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Key Strengths
                    </div>
                    <ul className="space-y-1">
                      {model.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="text-blue-500 mr-2">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => {
                      onSelectModel(model.id)
                      onClose()
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                      currentModel === model.id
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-claude-orange hover:bg-orange-700 text-white'
                    }`}
                    disabled={currentModel === model.id}
                  >
                    {currentModel === model.id ? 'Currently Selected' : 'Select Model'}
                  </button>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Choosing the Right Model
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li><strong>Haiku:</strong> Great for quick tasks, high-volume processing, and cost-sensitive applications</li>
                <li><strong>Sonnet:</strong> Ideal for most use cases requiring a balance of speed, quality, and cost</li>
                <li><strong>Opus:</strong> Best for complex tasks requiring top-tier reasoning and highest quality outputs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelComparisonModal
