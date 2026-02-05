import express from 'express'
import { prepare } from '../database.js'

const router = express.Router()

// Get artifacts for a conversation
router.get('/conversations/:id/artifacts', async (req, res) => {
  try {
    const conversationId = req.params.id

    const artifacts = prepare(`
      SELECT * FROM artifacts
      WHERE conversation_id = ?
      ORDER BY created_at DESC
    `).all(conversationId)

    res.json(artifacts)
  } catch (error) {
    console.error('Error fetching artifacts:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a specific artifact
router.get('/artifacts/:id', async (req, res) => {
  try {
    const artifactId = req.params.id

    const artifact = prepare(`
      SELECT * FROM artifacts WHERE id = ?
    `).get(artifactId)

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' })
    }

    res.json(artifact)
  } catch (error) {
    console.error('Error fetching artifact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update artifact
router.put('/artifacts/:id', async (req, res) => {
  try {
    const artifactId = req.params.id
    const { content, title } = req.body

    // Get current artifact to save to version history
    const currentArtifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId)

    if (!currentArtifact) {
      return res.status(404).json({ error: 'Artifact not found' })
    }

    // Save current version to history before updating
    prepare(`
      INSERT INTO artifact_versions (artifact_id, version, content, title, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      currentArtifact.id,
      currentArtifact.version,
      currentArtifact.content,
      currentArtifact.title,
      currentArtifact.updated_at
    )

    // Update artifact with new content and increment version
    prepare(`
      UPDATE artifacts
      SET content = ?,
          title = ?,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
      WHERE id = ?
    `).run(content, title, artifactId)

    const artifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId)
    res.json(artifact)
  } catch (error) {
    console.error('Error updating artifact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete artifact
router.delete('/artifacts/:id', async (req, res) => {
  try {
    const artifactId = req.params.id

    prepare('DELETE FROM artifacts WHERE id = ?').run(artifactId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting artifact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get artifact version history
router.get('/artifacts/:id/versions', async (req, res) => {
  try {
    const artifactId = req.params.id

    // Get current artifact
    const currentArtifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId)

    if (!currentArtifact) {
      return res.status(404).json({ error: 'Artifact not found' })
    }

    // Get all historical versions
    const versions = prepare(`
      SELECT * FROM artifact_versions
      WHERE artifact_id = ?
      ORDER BY version DESC
    `).all(artifactId)

    // Include current version at the top
    const allVersions = [
      {
        id: currentArtifact.id,
        artifact_id: currentArtifact.id,
        version: currentArtifact.version,
        content: currentArtifact.content,
        title: currentArtifact.title,
        created_at: currentArtifact.updated_at,
        is_current: true
      },
      ...versions.map(v => ({ ...v, is_current: false }))
    ]

    res.json(allVersions)
  } catch (error) {
    console.error('Error fetching artifact versions:', error)
    res.status(500).json({ error: error.message })
  }
})

// Revert artifact to a previous version
router.post('/artifacts/:id/revert', async (req, res) => {
  try {
    const artifactId = req.params.id
    const { version } = req.body

    if (!version) {
      return res.status(400).json({ error: 'Version number required' })
    }

    // Get the version to revert to
    const versionData = prepare(`
      SELECT * FROM artifact_versions
      WHERE artifact_id = ? AND version = ?
    `).get(artifactId, version)

    if (!versionData) {
      return res.status(404).json({ error: 'Version not found' })
    }

    // Get current artifact to save to history
    const currentArtifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId)

    // Save current version to history before reverting
    prepare(`
      INSERT INTO artifact_versions (artifact_id, version, content, title, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      currentArtifact.id,
      currentArtifact.version,
      currentArtifact.content,
      currentArtifact.title,
      currentArtifact.updated_at
    )

    // Update artifact with reverted content and increment version
    prepare(`
      UPDATE artifacts
      SET content = ?,
          title = ?,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
      WHERE id = ?
    `).run(versionData.content, versionData.title, artifactId)

    const artifact = prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId)
    res.json(artifact)
  } catch (error) {
    console.error('Error reverting artifact:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
