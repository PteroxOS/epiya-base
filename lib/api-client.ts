// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1'
const ENABLE_LOGGING = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true'
const REQUEST_TIMEOUT = 30000 // 30 seconds

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  model: string
  conversationId: string
  history: ChatMessage[]
  stream?: boolean
}

export interface ChatResponse {
  success: boolean
  response: string
  conversationId: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  duration?: number
}

export interface ModelInfo {
  id: string
  name: string
  description: string
  recommended?: boolean
}

export interface ModelsResponse {
  models: ModelInfo[]
  default: string
}

class APIClient {
  private baseURL: string
  private version: string

  constructor() {
    this.baseURL = API_BASE_URL
    this.version = API_VERSION
  }

  private getURL(endpoint: string): string {
    return `${this.baseURL}/api/${this.version}${endpoint}`
  }

  private log(message: string, data?: any) {
    if (ENABLE_LOGGING) {
      console.log(`[API Client] ${message}`, data || '')
    }
  }

  private logError(message: string, error?: any) {
    console.error(`[API Client Error] ${message}`, error || '')
  }

  /**
   * Get default headers for requests
   */
  private getHeaders(isStream: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'EPIYA-AI-Frontend/1.0',
    }

    if (isStream) {
      headers['Accept'] = 'text/event-stream'
    }

    return headers
  }

  /**
   * Create fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = REQUEST_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond')
      }
      throw error
    }
  }

  /**
   * Send chat message (streaming)
   */
  async sendMessageStream(request: ChatRequest): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    this.log('Sending streaming chat request', { 
      conversationId: request.conversationId, 
      model: request.model,
      messageLength: request.message.length 
    })

    try {
      const url = this.getURL('/chat')
      this.log('Request URL', url)

      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ ...request, stream: true }),
          keepalive: true,
        },
        60000 // 60 seconds timeout for streaming
      )

      this.log('Response received', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If can't parse JSON, use text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch {
            // Keep default error message
          }
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('Response body is null - streaming not supported')
      }

      this.log('Stream started successfully')
      return response.body.getReader()
    } catch (error) {
      this.logError('Stream request failed', error)
      
      // Enhanced error messages
      if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to backend server. Please ensure the backend is running on ' + this.baseURL)
        }
      }
      
      throw error
    }
  }

  /**
   * Send chat message (non-streaming)
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    this.log('Sending non-streaming chat request', { 
      conversationId: request.conversationId, 
      model: request.model 
    })

    try {
      const response = await this.fetchWithTimeout(
        this.getURL('/chat'),
        {
          method: 'POST',
          headers: this.getHeaders(false),
          body: JSON.stringify({ ...request, stream: false }),
        }
      )

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // Keep default error message
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      this.log('Response received', { conversationId: data.conversationId })
      return data
    } catch (error) {
      this.logError('Request failed', error)
      throw error
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<ModelsResponse> {
    this.log('Fetching available models')

    try {
      const response = await this.fetchWithTimeout(
        this.getURL('/chat/models'),
        {
          method: 'GET',
          headers: this.getHeaders(false),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      this.log('Models fetched', { count: data.models?.length })
      return data
    } catch (error) {
      this.logError('Failed to fetch models', error)
      throw error
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        this.getURL('/health'),
        {
          method: 'GET',
          headers: this.getHeaders(false),
        },
        5000 // 5 seconds timeout for health check
      )
      return response.ok
    } catch (error) {
      this.logError('Health check failed', error)
      return false
    }
  }

  /**
   * Test backend connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.log('Testing backend connection...')
      
      const response = await this.fetchWithTimeout(
        this.getURL('/health'),
        {
          method: 'GET',
          headers: this.getHeaders(false),
        },
        5000
      )

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: 'Backend connection successful',
          details: data
        }
      } else {
        return {
          success: false,
          message: `Backend responded with ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    }
  }
}

export const apiClient = new APIClient()