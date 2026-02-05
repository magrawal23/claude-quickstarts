import express from 'express'
import { prepare, saveDatabase } from '../database.js'
import crypto from 'crypto'

const router = express.Router()

// In-memory token store (for demo purposes - in production use Redis or database)
const activeSessions = new Map()

// Helper function to generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Helper function to hash API keys (not passwords - this is for demo)
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

// POST /api/auth/login
// Simple login endpoint that creates a session token
router.post('/login', (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      })
    }

    // Find or create user
    let user = prepare('SELECT * FROM users WHERE email = ?').get(email)

    if (!user) {
      // Create new user for demo purposes
      const result = prepare(`
        INSERT INTO users (email, name, created_at, last_login)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(email, email.split('@')[0])

      user = prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    } else {
      // Update last login
      prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)
      saveDatabase()
    }

    // Generate session token
    const token = generateToken()

    // Store session
    activeSessions.set(token, {
      userId: user.id,
      email: user.email,
      createdAt: Date.now()
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_login: user.last_login
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    })
  }
})

// GET /api/auth/me
// Get current user info from token
router.get('/me', (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer '

    // Verify token exists
    const session = activeSessions.get(token)

    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      })
    }

    // Get user from database
    const user = prepare('SELECT * FROM users WHERE id = ?').get(session.userId)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_login: user.last_login,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        custom_instructions: user.custom_instructions
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user info',
      message: error.message
    })
  }
})

// POST /api/auth/logout
// Invalidate session token
router.post('/logout', (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required'
      })
    }

    const token = authHeader.substring(7)

    // Check if token exists
    if (!activeSessions.has(token)) {
      return res.status(401).json({
        error: 'Invalid token'
      })
    }

    // Remove token from active sessions
    activeSessions.delete(token)

    res.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    })
  }
})

// PUT /api/auth/profile
// Update user profile
router.put('/profile', (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required'
      })
    }

    const token = authHeader.substring(7)
    const session = activeSessions.get(token)

    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      })
    }

    const { name, avatar_url, preferences, custom_instructions } = req.body

    // Build update query dynamically based on provided fields
    const updates = []
    const params = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?')
      params.push(avatar_url)
    }
    if (preferences !== undefined) {
      updates.push('preferences = ?')
      params.push(JSON.stringify(preferences))
    }
    if (custom_instructions !== undefined) {
      updates.push('custom_instructions = ?')
      params.push(custom_instructions)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      })
    }

    // Add user_id to params
    params.push(session.userId)

    // Update user
    prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params)

    // Get updated user
    const user = prepare('SELECT * FROM users WHERE id = ?').get(session.userId)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_login: user.last_login,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        custom_instructions: user.custom_instructions
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    })
  }
})

// Helper function to verify token (can be used as middleware)
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization token required'
    })
  }

  const token = authHeader.substring(7)
  const session = activeSessions.get(token)

  if (!session) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    })
  }

  // Attach user info to request
  req.userId = session.userId
  req.userEmail = session.email

  next()
}

export default router
