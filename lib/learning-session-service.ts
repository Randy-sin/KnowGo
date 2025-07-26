import { supabase, TABLES, LearningSession, LearningInteraction, QuizRecord, ReflectionRecord, GameSession, VideoSession, UserStats } from './supabase'

// 增强版学习会话接口，包含智能摘要
interface EnhancedLearningSession extends LearningSession {
  intelligentSummary: string
}

/**
 * 学习会话数据服务
 * 处理用户学习过程中的所有数据操作
 */
export class LearningSessionService {
  
  /**
   * 创建新的学习会话
   */
  static async createSession(
    userId: string,
    query: string,
    classification: object,
    config: { level: string; style: string }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .insert({
          user_id: userId,
          original_query: query,
          ai_classification: classification,
          learning_config: config,
          status: 'in_progress',
          current_stage: 'learning',
          started_learning_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('创建学习会话失败:', error)
      throw error
    }
  }

  /**
   * 更新学习会话状态
   */
  static async updateSessionStatus(
    sessionId: string,
    updates: Partial<LearningSession>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update(updates)
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新学习会话失败:', error)
      throw error
    }
  }

  /**
   * 更新学习配置
   */
  static async updateLearningConfig(
    sessionId: string,
    learningConfig: {
      level: 'beginner' | 'intermediate' | 'expert'
      style: string
    },
    currentStage: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update({
          learning_config: learningConfig,
          current_stage: currentStage
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新学习配置失败:', error)
      throw error
    }
  }

  /**
   * 确认用户选择的分类
   */
  static async confirmCategory(
    sessionId: string,
    category: 'science' | 'history' | 'others'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update({ 
          user_confirmed_category: category,
          current_stage: 'learning'
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('确认分类失败:', error)
      throw error
    }
  }

  /**
   * 保存学习交互记录
   */
  static async saveInteraction(
    sessionId: string,
    stageIndex: number,
    stageType: 'life_connection' | 'observation' | 'concept_building',
    aiQuestion: string,
    followUpHint: string,
    userAnswer: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .insert({
          session_id: sessionId,
          stage_index: stageIndex,
          stage_type: stageType,
          ai_question: aiQuestion,
          follow_up_hint: followUpHint,
          user_answer: userAnswer,
          answer_timestamp: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存学习交互失败:', error)
      throw error
    }
  }

  /**
   * 为交互记录添加用户反思
   */
  static async updateInteractionReflection(
    interactionId: string,
    reflection: string
  ): Promise<void> {
    try {
      // 获取现有的ai_analysis，如果存在的话
      const { data: existing, error: fetchError } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .select('ai_analysis')
        .eq('id', interactionId)
        .single()

      if (fetchError) throw fetchError

      // 更新ai_analysis，添加用户反思
      const updatedAnalysis = {
        ...existing.ai_analysis,
        user_reflection: reflection,
        reflection_added_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .update({
          ai_analysis: updatedAnalysis
        })
        .eq('id', interactionId)

      if (error) throw error
    } catch (error) {
      console.error('更新交互反思失败:', error)
      throw error
    }
  }

  /**
   * 更新交互的AI分析
   */
  static async updateInteractionAnalysis(
    interactionId: string,
    analysis: string,
    insights: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .update({
          ai_analysis: {
            analysis,
            insights,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', interactionId)

      if (error) throw error
    } catch (error) {
      console.error('更新AI分析失败:', error)
      throw error
    }
  }

  /**
   * 保存测验记录
   */
  static async saveQuizRecord(
    sessionId: string,
    interactionId: string,
    quizData: {
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
    },
    userAnswer?: number,
    timeSpent?: number
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .insert({
          session_id: sessionId,
          interaction_id: interactionId,
          quiz_question: quizData.question,
          quiz_options: quizData.options,
          correct_answer: quizData.correctAnswer,
          explanation: quizData.explanation,
          user_answer: userAnswer,
          is_correct: userAnswer !== undefined ? userAnswer === quizData.correctAnswer : null,
          answered_at: userAnswer !== undefined ? new Date().toISOString() : null,
          time_spent: timeSpent
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存测验记录失败:', error)
      throw error
    }
  }

  /**
   * 保存反思记录
   */
  static async saveReflection(
    sessionId: string,
    question: string,
    placeholder: string,
    reflectionText: string,
    timeSpent?: number
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.REFLECTION_RECORDS)
        .insert({
          session_id: sessionId,
          ai_reflection_question: question,
          placeholder_hint: placeholder,
          user_reflection_text: reflectionText,
          word_count: reflectionText.length,
          reflection_timestamp: new Date().toISOString(),
          time_spent: timeSpent
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存反思记录失败:', error)
      throw error
    }
  }

  /**
   * 保存游戏会话
   */
  static async saveGameSession(
    sessionId: string,
    gameData: {
      title: string
      type: string
      instructions: string
      htmlCode: string
      designConcept?: object
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .insert({
          session_id: sessionId,
          game_title: gameData.title,
          game_type: gameData.type,
          game_instructions: gameData.instructions,
          game_html_code: gameData.htmlCode,
          game_design_concept: gameData.designConcept,
          times_played: 0
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存游戏会话失败:', error)
      throw error
    }
  }

  /**
   * 更新游戏播放统计
   */
  static async updateGamePlayStats(
    sessionId: string,
    playDuration?: number
  ): Promise<void> {
    try {
      // 首先获取当前统计
      const { data: gameSession, error: fetchError } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .select('times_played, total_play_duration, first_played_at')
        .eq('session_id', sessionId)
        .single()

      if (fetchError) throw fetchError

      const now = new Date().toISOString()
      const updates: {
        times_played: number
        last_played_at: string
        first_played_at?: string
        total_play_duration?: number
      } = {
        times_played: gameSession.times_played + 1,
        last_played_at: now
      }

      if (!gameSession.first_played_at) {
        updates.first_played_at = now
      }

      if (playDuration) {
        updates.total_play_duration = (gameSession.total_play_duration || 0) + playDuration
      }

      const { error } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .update(updates)
        .eq('session_id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新游戏播放统计失败:', error)
      throw error
    }
  }

  /**
   * 保存视频会话 (历史专用)
   */
  static async saveVideoSession(
    sessionId: string,
    videoPrompt: string,
    taskId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .insert({
          session_id: sessionId,
          video_prompt: videoPrompt,
          minimax_task_id: taskId,
          video_status: 'generating'
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('保存视频会话失败:', error)
      throw error
    }
  }

  /**
   * 更新视频状态
   */
  static async updateVideoStatus(
    sessionId: string,
    status: string,
    downloadUrl?: string,
    filename?: string
  ): Promise<void> {
    try {
      const updates: {
        video_status: string
        video_download_url?: string
        video_filename?: string
      } = { video_status: status }
      
      if (downloadUrl) updates.video_download_url = downloadUrl
      if (filename) updates.video_filename = filename

      const { error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .update(updates)
        .eq('session_id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新视频状态失败:', error)
      throw error
    }
  }

  /**
   * 完成学习会话
   */
  static async completeSession(
    sessionId: string,
    totalDuration: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_duration: totalDuration,
          current_stage: 'completed'
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('完成学习会话失败:', error)
      throw error
    }
  }

  /**
   * 为学习会话生成智能摘要
   */
  static generateSessionSummary(session: LearningSession, interactions?: LearningInteraction[], quizRecords?: QuizRecord[]): string {
    const { original_query, user_confirmed_category, status, learning_config } = session
    
    // 基础信息
    const categoryMap = {
      'science': '理科',
      'history': '历史',
      'others': '其他学科'
    }
    
    const category = categoryMap[user_confirmed_category] || '未知学科'
    const level = learning_config?.level === 'beginner' ? '初级' : 
                 learning_config?.level === 'expert' ? '高级' : '中级'
    
    // 根据学习阶段和状态生成不同的摘要
    if (status === 'completed' && interactions && interactions.length > 0) {
      // 已完成的会话 - 基于交互内容生成摘要
      const stageCount = interactions.length
      const hasQuiz = quizRecords && quizRecords.length > 0
      const accuracy = hasQuiz ? 
        Math.round((quizRecords.filter(q => q.is_correct).length / quizRecords.length) * 100) : null
      
      if (accuracy !== null) {
        return `通过${stageCount}个阶段深度探索了"${original_query}"，完成${level}难度的${category}学习，测验正确率${accuracy}%`
      } else {
        return `完成了关于"${original_query}"的${level}难度${category}学习，经历了${stageCount}个深度思考阶段`
      }
    } 
    
    else if (status === 'in_progress') {
      // 进行中的会话
      if (interactions && interactions.length > 0) {
        const completedStages = interactions.length
        return `正在学习"${original_query}"(${category})，已完成${completedStages}/3个引导阶段，${level}难度设定`
      } else {
        return `开始探索"${original_query}"的${category}知识，${level}难度，准备进入引导学习阶段`
      }
    }
    
    else if (status === 'abandoned') {
      return `曾经开始学习"${original_query}"(${category})，${level}难度，学习已暂停`
    }
    
    // 默认描述
    return `${category}主题："${original_query}"，${level}难度学习`
  }

  /**
   * 获取用户的学习历史
   */
  static async getUserLearningHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<LearningSession[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取学习历史失败:', error)
      throw error
    }
  }

  /**
   * 获取用户学习历史（增强版，包含智能摘要）
   */
  static async getUserLearningHistoryWithSummaries(userId: string, limit: number = 10): Promise<EnhancedLearningSession[]> {
    try {
      const sessions = await this.getUserLearningHistory(userId, limit)
      
      // 为每个会话生成智能摘要
      const enhancedSessions = await Promise.all(
        sessions.map(async (session: LearningSession) => {
          try {
            // 获取会话的详细信息以生成更准确的摘要
            const details = await this.getSessionDetails(session.id)
            const summary = this.generateSessionSummary(
              session, 
              details.interactions, 
              details.quizRecords
            )
            
            return {
              ...session,
              intelligentSummary: summary
            }
          } catch (error) {
            // 如果获取详情失败，使用基础摘要
            console.warn(`无法获取会话${session.id}的详情，使用基础摘要`)
            return {
              ...session,
              intelligentSummary: this.generateSessionSummary(session)
            }
          }
        })
      )
      
      return enhancedSessions
    } catch (error) {
      console.error('获取学习历史失败:', error)
      throw error
    }
  }

  /**
   * 获取会话详情
   */
  static async getSessionDetails(sessionId: string) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // 获取相关的交互记录
      const { data: interactions, error: interactionsError } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .select('*')
        .eq('session_id', sessionId)
        .order('stage_index')

      if (interactionsError) throw interactionsError

      // 获取测验记录
      const { data: quizRecords, error: quizError } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .select('*')
        .eq('session_id', sessionId)

      if (quizError) throw quizError

      // 获取反思记录
      const { data: reflections, error: reflectionError } = await supabase
        .from(TABLES.REFLECTION_RECORDS)
        .select('*')
        .eq('session_id', sessionId)

      if (reflectionError) throw reflectionError

      // 获取游戏记录
      const { data: gameSession, error: gameError } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .select('*')
        .eq('session_id', sessionId)
        .single()

      // 游戏记录可能不存在，不抛出错误

      // 获取视频记录
      const { data: videoSession, error: videoError } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .select('*')
        .eq('session_id', sessionId)
        .single()

      // 视频记录可能不存在，不抛出错误

      return {
        session,
        interactions: interactions || [],
        quizRecords: quizRecords || [],
        reflections: reflections || [],
        gameSession: gameSession || null,
        videoSession: videoSession || null
      }
    } catch (error) {
      console.error('获取会话详情失败:', error)
      throw error
    }
  }

  /**
   * 获取会话基本详情 - 仅包含会话信息，不包含大量数据
   */
  static async getSessionBasicDetails(sessionId: string) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      return {
        session,
        interactions: [],
        quizRecords: [],
        reflections: [],
        gameSession: null,
        videoSession: null
      }
    } catch (error) {
      console.error('获取会话基本详情失败:', error)
      throw error
    }
  }

  /**
   * 单独获取会话交互记录
   */
  static async getSessionInteractions(sessionId: string) {
    try {
      const { data: interactions, error } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .select('*')
        .eq('session_id', sessionId)
        .order('stage_index')

      if (error) throw error
      return interactions || []
    } catch (error) {
      console.error('获取交互记录失败:', error)
      throw error
    }
  }

  /**
   * 单独获取会话测验记录
   */
  static async getSessionQuizRecords(sessionId: string) {
    try {
      const { data: quizRecords, error } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error
      return quizRecords || []
    } catch (error) {
      console.error('获取测验记录失败:', error)
      throw error
    }
  }

  /**
   * 单独获取会话反思记录
   */
  static async getSessionReflections(sessionId: string) {
    try {
      const { data: reflections, error } = await supabase
        .from(TABLES.REFLECTION_RECORDS)
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error
      return reflections || []
    } catch (error) {
      console.error('获取反思记录失败:', error)
      throw error
    }
  }

  /**
   * 单独获取会话游戏数据
   */
  static async getSessionGameData(sessionId: string) {
    try {
      const { data: gameSession, error } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .select('*')
        .eq('session_id', sessionId)
        .single()

      // 游戏记录可能不存在，不抛出错误
      return gameSession || null
    } catch (error: unknown) {
      // 如果是找不到记录的错误，返回null而不是抛出错误
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        return null
      }
      console.error('获取游戏数据失败:', error)
      throw error
    }
  }

  /**
   * 单独获取会话视频数据
   */
  static async getSessionVideoData(sessionId: string) {
    try {
      const { data: videoSession, error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .select('*')
        .eq('session_id', sessionId)
        .single()

      // 视频记录可能不存在，不抛出错误
      return videoSession || null
    } catch (error: unknown) {
      // 如果是找不到记录的错误，返回null而不是抛出错误
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        return null
      }
      console.error('获取视频数据失败:', error)
      throw error
    }
  }

  /**
   * 更新测验答题记录
   */
  static async updateQuizAnswer(
    quizRecordId: string,
    userAnswer: number,
    timeSpent?: number
  ): Promise<void> {
    try {
      // 首先获取quiz记录以计算是否正确
      const { data: quizRecord, error: fetchError } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .select('correct_answer')
        .eq('id', quizRecordId)
        .single()

      if (fetchError) throw fetchError

      const isCorrect = userAnswer === quizRecord.correct_answer

      const { error } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .update({
          user_answer: userAnswer,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
          time_spent: timeSpent
        })
        .eq('id', quizRecordId)

      if (error) throw error
    } catch (error) {
      console.error('更新测验答题记录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户统计
   */
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_STATS)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
      return data || null
    } catch (error) {
      console.error('获取用户统计失败:', error)
      throw error
    }
  }
} 