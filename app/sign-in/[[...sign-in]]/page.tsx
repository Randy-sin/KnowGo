"use client"

import { SignIn } from '@clerk/nextjs'
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"

export default function Page() {
  const { t } = useTranslations()
  
  return (
    <div className="min-h-screen bg-page flex items-center justify-center relative">
      {/* 返回主页按钮 */}
      <div className="absolute top-8 left-8">
        <Link 
          href="/"
          className="w-6 h-6 flex items-center justify-center text-secondary hover:text-primary transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="w-full max-w-md px-6">
        {/* 品牌标识 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-6">
            <Sparkles className="w-6 h-6 text-[rgb(var(--background))]" />
          </div>
          <h1 className="text-3xl font-light text-primary mb-2">
            {t('signin.title')}
          </h1>
          <p className="text-secondary text-sm">
            {t('signin.subtitle')}
          </p>
        </motion.div>

        {/* 更保守的Clerk组件实现 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <SignIn 
            appearance={{
              variables: {
                colorPrimary: "rgb(var(--primary))",
                colorBackground: "rgb(var(--background))",
                borderRadius: "12px",
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
              },
              elements: {
                // 只自定义最必要的样式，不隐藏任何元素
                card: "shadow-none border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--background))] p-8",
                
                // 只隐藏头部，保留所有其他元素
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                
                // 保持输入框和按钮的基本样式
                formFieldInput: "border border-[rgb(var(--border))] rounded-xl px-4 py-3 bg-[rgb(var(--background))] text-[rgb(var(--foreground))]",
                formButtonPrimary: "bg-[rgb(var(--primary))] text-[rgb(var(--background))] rounded-xl py-3 px-6 hover:bg-[rgb(var(--primary))]/90",
                
                // 不干扰底部链接的样式
                footerActionLink: "text-[rgb(var(--primary))] hover:underline font-medium"
              }
            }}
          />
        </motion.div>

        {/* 底部说明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-secondary">
            {t('signin.termsNotice')}
          </p>
        </motion.div>
      </div>

      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--muted))]/30 to-transparent pointer-events-none" />
    </div>
  )
} 