import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Brain, Video, BookOpen, Target } from "lucide-react"
import { LearningSessionService } from "@/lib/learning-session-service"
import { LearningSession, LearningInteraction, QuizRecord, ReflectionRecord, GameSession, VideoSession } from "@/lib/supabase"

interface SessionDetails {
  session: LearningSession
  interactions: LearningInteraction[]
  quizRecords: QuizRecord[]
  reflections: ReflectionRecord[]
  gameSession: GameSession | null
  videoSession: VideoSession | null
}

interface LearningSessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
}

export function LearningSessionModal({ isOpen, onClose, sessionId }: LearningSessionModalProps) {
  const [currentSessionDetails, setCurrentSessionDetails] = useState<SessionDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // 当模态框打开且有sessionId时加载所有数据
  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails(sessionId)
    }
  }, [isOpen, sessionId])

  // 清理模态框状态
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
      // 重置状态
      setCurrentSessionDetails(null)
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // 加载会话完整详情
  const loadSessionDetails = async (sessionId: string): Promise<void> => {
    try {
      setIsLoadingDetails(true)
      console.log('🔍 正在加载会话完整信息:', sessionId)
      
      // 加载会话完整信息，包括所有相关数据
      const details = await LearningSessionService.getSessionDetails(sessionId)
      console.log('📋 会话完整信息:', details)
      
      setCurrentSessionDetails(details)
    } catch (error) {
      console.error('❌ 加载会话完整信息失败:', error)
    } finally {
      setIsLoadingDetails(false)
    }
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
        onWheel={(e) => {
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
            e.stopPropagation()
          }}
        >
          {/* 模态框头部 */}
          <div className="border-b border-gray-100/60 p-8 flex items-center justify-between flex-shrink-0">
            <div>
              {currentSessionDetails ? (
                <>
                  <h2 className="text-2xl font-light text-gray-900 tracking-tight">
                    {currentSessionDetails.session.original_query}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 font-light">
                    {getCategoryName(currentSessionDetails.session.user_confirmed_category)} • {formatDate(currentSessionDetails.session.created_at)}
                  </p>
                </>
              ) : (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
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
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              e.stopPropagation()
            }}
          >
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">正在加载学习详情...</span>
              </div>
            ) : currentSessionDetails ? (
              <div className="space-y-8 pb-8">
                
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
                      学习交互
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

                {/* 知识检测 */}
                {currentSessionDetails.quizRecords && currentSessionDetails.quizRecords.length > 0 && (
                  <div>
                    <h3 className="text-lg font-light text-gray-900 mb-6 tracking-tight">
                      知识检测
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
                              {quiz.quiz_options && Array.isArray(quiz.quiz_options) ? quiz.quiz_options.map((option: string, optionIndex: number) => {
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
                              }) : (
                                <div className="text-center py-4">
                                  <p className="text-gray-500 text-sm">选项加载中...</p>
                                </div>
                              )}
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

                {/* 深度反思 */}
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

                {/* 互动游戏 */}
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

                {/* 学习视频 */}
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

                {/* 如果没有任何学习记录 */}
                {(!currentSessionDetails.interactions || currentSessionDetails.interactions.length === 0) &&
                 (!currentSessionDetails.quizRecords || currentSessionDetails.quizRecords.length === 0) &&
                 (!currentSessionDetails.reflections || currentSessionDetails.reflections.length === 0) &&
                 !currentSessionDetails.gameSession &&
                 !currentSessionDetails.videoSession && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-2">暂无详细学习记录</div>
                    <div className="text-sm text-gray-400">这个学习会话可能还未完成或数据正在生成中</div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">加载学习详情失败</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 