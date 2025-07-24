"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LearnPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [config, setConfig] = useState<{level: string, style: string} | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [userResponse, setUserResponse] = useState("")
  const [isTyping, setIsTyping] = useState(false)

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

  // 生成引导性问题
  const generateQuestion = (topic: string) => {
    const questions = {
      "抛物线": "你有没有观察过篮球投射时的轨迹？",
      "机器学习": "为什么你的手机总能推荐你喜欢的内容？",
      "react": "网页是如何瞬间响应你的每一次点击的？",
      "量子物理": "为什么粒子可以同时存在于多个位置？",
      "经济学": "为什么同样的商品在不同地方价格不同？",
      "default": `关于「${topic}」，你是否曾经好奇过...`
    }
    return questions[topic.toLowerCase() as keyof typeof questions] || questions.default
  }

  const handleContinue = () => {
    if (userResponse.trim()) {
      // 这里可以进入下一阶段或深度学习
      console.log('用户回应:', userResponse)
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
        <div className="w-full max-w-xl text-center space-y-12">
          
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isTyping ? 1 : 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            
            {/* 问题文本 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="text-xl font-light text-gray-700 leading-relaxed"
            >
              {generateQuestion(query)}
            </motion.p>

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
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="分享你的想法..."
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
                animate={{ opacity: userResponse.trim() ? 1 : 0.3 }}
                transition={{ duration: 0.4 }}
                className="pt-4"
              >
                <motion.button
                  onClick={handleContinue}
                  disabled={!userResponse.trim()}
                  whileHover={userResponse.trim() ? { scale: 1.02 } : {}}
                  whileTap={userResponse.trim() ? { scale: 0.98 } : {}}
                  className={`inline-flex items-center space-x-3 px-8 py-3 text-sm font-medium tracking-wide transition-all duration-300 ${
                    userResponse.trim()
                      ? 'text-gray-900 hover:text-black cursor-pointer'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span>继续</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
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
          <div className="w-6 h-px bg-gray-900"></div>
          <div className="w-2 h-px bg-gray-200"></div>
          <div className="w-2 h-px bg-gray-200"></div>
        </div>
      </motion.div>
    </div>
  )
} 