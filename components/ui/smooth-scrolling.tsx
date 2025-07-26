"use client"

import { ReactNode, useEffect } from 'react'
import Lenis from 'lenis'

interface SmoothScrollingProps {
  children: ReactNode
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  useEffect(() => {
    // 优化Lenis配置，提升响应速度
    const lenis = new Lenis({
      duration: 0.6,           // 大幅缩短持续时间，提升响应速度
      easing: (t: number) => {
        // 更简单快速的缓动函数
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      },
      // 优化响应配置
      lerp: 0.15,             // 提高响应速度
      wheelMultiplier: 1.2,   // 提高滚轮敏感度，更响应
      touchMultiplier: 2,     // 提高触摸响应
      smoothWheel: true,      // 启用鼠标滚轮平滑
      normalizeWheel: true,   // 标准化滚轮事件
      autoResize: true,       // 自动调整大小
    } as any)

    // 动态调整滚动行为 - 进一步优化响应
    lenis.on('scroll', ({ progress }: { progress: number }) => {
      // 保持快速响应，不过度调整
      if (progress > 0.95) {
        (lenis as any).options.lerp = 0.2  // 底部稍微加快
      } else {
        (lenis as any).options.lerp = 0.15 // 保持快速响应
      }
    })

    // 优化RAF循环
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // 清理函数
    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
} 