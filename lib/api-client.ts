/**
 * 前端API调用客户端
 * 提供重试机制和用户友好的错误处理
 */

interface APIClientOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  showRetryToUser?: boolean
}

interface APIError {
  message: string
  code?: string
  retryable: boolean
}

export class APIClient {
  /**
   * 带重试机制的API调用
   */
  static async call<T>(
    url: string,
    options: RequestInit,
    clientOptions: APIClientOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 2,
      retryDelay = 2000,
      timeout = 15000,
      showRetryToUser = true
    } = clientOptions

    let lastError: APIError | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 API调用尝试 ${attempt + 1}/${maxRetries}: ${url}`)

        // 添加超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          if (attempt > 0) {
            console.log(`✅ API调用在第${attempt + 1}次尝试后成功`)
          }
          return await response.json()
        }

        // 处理HTTP错误
        const errorData = await response.json().catch(() => ({}))
        lastError = {
          message: errorData.error || `HTTP ${response.status}`,
          code: `HTTP_${response.status}`,
          retryable: response.status >= 500 || response.status === 429
        }

      } catch (error: any) {
        console.warn(`❌ 第${attempt + 1}次尝试失败:`, error.message)
        
        lastError = {
          message: this.getErrorMessage(error),
          code: error.name || 'UNKNOWN_ERROR',
          retryable: this.isRetryableError(error)
        }
      }

      // 如果错误不可重试，直接抛出
      if (!lastError.retryable) {
        throw lastError
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        if (showRetryToUser) {
          console.log(`⏳ 网络不稳定，${retryDelay/1000}秒后自动重试...`)
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    throw lastError
  }

  /**
   * 专门用于Quiz生成的API调用
   */
  static async generateQuiz(data: {
    topic: string
    guidedQuestion: string
    userAnswer: string
    category: string
    userLevel: string
  }): Promise<{ quiz?: any }> {
    return this.call<{ quiz?: any }>('/api/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        stream: false
      })
    }, {
      maxRetries: 3, // Quiz生成允许更多重试
      retryDelay: 3000,
      timeout: 20000,
      showRetryToUser: true
    })
  }

  /**
   * 判断错误是否可重试
   */
  private static isRetryableError(error: any): boolean {
    // 网络相关错误
    if (error.name === 'AbortError' || 
        error.name === 'TypeError' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('fetch failed')) {
      return true
    }
    
    return false
  }

  /**
   * 获取用户友好的错误信息
   */
  private static getErrorMessage(error: any): string {
    if (error.name === 'AbortError') {
      return '请求超时，网络连接不稳定'
    }
    
    if (error.message?.includes('fetch failed')) {
      return '网络连接失败，请检查网络状态'
    }
    
    if (error.message?.includes('timeout')) {
      return '连接超时，服务器响应较慢'
    }
    
    return error.message || '未知网络错误'
  }
} 