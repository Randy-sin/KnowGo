"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Brain, Clock, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import type { QuestionCategory, ClassificationResult } from "@/lib/classifier-service"
// import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"
import { LearningSessionService } from "@/lib/learning-session-service"

export default function ClassifyPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isClassifying] = useState(false)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null)

  useEffect(() => {
    const savedQuery = localStorage.getItem('xknow-query')
    const savedClassification = localStorage.getItem('xknow-classification')
    
    if (savedQuery && savedClassification) {
      setQuery(savedQuery)
      try {
        const classification = JSON.parse(savedClassification)
        setClassification(classification)
        setSelectedCategory(classification.category)
      } catch (error) {
        console.error('Failed to parse saved classification:', error)
        // 如果解析失败，跳转回主页重新开始
        router.push('/')
      }
    } else {
      // 如果没有保存的数据，跳转回主页
      router.push('/')
    }
  }, [router])

  // 确认选择并跳转到学习页面
  const handleConfirm = async () => {
    if (!selectedCategory) return;
    
    // 保存分类信息到localStorage（保持现有逻辑）
    localStorage.setItem('xknow-category', selectedCategory);
    
    // 如果用户已登录且有学习会话，更新数据库中的分类确认
    if (user?.id) {
      const sessionId = localStorage.getItem('xknow-session-id')
      if (sessionId) {
        try {
          await LearningSessionService.confirmCategory(sessionId, selectedCategory)
          console.log('✅ 用户分类确认已保存到数据库')
        } catch (error) {
          console.error('❌ 保存分类确认失败:', error)
          // 数据库操作失败不影响用户体验
        }
      }
    }
    
    // 立即跳转到学习页面，提供流畅体验
    router.push('/learn');
    
    // 🎮 游戏生成已移至configure页面，所有科目都在配置完成后开始生成
    
    // 🎬 历史科目额外生成视频（游戏完成后播放）
    if (selectedCategory === 'history') {
      generateHistoryVideoInBackground();
    }
  };

  const handleBack = () => {
    localStorage.removeItem('xknow-query')
    localStorage.removeItem('xknow-quiz') // 清理预生成的quiz数据
    router.push('/')
  }

  // 后台生成历史视频的函数
  const generateHistoryVideoInBackground = async () => {
    try {
      const savedQuery = localStorage.getItem('xknow-query');
      const savedConfig = localStorage.getItem('xknow-config');
      
      if (savedQuery && savedConfig) {
        console.log('🎬 开始后台历史视频生成...')
        
        const config = JSON.parse(savedConfig);
        
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: savedQuery,
            userLevel: config.level || 'intermediate',
            action: 'create-task'  // 只创建任务，不等待完成
          })
        });

        if (response.ok) {
          const data = await response.json();
          // 保存视频任务信息以供后续查询
          localStorage.setItem('xknow-video-task', JSON.stringify({
            taskId: data.taskId,
            videoPrompt: data.videoPrompt,
            topic: data.topic,
            userLevel: data.userLevel,
            createdAt: Date.now()
          }));
          console.log('🎬 历史视频任务已创建:', data.taskId)
        } else if (response.status === 503) {
          // MiniMax服务不可用，但提示词已生成
          const errorData = await response.json();
          console.warn('🎬 视频服务暂时不可用:', errorData.error);
          if (errorData.videoPrompt) {
            console.log('💡 视频提示词已生成:', errorData.videoPrompt);
          }
        } else {
          console.error('历史视频任务创建失败:', response.status)
        }
      }
    } catch (error) {
      console.error('后台历史视频生成出错:', error);
    }
  }

  // 如果用户未登录，重定向到登录页
  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />
  }

  // 加载状态
  if (!isLoaded || !query) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
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

  const categories = [
    {
      id: "science" as QuestionCategory,
      title: "理科",
      subtitle: "数学・物理・化学・生物",
      icon: Brain,
      description: "深度理解理科概念，配合互动模拟器学习"
    },
    {
      id: "history" as QuestionCategory,
      title: "历史",
      subtitle: "历史事件・人物・时代",
      icon: Clock,
      description: "通过视频内容生动了解历史知识"
    },
    {
      id: "others" as QuestionCategory,
      title: "其他",
      subtitle: "地理・语言・社会・艺术",
      icon: Globe,
      description: "深度理解文科概念，配合互动模拟器学习"
    }
  ]

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extralight text-[rgb(var(--foreground))] mb-4 tracking-tight">
            智能分类
          </h1>
          <p className="text-lg text-[rgb(var(--muted-foreground))] mb-8 font-light">
            正在分析 &ldquo;<span className="text-[rgb(var(--foreground))] font-normal">{query}</span>&rdquo;
          </p>

          {/* AI 分析状态 */}
          <AnimatePresence mode="wait">
            {isClassifying ? (
              <motion.div
                key="classifying"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center space-x-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-[rgb(var(--border))] border-t-[rgb(var(--foreground))] rounded-full"
                />
                <span className="text-sm text-[rgb(var(--muted-foreground))] font-light">AI 正在分析...</span>
              </motion.div>
            ) : classification ? (
              <motion.div
                key="classified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[rgb(var(--muted))]/50 rounded-full border border-[rgb(var(--border))]"
              >
                <div className="w-1.5 h-1.5 bg-[rgb(var(--foreground))] rounded-full" />
                <span className="text-sm text-[rgb(var(--foreground))] font-medium">
                  AI 建议：{categories.find(c => c.id === classification.category)?.title}
                </span>
                <span className="text-xs text-[rgb(var(--muted-foreground))]">
                  {Math.round(classification.confidence * 100)}%
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* 分类选项 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-3 mb-8"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <motion.button
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                className={`w-full p-5 rounded-2xl border transition-all duration-200 text-left relative group ${
                  selectedCategory === category.id
                    ? 'border-[rgb(var(--foreground))] bg-[rgb(var(--muted))]/50'
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--background))] hover:border-[rgb(var(--border))]/80'
                }`}
              >
                {/* AI 推荐指示器 */}
                {classification && classification.category === category.id && (
                  <div className="absolute top-5 right-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-gray-900 rounded-full"
                    />
                  </div>
                )}

                {/* 选中状态指示器 */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-[rgb(var(--foreground))] bg-[rgb(var(--foreground))]'
                      : 'border-[rgb(var(--border))] group-hover:border-[rgb(var(--border))]/80'
                  }`}>
                    {selectedCategory === category.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-[rgb(var(--background))] rounded-full m-0.5"
                      />
                    )}
                  </div>
                </div>

                <div className="ml-9">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-[rgb(var(--muted))] rounded-lg flex items-center justify-center">
                      <category.icon className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                    </div>
                                          <div>
                        <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">{category.title}</h3>
                        <p className="text-sm text-[rgb(var(--muted-foreground))] font-light">{category.subtitle}</p>
                      </div>
                  </div>
                  <p className="text-sm text-[rgb(var(--muted-foreground))] font-light leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* AI 分析结果 */}
        {classification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-[rgb(var(--muted-foreground))] font-light max-w-2xl mx-auto">
              AI 分析：{classification.reasoning}
            </p>
          </motion.div>
        )}

        {/* 确认按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleConfirm}
            disabled={!selectedCategory}
            whileHover={selectedCategory ? { y: -2 } : {}}
            whileTap={selectedCategory ? { y: 0 } : {}}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl font-medium transition-all duration-200 ${
              selectedCategory
                ? 'bg-[rgb(var(--foreground))] text-[rgb(var(--background))] hover:bg-[rgb(var(--foreground))]/90'
                : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] cursor-not-allowed'
            }`}
          >
            <span>确认选择</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
} 