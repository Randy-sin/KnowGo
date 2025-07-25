"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RefreshCw, Play, Info, Loader2, Maximize, Minimize } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"
import { GameResponse } from "@/lib/game-generation-service"

interface GameStreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error'
  message?: string
  game?: GameResponse
  error?: string
}

export default function SimulatePage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [userLevel, setUserLevel] = useState("intermediate")
  const [currentGame, setCurrentGame] = useState<GameResponse | null>(null)
  const [isGeneratingGame, setIsGeneratingGame] = useState(false)
  const [generationMessage, setGenerationMessage] = useState("")
  const [showInfo, setShowInfo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { t } = useTranslations()
  
  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    const savedCategory = localStorage.getItem('xknow-category') 
    const savedConfig = localStorage.getItem('xknow-config')
    const pregeneratedGame = localStorage.getItem('xknow-pregenerated-game')
    
    if (savedQuery) {
      setQuery(savedQuery)
      setCategory(savedCategory || 'science')
      
      // 获取用户学习水平
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setUserLevel(config.level || 'intermediate')
        } catch (error) {
          console.error('Failed to parse config:', error)
        }
      }
      
      // 优先使用预生成的游戏
      if (pregeneratedGame) {
        try {
          const game = JSON.parse(pregeneratedGame)
          setCurrentGame(game)
          console.log('使用预生成的游戏:', game.title)
        } catch (error) {
          console.error('Failed to parse pregenerated game:', error)
          // 如果预生成游戏解析失败，重新生成
          setTimeout(() => {
            generateInteractiveGame(savedQuery, savedCategory || 'science')
          }, 500)
        }
      } else {
        // 没有预生成游戏，重新生成
        setTimeout(() => {
          generateInteractiveGame(savedQuery, savedCategory || 'science')
        }, 500)
      }
    } else {
      router.push('/')
    }
  }, [router])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 生成互动游戏函数 - 在所有Hooks之后定义
  const generateInteractiveGame = async (topic: string, gameCategory: string) => {
    setIsGeneratingGame(true)
    setGenerationMessage("AI正在为您设计专属游戏...")
    
    try {
      const response = await fetch('/api/generate-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          category: gameCategory,
          userLevel: userLevel,
          learningObjective: `通过互动游戏深度理解${topic}的核心概念`,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate game')
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
              
              const data: GameStreamEvent = JSON.parse(jsonStr)
              
              switch (data.type) {
                case 'start':
                case 'progress':
                  setGenerationMessage(data.message || '正在生成...')
                  break
                  
                case 'complete':
                  if (data.game) {
                    setCurrentGame(data.game)
                    setGenerationMessage('游戏生成完成！')
                    console.log('Game generated successfully:', data.game.title)
                  }
                  break
                  
                case 'error':
                  console.error('Game generation error:', data.error)
                  setGenerationMessage('游戏生成失败，请重试')
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
      console.error('Error generating game:', error)
      setGenerationMessage('游戏生成失败')
      
      // 设置备用游戏信息
      setCurrentGame({
        html: createSimpleFallbackGame(topic),
        title: `${topic} 学习游戏`,
        instructions: '正在为您准备学习体验，请稍后重试',
        gameType: 'fallback'
      })
    } finally {
      setIsGeneratingGame(false)
    }
  }

  const createSimpleFallbackGame = (topic: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${topic} 学习游戏</title>
    <style>
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #1a1a1a;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 400px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1a1a1a;
        }
        .message {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 12px;
        }
        .retry-btn {
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.2s ease;
        }
        .retry-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">${topic} 互动学习</h1>
        <p class="message">正在为您准备个性化的学习游戏...</p>
        <p class="message">AI正在根据您的学习需求定制最佳体验。</p>
        <button class="retry-btn" onclick="window.parent.location.reload()">重新生成游戏</button>
    </div>
</body>
</html>`
  }

  const handleRegenerateGame = () => {
    setCurrentGame(null)
    generateInteractiveGame(query, category)
  }

  const handleFullscreen = async () => {
    const gameContainer = document.getElementById('game-container')
    if (!gameContainer) return

    try {
      if (!isFullscreen) {
        await gameContainer.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const handleBack = () => {
    router.push('/feedback')
  }

  const handleNewQuery = () => {
    localStorage.removeItem('xknow-query')
    localStorage.removeItem('xknow-category')
    localStorage.removeItem('xknow-config')
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

  return (
    <div className="min-h-screen bg-white">
      {/* 极简导航 */}
      <div className="absolute top-8 left-8 z-20">
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

             {/* 右上角控制按钮 */}
       <div className="absolute top-8 right-8 z-20 flex items-center space-x-3">
         <motion.button
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           onClick={() => setShowInfo(!showInfo)}
           className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm border border-gray-200 transition-all duration-200"
         >
           <Info className="w-4 h-4" />
         </motion.button>
         
         {currentGame && (
           <>
             <motion.button
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               onClick={handleFullscreen}
               className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm border border-gray-200 transition-all duration-200"
               title={isFullscreen ? "退出全屏" : "全屏显示"}
             >
               {isFullscreen ? (
                 <Minimize className="w-4 h-4" />
               ) : (
                 <Maximize className="w-4 h-4" />
               )}
             </motion.button>
             
             <motion.button
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               onClick={handleRegenerateGame}
               disabled={isGeneratingGame}
               className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm border border-gray-200 transition-all duration-200 disabled:opacity-50"
             >
               <RefreshCw className={`w-4 h-4 ${isGeneratingGame ? 'animate-spin' : ''}`} />
             </motion.button>
           </>
         )}
       </div>

      {/* 信息面板 */}
      <AnimatePresence>
        {showInfo && currentGame && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-20 right-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-xs"
          >
            <h3 className="font-medium text-gray-900 mb-2">{currentGame.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{currentGame.instructions}</p>
            <div className="text-xs text-gray-400">
              游戏类型: {currentGame.gameType}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <div className="pt-20 pb-8 px-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            互动模拟器
          </h1>
          <p className="text-gray-500 text-sm">
            通过 "<span className="font-medium text-gray-700">{query}</span>" 的互动体验深度学习
          </p>
        </motion.div>

        {/* 游戏容器 */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {isGeneratingGame ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-6"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                AI游戏设计师正在工作
              </h3>
              <p className="text-gray-600 mb-4">
                {generationMessage}
              </p>
              <div className="text-sm text-gray-400">
                正在为您量身定制最佳学习体验...
              </div>
            </div>
          ) : currentGame ? (
          <motion.div
               id="game-container"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
                 isFullscreen ? 'fullscreen-game-container' : ''
               }`}
               style={{
                 ...(isFullscreen && {
                   position: 'fixed',
                   top: 0,
                   left: 0,
                   width: '100vw',
                   height: '100vh',
                   borderRadius: 0,
                   border: 'none',
                   zIndex: 9999
                 })
               }}
             >
                             {/* 游戏标题栏 */}
               {!isFullscreen && (
                 <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                   <div className="flex items-center justify-between">
                <div>
                       <h2 className="text-lg font-medium text-gray-900">
                         {currentGame.title}
                       </h2>
                       <p className="text-sm text-gray-600 mt-1">
                         {currentGame.instructions}
                       </p>
                  </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                       <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                       <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              </div>
               )}
               
               {/* 全屏时的迷你控制栏 */}
               {isFullscreen && (
                 <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
                   <motion.button
                     onClick={handleFullscreen}
                     className="w-8 h-8 flex items-center justify-center text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-200"
                     title="退出全屏"
                   >
                     <Minimize className="w-4 h-4" />
                   </motion.button>
                    </div>
               )}

                             {/* 游戏iframe */}
               <div className="relative">
                 <iframe
                   srcDoc={currentGame.html}
                   className={`w-full border-0 ${
                     isFullscreen ? 'h-screen' : 'h-[600px]'
                   }`}
                   title={currentGame.title}
                   sandbox="allow-scripts allow-same-origin"
                 />
                  </div>
                </motion.div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                准备开始互动学习
              </h3>
              <p className="text-gray-600 mb-6">
                点击按钮生成您的专属学习游戏
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                onClick={() => generateInteractiveGame(query, category)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>生成互动游戏</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* 底部操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={handleNewQuery}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            探索其他学习主题 →
          </motion.button>
          </motion.div>
      </div>
    </div>
  )
} 