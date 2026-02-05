import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useSettings } from '../contexts/SettingsContext'
import { useTour } from '../contexts/TourContext'

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general')
  const [showTemplates, setShowTemplates] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { fontSize, setFontSize, messageDensity, setMessageDensity, codeTheme, setCodeTheme, customInstructions, setCustomInstructions, advancedSettings, setAdvancedSettings, highContrast, setHighContrast, reducedMotion, setReducedMotion } = useSettings()
  const { startTour, resetTour } = useTour()

  if (!isOpen) return null

  // Template library
  const templates = [
    {
      id: 'software-engineer',
      name: 'Software Engineer',
      description: 'Optimized for developers writing code',
      aboutYou: 'I am a professional software engineer working on web applications. I prefer TypeScript, React, and Node.js. I value clean, maintainable code and best practices.',
      howToRespond: 'Be concise and technical. Provide code examples when relevant. Focus on production-ready solutions. Explain trade-offs when multiple approaches exist.'
    },
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      description: 'For data analysis and machine learning tasks',
      aboutYou: 'I am a data scientist working with Python, pandas, and scikit-learn. I analyze datasets and build machine learning models.',
      howToRespond: 'Focus on data analysis techniques and statistical concepts. Provide Python code examples using common data science libraries. Explain methodology and interpretation of results.'
    },
    {
      id: 'writer',
      name: 'Creative Writer',
      description: 'For creative writing and content creation',
      aboutYou: 'I am a writer working on creative content, blog posts, and articles. I value clear, engaging prose and storytelling.',
      howToRespond: 'Be creative and descriptive. Use vivid language and metaphors. Help with brainstorming and editing. Provide feedback on tone and style.'
    },
    {
      id: 'student',
      name: 'Student',
      description: 'For learning and educational support',
      aboutYou: 'I am a student learning various subjects. I want to understand concepts deeply rather than just getting answers.',
      howToRespond: 'Explain concepts clearly with examples. Break down complex topics into simpler parts. Ask questions to check understanding. Encourage critical thinking.'
    },
    {
      id: 'business',
      name: 'Business Professional',
      description: 'For business analysis and strategy',
      aboutYou: 'I work in business strategy and need help with analysis, presentations, and decision-making.',
      howToRespond: 'Be professional and structured. Focus on actionable insights. Use business terminology appropriately. Provide frameworks and methodologies.'
    },
    {
      id: 'researcher',
      name: 'Academic Researcher',
      description: 'For academic research and analysis',
      aboutYou: 'I am conducting academic research and need help with literature review, methodology, and analysis.',
      howToRespond: 'Be rigorous and precise. Cite concepts and methodologies. Help identify gaps in reasoning. Use academic language and structure.'
    }
  ]

  const applyTemplate = (template) => {
    setCustomInstructions({
      aboutYou: template.aboutYou,
      howToRespond: template.howToRespond,
      enabled: true
    })
    setShowTemplates(false)
  }

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' },
    { id: 'custom-instructions', name: 'Custom Instructions', icon: '📝' },
    { id: 'advanced', name: 'Advanced', icon: '🔧' },
    { id: 'keyboard-shortcuts', name: 'Keyboard Shortcuts', icon: '⌨️' },
    { id: 'data-privacy', name: 'Data & Privacy', icon: '🔒' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Language</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred language</p>
                  </div>
                  <select className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Auto-save conversations</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically save your conversations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Show typing indicators</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Display when Claude is typing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Enable sound effects</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Play sounds for message notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold mb-4">Help & Onboarding</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Feature Tour</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Take a guided tour of key features</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose()
                      resetTour()
                      setTimeout(() => startTour(), 100)
                    }}
                    className="px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-claude-orange/90 transition-colors text-sm font-medium"
                  >
                    Start Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        theme === 'light'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-xs font-medium">Light</div>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        theme === 'dark'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-2xl mb-1">🌙</div>
                      <div className="text-xs font-medium">Dark</div>
                    </button>
                    <button
                      onClick={() => setTheme('auto')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        theme === 'auto'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-2xl mb-1">🔄</div>
                      <div className="text-xs font-medium">Auto</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Small</span>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-xs text-gray-500">Large</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {fontSize}px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message Density</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setMessageDensity('compact')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        messageDensity === 'compact'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-xs font-medium mb-1">Compact</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => setMessageDensity('comfortable')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        messageDensity === 'comfortable'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-xs font-medium mb-1">Comfortable</div>
                      <div className="flex flex-col gap-1">
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => setMessageDensity('spacious')}
                      className={`px-4 py-3 rounded-lg border-2 ${
                        messageDensity === 'spacious'
                          ? 'border-coral-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <div className="text-xs font-medium mb-1">Spacious</div>
                      <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                        <div className="h-1.5 bg-gray-400 rounded"></div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Code Theme</label>
                  <select
                    value={codeTheme}
                    onChange={(e) => setCodeTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    <option value="github">GitHub (Light)</option>
                    <option value="github-dark">GitHub Dark</option>
                    <option value="monokai">Monokai</option>
                    <option value="dracula">Dracula</option>
                    <option value="nord">Nord</option>
                    <option value="solarized-light">Solarized Light</option>
                    <option value="solarized-dark">Solarized Dark</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Accessibility Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Customize the interface to meet your accessibility needs
              </p>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">High Contrast Mode</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Increases color contrast for better visibility. Enhances borders, text, and focus indicators.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reduced Motion</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Minimizes animations and transitions. Helpful for vestibular disorders or motion sensitivity.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={reducedMotion}
                      onChange={(e) => setReducedMotion(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold mb-3">Additional Accessibility Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Full keyboard navigation with visible focus indicators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Screen reader support with ARIA labels and semantic HTML</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Arrow key navigation for conversation list</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Customizable font sizes and message density</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Keyboard shortcuts for common actions (Press ? to view)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'custom-instructions':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Custom Instructions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add custom instructions that Claude will follow in all conversations
              </p>

              {/* Template Library Button */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="mb-4 px-4 py-2 text-sm text-coral-600 dark:text-coral-400 border border-coral-500 rounded-lg hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors flex items-center gap-2"
              >
                <span>📚</span>
                <span>{showTemplates ? 'Hide Templates' : 'Browse Template Library'}</span>
              </button>

              {/* Template Library */}
              {showTemplates && (
                <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <h4 className="text-sm font-semibold mb-3">Template Library</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-coral-500 dark:hover:border-coral-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
                      >
                        <div className="font-medium text-sm mb-1">{template.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{template.description}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Click a template to load it into the fields below. You can customize it before saving.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What would you like Claude to know about you?</label>
                  <textarea
                    value={customInstructions.aboutYou}
                    onChange={(e) => setCustomInstructions({
                      ...customInstructions,
                      aboutYou: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[100px]"
                    placeholder="e.g., I'm a software engineer who prefers Python and TypeScript..."
                    maxLength={1500}
                  ></textarea>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customInstructions.aboutYou.length} / 1500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How would you like Claude to respond?</label>
                  <textarea
                    value={customInstructions.howToRespond}
                    onChange={(e) => setCustomInstructions({
                      ...customInstructions,
                      howToRespond: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[100px]"
                    placeholder="e.g., Be concise and technical. Use code examples when relevant..."
                    maxLength={1500}
                  ></textarea>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customInstructions.howToRespond.length} / 1500 characters</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Enable for all conversations</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Apply these instructions globally</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={customInstructions.enabled}
                      onChange={(e) => setCustomInstructions({
                        ...customInstructions,
                        enabled: e.target.checked
                      })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                >
                  Save Custom Instructions
                </button>
              </div>
            </div>
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Temperature</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Precise</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={advancedSettings.temperature}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-xs text-gray-500">Creative</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {advancedSettings.temperature}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={advancedSettings.maxTokens}
                    onChange={(e) => setAdvancedSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum length of response (default: 4096)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Top P</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={advancedSettings.topP}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{advancedSettings.topP}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nucleus sampling threshold</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Thinking Mode</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Show Claude's reasoning process</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={advancedSettings.thinkingMode}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, thinkingMode: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stream Responses</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Display responses as they generate</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'keyboard-shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">New conversation</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + N</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">Send message</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">New line</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Shift + Enter</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">Open settings</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + ,</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">Search conversations</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + F</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">Toggle sidebar</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + B</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm">Copy last response</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + Shift + C</kbd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Delete conversation</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + D</kbd>
                </div>
              </div>
            </div>
          </div>
        )

      case 'data-privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Save conversation history</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Store conversations locally</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">Analytics & Diagnostics</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Help improve the app by sharing usage data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-coral-300 dark:peer-focus:ring-coral-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-coral-500"></div>
                  </label>
                </div>

                <div className="pt-4 space-y-3">
                  <button className="w-full px-4 py-2 text-coral-500 border border-coral-500 rounded-lg hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors">
                    Export All Data
                  </button>
                  <button className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Delete All Conversations
                  </button>
                  <button className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="settings-title" className="text-2xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-coral-50 dark:bg-coral-900/20 text-coral-600 dark:text-coral-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Version 1.0.0 • Claude AI Clone
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
