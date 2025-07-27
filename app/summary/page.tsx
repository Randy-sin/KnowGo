"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle, Clock, Brain, Gamepad2, Video, RotateCcw, ArrowRight, Loader2, ChevronDown, ChevronUp, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"
import { LearningSessionService } from "@/lib/learning-session-service"

import { LearningSession, LearningInteraction, QuizRecord, ReflectionRecord, GameSession, VideoSession } from "@/lib/supabase"

interface RealLearningData {
  session: LearningSession
  interactions: LearningInteraction[]
  quizRecords: QuizRecord[]
  reflections: ReflectionRecord[]
  gameSession: GameSession | null
  videoSession: VideoSession | null
  aiGeneratedSummary: string
  summarySource?: 'gemini' | 'fallback'
  summaryTone?: 'encouraging' | 'neutral' | 'inspiring'
}

export default function SummaryPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
  const [learningData, setLearningData] = useState<RealLearningData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  
  // 展开/折叠状态
  const [isQuizExpanded, setIsQuizExpanded] = useState(false)
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadRealLearningData()
    }
  }, [isLoaded, isSignedIn, user])

  const loadRealLearningData = async () => {
    try {
      setIsLoading(true)
      
      // 获取当前会话ID（从localStorage或URL参数）
      const sessionId = localStorage.getItem('xknow-session-id') || 
                       new URLSearchParams(window.location.search).get('sessionId')
      
      if (!sessionId) {
        console.error('没有找到会话ID，回退到localStorage数据')
        loadFallbackData()
        return
      }

      console.log('🔍 加载真实学习数据，会话ID:', sessionId)
      
      // 从数据库获取完整的学习数据
      const sessionDetails = await LearningSessionService.getSessionDetails(sessionId)
      
      // 🚀 优先检查预生成的摘要
      console.log('🔍 检查预生成的摘要...')
      const pregeneratedSummary = localStorage.getItem('xknow-generated-summary')
      
      let aiSummary = ''
      let summarySource: 'gemini' | 'fallback' = 'fallback'
      let summaryTone: 'encouraging' | 'neutral' | 'inspiring' = 'neutral'
      
      if (pregeneratedSummary) {
        try {
          const summaryData = JSON.parse(pregeneratedSummary)
          const generatedTime = Date.now() - summaryData.generatedAt
          
          // 如果摘要是在30分钟内生成的，直接使用
          if (generatedTime < 30 * 60 * 1000) {
            aiSummary = summaryData.summary
            summarySource = summaryData.source
            summaryTone = summaryData.tone
            console.log('✅ 使用预生成的摘要:', aiSummary)
          } else {
            console.log('⚠️ 预生成摘要已过期，重新生成')
            localStorage.removeItem('xknow-generated-summary')
          }
        } catch (error) {
          console.error('❌ 预生成摘要解析失败:', error)
          localStorage.removeItem('xknow-generated-summary')
        }
      }
      
      // 如果没有有效的预生成摘要，实时生成
      if (!aiSummary) {
        console.log('🤖 没有预生成摘要，开始实时生成...')
        setIsGeneratingSummary(true)
        setSummaryError(null)
        
        try {
          const response = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionData: sessionDetails
            }),
            signal: AbortSignal.timeout(25000) // 25秒超时
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const summaryData = await response.json() as {
            summary: string
            source: 'gemini' | 'fallback'
            tone: 'encouraging' | 'neutral' | 'inspiring'
            fallback: boolean
          }
          
          aiSummary = summaryData.summary
          summarySource = summaryData.source
          summaryTone = summaryData.tone
          console.log('✅ 实时摘要生成成功:', aiSummary)
          
          // 保存生成的摘要
          localStorage.setItem('xknow-generated-summary', JSON.stringify({
            summary: aiSummary,
            source: summarySource,
            tone: summaryTone,
            generatedAt: Date.now()
          }))
          
          if (summaryData.fallback) {
            setSummaryError('AI摘要服务暂时不可用，已使用备用摘要')
          }
        } catch (summaryApiError) {
          console.warn('⚠️ 实时摘要生成失败，使用静态回退:', summaryApiError)
          setSummaryError('智能摘要生成失败，已使用基础摘要')
          
          // 最终回退到静态摘要
          aiSummary = LearningSessionService.generateSessionSummary(
            sessionDetails.session,
            sessionDetails.interactions,
            sessionDetails.quizRecords
          )
          summarySource = 'fallback'
          summaryTone = 'neutral'
        } finally {
          setIsGeneratingSummary(false)
        }
      }
      
      const realData: RealLearningData = {
        session: sessionDetails.session,
        interactions: sessionDetails.interactions,
        quizRecords: sessionDetails.quizRecords,
        reflections: sessionDetails.reflections,
        gameSession: sessionDetails.gameSession,
        videoSession: sessionDetails.videoSession,
        aiGeneratedSummary: aiSummary,
        summarySource,
        summaryTone
      }
      
      setLearningData(realData)
      console.log('✅ 真实学习数据加载完成:', realData)
      
    } catch (error) {
      console.error('❌ 加载真实数据失败，回退到localStorage:', error)
      loadFallbackData()
    } finally {
      setIsLoading(false)
      // 渐进式显示
      setTimeout(() => setShowContent(true), 500)
    }
  }

  // 回退方案：从localStorage加载数据（保持兼容性）
  const loadFallbackData = () => {
    console.log('📦 使用localStorage回退数据')
    
    const topic = localStorage.getItem('xknow-query') || ''
    const category = localStorage.getItem('xknow-category') || ''
    const config = localStorage.getItem('xknow-config')
    
    let userLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
    if (config) {
      try {
        const parsedConfig = JSON.parse(config)
        const level = parsedConfig.level
        if (level === 'beginner' || level === 'intermediate' || level === 'expert') {
          userLevel = level
        }
      } catch (error) {
        console.error('Failed to parse config:', error)
      }
    }

    // 模拟会话数据
    const mockSession: LearningSession = {
      id: 'mock-session',
      user_id: user?.id || '',
      original_query: topic,
      ai_classification: {},
      user_confirmed_category: category as 'science' | 'history' | 'others',
      learning_config: { level: userLevel, style: 'unknown' },
      status: 'completed',
      current_stage: 'summary',
      created_at: new Date().toISOString(),
      started_learning_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      total_duration: 0
    }

    const fallbackData: RealLearningData = {
      session: mockSession,
      interactions: [],
      quizRecords: [],
      reflections: [],
      gameSession: null,
      videoSession: null,
      aiGeneratedSummary: `完成了关于"${topic}"的学习探索`
    }

    setLearningData(fallbackData)
  }

  // 计算真实的学习统计
  const getRealStats = () => {
    if (!learningData) {
      return { completedSections: 0, engagement: 0 }
    }

    const { interactions, quizRecords, gameSession, videoSession } = learningData
    
    // 计算完成的部分
    let completedSections = 0
    if (interactions.length > 0) completedSections++
    if (quizRecords.length > 0) completedSections++
    if (gameSession) completedSections++
    if (videoSession) completedSections++

    // 计算参与度
    const engagement = Math.floor((completedSections / 4) * 100)

    return {
      completedSections,
      engagement
    }
  }

  const handleNewQuery = () => {
    // 清除所有学习数据
    const keys = [
      'xknow-query', 'xknow-category', 'xknow-config', 'xknow-responses',
      'xknow-pregenerated-questions', 'xknow-analyses', 'xknow-reflections',
      'xknow-pregenerated-game', 'xknow-video-task', 'xknow-classification',
      'xknow-session-id'
    ]
    keys.forEach(key => localStorage.removeItem(key))
    
    router.push('/')
  }

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  if (isLoading || !learningData || !showContent) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="w-6 h-6 text-secondary animate-spin" />
          <p className="text-sm text-secondary">生成学习总结中...</p>
        </motion.div>
      </div>
    )
  }

  const stats = getRealStats()

  return (
    <div className="min-h-screen bg-page">
      
      {/* 极简导航 */}
      <div className="absolute top-8 left-8 z-20">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.back()}
          className="w-6 h-6 flex items-center justify-center text-secondary hover:text-primary transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-8 py-24">
        
        {/* 标题区域 - 使用AI生成的总结 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-light text-primary tracking-tight mb-4">
            {t('summary.title')}
          </h1>
          <p className="text-lg font-light text-secondary mb-4">
            {learningData.session.original_query}
          </p>
          {/* AI生成的智能总结 */}
          <div className="bg-subtle rounded-2xl p-6 max-w-2xl mx-auto relative">
            {isGeneratingSummary ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                <p className="text-sm text-secondary font-light">
                  {t('summary.generatingSummary')}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-light leading-relaxed text-gray-700">
                  {learningData.aiGeneratedSummary}
                </p>
                
                {/* 错误提示 */}
                {summaryError && (
                                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600">{summaryError}</p>
                    </div>
                )}
              </>
            )}
          </div>
          <div className="w-12 h-px bg-default mx-auto mt-8"></div>
        </motion.div>

        {/* 学习统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto"
        >
          <div className="bg-card border border-default rounded-3xl p-6 text-center">
            <div className="w-12 h-12 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">{stats.completedSections}/4</div>
            <div className="text-sm text-secondary">{t('summary.completedSections')}</div>
          </div>

          <div className="bg-card border border-default rounded-3xl p-6 text-center">
            <div className="w-12 h-12 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">{stats.engagement}%</div>
            <div className="text-sm text-secondary">{t('summary.engagement')}</div>
          </div>
        </motion.div>

        {/* 真实学习旅程回顾 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8 mb-16"
        >
          <h2 className="text-2xl font-light text-primary text-center mb-12">{t('summary.yourLearningPath')}</h2>
          
          {/* 引导学习阶段 */}
          {learningData.interactions.length > 0 && (
            <div className="bg-card border border-default rounded-3xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-[rgb(var(--background))] text-sm font-medium">1</span>
                  </div>
                                  <h3 className="text-lg font-medium text-primary">{t('summary.guidedLearning')}</h3>
                <span className="text-sm text-secondary">({learningData.interactions.length} {t('summary.stages')})</span>
                </div>
                <div className="space-y-4">
                  {learningData.interactions.slice(0, 3).map((interaction, index) => (
                    <div key={interaction.id} className="bg-subtle rounded-2xl p-4">
                      <div className="text-xs text-secondary uppercase tracking-wide mb-2">
                        {t('summary.stage')} {index + 1} - {t(`summary.stageTypes.${interaction.stage_type}`)}
                      </div>
                      <p className="text-sm text-primary leading-relaxed mb-2">
                        <strong>{t('summary.questionLabel')}</strong>{interaction.ai_question}
                      </p>
                      <p className="text-sm text-secondary leading-relaxed">
                        <strong>{t('summary.answerLabel')}</strong>{interaction.user_answer || t('summary.noAnswer')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 知识检测阶段 */}
          {learningData.quizRecords.length > 0 && (
            <div className="bg-card border border-default rounded-3xl overflow-hidden">
              <div className="p-8">
                <div 
                  className="flex items-center justify-between mb-6 cursor-pointer group"
                  onClick={() => setIsQuizExpanded(!isQuizExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-[rgb(var(--background))] text-sm font-medium">2</span>
                    </div>
                    <h3 className="text-lg font-medium text-primary">{t('summary.knowledgeAssessment')}</h3>
                    <span className="text-sm text-secondary">({learningData.quizRecords.length} {t('summary.questions')})</span>
                  </div>
                  <div className="transition-all duration-200 group-hover:text-gray-600 text-gray-400">
                    {isQuizExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {!isQuizExpanded ? (
                                      <div className="bg-subtle rounded-2xl p-4">
                      <div className="text-sm text-secondary">
                        {t('summary.completedAssessment')}
                      </div>
                    </div>
                ) : (
                                    <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="divide-y divide-gray-100"
                  >
                    {learningData.quizRecords.map((quiz, index) => (
                      <div key={quiz.id || index} className={`space-y-4 ${index > 0 ? 'pt-6' : ''} pb-6`}>
                        {/* 题目标题和状态 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('summary.questionNumber')} {index + 1}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            quiz.is_correct 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {quiz.is_correct ? `✓ ${t('summary.correct')}` : `✗ ${t('summary.incorrect')}`}
                          </span>
                        </div>
                        
                        {/* 题目内容 */}
                        <div className="text-sm text-gray-800 leading-relaxed font-medium">
                          {quiz.quiz_question}
                        </div>
                        
                        {/* 选项列表 */}
                        <div className="space-y-2">
                          {quiz.quiz_options && Array.isArray(quiz.quiz_options) ? quiz.quiz_options.map((option, optionIndex) => {
                            const isCorrect = optionIndex === quiz.correct_answer
                            const isUserChoice = optionIndex === quiz.user_answer
                            const isWrongChoice = isUserChoice && !isCorrect
                            
                            // 清理选项文本，移除开头的字母标识（如 "A. "、"B. " 等）
                            const cleanOption = option.replace(/^[A-Z]\.\s*/, '')
                            
                            return (
                              <div key={optionIndex} className={`text-sm p-3 rounded-lg border ${
                                isCorrect 
                                  ? 'border-gray-300 bg-gray-50 font-medium' 
                                  : isWrongChoice
                                  ? 'border-gray-300 bg-gray-100'
                                  : 'border-gray-200 bg-white'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-gray-500 font-medium min-w-[20px]">
                                      {String.fromCharCode(65 + optionIndex)}.
                                    </span>
                                    <span className="text-gray-700">{cleanOption}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {isCorrect && (
                                      <span className="text-xs text-gray-600">{t('summary.correctAnswer')}</span>
                                    )}
                                    {isWrongChoice && (
                                      <span className="text-xs text-gray-500">{t('summary.yourChoice')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          }) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500 text-sm">选项加载中...</p>
                            </div>
                          )}
                        </div>
                        
                        {/* 解析 */}
                        {quiz.explanation && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              {t('summary.explanation')}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {quiz.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* 实践学习阶段 */}
          {(learningData.gameSession || learningData.videoSession) && (
            <div className="bg-card border border-default rounded-3xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-[rgb(var(--background))] text-sm font-medium">3</span>
                  </div>
                  <h3 className="text-lg font-medium text-primary">{t('summary.practicalLearning')}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {learningData.gameSession && (
                    <div className="bg-subtle rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Gamepad2 className="w-5 h-5 text-secondary" />
                        <span className="text-sm font-medium text-primary">{t('summary.interactiveGame')}</span>
                      </div>
                      <div className="text-xs text-secondary mb-2">
                        {learningData.gameSession.game_title}
                      </div>
                      <div className="text-xs text-secondary">
                        {t('summary.playCount')}: {learningData.gameSession.times_played}
                      </div>
                    </div>
                  )}
                  
                  {learningData.videoSession && (
                    <div className="bg-subtle rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Video className="w-5 h-5 text-secondary" />
                        <span className="text-sm font-medium text-primary">{t('summary.learningVideo')}</span>
                      </div>
                      <div className="text-xs text-secondary">
                        {t('summary.viewCount')}: {learningData.videoSession.view_count}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 深度反思阶段 */}
          {learningData.reflections.length > 0 && (
            <div className="bg-card border border-default rounded-3xl overflow-hidden">
              <div className="p-8">
                <div 
                  className="flex items-center justify-between mb-6 cursor-pointer group"
                  onClick={() => setIsReflectionExpanded(!isReflectionExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-[rgb(var(--background))] text-sm font-medium">4</span>
                    </div>
                                      <h3 className="text-lg font-medium text-primary">{t('summary.deepReflection')}</h3>
                  <span className="text-sm text-secondary">({learningData.reflections.length} {t('summary.reflections')})</span>
                  </div>
                  <div className="transition-all duration-200 group-hover:text-gray-600 text-gray-400">
                    {isReflectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {!isReflectionExpanded ? (
                                      <div className="bg-subtle rounded-2xl p-4">
                      <div className="text-sm text-secondary">
                        {t('summary.totalWords')}: {learningData.reflections.reduce((sum, r) => sum + r.word_count, 0)} {t('summary.words')}
                      </div>
                    </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="divide-y divide-gray-100"
                  >
                    {learningData.reflections.map((reflection, index) => (
                      <div key={reflection.id || index} className={`space-y-4 ${index > 0 ? 'pt-6' : ''} pb-6`}>
                        {/* 反思标题 */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {t('summary.reflection')} {index + 1}
                          </span>
                          <span className="text-xs text-gray-400">
                            {reflection.word_count} {t('summary.words')} • {new Date(reflection.reflection_timestamp).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        
                        {/* 思考题目 */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            {t('summary.thinkingQuestion')}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                            {reflection.ai_reflection_question}
                          </p>
                        </div>
                        
                        {/* 你的反思 */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            {t('summary.yourReflection')}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                            {reflection.user_reflection_text || t('summary.noReflectionContent')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 行动按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            onClick={handleNewQuery}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-[rgb(var(--foreground))] text-[rgb(var(--background))] rounded-2xl font-medium transition-all duration-300 hover:bg-[rgb(var(--foreground))]/90"
          >
            <Home className="w-4 h-4" />
            <span>返回主页</span>
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/profile')}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-[rgb(var(--background))] border border-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded-2xl font-medium transition-all duration-300 hover:border-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/50"
          >
            <span>查看学习记录</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* 感谢信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center mt-16 pt-8 border-t border-default"
        >
          <p className="text-sm text-secondary font-light">
            {t('summary.thankYou')}
          </p>
        </motion.div>

      </div>
    </div>
  )
} 