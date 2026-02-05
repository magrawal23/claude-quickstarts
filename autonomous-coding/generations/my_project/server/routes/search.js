import express from 'express'
import { getDatabase } from '../database.js'

const router = express.Router()

/**
 * GET /api/search/conversations
 * Search conversations by title or content
 * Query params:
 *   - q: search query string (required)
 *   - limit: max results (optional, default 20)
 */
router.get('/conversations', (req, res) => {
  try {
    const { q, limit = 20 } = req.query

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const db = getDatabase()
    const searchTerm = `%${q.trim()}%`

    // Search conversations by title
    // Also search in message content and join to get relevant conversations
    const query = `
      SELECT DISTINCT
        c.id,
        c.title,
        c.model,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        c.is_archived,
        c.is_pinned,
        c.message_count,
        c.token_count,
        c.project_id,
        p.name as project_name,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as total_messages
      FROM conversations c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.is_deleted = 0
        AND (
          c.title LIKE ? COLLATE NOCASE
          OR m.content LIKE ? COLLATE NOCASE
        )
      ORDER BY c.updated_at DESC
      LIMIT ?
    `

    const stmt = db.prepare(query)
    stmt.bind([searchTerm, searchTerm, parseInt(limit)])

    const results = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push(row)
    }
    stmt.free()

    res.json({
      results,
      count: results.length,
      query: q
    })
  } catch (error) {
    console.error('Search conversations error:', error)
    res.status(500).json({ error: 'Failed to search conversations' })
  }
})

/**
 * GET /api/search/messages
 * Search messages by content
 * Query params:
 *   - q: search query string (required)
 *   - limit: max results (optional, default 50)
 *   - conversation_id: filter by conversation (optional)
 */
router.get('/messages', (req, res) => {
  try {
    const { q, limit = 50, conversation_id } = req.query

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const db = getDatabase()
    const searchTerm = `%${q.trim()}%`

    let query = `
      SELECT
        m.id,
        m.conversation_id,
        m.role,
        m.content,
        m.created_at,
        m.tokens,
        c.title as conversation_title,
        c.project_id,
        p.name as project_name
      FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.is_deleted = 0
        AND m.content LIKE ? COLLATE NOCASE
    `

    const params = [searchTerm]

    // Optional: filter by specific conversation
    if (conversation_id) {
      query += ` AND m.conversation_id = ?`
      params.push(parseInt(conversation_id))
    }

    query += `
      ORDER BY m.created_at DESC
      LIMIT ?
    `
    params.push(parseInt(limit))

    const stmt = db.prepare(query)
    stmt.bind(params)

    const results = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push(row)
    }
    stmt.free()

    res.json({
      results,
      count: results.length,
      query: q
    })
  } catch (error) {
    console.error('Search messages error:', error)
    res.status(500).json({ error: 'Failed to search messages' })
  }
})

/**
 * GET /api/search/all
 * Search across conversations, messages, and artifacts
 * Query params:
 *   - q: search query string (required)
 */
router.get('/all', (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const db = getDatabase()
    const searchTerm = `%${q.trim()}%`

    // Search conversations
    const conversationsQuery = `
      SELECT
        'conversation' as type,
        id,
        title as name,
        created_at,
        updated_at
      FROM conversations
      WHERE is_deleted = 0
        AND title LIKE ? COLLATE NOCASE
      ORDER BY updated_at DESC
      LIMIT 10
    `

    const conversationsStmt = db.prepare(conversationsQuery)
    conversationsStmt.bind([searchTerm])
    const conversations = []
    while (conversationsStmt.step()) {
      conversations.push(conversationsStmt.getAsObject())
    }
    conversationsStmt.free()

    // Search messages
    const messagesQuery = `
      SELECT
        'message' as type,
        m.id,
        m.content,
        m.conversation_id,
        c.title as conversation_title,
        m.created_at
      FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE c.is_deleted = 0
        AND m.content LIKE ? COLLATE NOCASE
      ORDER BY m.created_at DESC
      LIMIT 20
    `

    const messagesStmt = db.prepare(messagesQuery)
    messagesStmt.bind([searchTerm])
    const messages = []
    while (messagesStmt.step()) {
      messages.push(messagesStmt.getAsObject())
    }
    messagesStmt.free()

    // Search artifacts
    const artifactsQuery = `
      SELECT
        'artifact' as type,
        a.id,
        a.title as name,
        a.type as artifact_type,
        a.conversation_id,
        c.title as conversation_title,
        a.created_at
      FROM artifacts a
      INNER JOIN conversations c ON a.conversation_id = c.id
      WHERE c.is_deleted = 0
        AND (a.title LIKE ? COLLATE NOCASE OR a.content LIKE ? COLLATE NOCASE)
      ORDER BY a.created_at DESC
      LIMIT 10
    `

    const artifactsStmt = db.prepare(artifactsQuery)
    artifactsStmt.bind([searchTerm, searchTerm])
    const artifacts = []
    while (artifactsStmt.step()) {
      artifacts.push(artifactsStmt.getAsObject())
    }
    artifactsStmt.free()

    res.json({
      query: q,
      conversations: {
        count: conversations.length,
        results: conversations
      },
      messages: {
        count: messages.length,
        results: messages
      },
      artifacts: {
        count: artifacts.length,
        results: artifacts
      }
    })
  } catch (error) {
    console.error('Search all error:', error)
    res.status(500).json({ error: 'Failed to search' })
  }
})

export default router
