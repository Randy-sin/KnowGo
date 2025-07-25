"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, Play, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"

export default function HistoryPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")

  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    if (savedQuery) {
      setQuery(savedQuery)
    } else {
      router.push('/')
    }
  }, [router])

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

  const handleBack = () => {
    router.push('/classify')
  }

  const handleNewQuery = () => {
    localStorage.removeItem('xknow-query')
    localStorage.removeItem('xknow-category')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleBack}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="container mx-auto px-6 py-20">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            历史学习
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            探索 <span className="font-medium text-gray-900">"{query}"</span> 的历史脉络
          </p>
          <p className="text-sm text-gray-500">
            通过可视化内容深入了解历史知识
          </p>
        </motion.div>

        {/* 主要内容区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* 视频播放区域 */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
                  <Play className="w-6 h-6 text-gray-600 ml-1" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  历史教学视频
                </h3>
                <p className="text-gray-600">
                  关于 "{query}" 的详细历史解说
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>播放视频</span>
              </motion.button>
            </div>
          </div>

          {/* 学习要点 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">核心概念</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                深入了解 "{query}" 的历史背景、重要人物和关键事件，掌握其在历史进程中的重要意义。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">时间脉络</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                按照时间顺序梳理相关历史事件，建立完整的历史认知框架。
              </p>
            </motion.div>
          </div>

          {/* 底部操作 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <motion.button
              onClick={handleNewQuery}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="inline-flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>学习其他主题</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 