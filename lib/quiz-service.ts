export interface QuizQuestion {
  id: string
  title: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  topic: string
}

export interface QuizGenerationRequest {
  topic: string
  guidedQuestion: string       // 引导式问题（必需）
  userAnswer?: string          // 用户对引导式问题的回答
  category: 'science' | 'history' | 'others'
  userLevel?: 'beginner' | 'intermediate' | 'expert'
  stream?: boolean
}

export interface QuizGenerationResponse {
  quiz: QuizQuestion
}

export interface QuizStreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error'
  message?: string
  quiz?: QuizQuestion
  error?: string
}

// 辅助函数：验证 Quiz 对象格式
export function validateQuizQuestion(quiz: unknown): quiz is QuizQuestion {
  if (!quiz || typeof quiz !== 'object' || quiz === null) {
    return false
  }
  
  const q = quiz as Record<string, unknown>
  return (
    typeof q.id === 'string' &&
    typeof q.title === 'string' &&
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    (q.options as unknown[]).every((option: unknown) => typeof option === 'string') &&
    typeof q.correctAnswer === 'number' &&
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 &&
    typeof q.correctAnswer === 'number' && q.correctAnswer < 4 &&
    typeof q.explanation === 'string' &&
    typeof q.topic === 'string'
  )
}

// 备用题目函数已移除，因为用户要求不使用任何备用内容 