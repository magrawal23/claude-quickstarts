import express from 'express'
import { getDatabase, prepare, saveDatabase } from '../database.js'

const router = express.Router()

// Get all projects
router.get('/', (req, res) => {
  try {
    const projects = prepare(`
      SELECT * FROM projects
      WHERE is_archived = 0
      ORDER BY is_pinned DESC, created_at DESC
    `).all()

    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single project
router.get('/:id', (req, res) => {
  try {
    const project = prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(req.params.id)

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new project
router.post('/', (req, res) => {
  try {
    const {
      name,
      description = '',
      color = '#CC785C',
      custom_instructions = ''
    } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const result = prepare(`
      INSERT INTO projects (name, description, color, custom_instructions, user_id)
      VALUES (?, ?, ?, ?, 1)
    `).run(name.trim(), description, color, custom_instructions)

    // Get the newly created project
    const project = prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update project
router.put('/:id', (req, res) => {
  try {
    const { name, description, color, custom_instructions, is_pinned, is_archived } = req.body

    const updates = []
    const values = []

    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Project name cannot be empty' })
      }
      updates.push('name = ?')
      values.push(name.trim())
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (color !== undefined) {
      updates.push('color = ?')
      values.push(color)
    }
    if (custom_instructions !== undefined) {
      updates.push('custom_instructions = ?')
      values.push(custom_instructions)
    }
    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?')
      values.push(is_pinned ? 1 : 0)
    }
    if (is_archived !== undefined) {
      updates.push('is_archived = ?')
      values.push(is_archived ? 1 : 0)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(req.params.id)

    prepare(`
      UPDATE projects SET ${updates.join(', ')} WHERE id = ?
    `).run(...values)

    const project = prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(req.params.id)

    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete project (soft delete)
router.delete('/:id', (req, res) => {
  try {
    prepare(`
      UPDATE projects SET is_archived = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)

    res.json({ success: true, message: 'Project archived' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get project conversations
router.get('/:id/conversations', (req, res) => {
  try {
    const conversations = prepare(`
      SELECT * FROM conversations
      WHERE project_id = ? AND is_deleted = 0
      ORDER BY updated_at DESC
    `).all(req.params.id)

    res.json(conversations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get project analytics/statistics
router.get('/:id/analytics', (req, res) => {
  try {
    const projectId = req.params.id

    // Get basic project stats
    const stats = prepare(`
      SELECT
        COUNT(DISTINCT c.id) as conversation_count,
        COUNT(DISTINCT m.id) as message_count,
        COALESCE(SUM(c.token_count), 0) as total_tokens,
        COALESCE(SUM(m.tokens), 0) as message_tokens
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.project_id = ? AND c.is_deleted = 0
    `).get(projectId)

    // Get model usage breakdown
    const modelBreakdown = prepare(`
      SELECT
        model,
        COUNT(*) as conversation_count,
        COALESCE(SUM(token_count), 0) as tokens
      FROM conversations
      WHERE project_id = ? AND is_deleted = 0
      GROUP BY model
    `).all(projectId)

    // Get daily usage for the last 30 days
    const dailyUsage = prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as message_count,
        COALESCE(SUM(tokens), 0) as tokens
      FROM messages
      WHERE conversation_id IN (
        SELECT id FROM conversations WHERE project_id = ? AND is_deleted = 0
      )
      AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(projectId)

    // Calculate cost estimates (rough approximation)
    // Claude Sonnet 4.5: $3 per million input tokens, $15 per million output tokens
    // Using average assumption: 60% input, 40% output
    const totalTokens = stats.total_tokens + stats.message_tokens
    const inputTokens = totalTokens * 0.6
    const outputTokens = totalTokens * 0.4
    const estimatedCost = (inputTokens / 1000000 * 3) + (outputTokens / 1000000 * 15)

    res.json({
      conversation_count: stats.conversation_count || 0,
      message_count: stats.message_count || 0,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost.toFixed(2),
      model_breakdown: modelBreakdown,
      daily_usage: dailyUsage
    })
  } catch (error) {
    console.error('Error fetching project analytics:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
