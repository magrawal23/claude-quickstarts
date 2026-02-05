import { useState, useEffect, useRef } from 'react'
import { useConversation } from '../contexts/ConversationContext'
import { useTouchGestures } from '../hooks/useTouchGestures'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import mermaid from 'mermaid'

function ArtifactPanel() {
  const {
    artifacts,
    artifactPanelVisible,
    selectedArtifactIndex,
    setSelectedArtifactIndex,
    closeArtifactPanel,
    setPromptSuggestion
  } = useConversation()
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])
  const [viewingVersion, setViewingVersion] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Handle touch gestures for closing artifact panel on mobile
  useTouchGestures({
    onSwipeRight: () => {
      // Close artifact panel when swiping right on mobile
      if (window.innerWidth < 1024 && artifactPanelVisible) {
        closeArtifactPanel()
      }
    },
    minSwipeDistance: 60,
    maxSwipeTime: 300,
    requireEdgeSwipe: false // Allow swipe anywhere on artifact panel
  })

  // Handle panel visibility with animation
  useEffect(() => {
    if (artifactPanelVisible && artifacts && artifacts.length > 0) {
      // Panel is opening
      setShouldRender(true)
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else if (!artifactPanelVisible) {
      // Panel is closing - start exit animation
      setIsAnimating(false)
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match CSS transition duration
      return () => clearTimeout(timer)
    }
  }, [artifactPanelVisible, artifacts])

  // If no artifacts, don't render anything
  if (!artifacts || artifacts.length === 0) {
    return null
  }

  // Don't render until we should show the panel
  if (!shouldRender) {
    return null
  }

  const currentArtifact = artifacts[selectedArtifactIndex]

  // Fetch version history
  const fetchVersions = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/artifacts/${currentArtifact.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data)
        setShowVersions(true)
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err)
    }
  }

  // Revert to a previous version
  const revertToVersion = async (version) => {
    if (!confirm(`Revert to version ${version}? This will create a new version with that content.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/artifacts/${currentArtifact.id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to revert:', err)
      alert('Failed to revert to previous version')
    }
  }

  return (
    <>
      <div
        className={`w-full lg:w-1/2 xl:w-1/3 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-claude-dark-surface flex flex-col transition-all duration-300 ease-in-out fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto ${
          isAnimating ? 'artifact-panel-open' : 'artifact-panel-closed'
        }`}
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div>
            <h3 className="font-semibold text-sm">
              {currentArtifact.title || 'Untitled Artifact'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {currentArtifact.type} {currentArtifact.language && `• ${currentArtifact.language}`}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {artifacts.length > 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedIndex + 1} / {artifacts.length}
              </span>
            )}
            {!isEditing && !viewingVersion && (
              <>
                <VersionHistoryButton
                  onClick={fetchVersions}
                  versionCount={currentArtifact.version}
                />
                <RepromptButton onClick={() => {
                  const artifactType = currentArtifact.type === 'code'
                    ? `${currentArtifact.language || 'code'} code`
                    : currentArtifact.type
                  setPromptSuggestion(`Please modify the ${artifactType} "${currentArtifact.title || 'artifact'}" to `)
                }} />
                <EditButton onClick={() => {
                  setIsEditing(true)
                  setEditedContent(currentArtifact.content)
                }} />
                <FullScreenButton onClick={() => setIsFullScreen(true)} />
                <DownloadButton artifact={currentArtifact} />
              </>
            )}
            {isEditing && (
              <>
                <SaveButton onClick={async () => {
                  try {
                    // Save the edited content
                    const response = await fetch(`http://localhost:3000/api/artifacts/${currentArtifact.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        content: editedContent,
                        title: currentArtifact.title
                      })
                    })
                    if (response.ok) {
                      // Update local state
                      currentArtifact.content = editedContent
                      setIsEditing(false)
                      // Reload the conversation to get updated artifact
                      window.location.reload()
                    }
                  } catch (err) {
                    console.error('Failed to save artifact:', err)
                    alert('Failed to save changes')
                  }
                }} />
                <CancelButton onClick={() => {
                  setIsEditing(false)
                  setEditedContent('')
                }} />
              </>
            )}
            <CloseButton onClick={closeArtifactPanel} />
          </div>
        </div>

      {/* Tabs (if multiple artifacts) */}
      {artifacts.length > 1 && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {artifacts.map((artifact, index) => (
            <button
              key={artifact.id}
              onClick={() => setSelectedArtifactIndex(index)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                index === selectedArtifactIndex
                  ? 'border-claude-orange text-claude-orange'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {artifact.title || `Artifact ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full min-h-[500px] p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-claude-orange bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
            placeholder="Edit artifact content..."
          />
        ) : viewingVersion ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Viewing version {viewingVersion.version}</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                  {new Date(viewingVersion.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setViewingVersion(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                Back to current
              </button>
            </div>
            <ArtifactContent artifact={{...currentArtifact, content: viewingVersion.content, title: viewingVersion.title}} />
          </>
        ) : (
          <ArtifactContent artifact={currentArtifact} />
        )}
      </div>
    </div>

      {/* Version History Modal */}
      {showVersions && (
        <VersionHistoryModal
          versions={versions}
          currentVersion={currentArtifact.version}
          onClose={() => setShowVersions(false)}
          onViewVersion={(version) => {
            setViewingVersion(version)
            setShowVersions(false)
          }}
          onRevertVersion={revertToVersion}
        />
      )}

      {/* Full-Screen Modal */}
      {isFullScreen && (
        <FullScreenModal
          artifact={currentArtifact}
          artifacts={artifacts}
          selectedIndex={selectedArtifactIndex}
          setSelectedIndex={setSelectedArtifactIndex}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </>
  )
}

function ArtifactContent({ artifact }) {
  if (!artifact) return null

  const { type, content, language } = artifact

  // Code artifacts
  if (type === 'code') {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <CopyButton content={content} />
        </div>
        <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
          <code className={language ? `language-${language}` : ''}>
            {content}
          </code>
        </pre>
      </div>
    )
  }

  // HTML artifacts - render in iframe
  if (type === 'html') {
    return (
      <div className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <iframe
          srcDoc={content}
          className="w-full h-full"
          sandbox="allow-scripts"
          title={artifact.title || 'HTML Preview'}
        />
      </div>
    )
  }

  // SVG artifacts
  if (type === 'svg') {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className="max-w-full"
        />
      </div>
    )
  }

  // React components - render in sandbox
  if (type === 'react') {
    return <ReactComponentPreview code={content} />
  }

  // Mermaid diagrams - render with mermaid library
  if (type === 'mermaid') {
    return <MermaidDiagram content={content} />
  }

  // Text artifacts
  if (type === 'text') {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  // Default: show as text
  return (
    <pre className="whitespace-pre-wrap text-sm">
      {content}
    </pre>
  )
}

function CopyButton({ content }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function FullScreenButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="View full screen"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
      Full Screen
    </button>
  )
}

function FullScreenModal({ artifact, artifacts, selectedIndex, setSelectedIndex, onClose }) {
  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-claude-dark-surface border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">
            {artifact.title || 'Untitled Artifact'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {artifact.type} {artifact.language && `• ${artifact.language}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {artifacts.length > 1 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIndex + 1} / {artifacts.length}
            </span>
          )}
          <DownloadButton artifact={artifact} />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            title="Exit full screen (Esc)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Tabs (if multiple artifacts) */}
      {artifacts.length > 1 && (
        <div className="bg-white dark:bg-claude-dark-surface border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto">
          {artifacts.map((art, index) => (
            <button
              key={art.id}
              onClick={() => setSelectedIndex(index)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                index === selectedIndex
                  ? 'border-claude-orange text-claude-orange'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {art.title || `Artifact ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-claude-dark-surface p-8">
        <ArtifactContent artifact={artifact} />
      </div>
    </div>
  )
}

function RepromptButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="Ask Claude to modify this artifact"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      Re-prompt
    </button>
  )
}

function EditButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="Edit artifact"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Edit
    </button>
  )
}

function SaveButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-claude-orange text-white rounded hover:bg-opacity-90 transition-colors flex items-center gap-1 font-medium"
      title="Save changes"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      Save
    </button>
  )
}

function CancelButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="Cancel editing"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Cancel
    </button>
  )
}

function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      title="Close artifact panel"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  )
}

function MermaidDiagram({ content }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current || !content) return

    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })

    const renderDiagram = async () => {
      try {
        setError(null)
        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Clear previous content
        containerRef.current.innerHTML = ''

        // Render the diagram
        const { svg } = await mermaid.render(id, content)

        // Insert the SVG into the container
        containerRef.current.innerHTML = svg
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err.message || 'Failed to render diagram')
      }
    }

    renderDiagram()
  }, [content])

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-2 text-sm text-red-600 dark:text-red-400">
          Error rendering Mermaid diagram:
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Diagram code:
        </div>
        <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
          <code>{content}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div
        ref={containerRef}
        className="mermaid-container max-w-full overflow-auto"
      />
    </div>
  )
}

function ReactComponentPreview({ code }) {
  const [error, setError] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const handleLoad = () => {
      try {
        setError(null)
        // Send the component code to the iframe via postMessage
        iframeRef.current.contentWindow.postMessage({
          type: 'RENDER_COMPONENT',
          code: code
        }, '*')
      } catch (err) {
        console.error('Error sending code to iframe:', err)
        setError(err.message || 'Failed to load component')
      }
    }

    const iframe = iframeRef.current
    iframe.addEventListener('load', handleLoad)

    // Create the sandbox HTML document
    const sandboxHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Listen for component code from parent
    window.addEventListener('message', function(event) {
      if (event.data.type === 'RENDER_COMPONENT') {
        const code = event.data.code;

        try {
          // Pre-process code: remove imports and export statements
          let processedCode = code
            .replace(/import\\s+React,?\\s*\\{?([^}]*)\\}?\\s+from\\s+['"]react['"];?/gi, '')
            .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"]react['"];?/gi, '')
            .replace(/import\\s+React\\s+from\\s+['"]react['"];?/gi, '')
            .replace(/export\\s+default\\s+/gi, '');

          // Transpile JSX to JavaScript using Babel
          const transformed = Babel.transform(processedCode, {
            presets: ['react']
          }).code;

          // Create a script element to execute the transformed code
          const script = document.createElement('script');
          script.textContent = \`
            const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer } = React;
            \${transformed}

            // Find the component to render
            let ComponentToRender;

            if (typeof Counter !== 'undefined') {
              ComponentToRender = Counter;
            } else if (typeof App !== 'undefined') {
              ComponentToRender = App;
            } else {
              // Try to find first function or const component
              const matches = \\\`\${processedCode}\\\`.match(/(?:function\\\\s+(\\\\w+)|const\\\\s+(\\\\w+)\\\\s*=)/);
              if (matches) {
                const componentName = matches[1] || matches[2];
                try {
                  ComponentToRender = eval(componentName);
                } catch (e) {
                  ComponentToRender = () => React.createElement('div', { style: { color: 'red' } }, 'Component not found: ' + componentName);
                }
              } else {
                ComponentToRender = () => React.createElement('div', { style: { color: 'orange' } }, 'No component found');
              }
            }

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(ComponentToRender));
          \`;

          document.body.appendChild(script);
        } catch (err) {
          document.getElementById('root').innerHTML = '<div style="color: red; padding: 16px; font-family: monospace; white-space: pre-wrap;">Error: ' + err.message + '</div>';
        }
      }
    });

    // Error handling
    window.addEventListener('error', function(e) {
      document.getElementById('root').innerHTML = '<div style="color: red; padding: 16px; font-family: monospace; white-space: pre-wrap;">Runtime Error: ' + e.message + '</div>';
      return true;
    });
  </script>
</body>
</html>
    `

    // Set the iframe content
    iframe.srcdoc = sandboxHtml

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [code])

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-2 text-sm text-red-600 dark:text-red-400">
          Error rendering React component:
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Component code:
        </div>
        <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
          <code className="language-jsx">{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        className="w-full h-full min-h-[400px]"
        sandbox="allow-scripts"
        title="React Component Preview"
      />
    </div>
  )
}

function VersionHistoryButton({ onClick, versionCount }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="View version history"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      v{versionCount}
    </button>
  )
}

function VersionHistoryModal({ versions, currentVersion, onClose, onViewVersion, onRevertVersion }) {
  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Version History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No version history available
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    version.is_current
                      ? 'border-claude-orange bg-orange-50 dark:bg-orange-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Version {version.version}
                        </span>
                        {version.is_current && (
                          <span className="text-xs px-2 py-0.5 bg-claude-orange text-white rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!version.is_current && (
                        <>
                          <button
                            onClick={() => onViewVersion(version)}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onRevertVersion(version.version)}
                            className="text-xs px-3 py-1.5 bg-claude-orange text-white rounded hover:bg-opacity-90 transition-colors"
                          >
                            Revert
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {version.title && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {version.title}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-24 overflow-hidden">
                    {version.content.substring(0, 200)}
                    {version.content.length > 200 && '...'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DownloadButton({ artifact }) {
  const getFileExtension = (type, language) => {
    // Map artifact types to file extensions
    if (type === 'html') return 'html'
    if (type === 'svg') return 'svg'
    if (type === 'react') return 'jsx'
    if (type === 'mermaid') return 'mmd'
    if (type === 'text') return 'md'

    // For code artifacts, use the language
    if (type === 'code' && language) {
      const extensionMap = {
        'javascript': 'js',
        'typescript': 'ts',
        'python': 'py',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'csharp': 'cs',
        'ruby': 'rb',
        'go': 'go',
        'rust': 'rs',
        'php': 'php',
        'swift': 'swift',
        'kotlin': 'kt',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'sql': 'sql',
        'bash': 'sh',
        'shell': 'sh',
      }
      return extensionMap[language.toLowerCase()] || 'txt'
    }

    // Default to .txt
    return 'txt'
  }

  const getFileName = (artifact) => {
    const title = artifact.title || 'artifact'
    // Sanitize filename - remove special characters
    const sanitized = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-')
    const extension = getFileExtension(artifact.type, artifact.language)
    return `${sanitized}.${extension}`
  }

  const handleDownload = () => {
    try {
      const fileName = getFileName(artifact)
      const content = artifact.content

      // Create a blob from the content
      const blob = new Blob([content], { type: 'text/plain' })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download artifact:', err)
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
      title="Download artifact"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download
    </button>
  )
}

export default ArtifactPanel
