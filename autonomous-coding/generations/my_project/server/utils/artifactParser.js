/**
 * Parse artifacts from Claude response content
 * Claude uses <antthinking> tags and <antArtifact> tags to denote artifacts
 *
 * Example artifact format:
 * <antArtifact identifier="unique-id" type="application/vnd.ant.code" language="python" title="Example Script">
 * def hello():
 *     print("Hello")
 * </antArtifact>
 */

export function parseArtifacts(content) {
  const artifacts = []

  // Regex to match artifact tags
  // Supports both antArtifact and older artifact tag formats
  const artifactRegex = /<antArtifact\s+([^>]+)>([\s\S]*?)<\/antArtifact>/gi

  let match
  while ((match = artifactRegex.exec(content)) !== null) {
    const attributes = match[1]
    const artifactContent = match[2].trim()

    // Parse attributes
    const identifierMatch = /identifier=["']([^"']+)["']/.exec(attributes)
    const typeMatch = /type=["']([^"']+)["']/.exec(attributes)
    const languageMatch = /language=["']([^"']+)["']/.exec(attributes)
    const titleMatch = /title=["']([^"']+)["']/.exec(attributes)

    const identifier = identifierMatch ? identifierMatch[1] : null
    const typeAttr = typeMatch ? typeMatch[1] : null
    const language = languageMatch ? languageMatch[1] : null
    const title = titleMatch ? titleMatch[1] : null

    // Map Claude's type to our artifact types
    let artifactType = 'code' // default
    if (typeAttr) {
      if (typeAttr.includes('code')) {
        artifactType = 'code'
      } else if (typeAttr.includes('html')) {
        artifactType = 'html'
      } else if (typeAttr.includes('svg')) {
        artifactType = 'svg'
      } else if (typeAttr.includes('react')) {
        artifactType = 'react'
      } else if (typeAttr.includes('mermaid')) {
        artifactType = 'mermaid'
      } else if (typeAttr.includes('text')) {
        artifactType = 'text'
      }
    }

    // Also check content for SVG or HTML
    if (artifactContent.trim().startsWith('<svg')) {
      artifactType = 'svg'
    } else if (artifactContent.trim().startsWith('<!DOCTYPE html') ||
               artifactContent.trim().startsWith('<html')) {
      artifactType = 'html'
    } else if (artifactContent.includes('graph ') ||
               artifactContent.includes('flowchart ') ||
               artifactContent.includes('sequenceDiagram')) {
      artifactType = 'mermaid'
    }

    artifacts.push({
      identifier,
      type: artifactType,
      language,
      title: title || 'Untitled Artifact',
      content: artifactContent
    })
  }

  return artifacts
}

/**
 * Check if content contains any artifacts
 */
export function hasArtifacts(content) {
  return /<antArtifact\s+[^>]+>[\s\S]*?<\/antArtifact>/i.test(content)
}
