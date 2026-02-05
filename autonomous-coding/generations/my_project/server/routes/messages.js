import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getDatabase, prepare, saveDatabase } from '../database.js'
import { parseArtifacts, hasArtifacts } from '../utils/artifactParser.js'
import { calculateCost } from '../utils/pricing.js'
import fs from 'fs'

const router = express.Router()

// Initialize Anthropic client
let anthropic
try {
  // Try to read API key from /tmp/api-key
  const apiKey = fs.readFileSync('/tmp/api-key', 'utf-8').trim()
  anthropic = new Anthropic({ apiKey })
} catch (error) {
  // Fall back to environment variable
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
  })
}

// Send message and get response
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, images, customInstructions, temperature, maxTokens, topP } = req.body
    const conversationId = req.params.id

    // Get conversation to check model
    const conversation = prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Get project custom instructions and knowledge base if conversation belongs to a project
    let projectCustomInstructions = ''
    let projectKnowledgeBase = ''
    if (conversation.project_id) {
      const project = prepare('SELECT custom_instructions FROM projects WHERE id = ?').get(conversation.project_id)
      if (project && project.custom_instructions) {
        projectCustomInstructions = project.custom_instructions
      }

      // Get knowledge base documents for this project
      const documents = prepare(`
        SELECT filename, original_name, content
        FROM knowledge_base_documents
        WHERE project_id = ?
        ORDER BY created_at ASC
      `).all(conversation.project_id)

      if (documents.length > 0) {
        projectKnowledgeBase = '\n\nProject Knowledge Base:\n\n'
        documents.forEach(doc => {
          projectKnowledgeBase += `[${doc.original_name}]\n${doc.content}\n\n---\n\n`
        })
      }
    }

    // Save user message
    const userMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, images)
      VALUES (?, 'user', ?, ?)
    `).run(conversationId, content, images ? JSON.stringify(images) : null)

    const userMessage = prepare('SELECT * FROM messages WHERE id = ?').get(userMessageResult.lastInsertRowid)

    // Get conversation history
    const messages = prepare(`
      SELECT role, content, images FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Build system prompt with optional custom instructions
    let systemPrompt = `You are a helpful AI assistant.`

    // Check if conversation has custom system prompt override
    let conversationSettings = null
    try {
      if (conversation.settings) {
        conversationSettings = JSON.parse(conversation.settings)
      }
    } catch (e) {
      console.error('Error parsing conversation settings:', e)
    }

    // If conversation has a custom system prompt, use it exclusively
    if (conversationSettings && conversationSettings.systemPrompt && conversationSettings.systemPrompt.trim()) {
      systemPrompt = conversationSettings.systemPrompt.trim()
    } else {
      // Otherwise, use global and project custom instructions
      // Add global custom instructions if they exist
      if (customInstructions && customInstructions.enabled) {
        if (customInstructions.aboutYou && customInstructions.aboutYou.trim()) {
          systemPrompt += `\n\nAbout the user:\n${customInstructions.aboutYou.trim()}`
        }
        if (customInstructions.howToRespond && customInstructions.howToRespond.trim()) {
          systemPrompt += `\n\nHow to respond:\n${customInstructions.howToRespond.trim()}`
        }
      }

      // Add project custom instructions if they exist
      if (projectCustomInstructions) {
        systemPrompt += `\n\nProject Custom Instructions:\n${projectCustomInstructions}`
      }

      // Note: Project knowledge base integration would go here if needed
    }

    systemPrompt += `\n\nWhen creating substantial, self-contained content like code files, HTML pages, SVG diagrams, or documents, wrap them in artifact tags using this format:

<antArtifact identifier="unique-id" type="application/vnd.ant.code" language="python" title="Descriptive Title">
[content here]
</antArtifact>

Use artifacts for:
- Complete code files or substantial code snippets (>15 lines)
- HTML pages or web components
- SVG diagrams or visualizations
- React components
- Mermaid diagrams
- Substantial text documents

Types:
- application/vnd.ant.code - for code in any language
- text/html - for HTML content
- image/svg+xml - for SVG graphics
- application/vnd.ant.react - for React components
- application/vnd.ant.mermaid - for Mermaid diagrams
- text/markdown - for markdown documents

Always include: identifier (unique), type, language (for code), and title.
For brief explanations, inline code, or short snippets, respond normally without artifacts.`

    // Build API messages with image support
    const apiMessages = messages.map(m => {
      // If the message has images, format as multi-part content
      if (m.images) {
        try {
          const parsedImages = typeof m.images === 'string' ? JSON.parse(m.images) : m.images
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const content = []

            // Add images first
            for (const img of parsedImages) {
              // Extract base64 data from data URL
              const matches = img.data.match(/^data:([^;]+);base64,(.+)$/)
              if (matches) {
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                  }
                })
              }
            }

            // Add text content if present
            if (m.content && m.content.trim()) {
              content.push({
                type: 'text',
                text: m.content
              })
            }

            return {
              role: m.role,
              content: content
            }
          }
        } catch (e) {
          console.error('Error parsing images:', e)
        }
      }

      // Regular text-only message
      return {
        role: m.role,
        content: m.content
      }
    })

    // Build API params - Claude API doesn't allow both temperature and top_p
    const apiParams = {
      model: conversation.model || 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens || 4096,
      system: systemPrompt,
      messages: apiMessages
    }

    // Only include temperature OR top_p, not both
    // Priority: if topP is explicitly different from default, use it; otherwise use temperature
    if (topP !== undefined && topP !== 0.9) {
      apiParams.top_p = topP
    } else if (temperature !== undefined) {
      apiParams.temperature = temperature
    } else {
      // Default to temperature if neither is specified
      apiParams.temperature = 0.7
    }

    // Call Claude API with artifact support
    const response = await anthropic.messages.create(apiParams)

    // Save assistant message
    const assistantContent = response.content[0].text
    const assistantMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, tokens, finish_reason)
      VALUES (?, 'assistant', ?, ?, ?)
    `).run(
      conversationId,
      assistantContent,
      response.usage?.output_tokens || 0,
      response.stop_reason || 'end_turn'
    )

    const assistantMessage = prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageResult.lastInsertRowid)

    // Update conversation
    prepare(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP,
          last_message_at = CURRENT_TIMESTAMP,
          message_count = message_count + 2,
          token_count = token_count + ?
      WHERE id = ?
    `).run((response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0), conversationId)

    // Track usage with cost estimate
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0
    const costEstimate = calculateCost(conversation.model, inputTokens, outputTokens)

    prepare(`
      INSERT INTO usage_tracking (conversation_id, message_id, model, input_tokens, output_tokens, cost_estimate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      conversationId,
      assistantMessageResult.lastInsertRowid,
      conversation.model,
      inputTokens,
      outputTokens,
      costEstimate
    )

    // Return both messages
    res.json({
      userMessage,
      assistantMessage,
      usage: response.usage
    })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stream message response using SSE
router.post('/conversations/:id/messages/stream', async (req, res) => {
  try {
    const { content, images, customInstructions, temperature, maxTokens, topP, thinkingMode } = req.body
    const conversationId = req.params.id

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Get conversation to check model
    const conversation = prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
    if (!conversation) {
      res.write(`data: ${JSON.stringify({ error: 'Conversation not found' })}\n\n`)
      res.end()
      return
    }

    // Get project custom instructions if conversation belongs to a project
    let projectCustomInstructions = ''
    if (conversation.project_id) {
      const project = prepare('SELECT custom_instructions FROM projects WHERE id = ?').get(conversation.project_id)
      if (project && project.custom_instructions) {
        projectCustomInstructions = project.custom_instructions
      }
    }

    // Save user message
    const userMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, images)
      VALUES (?, 'user', ?, ?)
    `).run(conversationId, content, images ? JSON.stringify(images) : null)

    const userMessage = prepare('SELECT * FROM messages WHERE id = ?').get(userMessageResult.lastInsertRowid)

    // Send user message event
    res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`)

    // Get conversation history
    const messages = prepare(`
      SELECT role, content, images FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId)

    // Build system prompt with optional custom instructions
    let systemPrompt = `You are a helpful AI assistant.`

    // Check if conversation has custom system prompt override
    let conversationSettings = null
    try {
      if (conversation.settings) {
        conversationSettings = JSON.parse(conversation.settings)
      }
    } catch (e) {
      console.error('Error parsing conversation settings:', e)
    }

    // If conversation has a custom system prompt, use it exclusively
    if (conversationSettings && conversationSettings.systemPrompt && conversationSettings.systemPrompt.trim()) {
      systemPrompt = conversationSettings.systemPrompt.trim()
    } else {
      // Otherwise, use global and project custom instructions
      // Add global custom instructions if they exist
      if (customInstructions && customInstructions.enabled) {
        if (customInstructions.aboutYou && customInstructions.aboutYou.trim()) {
          systemPrompt += `\n\nAbout the user:\n${customInstructions.aboutYou.trim()}`
        }
        if (customInstructions.howToRespond && customInstructions.howToRespond.trim()) {
          systemPrompt += `\n\nHow to respond:\n${customInstructions.howToRespond.trim()}`
        }
      }

      // Add project custom instructions if they exist
      if (projectCustomInstructions) {
        systemPrompt += `\n\nProject Custom Instructions:\n${projectCustomInstructions}`
      }

      // Note: Project knowledge base integration would go here if needed
    }

    systemPrompt += `\n\nWhen creating substantial, self-contained content like code files, HTML pages, SVG diagrams, or documents, wrap them in artifact tags using this format:

<antArtifact identifier="unique-id" type="application/vnd.ant.code" language="python" title="Descriptive Title">
[content here]
</antArtifact>

Use artifacts for:
- Complete code files or substantial code snippets (>15 lines)
- HTML pages or web components
- SVG diagrams or visualizations
- React components
- Mermaid diagrams
- Substantial text documents

Types:
- application/vnd.ant.code - for code in any language
- text/html - for HTML content
- image/svg+xml - for SVG graphics
- application/vnd.ant.react - for React components
- application/vnd.ant.mermaid - for Mermaid diagrams
- text/markdown - for markdown documents

Always include: identifier (unique), type, language (for code), and title.
For brief explanations, inline code, or short snippets, respond normally without artifacts.`

    // Stream Claude API response
    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0

    // Build API messages with image support
    const apiMessages = messages.map(m => {
      // If the message has images, format as multi-part content
      if (m.images) {
        try {
          const parsedImages = typeof m.images === 'string' ? JSON.parse(m.images) : m.images
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const content = []

            // Add images first
            for (const img of parsedImages) {
              // Extract base64 data from data URL
              const matches = img.data.match(/^data:([^;]+);base64,(.+)$/)
              if (matches) {
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                  }
                })
              }
            }

            // Add text content if present
            if (m.content && m.content.trim()) {
              content.push({
                type: 'text',
                text: m.content
              })
            }

            return {
              role: m.role,
              content: content
            }
          }
        } catch (e) {
          console.error('Error parsing images:', e)
        }
      }

      // Regular text-only message
      return {
        role: m.role,
        content: m.content
      }
    })

    // Build API params - Claude API doesn't allow both temperature and top_p
    const streamParams = {
      model: conversation.model || 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens || 4096,
      system: systemPrompt,
      messages: apiMessages
    }

    // Enable thinking mode if requested (must be set before temperature/top_p)
    if (thinkingMode) {
      streamParams.thinking = {
        type: "enabled",
        budget_tokens: 5000  // Reduced to fit within max_tokens
      }
      // When thinking is enabled, temperature must be 1
      streamParams.temperature = 1
      // Ensure max_tokens is greater than thinking budget
      if (streamParams.max_tokens <= 5000) {
        streamParams.max_tokens = 8000
      }
    } else {
      // Only include temperature OR top_p, not both (when thinking is disabled)
      // Priority: if topP is explicitly different from default, use it; otherwise use temperature
      if (topP !== undefined && topP !== 0.9) {
        streamParams.top_p = topP
      } else if (temperature !== undefined) {
        streamParams.temperature = temperature
      } else {
        // Default to temperature if neither is specified
        streamParams.temperature = 0.7
      }
    }

    const stream = await anthropic.messages.stream(streamParams)

    let thinkingContent = ''
    let textContent = ''

    // Handle stream events
    stream.on('text', (textDelta) => {
      fullContent += textDelta
      textContent += textDelta
      res.write(`data: ${JSON.stringify({ type: 'content_delta', delta: textDelta })}\n\n`)
    })

    // Handle thinking blocks if they exist
    stream.on('contentBlock', (block) => {
      if (block.type === 'thinking') {
        thinkingContent = block.thinking || ''
        res.write(`data: ${JSON.stringify({ type: 'thinking_block', thinking: thinkingContent })}\n\n`)
      }
    })

    stream.on('message', (message) => {
      inputTokens = message.usage?.input_tokens || 0
      outputTokens = message.usage?.output_tokens || 0
    })

    // Wait for stream to complete
    await stream.finalMessage()

    // If thinking mode was enabled and we have thinking content, prepend it with a marker
    let finalContent = fullContent
    if (thinkingMode && thinkingContent) {
      finalContent = `<thinking>\n${thinkingContent}\n</thinking>\n\n${fullContent}`
    }

    // Save assistant message
    const assistantMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, tokens, finish_reason)
      VALUES (?, 'assistant', ?, ?, ?)
    `).run(
      conversationId,
      finalContent,
      outputTokens,
      'end_turn'
    )

    const assistantMessage = prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageResult.lastInsertRowid)

    // Parse and save artifacts if present
    let detectedArtifacts = []
    if (hasArtifacts(fullContent)) {
      const artifacts = parseArtifacts(fullContent)
      for (const artifact of artifacts) {
        const artifactResult = prepare(`
          INSERT INTO artifacts (message_id, conversation_id, type, title, identifier, language, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          assistantMessageResult.lastInsertRowid,
          conversationId,
          artifact.type,
          artifact.title,
          artifact.identifier,
          artifact.language,
          artifact.content
        )

        const savedArtifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactResult.lastInsertRowid)
        detectedArtifacts.push(savedArtifact)
      }
    }

    // Check if we should auto-generate title (before updating message count)
    const shouldGenerateTitle = conversation.message_count === 0 && conversation.title === 'New Conversation'

    // Update conversation
    prepare(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP,
          last_message_at = CURRENT_TIMESTAMP,
          message_count = message_count + 2,
          token_count = token_count + ?
      WHERE id = ?
    `).run(inputTokens + outputTokens, conversationId)

    // Track usage with cost estimate
    const costEstimate = calculateCost(conversation.model, inputTokens, outputTokens)

    prepare(`
      INSERT INTO usage_tracking (conversation_id, message_id, model, input_tokens, output_tokens, cost_estimate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      conversationId,
      assistantMessageResult.lastInsertRowid,
      conversation.model,
      inputTokens,
      outputTokens,
      costEstimate
    )

    // Auto-generate title if this is the first message
    if (shouldGenerateTitle) {
      try {
        const titleResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Generate a concise 3-5 word title for a conversation that starts with this message: "${content}"\n\nRespond with ONLY the title, nothing else.`
          }]
        })

        const generatedTitle = titleResponse.content[0].text.trim().replace(/^["']|["']$/g, '')

        prepare(`
          UPDATE conversations
          SET title = ?
          WHERE id = ?
        `).run(generatedTitle, conversationId)

        // Get updated conversation for the completion event
        const updatedConversation = prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)

        // Send title update event
        res.write(`data: ${JSON.stringify({
          type: 'title_updated',
          conversation: updatedConversation
        })}\n\n`)
      } catch (titleError) {
        console.error('Error generating title:', titleError)
        // Continue even if title generation fails
      }
    }

    // Generate suggested follow-up prompts
    let suggestedPrompts = []
    try {
      const promptResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Based on this conversation exchange:
User: "${content}"
Assistant: "${fullContent.substring(0, 500)}..."

Generate 2-3 brief follow-up questions the user might ask. Format as a JSON array of strings, each question should be 5-10 words max. Example: ["Can you explain more about X?", "How would I implement Y?"]

Respond with ONLY the JSON array, nothing else.`
        }]
      })

      const promptsText = promptResponse.content[0].text.trim()
      // Try to parse the JSON response
      try {
        const parsedPrompts = JSON.parse(promptsText)
        if (Array.isArray(parsedPrompts) && parsedPrompts.length > 0) {
          suggestedPrompts = parsedPrompts.slice(0, 3) // Limit to 3 suggestions
        }
      } catch (parseError) {
        console.log('Could not parse suggested prompts JSON:', promptsText)
        // If parsing fails, try to extract suggestions manually
        const matches = promptsText.match(/"([^"]+)"/g)
        if (matches && matches.length > 0) {
          suggestedPrompts = matches.slice(0, 3).map(m => m.replace(/"/g, ''))
        }
      }
    } catch (promptError) {
      console.error('Error generating suggested prompts:', promptError)
      // Continue even if prompt generation fails
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'message_complete',
      message: assistantMessage,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      artifacts: detectedArtifacts,
      suggestedPrompts: suggestedPrompts
    })}\n\n`)

    res.end()
  } catch (error) {
    console.error('Error streaming message:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    res.end()
  }
})

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id

    const messages = prepare(`
      SELECT
        m.*,
        u.input_tokens,
        u.output_tokens
      FROM messages m
      LEFT JOIN usage_tracking u ON u.message_id = m.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(conversationId)

    res.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: error.message })
  }
})

