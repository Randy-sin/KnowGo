"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"

export default function LearnPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [config, setConfig] = useState<{level: string, style: string} | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [currentResponse, setCurrentResponse] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [stages, setStages] = useState<LearningStage[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [userResponses, setUserResponses] = useState<string[]>([])
  const { t } = useTranslations()

  // 智能等待问题生成：先等待后台生成，超时后自己生成
  const waitForQuestionsOrGenerate = useCallback(async (topic: string, userConfig: {level: string, style: string}) => {
    setIsLoadingQuestions(true)
    
    console.log('等待后台问题生成或自主生成...')
    
    // 等待后台生成完成（最多等待3秒，每300ms检查一次）
    let attempts = 0
    const maxAttempts = 10
    
    const checkForQuestions = () => {
      const questions = localStorage.getItem('xknow-pregenerated-questions')
      if (questions) {
        try {
          const parsedQuestions = JSON.parse(questions)
          setStages(parsedQuestions)
          setIsLoadingQuestions(false)
          console.log('后台问题生成完成，已加载')
          return true
        } catch (error) {
          console.error('Failed to parse background generated questions:', error)
        }
      }
      return false
    }
    
    // 立即检查一次
    if (checkForQuestions()) return
    
    // 定期检查后台生成结果
    const interval = setInterval(() => {
      attempts++
      if (checkForQuestions()) {
        clearInterval(interval)
        return
      }
      
      if (attempts >= maxAttempts) {
        // 超时后自己生成
        clearInterval(interval)
        console.log('等待超时，开始自主生成问题')
        generateLearningQuestions(topic, userConfig)
      }
    }, 300)
  }, [])

  // 生成 AI 学习问题
  const generateLearningQuestions = async (topic: string, userConfig: {level: string, style: string}) => {
    setIsLoadingQuestions(true)
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          config: userConfig
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      setStages(data.questions)
    } catch (error) {
      console.error('Error generating questions:', error)
      // 显示错误状态，不提供备用方案
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // 将useEffect移到组件顶部，避免条件性调用
  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    const savedConfig = localStorage.getItem('xknow-config')
    const savedCategory = localStorage.getItem('xknow-category')
    const pregeneratedQuestions = localStorage.getItem('xknow-pregenerated-questions')
    
    if (savedQuery && savedConfig) {
      const parsedConfig = JSON.parse(savedConfig)
      setQuery(savedQuery)
      setConfig(parsedConfig)
      setCategory(savedCategory || '')
      
      // 检查是否有预生成的问题
      if (pregeneratedQuestions) {
        try {
          const questions = JSON.parse(pregeneratedQuestions)
          setStages(questions)
          console.log('使用预生成的问题')
        } catch (error) {
          console.error('Failed to parse pregenerated questions:', error)
          // 如果解析失败，等待后台生成或重新生成
          waitForQuestionsOrGenerate(savedQuery, parsedConfig)
        }
      } else {
        // 没有预生成问题，先等待后台生成
        waitForQuestionsOrGenerate(savedQuery, parsedConfig)
      }
      
      // 渐进式显示内容
      setTimeout(() => setShowContent(true), 600)
      setTimeout(() => setIsTyping(true), 1200)
    } else {
      router.push('/')
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded) {
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

  // AI 生成的三阶段学习问题接口
  interface LearningStage {
    type: "life_connection" | "observation" | "concept_building";
    question: string;
    followUp: string;
  }

  const currentStageData = stages[currentStage]

  // 分析单个问题的函数
  const analyzeQuestion = async (question: string, answer: string, questionIndex: number) => {
    try {
      console.log(`开始分析第${questionIndex + 1}题:`, { question, answer })
      
      const response = await fetch('/api/analyze-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userAnswer: answer,
          topic: query,
          category: category,
          stream: false // 使用非流式，后台分析
        })
      })

      if (response.ok) {
        const analysis = await response.json()
        
        // 将分析结果保存到localStorage
        const existingAnalyses = JSON.parse(localStorage.getItem('xknow-analyses') || '[]')
        existingAnalyses[questionIndex] = {
          question,
          userAnswer: answer,
          aiAnalysis: analysis.analysis,
          insights: analysis.insights
        }
        localStorage.setItem('xknow-analyses', JSON.stringify(existingAnalyses))
        
        console.log(`第${questionIndex + 1}题分析完成`)
      } else {
        console.error(`第${questionIndex + 1}题分析失败:`, response.status)
      }
    } catch (error) {
      console.error(`第${questionIndex + 1}题分析出错:`, error)
    }
  }

  // 后台生成反思问题的函数
  const generateReflectionInBackground = async () => {
    try {
      console.log('🤔 开始后台生成反思问题...')
      
      const response = await fetch('/api/generate-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: query,
          category: category || 'science',
          userLevel: config?.level || 'intermediate'
        })
      })

      if (response.ok) {
        const reflectionData = await response.json()
        localStorage.setItem('xknow-pregenerated-reflection', JSON.stringify(reflectionData))
        console.log('✅ 反思问题预生成完成:', reflectionData.question)
      } else {
        console.error('❌ 反思问题生成失败:', response.status)
      }
    } catch (error) {
      console.error('❌ 反思问题生成出错:', error)
    }
  }

  const handleContinue = () => {
    if (currentResponse.trim() && currentStageData) {
      const newResponse = currentResponse.trim()
      const updatedResponses = [...userResponses, newResponse]
      setUserResponses(updatedResponses)
      setCurrentResponse("")
      
      // 立即开始AI分析当前问题（后台异步执行）
      const currentQuestion = currentStageData.question
      const questionIndex = currentStage
      
      // 使用try-catch包装异步分析，避免未处理的Promise错误
      analyzeQuestion(currentQuestion, newResponse, questionIndex).catch(error => {
        console.error('分析问题时出错，但不影响继续:', error)
      })
      
      if (currentStage < stages.length - 1) {
        // 进入下一阶段
        console.log(`准备进入第${currentStage + 2}阶段，总共${stages.length}阶段`)
        setCurrentStage(prev => prev + 1)
        setIsTyping(false)
        setTimeout(() => {
          console.log(`开始显示第${currentStage + 2}阶段问题`)
          setIsTyping(true)
        }, 800)
      } else {
        // 完成所有阶段，保存回答并跳转到反馈页面
        localStorage.setItem('xknow-responses', JSON.stringify(updatedResponses))
        console.log('All stages completed. Responses:', updatedResponses)
        
        // 后台预生成反思问题（作为后备方案）
        generateReflectionInBackground()
        
        // 跳转到反馈页面
        console.log('跳转到反馈页面')
        router.push('/feedback')
      }
    }
  }

  const handleNewQuery = () => {
    localStorage.removeItem('xknow-query')
    localStorage.removeItem('xknow-config')
    router.push('/')
  }

  if (!config || !showContent || isLoadingQuestions || stages.length === 0) {
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
          onClick={handleNewQuery}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 主内容 - 垂直居中 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center space-y-12">
          
          {/* 学习主题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-light text-gray-900 tracking-tight">
              {query}
            </h1>
            <div className="w-8 h-px bg-gray-200 mx-auto"></div>
          </motion.div>

          {/* AI 引导问题 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isTyping ? 1 : 0, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              
              {/* 问题文本 */}
              {currentStageData && stages.length > 0 && currentStage < stages.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-xl font-light text-gray-700 leading-relaxed">
                    {currentStageData.question}
                  </p>
                  <p className="text-sm font-light text-gray-500 italic">
                    {currentStageData.followUp}
                  </p>
                </motion.div>
              )}

              {/* 思考引导 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="space-y-6"
              >
                
                {/* 输入区域 */}
                <div className="space-y-4">
                  <motion.textarea
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder={t('learn.shareThoughts')}
                    className="w-full h-32 px-0 py-4 text-lg font-light text-gray-800 placeholder:text-gray-400 bg-transparent border-none resize-none focus:outline-none"
                    style={{
                      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
                    }}
                  />
                  
                  {/* 底部边线 */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1.8 }}
                    className="h-px bg-gray-200 origin-left"
                  />
                </div>

                {/* 继续按钮 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentResponse.trim() ? 1 : 0.3 }}
                  transition={{ duration: 0.4 }}
                  className="pt-4"
                >
                  <motion.button
                    onClick={handleContinue}
                    disabled={!currentResponse.trim()}
                    whileHover={currentResponse.trim() ? { scale: 1.02 } : {}}
                    whileTap={currentResponse.trim() ? { scale: 0.98 } : {}}
                    className={`inline-flex items-center space-x-3 px-8 py-3 text-sm font-medium tracking-wide transition-all duration-300 ${
                      currentResponse.trim()
                        ? 'text-gray-900 hover:text-black cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {stages.length > 0 && currentStage === stages.length - 1 ? t('learn.beginLearning') : t('common.continue')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 底部进度指示 */}
      {stages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="pb-8 flex justify-center"
        >
          <div className="flex space-x-1">
            {stages.map((stage: LearningStage, index: number) => (
              <div
                key={index}
                className={`h-px transition-all duration-500 ${
                  index <= currentStage ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
} 