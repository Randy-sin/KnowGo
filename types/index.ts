// 用户相关类型
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  preferences: UserPreferences
}

export interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
  interests: string[]
  grade?: string
  subjects: string[]
}

// 学习相关类型
export interface Concept {
  id: string
  name: string
  subject: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  prerequisites?: string[]
  learningObjectives: string[]
}

export interface LearningSession {
  id: string
  userId: string
  conceptId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered'
  progress: number
  startedAt?: Date
  completedAt?: Date
  interactions: Interaction[]
  insights: string[]
}

export interface Interaction {
  id: string
  type: 'question' | 'answer' | 'simulation' | 'reflection'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

// AI引导相关类型
export interface AIGuide {
  id: string
  conceptId: string
  steps: GuideStep[]
  personalizations: PersonalizationRule[]
}

export interface GuideStep {
  id: string
  type: 'introduction' | 'observation' | 'concept' | 'simulation' | 'reflection' | 'application'
  title: string
  content: string
  prompts: string[]
  expectedResponses?: string[]
  nextSteps: string[]
}

export interface PersonalizationRule {
  condition: string
  modification: {
    content?: string
    prompts?: string[]
    examples?: string[]
  }
}

// 模拟器相关类型
export interface Simulator {
  id: string
  name: string
  type: 'physics' | 'math' | 'chemistry' | 'biology'
  conceptIds: string[]
  config: SimulatorConfig
  ui: SimulatorUI
}

export interface SimulatorConfig {
  parameters: Parameter[]
  initialValues: Record<string, number>
  constraints: Record<string, { min: number; max: number }>
}

export interface Parameter {
  id: string
  name: string
  unit?: string
  type: 'slider' | 'input' | 'toggle'
  description: string
}

export interface SimulatorUI {
  layout: 'split' | 'overlay' | 'tabs'
  visualization: 'canvas' | 'svg' | 'webgl'
  controls: ControlLayout[]
}

export interface ControlLayout {
  parameterId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// 组件相关类型
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export interface ModalProps extends ComponentProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

// 动画相关类型
export interface AnimationVariants {
  initial: Record<string, any>
  animate: Record<string, any>
  exit?: Record<string, any>
  transition?: Record<string, any>
}

// 游戏设计相关类型
export interface GameDesignConcept {
  gameTitle: string
  gameDescription: string
  coreGameplay: string
  winCondition: string
  designRationale: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
} 