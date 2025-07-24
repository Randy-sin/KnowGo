"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LearnPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [config, setConfig] = useState<{level: string, style: string} | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [userResponses, setUserResponses] = useState<string[]>([])
  const [currentResponse, setCurrentResponse] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // 基于README的三阶段AI引导流程
  const generateLearningStages = (topic: string) => {
    const stages = {
      "抛物线": [
        {
          type: "life_connection",
          question: "Have you ever watched a basketball shot? What did you notice about the ball's path?",
          followUp: "Think about that curved line the ball makes..."
        },
        {
          type: "observation", 
          question: "If we could trace that path, what shape would we see? How is it different from a straight line or circle?",
          followUp: "Notice the unique characteristics..."
        },
        {
          type: "concept_building",
          question: "This special curve has a name and mathematical properties. What do you think makes it so important in physics and math?",
          followUp: "Let's connect your observations to the concept..."
        }
      ],
      "parabola": [
        {
          type: "life_connection",
          question: "Have you ever watched a basketball shot? What did you notice about the ball's path?",
          followUp: "Think about that curved line the ball makes..."
        },
        {
          type: "observation",
          question: "If we could trace that path, what shape would we see? How is it different from a straight line or circle?", 
          followUp: "Notice the unique characteristics..."
        },
        {
          type: "concept_building",
          question: "This special curve has a name and mathematical properties. What do you think makes it so important in physics and math?",
          followUp: "Let's connect your observations to the concept..."
        }
      ],
      "机器学习": [
        {
          type: "life_connection",
          question: "Why does your phone seem to know exactly what videos you want to watch next?",
          followUp: "Think about how it learns your preferences..."
        },
        {
          type: "observation",
          question: "What data might your phone be collecting to make these predictions? How does it improve over time?",
          followUp: "Consider the pattern recognition process..."
        },
        {
          type: "concept_building", 
          question: "This ability to learn from data and make predictions is the core of something bigger. What makes this different from traditional programming?",
          followUp: "Let's explore how machines actually learn..."
        }
      ],
      "machine learning": [
        {
          type: "life_connection",
          question: "Why does your phone seem to know exactly what videos you want to watch next?",
          followUp: "Think about how it learns your preferences..."
        },
        {
          type: "observation",
          question: "What data might your phone be collecting to make these predictions? How does it improve over time?",
          followUp: "Consider the pattern recognition process..."
        },
        {
          type: "concept_building",
          question: "This ability to learn from data and make predictions is the core of something bigger. What makes this different from traditional programming?",
          followUp: "Let's explore how machines actually learn..."
        }
      ],
      "react": [
        {
          type: "life_connection",
          question: "How does a webpage instantly respond to your clicks, showing new content without refreshing the entire page?",
          followUp: "Think about the seamless interactions you experience..."
        },
        {
          type: "observation",
          question: "What happens behind the scenes when you interact with a modern web app? How is it different from traditional websites?",
          followUp: "Notice the reactive behavior patterns..."
        },
        {
          type: "concept_building",
          question: "This responsiveness comes from a specific way of building user interfaces. What principles might make interactions feel so natural?",
          followUp: "Let's understand the reactive paradigm..."
        }
      ]
    }
    
    return stages[topic.toLowerCase() as keyof typeof stages] || [
      {
        type: "life_connection",
        question: `Have you encountered ${topic} in your daily life? What sparked your curiosity about it?`,
        followUp: "Think about your personal connection..."
      },
      {
        type: "observation",
        question: `What patterns or characteristics have you noticed about ${topic}? What makes it unique?`,
        followUp: "Consider the deeper patterns..."
      },
      {
        type: "concept_building",
        question: `How might understanding ${topic} change the way you see the world around you?`,
        followUp: "Let's build the conceptual framework..."
      }
    ]
  }

  const stages = generateLearningStages(query)
  const currentStageData = stages[currentStage]

  useEffect(() => {
    const savedQuery = localStorage.getItem('knowgo-query')
    const savedConfig = localStorage.getItem('knowgo-config')
    
    if (savedQuery && savedConfig) {
      setQuery(savedQuery)
      setConfig(JSON.parse(savedConfig))
      
      // 渐进式显示内容
      setTimeout(() => setShowContent(true), 600)
      setTimeout(() => setIsTyping(true), 1200)
    } else {
      router.push('/')
    }
  }, [router])

  const handleContinue = () => {
    if (currentResponse.trim()) {
      const newResponses = [...userResponses, currentResponse.trim()]
      setUserResponses(newResponses)
      setCurrentResponse("")
      
      if (currentStage < stages.length - 1) {
        // 进入下一阶段
        setCurrentStage(prev => prev + 1)
        setIsTyping(false)
        setTimeout(() => setIsTyping(true), 800)
      } else {
        // 完成所有阶段，保存回答并进入模拟器
        localStorage.setItem('knowgo-responses', JSON.stringify(newResponses))
        console.log('All stages completed. Responses:', newResponses)
        // 跳转到模拟器页面
        router.push('/simulate')
      }
    }
  }

  const handleNewQuery = () => {
    localStorage.removeItem('knowgo-query')
    localStorage.removeItem('knowgo-config')
    router.push('/')
  }

  if (!config || !showContent) {
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="space-y-4"
              >
                <p className="text-xl font-light text-gray-700 leading-relaxed">
                  {currentStageData?.question}
                </p>
                <p className="text-sm font-light text-gray-500 italic">
                  {currentStageData?.followUp}
                </p>
              </motion.div>

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
                    placeholder="Share your thoughts..."
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
                      {currentStage === stages.length - 1 ? 'Begin Learning' : 'Continue'}
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.0 }}
        className="pb-8 flex justify-center"
      >
        <div className="flex space-x-1">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`h-px transition-all duration-500 ${
                index <= currentStage ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
} 