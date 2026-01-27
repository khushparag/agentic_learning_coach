/**
 * Content Service - Handles LLM-generated learning content
 * 
 * This service provides methods to fetch AI-generated educational content
 * for learning tasks, including explanations, code examples, and practice suggestions.
 */

import api from './api'

// Types for content generation
export interface GenerateContentRequest {
  topic: string
  task_title: string
  task_type: 'reading' | 'exercise' | 'project' | 'quiz' | 'video'
  skill_level?: 'beginner' | 'intermediate' | 'advanced'
  technology?: string
  requirements?: string[]
}

export interface GenerateContentResponse {
  content: string
  summary: string
  key_concepts: string[]
  code_examples: Array<{
    language: string
    code: string
  }>
  practice_suggestions: string[]
  generated: boolean
}

export interface ExplainConceptRequest {
  concept: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced'
  context?: string
}

export interface ExplainConceptResponse {
  explanation: string
  examples: string[]
  related_concepts: string[]
}

// Cache for generated content to avoid repeated API calls
const contentCache = new Map<string, { content: GenerateContentResponse; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getCacheKey(request: GenerateContentRequest): string {
  return `${request.task_title}-${request.topic}-${request.task_type}-${request.skill_level || 'intermediate'}`
}

function getCachedContent(key: string): GenerateContentResponse | null {
  const cached = contentCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.content
  }
  contentCache.delete(key)
  return null
}

function setCachedContent(key: string, content: GenerateContentResponse): void {
  contentCache.set(key, { content, timestamp: Date.now() })
}

/**
 * Generate learning content for a task using LLM
 */
export async function generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
  const cacheKey = getCacheKey(request)
  
  // Check cache first
  const cached = getCachedContent(cacheKey)
  if (cached) {
    return cached
  }
  
  try {
    const response = await api.post<GenerateContentResponse>('/api/v1/content/generate', {
      topic: request.topic,
      task_title: request.task_title,
      task_type: request.task_type,
      skill_level: request.skill_level || 'intermediate',
      technology: request.technology,
      requirements: request.requirements || []
    })
    
    // Cache the response
    setCachedContent(cacheKey, response.data)
    
    return response.data
  } catch (error) {
    console.error('Failed to generate content:', error)
    // Return fallback content
    return generateFallbackContent(request)
  }
}

/**
 * Explain a programming concept using LLM
 */
export async function explainConcept(request: ExplainConceptRequest): Promise<ExplainConceptResponse> {
  try {
    const response = await api.post<ExplainConceptResponse>('/api/v1/content/explain', {
      concept: request.concept,
      skill_level: request.skill_level || 'intermediate',
      context: request.context
    })
    
    return response.data
  } catch (error) {
    console.error('Failed to explain concept:', error)
    // Return fallback explanation
    return {
      explanation: `${request.concept} is an important programming concept. Please refer to the provided resources for detailed information.`,
      examples: ['See the documentation for examples'],
      related_concepts: ['Related topics can be found in the learning path']
    }
  }
}

/**
 * Generate fallback content when API is unavailable
 */
function generateFallbackContent(request: GenerateContentRequest): GenerateContentResponse {
  const techContext = request.technology ? ` in ${request.technology}` : ''
  const topicDisplay = (request.topic && request.topic.trim()) ? request.topic : request.task_title || 'this concept'
  
  let content = `# ${request.task_title}\n\n`
  content += `## Introduction\n\n`
  content += `This lesson covers **${topicDisplay}**${techContext}. Understanding this concept is essential for your development journey.\n\n`
  content += `## Key Concepts\n\n`
  
  if (request.requirements && request.requirements.length > 0) {
    request.requirements.forEach((req, index) => {
      content += `### ${index + 1}. ${req}\n\n`
      content += `This concept involves understanding ${req.toLowerCase()}. Take time to explore this topic through the provided resources and practice exercises.\n\n`
    })
  } else {
    content += `The main focus of this lesson is to help you understand ${request.topic} and how to apply it in real-world scenarios.\n\n`
  }
  
  content += `## Practice Tips\n\n`
  content += `- Start with the basics and build up gradually\n`
  content += `- Try to implement what you learn in small projects\n`
  content += `- Don't hesitate to revisit concepts if needed\n`
  content += `- Practice regularly to reinforce your understanding\n\n`
  
  content += `## Summary\n\n`
  content += `Take your time with this material. Understanding these concepts well will help you become a more effective developer.\n`
  
  return {
    content,
    summary: `Learn about ${request.topic}${techContext}`,
    key_concepts: request.requirements?.slice(0, 5) || [request.topic],
    code_examples: [],
    practice_suggestions: [
      'Review the provided resources',
      'Try implementing a small example',
      'Practice with variations of the concept'
    ],
    generated: false
  }
}

// Export the service object for consistency with other services
export const contentService = {
  generateContent,
  explainConcept
}

export default contentService
