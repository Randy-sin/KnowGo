"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Brain, Clock, Globe, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import type { QuestionCategory, ClassificationResult } from "@/lib/classifier-service"

export default function ClassifyPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isClassifying, setIsClassifying] = useState(false)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null)

  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    if (savedQuery) {
      setQuery(savedQuery)
      // 分类和问题生成并行执行，但分类完成后立即显示结果
      classifyTopic(savedQuery)
      generateContent(savedQuery)
    } else {
      router.push('/')
    }
  }, [router])

  // 分类问题
  const classifyTopic = async (topic: string) => {
    setIsClassifying(true)
    try {
      const response = await fetch('/api/classify-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic })
      })

      if (!response.ok) {
        throw new Error('Failed to classify question')
      }

      const data = await response.json()
      setClassification(data.classification)
      // 预选AI推荐的类别
      setSelectedCategory(data.classification.category)
      // 分类完成后立即显示结果
      setIsClassifying(false)
    } catch (error) {
      console.error('Error classifying question:', error)
      setIsClassifying(false)
    }
  }

  // 生成内容（只有理科调用API，其他为静态）
  const generateContent = async (topic: string) => {
    try {
      console.log('Starting content generation for topic:', topic)
      // 只为理科生成问题，其他分类使用静态页面
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error generating content:', error)
    }
  }

  // 确认选择
  const handleConfirm = () => {
    if (!selectedCategory) return
    
    setShowConfirmation(true)
    
    // 保存分类结果
    localStorage.setItem('xknow-category', selectedCategory)
    
    // 根据分类决定跳转路径
    let targetRoute = '/configure'
    
    if (selectedCategory === 'science') {
      // 理科：保存预生成的问题，正常流程
      if (generatedQuestions) {
        localStorage.setItem('xknow-pregenerated-questions', JSON.stringify(generatedQuestions))
      }
      targetRoute = '/configure'
    } else if (selectedCategory === 'history') {
      // 历史：跳转到历史静态页面
      targetRoute = '/history'
    } else if (selectedCategory === 'geography') {
      // 地理：跳转到地理静态页面
      targetRoute = '/geography'
    }
    
    setTimeout(() => {
      router.push(targetRoute)
    }, 1200)
  }

  const handleBack = () => {
    localStorage.removeItem('xknow-query')
    router.push('/')
  }

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded || !query) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    )
  }

  const categories = [
    {
      id: "science" as QuestionCategory,
      title: "理科",
      subtitle: "数学・物理・化学・生物",
      icon: Brain,
      description: "深度理解理科概念，配合互动模拟器学习"
    },
    {
      id: "history" as QuestionCategory,
      title: "历史",
      subtitle: "历史事件・人物・时代",
      icon: Clock,
      description: "通过视频内容生动了解历史知识"
    },
    {
      id: "geography" as QuestionCategory,
      title: "文科",
      subtitle: "地理・语言・社会・艺术",
      icon: Globe,
      description: "系统性学习文科知识要点"
    }
  ]

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-white/95 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-light text-gray-900 mb-3"
          >
            选择确认
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-gray-500 font-light"
          >
            正在准备你的学习内容
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extralight text-gray-900 mb-4 tracking-tight">
            智能分类
          </h1>
          <p className="text-lg text-gray-500 mb-8 font-light">
            正在分析 "<span className="text-gray-900 font-normal">{query}</span>"
          </p>

          {/* AI 分析状态 */}
          <AnimatePresence mode="wait">
            {isClassifying ? (
              <motion.div
                key="classifying"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center space-x-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-gray-300 border-t-gray-900 rounded-full"
                />
                <span className="text-sm text-gray-500 font-light">AI 正在分析...</span>
              </motion.div>
            ) : classification ? (
              <motion.div
                key="classified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100"
              >
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <span className="text-sm text-gray-700 font-medium">
                  AI 建议：{categories.find(c => c.id === classification.category)?.title}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(classification.confidence * 100)}%
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* 分类选项 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-3 mb-8"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <motion.button
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                className={`w-full p-5 rounded-2xl border transition-all duration-200 text-left relative group ${
                  selectedCategory === category.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* AI 推荐指示器 */}
                {classification && classification.category === category.id && (
                  <div className="absolute top-5 right-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-gray-900 rounded-full"
                    />
                  </div>
                )}

                {/* 选中状态指示器 */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {selectedCategory === category.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full m-0.5"
                      />
                    )}
                  </div>
                </div>

                <div className="ml-9">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <category.icon className="w-4 h-4 text-gray-600" />
                    </div>
                                          <div>
                        <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-400 font-light">{category.subtitle}</p>
                      </div>
                  </div>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* AI 分析结果 */}
        {classification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-gray-400 font-light max-w-2xl mx-auto">
              AI 分析：{classification.reasoning}
            </p>
          </motion.div>
        )}

        {/* 确认按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            onClick={handleConfirm}
            disabled={!selectedCategory}
            whileHover={selectedCategory ? { y: -2 } : {}}
            whileTap={selectedCategory ? { y: 0 } : {}}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl font-medium transition-all duration-200 ${
              selectedCategory
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>确认选择</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
} 