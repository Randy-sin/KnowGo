"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"
import { QuizQuestion } from "@/lib/quiz-service"
import { LearningSessionService } from "@/lib/learning-session-service"
import Markdown from "@/components/ui/markdown"

interface UserResponse {
  question: string
  userAnswer: string
  aiAnalysis: string
  insights: string[]
  isLoading?: boolean
}

export default function FeedbackPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
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
  
  // 新增：用户反思相关状态
  const [userReflections, setUserReflections] = useState<string[]>([])
  const [currentReflection, setCurrentReflection] = useState("")
  const [isSavingReflection, setIsSavingReflection] = useState(false)

  // 保存用户反思到数据库
  const saveReflectionToDatabase = async (reflection: string) => {
    if (!reflection.trim() || !user?.id) return
    
    setIsSavingReflection(true)
    try {
      const sessionId = localStorage.getItem('xknow-session-id')
      const interactionIds = JSON.parse(localStorage.getItem('xknow-interaction-ids') || '[]')
      const interactionId = interactionIds[currentIndex]
      
      if (!sessionId || !interactionId) {
        console.warn('缺少sessionId或interactionId，跳过反思保存')
        return
      }
      
      // 保存反思到学习交互记录中
      await LearningSessionService.updateInteractionReflection(interactionId, reflection.trim())
      
      // 更新本地状态
      const updatedReflections = [...userReflections]
      updatedReflections[currentIndex] = reflection.trim()
      setUserReflections(updatedReflections)
      
      // 保存到localStorage
      localStorage.setItem('xknow-reflections', JSON.stringify(updatedReflections))
      
      console.log(`✅ 第${currentIndex + 1}题反思已保存到数据库`)
    } catch (error) {
      console.error(`❌ 保存第${currentIndex + 1}题反思失败:`, error)
    } finally {
      setIsSavingReflection(false)
    }
  }

  // 更新数据库中的答题记录
  const updateQuizAnswerInDatabase = async (userAnswer: number) => {
    try {
      const quizRecordIds = JSON.parse(localStorage.getItem('xknow-quiz-record-ids') || '[]')
      const quizRecordId = quizRecordIds[currentIndex]
      
      if (!quizRecordId || !currentQuiz) {
        console.warn('缺少quizRecordId或currentQuiz，跳过答题记录更新')
        return
      }
      
      await LearningSessionService.updateQuizAnswer(quizRecordId, userAnswer)
      
      console.log(`✅ 答题记录[${currentIndex}]已更新到数据库`)
    } catch (error) {
      console.error(`❌ 更新答题记录[${currentIndex}]失败:`, error)
      throw error
    }
  }

  // 保存quiz到数据库的函数
  const saveQuizToDatabase = async (quiz: QuizQuestion, questionIndex: number) => {
    try {
      const sessionId = localStorage.getItem('xknow-session-id')
      const interactionIds = JSON.parse(localStorage.getItem('xknow-interaction-ids') || '[]')
      const interactionId = interactionIds[questionIndex]
      
      if (!sessionId || !interactionId) {
        console.warn('缺少sessionId或interactionId，跳过quiz保存')
        return
      }
      
      const quizId = await LearningSessionService.saveQuizRecord(
        sessionId,
        interactionId,
        {
          question: quiz.question,
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
          explanation: quiz.explanation
        }
      )
      
      // 保存quiz记录ID到localStorage，供答题时使用
      const quizRecordIds = JSON.parse(localStorage.getItem('xknow-quiz-record-ids') || '[]')
      quizRecordIds[questionIndex] = quizId
      localStorage.setItem('xknow-quiz-record-ids', JSON.stringify(quizRecordIds))
      
      console.log(`✅ Quiz[${questionIndex}]已保存到数据库:`, quizId)
    } catch (error) {
      console.error(`❌ 保存Quiz[${questionIndex}]失败:`, error)
      throw error
    }
  }

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
    const savedQuiz = localStorage.getItem(`xknow-quiz-${currentIndex}`)
    if (savedQuiz) {
      try {
        const quiz = JSON.parse(savedQuiz)
        console.log(`使用预生成的quiz题目[${currentIndex}]:`, quiz)
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
          stream: false // 改为非流式输出
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const result = await response.json()
      
      if (result.quiz) {
        setCurrentQuiz(result.quiz)
        setQuizGenerationMessage("题目生成完成！")
        console.log('Quiz generated successfully:', result.quiz)
        
        // 保存quiz到localStorage，使用问题索引区分
        localStorage.setItem(`xknow-quiz-${currentIndex}`, JSON.stringify(result.quiz))
        console.log(`✅ Quiz已保存到localStorage[${currentIndex}]`)
        
        // 如果用户已登录，同时保存到数据库
        if (user?.id) {
          saveQuizToDatabase(result.quiz, currentIndex).catch((error: unknown) => {
            console.error('保存quiz到数据库失败:', error)
            // 数据库操作失败不影响用户体验
          })
        }
      } else {
        throw new Error('No quiz in response')
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
        
        // 加载已保存的用户反思
        const savedReflections = localStorage.getItem('xknow-reflections')
        if (savedReflections) {
          try {
            const reflections = JSON.parse(savedReflections)
            setUserReflections(reflections)
            console.log('加载了用户反思:', reflections.length, '项')
          } catch (error) {
            console.error('Failed to parse saved reflections:', error)
          }
        }
        
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

  // 监听当前问题索引变化，更新反思内容
  useEffect(() => {
    if (userReflections[currentIndex]) {
      setCurrentReflection(userReflections[currentIndex])
    } else {
      setCurrentReflection("")
    }
  }, [currentIndex, userReflections])

  // 检查是否有预生成的分析，自动显示；如果没有则自动生成
  useEffect(() => {
    if (analysisData.length > 0 && currentIndex < analysisData.length) {
      const currentData = analysisData[currentIndex]
      if (currentData?.aiAnalysis && currentData.aiAnalysis.trim()) {
        console.log('🎯 发现预生成分析，自动显示')
        setShowAnalysis(true)
      } else {
        console.log('🔄 没有预生成分析，自动开始生成')
        setShowAnalysis(true)
        generateAnalysis(currentIndex)
      }
    }
  }, [analysisData, currentIndex])

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded || !query || analysisData.length === 0) {
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
          stream: false // 改为非流式，与前两个问题保持一致
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze feedback')
      }

      const analysis = await response.json()
      
      // 直接设置分析结果，与learn页面逻辑一致
      setAnalysisData(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          aiAnalysis: analysis.analysis,
          insights: analysis.insights
        }
        
        // 同步保存到localStorage，确保数据一致性
        const existingAnalyses = JSON.parse(localStorage.getItem('xknow-analyses') || '[]')
        existingAnalyses[index] = {
          question: updated[index].question,
          userAnswer: updated[index].userAnswer,
          aiAnalysis: analysis.analysis,
          insights: analysis.insights
        }
        localStorage.setItem('xknow-analyses', JSON.stringify(existingAnalyses))
        console.log(`✅ AI分析已保存到localStorage[${index}]`)
        
        return updated
      })
      
      console.log('分析完成:', analysis)
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
        localStorage.removeItem(`xknow-quiz-${currentIndex}`)
        setCurrentQuiz(null)
        
        // 为新的当前主题重新生成题目
        setTimeout(() => {
          generateQuizForTopic()
        }, 500)
      } else {
        // 完成所有反馈，检查游戏状态决定下一步
        // 清理所有quiz相关数据
        for (let i = 0; i < analysisData.length; i++) {
          localStorage.removeItem(`xknow-quiz-${i}`)
        }
        
        // 检查游戏是否已生成完成
        const existingGame = localStorage.getItem('xknow-pregenerated-game')
        let hasValidGame = false
        
        if (existingGame) {
          try {
            const game = JSON.parse(existingGame)
            if (game.html && game.title) {
              hasValidGame = true
            }
          } catch (error) {
            console.error('游戏数据解析失败:', error)
          }
        }
        
        if (hasValidGame) {
          // 游戏已生成，直接跳转到对应的学习页面
          const category = localStorage.getItem('xknow-category')
          let targetRoute = '/simulate'
          
          // 统一所有科目都使用 simulate 页面
          // 历史科目会在 simulate 页面内额外提供视频生成功能
          targetRoute = '/simulate'
          
          console.log('游戏已准备好，跳转到:', targetRoute)
          router.push(targetRoute)
        } else {
          // 游戏未生成，跳转到深度思考页面
          console.log('游戏还未生成，跳转到反思页面')
          router.push('/reflect')
        }
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
    
    // 如果用户已登录，更新数据库中的答题记录
    if (user?.id && currentQuiz) {
      updateQuizAnswerInDatabase(answerIndex).catch((error: unknown) => {
        console.error('更新答题记录失败:', error)
        // 数据库操作失败不影响用户体验
      })
    }
  }

  const isCorrectAnswer = selectedAnswer === currentQuiz?.correctAnswer

  return (
    <div className="min-h-screen bg-page relative">
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
      <div className="max-w-4xl mx-auto px-6 py-16 pb-24">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-light text-primary mb-3 tracking-tight">
            {currentStage === 'reflection' ? '学习反馈' : '知识检测'}
          </h1>
          <p className="text-secondary text-sm font-light">
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
                className="mb-8"
              >
                <div className="text-center mb-8">
                  <div className="w-6 h-6 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
                    <span className="text-xs font-medium text-secondary">{currentIndex + 1}</span>
                  </div>
                  <p className="text-lg text-primary leading-relaxed max-w-2xl mx-auto">
                    {currentData.question}
                  </p>
                </div>
              </motion.div>

              {/* 对比区域 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid md:grid-cols-2 gap-8 mb-8"
              >
                {/* 用户反思 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <h3 className="text-sm font-medium text-primary uppercase tracking-wide">你的反思</h3>
                  </div>
                    {isSavingReflection && (
                      <div className="flex items-center space-x-2 text-xs text-secondary">
                        <div className="w-3 h-3 border border-default border-t-primary rounded-full animate-spin"></div>
                        <span>保存中...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border border-default rounded-2xl bg-card overflow-hidden">
                    {/* 原始回答显示 */}
                    <div className="p-4 bg-subtle border-b border-default">
                      <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">你的原始回答</p>
                      <p className="text-sm text-secondary leading-relaxed font-light">
                        {currentData.userAnswer || "你选择了跳过这个问题"}
                      </p>
                    </div>
                    
                    {/* 反思输入区域 */}
                    <div className="p-4">
                      <textarea
                        value={currentReflection}
                        onChange={(e) => setCurrentReflection(e.target.value)}
                        onBlur={() => {
                          if (currentReflection !== (userReflections[currentIndex] || "")) {
                            saveReflectionToDatabase(currentReflection)
                          }
                        }}
                        placeholder="在这里写下你对这个问题的进一步思考和反思..."
                        className="w-full h-24 text-sm text-primary placeholder:text-secondary bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* AI 解析 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <h3 className="text-sm font-medium text-primary uppercase tracking-wide">AI 解析</h3>
                  </div>
                  
                  {!showAnalysis ? (
                    <div className="border border-default rounded-2xl p-6 bg-card flex items-center justify-center min-h-[120px]">
                      <motion.button
                        onClick={() => {
                          console.log('🔍 显示AI分析:', currentIndex)
                          setShowAnalysis(true)
                        }}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                        className="text-secondary hover:text-primary transition-colors duration-300 text-sm"
                        disabled={isGeneratingAnalysis}
                      >
                        {isGeneratingAnalysis ? 'AI正在分析中...' : '查看解析'}
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="border border-default rounded-2xl p-6 bg-card space-y-4"
                    >
                      {isGeneratingAnalysis ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-4 h-4 border border-default border-t-primary rounded-full animate-spin"></div>
                            <span className="text-sm text-secondary">AI正在为你生成个性化分析...</span>
                          </div>
                        </div>
                      ) : currentData?.aiAnalysis && currentData.aiAnalysis.trim() ? (
                        <>
                          <div className="text-primary leading-relaxed font-light">
                            <Markdown>
                              {currentData?.aiAnalysis || '正在生成分析...'}
                            </Markdown>
                          </div>
                          
                          {currentData?.insights && currentData.insights.length > 0 && (
                            <div className="pt-4 border-t border-default">
                              <h4 className="text-xs font-medium text-secondary uppercase tracking-wide mb-3">关键要点</h4>
                              <div className="space-y-2">
                                {currentData.insights.map((insight, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="flex items-start space-x-3"
                                  >
                                    <div className="w-px h-4 bg-default mt-1 flex-shrink-0"></div>
                                    <span className="text-sm text-secondary font-light leading-relaxed">{insight}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="border border-default rounded-2xl p-6 bg-card flex items-center justify-center min-h-[120px]">
                          <p className="text-secondary">暂无分析内容，请稍后再试。</p>
                        </div>
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
                      className="w-5 h-5 border border-default border-t-primary rounded-full"
                    />
                    <span className="text-secondary font-light">正在生成专属题目...</span>
                  </div>
                  <p className="text-sm text-secondary max-w-md mx-auto">
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
                                      <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-medium text-secondary">Q</span>
                </div>
                <p className="text-lg text-primary leading-relaxed max-w-3xl mx-auto">
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
                              ? 'border-primary bg-subtle'
                              : index === selectedAnswer && index !== currentQuiz.correctAnswer
                              ? 'border-secondary bg-subtle'
                              : 'border-default bg-card'
                            : selectedAnswer === index
                            ? 'border-secondary bg-subtle'
                            : 'border-default bg-card hover:border-secondary hover:bg-subtle'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            showQuizResult
                              ? index === currentQuiz.correctAnswer
                                ? 'border-black bg-black dark:border-white dark:bg-white'
                                : index === selectedAnswer && index !== currentQuiz.correctAnswer
                                ? 'border-gray-400 bg-gray-400 dark:border-gray-600 dark:bg-gray-600'
                                : 'border-default'
                              : selectedAnswer === index
                              ? 'border-black bg-black dark:border-white dark:bg-white'
                              : 'border-default'
                          }`}>
                            {showQuizResult && index === currentQuiz.correctAnswer && (
                              <Check className="w-3 h-3 text-white dark:text-black" />
                            )}
                            {showQuizResult && index === selectedAnswer && index !== currentQuiz.correctAnswer && (
                              <X className="w-3 h-3 text-white dark:text-black" />
                            )}
                            {!showQuizResult && selectedAnswer === index && (
                              <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                            )}
                          </div>
                          <span className="text-sm text-primary leading-relaxed">
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
                          isCorrectAnswer ? 'border-default bg-subtle' : 'border-default bg-subtle'
                        }`}>
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrectAnswer ? 'bg-primary' : 'bg-secondary'
                            }`}>
                              {isCorrectAnswer ? (
                                <Check className="w-4 h-4 text-black dark:text-white" />
                              ) : (
                                <X className="w-4 h-4 text-black dark:text-white" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-primary">
                              {isCorrectAnswer ? '回答正确！' : '答案错误'}
                            </h4>
                          </div>
                          <p className="text-sm text-secondary leading-relaxed">
                            {currentQuiz.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-16">
                                      <p className="text-secondary">暂无题目，请稍后再试</p>
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
                    ? 'w-12 bg-primary' 
                    : index === currentIndex
                    ? 'w-8 bg-secondary'
                    : 'w-4 bg-default'
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
                ? 'text-primary hover:text-secondary'
                : 'text-secondary/50 cursor-not-allowed'
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