import { 
  supabase, 
  TABLES, 
  LearningSession, 
  LearningInteraction, 
  QuizRecord, 
  ReflectionRecord,
  GameSession,
  VideoSession,
  UserStats
} from './supabase'

/**
 * 学习会话服务 - 处理所有与学习会话相关的数据库操作
 */
export class LearningSessionService {

  /**
   * 创建新的学习会话
   */
  static async createSession(
    userId: string,
    originalQuery: string,
    aiClassification: object,
    userConfirmedCategory: 'science' | 'history' | 'others',
    learningConfig: {
      level: 'beginner' | 'intermediate' | 'expert'
      style: string
    }
  ): Promise<string> {
    try {
      const sessionData: Partial<LearningSession> = {
        user_id: userId,
        original_query: originalQuery,
        ai_classification: aiClassification,
        user_confirmed_category: userConfirmedCategory,
        learning_config: learningConfig,
        status: 'in_progress',
        current_stage: 'classify',
        started_learning_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .insert(sessionData)
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
   * 确认用户选择的类别
   */
  static async confirmCategory(
    sessionId: string,
    userConfirmedCategory: 'science' | 'history' | 'others'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update({
          user_confirmed_category: userConfirmedCategory,
          current_stage: 'configure'
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('确认用户类别失败:', error)
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
   * 更新学习会话状态
   */
  static async updateSessionStatus(
    sessionId: string,
    status: 'in_progress' | 'completed' | 'abandoned',
    currentStage?: string
  ): Promise<void> {
    try {
      const updateData: Partial<LearningSession> = {
        status,
        current_stage: currentStage
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .update(updateData)
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新学习会话状态失败:', error)
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
      const interactionData: Partial<LearningInteraction> = {
        session_id: sessionId,
        stage_index: stageIndex,
        stage_type: stageType,
        ai_question: aiQuestion,
        follow_up_hint: followUpHint,
        user_answer: userAnswer,
        answer_timestamp: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.LEARNING_INTERACTIONS)
        .insert(interactionData)
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
    quizQuestion: string,
    quizOptions?: string[],
    correctAnswer?: number,
    explanation?: string
  ): Promise<string> {
    try {
      const quizData: Partial<QuizRecord> = {
        session_id: sessionId,
        interaction_id: interactionId,
        quiz_question: quizQuestion,
        quiz_options: quizOptions || [],
        correct_answer: correctAnswer || 0,
        explanation: explanation || ''
      }

      const { data, error } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .insert(quizData)
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
   * 更新测验答案
   */
  static async updateQuizAnswer(
    quizId: string,
    userAnswer: number,
    isCorrect?: boolean,
    timeSpent?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.QUIZ_RECORDS)
        .update({
          user_answer: userAnswer,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
          time_spent: timeSpent
        })
        .eq('id', quizId)

      if (error) throw error
    } catch (error) {
      console.error('更新测验答案失败:', error)
      throw error
    }
  }

  /**
   * 保存反思记录
   */
  static async saveReflection(
    sessionId: string,
    aiReflectionQuestion: string,
    placeholderHint: string,
    userReflectionText: string,
    timeSpent?: number
  ): Promise<string> {
    try {
      const reflectionData: Partial<ReflectionRecord> = {
        session_id: sessionId,
        ai_reflection_question: aiReflectionQuestion,
        placeholder_hint: placeholderHint,
        user_reflection_text: userReflectionText,
        word_count: userReflectionText.length,
        reflection_timestamp: new Date().toISOString(),
        time_spent: timeSpent
      }

      const { data, error } = await supabase
        .from(TABLES.REFLECTION_RECORDS)
        .insert(reflectionData)
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
    gameTitle: string,
    gameType?: string,
    gameInstructions?: string,
    gameHtmlCode?: string,
    gameDesignConcept?: object
  ): Promise<string> {
    try {
      const gameData: Partial<GameSession> = {
        session_id: sessionId,
        game_title: gameTitle,
        game_type: gameType || 'unknown',
        game_instructions: gameInstructions || '',
        game_html_code: gameHtmlCode || '',
        game_design_concept: gameDesignConcept,
        times_played: 0,
        first_played_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .insert(gameData)
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
    gameSessionId: string,
    playDuration: number
  ): Promise<void> {
    try {
      // 先获取当前数据
      const { data: currentData, error: fetchError } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .select('times_played, total_play_duration')
        .eq('id', gameSessionId)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase
        .from(TABLES.GAME_SESSIONS)
        .update({
          times_played: (currentData.times_played || 0) + 1,
          total_play_duration: (currentData.total_play_duration || 0) + playDuration,
          last_played_at: new Date().toISOString()
        })
        .eq('id', gameSessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新游戏播放统计失败:', error)
      throw error
    }
  }

  /**
   * 保存视频会话
   */
  static async saveVideoSession(
    sessionId: string,
    videoPrompt: string,
    minimaxTaskId?: string
  ): Promise<string> {
    try {
      const videoData: Partial<VideoSession> = {
        session_id: sessionId,
        video_prompt: videoPrompt,
        minimax_task_id: minimaxTaskId,
        video_status: 'pending',
        view_count: 0
      }

      const { data, error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .insert(videoData)
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
    videoSessionId: string,
    status: string,
    downloadUrl?: string,
    filename?: string
  ): Promise<void> {
    try {
      const updateData: Partial<VideoSession> = {
        video_status: status
      }

      if (downloadUrl) updateData.video_download_url = downloadUrl
      if (filename) updateData.video_filename = filename

      const { error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .update(updateData)
        .eq('id', videoSessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新视频状态失败:', error)
      throw error
    }
  }

  /**
   * 更新视频观看统计
   */
  static async updateVideoViewStats(
    videoSessionId: string,
    watchDuration: number
  ): Promise<void> {
    try {
      // 先获取当前数据
      const { data: currentData, error: fetchError } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .select('view_count, total_watch_duration, first_viewed_at')
        .eq('id', videoSessionId)
        .single()

      if (fetchError) throw fetchError

      const updateData: Partial<VideoSession> = {
        view_count: (currentData.view_count || 0) + 1,
        total_watch_duration: (currentData.total_watch_duration || 0) + watchDuration,
        last_viewed_at: new Date().toISOString()
      }

      if (!currentData.first_viewed_at) {
        updateData.first_viewed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from(TABLES.VIDEO_SESSIONS)
        .update(updateData)
        .eq('id', videoSessionId)

      if (error) throw error
    } catch (error) {
      console.error('更新视频观看统计失败:', error)
      throw error
    }
  }

  /**
   * 获取用户学习历史
   */
  static async getUserLearningHistory(userId: string, limit?: number): Promise<LearningSession[]> {
    try {
      let query = supabase
        .from(TABLES.LEARNING_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取用户学习历史失败:', error)
      throw error
    }
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_STATS)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // 记录不存在，返回null
        return null
      }
      if (error) throw error
      return data
    } catch (error) {
      console.error('获取用户统计数据失败:', error)
      throw error
    }
  }

  /**
   * 获取会话详细信息
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
   * 计算会话总时长并更新
   */
  static async updateSessionDuration(sessionId: string): Promise<void> {
    try {
      const { data: session, error: sessionError } = await supabase
        .from(TABLES.LEARNING_SESSIONS)
        .select('started_learning_at, completed_at')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      if (session.started_learning_at && session.completed_at) {
        const startTime = new Date(session.started_learning_at)
        const endTime = new Date(session.completed_at)
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000) // 秒

        const { error } = await supabase
          .from(TABLES.LEARNING_SESSIONS)
          .update({ total_duration: duration })
          .eq('id', sessionId)

        if (error) throw error
      }
    } catch (error) {
      console.error('更新会话时长失败:', error)
      throw error
    }
  }
} 