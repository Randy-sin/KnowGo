"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RotateCcw, Play, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { useTranslations } from "@/lib/use-translations"

export default function SimulatePage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [query, setQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const { t } = useTranslations()
  
  // 模拟器参数 - 改为二次函数参数
  const [paramA, setParamA] = useState(-0.01) // 控制开口方向和大小
  const [paramB, setParamB] = useState(0.8)   // 控制倾斜度
  const [paramC, setParamC] = useState(50)    // 控制起始高度
  const [attempts, setAttempts] = useState(0)
  const [hits, setHits] = useState(0)
  
  // 动画相关
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 400 })
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([])
  const [animationFrame, setAnimationFrame] = useState<number | null>(null)

  // 将第一个useEffect移到组件顶部
  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    
    if (savedQuery) {
      setQuery(savedQuery)
    } else {
      router.push('/')
    }
  }, [router])

  // 获取对应主题的模拟器配置
  const getSimulatorConfig = (topic: string) => {
    const configs = {
      "parabola": {
        title: "Quadratic Function Explorer",
        subtitle: "y = ax² + bx + c - Discover the power of parameters",
        targetZone: { x: 650, y: 380, width: 60, height: 20 },
        hint: "Adjust a, b, and c to see how they affect the parabola shape!",
        failureHints: [
          "Try making &apos;a&apos; more negative to create a steeper curve downward.",
          "Adjust &apos;b&apos; to change the tilt and direction of the parabola.",
          "The parameter &apos;c&apos; controls where your parabola starts vertically."
        ]
      },
      "抛物线": {
        title: "Quadratic Function Explorer",
        subtitle: "y = ax² + bx + c - Discover the power of parameters",
        targetZone: { x: 650, y: 380, width: 60, height: 20 },
        hint: "Adjust a, b, and c to see how they affect the parabola shape!",
        failureHints: [
          "Try making &apos;a&apos; more negative to create a steeper curve downward.",
          "Adjust &apos;b&apos; to change the tilt and direction of the parabola.",
          "The parameter &apos;c&apos; controls where your parabola starts vertically."
        ]
      },
      "机器学习": {
        title: "Data Pattern Simulator",
        subtitle: "Watch AI learn from data patterns",
        targetZone: { x: 600, y: 300, width: 80, height: 60 },
        hint: "Adjust learning parameters to see how AI finds patterns!",
        failureHints: [
          "Try increasing the learning rate to speed up pattern recognition.",
          "More data points help the model find better patterns.",
          "Balance complexity - too simple or too complex both have issues."
        ]
      },
      "machine learning": {
        title: "Data Pattern Simulator", 
        subtitle: "Watch AI learn from data patterns",
        targetZone: { x: 600, y: 300, width: 80, height: 60 },
        hint: "Adjust learning parameters to see how AI finds patterns!",
        failureHints: [
          "Try increasing the learning rate to speed up pattern recognition.",
          "More data points help the model find better patterns.",
          "Balance complexity - too simple or too complex both have issues."
        ]
      },
      "react": {
        title: "Component State Simulator",
        subtitle: "See how React components respond to state changes",
        targetZone: { x: 580, y: 320, width: 100, height: 40 },
        hint: "Modify component props to see reactive updates!",
        failureHints: [
          "Components re-render when state changes - try different values.",
          "Props flow down, events bubble up in React components.",
          "Find the right balance of state updates for smooth interactions."
        ]
      }
    }
    
    return configs[topic.toLowerCase() as keyof typeof configs] || {
      title: "Interactive Simulator",
      subtitle: "Explore the dynamics of your topic",
      targetZone: { x: 600, y: 350, width: 80, height: 50 },
      hint: "Experiment with different parameter values!",
      failureHints: [
        "Try adjusting the first parameter to see its effect.",
        "The second parameter controls a different aspect.",
        "Fine-tune all parameters to achieve the target result."
      ]
    }
  }

  const config = getSimulatorConfig(query)

  // 将第二个useEffect移到这里（绘制画布）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制背景
    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制目标区域
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(config.targetZone.x, config.targetZone.y, config.targetZone.width, config.targetZone.height)
    
    // 绘制轨迹 - 添加安全检查
    if (trajectory.length > 1) {
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(trajectory[0].x, trajectory[0].y)
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y)
      }
      ctx.stroke()
    }
    
    // 绘制小球
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(ballPosition.x, ballPosition.y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制二次函数曲线预览
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 2
    ctx.beginPath()
    let firstPoint = true
    for (let x = 0; x < 800; x += 2) {
      const y = paramA * x * x + paramB * x + paramC
      if (y >= 0 && y <= 500) {
        if (firstPoint) {
          ctx.moveTo(x, y)
          firstPoint = false
        } else {
          ctx.lineTo(x, y)
        }
      }
    }
    ctx.stroke()
  }, [ballPosition, trajectory, paramA, paramB, paramC, config.targetZone])

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

  // 模拟动画函数
  const simulateParabola = () => {
    setIsPlaying(true)
    setAttempts(prev => prev + 1)
    
    const newTrajectory: {x: number, y: number}[] = []
    let currentX = 50
    
    const animate = () => {
      currentX += 3
      const currentY = paramA * currentX * currentX + paramB * currentX + paramC
      
      newTrajectory.push({ x: currentX, y: currentY })
      setTrajectory([...newTrajectory])
      setBallPosition({ x: currentX, y: currentY })
      
      // 检查是否击中目标
      if (
        currentX >= config.targetZone.x &&
        currentX <= config.targetZone.x + config.targetZone.width &&
        currentY >= config.targetZone.y &&
        currentY <= config.targetZone.y + config.targetZone.height
      ) {
        setHits(prev => prev + 1)
        setIsPlaying(false)
        setShowHint(false)
        return
      }
      
      // 检查是否超出边界
      if (currentX > 800 || currentY > 500 || currentY < 0) {
        setIsPlaying(false)
        setShowHint(true)
        return
      }
      
      const frameId = requestAnimationFrame(animate)
      setAnimationFrame(frameId)
    }
    
    animate()
  }

  const resetSimulation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      setAnimationFrame(null)
    }
    setIsPlaying(false)
    setBallPosition({ x: 50, y: 400 })
    setTrajectory([])
    setShowHint(false)
  }

  const handleNewQuery = () => {
    localStorage.removeItem('xknow-query')
    localStorage.removeItem('xknow-config')
    router.push('/')
  }

  if (!query) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
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

      {/* 主内容区域 */}
      <div className="container mx-auto px-6 py-12">
        
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600 text-sm">
            {config.subtitle}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* 模拟器画布 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="card-minimal p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">{t('simulate.interactiveSimulation')}</h2>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{t('simulate.attempts')}: {attempts}</span>
                  <span>•</span>
                  <span>{t('simulate.hits')}: {hits}</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex space-x-2">
                  <motion.button
                    onClick={simulateParabola}
                    disabled={isPlaying}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`btn-primary-minimal px-4 py-2 text-sm ${
                      isPlaying ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? t('simulate.running') : t('simulate.runSimulation')}
                  </motion.button>
                  
                  <motion.button
                    onClick={resetSimulation}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-ghost-minimal px-4 py-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t('simulate.reset')}
                  </motion.button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {t('simulate.goal')}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 控制面板 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            
            {/* 参数控制 */}
            <div className="card-minimal p-6">
              <h3 className="text-lg font-medium mb-4">{t('simulate.parameters')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameter a: {paramA.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="-0.05"
                    max="0.05"
                    step="0.001"
                    value={paramA}
                    onChange={(e) => setParamA(parseFloat(e.target.value))}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Controls curve direction and steepness
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameter b: {paramB.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={paramB}
                    onChange={(e) => setParamB(parseFloat(e.target.value))}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Controls tilt and trajectory angle
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameter c: {paramC.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={paramC}
                    onChange={(e) => setParamC(parseFloat(e.target.value))}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Controls starting height
                  </div>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card-minimal p-4 bg-blue-50 border-blue-200"
                >
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      {t('simulate.tryAdjusting')}
                    </p>
                      <p className="text-xs text-blue-700">
                        {config.failureHints[attempts % config.failureHints.length]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 基础信息 */}
            <div className="card-minimal p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    {t('simulate.howItWorks')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {config.hint}
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
} 