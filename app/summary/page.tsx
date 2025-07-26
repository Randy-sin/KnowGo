"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle, Clock, Brain, Gamepad2, Video, RotateCcw, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"

interface AnalysisData {
  analysis: string
  insights: string[]
}

interface LearningData {
  topic: string
  category: string
  userLevel: string
  responses: string[]
  questions: string[]
  analyses: AnalysisData[]
  reflections: string[]
  gameCompleted: boolean
  videoCompleted: boolean
  startTime: string
  endTime: string
}

export default function SummaryPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
  const [learningData, setLearningData] = useState<LearningData | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // 收集所有学习数据
    const topic = localStorage.getItem('xknow-query') || ''
    const category = localStorage.getItem('xknow-category') || ''
    const config = localStorage.getItem('xknow-config')
    const responses = JSON.parse(localStorage.getItem('xknow-responses') || '[]')
    const questions = JSON.parse(localStorage.getItem('xknow-pregenerated-questions') || '[]')
    const analyses = JSON.parse(localStorage.getItem('xknow-analyses') || '[]')
    const reflections = JSON.parse(localStorage.getItem('xknow-reflections') || '[]')
    const gameData = localStorage.getItem('xknow-pregenerated-game')
    const videoData = localStorage.getItem('xknow-video-task')
    
    let userLevel = 'intermediate'
    if (config) {
      try {
        const parsedConfig = JSON.parse(config)
        userLevel = parsedConfig.level || 'intermediate'
      } catch (error) {
        console.error('Failed to parse config:', error)
      }
    }

    const data: LearningData = {
      topic,
      category,
      userLevel,
      responses,
      questions: questions.map((q: { question?: string }) => q.question || ''),
      analyses,
      reflections,
      gameCompleted: !!gameData,
      videoCompleted: !!videoData,
      startTime: new Date().toISOString(), // 简化处理
      endTime: new Date().toISOString()
    }

    setLearningData(data)
    
    // 渐进式显示
    setTimeout(() => setShowContent(true), 800)
  }, [])

  // 计算学习统计
  const getStats = () => {
    if (!learningData) return { completedSections: 0, totalTime: '0 min', engagement: 0 }
    
    let completed = 0
    if (learningData.responses.length > 0) completed++
    if (learningData.analyses.length > 0) completed++
    if (learningData.gameCompleted) completed++
    if (learningData.videoCompleted) completed++
    
    return {
      completedSections: completed,
      totalTime: `${Math.floor(Math.random() * 20) + 10} min`, // 模拟时间
      engagement: Math.floor((completed / 4) * 100)
    }
  }

  const handleNewQuery = () => {
    // 清除所有学习数据
    const keys = [
      'xknow-query', 'xknow-category', 'xknow-config', 'xknow-responses',
      'xknow-pregenerated-questions', 'xknow-analyses', 'xknow-reflections',
      'xknow-pregenerated-game', 'xknow-video-task', 'xknow-classification'
    ]
    keys.forEach(key => localStorage.removeItem(key))
    
    router.push('/')
  }

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  if (!isLoaded || !learningData || !showContent) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-1 h-1 bg-secondary rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    )
  }

  const stats = getStats()

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
        
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-light text-primary tracking-tight mb-4">
            {t('summary.title')}
          </h1>
          <p className="text-lg font-light text-secondary">
            {learningData.topic}
          </p>
          <div className="w-12 h-px bg-default mx-auto mt-8"></div>
        </motion.div>

        {/* 学习统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
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
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">{stats.totalTime}</div>
            <div className="text-sm text-secondary">{t('summary.timeInvested')}</div>
          </div>

          <div className="bg-card border border-default rounded-3xl p-6 text-center">
            <div className="w-12 h-12 bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">{stats.engagement}%</div>
            <div className="text-sm text-secondary">{t('summary.engagement')}</div>
          </div>
        </motion.div>

        {/* 学习旅程回顾 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8 mb-16"
        >
          <h2 className="text-2xl font-light text-primary text-center mb-12">{t('summary.yourLearningPath')}</h2>
          
          {/* 思考阶段 */}
          <div className="bg-card border border-default rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-[rgb(var(--background))] text-sm font-medium">1</span>
                </div>
                <h3 className="text-lg font-medium text-primary">{t('summary.deepThinking')}</h3>
              </div>
              <div className="space-y-4">
                {learningData.responses.slice(0, 3).map((response, index) => (
                  <div key={index} className="bg-subtle rounded-2xl p-4">
                    <div className="text-xs text-secondary uppercase tracking-wide mb-2">
                      {t('summary.question')} {index + 1}
                    </div>
                    <p className="text-sm text-primary leading-relaxed">
                      {response || t('summary.noResponse')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI分析阶段 */}
          <div className="bg-card border border-default rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-[rgb(var(--background))] text-sm font-medium">2</span>
                </div>
                <h3 className="text-lg font-medium text-primary">{t('summary.aiInsights')}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-subtle rounded-2xl p-4">
                  <div className="text-xs text-secondary uppercase tracking-wide mb-2">
                    {t('summary.keyInsights')}
                  </div>
                  <div className="space-y-2">
                    {learningData.analyses.slice(0, 3).map((analysis, index) => (
                      <div key={index} className="text-sm text-secondary">
                        • {analysis.insights?.[0] || t('summary.analysisPending')}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-subtle rounded-2xl p-4">
                  <div className="text-xs text-secondary uppercase tracking-wide mb-2">
                    {t('summary.yourReflections')}
                  </div>
                  <div className="text-sm text-secondary">
                    {learningData.reflections.filter(r => r).length} {t('summary.reflectionsRecorded')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 实践阶段 */}
          <div className="bg-card border border-default rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-[rgb(var(--background))] text-sm font-medium">3</span>
                </div>
                <h3 className="text-lg font-medium text-primary">{t('summary.activeLearning')}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 ${learningData.gameCompleted ? 'bg-subtle' : 'bg-subtle/50 border border-default'}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <Gamepad2 className={`w-5 h-5 ${learningData.gameCompleted ? 'text-secondary' : 'text-secondary/60'}`} />
                    <span className="text-sm font-medium text-primary">{t('summary.interactiveGame')}</span>
                  </div>
                  <div className="text-xs text-secondary">
                    {learningData.gameCompleted ? t('summary.completed') : t('summary.notAttempted')}
                  </div>
                </div>
                
                {learningData.category === 'history' && (
                  <div className={`rounded-2xl p-4 ${learningData.videoCompleted ? 'bg-subtle' : 'bg-subtle/50 border border-default'}`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <Video className={`w-5 h-5 ${learningData.videoCompleted ? 'text-secondary' : 'text-secondary/60'}`} />
                      <span className="text-sm font-medium text-primary">{t('summary.historyVideo')}</span>
                    </div>
                    <div className="text-xs text-secondary">
                      {learningData.videoCompleted ? t('summary.generated') : t('summary.pending')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
            className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-primary text-[rgb(var(--background))] rounded-2xl font-medium transition-all duration-300 hover:bg-primary/90"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('summary.startNewJourney')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/profile')}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-card border border-default text-primary rounded-2xl font-medium transition-all duration-300 hover:border-secondary hover:bg-subtle"
          >
            <span>{t('summary.viewAllLearning')}</span>
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