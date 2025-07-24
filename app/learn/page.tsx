"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, MessageCircle, Lightbulb, BookOpen, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LearnPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [config, setConfig] = useState<{level: string, style: string} | null>(null)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [showContent, setShowContent] = useState(false)
  const [userInput, setUserInput] = useState("")

  // 基于README的AI引导流程设计
  const learningPhases = [
    {
      id: "life_connection",
      title: "生活化引入",
      subtitle: "从你熟悉的经验开始",
      icon: MessageCircle,
      description: "让我们从你的生活经验谈起..."
    },
    {
      id: "observation",
      title: "观察与发现", 
      subtitle: "一起观察现象的特点",
      icon: Lightbulb,
      description: "现在让我们仔细观察一下..."
    },
    {
      id: "concept_building",
      title: "概念建立",
      subtitle: "自然引出学术概念",
      icon: BookOpen,
      description: "基于你的观察，我们来建立概念..."
    }
  ]

  useEffect(() => {
    const savedQuery = localStorage.getItem('knowgo-query')
    const savedConfig = localStorage.getItem('knowgo-config')
    
    if (savedQuery && savedConfig) {
      setQuery(savedQuery)
      setConfig(JSON.parse(savedConfig))
      
      // 延迟启动学习流程，营造期待感
      setTimeout(() => {
        setShowContent(true)
      }, 800)
    } else {
      router.push('/')
    }
  }, [router])

  const handlePhaseAdvance = () => {
    if (currentPhase < learningPhases.length - 1) {
      setCurrentPhase(prev => prev + 1)
    }
  }

  const generateLifeConnectionContent = (query: string) => {
    // 根据查询内容生成生活化引入
    const examples = {
      "抛物线": "你有没有投过篮球？注意过球在空中划出的那条弧线吗？",
      "机器学习": "你用过推荐系统吗？比如抖音为什么总能推送你喜欢的视频？",
      "react": "你有没有想过，网页是如何在你点击按钮时立即响应的？",
      "default": `让我们从一个你可能遇到过的场景开始思考「${query}」...`
    }
    
    return examples[query.toLowerCase() as keyof typeof examples] || examples.default
  }

  const handleNewQuery = () => {
    localStorage.removeItem('knowgo-query')
    localStorage.removeItem('knowgo-config')
    router.push('/')
  }

  if (!config || !showContent) {
    // 简化的初始加载状态 - 苹果风格
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-sm text-gray-500">准备你的个性化学习体验</p>
        </motion.div>
      </div>
    )
  }

  const currentPhaseData = learningPhases[currentPhase]
  const CurrentIcon = currentPhaseData.icon

  return (
    <div className="min-h-screen bg-white">
      {/* 极简导航 */}
      <div className="absolute top-6 left-6">
        <button
          onClick={handleNewQuery}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="container-minimal py-20">
        <div className="max-w-2xl mx-auto">
          
          {/* 查询主题 - 简洁展示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center"
          >
            <h1 className="text-2xl font-medium text-gray-900 mb-2">{query}</h1>
            <div className="w-12 h-px bg-gray-200 mx-auto"></div>
          </motion.div>

          {/* 学习阶段进度指示器 - 苹果风格 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center mb-16"
          >
            <div className="flex space-x-2">
              {learningPhases.map((phase, index) => (
                <div
                  key={phase.id}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    index <= currentPhase ? 'bg-gray-900' : 'bg-gray-200'
                  } ${index === currentPhase ? 'scale-125' : ''}`}
                />
              ))}
            </div>
          </motion.div>

          {/* 当前学习阶段 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* 阶段标题 */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <CurrentIcon className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    {currentPhaseData.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {currentPhaseData.subtitle}
                  </p>
                </div>
              </div>

              {/* AI对话内容区域 */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                
                {/* AI消息 */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex-shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-gray-800 leading-relaxed"
                      >
                        {currentPhase === 0 ? generateLifeConnectionContent(query) : currentPhaseData.description}
                      </motion.p>
                    </div>
                  </div>
                </div>

                {/* 用户交互区域 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="space-y-4"
                >
                  
                  {/* 思考提示 */}
                  {currentPhase === 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-3">
                        💭 花一点时间思考，然后分享你的想法...
                      </p>
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="说说你的经验或想法..."
                        className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* 继续按钮 */}
                  <div className="flex justify-center">
                    <motion.button
                      onClick={handlePhaseAdvance}
                      disabled={currentPhase === 0 && !userInput.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-full transition-all duration-200 ${
                        (currentPhase === 0 && !userInput.trim())
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <span>
                        {currentPhase === learningPhases.length - 1 ? '开始深入学习' : '继续'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
} 