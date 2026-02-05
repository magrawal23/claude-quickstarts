import { createContext, useContext, useState, useEffect } from 'react'

const ProjectContext = createContext()

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  // Create new project
  const createProject = async (projectData) => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const newProject = await response.json()
        setProjects(prev => [newProject, ...prev])
        setCurrentProject(newProject)
        return newProject
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update project
  const updateProject = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedProject = await response.json()
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
        if (currentProject?.id === id) {
          setCurrentProject(updatedProject)
        }
        return updatedProject
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  // Delete project
  const deleteProject = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== id))
        if (currentProject?.id === id) {
          setCurrentProject(null)
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // Load projects on mount
  useEffect(() => {
    fetchProjects()
  }, [])

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    loading,
    refreshProjects: fetchProjects
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
