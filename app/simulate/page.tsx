"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RotateCcw, Play, Pause, Info } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SimulatePage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [query, setQuery] = useState("")
  const [userResponses, setUserResponses] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  // 模拟器参数
  const [angle, setAngle] = useState(45)
  const [velocity, setVelocity] = useState(50)
  const [attempts, setAttempts] = useState(0)
  const [hits, setHits] = useState(0)
  
  // 动画相关
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 400 })
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([])
  const [animationFrame, setAnimationFrame] = useState<number | null>(null)

  useEffect(() => {
    const savedQuery = localStorage.getItem('knowgo-query')
    const savedResponses = localStorage.getItem('knowgo-responses')
    
    if (savedQuery) {
      setQuery(savedQuery)
      if (savedResponses) {
        setUserResponses(JSON.parse(savedResponses))
      }
    } else {
      router.push('/')
    }
  }, [router])

  // 获取对应主题的模拟器配置
  const getSimulatorConfig = (topic: string) => {
    const configs = {
      "parabola": {
        title: "Basketball Shot Simulator",
        subtitle: "Explore the mathematics of perfect shots",
        targetZone: { x: 650, y: 380, width: 60, height: 20 },
        gravity: 0.3,
        hint: "Try different angles and velocities. Notice how the ball follows a parabolic path!",
        failureHints: [
          "Too low? Try increasing the angle or velocity.",
          "Overshot? Try reducing the velocity or lowering the angle.",
          "The perfect shot isn't about strength—it's about understanding the curve."
        ]
      },
      "抛物线": {
        title: "Basketball Shot Simulator", 
        subtitle: "Explore the mathematics of perfect shots",
        targetZone: { x: 650, y: 380, width: 60, height: 20 },
        gravity: 0.3,
        hint: "Try different angles and velocities. Notice how the ball follows a parabolic path!",
        failureHints: [
          "Too low? Try increasing the angle or velocity.",
          "Overshot? Try reducing the velocity or lowering the angle.", 
          "The perfect shot isn't about strength—it's about understanding the curve."
        ]
      },
      "machine learning": {
        title: "Recommendation Engine",
        subtitle: "See how algorithms learn your preferences",
        targetZone: { x: 600, y: 200, width: 100, height: 200 },
        gravity: 0,
        hint: "Each 'shot' represents a recommendation. Watch how the system learns!",
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
        gravity: 0.1,
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

  // 物理计算
  const calculateTrajectory = (angle: number, velocity: number) => {
    const points: {x: number, y: number}[] = []
    const angleRad = (angle * Math.PI) / 180
    const vx = velocity * Math.cos(angleRad) * 0.8
    const vy = velocity * Math.sin(angleRad) * 0.8
    
    for (let t = 0; t < 150; t++) {
      const x = 50 + vx * t * 0.1
      const y = 400 - (vy * t * 0.1 - 0.5 * config.gravity * t * t * 0.01)
      
      if (y > 450) break // 触地
      points.push({ x, y })
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
    
    const points = calculateTrajectory(angle, velocity)
    let currentIndex = 0
    
    const animate = () => {
      if (currentIndex < points.length) {
        setBallPosition(points[currentIndex])
        setTrajectory(prev => [...prev, points[currentIndex]])
        currentIndex++
        const frame = requestAnimationFrame(animate)
        setAnimationFrame(frame)
      } else {
        setIsPlaying(false)
        checkHit(points[points.length - 1])
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
    
    // 绘制轨迹
    if (trajectory.length > 1) {
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(trajectory[0].x, trajectory[0].y)
      trajectory.forEach(point => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
    
    // 绘制球
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(ballPosition.x, ballPosition.y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制发射器
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(50, 400)
    const angleRad = (angle * Math.PI) / 180
    ctx.lineTo(50 + Math.cos(angleRad) * 30, 400 - Math.sin(angleRad) * 30)
    ctx.stroke()
    
  }, [ballPosition, trajectory, angle, config])

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
              
              {/* 角度控制 */}
              <div className="space-y-3">
                <label className="text-sm text-gray-600 flex justify-between">
                  <span>Angle</span>
                  <span className="font-medium">{angle}°</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isPlaying}
                />
              </div>

              {/* 速度控制 */}
              <div className="space-y-3">
                <label className="text-sm text-gray-600 flex justify-between">
                  <span>Velocity</span>
                  <span className="font-medium">{velocity}</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isPlaying}
                />
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