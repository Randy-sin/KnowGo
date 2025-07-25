"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RotateCcw, Play, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"

export default function SimulatePage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [query, setQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
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

  useEffect(() => {
    const savedQuery = localStorage.getItem('knowgo-query')
    
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
        title: "二次函数探索器", 
        subtitle: "y = ax² + bx + c - 发现参数的力量",
        targetZone: { x: 650, y: 380, width: 60, height: 20 },
        hint: "调节a、b、c参数，看看它们如何影响抛物线的形状！",
        failureHints: [
          "尝试让&apos;a&apos;更负，创造更陡峭的向下曲线。",
          "调节&apos;b&apos;来改变抛物线的倾斜和方向。", 
          "参数&apos;c&apos;控制抛物线的垂直起始位置。"
        ]
      },
      "machine learning": {
        title: "Recommendation Engine",
        subtitle: "See how algorithms learn your preferences",
        targetZone: { x: 600, y: 200, width: 100, height: 200 },
        hint: "Each shot represents a recommendation. Watch how the system learns!",
        failureHints: [
          "The algorithm is learning from your choices...",
          "Notice how recommendations get better over time?",
          "This is how your phone learns what you like!"
        ]
      },
      "react": {
        title: "Component Interaction",
        subtitle: "Visualize how React components respond",
        targetZone: { x: 600, y: 300, width: 80, height: 100 },
        hint: "Each interaction triggers a state change. Watch the instant response!",
        failureHints: [
          "See how fast the interface responds?",
          "Every click creates an immediate reaction.",
          "This responsiveness is what makes modern web apps feel alive!"
        ]
      }
    }
    
    return configs[topic.toLowerCase() as keyof typeof configs] || configs["parabola"]
  }

  const config = getSimulatorConfig(query)

  // 二次函数计算 - y = ax² + bx + c
  const calculateQuadraticPath = (a: number, b: number, c: number) => {
    const points: {x: number, y: number}[] = []
    
    // 从x=50开始，到x=750结束，模拟投射路径
    for (let x = 50; x <= 750; x += 2) {
      // 使用二次函数公式
      const relativeX = (x - 50) / 10 // 缩放x坐标以适合显示
      const y = 400 - (a * relativeX * relativeX + b * relativeX + c)
      
      // 确保坐标是有效数字
      if (isFinite(x) && isFinite(y)) {
        // 如果y值过高或过低，停止计算
        if (y > 500 || y < 0) break
        points.push({ x, y })
      } else {
        break
      }
    }
    
    return points
  }

  // 开始模拟
  const startSimulation = () => {
    if (isPlaying) return
    
    setAttempts(prev => prev + 1)
    setIsPlaying(true)
    setTrajectory([])
    setBallPosition({ x: 50, y: 400 })
    
    const points = calculateQuadraticPath(paramA, paramB, paramC)
    let currentIndex = 0
    
    const animate = () => {
      if (currentIndex < points.length && points[currentIndex]) {
        const currentPoint = points[currentIndex]
        // 确保当前点有有效坐标
        if (currentPoint && typeof currentPoint.x === 'number' && typeof currentPoint.y === 'number') {
          setBallPosition(currentPoint)
          setTrajectory(prev => [...prev, currentPoint])
        }
        currentIndex++
        const frame = requestAnimationFrame(animate)
        setAnimationFrame(frame)
      } else {
        setIsPlaying(false)
        // 检查最后一个有效点
        const lastValidPoint = points[points.length - 1]
        if (lastValidPoint && typeof lastValidPoint.x === 'number' && typeof lastValidPoint.y === 'number') {
          checkHit(lastValidPoint)
        }
      }
    }
    
    animate()
  }

  // 检查是否命中目标
  const checkHit = (finalPos: {x: number, y: number}) => {
    const { x, y, width, height } = config.targetZone
    const hit = finalPos.x >= x && finalPos.x <= x + width && 
                finalPos.y >= y && finalPos.y <= y + height
    
    if (hit) {
      setHits(prev => prev + 1)
      setShowHint(false)
    } else {
      setShowHint(true)
    }
  }

  // 重置模拟
  const resetSimulation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    setIsPlaying(false)
    setBallPosition({ x: 50, y: 400 })
    setTrajectory([])
    setShowHint(false)
  }

  // 绘制画布
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
      
      // 找到第一个有效点
      const firstValidPoint = trajectory.find(point => point && typeof point.x === 'number' && typeof point.y === 'number')
      if (firstValidPoint) {
        ctx.moveTo(firstValidPoint.x, firstValidPoint.y)
        
        trajectory.forEach(point => {
          // 确保点存在且有有效的x,y坐标
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            ctx.lineTo(point.x, point.y)
          }
        })
        
        ctx.stroke()
      }
    }
    
    // 绘制球 - 添加安全检查
    if (ballPosition && typeof ballPosition.x === 'number' && typeof ballPosition.y === 'number') {
      ctx.fillStyle = '#1f2937'
      ctx.beginPath()
      ctx.arc(ballPosition.x, ballPosition.y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 绘制坐标轴参考线
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    // 绘制起始点参考线
    ctx.beginPath()
    ctx.moveTo(50, 0)
    ctx.lineTo(50, 500)
    ctx.stroke()
    
    // 绘制中心水平线
    ctx.beginPath()
    ctx.moveTo(0, 400)
    ctx.lineTo(800, 400)
    ctx.stroke()
    
    ctx.setLineDash([]) // 重置虚线
    
  }, [ballPosition, trajectory, paramA, paramB, paramC, config])

  const handleBack = () => {
    router.push('/learn')
  }

  const getCurrentHint = () => {
    if (!showHint) return ""
    const hintIndex = Math.min(attempts - hits - 1, config.failureHints.length - 1)
    return config.failureHints[Math.max(0, hintIndex)]
  }

  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0

  return (
    <div className="min-h-screen bg-white">
      
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row h-screen">
        
        {/* 左侧：模拟器画布 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl"
          >
            
            {/* 标题 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-gray-900 mb-2">{config.title}</h1>
              <p className="text-sm text-gray-500">{config.subtitle}</p>
            </div>

            {/* 画布 */}
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-auto"
              />
              
              {/* 统计信息 */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <div className="flex space-x-4 text-gray-600">
                  <span>Attempts: {attempts}</span>
                  <span>Hits: {hits}</span>
                  <span>Accuracy: {accuracy}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 右侧：控制面板 */}
        <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-100 p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            
            {/* 参数控制 */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
              
              {/* 参数 a 控制 */}
              <div className="space-y-3">
                <label className="text-sm text-gray-600 flex justify-between">
                  <span>a (curvature)</span>
                  <span className="font-medium">{paramA.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="-0.05"
                  max="0.05"
                  step="0.001"
                  value={paramA}
                  onChange={(e) => setParamA(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isPlaying}
                />
                <p className="text-xs text-gray-500">Controls the curve&apos;s opening direction and steepness</p>
              </div>

              {/* 参数 b 控制 */}
              <div className="space-y-3">
                <label className="text-sm text-gray-600 flex justify-between">
                  <span>b (slope)</span>
                  <span className="font-medium">{paramB.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={paramB}
                  onChange={(e) => setParamB(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isPlaying}
                />
                <p className="text-xs text-gray-500">Controls the linear component and tilt</p>
              </div>

              {/* 参数 c 控制 */}
              <div className="space-y-3">
                <label className="text-sm text-gray-600 flex justify-between">
                  <span>c (y-intercept)</span>
                  <span className="font-medium">{paramC.toFixed(0)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={paramC}
                  onChange={(e) => setParamC(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isPlaying}
                />
                <p className="text-xs text-gray-500">Controls the starting height</p>
              </div>

              {/* 当前方程显示 */}
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm font-mono text-center">
                  y = {paramA.toFixed(3)}x² + {paramB.toFixed(2)}x + {paramC.toFixed(0)}
                </p>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="space-y-4">
              <motion.button
                onClick={startSimulation}
                disabled={isPlaying}
                whileHover={!isPlaying ? { scale: 1.02 } : {}}
                whileTap={!isPlaying ? { scale: 0.98 } : {}}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>{isPlaying ? 'Simulating...' : 'Launch'}</span>
              </motion.button>

              <motion.button
                onClick={resetSimulation}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center space-x-2 px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </motion.button>
            </div>

            {/* AI提示 */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 border border-blue-100 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{getCurrentHint()}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 学习提示 */}
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                {config.hint}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 