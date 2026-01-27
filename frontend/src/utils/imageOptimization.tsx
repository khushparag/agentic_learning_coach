/**
 * Image optimization utilities for better performance
 */

import React from 'react'
import { performanceMonitor } from './performance'

export interface ImageOptimizationOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'webp' | 'jpeg' | 'png'
  progressive?: boolean
}

export interface OptimizedImage {
  src: string
  width: number
  height: number
  format: string
  size: number
  originalSize: number
  compressionRatio: number
}

class ImageOptimizer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private cache = new Map<string, OptimizedImage>()

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
    }
  }

  async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp',
      progressive = true
    } = options

    const cacheKey = `${file.name}-${file.size}-${JSON.stringify(options)}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const startTime = performance.now()

    try {
      const optimized = await this.processImage(file, {
        quality,
        maxWidth,
        maxHeight,
        format,
        progressive
      })

      const duration = performance.now() - startTime
      performanceMonitor.recordCustomMetric('image-optimization', duration, {
        originalSize: file.size,
        optimizedSize: optimized.size,
        compressionRatio: optimized.compressionRatio,
        format: optimized.format
      })

      this.cache.set(cacheKey, optimized)
      return optimized
    } catch (error) {
      performanceMonitor.recordCustomMetric('image-optimization-error', 1, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private async processImage(
    file: File,
    options: Required<ImageOptimizationOptions>
  ): Promise<OptimizedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const optimized = this.resizeAndCompress(img, options)
          resolve(optimized)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  private resizeAndCompress(
    img: HTMLImageElement,
    options: Required<ImageOptimizationOptions>
  ): OptimizedImage {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available')
    }

    const { width, height } = this.calculateDimensions(
      img.width,
      img.height,
      options.maxWidth,
      options.maxHeight
    )

    this.canvas.width = width
    this.canvas.height = height
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.drawImage(img, 0, 0, width, height)

    const mimeType = this.getMimeType(options.format)
    const dataUrl = this.canvas.toDataURL(mimeType, options.quality)
    
    const originalSize = this.estimateImageSize(img.width, img.height)
    const optimizedSize = this.calculateDataUrlSize(dataUrl)
    const compressionRatio = originalSize / optimizedSize

    return {
      src: dataUrl,
      width,
      height,
      format: options.format,
      size: optimizedSize,
      originalSize,
      compressionRatio
    }
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight
    let width = originalWidth
    let height = originalHeight

    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    }
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'webp': return 'image/webp'
      case 'jpeg': return 'image/jpeg'
      case 'png': return 'image/png'
      default: return 'image/jpeg'
    }
  }

  private estimateImageSize(width: number, height: number): number {
    return width * height * 4
  }

  private calculateDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1]
    return Math.round((base64.length * 3) / 4)
  }

  generateResponsiveSources(
    file: File,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): Promise<Array<{ width: number; src: string }>> {
    const promises = breakpoints.map(async (width) => {
      const optimized = await this.optimizeImage(file, {
        maxWidth: width,
        maxHeight: Math.round(width * 0.75),
        quality: 0.8,
        format: 'webp'
      })
      return { width, src: optimized.src }
    })
    return Promise.all(promises)
  }

  async createBlurPlaceholder(file: File): Promise<string> {
    const optimized = await this.optimizeImage(file, {
      maxWidth: 20,
      maxHeight: 20,
      quality: 0.1,
      format: 'jpeg'
    })
    return optimized.src
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    totalSize: number
    entries: Array<{ key: string; size: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      size: value.size
    }))
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    return { size: this.cache.size, totalSize, entries }
  }
}

export const imageOptimizer = new ImageOptimizer()

export function useImageOptimization() {
  const optimizeImage = React.useCallback(
    (file: File, options?: ImageOptimizationOptions) => {
      return imageOptimizer.optimizeImage(file, options)
    },
    []
  )

  const generateResponsiveSources = React.useCallback(
    (file: File, breakpoints?: number[]) => {
      return imageOptimizer.generateResponsiveSources(file, breakpoints)
    },
    []
  )

  const createBlurPlaceholder = React.useCallback(
    (file: File) => {
      return imageOptimizer.createBlurPlaceholder(file)
    },
    []
  )

  return { optimizeImage, generateResponsiveSources, createBlurPlaceholder }
}

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  optimization?: ImageOptimizationOptions
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  blurDataURL,
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {!isLoaded && !hasError && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

export interface ResponsiveImageProps {
  src: string
  alt: string
  sources?: Array<{ width: number; src: string }>
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sources = [],
  className = '',
  onLoad,
  onError
}) => {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          media={`(max-width: ${source.width}px)`}
          srcSet={source.src}
        />
      ))}
      <ProgressiveImage
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        className="w-full h-full object-cover"
      />
    </picture>
  )
}
