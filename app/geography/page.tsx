"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Globe, Map, BookOpen, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"

export default function GeographyPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const { t } = useTranslations()

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
      {/* 导航和语言切换 */}
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
      
      {/* 语言切换按钮 */}
      <div className="absolute top-8 right-8 z-10">
        <LanguageToggle />
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
            <Globe className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            {t('geography.title')}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            系统学习 <span className="font-medium text-gray-900">&ldquo;{query}&rdquo;</span> 相关知识
          </p>
          <p className="text-sm text-gray-500">
            {t('geography.subtitle')}
          </p>
        </motion.div>

        {/* 主要内容区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* 学习模块 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">地理空间</h3>
                  <p className="text-sm text-blue-600">位置・地形・气候</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                探索 &ldquo;{query}&rdquo; 的地理特征、空间分布和环境因素，理解地理位置对相关现象的影响。
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                开始学习
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">社会文化</h3>
                  <p className="text-sm text-green-600">人文・社会・文化</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                了解 &ldquo;{query}&rdquo; 相关的社会现象、文化背景和人文特色，掌握其社会意义。
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                开始学习
              </motion.button>
            </motion.div>
          </div>

          {/* 知识要点 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gray-50 rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">学习重点</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">基础概念</h4>
                <p className="text-sm text-gray-600">掌握核心定义和基本原理</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">实际应用</h4>
                <p className="text-sm text-gray-600">结合现实案例理解应用</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">综合分析</h4>
                <p className="text-sm text-gray-600">培养批判性思维能力</p>
              </div>
            </div>
          </motion.div>

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