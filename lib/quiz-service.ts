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

// 辅助函数：创建备用题目
export function createFallbackQuiz(topic: string): QuizQuestion {
  return {
    id: `fallback-${Date.now()}`,
    title: `${topic}基础检测`,
    question: `关于"${topic}"，以下说法正确的是：`,
    options: [
      "这是一个重要的学习概念",
      "这个概念没有实际应用价值",
      "这个概念已经过时了",
      "这个概念无法理解"
    ],
    correctAnswer: 0,
    explanation: `"${topic}"是一个重要的学习概念，具有重要的理论价值和实际应用意义。深入理解这个概念有助于我们更好地掌握相关知识。`,
    topic: topic
  }
} 