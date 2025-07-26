"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, Trophy, TrendingUp, Play, Video, Brain, Target, X, ChevronDown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { LearningSessionService } from "@/lib/learning-session-service"
import { LearningSession, UserStats } from "@/lib/supabase"
import { useTranslations } from "@/lib/use-translations"
import { LearningSessionModal } from "@/components/ui/learning-session-modal"



export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
  
  const [learningHistory, setLearningHistory] = useState<LearningSession[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 详情模态框相关状态
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadUserData()
    }
  }, [isLoaded, isSignedIn, user])



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

  // 处理查看详情
  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId)
      setShowDetailModal(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setShowDetailModal(false)
    setSelectedSessionId(null)
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
                        onClick={() => handleViewDetails(session.id)}
                      >
                        查看详情
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 学习详情模态框 */}
      <LearningSessionModal
        isOpen={showDetailModal}
        onClose={closeModal}
        sessionId={selectedSessionId}
      />
    </div>
  )
} 