"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { LearningSessionService } from "@/lib/learning-session-service"

interface ReflectionData {
  question: string
  placeholder: string
}

export default function ReflectPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [userLevel, setUserLevel] = useState("")
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null)
  const [reflectionText, setReflectionText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  // 生成反思问题
  const generateReflection = useCallback(async (topic: string, category: string, userLevel: string) => {
    try {
      const response = await fetch('/api/generate-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          category,
          userLevel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate reflection question')
      }

      const data = await response.json()
      setReflectionData(data)
      
      // 渐进式显示
      setTimeout(() => setShowContent(true), 1200)
      
    } catch (error) {
      console.error('Error generating reflection:', error)
      // 使用默认反思问题
      setReflectionData({
        question: `学习"${topic}"最重要的收获是什么？`,
        placeholder: "写下你的思考..."
      })
      setTimeout(() => setShowContent(true), 1200)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    const savedCategory = localStorage.getItem('xknow-category') 
    const savedConfig = localStorage.getItem('xknow-config')
    
    if (savedQuery) {
      setQuery(savedQuery)
      const currentCategory = savedCategory || 'science'
      setCategory(currentCategory)
      
      // 获取用户学习水平
      let currentUserLevel = 'intermediate'
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          currentUserLevel = config.level || 'intermediate'
          setUserLevel(currentUserLevel)
        } catch (error) {
          console.error('Failed to parse config:', error)
        }
      }
      
      // 首先检查是否有预生成的反思问题
      const pregeneratedReflection = localStorage.getItem('xknow-pregenerated-reflection')
      if (pregeneratedReflection) {
        try {
          const reflectionData = JSON.parse(pregeneratedReflection)
          setReflectionData(reflectionData)
          setTimeout(() => setShowContent(true), 800)
          setIsLoading(false)
          console.log('✅ 使用预生成的反思问题:', reflectionData.question)
          return
        } catch (error) {
          console.error('Failed to parse pregenerated reflection:', error)
        }
      }
      
      // 没有预生成问题，才调用API生成
      console.log('⚠️ 没有预生成的反思问题，开始实时生成...')
      generateReflection(savedQuery, currentCategory, currentUserLevel)
    } else {
      router.push('/')
    }
  }, [router, generateReflection])

  const handleContinue = () => {
    if (reflectionText.trim()) {
      // 保存反思内容到localStorage（保持现有逻辑）
      localStorage.setItem('xknow-reflection', reflectionText.trim())
      
      // 如果用户已登录，同时保存到数据库
      if (user?.id && reflectionData) {
        const sessionId = localStorage.getItem('xknow-session-id')
        if (sessionId) {
          LearningSessionService.saveReflection(
            sessionId,
            reflectionData.question,
            reflectionData.placeholder,
            reflectionText.trim()
          ).then(() => {
            console.log('✅ 反思内容已保存到数据库')
          }).catch((error: unknown) => {
            console.error('❌ 保存反思内容失败:', error)
            // 数据库操作失败不影响用户体验
          })
        }
      }
      
      // 检查游戏状态并跳转到游戏界面
      const category = localStorage.getItem('xknow-category')
      const targetRoute = '/simulate' // 所有科目都统一跳转到游戏界面
      
      // 注释：之前的分科目跳转已废弃，现在统一使用游戏界面
      // switch (category) {
      //   case 'science':
      //   case 'history':
      //   case 'others':
      //   default:
      //     targetRoute = '/simulate'
      // }
      
      console.log('反思完成，跳转到:', targetRoute)
      router.push(targetRoute)
    }
  }

  const handleBack = () => {
    router.back()
  }

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  if (isLoading || !reflectionData) {
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* 极简导航 */}
      <div className="absolute top-8 left-8">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 主内容 - 垂直居中 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-4xl">
          
          <AnimatePresence mode="wait">
            {showContent && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-16"
              >

                {/* 反思问题 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 2.5, ease: "easeOut" }}
                    className="text-4xl font-light text-gray-900 leading-relaxed max-w-4xl mx-auto"
                  >
                    {reflectionData.question}
                  </motion.div>
                </motion.div>

                {/* 输入区域 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8 max-w-2xl mx-auto"
                >
                  <div className="relative">
                    <motion.textarea
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.2, duration: 1.0, ease: "easeOut" }}
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder={reflectionData.placeholder}
                      className="w-full h-40 px-0 py-4 text-lg text-gray-900 placeholder-gray-400 bg-transparent border-0 border-b border-gray-200 resize-none focus:outline-none focus:border-gray-400 transition-colors duration-500"
                      style={{ lineHeight: '1.6' }}
                    />
                  </div>

                  {/* 继续按钮 */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: reflectionText.trim() ? 1 : 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex justify-center"
                  >
                    <motion.button
                      onClick={handleContinue}
                      disabled={!reflectionText.trim()}
                      className="px-6 py-2 text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-600 transition-colors duration-500 text-sm font-light"
                      whileHover={{ y: reflectionText.trim() ? -2 : 0 }}
                      whileTap={{ y: reflectionText.trim() ? 0 : 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      继续
                    </motion.button>
                  </motion.div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  )
} 