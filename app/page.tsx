"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Clock, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"
import { LearningSessionService } from "@/lib/learning-session-service"
import Parallax from "@/components/ui/parallax"

// 历史记录数据类型
interface HistoryItem {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  timestamp: string
  status: string
}



// 简化的历史记录卡片组件
function CompactHistoryCard({ historyItem, index, t }: { historyItem: HistoryItem; index: number; t: (key: string) => string }) {
  return (
    <motion.article
      whileHover={{ 
        y: -4,
        scale: 1.01,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)"
      }}
      className="backdrop-blur-sm border border-gray-200/60 rounded-2xl p-5 hover:border-gray-300/80 transition-all duration-300 hover:shadow-xl group cursor-pointer h-full"
    >
      {/* 分类标签和时间 */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center px-3 py-1.5 bg-gray-100/70 text-gray-600 text-xs font-medium rounded-lg tracking-wide">
          {historyItem.category}
        </span>
        <div className="flex items-center space-x-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">{historyItem.readTime}</span>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug group-hover:text-gray-700 transition-colors line-clamp-2 tracking-tight">
        {historyItem.title}
      </h3>

      {/* 摘要 */}
      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-3 font-light">
        {historyItem.excerpt}
      </p>

      {/* 时间戳和学习指标 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400 font-medium">{historyItem.timestamp}</span>
        {/* 显示学习深度指标 */}
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          {historyItem.status === 'completed' && (
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-green-600">{t('common.completed')}</span>
            </div>
          )}
          {historyItem.status === 'in_progress' && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-600">{t('common.inProgress')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [input, setInput] = useState("")
  const containerRef = useRef(null)
  const newsRef = useRef(null)
  
  // 渐进式滚动状态管理
  const [scrollStage, setScrollStage] = useState(0) // 0: 初始, 1: 第一次滚动锁定, 2: 完全解锁
  const [showGradient, setShowGradient] = useState(false)
  const [lockedScrollPosition, setLockedScrollPosition] = useState(0)
  const scrollLockRef = useRef(false)
  const firstScrollTriggered = useRef(false) // 即时标记，防止重复触发
  
  // 历史记录状态管理
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const { t } = useTranslations()

  // 主页的滚动视差效果
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  // 新闻区域的滚动检测
  const { scrollYProgress: newsScrollProgress } = useScroll({
    target: newsRef,
    offset: ["start end", "end end"]
  })
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95])
  
  // 页面加载时重置状态和获取历史记录
  useEffect(() => {
    // 重置所有滚动相关状态
    firstScrollTriggered.current = false
    scrollLockRef.current = false
    setScrollStage(0)
    setShowGradient(false)
    setLockedScrollPosition(0)
    
    // 获取用户历史记录
    loadUserHistory()
  }, [isLoaded, isSignedIn, user])
  
  // 获取用户学习历史
  const loadUserHistory = async () => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      // 未登录用户不显示任何历史数据
      setHistoryData([])
      return
    }
    
    setIsLoadingHistory(true)
    try {
      const sessions = await LearningSessionService.getUserLearningHistoryWithSummaries(user.id, 12)
      
      // 转换数据库数据为UI需要的格式
      const historyItems: HistoryItem[] = sessions.map(session => ({
        id: session.id,
        title: session.original_query,
        excerpt: session.intelligentSummary || `探索${session.user_confirmed_category || '未知'}领域的学习内容`,
        category: session.user_confirmed_category === 'science' ? t('profile.science') :
                 session.user_confirmed_category === 'history' ? t('profile.history') : t('profile.others'),
        readTime: session.total_duration && session.total_duration > 0 ? 
          `${Math.round(session.total_duration / 60)}${t('profile.minutes')}` : 
          session.status === 'completed' ? t('common.completed') : t('common.inProgress'),
        timestamp: formatRelativeTime(session.created_at || ''),
        status: session.status || 'in_progress'
      }))
      
      setHistoryData(historyItems)
    } catch (error) {
      console.error('获取学习历史失败:', error)
      setHistoryData([])
    } finally {
      setIsLoadingHistory(false)
    }
  }
  
  // 格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) return '刚刚'
    if (diffInHours < 24) return `${diffInHours}小时前`
    if (diffInDays < 7) return `${diffInDays}天前`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`
    return `${Math.floor(diffInDays / 30)}个月前`
  }
  
  // 渐进式两段滚动处理
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const isScrollingDown = e.deltaY > 0
      const currentScrollY = window.scrollY
      
      // 第一次滚动检测 - 使用即时标记
      if (!firstScrollTriggered.current && scrollStage === 0 && isScrollingDown && currentScrollY < 200) {
        e.preventDefault()
        e.stopPropagation()
        
        // 立即设置标记，防止后续滚动
        firstScrollTriggered.current = true
        scrollLockRef.current = true
        
        // 添加body锁定类
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
        
        // 计算锁定位置
        const targetPosition = window.innerHeight + 280
        
        // 立即设置状态
        setScrollStage(1)
        setShowGradient(true)
        setLockedScrollPosition(targetPosition)
        
        // 立即滚动到锁定位置
        setTimeout(() => {
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.width = ''
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        }, 100)
        
        return false
      } 
      
      // 在锁定状态下，阻止所有滚动（使用ref而不是state）
      if (scrollLockRef.current) {
        if (isScrollingDown && firstScrollTriggered.current) {
          // 第二次向下滚动：解锁
          setScrollStage(2)
          scrollLockRef.current = false
          firstScrollTriggered.current = false
          
          // 清理body样式
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.width = ''
        } else {
          // 其他滚动：完全阻止
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // 强化的滚动锁定逻辑
      if (scrollLockRef.current && lockedScrollPosition > 0) {
        const diff = Math.abs(currentScrollY - lockedScrollPosition)
        
        // 更严格的位置控制
        if (diff > 10) {
          window.scrollTo({
            top: lockedScrollPosition,
            behavior: 'auto'
          })
        }
      }
    }
    
    // 添加键盘事件监听，防止键盘滚动
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scrollLockRef.current) {
        // 阻止空格键、方向键、Page Up/Down等滚动操作
        if (['Space', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.code)) {
          if (e.code === 'ArrowDown' || e.code === 'Space' || e.code === 'PageDown') {
            // 如果是向下操作，且已经第一次触发，则解锁
            if (firstScrollTriggered.current) {
              setScrollStage(2)
              scrollLockRef.current = false
              firstScrollTriggered.current = false
              
              // 清理body样式
              document.body.style.overflow = ''
              document.body.style.position = ''
              document.body.style.width = ''
              return
            }
          }
          e.preventDefault()
          return false
        }
      }
    }
    
    // 添加触摸事件监听，防止触摸滚动
    const handleTouchMove = (e: TouchEvent) => {
      if (scrollLockRef.current) {
        e.preventDefault()
        return false
      }
    }
    
    // 添加所有事件监听
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleScroll, { passive: false })
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchmove', handleTouchMove)
      
      // 清理body样式
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [scrollStage, lockedScrollPosition])
  
  // 直接控制新闻背景透明度 - 滚动到底部时完全不透明

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // 🔍 添加调试信息
    console.log('🔍 用户状态检查:')
    console.log('- isLoaded:', isLoaded)
    console.log('- isSignedIn:', isSignedIn) 
    console.log('- user?.id:', user?.id)
    console.log('- 查询内容:', input.trim())

    try {
      const response = await fetch('/api/classify-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: input.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to classify question')
      }

      const data = await response.json()
      console.log('分类结果:', data)
      
      // 保存到localStorage
      localStorage.setItem('xknow-query', input.trim())
      localStorage.setItem('xknow-classification', JSON.stringify(data))
      
      // 🔍 检查数据库操作条件
      if (user?.id) {
        console.log('✅ 用户已登录，准备创建学习会话')
        console.log('- 用户ID:', user.id)
        await createInitialLearningSession(user.id, input.trim(), data)
      } else {
        console.log('⚠️ 用户未登录，跳过数据库操作')
        console.log('- isLoaded:', isLoaded)
        console.log('- isSignedIn:', isSignedIn)
        console.log('- user:', user)
      }
      
      router.push('/configure')
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      // setIsLoading(false) // This state variable is not defined in the original file
    }
  }

  // 后台分类函数
  const classifyQuestionInBackground = async (query: string) => {
    try {
      console.log('开始后台分类:', query)
      
      const response = await fetch('/api/classify-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: query })
      })

      if (response.ok) {
        const classification = await response.json()
        
        // 分类完成后保存到localStorage（保持现有逻辑）
        localStorage.setItem('xknow-classification', JSON.stringify(classification))
        console.log('后台分类完成:', classification)
        
        // 如果用户已登录，同时将数据保存到数据库
        if (user?.id) {
          try {
            // 创建学习会话记录，但不需要用户配置
            // 配置将在configure页面完成后更新
            await createInitialLearningSession(user.id, query, classification)
          } catch (dbError) {
            console.error('创建学习会话失败:', dbError)
            // 数据库操作失败不影响用户体验，继续使用localStorage
          }
        }
      } else {
        console.error('分类失败:', response.status)
      }
    } catch (error) {
      console.error('后台分类出错:', error)
    }
  }

  // 创建初始学习会话
  const createInitialLearningSession = async (userId: string, query: string, classification: object) => {
    try {
      // 创建临时配置，将在configure页面完成后更新
      const tempConfig = { level: 'intermediate' as const, style: 'structured' }
      
      const sessionId = await LearningSessionService.createSession(
        userId,
        query,
        classification,
        tempConfig
      )
      
      // 保存会话ID到localStorage，供后续页面使用
      localStorage.setItem('xknow-session-id', sessionId)
      console.log('✅ 学习会话已创建:', sessionId)
    } catch (error) {
      console.error('❌ 创建学习会话失败:', error)
      throw error
    }
  }

  return (
        <div ref={containerRef} className="relative">
        {/* 滚动提示 - 第一阶段锁定时显示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: scrollStage === 1 ? 1 : 0,
            y: scrollStage === 1 ? 0 : 20
          }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 text-center pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-full px-4 py-2 border border-gray-200/50 shadow-lg">
            <p className="text-xs text-gray-500 font-light">{t('home.scrollHint')}</p>
          </div>
        </motion.div>
        
        {/* 主页区域 - 带视差效果 */}
      <section className="relative h-screen overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/20 to-gray-50/40" />
        
        {/* 左上角Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute top-8 left-8 z-20"
        >
          <img 
            src="/logo.png" 
            alt="Xknow"
            className="h-20 w-auto opacity-90 filter grayscale-[0.1]"
          />
        </motion.div>

        {/* 右上角语言切换和登录状态 */}
        <div className="absolute top-8 right-8 flex items-center space-x-4 z-20">
          <LanguageToggle />
          <SignedOut>
            <Link href="/sign-in">
              <button className="btn-ghost-minimal">
                {t('common.signIn')}
              </button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/profile">
              <button className="btn-ghost-minimal flex items-center gap-2 text-sm">
                {t('common.profile')}
              </button>
            </Link>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                }
              }}
            />
          </SignedIn>
        </div>

        {/* 主页内容 - 带视差效果 */}
        <motion.div 
          style={{ 
            y: heroY, 
            opacity: heroOpacity,
            scale: heroScale
          }}
          className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6"
        >


          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-8 mb-16 max-w-4xl"
          >
            <h1 className="heading-xl tracking-tight">
              {t('home.title')}
            </h1>
            <p className="text-subtitle max-w-2xl mx-auto font-light">
              {t('home.subtitle')}
            </p>
          </motion.div>

          {/* Search interface - 只对登录用户显示 */}
          <SignedIn>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-2xl space-y-6 mb-16"
            >
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="input-minimal pr-16"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>

              {/* Quick suggestions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-wrap justify-center gap-2 text-sm"
              >
                {[
                  { key: 'machineLearning', fallback: 'Machine Learning' },
                  { key: 'reactHooks', fallback: 'React Hooks' },
                  { key: 'designSystems', fallback: 'Design Systems' },
                  { key: 'dataScience', fallback: 'Data Science' }
                ].map((suggestion, index) => (
                  <motion.button
                    key={suggestion.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.45 + index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInput(t(`home.suggestions.${suggestion.key}`) || suggestion.fallback)}
                    className="btn-ghost-minimal btn-text font-medium"
                  >
                    {t(`home.suggestions.${suggestion.key}`) || suggestion.fallback}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>

            {/* 探索提示 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center space-y-4"
            >
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex flex-col items-center space-y-3 text-gray-600/80 hover:text-gray-800 transition-colors duration-500 cursor-pointer"
                onClick={() => {
                  // 检查是否在锁定状态
                  if (scrollLockRef.current) {
                    return // 在锁定状态下阻止点击滚动
                  }
                  
                  const newsSection = document.querySelector('section[class*="bg-gray-50"]')
                  newsSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <span className="text-sm font-medium tracking-wide">{t('home.exploreLearningHistory')}</span>
                <div className="flex flex-col items-center space-y-1">
                  <ArrowDown className="w-4 h-4" />
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="w-1 h-1 bg-gray-400 rounded-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          </SignedIn>

          {/* 未登录用户显示登录提示 */}
          <SignedOut>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center space-y-6"
            >
              <p className="text-subtitle font-light">
                {t('home.signInToStart')}
              </p>
              <Link href="/sign-in">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="button-primary btn-text-large px-12 py-4"
                >
                  {t('home.signInNow')}
                </motion.button>
              </Link>
            </motion.div>
          </SignedOut>
        </motion.div>

        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50/40 to-transparent pointer-events-none" />
      </section>

      {/* 新闻区域 - 简洁背景 */}
      <motion.section 
        ref={newsRef}
        className="relative py-12 pb-20 bg-gray-50/40"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: scrollStage > 0 ? 1 : 0,
          y: scrollStage > 0 ? 0 : 40
        }}
        transition={{ 
          duration: 1, 
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.2
        }}
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SignedOut>
            {/* 未登录用户显示登录提示 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: scrollStage > 0 ? 1 : 0,
                y: scrollStage > 0 ? 0 : 20
              }}
              transition={{ 
                duration: 1, 
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.4
              }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.exploreLearningHistory')}</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {t('home.viewHistory')}
              </p>
              <Link href="/sign-in">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="button-primary btn-text px-8 py-3"
                >
                  {t('home.signInToView')}
                </motion.button>
              </Link>
            </motion.div>
          </SignedOut>

          <SignedIn>
            {/* 历史记录网格 - 渐进式展示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {isLoadingHistory ? (
                // 加载状态
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : historyData.length === 0 ? (
                // 空状态 - 已登录但没有学习历史
                <div className="col-span-full text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.startJourney')}</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {t('home.emptyStateDesc')}
                  </p>
                </div>
              ) : (
                historyData.map((historyItem, index) => {
                  // 第一阶段只显示前6个卡片（约第一行和第二行一半）
                  const shouldShowInStage1 = index < 6
                  const shouldShow = scrollStage === 0 ? false : 
                                   scrollStage === 1 ? shouldShowInStage1 : true
                  
                  return (
                    <motion.div
                      key={historyItem.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ 
                        opacity: shouldShow ? 1 : 0,
                        y: shouldShow ? 0 : 20,
                        scale: shouldShow ? 1 : 0.95
                      }}
                      transition={{ 
                        duration: 0.6, 
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: shouldShow ? 0.3 + (index * 0.1) : 0
                      }}
                      style={{
                        display: scrollStage === 1 && !shouldShowInStage1 ? 'none' : 'block'
                      }}
                    >
                      <CompactHistoryCard historyItem={historyItem} index={index} t={t} />
                    </motion.div>
                  )
                })
              )}
            </div>
          </SignedIn>
        </div>
      </motion.section>


    </div>
  )
}
