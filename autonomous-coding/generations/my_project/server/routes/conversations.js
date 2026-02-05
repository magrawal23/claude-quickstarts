import express from 'express'
import { getDatabase, prepare, saveDatabase } from '../database.js'
import PDFDocument from 'pdfkit'

const router = express.Router()

// Get all conversations
router.get('/', (req, res) => {
  try {
    const { project_id, search, limit = '50', offset = '0' } = req.query

    // Parse pagination parameters
    const limitNum = parseInt(limit, 10)
    const offsetNum = parseInt(offset, 10)

    // Validate pagination parameters
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit parameter (1-100)' })
    }
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ error: 'Invalid offset parameter' })
    }

    let query
    let countQuery
    const params = []
    const countParams = []

    // If search is provided, search in both title and message content
    if (search && search.trim()) {
      // Get conversations with matching content and include a preview snippet
      query = `
        SELECT DISTINCT
          c.*,
          (
            SELECT m.content
            FROM messages m
            WHERE m.conversation_id = c.id
            AND m.content LIKE ?
            ORDER BY m.created_at ASC
            LIMIT 1
          ) as match_preview
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.is_deleted = 0
        AND (
          c.title LIKE ? OR m.content LIKE ?
        )
      `
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)

      // Count query for pagination metadata
      countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.is_deleted = 0
        AND (
          c.title LIKE ? OR m.content LIKE ?
        )
      `
      countParams.push(searchTerm, searchTerm)

      // Filter by project_id if provided
      if (project_id !== undefined && project_id !== null && project_id !== '') {
        if (project_id !== 'all') {
          query += ` AND c.project_id = ?`
          params.push(project_id)
          countQuery += ` AND c.project_id = ?`
          countParams.push(project_id)
        }
      }
    } else {
      // No search, just list conversations
      query = `
        SELECT * FROM conversations
        WHERE is_deleted = 0
      `

      countQuery = `
        SELECT COUNT(*) as total
        FROM conversations
        WHERE is_deleted = 0
      `

      // Filter by project_id if provided
      if (project_id !== undefined && project_id !== null && project_id !== '') {
        if (project_id !== 'all') {
          query += ` AND project_id = ?`
          params.push(project_id)
          countQuery += ` AND project_id = ?`
          countParams.push(project_id)
        }
      }
    }

    query += ` ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    params.push(limitNum, offsetNum)

    // Get total count for pagination metadata
    const countResult = prepare(countQuery).get(...countParams)
    const total = countResult.total

    // Get paginated conversations
    const conversations = prepare(query).all(...params)

    // Return with pagination metadata
    res.json({
      data: conversations,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single conversation
router.get('/:id', (req, res) => {
  try {
        const conversation = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(req.params.id)

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    res.json(conversation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new conversation
router.post('/', (req, res) => {
  try {
    const { title = 'New Conversation', model = 'claude-sonnet-4-5-20250929', project_id } = req.body

    const result = prepare(`
      INSERT INTO conversations (title, model, project_id, user_id)
      VALUES (?, ?, ?, 1)
    `).run(title, model, project_id || null)

    console.log('Insert result:', result)

    // Get the newly created conversation
    const conversation = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(result.lastInsertRowid)

    console.log('Retrieved conversation:', conversation)

    if (!conversation) {
      // Fallback: get the most recent conversation
      const latestConversation = prepare(`
        SELECT * FROM conversations ORDER BY id DESC LIMIT 1
      `).get()
      return res.status(201).json(latestConversation)
    }

    res.status(201).json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update conversation
router.put('/:id', (req, res) => {
  try {
    console.log('PUT /api/conversations/:id - Request body:', req.body)
        const { title, model, is_pinned, is_archived, project_id, settings } = req.body

    const updates = []
    const values = []

    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (model !== undefined) {
      updates.push('model = ?')
      values.push(model)
    }
    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?')
      values.push(is_pinned ? 1 : 0)
    }
    if (is_archived !== undefined) {
      updates.push('is_archived = ?')
      values.push(is_archived ? 1 : 0)
    }
    if (project_id !== undefined) {
      updates.push('project_id = ?')
      values.push(project_id)
    }
    if (settings !== undefined) {
      updates.push('settings = ?')
      values.push(settings)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(req.params.id)

    prepare(`
      UPDATE conversations SET ${updates.join(', ')} WHERE id = ?
    `).run(...values)

    const conversation = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(req.params.id)

    res.json(conversation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete conversation (soft delete)
router.delete('/:id', (req, res) => {
  try {
    
    prepare(`
      UPDATE conversations SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)

    res.json({ success: true, message: 'Conversation deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get conversation messages
router.get('/:id/messages', (req, res) => {
  try {
    const { limit = '50', offset = '0', order = 'desc' } = req.query

    // Parse pagination parameters
    const limitNum = parseInt(limit, 10)
    const offsetNum = parseInt(offset, 10)

    // Validate pagination parameters
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
      return res.status(400).json({ error: 'Invalid limit parameter (1-200)' })
    }
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ error: 'Invalid offset parameter' })
    }

    // Validate order parameter
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC'

    // Get total count of messages
    const countResult = prepare(`
      SELECT COUNT(*) as total
      FROM messages
      WHERE conversation_id = ?
    `).get(req.params.id)
    const total = countResult.total

    // Get paginated messages
    // When order is DESC, we get the most recent messages first
    // This is useful for initial load - show recent messages and load older on demand
    const messages = prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ${orderDirection}
      LIMIT ? OFFSET ?
    `).all(req.params.id, limitNum, offsetNum)

    // If order was DESC (most recent first), reverse the array so messages appear in chronological order
    // This way the UI shows old-to-new but we fetched new-to-old
    const orderedMessages = orderDirection === 'DESC' ? messages.reverse() : messages

    res.json({
      data: orderedMessages,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
        order: orderDirection.toLowerCase()
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Duplicate conversation
router.post('/:id/duplicate', (req, res) => {
  try {
    const conversationId = req.params.id

    // Get the original conversation
    const originalConv = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(conversationId)

    if (!originalConv) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Create a new conversation with the same properties
    const newTitle = `${originalConv.title} (Copy)`
    const result = prepare(`
      INSERT INTO conversations (
        title, model, project_id, user_id,
        is_pinned, is_archived, is_deleted,
        settings
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newTitle,
      originalConv.model,
      originalConv.project_id,
      originalConv.user_id,
      0, // Don't pin the duplicate
      0, // Don't archive the duplicate
      0, // Not deleted
      originalConv.settings
    )

    const newConversationId = result.lastInsertRowid

    // Get all messages from the original conversation
    const messages = prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Copy all messages to the new conversation
    const insertMessage = prepare(`
      INSERT INTO messages (
        conversation_id, role, content, tokens, finish_reason, images
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const msg of messages) {
      insertMessage.run(
        newConversationId,
        msg.role,
        msg.content,
        msg.tokens,
        msg.finish_reason,
        msg.images
      )
    }

    // Get all artifacts from the original conversation
    const artifacts = prepare(`
      SELECT * FROM artifacts
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Copy all artifacts to the new conversation
    const insertArtifact = prepare(`
      INSERT INTO artifacts (
        conversation_id, message_id, type, title,
        identifier, language, content, version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const artifact of artifacts) {
      insertArtifact.run(
        newConversationId,
        null, // Don't link to message_id since messages are new
        artifact.type,
        artifact.title,
        artifact.identifier,
        artifact.language,
        artifact.content,
        artifact.version
      )
    }

    // Get the newly created conversation
    const newConversation = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(newConversationId)

    res.status(201).json(newConversation)
  } catch (error) {
    console.error('Error duplicating conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Export conversation to JSON
router.post('/:id/export', (req, res) => {
  try {
    const conversationId = req.params.id
    const { format = 'json' } = req.body
    console.log('Export request - conversationId:', conversationId, 'format:', format, 'body:', req.body)

    // Get the conversation
    const conversation = prepare(`
      SELECT * FROM conversations WHERE id = ? AND is_deleted = 0
    `).get(conversationId)

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Get all messages
    const messages = prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Get all artifacts
    const artifacts = prepare(`
      SELECT * FROM artifacts
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Handle different export formats
    if (format === 'pdf') {
      // Generate PDF format
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      })

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversationId}.pdf"`)

      // Pipe the PDF to the response
      doc.pipe(res)

      // Add title
      doc.fontSize(24).font('Helvetica-Bold').text(conversation.title, { align: 'left' })
      doc.moveDown(0.5)

      // Add metadata
      doc.fontSize(10).font('Helvetica')
      doc.text(`Model: ${conversation.model}`)
      doc.text(`Created: ${new Date(conversation.created_at).toLocaleString()}`)
      doc.text(`Messages: ${conversation.message_count || messages.length}`)
      doc.moveDown(1)

      // Draw separator line
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke()
      doc.moveDown(1)

      // Add each message
      messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'You' : 'Claude'
        const timestamp = new Date(msg.created_at).toLocaleString()

        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage()
        }

        // Message role and timestamp
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#CC785C').text(role, { continued: false })
        doc.fontSize(9).font('Helvetica').fillColor('#666666').text(timestamp)
        doc.moveDown(0.3)

        // Message content
        doc.fontSize(11).font('Helvetica').fillColor('#000000')

        // Split content into lines to handle long text
        const contentLines = msg.content.split('\n')
        contentLines.forEach(line => {
          if (doc.y > 720) {
            doc.addPage()
          }
          doc.text(line, { align: 'left', width: 512 })
        })

        doc.moveDown(0.8)

        // Add separator between messages
        if (index < messages.length - 1) {
          if (doc.y > 730) {
            doc.addPage()
          }
          doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#CCCCCC').stroke()
          doc.moveDown(0.8)
        }
      })

      // Add artifacts section if any exist
      if (artifacts.length > 0) {
        if (doc.y > 680) {
          doc.addPage()
        }

        doc.moveDown(1)
        doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#000000').stroke()
        doc.moveDown(1)

        doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000').text('Artifacts')
        doc.moveDown(0.5)

        artifacts.forEach((artifact, index) => {
          if (doc.y > 700) {
            doc.addPage()
          }

          doc.fontSize(12).font('Helvetica-Bold').fillColor('#CC785C')
          doc.text(`${index + 1}. ${artifact.title || 'Untitled Artifact'}`)

          doc.fontSize(10).font('Helvetica').fillColor('#666666')
          doc.text(`Type: ${artifact.type}`)
          if (artifact.language) {
            doc.text(`Language: ${artifact.language}`)
          }
          doc.moveDown(0.3)

          // Add artifact content
          doc.fontSize(9).font('Courier').fillColor('#000000')
          const artifactLines = artifact.content.split('\n')
          artifactLines.forEach(line => {
            if (doc.y > 730) {
              doc.addPage()
            }
            doc.text(line, { width: 512 })
          })

          doc.moveDown(0.8)
        })
      }

      // Add footer with export metadata
      if (doc.y > 730) {
        doc.addPage()
      }
      doc.moveDown(1)
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#CCCCCC').stroke()
      doc.moveDown(0.5)
      doc.fontSize(9).font('Helvetica').fillColor('#666666')
      doc.text(`Exported on ${new Date().toLocaleString()}`, { align: 'center' })

      // Finalize the PDF
      doc.end()
    } else if (format === 'markdown') {
      // Generate Markdown format
      let markdown = `# ${conversation.title}\n\n`
      markdown += `**Model:** ${conversation.model}\n`
      markdown += `**Created:** ${new Date(conversation.created_at).toLocaleString()}\n`
      markdown += `**Messages:** ${conversation.message_count || messages.length}\n\n`
      markdown += `---\n\n`

      // Add each message
      messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Claude'
        const timestamp = new Date(msg.created_at).toLocaleString()

        markdown += `## ${role}\n`
        markdown += `*${timestamp}*\n\n`
        markdown += `${msg.content}\n\n`

        // Add separator between messages (except after last message)
        if (index < messages.length - 1) {
          markdown += `---\n\n`
        }
      })

      // Add artifacts section if any exist
      if (artifacts.length > 0) {
        markdown += `\n---\n\n# Artifacts\n\n`
        artifacts.forEach((artifact, index) => {
          markdown += `## ${index + 1}. ${artifact.title || 'Untitled Artifact'}\n`
          markdown += `**Type:** ${artifact.type}\n`
          if (artifact.language) {
            markdown += `**Language:** ${artifact.language}\n`
          }
          markdown += `\n\`\`\`${artifact.language || ''}\n${artifact.content}\n\`\`\`\n\n`
        })
      }

      // Add footer with export metadata
      markdown += `\n---\n\n`
      markdown += `*Exported on ${new Date().toLocaleString()}*\n`

      res.setHeader('Content-Type', 'text/markdown')
      res.send(markdown)
    } else {
      // JSON format (default)
      const exportData = {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          model: conversation.model,
          project_id: conversation.project_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          last_message_at: conversation.last_message_at,
          settings: conversation.settings ? JSON.parse(conversation.settings) : null,
          message_count: conversation.message_count,
          token_count: conversation.token_count
        },
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          tokens: msg.tokens,
          finish_reason: msg.finish_reason,
          created_at: msg.created_at,
          images: msg.images ? JSON.parse(msg.images) : null
        })),
        artifacts: artifacts.map(artifact => ({
          id: artifact.id,
          type: artifact.type,
          title: artifact.title,
          identifier: artifact.identifier,
          language: artifact.language,
          content: artifact.content,
          version: artifact.version,
          created_at: artifact.created_at
        })),
        metadata: {
          exported_at: new Date().toISOString(),
          format: 'json',
          version: '1.0'
        }
      }

      res.json(exportData)
    }
  } catch (error) {
    console.error('Error exporting conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Branch conversation from a specific message
router.post('/:id/branch', (req, res) => {
  try {
    const conversationId = req.params.id
    const { messageId, newBranchName } = req.body

    console.log('Branch request - conversationId:', conversationId, 'messageId:', messageId)

    // Get the original conversation
    const originalConv = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(conversationId)

    if (!originalConv) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Verify the message exists and belongs to this conversation
    const message = prepare(`
      SELECT * FROM messages WHERE id = ? AND conversation_id = ?
    `).get(messageId, conversationId)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Create a new conversation for the branch
    const branchTitle = newBranchName || `${originalConv.title} (Branch)`
    const result = prepare(`
      INSERT INTO conversations (
        title, model, project_id, user_id,
        is_pinned, is_archived, is_deleted,
        settings
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      branchTitle,
      originalConv.model,
      originalConv.project_id,
      originalConv.user_id,
      0,
      0,
      0,
      originalConv.settings
    )

    const newConversationId = result.lastInsertRowid

    // Get all messages up to and including the branching point
    const messages = prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ? AND id <= ?
      ORDER BY created_at ASC
    `).all(conversationId, messageId)

    // Copy messages to the new branch
    const insertMessage = prepare(`
      INSERT INTO messages (
        conversation_id, role, content, tokens, finish_reason, images, parent_message_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const oldToNewMessageIds = {}

    for (const msg of messages) {
      const newResult = insertMessage.run(
        newConversationId,
        msg.role,
        msg.content,
        msg.tokens,
        msg.finish_reason,
        msg.images,
        msg.parent_message_id ? oldToNewMessageIds[msg.parent_message_id] : null
      )
      oldToNewMessageIds[msg.id] = newResult.lastInsertRowid
    }

    // Copy artifacts for the branched messages
    const artifacts = prepare(`
      SELECT * FROM artifacts
      WHERE conversation_id = ? AND message_id <= ?
      ORDER BY created_at ASC
    `).all(conversationId, messageId)

    const insertArtifact = prepare(`
      INSERT INTO artifacts (
        conversation_id, message_id, type, title,
        identifier, language, content, version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const artifact of artifacts) {
      const newMessageId = oldToNewMessageIds[artifact.message_id]
      if (newMessageId) {
        insertArtifact.run(
          newConversationId,
          newMessageId,
          artifact.type,
          artifact.title,
          artifact.identifier,
          artifact.language,
          artifact.content,
          artifact.version
        )
      }
    }

    // Get the newly created conversation
    const newConversation = prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).get(newConversationId)

    res.status(201).json({
      success: true,
      branch: newConversation,
      branchId: newConversationId
    })
  } catch (error) {
    console.error('Error branching conversation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get conversation cost estimation with breakdown by message
router.get('/:id/cost', (req, res) => {
  try {
    const conversationId = req.params.id

    // Get conversation
    const conversation = prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Get cost breakdown by message
    const breakdown = prepare(`
      SELECT
        m.id as message_id,
        m.role,
        m.content,
        m.created_at,
        u.model,
        u.input_tokens,
        u.output_tokens,
        u.cost_estimate
      FROM messages m
      LEFT JOIN usage_tracking u ON u.message_id = m.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(conversationId)

    // Calculate total cost
    const totalCost = prepare(`
      SELECT
        SUM(cost_estimate) as total_cost,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens
      FROM usage_tracking
      WHERE conversation_id = ?
    `).get(conversationId)

    res.json({
      conversationId,
      title: conversation.title,
      model: conversation.model,
      messageCount: conversation.message_count,
      totalCost: totalCost.total_cost || 0,
      totalInputTokens: totalCost.total_input_tokens || 0,
      totalOutputTokens: totalCost.total_output_tokens || 0,
      breakdown: breakdown.map(msg => ({
        messageId: msg.message_id,
        role: msg.role,
        content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
        createdAt: msg.created_at,
        model: msg.model,
        inputTokens: msg.input_tokens || 0,
        outputTokens: msg.output_tokens || 0,
        cost: msg.cost_estimate || 0
      }))
    })
  } catch (error) {
    console.error('Error getting conversation cost:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
