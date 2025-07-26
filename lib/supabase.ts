import { createClient } from '@supabase/supabase-js'

// Supabase客户端配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  LEARNING_SESSIONS: 'learning_sessions',
  LEARNING_INTERACTIONS: 'learning_interactions', 
  QUIZ_RECORDS: 'quiz_records',
  REFLECTION_RECORDS: 'reflection_records',
  GAME_SESSIONS: 'game_sessions',
  VIDEO_SESSIONS: 'video_sessions',
  USER_STATS: 'user_stats'
} as const

// TypeScript类型定义
export interface LearningSession {
  id: string
  user_id: string
  original_query: string
  ai_classification: object
  user_confirmed_category: 'science' | 'history' | 'others'
  learning_config: {
    level: 'beginner' | 'intermediate' | 'expert'
    style: string
  }
  status: 'in_progress' | 'completed' | 'abandoned'
  current_stage: string
  created_at?: string
  started_learning_at?: string
  completed_at?: string
  total_duration?: number
}

export interface LearningInteraction {
  id?: string
  session_id: string
  stage_index: number
  stage_type: 'life_connection' | 'observation' | 'concept_building'
  ai_question: string
  follow_up_hint: string
  user_answer: string
  answer_timestamp: string
  ai_analysis?: {
    analysis: string
    insights: string[]
    generated_at: string
  }
}

export interface QuizRecord {
  id?: string
  session_id: string
  interaction_id: string
  quiz_question: string
  quiz_options: string[]
  correct_answer: number
  explanation: string
  user_answer?: number
  is_correct?: boolean
  answered_at?: string
  time_spent?: number
}

export interface ReflectionRecord {
  id?: string
  session_id: string
  ai_reflection_question: string
  placeholder_hint: string
  user_reflection_text: string
  word_count: number
  reflection_timestamp: string
  time_spent?: number
}

export interface GameSession {
  id?: string
  session_id: string
  game_title: string
  game_type: string
  game_instructions: string
  game_html_code: string
  game_design_concept?: object
  times_played: number
  first_played_at?: string
  last_played_at?: string
  total_play_duration?: number
}

export interface VideoSession {
  id?: string
  session_id: string
  video_prompt: string
  minimax_task_id?: string
  video_status: string
  video_download_url?: string
  video_filename?: string
  view_count: number
  total_watch_duration?: number
  first_viewed_at?: string
  last_viewed_at?: string
}

export interface UserStats {
  user_id: string
  total_sessions: number
  completed_sessions: number
  total_learning_time: number
  subjects_studied: {
    science: number
    history: number
    others: number
  }
  average_session_duration: number
  preferred_learning_level: string
  preferred_learning_style: string
  quiz_accuracy_rate: number
  last_learning_date: string
  learning_streak: number
  created_at?: string
  updated_at?: string
} 