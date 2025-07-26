"use client"

import { useRef, ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxProps {
  children: ReactNode
  speed?: number
  className?: string
}

export default function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

// 渐变遮罩组件
export function GradientMask({ 
  children, 
  className = '',
  direction = 'to-bottom'
}: { 
  children: ReactNode
  className?: string
  direction?: 'to-bottom' | 'to-top' | 'to-both'
}) {
  const gradientClass = {
    'to-bottom': 'bg-gradient-to-b from-transparent via-white to-white',
    'to-top': 'bg-gradient-to-t from-transparent via-white to-white', 
    'to-both': 'bg-gradient-to-b from-white via-transparent to-white'
  }[direction]

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className={`absolute inset-0 ${gradientClass} pointer-events-none`} />
    </div>
  )
}

// 优化的滚动触发淡入组件
export function ScrollReveal({ 
  children, 
  className = '',
  delay = 0
}: { 
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.6"] // 更合适的触发范围
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [20, 0]) // 减少移动距离
  const scale = useTransform(scrollYProgress, [0, 1], [0.98, 1]) // 添加微妙缩放

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      transition={{ 
        delay,
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] // 更自然的缓动函数
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 