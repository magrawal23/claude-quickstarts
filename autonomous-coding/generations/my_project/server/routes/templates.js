import express from 'express'
import { getDatabase, prepare, saveDatabase } from '../database.js'

const router = express.Router()

// Get all templates
router.get('/', (req, res) => {
  try {
    const templates = prepare(`
      SELECT * FROM project_templates
      ORDER BY created_at DESC
    `).all()

    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single template
router.get('/:id', (req, res) => {
  try {
    const template = prepare(`
      SELECT * FROM project_templates WHERE id = ?
    `).get(req.params.id)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create template from project
router.post('/', (req, res) => {
  try {
    const {
      project_id,
      name,
      description = ''
    } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Template name is required' })
    }

    // If project_id is provided, copy settings from that project
    if (project_id) {
      const project = prepare(`
        SELECT * FROM projects WHERE id = ?
      `).get(project_id)

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const result = prepare(`
        INSERT INTO project_templates (
          name, description, color, custom_instructions, settings, user_id
        )
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(
        name.trim(),
        description || project.description || '',
        project.color || '#CC785C',
        project.custom_instructions || '',
        JSON.stringify({ /* future: model preferences, etc */ })
      )

      const template = prepare(`
        SELECT * FROM project_templates WHERE id = ?
      `).get(result.lastInsertRowid)

      saveDatabase()
      res.status(201).json(template)
    } else {
      // Create blank template
      const result = prepare(`
        INSERT INTO project_templates (
          name, description, color, custom_instructions, settings, user_id
        )
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(
        name.trim(),
        description,
        '#CC785C',
        '',
        JSON.stringify({})
      )

      const template = prepare(`
        SELECT * FROM project_templates WHERE id = ?
      `).get(result.lastInsertRowid)

      saveDatabase()
      res.status(201).json(template)
    }
  } catch (error) {
    console.error('Error creating template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create project from template
router.post('/:id/create-project', (req, res) => {
  try {
    const { name } = req.body
    const templateId = req.params.id

    const template = prepare(`
      SELECT * FROM project_templates WHERE id = ?
    `).get(templateId)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Create new project from template
    const result = prepare(`
      INSERT INTO projects (
        name, description, color, custom_instructions, user_id
      )
      VALUES (?, ?, ?, ?, 1)
    `).run(
      name || template.name,
      template.description || '',
      template.color || '#CC785C',
      template.custom_instructions || ''
    )

    const project = prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(result.lastInsertRowid)

    saveDatabase()
    res.status(201).json(project)
  } catch (error) {
    console.error('Error creating project from template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update template
router.put('/:id', (req, res) => {
  try {
    const { name, description, color, custom_instructions, settings } = req.body

    const updates = []
    const values = []

    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Template name cannot be empty' })
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
    if (settings !== undefined) {
      updates.push('settings = ?')
      values.push(typeof settings === 'string' ? settings : JSON.stringify(settings))
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(req.params.id)

    prepare(`
      UPDATE project_templates SET ${updates.join(', ')} WHERE id = ?
    `).run(...values)

    const template = prepare(`
      SELECT * FROM project_templates WHERE id = ?
    `).get(req.params.id)

    saveDatabase()
    res.json(template)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete template
router.delete('/:id', (req, res) => {
  try {
    prepare(`
      DELETE FROM project_templates WHERE id = ?
    `).run(req.params.id)

    saveDatabase()
    res.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
