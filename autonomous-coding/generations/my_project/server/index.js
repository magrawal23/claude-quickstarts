import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './database.js'
import authRouter from './routes/auth.js'
import conversationsRouter from './routes/conversations.js'
import messagesRouter from './routes/messages.js'
import artifactsRouter from './routes/artifacts.js'
import projectsRouter from './routes/projects.js'
import foldersRouter from './routes/folders.js'
import shareRouter from './routes/share.js'
import promptsRouter from './routes/prompts.js'
import usageRouter from './routes/usage.js'
import searchRouter from './routes/search.js'
import knowledgeBaseRouter from './routes/knowledge-base.js'
import templatesRouter from './routes/templates.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/conversations', conversationsRouter)
app.use('/api', messagesRouter)
app.use('/api', artifactsRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/folders', foldersRouter)
app.use('/api', shareRouter)
app.use('/api', promptsRouter)
app.use('/api/usage', usageRouter)
app.use('/api/search', searchRouter)
app.use('/api/knowledge-base', knowledgeBaseRouter)
app.use('/api/templates', templatesRouter)

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// Initialize database and start server
async function startServer() {
  await initializeDatabase()

  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
  })
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
