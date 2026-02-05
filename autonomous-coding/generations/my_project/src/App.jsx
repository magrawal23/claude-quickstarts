import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConversationProvider } from './contexts/ConversationContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { FolderProvider } from './contexts/FolderContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { TourProvider } from './contexts/TourContext'
import CodeThemeLoader from './components/CodeThemeLoader'
import ChatPage from './pages/ChatPage'
import SharedConversationPage from './pages/SharedConversationPage'
import UsageDashboard from './pages/UsageDashboard'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <TourProvider>
          <CodeThemeLoader />
          <ProjectProvider>
            <FolderProvider>
              <ConversationProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<ChatPage />} />
                    <Route path="/conversation/:id" element={<ChatPage />} />
                    <Route path="/shared/:token" element={<SharedConversationPage />} />
                    <Route path="/usage" element={<UsageDashboard />} />
                  </Routes>
                </Router>
              </ConversationProvider>
            </FolderProvider>
          </ProjectProvider>
        </TourProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App
