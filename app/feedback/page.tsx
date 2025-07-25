"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"
import { QuizQuestion } from "@/lib/quiz-service"

interface UserResponse {
  question: string
  userAnswer: string
  aiAnalysis: string
  insights: string[]
  isLoading?: boolean
}

export default function FeedbackPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [userLevel, setUserLevel] = useState("intermediate")
  const [userResponses, setUserResponses] = useState<string[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisData, setAnalysisData] = useState<UserResponse[]>([])
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  
  // 新增：题目相关状态
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState(false)
  const [currentStage, setCurrentStage] = useState<'reflection' | 'quiz'>('reflection')
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizGenerationMessage, setQuizGenerationMessage] = useState("")

  // AI生成题目的函数
  const generateQuizForTopic = async () => {
    if (!query || !category) return
    
    // 获取当前引导式问题和用户回答
    const currentData = analysisData[currentIndex]
    if (!currentData || !currentData.question) {
      console.log('没有找到引导式问题数据，跳过quiz生成')
      return
    }
    
    // 首先检查是否有预生成的题目
    const savedQuiz = localStorage.getItem('xknow-quiz')
    if (savedQuiz) {
      try {
        const quiz = JSON.parse(savedQuiz)
        console.log('使用预生成的quiz题目:', quiz)
        setCurrentQuiz(quiz)
        return
      } catch (error) {
        console.error('Failed to parse saved quiz:', error)
        // 如果解析失败，继续生成新题目
      }
    }
    
    const currentQuestion = currentData.question
    const currentUserAnswer = currentData.userAnswer || ''
    
    console.log('基于引导式问题生成quiz:', {
      question: currentQuestion,
      userAnswer: currentUserAnswer,
      category,
      userLevel
    })
    
    setIsGeneratingQuiz(true)
    setQuizGenerationMessage("AI正在基于你的学习内容生成检测题目...")
    
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: query,
          guidedQuestion: currentQuestion,  // 必须传入引导式问题
          userAnswer: currentUserAnswer,    // 传入用户回答
          category: category,
          userLevel: userLevel,
          stream: true // 启用流式输出
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue
              
              const data = JSON.parse(jsonStr)
              
              switch (data.type) {
                case 'start':
                  console.log('Quiz generation started:', data.message)
                  setQuizGenerationMessage(data.message)
                  break
                  
                case 'progress':
                  console.log('Progress:', data.message)
                  setQuizGenerationMessage(data.message)
                  break
                  
                case 'complete':
                  if (data.quiz) {
                    setCurrentQuiz(data.quiz)
                    setQuizGenerationMessage("题目生成完成！")
                    console.log('Quiz generated successfully:', data.quiz)
                  }
                  break
                  
                case 'error':
                  console.error('Quiz generation error:', data.error)
                  setQuizGenerationMessage("题目生成失败")
                  throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
              continue
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      setQuizGenerationMessage("题目生成失败")
      
      // 不再使用备用题目，直接设置为null
      setCurrentQuiz(null)
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  useEffect(() => {
    console.log('FeedbackPage初始化...')
    const savedQuery = localStorage.getItem('xknow-query')
    const savedResponses = localStorage.getItem('xknow-responses')
    const savedCategory = localStorage.getItem('xknow-category')
    const savedConfig = localStorage.getItem('xknow-config')
    const savedAnalyses = localStorage.getItem('xknow-analyses')
    
    console.log('Feedback页面数据检查:', {
      hasQuery: !!savedQuery,
      hasResponses: !!savedResponses,
      hasCategory: !!savedCategory,
      responses: savedResponses
    })
    
    if (savedQuery && savedResponses && savedCategory) {
      setQuery(savedQuery)
      setCategory(savedCategory)
      
      // 获取用户学习水平
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setUserLevel(config.level || 'intermediate')
        } catch (error) {
          console.error('Failed to parse config:', error)
        }
      }
      
      try {
        const responses = JSON.parse(savedResponses)
        console.log('解析用户回答:', responses)
        setUserResponses(responses)
        
        // 尝试获取预生成的问题
        const savedQuestions = localStorage.getItem('xknow-pregenerated-questions')
        if (savedQuestions) {
          const questionsData = JSON.parse(savedQuestions)
          const questionTexts = questionsData.map((q: { question: string }) => q.question)
          console.log('获取问题列表:', questionTexts)
          setQuestions(questionTexts)
          
          // 检查是否有已生成的AI分析
          let initialAnalysisData
          if (savedAnalyses) {
            try {
              const analyses = JSON.parse(savedAnalyses)
              initialAnalysisData = questionTexts.map((question: string, index: number) => ({
                question,
                userAnswer: responses[index] || '',
                aiAnalysis: analyses[index]?.aiAnalysis || '',
                insights: analyses[index]?.insights || [],
                isLoading: false
              }))
              console.log('加载了预生成的AI分析:', analyses.length, '项')
            } catch (error) {
              console.error('Failed to parse saved analyses:', error)
              initialAnalysisData = questionTexts.map((question: string, index: number) => ({
                question,
                userAnswer: responses[index] || '',
                aiAnalysis: '',
                insights: [],
                isLoading: false
              }))
            }
          } else {
            // 没有保存的分析，初始化空的分析数据
            initialAnalysisData = questionTexts.map((question: string, index: number) => ({
              question,
              userAnswer: responses[index] || '',
              aiAnalysis: '',
              insights: [],
              isLoading: false
            }))
          }
          
          console.log('设置分析数据:', initialAnalysisData)
          setAnalysisData(initialAnalysisData)
        } else {
          console.log('没有找到预生成的问题，跳转回learn页面')
          router.push('/learn')
        }
      } catch (error) {
        console.error('Failed to parse saved data:', error)
        router.push('/learn')
      }
    } else {
      console.log('缺少必要数据，跳转回learn页面')
      router.push('/learn')
    }
  }, [router])

  // 当有了基本数据后，开始生成题目（仅第一次）
  useEffect(() => {
    if (query && category && analysisData.length > 0 && currentIndex === 0 && currentStage === 'reflection') {
      // 延迟一点时间开始检查/生成题目，让用户先看到反思界面
      setTimeout(() => {
        generateQuizForTopic()
      }, 1000)
    }
  }, [query, category, analysisData.length, currentIndex, currentStage]) // eslint-disable-line react-hooks/exhaustive-deps

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded || !query || analysisData.length === 0) {
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

  // 生成AI分析的函数 - 流式版本
  const generateAnalysis = async (index: number) => {
    if (!analysisData[index] || analysisData[index].aiAnalysis) return
    
    setIsGeneratingAnalysis(true)
    
    try {
      const response = await fetch('/api/analyze-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: analysisData[index].question,
          userAnswer: analysisData[index].userAnswer,
          topic: query,
          category: category,
          stream: true // 启用流式输出
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze feedback')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue
              
              const data = JSON.parse(jsonStr)
              
              switch (data.type) {
                case 'start':
                  console.log('Stream started:', data.message)
                  break
                  
                case 'progress':
                  console.log('Progress:', data.message)
                  break
                  
                case 'content':
                  // 实时更新显示内容
                  if (data.accumulated) {
                    accumulatedContent = data.accumulated
                    setAnalysisData(prev => {
                      const updated = [...prev]
                      updated[index] = {
                        ...updated[index],
                        aiAnalysis: accumulatedContent + '...',
                        insights: []
                      }
                      return updated
                    })
                  }
                  break
                  
                case 'complete':
                  // 完成时设置最终结果
                  if (data.analysis && data.insights) {
                    setAnalysisData(prev => {
                      const updated = [...prev]
                      updated[index] = {
                        ...updated[index],
                        aiAnalysis: data.analysis,
                        insights: data.insights
                      }
                      return updated
                    })
                    console.log('Stream completed:', data.message)
                  }
                  break
                  
                case 'error':
                  console.error('Stream error:', data.error)
                  throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError, 'Raw line:', line)
              // 继续处理，不中断整个流
              continue
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating analysis:', error)
      // 设置错误状态
      setAnalysisData(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          aiAnalysis: '抱歉，AI分析暂时不可用。请稍后再试。',
          insights: ['分析生成失败', '请检查网络连接', '稍后重新尝试']
        }
        return updated
      })
    } finally {
      setIsGeneratingAnalysis(false)
    }
  }

  const currentData = analysisData[currentIndex]

  const handleNext = () => {
    if (currentStage === 'reflection' && showAnalysis) {
      // 从反思阶段进入题目阶段
      setCurrentStage('quiz')
    } else if (currentStage === 'quiz' && hasAnsweredQuiz) {
      // 完成题目，进入下一个反思或结束
      if (currentIndex < analysisData.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setCurrentStage('reflection')
        setShowAnalysis(false)
        setSelectedAnswer(null)
        setShowQuizResult(false)
        setHasAnsweredQuiz(false)
        
        // 清除之前的预生成题目，为新一轮生成题目
        localStorage.removeItem('xknow-quiz')
        setCurrentQuiz(null)
        
        // 为新的当前主题重新生成题目
        setTimeout(() => {
          generateQuizForTopic()
        }, 500)
      } else {
        // 完成所有反馈，跳转到深度学习页面
        // 清理quiz相关数据
        localStorage.removeItem('xknow-quiz')
        
        const category = localStorage.getItem('xknow-category')
        let targetRoute = '/simulate'
        
        switch (category) {
          case 'science':
            targetRoute = '/simulate'
            break
          case 'history':
            targetRoute = '/history'
            break
          case 'others':
            targetRoute = '/geography'
            break
          default:
            targetRoute = '/simulate'
        }
        
        router.push(targetRoute)
      }
    }
  }

  const handleBack = () => {
    if (currentStage === 'quiz') {
      // 从题目阶段回到反思阶段
      setCurrentStage('reflection')
      setSelectedAnswer(null)
      setShowQuizResult(false)
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowAnalysis(false)
      setCurrentStage('reflection')
    } else {
      router.push('/learn')
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showQuizResult) return
    
    setSelectedAnswer(answerIndex)
    setShowQuizResult(true)
    setHasAnsweredQuiz(true)
  }

  const isCorrectAnswer = selectedAnswer === currentQuiz?.correctAnswer

  return (
    <div className="min-h-screen bg-white">
      {/* 极简导航 */}
      <div className="absolute top-8 left-8">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
            {currentStage === 'reflection' ? '学习反馈' : '知识检测'}
          </h1>
          <p className="text-gray-500 text-sm font-light">
            {currentStage === 'reflection' 
              ? `回顾你对 "${query}" 的思考过程`
              : '测试对核心概念的理解'
            }
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStage === 'reflection' ? (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }}
            >
              {/* 问题区域 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-12"
              >
                <div className="text-center mb-8">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xs font-medium text-gray-600">{currentIndex + 1}</span>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
                    {currentData.question}
                  </p>
                </div>
              </motion.div>

              {/* 对比区域 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid md:grid-cols-2 gap-8 mb-12"
              >
                {/* 你的思考 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">你的思考</h3>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                    <p className="text-gray-600 leading-relaxed font-light">
                      {currentData.userAnswer || "你选择了跳过这个问题"}
                    </p>
                  </div>
                </div>

                {/* AI 解析 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">AI 解析</h3>
                  </div>
                  
                  {!showAnalysis ? (
                    <div className="border border-gray-200 rounded-2xl p-6 bg-white flex items-center justify-center min-h-[120px]">
                      <motion.button
                        onClick={() => {
                          setShowAnalysis(true)
                          // 只有在没有分析内容时才生成
                          if (!currentData?.aiAnalysis || currentData.aiAnalysis.trim() === '') {
                            generateAnalysis(currentIndex)
                          }
                        }}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                        className="text-gray-400 hover:text-gray-700 transition-colors duration-300 text-sm"
                        disabled={isGeneratingAnalysis}
                      >
                        {isGeneratingAnalysis ? 'AI正在分析中...' : (currentData?.aiAnalysis ? '查看解析' : '生成解析')}
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="border border-gray-200 rounded-2xl p-6 bg-white space-y-4"
                    >
                      {isGeneratingAnalysis ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-4 h-4 border border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-500">AI正在为你生成个性化分析...</span>
                          </div>
                          
                          {/* 流式显示内容 */}
                          {currentData?.aiAnalysis && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-gray-600 leading-relaxed font-light whitespace-pre-wrap">
                                {currentData.aiAnalysis}
                              </p>
                              {currentData.aiAnalysis.endsWith('...') && (
                                <motion.div
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="inline-block w-2 h-4 bg-gray-400 ml-1"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 leading-relaxed font-light">
                            {currentData?.aiAnalysis || '正在生成分析...'}
                          </p>
                          
                          {currentData?.insights && currentData.insights.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">关键要点</h4>
                              <div className="space-y-2">
                                {currentData.insights.map((insight, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="flex items-start space-x-3"
                                  >
                                    <div className="w-px h-4 bg-gray-300 mt-1 flex-shrink-0"></div>
                                    <span className="text-sm text-gray-600 font-light leading-relaxed">{insight}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6 }}
            >
              {isGeneratingQuiz ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center py-16"
                >
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border border-gray-300 border-t-gray-900 rounded-full"
                    />
                    <span className="text-gray-500 font-light">正在生成专属题目...</span>
                  </div>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    {quizGenerationMessage}
                  </p>
                </motion.div>
              ) : currentQuiz ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* 简化的题目区域 */}
                  <div className="mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-center mb-6"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-sm font-medium text-gray-600">Q</span>
                      </div>
                      <p className="text-lg text-gray-900 leading-relaxed max-w-3xl mx-auto">
                        {currentQuiz.question}
                      </p>
                    </motion.div>
                  </div>

                  {/* 选项区域 */}
                  <div className="max-w-2xl mx-auto space-y-3 mb-8">
                    {currentQuiz.options.map((option, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showQuizResult}
                        className={`w-full p-4 text-left rounded-xl border transition-all duration-300 ${
                          showQuizResult
                            ? index === currentQuiz.correctAnswer
                              ? 'border-gray-900 bg-gray-50'
                              : index === selectedAnswer && index !== currentQuiz.correctAnswer
                              ? 'border-gray-400 bg-gray-50'
                              : 'border-gray-200 bg-white'
                            : selectedAnswer === index
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            showQuizResult
                              ? index === currentQuiz.correctAnswer
                                ? 'border-gray-900 bg-gray-900'
                                : index === selectedAnswer && index !== currentQuiz.correctAnswer
                                ? 'border-gray-400 bg-gray-400'
                                : 'border-gray-300'
                              : selectedAnswer === index
                              ? 'border-gray-400 bg-gray-400'
                              : 'border-gray-300'
                          }`}>
                            {showQuizResult && index === currentQuiz.correctAnswer && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                            {showQuizResult && index === selectedAnswer && index !== currentQuiz.correctAnswer && (
                              <X className="w-3 h-3 text-white" />
                            )}
                            {!showQuizResult && selectedAnswer === index && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* 解析区域 */}
                  <AnimatePresence>
                    {showQuizResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-2xl mx-auto"
                      >
                        <div className={`p-6 rounded-xl border ${
                          isCorrectAnswer ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrectAnswer ? 'bg-gray-900' : 'bg-gray-400'
                            }`}>
                              {isCorrectAnswer ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <X className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {isCorrectAnswer ? '回答正确！' : '答案错误'}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {currentQuiz.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-400">暂无题目，请稍后再试</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 进度指示器 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="flex space-x-1">
            {analysisData.map((_, index) => (
              <div
                key={index}
                className={`h-px transition-all duration-500 ${
                  index < currentIndex || (index === currentIndex && currentStage === 'quiz' && hasAnsweredQuiz)
                    ? 'w-12 bg-gray-900' 
                    : index === currentIndex
                    ? 'w-8 bg-gray-600'
                    : 'w-4 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* 底部导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            onClick={handleNext}
            disabled={
              (currentStage === 'reflection' && !showAnalysis) ||
              (currentStage === 'quiz' && (!hasAnsweredQuiz || isGeneratingQuiz))
            }
            whileHover={
              (currentStage === 'reflection' && showAnalysis) ||
              (currentStage === 'quiz' && hasAnsweredQuiz && !isGeneratingQuiz)
                ? { y: -1 } : {}
            }
            whileTap={
              (currentStage === 'reflection' && showAnalysis) ||
              (currentStage === 'quiz' && hasAnsweredQuiz && !isGeneratingQuiz)
                ? { y: 0 } : {}
            }
            className={`transition-all duration-300 text-sm ${
              (currentStage === 'reflection' && showAnalysis) ||
              (currentStage === 'quiz' && hasAnsweredQuiz && !isGeneratingQuiz)
                ? 'text-gray-900 hover:text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            {currentStage === 'reflection' 
              ? '进入知识检测 →'
              : currentIndex === analysisData.length - 1 
              ? '完成学习，开始深度探索 →' 
              : '继续下一轮学习 →'
            }
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
} 