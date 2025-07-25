"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Trophy, Star, Award, Check, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"

export default function ConfigurePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [query, setQuery] = useState("")
  const [classification, setClassification] = useState<{category: string} | null>(null)
  const [isClassifying, setIsClassifying] = useState(true)

  const { t } = useTranslations()

  // 将useEffect移到组件顶部，避免条件性调用
  useEffect(() => {
    // Load the saved query to display context
    const savedQuery = localStorage.getItem('xknow-query')
    if (savedQuery) {
      setQuery(savedQuery)
    } else {
      // If no query, redirect back to home
      router.push('/')
      return
    }

    // 检查是否已有分类结果
    const savedClassification = localStorage.getItem('xknow-classification')
    if (savedClassification) {
      try {
        const classificationData = JSON.parse(savedClassification)
        setClassification(classificationData)
        setIsClassifying(false)
        console.log('加载了已保存的分类结果:', classificationData)
      } catch (error) {
        console.error('Failed to parse classification:', error)
      }
    }

    // 如果没有分类结果，设置一个监听器等待后台分类完成
    if (!savedClassification) {
      const checkClassification = () => {
        const newClassification = localStorage.getItem('xknow-classification')
        if (newClassification) {
          try {
            const classificationData = JSON.parse(newClassification)
            setClassification(classificationData)
            setIsClassifying(false)
            console.log('后台分类完成，已更新:', classificationData)
          } catch (error) {
            console.error('Failed to parse new classification:', error)
          }
        }
      }

      // 定期检查分类结果 (每500ms检查一次，最多检查10次)
      let attempts = 0
      const maxAttempts = 10
      const interval = setInterval(() => {
        checkClassification()
        attempts++
        if (attempts >= maxAttempts) {
          setIsClassifying(false)
          console.log('分类超时，停止等待')
          clearInterval(interval)
        }
      }, 500)

      // 清理函数
      return () => clearInterval(interval)
    }
  }, [router])

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

  const levels = [
    {
      id: "beginner",
      title: t('configure.levels.beginner.title'),
      description: t('configure.levels.beginner.description'),
      icon: Trophy,
      recommended: false
    },
    {
      id: "intermediate", 
      title: t('configure.levels.intermediate.title'),
      description: t('configure.levels.intermediate.description'),
      icon: Star,
      recommended: false
    },
    {
      id: "expert",
      title: t('configure.levels.expert.title'),
      description: t('configure.levels.expert.description'),
      icon: Award,
      recommended: true
    }
  ]

  const styles = [
    { id: "structured", title: t('configure.styles.structured.title'), description: t('configure.styles.structured.description') },
    { id: "story", title: t('configure.styles.story.title'), description: t('configure.styles.story.description') },
    { id: "dialogue", title: t('configure.styles.dialogue.title'), description: t('configure.styles.dialogue.description') },
    { id: "mentor", title: t('configure.styles.mentor.title'), description: t('configure.styles.mentor.description') },
    { id: "detailed", title: t('configure.styles.detailed.title'), description: t('configure.styles.detailed.description') },
    { id: "quick", title: t('configure.styles.quick.title'), description: t('configure.styles.quick.description') },
    { id: "poetic", title: t('configure.styles.poetic.title'), description: t('configure.styles.poetic.description') },
    { id: "casual", title: t('configure.styles.casual.title'), description: t('configure.styles.casual.description') },
    { id: "analytical", title: t('configure.styles.analytical.title'), description: t('configure.styles.analytical.description') },
    { id: "confucius", title: t('configure.styles.confucius.title'), description: t('configure.styles.confucius.description') },
    { id: "novel", title: t('configure.styles.novel.title'), description: t('configure.styles.novel.description') },
    { id: "einstein", title: t('configure.styles.einstein.title'), description: t('configure.styles.einstein.description') }
  ]

  const handleContinue = async () => {
    if (selectedLevel && selectedStyle) {
      // Store configuration
      const config = {
        level: selectedLevel,
        style: selectedStyle
      };
      localStorage.setItem('xknow-config', JSON.stringify(config));
      
      // 立即跳转到classify页面，提供流畅体验
      router.push('/classify');
      
      // 后台异步生成问题和重新生成游戏（不阻塞跳转）
      generateQuestionsInBackground(config)
      regenerateGameWithConfig(config)
    }
  }

  // 后台生成问题的函数
  const generateQuestionsInBackground = async (config: {level: string, style: string}) => {
    try {
      const savedQuery = localStorage.getItem('xknow-query');
      const savedClassification = localStorage.getItem('xknow-classification');
      
      if (savedQuery && savedClassification) {
        console.log('开始后台生成问题...')
        
        const classification = JSON.parse(savedClassification);
        
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: savedQuery,
            category: classification.category,
            config: config
          })
        });

        if (response.ok) {
          const data = await response.json();
          // 保存生成的问题
          localStorage.setItem('xknow-pregenerated-questions', JSON.stringify(data.questions));
          console.log('后台问题生成完成:', data.questions.length, '个问题')
        } else {
          console.error('问题生成失败:', response.status)
        }
      }
    } catch (error) {
      console.error('后台问题生成出错:', error);
    }
  }

  // 根据用户配置重新生成游戏的函数
  const regenerateGameWithConfig = async (config: {level: string, style: string}) => {
    try {
      const savedQuery = localStorage.getItem('xknow-query');
      const savedClassification = localStorage.getItem('xknow-classification');
      
      if (savedQuery && savedClassification) {
        console.log('开始根据用户配置重新生成游戏...')
        
        const classification = JSON.parse(savedClassification);
        
        const response = await fetch('/api/generate-game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: savedQuery,
            category: classification.category,
            userLevel: config.level,
            learningObjective: `通过互动游戏深度理解${savedQuery}的核心概念`,
            stream: false
          })
        });

        if (response.ok) {
          const { game } = await response.json();
          // 保存重新生成的游戏，覆盖之前的预生成结果
          localStorage.setItem('xknow-pregenerated-game', JSON.stringify(game));
          console.log('个性化游戏重新生成完成:', game.title)
        } else {
          console.error('游戏重新生成失败:', response.status)
        }
      }
    } catch (error) {
      console.error('后台游戏重新生成出错:', error);
    }
  }

  const handleBack = () => {
    // Clear any saved data and go back to home
    localStorage.removeItem('xknow-query')
    router.push('/')
  }

  if (!query) {
    return null
  }

  return (
    <div className="hero-minimal container-minimal">
      {/* Minimal back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBack}
        className="absolute top-8 left-8 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* 右上角语言切换和用户信息 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="absolute top-8 right-8"
      >
        <div className="flex items-center space-x-4">
          <LanguageToggle />
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>{t('common.topic')}:</span>
            <span className="text-gray-600 font-medium">{query}</span>
          </div>
          <div className="text-xs text-gray-500">
            {t('common.welcome')}, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </div>
        </div>
      </motion.div>

      {/* Main Header - simplified */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <h1 className="heading-lg mb-2">
          {t('configure.title')}
        </h1>
        

      </motion.div>

      <div className="w-full max-w-4xl space-y-16">
        {/* Knowledge Level */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-2">{t('configure.knowledgeLevel')}</h2>
            <p className="text-body text-sm">{t('configure.knowledgeLevelDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {levels.map((level, levelIndex) => (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.4 + levelIndex * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ 
                  scale: 0.98,
                  transition: { duration: 0.1 }
                }}
                onClick={() => setSelectedLevel(level.id)}
                className={`card-minimal p-6 text-left transition-all duration-300 relative micro-bounce ${
                  selectedLevel === level.id ? 'selected-level' : ''
                }`}
              >
                {level.recommended && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + levelIndex * 0.1, type: "spring", stiffness: 500 }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-black rounded-full border-2 border-white"
                  />
                )}
                
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      selectedLevel === level.id ? 'bg-black' : 'bg-gray-100'
                    }`}
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <level.icon className={`w-5 h-5 transition-colors duration-300 ${
                      selectedLevel === level.id ? 'text-white' : 'text-gray-600'
                    }`} />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-lg">{level.title}</h3>
                  </div>
                </div>
                
                <p className="text-body text-sm leading-relaxed">
                  {level.description}
                </p>

                <AnimatePresence>
                  {selectedLevel === level.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30 
                      }}
                      className="absolute top-4 right-4"
                    >
                      <Check className="w-4 h-4 text-black" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Learning Style */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-xl font-semibold mb-2">{t('configure.learningStyle')}</h2>
            <p className="text-body text-sm">{t('configure.learningStyleDesc')}</p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.8
                }
              }
            }}
          >
            {styles.map((style) => (
              <motion.button
                key={style.id}
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ 
                  y: -2,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ 
                  scale: 0.98,
                  transition: { duration: 0.1 }
                }}
                onClick={() => setSelectedStyle(style.id)}
                className={`card-minimal p-4 text-center transition-all duration-300 relative micro-bounce ${
                  selectedStyle === style.id ? 'selected' : ''
                }`}
              >
                <h3 className="font-medium mb-1">{style.title}</h3>
                <p className={`text-xs transition-colors duration-300 ${
                  selectedStyle === style.id ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {style.description}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </motion.section>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleContinue}
            disabled={!selectedLevel || !selectedStyle}
            className={`btn-primary-minimal px-8 py-3 text-base transition-all duration-300 ${
              selectedLevel && selectedStyle
                ? '' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            whileHover={selectedLevel && selectedStyle ? { 
              y: -2,
              transition: { duration: 0.2 }
            } : {}}
            whileTap={selectedLevel && selectedStyle ? { 
              y: -1,
              transition: { duration: 0.1 }
            } : {}}
            animate={selectedLevel && selectedStyle ? {
              boxShadow: "0 8px 25px 0 rgba(0, 0, 0, 0.15)"
            } : {}}
          >
{t('configure.startLearning')}
            <motion.div
              animate={selectedLevel && selectedStyle ? { 
                x: [0, 2, 0],
                transition: { 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: "easeInOut"
                }
              } : {}}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedLevel && selectedStyle ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex space-x-2">
          <motion.div 
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              selectedLevel ? 'bg-black' : 'bg-gray-300'
            }`}
            animate={selectedLevel ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              selectedStyle ? 'bg-black' : 'bg-gray-300'
            }`}
            animate={selectedStyle ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </div>
  )
} 