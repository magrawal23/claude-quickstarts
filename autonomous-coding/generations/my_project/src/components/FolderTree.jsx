import { useState, useEffect } from 'react'
import { useFolders } from '../contexts/FolderContext'
import { useConversation } from '../contexts/ConversationContext'

function FolderTree({ currentProject, onConversationClick }) {
  const { folders, fetchFolders, createFolder, deleteFolder, toggleFolderExpanded, isFolderExpanded, addConversationToFolder, removeConversationFromFolder } = useFolders()
  const { conversations, loadConversations } = useConversation()
  const [folderConversations, setFolderConversations] = useState({})
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParent, setNewFolderParent] = useState(null)
  const [draggedConversation, setDraggedConversation] = useState(null)

  // Load folders when component mounts or project changes
  useEffect(() => {
    fetchFolders(currentProject?.id || null)
  }, [currentProject, fetchFolders])

  // Load conversations for each folder
  useEffect(() => {
    const loadFolderConversations = async () => {
      const newFolderConvs = {}
      for (const folder of folders) {
        try {
          const response = await fetch(`http://localhost:3000/api/folders/${folder.id}/conversations`)
          if (response.ok) {
            const convs = await response.json()
            newFolderConvs[folder.id] = convs
          }
        } catch (error) {
          console.error(`Error loading conversations for folder ${folder.id}:`, error)
        }
      }
      setFolderConversations(newFolderConvs)
    }

    if (folders.length > 0) {
      loadFolderConversations()
    }
  }, [folders])

  const handleCreateFolder = async (parentId = null) => {
    if (!newFolderName.trim()) return

    try {
      await createFolder(newFolderName, currentProject?.id || null, parentId)
      setNewFolderName('')
      setShowNewFolderInput(false)
      setNewFolderParent(null)
    } catch (error) {
      alert('Failed to create folder')
    }
  }

  const handleDeleteFolder = async (folderId, folderName) => {
    if (window.confirm(`Delete folder "${folderName}"?\n\nConversations in this folder will not be deleted.`)) {
      try {
        await deleteFolder(folderId)
        // Refresh folder conversations
        const projectId = currentProject ? currentProject.id : 'all'
        await loadConversations(projectId)
      } catch (error) {
        alert('Failed to delete folder')
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, folderId) => {
    e.preventDefault()
    e.stopPropagation()

    // Get conversation data from drag event
    const conversationData = e.dataTransfer.getData('conversation')
    if (!conversationData) return

    const conversation = JSON.parse(conversationData)

    try {
      await addConversationToFolder(folderId, conversation.id)
      // Reload folder conversations
      const response = await fetch(`http://localhost:3000/api/folders/${folderId}/conversations`)
      if (response.ok) {
        const convs = await response.json()
        setFolderConversations(prev => ({ ...prev, [folderId]: convs }))
      }
      // Reload main conversations list
      const projectId = currentProject ? currentProject.id : 'all'
      await loadConversations(projectId)
    } catch (error) {
      alert('Failed to add conversation to folder')
    }
  }

  const handleRemoveFromFolder = async (folderId, conversationId) => {
    try {
      await removeConversationFromFolder(folderId, conversationId)
      // Reload folder conversations
      const response = await fetch(`http://localhost:3000/api/folders/${folderId}/conversations`)
      if (response.ok) {
        const convs = await response.json()
        setFolderConversations(prev => ({ ...prev, [folderId]: convs }))
      }
    } catch (error) {
      alert('Failed to remove conversation from folder')
    }
  }

  // Get root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_folder_id)

  // Get child folders of a parent
  const getChildFolders = (parentId) => {
    return folders.filter(f => f.parent_folder_id === parentId)
  }

  // Render a folder and its contents recursively
  const renderFolder = (folder, level = 0) => {
    const isExpanded = isFolderExpanded(folder.id)
    const childFolders = getChildFolders(folder.id)
    const convs = folderConversations[folder.id] || []

    return (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
        {/* Folder header */}
        <div
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group transition-all duration-150"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, folder.id)}
          onDragEnter={(e) => e.currentTarget.classList.add('drop-zone-active')}
          onDragLeave={(e) => e.currentTarget.classList.remove('drop-zone-active')}
        >
          <button
            onClick={() => toggleFolderExpanded(folder.id)}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>

          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
            {folder.name}
          </span>

          {/* Folder actions */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setNewFolderParent(folder.id)
                setShowNewFolderInput(true)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add subfolder"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteFolder(folder.id, folder.name)
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
              title="Delete folder"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Folder contents (when expanded) */}
        {isExpanded && (
          <div>
            {/* Conversations in this folder */}
            {convs.map(conv => (
              <div
                key={conv.id}
                onClick={() => onConversationClick(conv.id)}
                className="flex items-center gap-2 px-2 py-1.5 ml-6 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer group text-sm"
              >
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFromFolder(folder.id, conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                  title="Remove from folder"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Child folders */}
            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-4">
      {/* Folders section header */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Folders
        </span>
        <button
          onClick={() => {
            setNewFolderParent(null)
            setShowNewFolderInput(true)
          }}
          className="text-xs px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-claude-orange"
          title="New folder"
        >
          + New
        </button>
      </div>

      {/* New folder input */}
      {showNewFolderInput && (
        <div className="px-4 mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={newFolderParent ? "Subfolder name..." : "Folder name..."}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-claude-dark-bg focus:ring-1 focus:ring-claude-orange"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder(newFolderParent)
                } else if (e.key === 'Escape') {
                  setShowNewFolderInput(false)
                  setNewFolderName('')
                  setNewFolderParent(null)
                }
              }}
            />
            <button
              onClick={() => handleCreateFolder(newFolderParent)}
              className="px-2 py-1 bg-claude-orange text-white rounded text-xs hover:bg-opacity-90"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowNewFolderInput(false)
                setNewFolderName('')
                setNewFolderParent(null)
              }}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render folder tree */}
      <div className="px-2">
        {rootFolders.map(folder => renderFolder(folder))}
      </div>

    </div>
  )
}

export default FolderTree
