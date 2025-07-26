"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Clock, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"
import Parallax, { ScrollReveal } from "@/components/ui/parallax"

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

// 优化的新闻卡片组件
function CompactNewsCard({ news, index }: { news: NewsItem; index: number }) {
  // 根据卡片位置计算基础透明度
  const cardPosition = index / 11 // 总共12张卡片，index从0开始
  const baseOpacity = Math.min(1, 0.75 + (cardPosition * 0.25)) // 后面的卡片更不透明，最后几张完全不透明
  
  return (
    <ScrollReveal delay={index * 0.05} className="h-full">
      <motion.article
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        whileInView={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            duration: 0.5,
            delay: index * 0.05,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }}
        whileHover={{ 
          y: -4,
          scale: 1.01,
          backgroundColor: "rgba(255, 255, 255, 1)",
          transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
        }}
        viewport={{ once: true, margin: "-10%" }}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${baseOpacity})`
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
    </ScrollReveal>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const containerRef = useRef(null)
  const newsRef = useRef(null)
  
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
  
  // 直接控制新闻背景透明度 - 滚动到底部时完全不透明

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // 立即保存问题并跳转，不等待分类结果
    localStorage.setItem('xknow-query', input.trim())
    
    // 立即跳转到配置页面，提供流畅体验
    router.push('/configure')
    
    // 后台执行问题分类（游戏将在configure页面生成）
    classifyQuestionInBackground(input.trim())
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
        
        // 分类完成后保存结果
        localStorage.setItem('xknow-classification', JSON.stringify(classification))
        console.log('后台分类完成:', classification)
      } else {
        console.error('分类失败:', response.status)
      }
    } catch (error) {
      console.error('后台分类出错:', error)
    }
  }

  return (
    <div ref={containerRef} className="relative">
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
      <section 
        ref={newsRef}
        className="relative py-12 pb-20 bg-gray-50/40"
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* 新闻网格 - 简洁展示 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {newsData.map((news, index) => (
              <CompactNewsCard key={news.id} news={news} index={index} />
            ))}
          </div>
        </div>
              </section>


    </div>
  )
}
