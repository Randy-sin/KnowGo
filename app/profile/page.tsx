"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, Trophy, TrendingUp, Play, Video, Brain, Target, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { LearningSessionService } from "@/lib/learning-session-service"
import { LearningSession, UserStats, LearningInteraction, QuizRecord, ReflectionRecord, GameSession, VideoSession } from "@/lib/supabase"
import { useTranslations } from "@/lib/use-translations"

interface SessionDetails {
  session: LearningSession
  interactions: LearningInteraction[]
  quizRecords: QuizRecord[]
  reflections: ReflectionRecord[]
  gameSession: GameSession | null
  videoSession: VideoSession | null
}



export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
  
  const [learningHistory, setLearningHistory] = useState<LearningSession[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 详情模态框相关状态
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentSessionDetails, setCurrentSessionDetails] = useState<SessionDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  


  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadUserData()
    }
  }, [isLoaded, isSignedIn, user])

  // 清理模态框状态
  useEffect(() => {
    return () => {
      // 组件卸载时清理样式
      document.body.classList.remove('modal-open')
    }
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      console.log('🔍 正在加载用户数据, 用户ID:', user!.id)
      
      // 并行加载用户数据
      const [history, stats] = await Promise.all([
        LearningSessionService.getUserLearningHistory(user!.id, 10),
        LearningSessionService.getUserStats(user!.id)
      ])
      
      console.log('📊 学习历史数据:', history)
      console.log('📈 用户统计数据:', stats)
      
      // 显示所有学习记录，但优先显示已完成的
      const sortedHistory = history.sort((a, b) => {
        // 优先显示已完成的记录
        if (a.status === 'completed' && b.status !== 'completed') return -1
        if (b.status === 'completed' && a.status !== 'completed') return 1
        // 然后按创建时间排序
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      })
      
      setLearningHistory(sortedHistory)
      setUserStats(stats)
    } catch (error) {
      console.error('❌ 加载用户数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取会话详情
  const loadSessionDetails = async (sessionId: string): Promise<void> => {
    try {
      setIsLoadingDetails(true)
      console.log('🔍 正在加载会话详情:', sessionId)
      
      const details = await LearningSessionService.getSessionDetails(sessionId)
      console.log('📋 会话详情:', details)
      
      setCurrentSessionDetails(details)
      setShowDetailModal(true)
      
      // 防止背景滚动
      document.body.classList.add('modal-open')
    } catch (error) {
      console.error('❌ 加载会话详情失败:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }



  // 关闭模态框
  const closeModal = () => {
    setShowDetailModal(false)
    setCurrentSessionDetails(null)
    
    // 恢复背景滚动
    document.body.classList.remove('modal-open')
  }

  const handleBack = () => {
    router.push('/')
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '未知时间'
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'science':
        return <Brain className="w-5 h-5" />
      case 'history':
        return <Video className="w-5 h-5" />
      case 'others':
        return <BookOpen className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getCategoryName = (category: string | null) => {
    switch (category) {
      case 'science':
        return '理科'
      case 'history':
        return '历史'
      case 'others':
        return '文科'
      default:
        return '未分类'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'abandoned':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-500 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'in_progress':
        return '进行中'
      case 'abandoned':
        return '已中断'
      default:
        return '未知'
    }
  }



  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      {/* 极简导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center text-secondary hover:text-primary transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 主内容 */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-light text-primary mb-3">
            学习档案
          </h1>
          <p className="text-secondary">
            追踪你的学习进度和成长历程
          </p>
        </motion.div>

        {/* 统计概览 */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="card-minimal p-6 text-center">
              <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <div className="text-2xl font-light text-gray-900 mb-1">
                {userStats.total_sessions}
              </div>
              <div className="text-sm text-gray-500">总学习次数</div>
            </div>

            <div className="card-minimal p-6 text-center">
              <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <div className="text-2xl font-light text-gray-900 mb-1">
                {formatDuration(userStats.total_learning_time)}
              </div>
              <div className="text-sm text-gray-500">总学习时长</div>
            </div>

            <div className="card-minimal p-6 text-center">
              <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <div className="text-2xl font-light text-gray-900 mb-1">
                {userStats.completed_sessions}
              </div>
              <div className="text-sm text-gray-500">完成次数</div>
            </div>

            <div className="card-minimal p-6 text-center">
              <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <div className="text-2xl font-light text-gray-900 mb-1">
                {(userStats.quiz_accuracy_rate * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">测试正确率</div>
            </div>
          </motion.div>
        )}

        {/* 学科分布 */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="card-minimal p-6 mb-12"
          >
            <h2 className="text-xl font-light text-gray-900 mb-6">学科分布</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Brain className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-lg font-light text-gray-900">
                  {userStats.subjects_studied.science || 0}
                </div>
                <div className="text-sm text-gray-500">理科</div>
              </div>
              <div className="text-center">
                <Video className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-lg font-light text-gray-900">
                  {userStats.subjects_studied.history || 0}
                </div>
                <div className="text-sm text-gray-500">历史</div>
              </div>
              <div className="text-center">
                <BookOpen className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-lg font-light text-gray-900">
                  {userStats.subjects_studied.others || 0}
                </div>
                <div className="text-sm text-gray-500">文科</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 学习历史 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-xl font-light text-gray-900 mb-6">最近学习</h2>
          
          {learningHistory.length === 0 ? (
            <div className="card-minimal p-8 text-center">
              <div className="text-gray-500 mb-4">
                还没有学习记录
              </div>
              <motion.button
                onClick={() => router.push('/')}
                className="btn-primary-minimal"
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                开始学习
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {learningHistory.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card-minimal p-6 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(session.user_confirmed_category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {session.original_query}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{getCategoryName(session.user_confirmed_category)}</span>
                          <span>{formatDate(session.created_at!)}</span>
                          {session.total_duration && (
                            <span>{formatDuration(session.total_duration)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                      <motion.button
                        className="btn-ghost-minimal text-xs"
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                        onClick={() => loadSessionDetails(session.id)}
                        disabled={isLoadingDetails}
                      >
                        {isLoadingDetails ? '加载中...' : '查看详情'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 详情模态框 */}
      <AnimatePresence>
        {showDetailModal && currentSessionDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              // 只有点击背景时才关闭模态框
              if (e.target === e.currentTarget) {
                closeModal()
              }
            }}
            onWheel={(e) => {
              // 防止背景滚动穿透
              e.preventDefault()
            }}
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] border border-gray-200/50 flex flex-col"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                // 确保滚动事件在模态框内正常工作
                e.stopPropagation()
              }}
            >
              {/* 模态框头部 */}
              <div className="border-b border-gray-100/60 p-8 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                    {currentSessionDetails.session.original_query}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 font-light">
                    {getCategoryName(currentSessionDetails.session.user_confirmed_category)} • {formatDate(currentSessionDetails.session.created_at)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-full hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 模态框内容 */}
              <div 
                className="flex-1 overflow-y-scroll p-8 modal-scroll-area" 
                style={{minHeight: '400px', maxHeight: 'calc(90vh - 140px)'}}
                onWheel={(e) => {
                  // 阻止滚动事件穿透到背景
                  e.stopPropagation()
                }}
                onTouchMove={(e) => {
                  // 移动端触摸滚动支持
                  e.stopPropagation()
                }}
              >
                <div className="space-y-12 pb-8">
                  
                  {/* 学习配置 */}
                  <div>
                    <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                      学习配置
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">学习水平</div>
                        <div className="text-lg font-light text-gray-900 capitalize">
                          {currentSessionDetails.session.learning_config?.level || '未设置'}
                        </div>
                      </div>
                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">学习风格</div>
                        <div className="text-lg font-light text-gray-900 capitalize">
                          {currentSessionDetails.session.learning_config?.style || '未设置'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 学习交互 */}
                  {currentSessionDetails.interactions && currentSessionDetails.interactions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                        学习交互 <span className="text-sm text-gray-400 font-normal">({currentSessionDetails.interactions.length}个阶段)</span>
                      </h3>
                      <div className="space-y-6">
                        {currentSessionDetails.interactions.map((interaction: LearningInteraction, index: number) => (
                          <div key={interaction.id} className="bg-gray-50/30 rounded-2xl p-6 border border-gray-100/40">
                            <div className="flex items-center mb-4">
                              <span className="w-7 h-7 bg-gray-200/60 text-gray-600 rounded-full flex items-center justify-center text-sm font-light mr-4">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-500 capitalize font-light tracking-wide">
                                {interaction.stage_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">问题</div>
                              <div className="text-gray-900 font-light leading-relaxed">{interaction.ai_question}</div>
                            </div>
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">回答</div>
                              <div className="text-gray-700 font-light leading-relaxed">{interaction.user_answer}</div>
                            </div>
                            {interaction.ai_analysis && (
                              <div className="pt-4 border-t border-gray-100/60">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">AI分析</div>
                                <div className="text-gray-600 text-sm font-light leading-relaxed">
                                  {typeof interaction.ai_analysis === 'object' 
                                    ? interaction.ai_analysis.analysis || '分析中...'
                                    : interaction.ai_analysis
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 测验记录 */}
                  {currentSessionDetails.quizRecords && currentSessionDetails.quizRecords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                        知识检测 <span className="text-sm text-gray-400 font-normal">({currentSessionDetails.quizRecords.length}题)</span>
                      </h3>
                      <div className="space-y-6">
                        {currentSessionDetails.quizRecords.map((quiz: QuizRecord, index: number) => (
                          <div key={quiz.id} className="bg-gray-50/30 rounded-2xl p-6 border border-gray-100/40">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-gray-500 font-light">第{index + 1}题</span>
                              {quiz.is_correct !== null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-light ${quiz.is_correct ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                  {quiz.is_correct ? '✓ 正确' : '✗ 错误'}
                                </span>
                              )}
                            </div>
                            <div className="mb-4">
                              <div className="text-gray-900 font-light leading-relaxed mb-4">{quiz.quiz_question}</div>
                              <div className="space-y-2">
                                {quiz.quiz_options.map((option: string, optionIndex: number) => {
                                  // 清理选项文本，移除可能存在的A./B./C./D.前缀
                                  const cleanOption = option.replace(/^[A-Z]\.\s*/, '').trim()
                                  return (
                                    <div key={optionIndex} className={`text-sm p-3 rounded-xl border font-light ${
                                      optionIndex === quiz.correct_answer ? 'bg-gray-100/60 border-gray-200 text-gray-800' :
                                      quiz.user_answer !== null && optionIndex === quiz.user_answer && optionIndex !== quiz.correct_answer ? 'bg-gray-50 border-gray-200 text-gray-600' :
                                      'bg-white/50 border-gray-100 text-gray-600'
                                    }`}>
                                      {String.fromCharCode(65 + optionIndex)}. {cleanOption}
                                      {optionIndex === quiz.correct_answer && <span className="ml-2 text-gray-600 text-xs">← 正确答案</span>}
                                      {quiz.user_answer !== null && optionIndex === quiz.user_answer && optionIndex !== quiz.correct_answer && <span className="ml-2 text-gray-500 text-xs">← 你的选择</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            {quiz.explanation && (
                              <div className="pt-4 border-t border-gray-100/60">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">解释</div>
                                <div className="text-sm text-gray-600 font-light leading-relaxed">{quiz.explanation}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 反思记录 */}
                  {currentSessionDetails.reflections && currentSessionDetails.reflections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                        深度反思
                      </h3>
                      <div className="space-y-6">
                        {currentSessionDetails.reflections.map((reflection: ReflectionRecord) => (
                          <div key={reflection.id} className="bg-gray-50/30 rounded-2xl p-6 border border-gray-100/40">
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">反思问题</div>
                              <div className="text-gray-900 font-light leading-relaxed">{reflection.ai_reflection_question}</div>
                            </div>
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">你的反思</div>
                              <div className="text-gray-700 font-light leading-relaxed whitespace-pre-wrap">{reflection.user_reflection_text}</div>
                            </div>
                            <div className="text-xs text-gray-400 font-light">
                              {reflection.word_count} 字 • {formatDate(reflection.reflection_timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 游戏记录 */}
                  {currentSessionDetails.gameSession && (
                    <div>
                      <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                        互动游戏
                      </h3>
                      <div className="bg-gray-50/30 rounded-2xl p-6 border border-gray-100/40">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-light text-gray-900">
                            {currentSessionDetails.gameSession.game_title}
                          </h4>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">
                            {currentSessionDetails.gameSession.game_type}
                          </span>
                        </div>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          {currentSessionDetails.gameSession.game_instructions}
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">游戏次数</div>
                            <div className="text-lg font-light text-gray-900">{currentSessionDetails.gameSession.times_played}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">游戏时长</div>
                            <div className="text-lg font-light text-gray-900">
                              {formatDuration(currentSessionDetails.gameSession.total_play_duration || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 视频记录 */}
                  {currentSessionDetails.videoSession && (
                    <div>
                      <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                        学习视频
                      </h3>
                      <div className="bg-gray-50/30 rounded-2xl p-6 border border-gray-100/40">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-light text-gray-900">历史学习视频</span>
                          <span className="px-3 py-1 rounded-full text-xs font-light bg-gray-100 text-gray-600 border border-gray-200">
                            {currentSessionDetails.videoSession.video_status === 'completed' ? '已完成' :
                             currentSessionDetails.videoSession.video_status === 'generating' ? '生成中' : '失败'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">观看次数</div>
                            <div className="text-lg font-light text-gray-900">{currentSessionDetails.videoSession.view_count}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">观看时长</div>
                            <div className="text-lg font-light text-gray-900">
                              {formatDuration(currentSessionDetails.videoSession.total_watch_duration || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 