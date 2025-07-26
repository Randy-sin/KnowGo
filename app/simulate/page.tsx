"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Play, RefreshCw, Video } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { GameResponse } from "@/lib/game-generation-service"

interface GameStreamEvent {
  type: 'start' | 'progress' | 'complete' | 'error'
  message?: string
  game?: GameResponse
  error?: string
}

interface VideoStreamEvent {
  type: 'progress' | 'complete' | 'timeout' | 'error'
  stage?: string
  message?: string
  progress?: number
  videoPrompt?: string
  downloadInfo?: any
  error?: string
}

export default function SimulatePage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
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
      // 非历史科目直接跳转到反馈
      router.push('/feedback');
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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white">
      
      {/* 极简导航 - 只有返回按钮 */}
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

      {/* 简约刷新按钮 - 右上角 */}
      {currentGame && (
        <div className="absolute top-8 right-8 z-20 flex space-x-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleRefreshGame}
            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
            title="刷新游戏"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleGameComplete}
            className="px-3 py-1 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-300"
            title={category === 'history' ? "完成游戏，观看历史视频" : "完成游戏，进入反馈"}
          >
            完成
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full"
                    >
                      <iframe
                        key={gameKey} // 添加key以强制刷新iframe
                        srcDoc={currentGame.html}
                        className="w-full h-full border-0"
                        title={currentGame.title}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        onLoad={() => console.log('🎮 iframe加载完成')}
                        onError={(e) => console.error('🎮 iframe加载错误:', e)}
                      />
                    </motion.div>
                  )
                })()
              ) : (
                /* 无游戏状态 */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-light text-gray-900 mb-4">
                      无可用游戏
                    </div>
                    <motion.button
                      onClick={() => router.push('/configure')}
                      className="px-6 py-2 text-gray-900 hover:text-gray-600 transition-colors duration-300 text-sm font-light"
                      whileHover={{ y: -1 }}
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
                  /* 视频生成完成界面 */
                  <div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 mx-auto mb-8 bg-green-100 rounded-2xl flex items-center justify-center"
                    >
                      <Video className="w-10 h-10 text-green-600" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-light text-gray-900 mb-4">
                      🎬 沉浸式历史视频已生成！
                    </h2>
                    
                    <p className="text-gray-600 mb-8">
                      基于您的学习主题创作的专属历史场景视频
                    </p>
                    
                    {videoDownloadUrl && (
                      <div className="space-y-4">
                        <motion.a
                          href={videoDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors duration-300"
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 0 }}
                        >
                          🎥 观看历史视频
                        </motion.a>
                        
                        <div className="flex gap-4 justify-center mt-6">
                          <motion.button
                            onClick={() => router.push('/feedback')}
                            className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
                            whileHover={{ y: -1 }}
                            whileTap={{ y: 0 }}
                          >
                            完成学习
                          </motion.button>
                        </div>
                      </div>
                    )}
                    
                    {videoPrompt && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">视频场景提示词：</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {videoPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 视频加载失败状态 */
                  <div>
                    <motion.div
                      className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-2xl flex items-center justify-center"
                    >
                      <Video className="w-10 h-10 text-red-600" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-light text-gray-900 mb-4">
                      🎉 游戏完成！
                    </h2>
                    
                    <p className="text-gray-600 mb-8">
                      {videoMessage || '视频暂时无法播放，但您已完成学习任务'}
                    </p>
                    
                    <motion.button
                      onClick={() => router.push('/feedback')}
                      className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors duration-300"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      完成学习
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