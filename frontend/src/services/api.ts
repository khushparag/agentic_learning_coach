import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { performanceMonitor } from '../utils/performance'
import { apiCache } from '../utils/caching'

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

class ApiService {
  private client: AxiosInstance
  private requestInterceptorId: number | null = null
  private responseInterceptorId: number | null = null

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for performance tracking and auth
    this.requestInterceptorId = this.client.interceptors.request.use(
      (config) => {
        // Add performance tracking
        config.metadata = { startTime: performance.now() }
        
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers!.Authorization = `Bearer ${token}`
        }

        // For development/demo purposes, add a consistent user ID if no auth token
        if (!token && !config.headers!['X-User-ID']) {
          let demoUserId = sessionStorage.getItem('demo_user_id')
          
          // Validate that the existing ID is a proper UUID, regenerate if not
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!demoUserId || !uuidRegex.test(demoUserId)) {
            // Generate a proper UUID v4 for compatibility with backend
            demoUserId = crypto.randomUUID()
            sessionStorage.setItem('demo_user_id', demoUserId)
          }
          config.headers!['X-User-ID'] = demoUserId
        }

        // Add request ID for tracking
        config.headers!['X-Request-ID'] = this.generateRequestId()

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for performance tracking and error handling
    this.responseInterceptorId = this.client.interceptors.response.use(
      (response) => {
        // Track API call performance
        const duration = performance.now() - (response.config.metadata?.startTime || 0)
        const endpoint = this.getEndpointName(response.config.url || '')
        
        performanceMonitor.trackApiCall(endpoint, duration, true)

        return response
      },
      (error) => {
        // Track failed API calls
        if (error.config?.metadata?.startTime) {
          const duration = performance.now() - error.config.metadata.startTime
          const endpoint = this.getEndpointName(error.config.url || '')
          
          performanceMonitor.trackApiCall(endpoint, duration, false)
        }

        // Enhanced error handling
        if (error.response) {
          const { status, data } = error.response
          
          switch (status) {
            case 401:
              localStorage.removeItem('auth_token')
              sessionStorage.removeItem('demo_user_id')
              
              if (!window.location.pathname.includes('/onboarding') && 
                  !window.location.pathname.includes('/login')) {
                window.location.href = '/onboarding'
              }
              break
              
            case 403:
              console.error('Access forbidden:', data)
              break
              
            case 404:
              console.warn('Resource not found:', error.config?.url)
              break
              
            case 429:
              console.warn('Rate limit exceeded, please slow down')
              break
              
            case 422:
              console.error('Validation error:', data)
              break
              
            case 500:
            case 502:
            case 503:
            case 504:
              console.error('Server error:', status, data)
              break
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private getEndpointName(url: string): string {
    // Extract endpoint name from URL for metrics
    return url.replace(/\/\d+/g, '/:id').replace(/\?.*/, '')
  }

  /**
   * GET request with caching support
   */
  async get<T>(
    url: string, 
    config?: AxiosRequestConfig & { 
      cache?: boolean
      cacheTtl?: number
      cacheKey?: string
      dependencies?: string[]
    }
  ): Promise<ApiResponse<T>> {
    const { cache = false, cacheTtl, cacheKey, dependencies, ...axiosConfig } = config || {}
    
    const finalCacheKey = cacheKey || `GET:${url}:${JSON.stringify(axiosConfig.params || {})}`

    // Try cache first if enabled
    if (cache) {
      const cached = apiCache.getResponse(finalCacheKey)
      if (cached) {
        performanceMonitor.recordCustomMetric('api-cache-hit', 1, { endpoint: url })
        return cached
      }
    }

    try {
      const response = await this.client.get<T>(url, axiosConfig)
      const result: ApiResponse<T> = {
        data: response.data,
        success: true
      }

      // Cache successful responses if enabled
      if (cache) {
        apiCache.setResponse(finalCacheKey, result, dependencies, cacheTtl)
        performanceMonitor.recordCustomMetric('api-cache-set', 1, { endpoint: url })
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * POST request with automatic cache invalidation
   */
  async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig & { 
      invalidateCache?: string[]
      invalidatePatterns?: RegExp[]
    }
  ): Promise<ApiResponse<T>> {
    const { invalidateCache, invalidatePatterns, ...axiosConfig } = config || {}

    try {
      const response = await this.client.post<T>(url, data, axiosConfig)
      const result: ApiResponse<T> = {
        data: response.data,
        success: true
      }

      // Invalidate related cache entries
      if (invalidateCache) {
        invalidateCache.forEach(key => apiCache.invalidateByDependency(key))
      }
      
      if (invalidatePatterns) {
        invalidatePatterns.forEach(pattern => apiCache.invalidateByPattern(pattern))
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * PUT request with automatic cache invalidation
   */
  async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig & { 
      invalidateCache?: string[]
      invalidatePatterns?: RegExp[]
    }
  ): Promise<ApiResponse<T>> {
    const { invalidateCache, invalidatePatterns, ...axiosConfig } = config || {}

    try {
      const response = await this.client.put<T>(url, data, axiosConfig)
      const result: ApiResponse<T> = {
        data: response.data,
        success: true
      }

      // Invalidate related cache entries
      if (invalidateCache) {
        invalidateCache.forEach(key => apiCache.invalidateByDependency(key))
      }
      
      if (invalidatePatterns) {
        invalidatePatterns.forEach(pattern => apiCache.invalidateByPattern(pattern))
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * DELETE request with automatic cache invalidation
   */
  async delete<T>(
    url: string, 
    config?: AxiosRequestConfig & { 
      invalidateCache?: string[]
      invalidatePatterns?: RegExp[]
    }
  ): Promise<ApiResponse<T>> {
    const { invalidateCache, invalidatePatterns, ...axiosConfig } = config || {}

    try {
      const response = await this.client.delete<T>(url, axiosConfig)
      const result: ApiResponse<T> = {
        data: response.data,
        success: true
      }

      // Invalidate related cache entries
      if (invalidateCache) {
        invalidateCache.forEach(key => apiCache.invalidateByDependency(key))
      }
      
      if (invalidatePatterns) {
        invalidatePatterns.forEach(pattern => apiCache.invalidateByPattern(pattern))
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * PATCH request with automatic cache invalidation
   */
  async patch<T>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig & { 
      invalidateCache?: string[]
      invalidatePatterns?: RegExp[]
    }
  ): Promise<ApiResponse<T>> {
    const { invalidateCache, invalidatePatterns, ...axiosConfig } = config || {}

    try {
      const response = await this.client.patch<T>(url, data, axiosConfig)
      const result: ApiResponse<T> = {
        data: response.data,
        success: true
      }

      // Invalidate related cache entries
      if (invalidateCache) {
        invalidateCache.forEach(key => apiCache.invalidateByDependency(key))
      }
      
      if (invalidatePatterns) {
        invalidatePatterns.forEach(pattern => apiCache.invalidateByPattern(pattern))
      }

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Batch requests for better performance
   */
  async batch<T>(requests: Array<() => Promise<ApiResponse<any>>>): Promise<ApiResponse<T[]>> {
    const startTime = performance.now()
    
    try {
      const results = await Promise.allSettled(requests.map(req => req()))
      const duration = performance.now() - startTime
      
      performanceMonitor.recordCustomMetric('api-batch-request', duration, {
        count: requests.length,
        success: results.every(r => r.status === 'fulfilled')
      })

      const data = results.map(result => 
        result.status === 'fulfilled' ? result.value.data : null
      )

      return {
        data: data as T[],
        success: true
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Preload data for better perceived performance
   */
  async preload(urls: string[], config?: AxiosRequestConfig): Promise<void> {
    const preloadPromises = urls.map(url => 
      this.get(url, { ...config, cache: true }).catch(() => {
        // Ignore preload failures
        console.warn(`Failed to preload: ${url}`)
      })
    )

    await Promise.allSettled(preloadPromises)
    performanceMonitor.recordCustomMetric('api-preload', urls.length)
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await this.client.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })

      return {
        data: response.data,
        success: true
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error',
        code: error.response.status.toString(),
        details: error.response.data
      }
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR'
      }
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Clean up interceptors
   */
  destroy() {
    if (this.requestInterceptorId !== null) {
      this.client.interceptors.request.eject(this.requestInterceptorId)
    }
    if (this.responseInterceptorId !== null) {
      this.client.interceptors.response.eject(this.responseInterceptorId)
    }
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export for use in services
export default apiService

// Also export the original axios instance for backward compatibility
export const api = apiService
