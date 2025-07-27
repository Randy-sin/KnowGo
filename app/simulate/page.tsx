"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Play, RefreshCw, Video, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { GameResponse } from "@/lib/game-generation-service"
import { LearningSessionService } from "@/lib/learning-session-service"
import { useTranslations } from "@/lib/use-translations"


interface GameStreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error'
  message?: string
  game?: GameResponse
  error?: string
}

// 定义视频下载信息类型
interface VideoDownloadInfo {
  downloadUrl: string
  fileSize?: number
  duration?: number
  format?: string
  resolution?: string
}

interface VideoStreamEvent {
  type: 'progress' | 'complete' | 'timeout' | 'error'
  stage?: string
  message?: string
  progress?: number
  videoPrompt?: string
  downloadInfo?: VideoDownloadInfo
  error?: string
}

export default function SimulatePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { t } = useTranslations()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [userLevel, setUserLevel] = useState("intermediate")
  const [currentGame, setCurrentGame] = useState<GameResponse | null>(null)
  const [isWaitingForGame, setIsWaitingForGame] = useState(false)
  const [gameKey, setGameKey] = useState(0) // 用于强制刷新iframe
  
  // 视频生成相关状态
  const [gameCompleted, setGameCompleted] = useState(false) // 游戏是否完成
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoMessage, setVideoMessage] = useState('')
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDownloadUrl, setVideoDownloadUrl] = useState('')
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [videoTaskId, setVideoTaskId] = useState('')
  
  // 摘要生成相关状态
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false)
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  
  // 保存游戏到数据库的函数
  const saveGameToDatabase = async (game: GameResponse) => {
    try {
      const sessionId = localStorage.getItem('xknow-session-id')
      if (!sessionId) {
        console.warn('缺少sessionId，跳过游戏保存')
        return
      }
      
      await LearningSessionService.saveGameSession(sessionId, {
        title: game.title,
        type: game.gameType,
        instructions: game.instructions,
        htmlCode: game.html,
        designConcept: undefined // 游戏设计概念数据可以从其他地方获取
      })
      
      console.log('✅ 游戏已保存到数据库:', game.title)
    } catch (error) {
      console.error('❌ 保存游戏失败:', error)
      throw error
    }
  }

  // 🤖 在游戏加载时并行生成摘要
  const generateSummaryInBackground = useCallback(async () => {
    if (summaryGenerated || isSummaryGenerating) {
      console.log('📋 摘要已生成或正在生成中，跳过')
      return
    }

    const sessionId = localStorage.getItem('xknow-session-id')
    if (!sessionId || !user?.id) {
      console.log('⚠️ 缺少sessionId或用户信息，跳过摘要生成')
      return
    }

    try {
      setIsSummaryGenerating(true)
      console.log('🤖 开始并行生成学习摘要...')
      
      // 获取学习数据
      const sessionDetails = await LearningSessionService.getSessionDetails(sessionId)
      
      if (!sessionDetails.interactions || sessionDetails.interactions.length === 0) {
        console.log('⚠️ 没有学习交互数据，跳过摘要生成')
        setIsSummaryGenerating(false)
        return
      }

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: sessionDetails
        }),
        signal: AbortSignal.timeout(25000) // 25秒超时
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const summaryData = await response.json() as {
        summary: string
        source: 'gemini' | 'fallback'
        tone: 'encouraging' | 'neutral' | 'inspiring'
        fallback: boolean
      }

      // 保存摘要到localStorage，供Summary页面使用
      localStorage.setItem('xknow-generated-summary', JSON.stringify({
        summary: summaryData.summary,
        source: summaryData.source,
        tone: summaryData.tone,
        generatedAt: Date.now()
      }))

      setSummaryGenerated(true)
      console.log('✅ 学习摘要生成完成并保存:', summaryData.summary)

    } catch (error) {
      console.warn('⚠️ 后台摘要生成失败:', error)
      // 生成失败不影响游戏体验，Summary页面会使用回退方案
    } finally {
      setIsSummaryGenerating(false)
    }
  }, [summaryGenerated, isSummaryGenerating, user?.id])
  
  // 智能等待游戏生成的机制
  const waitForGameOrShowExisting = useCallback(async (currentTopic: string, currentCategory: string, currentUserLevel: string) => {
    console.log('🔍 检查游戏状态...')
    
    // 检查是否有游戏数据
    const existingGame = localStorage.getItem('xknow-pregenerated-game')
    console.log('📥 localStorage中的游戏数据:', existingGame ? '存在' : '不存在')
    
    if (existingGame) {
      try {
        const game = JSON.parse(existingGame)
        console.log('📦 发现现有游戏:', {
          title: game.title,
          hasHtml: !!game.html,
          htmlLength: game.html ? game.html.length : 0
        })
        
        if (game.html && game.title) {
          setCurrentGame(game)
          console.log('✅ 使用现有游戏:', game.title)
          
          // 如果用户已登录，保存游戏到数据库（如果还没保存）
          if (user?.id) {
            saveGameToDatabase(game).catch((error: unknown) => {
              console.error('保存游戏到数据库失败:', error)
              // 数据库操作失败不影响用户体验
            })
          }
          
          // 🤖 游戏加载成功后，开始并行生成摘要
          generateSummaryInBackground()
          
          return
        } else {
          console.log('❌ 游戏数据不完整:', { hasHtml: !!game.html, hasTitle: !!game.title })
        }
      } catch (error) {
        console.error('❌ 游戏数据解析失败:', error)
        localStorage.removeItem('xknow-pregenerated-game')
      }
    }
    
    // 如果没有游戏数据，显示等待界面
    console.log('💭 等待游戏生成...')
    setIsWaitingForGame(true)
    
    // 定期检查游戏是否生成完成
    const checkInterval = setInterval(() => {
      const newGame = localStorage.getItem('xknow-pregenerated-game')
      if (newGame) {
        try {
          const game = JSON.parse(newGame)
          if (game.html && game.title) {
            setCurrentGame(game)
            setIsWaitingForGame(false)
            clearInterval(checkInterval)
            console.log('🎉 游戏生成完成:', game.title)
            
            // 如果用户已登录，保存游戏到数据库
            if (user?.id) {
              saveGameToDatabase(game).catch((error: unknown) => {
                console.error('保存游戏到数据库失败:', error)
                // 数据库操作失败不影响用户体验
              })
            }
            
            // 🤖 游戏生成完成后，开始并行生成摘要
            generateSummaryInBackground()
          }
        } catch (error) {
          console.error('❌ 游戏解析失败:', error)
        }
      }
    }, 2000)
    
    // 5分钟后停止检查
    setTimeout(() => {
      clearInterval(checkInterval)
      const finalCheck = localStorage.getItem('xknow-pregenerated-game')
      if (!finalCheck) {
        setIsWaitingForGame(false)
        console.log('⏰ 等待超时')
      }
    }, 300000)
    
  }, [router])

  useEffect(() => {
    console.log('🚀 Simulate页面初始化...', { isLoaded, isSignedIn })
    
    const savedQuery = localStorage.getItem('xknow-query')
    const savedCategory = localStorage.getItem('xknow-category') 
    const savedConfig = localStorage.getItem('xknow-config')
    const pregeneratedGame = localStorage.getItem('xknow-pregenerated-game')
    
    console.log('📋 数据检查:', {
      hasQuery: !!savedQuery,
      hasCategory: !!savedCategory,
      hasConfig: !!savedConfig,
      hasGame: !!pregeneratedGame,
      query: savedQuery
    })
    
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
      
      // 使用智能等待机制，传递必要信息
      waitForGameOrShowExisting(savedQuery, currentCategory, currentUserLevel)
    } else {
      console.log('❌ 没有找到query，跳转到首页')
      router.push('/')
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps
  // 注意：故意不包含waitForGameOrShowExisting作为依赖，因为它会导致无限循环

  // 处理游戏完成
  const handleGameCompletion = useCallback(() => {
    setGameCompleted(true)
    
    // 如果是历史类别，启动视频生成
    if (category === 'history') {
      // 检查是否有视频任务，如果有则加载
      const videoTask = localStorage.getItem('xknow-video-task')
      if (videoTask) {
        setIsLoadingVideo(true)
        setVideoMessage('正在生成历史学习视频...')
      } else {
        setVideoMessage('历史学习内容正在准备中...')
      }
    } else {
      // 非历史类别，显示完成状态
      setVideoMessage('恭喜完成游戏学习！您已掌握相关知识。')
      setTimeout(() => {
        router.push('/summary')
      }, 2000)
    }
  }, [category, router])

  // 处理游戏跳过
  const handleGameSkip = useCallback(() => {
    console.log('用户选择跳过游戏')
    setGameCompleted(true)
    setVideoMessage('您选择跳过了游戏环节，直接进入下一步学习。')
    
    setTimeout(() => {
      router.push('/summary')
    }, 1500)
  }, [router])

  // 监听来自游戏iframe的消息
  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      // 安全检查：确保消息来源可信
      if (event.origin !== window.location.origin && event.source !== window) {
        return
      }

      const { type } = event.data

      if (type === 'GAME_COMPLETED') {
        console.log('🎉 游戏完成消息接收')
        handleGameCompletion()
      } else if (type === 'GAME_SKIPPED') {
        console.log('⏭️ 游戏跳过消息接收')
        handleGameSkip()
      }
    }

    window.addEventListener('message', handleGameMessage)

    // 清理监听器
    return () => {
      window.removeEventListener('message', handleGameMessage)
    }
  }, [handleGameCompletion, handleGameSkip])

  const handleBack = () => {
    router.back()
  }

  const handleRefreshGame = () => {
    setGameKey(prev => prev + 1) // 增加key值来强制刷新iframe
  }

  // 查询视频状态并播放
  const loadAndPlayVideo = useCallback(async () => {
    const videoTask = localStorage.getItem('xknow-video-task');
    if (!videoTask) return;

    try {
      const task = JSON.parse(videoTask);
      setVideoTaskId(task.taskId);
      setVideoPrompt(task.videoPrompt);
      setIsLoadingVideo(true);
      setVideoProgress(20);
      setVideoMessage('正在查询视频生成状态...');

      // 查询视频状态
      const response = await fetch(`/api/generate-video?taskId=${task.taskId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'Success' && result.downloadInfo) {
        // 视频已生成完成
        setVideoDownloadUrl(result.downloadInfo.downloadUrl);
        setVideoProgress(100);
        setVideoMessage('视频已生成完成！');
        setVideoCompleted(true);
        setIsLoadingVideo(false);
      } else if (result.status === 'Fail') {
        throw new Error('视频生成失败');
      } else {
        // 视频仍在生成中，开始轮询
        setVideoMessage('视频正在生成中，请稍候...');
        pollVideoStatus(task.taskId);
      }
    } catch (error) {
      console.error('Error loading video:', error);
      setVideoMessage('视频加载失败');
      setIsLoadingVideo(false);
    }
  }, []);

  // 轮询视频状态
  const pollVideoStatus = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 5分钟
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/generate-video?taskId=${taskId}`);
        const result = await response.json();
        
        const progress = Math.min(20 + (attempts / maxAttempts) * 70, 90);
        setVideoProgress(progress);
        
        if (result.status === 'Success' && result.downloadInfo) {
          setVideoDownloadUrl(result.downloadInfo.downloadUrl);
          setVideoProgress(100);
          setVideoMessage('视频生成完成！');
          setVideoCompleted(true);
          setIsLoadingVideo(false);
        } else if (result.status === 'Fail') {
          throw new Error('视频生成失败');
        } else {
          // 继续轮询
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // 10秒后再查询
          } else {
            setVideoMessage('视频生成超时，请稍后重试');
            setIsLoadingVideo(false);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        setVideoMessage('视频状态查询失败');
        setIsLoadingVideo(false);
      }
    };
    
    poll();
  };

  // 完成游戏，开始播放视频
  const handleGameComplete = () => {
    if (category === 'history') {
      setGameCompleted(true);
      loadAndPlayVideo();
    } else {
      // 非历史科目直接跳转到学习总结
      router.push('/summary');
    }
  };

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded || !query) {
    console.log('⏳ 显示加载状态:', { isLoaded, hasQuery: !!query })
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-center">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse mb-4"></div>
            <div className="text-sm text-gray-500">
              {!isLoaded ? '正在加载...' : !query ? '准备中...' : '初始化...'}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      
      {/* 极简导航 - 只有返回按钮 */}
      <div className="absolute top-8 left-8 z-20">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center bg-[rgb(var(--background))]/80 backdrop-blur-sm border border-[rgb(var(--border))] rounded-full text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))] hover:border-[rgb(var(--muted-foreground))] transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 简约刷新按钮 - 右上角 */}
      {currentGame && (
        <div className="absolute top-8 right-8 z-20">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleRefreshGame}
            className="w-10 h-10 flex items-center justify-center bg-[rgb(var(--background))]/80 backdrop-blur-sm border border-[rgb(var(--border))] rounded-full text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))] hover:border-[rgb(var(--muted-foreground))] transition-all duration-300 shadow-sm hover:shadow-md"
            title="刷新游戏"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="w-full h-screen">
        <AnimatePresence mode="wait">
          {/* 游戏阶段 */}
          {!gameCompleted && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {isWaitingForGame ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-16 h-16 mx-auto mb-8 bg-gray-100 rounded-2xl flex items-center justify-center"
                    >
                      <Play className="w-8 h-8 text-gray-400" />
                    </motion.div>
                    
                    <div className="text-lg font-light text-gray-900 mb-2">
                      游戏正在生成中
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      请稍候片刻
                    </div>
                  </div>
                </div>
              ) : currentGame ? (
                /* 游戏全屏显示 */
                (() => {
                  console.log('🎮 渲染游戏:', {
                    title: currentGame.title,
                    htmlLength: currentGame.html?.length,
                    htmlPreview: currentGame.html?.substring(0, 100) + '...'
                  })
                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        className="game-container w-[95vw] h-[95vh] bg-[rgb(var(--background))] rounded-2xl shadow-sm border border-[rgb(var(--border))] overflow-hidden"
                      >
                      <iframe
                        key={gameKey} // 添加key以强制刷新iframe
                        srcDoc={currentGame.html}
                        className="w-full h-full border-0"
                        title={currentGame.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                        scrolling="auto"
                        style={{ 
                          WebkitOverflowScrolling: 'touch',
                          overflowX: 'auto',
                          overflowY: 'auto'
                        }}
                        onLoad={() => console.log('🎮 iframe加载完成')}
                        onError={(e) => console.error('🎮 iframe加载错误:', e)}
                      />
                    </motion.div>
                    </div>
                  )
                })()
              ) : (
                /* 无游戏状态 */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-light text-primary mb-6">
                      无可用游戏
                    </div>
                    <motion.button
                      onClick={() => router.push('/configure')}
                      className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black text-sm font-medium rounded-full hover:bg-black/90 dark:hover:bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      重新开始
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 视频阶段 - 游戏完成后显示（仅历史科目） */}
          {gameCompleted && category === 'history' && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="max-w-4xl mx-auto px-8 text-center">
                {isLoadingVideo && !videoCompleted ? (
                  /* 视频加载进度界面 */
                  <div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-20 h-20 mx-auto mb-8 bg-gray-100 rounded-2xl flex items-center justify-center"
                    >
                      <Video className="w-10 h-10 text-gray-600" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-light text-gray-900 mb-4">
                      🎉 游戏完成！正在准备历史视频...
                    </h2>
                    
                    <div className="mb-6">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <motion.div 
                          className="bg-gray-900 h-2 rounded-full" 
                          style={{ width: `${videoProgress}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${videoProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {videoMessage} ({videoProgress}%)
                      </p>
                    </div>
                    
                    {videoPrompt && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">视频场景提示词：</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {videoPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                ) : videoCompleted ? (
                  /* 视频生成完成界面 - Silicon Valley Minimalist */
                  <div className="max-w-lg mx-auto">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      className="w-16 h-16 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center"
                    >
                      <Video className="w-7 h-7 text-gray-700" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      className="text-center mb-12"
                    >
                      <h2 className="heading-lg mb-3">
                        Video Generated
                      </h2>
                      
                      <p className="text-body font-light">
                        Your personalized learning video is ready
                      </p>
                    </motion.div>
                    
                    {videoDownloadUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="space-y-6"
                      >
                        <motion.a
                          href={videoDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary-minimal w-full inline-flex items-center justify-center py-4"
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 0 }}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Watch Video
                        </motion.a>
                        
                        <motion.button
                          onClick={() => router.push('/summary')}
                          className="btn-ghost-minimal w-full py-3"
                          whileHover={{ y: -1 }}
                          whileTap={{ y: 0 }}
                        >
                          Continue Learning
                        </motion.button>
                      </motion.div>
                    )}
                    
                    {videoPrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="mt-12 p-6 bg-card border border-default rounded-2xl text-left"
                      >
                        <h3 className="text-caption uppercase tracking-wide text-gray-500 mb-3">Scene Description</h3>
                        <p className="text-body leading-relaxed font-light">
                          {videoPrompt}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* 学习完成状态 - Silicon Valley Minimalist */
                  <div className="max-w-lg mx-auto">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      className="w-16 h-16 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-7 h-7 text-gray-700" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      className="text-center mb-12"
                    >
                      <h2 className="heading-lg mb-3">
                        Learning Complete
                      </h2>
                      
                      <p className="text-body font-light">
                        {videoMessage || 'Great work! Ready for the next step?'}
                      </p>
                    </motion.div>
                    
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      onClick={() => router.push('/summary')}
                      className="btn-primary-minimal w-full py-4"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      Continue Learning
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
} 