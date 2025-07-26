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

// 新闻数据类型
interface NewsItem {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  timestamp: string
}

// 硬编码新闻数据 - 符合学习平台主题
const newsData: NewsItem[] = [
  {
    id: "1",
    title: "AI驱动的个性化学习正在重塑教育行业",
    excerpt: "最新研究显示，基于机器学习的个性化教育系统能够提高学习效率67%。",
    category: "教育科技",
    readTime: "3分钟",
    timestamp: "2小时前"
  },
  {
    id: "2", 
    title: "互动式学习体验的未来趋势",
    excerpt: "游戏化学习和沉浸式体验正成为教育技术的主流。",
    category: "学习方法",
    readTime: "4分钟", 
    timestamp: "5小时前"
  },
  {
    id: "3",
    title: "知识图谱技术在学习平台中的应用",
    excerpt: "通过构建知识图谱，AI可以更好地理解学科之间的关联性。",
    category: "技术创新",
    readTime: "5分钟",
    timestamp: "1天前"
  },
  {
    id: "4",
    title: "深度学习在教育评估中的突破",
    excerpt: "新一代AI评估系统不仅能评判答案正确性，更能理解学习者的思维过程。",
    category: "AI技术",
    readTime: "6分钟",
    timestamp: "2天前"
  },
  {
    id: "5",
    title: "微学习模式的兴起与实践",
    excerpt: "碎片化学习时代，如何通过微学习提升知识吸收效率。",
    category: "学习方法",
    readTime: "3分钟",
    timestamp: "3天前"
  },
  {
    id: "6",
    title: "虚拟现实在STEM教育中的应用",
    excerpt: "VR技术让抽象的科学概念变得生动具体，提升学习体验。",
    category: "教育科技",
    readTime: "4分钟",
    timestamp: "4天前"
  },
  {
    id: "7",
    title: "自适应学习算法的新进展",
    excerpt: "通过分析学习行为数据，AI能够实时调整教学策略和内容难度。",
    category: "AI技术",
    readTime: "5分钟",
    timestamp: "5天前"
  },
  {
    id: "8",
    title: "多模态学习内容的创新应用",
    excerpt: "结合文字、图像、音频和视频的综合学习体验正在改变传统教育。",
    category: "技术创新",
    readTime: "4分钟",
    timestamp: "6天前"
  },
  {
    id: "9",
    title: "认知科学在数字化学习中的应用",
    excerpt: "基于认知负荷理论的学习界面设计能够显著提升学习效果。",
    category: "学习方法",
    readTime: "6分钟",
    timestamp: "1周前"
  },
  {
    id: "10",
    title: "区块链技术在教育认证中的创新",
    excerpt: "去中心化的学历认证系统为终身学习提供了可信的记录方式。",
    category: "技术创新",
    readTime: "5分钟",
    timestamp: "1周前"
  },
  {
    id: "11",
    title: "情感AI在学习动机激发中的作用",
    excerpt: "通过识别学习者的情感状态，AI助手能够提供更有针对性的鼓励和支持。",
    category: "AI技术",
    readTime: "4分钟",
    timestamp: "1周前"
  },
  {
    id: "12",
    title: "协作学习平台的社交化发展趋势",
    excerpt: "将社交网络元素融入学习平台，创造更具吸引力的学习社区。",
    category: "学习方法",
    readTime: "3分钟",
    timestamp: "2周前"
  }
]

// 简化的新闻卡片组件
function CompactNewsCard({ news, index }: { news: NewsItem; index: number }) {
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
          {news.category}
        </span>
        <div className="flex items-center space-x-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">{news.readTime}</span>
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug group-hover:text-gray-700 transition-colors line-clamp-2 tracking-tight">
        {news.title}
      </h3>

      {/* 摘要 */}
      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-3 font-light">
        {news.excerpt}
      </p>

      {/* 时间戳和阅读指示 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400 font-medium">{news.timestamp}</span>
        <div className="flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
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
  
  // 页面加载时重置状态
  useEffect(() => {
    // 重置所有滚动相关状态
    firstScrollTriggered.current = false
    scrollLockRef.current = false
    setScrollStage(0)
    setShowGradient(false)
    setLockedScrollPosition(0)
  }, [])
  
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
        'others', // 默认类别，将在classify页面确认
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
            <p className="text-xs text-gray-500 font-light">再次滑动继续浏览</p>
          </div>
        </motion.div>
        
        {/* 主页区域 - 带视差效果 */}
      <section className="relative h-screen overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/20 to-gray-50/40" />
        
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
          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-12"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-8">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </motion.div>

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
                <span className="text-sm font-medium tracking-wide">探索学习新闻</span>
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
                请先登录以开始您的学习之旅
              </p>
              <Link href="/sign-in">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="button-primary btn-text-large px-12 py-4"
                >
                  立即登录
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
          {/* 新闻网格 - 渐进式展示 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {newsData.map((news, index) => {
              // 第一阶段只显示前6个卡片（约第一行和第二行一半）
              const shouldShowInStage1 = index < 6
              const shouldShow = scrollStage === 0 ? false : 
                               scrollStage === 1 ? shouldShowInStage1 : true
              
              return (
                <motion.div
                  key={news.id}
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
                  <CompactNewsCard news={news} index={index} />
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>


    </div>
  )
}
