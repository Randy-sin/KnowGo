"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useTranslations } from "@/lib/use-translations"

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const { t } = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    try {
      // 先进行问题分类
      const response = await fetch('/api/classify-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: input.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to classify question')
      }

      const classification = await response.json()
      
      // 保存问题和分类结果
      localStorage.setItem('xknow-query', input.trim())
      localStorage.setItem('xknow-classification', JSON.stringify(classification))
      
      // 跳转到配置页面
      router.push('/configure')
      
    } catch (error) {
      console.error('Classification error:', error)
      // 如果分类失败，仍然保存问题，让后续流程处理
      localStorage.setItem('xknow-query', input.trim())
      router.push('/configure')
    }
  }

  return (
    <div className="hero-minimal container-minimal">
      {/* 右上角语言切换和登录状态 */}
      <div className="absolute top-8 right-8 flex items-center space-x-4">
        <LanguageToggle />
        <SignedOut>
          <Link href="/sign-in">
            <button className="btn-ghost-minimal">
              {t('common.signIn')}
            </button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
              }
            }}
          />
        </SignedIn>
      </div>

      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-8">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Main heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-large mb-16"
      >
        <h1 className="heading-xl">
          {t('home.title')}
        </h1>
        <p className="text-body-large max-w-lg mx-auto">
          {t('home.subtitle')}
        </p>
      </motion.div>

      {/* Search interface - 只对登录用户显示 */}
      <SignedIn>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl space-y-6"
        >
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="input-minimal pr-16"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Quick suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 text-sm"
          >
            {[
              { key: 'machineLearning', fallback: 'Machine Learning' },
              { key: 'reactHooks', fallback: 'React Hooks' },
              { key: 'designSystems', fallback: 'Design Systems' },
              { key: 'dataScience', fallback: 'Data Science' }
            ].map((suggestion, index) => (
              <motion.button
                key={suggestion.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                onClick={() => setInput(t(`home.suggestions.${suggestion.key}`) || suggestion.fallback)}
                className="btn-ghost-minimal"
              >
                {t(`home.suggestions.${suggestion.key}`) || suggestion.fallback}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </SignedIn>

      {/* 未登录用户显示登录提示 */}
      <SignedOut>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <p className="text-gray-600 text-lg">
            请先登录以开始您的学习之旅
          </p>
          <Link href="/sign-in">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="button-primary text-lg px-12 py-4"
            >
              立即登录
            </motion.button>
          </Link>
        </motion.div>
      </SignedOut>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <p className="text-xs text-gray-400">
          {t('common.builtForCuriousMinds')}
        </p>
      </motion.div>
    </div>
  )
}
