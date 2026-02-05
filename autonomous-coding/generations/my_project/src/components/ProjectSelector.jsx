import { useState } from 'react'
import { useProject } from '../contexts/ProjectContext'
import ProjectAnalytics from './ProjectAnalytics'

function ProjectSelector() {
  const { projects, currentProject, setCurrentProject, createProject, updateProject, deleteProject } = useProject()
  const [isOpen, setIsOpen] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [settingsProject, setSettingsProject] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#CC785C')
  const [renameProjectName, setRenameProjectName] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [settingsTab, setSettingsTab] = useState('instructions')
  const [documents, setDocuments] = useState([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsProjectId, setAnalyticsProjectId] = useState(null)

  const availableColors = [
    '#CC785C', // Claude orange (default)
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ]

  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!newProjectName.trim()) {
      alert('Project name is required')
      return
    }

    try {
      await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        color: newProjectColor
      })

      // Reset form
      setNewProjectName('')
      setNewProjectDescription('')
      setNewProjectColor('#CC785C')
      setShowNewProjectModal(false)
      setIsOpen(false)
    } catch (error) {
      alert('Failed to create project. Please try again.')
    }
  }

  const handleRenameProject = async (e) => {
    e.preventDefault()

    if (!renameProjectName.trim()) {
      alert('Project name is required')
      return
    }

    try {
      await updateProject(editingProject.id, {
        name: renameProjectName.trim()
      })

      // Reset form
      setRenameProjectName('')
      setEditingProject(null)
      setShowRenameModal(false)
    } catch (error) {
      alert('Failed to rename project. Please try again.')
    }
  }

  const openRenameModal = (project, e) => {
    e.stopPropagation()
    setEditingProject(project)
    setRenameProjectName(project.name)
    setShowRenameModal(true)
    setIsOpen(false)
  }

  const openDeleteModal = (project, e) => {
    e.stopPropagation()
    setDeletingProject(project)
    setShowDeleteModal(true)
    setIsOpen(false)
  }

  const handleDeleteProject = async () => {
    if (!deletingProject) return

    try {
      await deleteProject(deletingProject.id)
      setShowDeleteModal(false)
      setDeletingProject(null)
    } catch (error) {
      alert('Failed to delete project. Please try again.')
    }
  }

  const openSettingsModal = async (project, e) => {
    e.stopPropagation()
    setSettingsProject(project)
    setCustomInstructions(project.custom_instructions || '')
    setSettingsTab('instructions')
    setShowSettingsModal(true)
    setIsOpen(false)

    // Fetch documents for this project
    try {
      const response = await fetch(`http://localhost:3000/api/knowledge-base/projects/${project.id}/documents`)
      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()

    if (!settingsProject) return

    try {
      await updateProject(settingsProject.id, {
        custom_instructions: customInstructions
      })

      setShowSettingsModal(false)
      setSettingsProject(null)
      setCustomInstructions('')
      setDocuments([])
    } catch (error) {
      alert('Failed to update project settings. Please try again.')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !settingsProject) return

    // Validate file type
    if (!file.type.startsWith('text/') &&
        !file.type.includes('json') &&
        !file.type.includes('markdown')) {
      alert('Only text files are allowed (.txt, .md, .json, .csv, etc.)')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `http://localhost:3000/api/knowledge-base/projects/${settingsProject.id}/documents`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const newDocument = await response.json()
      setDocuments([...documents, newDocument])

      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!settingsProject || !confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(
        `http://localhost:3000/api/knowledge-base/projects/${settingsProject.id}/documents/${docId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      setDocuments(documents.filter(doc => doc.id !== docId))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const handleSaveAsTemplate = async (e) => {
    e.preventDefault()

    if (!templateName.trim()) {
      alert('Template name is required')
      return
    }

    if (!settingsProject) return

    setSavingTemplate(true)

    try {
      const response = await fetch('http://localhost:3000/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: settingsProject.id,
          name: templateName.trim(),
          description: templateDescription.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      alert(`Template "${templateName}" saved successfully!`)
      setShowSaveTemplateModal(false)
      setTemplateName('')
      setTemplateDescription('')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    } finally {
      setSavingTemplate(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleCreateFromTemplate = async (template) => {
    try {
      const response = await fetch(`http://localhost:3000/api/templates/${template.id}/create-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} Copy`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project from template')
      }

      const newProject = await response.json()

      // Reload projects to include the new one
      window.location.reload() // Simple approach to refresh

      setShowTemplatesModal(false)
    } catch (error) {
      console.error('Error creating project from template:', error)
      alert('Failed to create project from template. Please try again.')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <>
      {/* Project Selector Dropdown */}
      <div className="relative p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentProject?.color || '#CC785C' }}
            />
            <span className="font-medium truncate">
              {currentProject?.name || 'All Conversations'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-claude-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {/* All Conversations Option */}
            <button
              onClick={() => {
                setCurrentProject(null)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                !currentProject ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>All Conversations</span>
            </button>

            {/* Divider */}
            {projects.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            )}

            {/* Projects List */}
            {projects.map(project => (
              <div
                key={project.id}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 group ${
                  currentProject?.id === project.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <button
                  onClick={() => {
                    setCurrentProject(project)
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openSettingsModal(project, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Project settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => openRenameModal(project, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Rename project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(project, e)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Delete project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* New Project Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => {
                setShowNewProjectModal(true)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-claude-orange font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </button>
            <button
              onClick={() => {
                loadTemplates()
                setShowTemplatesModal(true)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Use Template</span>
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNewProjectModal(false)}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

            <form onSubmit={handleCreateProject}>
              {/* Project Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Project"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange"
                  required
                  autoFocus
                />
              </div>

              {/* Project Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your project"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange resize-none"
                />
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Project Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newProjectColor === color ? 'ring-2 ring-offset-2 ring-claude-orange scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {showRenameModal && editingProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRenameModal(false)}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Rename Project</h2>

            <form onSubmit={handleRenameProject}>
              {/* Project Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  placeholder="My Project"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange"
                  required
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameModal(false)
                    setEditingProject(null)
                    setRenameProjectName('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteModal && deletingProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Delete Project</h2>

            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Are you sure you want to delete <strong>{deletingProject.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will archive the project. Conversations in this project will remain accessible.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingProject(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showSettingsModal && settingsProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowSettingsModal(false)
            setSettingsProject(null)
            setCustomInstructions('')
            setDocuments([])
          }}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Project Settings: {settingsProject.name}</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              <button
                onClick={() => setSettingsTab('instructions')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  settingsTab === 'instructions'
                    ? 'border-claude-orange text-claude-orange'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Custom Instructions
              </button>
              <button
                onClick={() => setSettingsTab('knowledge')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  settingsTab === 'knowledge'
                    ? 'border-claude-orange text-claude-orange'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Knowledge Base ({documents.length})
              </button>
              <button
                onClick={() => setSettingsTab('analytics')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  settingsTab === 'analytics'
                    ? 'border-claude-orange text-claude-orange'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Analytics
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {settingsTab === 'instructions' ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    These instructions will be included in every conversation within this project. Use them to set context, tone, or specific requirements.
                  </p>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Example: You are a Python expert. Always use type hints and follow PEP 8 style guidelines. Provide detailed explanations for complex concepts."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange resize-none font-mono text-sm"
                  />
                </div>
              ) : settingsTab === 'knowledge' ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload text documents to provide Claude with project-specific knowledge. These documents will be available in all conversations within this project.
                  </p>

                  {/* File Upload Area */}
                  <div className="mb-6">
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-claude-orange transition-colors">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          accept=".txt,.md,.json,.csv,text/*"
                          className="hidden"
                        />
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium mb-1">
                          {uploadingFile ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Text files only (TXT, MD, JSON, CSV) • Max 10MB
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Documents List */}
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium mb-2">Uploaded Documents</h3>
                      {documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.original_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                            title="Delete document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    View usage statistics, token consumption, and cost estimates for this project.
                  </p>

                  <button
                    onClick={() => {
                      setAnalyticsProjectId(settingsProject.id)
                      setShowAnalytics(true)
                    }}
                    className="w-full px-4 py-3 bg-[#CC785C] text-white rounded-lg hover:bg-[#B66A4D] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Full Analytics
                  </button>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tip:</strong> Click the button above to see detailed statistics including conversation count, message count, token usage, cost estimates, model breakdown, and usage over time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-between">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveTemplateModal(true)
                  }}
                  className="px-4 py-2 border border-claude-orange text-claude-orange rounded-lg hover:bg-claude-orange hover:text-white transition-colors font-medium"
                  title="Save this project's settings as a template"
                >
                  Save as Template
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false)
                    setSettingsProject(null)
                    setCustomInstructions('')
                    setDocuments([])
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                {settingsTab === 'instructions' && (
                  <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 font-medium"
                  >
                    Save Instructions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && settingsProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowSaveTemplateModal(false)
            setTemplateName('')
            setTemplateDescription('')
          }}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Save as Template</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create a template from "{settingsProject.name}" to quickly create new projects with the same settings.
              </p>
              <form onSubmit={handleSaveAsTemplate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Python Development Template"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe what this template is for..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-claude-dark-bg focus:ring-2 focus:ring-claude-orange resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplateModal(false)
                      setTemplateName('')
                      setTemplateDescription('')
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="px-4 py-2 bg-claude-orange text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50"
                  >
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Templates List Modal */}
      {showTemplatesModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowTemplatesModal(false)}
        >
          <div
            className="bg-white dark:bg-claude-dark-surface rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Create from Template</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a template to quickly create a new project
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No templates available yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create a project and save it as a template
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-claude-orange hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: template.color || '#CC785C' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-lg">{template.name}</h3>
                            {template.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Created {new Date(template.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCreateFromTemplate(template)
                          }}
                          className="px-3 py-1.5 bg-claude-orange text-white text-sm rounded hover:bg-opacity-90 font-medium ml-3 flex-shrink-0"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analyticsProjectId && (
        <ProjectAnalytics
          projectId={analyticsProjectId}
          onClose={() => {
            setShowAnalytics(false)
            setAnalyticsProjectId(null)
          }}
        />
      )}
    </>
  )
}

export default ProjectSelector
