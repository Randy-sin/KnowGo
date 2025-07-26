/**
 * 统一的API重试服务
 * 处理网络超时、连接错误、503错误等情况
 */

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  timeout?: number
  retryCondition?: (error: any) => boolean
}

export class APIRetryService {
  /**
   * 带重试机制的fetch包装器
   */
  static async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 5000,
      timeout = 15000,
      retryCondition = this.defaultRetryCondition
    } = retryOptions

    let lastError: any
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`API调用尝试 ${attempt + 1}/${maxRetries}: ${url}`)
        
        // 为每次请求添加超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        // 如果响应成功，直接返回
        if (response.ok) {
          if (attempt > 0) {
            console.log(`✅ API调用在第${attempt + 1}次尝试后成功`)
          }
          return response
        }
        
        // 检查是否应该重试
        if (!retryCondition({ status: response.status })) {
          console.log(`❌ 状态码${response.status}不需要重试`)
          return response
        }
        
        lastError = new Error(`HTTP ${response.status}`)
        
      } catch (error: any) {
        lastError = error
        console.log(`❌ 第${attempt + 1}次尝试失败:`, error.message)
        
        // 检查是否应该重试
        if (!retryCondition(error)) {
          console.log(`❌ 错误类型${error.name}不需要重试`)
          throw error
        }
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)
        console.log(`⏳ ${delay}ms后进行第${attempt + 2}次重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    console.error(`❌ API调用在${maxRetries}次尝试后仍然失败`)
    throw lastError
  }

  /**
   * 默认重试条件
   */
  private static defaultRetryCondition(error: any): boolean {
    // 网络相关错误
    if (error.name === 'AbortError' || 
        error.name === 'TimeoutError' ||
        error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('fetch failed')) {
      return true
    }
    
    // HTTP状态码
    if (error.status >= 500 || error.status === 429) {
      return true
    }
    
    return false
  }

  /**
   * Gemini API专用重试配置
   */
  static geminiRetryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 8000,
    timeout: 20000, // 20秒超时
    retryCondition: (error: any) => {
      // Gemini API特定的重试条件
      return APIRetryService.defaultRetryCondition(error) || 
             error.status === 503 || // 服务不可用
             error.status === 429    // 请求过多
    }
  }
} 