// Edit a message and regenerate conversation from that point
router.put('/messages/:id', async (req, res) => {
  try {
    const messageId = req.params.id
    const { content } = req.body

    // Get the message to verify it exists and is a user message
    const message = prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.role !== 'user') {
      return res.status(400).json({ error: 'Can only edit user messages' })
    }

    // Update the message content
    prepare(`
      UPDATE messages
      SET content = ?, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, messageId)

    // Get the updated message
    const updatedMessage = prepare('SELECT * FROM messages WHERE id = ?').get(messageId)

    // Delete all messages after this one in the conversation (regeneration)
    prepare(`
      DELETE FROM messages
      WHERE conversation_id = ?
      AND id > ?
    `).run(message.conversation_id, messageId)

    // Delete artifacts associated with deleted messages
    prepare(`
      DELETE FROM artifacts
      WHERE conversation_id = ?
      AND message_id > ?
    `).run(message.conversation_id, messageId)

    // Get conversation to check model
    const conversation = prepare('SELECT * FROM conversations WHERE id = ?').get(message.conversation_id)

    // Get project custom instructions if conversation belongs to a project
    let projectCustomInstructions = ''
    if (conversation.project_id) {
      const project = prepare('SELECT custom_instructions FROM projects WHERE id = ?').get(conversation.project_id)
      if (project && project.custom_instructions) {
        projectCustomInstructions = project.custom_instructions
      }
    }

    // Get conversation history up to and including the edited message
    const messages = prepare(`
      SELECT role, content, images FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(message.conversation_id)

    // Build system prompt with optional project custom instructions
    let systemPrompt = `You are a helpful AI assistant.`

    // Add project custom instructions if they exist
    if (projectCustomInstructions) {
      systemPrompt += `\n\nProject Custom Instructions:\n${projectCustomInstructions}`
    }

    systemPrompt += `\n\nWhen creating substantial, self-contained content like code files, HTML pages, SVG diagrams, or documents, wrap them in artifact tags using this format:

<antArtifact identifier="unique-id" type="application/vnd.ant.code" language="python" title="Descriptive Title">
[content here]
</antArtifact>

Use artifacts for:
- Complete code files or substantial code snippets (>15 lines)
- HTML pages or web components
- SVG diagrams or visualizations
- React components
- Mermaid diagrams
- Substantial text documents

Types:
- application/vnd.ant.code - for code in any language
- text/html - for HTML content
- image/svg+xml - for SVG graphics
- application/vnd.ant.react - for React components
- application/vnd.ant.mermaid - for Mermaid diagrams
- text/markdown - for markdown documents

Always include: identifier (unique), type, language (for code), and title.
For brief explanations, inline code, or short snippets, respond normally without artifacts.`

    // Build API messages with image support
    const apiMessagesEdit = messages.map(m => {
      // If the message has images, format as multi-part content
      if (m.images) {
        try {
          const parsedImages = typeof m.images === 'string' ? JSON.parse(m.images) : m.images
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const content = []

            // Add images first
            for (const img of parsedImages) {
              // Extract base64 data from data URL
              const matches = img.data.match(/^data:([^;]+);base64,(.+)$/)
              if (matches) {
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                  }
                })
              }
            }

            // Add text content if present
            if (m.content && m.content.trim()) {
              content.push({
                type: 'text',
                text: m.content
              })
            }

            return {
              role: m.role,
              content: content
            }
          }
        } catch (e) {
          console.error('Error parsing images:', e)
        }
      }

      // Regular text-only message
      return {
        role: m.role,
        content: m.content
      }
    })

    // Call Claude API to regenerate response
    const response = await anthropic.messages.create({
      model: conversation.model || 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessagesEdit
    })

    // Save new assistant message
    const assistantContent = response.content[0].text
    const assistantMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, tokens, finish_reason)
      VALUES (?, 'assistant', ?, ?, ?)
    `).run(
      message.conversation_id,
      assistantContent,
      response.usage?.output_tokens || 0,
      response.stop_reason || 'end_turn'
    )

    const assistantMessage = prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageResult.lastInsertRowid)

    // Parse and save artifacts if present
    if (hasArtifacts(assistantContent)) {
      const artifacts = parseArtifacts(assistantContent)
      for (const artifact of artifacts) {
        prepare(`
          INSERT INTO artifacts (message_id, conversation_id, type, title, identifier, language, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          assistantMessageResult.lastInsertRowid,
          message.conversation_id,
          artifact.type,
          artifact.title,
          artifact.identifier,
          artifact.language,
          artifact.content
        )
      }
    }

    // Update conversation
    prepare(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP,
          last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(message.conversation_id)

    // Track usage with cost estimate
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0
    const costEstimate = calculateCost(conversation.model, inputTokens, outputTokens)

    prepare(`
      INSERT INTO usage_tracking (conversation_id, message_id, model, input_tokens, output_tokens, cost_estimate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      message.conversation_id,
      assistantMessageResult.lastInsertRowid,
      conversation.model,
      inputTokens,
      outputTokens,
      costEstimate
    )

    res.json({
      message: updatedMessage,
      newAssistantMessage: assistantMessage,
      regenerated: true
    })
  } catch (error) {
    console.error('Error editing message:', error)
    res.status(500).json({ error: error.message })
  }
})

// Regenerate assistant message
router.post('/messages/:id/regenerate', async (req, res) => {
  try {
    const { customInstructions, thinkingMode } = req.body
    const messageId = parseInt(req.params.id)

    // Get the message to regenerate
    const message = prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Only allow regenerating assistant messages
    if (message.role !== 'assistant') {
      return res.status(400).json({ error: 'Can only regenerate assistant messages' })
    }

    // Get conversation
    const conversation = prepare('SELECT * FROM conversations WHERE id = ?').get(message.conversation_id)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // Get project custom instructions if conversation belongs to a project
    let projectCustomInstructions = ''
    if (conversation.project_id) {
      const project = prepare('SELECT custom_instructions FROM projects WHERE id = ?').get(conversation.project_id)
      if (project && project.custom_instructions) {
        projectCustomInstructions = project.custom_instructions
      }
    }

    // Get all messages up to (but not including) the message to regenerate
    const conversationHistory = prepare(`
      SELECT role, content, images
      FROM messages
      WHERE conversation_id = ? AND id < ?
      ORDER BY created_at ASC
    `).all(message.conversation_id, messageId)

    // Build messages for Claude API with image support
    const apiMessages = conversationHistory.map(m => {
      // If the message has images, format as multi-part content
      if (m.images) {
        try {
          const parsedImages = typeof m.images === 'string' ? JSON.parse(m.images) : m.images
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const content = []

            // Add images first
            for (const img of parsedImages) {
              // Extract base64 data from data URL
              const matches = img.data.match(/^data:([^;]+);base64,(.+)$/)
              if (matches) {
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                  }
                })
              }
            }

            // Add text content if present
            if (m.content && m.content.trim()) {
              content.push({
                type: 'text',
                text: m.content
              })
            }

            return {
              role: m.role,
              content: content
            }
          }
        } catch (e) {
          console.error('Error parsing images:', e)
        }
      }

      // Regular text-only message
      return {
        role: m.role,
        content: m.content
      }
    })

    // Build system prompt with optional custom instructions
    let systemPrompt = 'You are Claude, a helpful AI assistant.'

    // Add global custom instructions if they exist
    if (customInstructions && customInstructions.enabled) {
      if (customInstructions.aboutYou && customInstructions.aboutYou.trim()) {
        systemPrompt += `\n\nAbout the user:\n${customInstructions.aboutYou.trim()}`
      }
      if (customInstructions.howToRespond && customInstructions.howToRespond.trim()) {
        systemPrompt += `\n\nHow to respond:\n${customInstructions.howToRespond.trim()}`
      }
    }

    // Add project custom instructions if available
    if (projectCustomInstructions) {
      systemPrompt = `${systemPrompt}\n\nProject Instructions:\n${projectCustomInstructions}`
    }

    // Build API params
    const apiParams = {
      model: conversation.model || 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: systemPrompt,
      messages: apiMessages
    }

    // Enable thinking mode if requested
    if (thinkingMode) {
      apiParams.thinking = {
        type: "enabled",
        budget_tokens: 5000  // Reduced to fit within max_tokens
      }
      // When thinking is enabled, temperature must be 1
      apiParams.temperature = 1
      // Ensure max_tokens is greater than thinking budget
      if (apiParams.max_tokens <= 5000) {
        apiParams.max_tokens = 8000
      }
    }

    // Call Claude API to regenerate response
    const response = await anthropic.messages.create(apiParams)

    // Extract text content and thinking blocks
    let assistantContent = ''
    let thinkingContent = ''

    // Process content blocks
    for (const block of response.content) {
      if (block.type === 'text') {
        assistantContent += block.text
      } else if (block.type === 'thinking') {
        thinkingContent = block.thinking || ''
      }
    }

    // If thinking mode was enabled and we have thinking content, prepend it with a marker
    if (thinkingMode && thinkingContent) {
      assistantContent = `<thinking>\n${thinkingContent}\n</thinking>\n\n${assistantContent}`
    }

    // Check if this message already has a variation_group_id
    // If not, create one and update the original message
    let variationGroupId = message.variation_group_id
    if (!variationGroupId) {
      // Use the original message ID as the variation group ID
      variationGroupId = messageId
      prepare('UPDATE messages SET variation_group_id = ?, variation_index = 0 WHERE id = ?').run(variationGroupId, messageId)
    }

    // Find the highest variation index in this group
    const maxVariation = prepare(`
      SELECT MAX(variation_index) as max_index
      FROM messages
      WHERE variation_group_id = ?
    `).get(variationGroupId)

    const nextVariationIndex = (maxVariation?.max_index ?? 0) + 1

    // Save new assistant message as a variation
    const assistantMessageResult = prepare(`
      INSERT INTO messages (conversation_id, role, content, tokens, finish_reason, created_at, variation_group_id, variation_index, parent_message_id)
      VALUES (?, 'assistant', ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(
      message.conversation_id,
      assistantContent,
      response.usage?.output_tokens || 0,
      response.stop_reason || 'end_turn',
      variationGroupId,
      nextVariationIndex,
      message.parent_message_id
    )

    const newAssistantMessage = prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageResult.lastInsertRowid)

    // Parse and save artifacts if any
    if (hasArtifacts(assistantContent)) {
      const artifacts = parseArtifacts(assistantContent)

      for (const artifact of artifacts) {
        prepare(`
          INSERT INTO artifacts (message_id, conversation_id, type, title, identifier, language, content, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          newAssistantMessage.id,
          message.conversation_id,
          artifact.type,
          artifact.title,
          artifact.identifier,
          artifact.language,
          artifact.content
        )
      }
    }

    // Update conversation timestamp
    prepare(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(message.conversation_id)

    // Track token usage with cost estimate
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0
    const model = conversation.model || 'claude-sonnet-4-5-20250929'
    const costEstimate = calculateCost(model, inputTokens, outputTokens)

    prepare(`
      INSERT INTO usage_tracking (conversation_id, message_id, model, input_tokens, output_tokens, cost_estimate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      message.conversation_id,
      newAssistantMessage.id,
      model,
      inputTokens,
      outputTokens,
      costEstimate
    )

    saveDatabase()

    // Get all variations in this group
    const variations = prepare(`
      SELECT id, variation_index, created_at
      FROM messages
      WHERE variation_group_id = ?
      ORDER BY variation_index ASC
    `).all(variationGroupId)

    res.json({
      message: newAssistantMessage,
      regenerated: true,
      variationGroupId,
      variations,
      currentVariation: nextVariationIndex,
      totalVariations: variations.length
    })
  } catch (error) {
    console.error('Error regenerating message:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all variations for a message
router.get('/messages/:id/variations', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id)

    // Get the message
    const message = prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Get the variation group ID (use message ID if not set)
    const variationGroupId = message.variation_group_id || messageId

    // Get all variations in this group
    const variations = prepare(`
      SELECT *
      FROM messages
      WHERE variation_group_id = ?
      ORDER BY variation_index ASC
    `).all(variationGroupId)

    res.json({
      variations,
      currentVariation: message.variation_index || 0,
      totalVariations: variations.length
    })
  } catch (error) {
    console.error('Error getting message variations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a specific variation
router.get('/messages/:id/variations/:index', async (req, res) => {
  try {
    const messageId = parseInt(req.params.id)
    const variationIndex = parseInt(req.params.index)

    // Get the base message to find variation group
    const message = prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    const variationGroupId = message.variation_group_id || messageId

    // Get the specific variation
    const variation = prepare(`
      SELECT *
      FROM messages
      WHERE variation_group_id = ? AND variation_index = ?
    `).get(variationGroupId, variationIndex)

    if (!variation) {
      return res.status(404).json({ error: 'Variation not found' })
    }

    res.json(variation)
  } catch (error) {
    console.error('Error getting message variation:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
