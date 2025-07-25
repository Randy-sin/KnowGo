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
export function validateQuizQuestion(quiz: any): quiz is QuizQuestion {
  return (
    quiz &&
    typeof quiz.id === 'string' &&
    typeof quiz.title === 'string' &&
    typeof quiz.question === 'string' &&
    Array.isArray(quiz.options) &&
    quiz.options.length === 4 &&
    quiz.options.every((option: any) => typeof option === 'string') &&
    typeof quiz.correctAnswer === 'number' &&
    quiz.correctAnswer >= 0 &&
    quiz.correctAnswer < 4 &&
    typeof quiz.explanation === 'string' &&
    typeof quiz.topic === 'string'
  )
}

// 备用题目函数已移除，因为用户要求不使用任何备用内容 