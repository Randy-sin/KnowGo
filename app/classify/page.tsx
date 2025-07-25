"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Brain, Clock, Globe, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import type { QuestionCategory, ClassificationResult } from "@/lib/classifier-service"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"

export default function ClassifyPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isClassifying, setIsClassifying] = useState(false)
  const [classification, setClassification] = useState<ClassificationResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [streamMessage, setStreamMessage] = useState("")
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const { t } = useTranslations()

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

  // 移除classifyTopic函数，因为分类已经在主页完成

  // 使用流式API确认选择
  const handleConfirm = async () => {
    if (!selectedCategory) return;

    setShowConfirmation(true);
    setIsGeneratingQuestions(true);
    setStreamMessage("🚀 开始生成学习问题...");
    setGeneratedQuestions([]);
    
    // 保存分类信息
    localStorage.setItem('xknow-category', selectedCategory);
    
    // 获取用户配置信息
    const savedConfig = localStorage.getItem('xknow-config');
    const userConfig = savedConfig ? JSON.parse(savedConfig) : undefined;

    // 生成引导问题，现在包含用户配置
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: query,
          category: selectedCategory,
          config: userConfig, // 传递用户配置
          stream: true // 启用流式输出
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let questions: any[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'start':
                    setStreamMessage("🎯 " + data.message);
                    break;

                  case 'progress':
                    setStreamMessage("⚡ " + data.message);
                    break;

                  case 'question':
                    setStreamMessage("✨ " + data.message);
                    questions[data.index] = data.question;
                    setGeneratedQuestions([...questions]);
                    break;

                  case 'complete':
                    setStreamMessage("🎉 " + data.message);
                    questions = data.questions;
                    setGeneratedQuestions(questions);

                    // 保存生成的问题并跳转到学习页面
                    localStorage.setItem('xknow-pregenerated-questions', JSON.stringify(questions));
                    setTimeout(() => {
                      router.push('/learn'); // 现在跳转到learn页面
                    }, 1500);
                    return;

                  case 'error':
                    throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Background question generation failed:', error);
      setStreamMessage("🔄 生成遇到问题，正在为您跳转到学习页面...");
      // 错误时仍跳转到learn页面，learn页面会重新生成
      setTimeout(() => {
        router.push('/learn');
      }, 2000);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('xknow-query')
    router.push('/')
  }

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
      description: "系统性学习文科知识要点"
    }
  ]

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-white/95 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-light text-gray-900 mb-3"
          >
            选择确认
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-gray-500 font-light"
          >
            正在准备你的学习内容
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 导航 */}
      <div className="absolute top-8 left-8 z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
          <h1 className="text-4xl font-extralight text-gray-900 mb-4 tracking-tight">
            智能分类
          </h1>
          <p className="text-lg text-gray-500 mb-8 font-light">
            正在分析 "<span className="text-gray-900 font-normal">{query}</span>"
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
                  className="w-4 h-4 border border-gray-300 border-t-gray-900 rounded-full"
                />
                <span className="text-sm text-gray-500 font-light">AI 正在分析...</span>
              </motion.div>
            ) : classification ? (
              <motion.div
                key="classified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100"
              >
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                <span className="text-sm text-gray-700 font-medium">
                  AI 建议：{categories.find(c => c.id === classification.category)?.title}
                </span>
                <span className="text-xs text-gray-400">
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
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
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
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {selectedCategory === category.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full m-0.5"
                      />
                    )}
                  </div>
                </div>

                <div className="ml-9">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <category.icon className="w-4 h-4 text-gray-600" />
                    </div>
                                          <div>
                        <h3 className="text-lg font-medium text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-400 font-light">{category.subtitle}</p>
                      </div>
                  </div>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
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
            <p className="text-sm text-gray-400 font-light max-w-2xl mx-auto">
              AI 分析：{classification.reasoning}
            </p>
          </motion.div>
        )}

        {/* 流式生成状态显示 */}
        {isGeneratingQuestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <div className="text-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-3"
              />
              <p className="text-sm text-gray-600 font-medium">{streamMessage}</p>
            </div>
            
            {/* 实时显示生成的问题 */}
            {generatedQuestions.length > 0 && (
              <div className="space-y-3">
                {generatedQuestions.map((question, index) => (
                  question && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {question.question}
                          </p>
                          <p className="text-xs text-gray-500">
                            {question.followUp}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 确认按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            onClick={handleConfirm}
            disabled={!selectedCategory || isGeneratingQuestions}
            whileHover={selectedCategory && !isGeneratingQuestions ? { y: -2 } : {}}
            whileTap={selectedCategory && !isGeneratingQuestions ? { y: 0 } : {}}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl font-medium transition-all duration-200 ${
              selectedCategory && !isGeneratingQuestions
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGeneratingQuestions ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-gray-300 border-t-white rounded-full"
                />
                <span>生成学习问题中...</span>
              </>
            ) : (
              <>
                <span>确认选择</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
} 