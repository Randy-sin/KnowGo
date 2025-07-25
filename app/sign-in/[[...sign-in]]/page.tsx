"use client"

import { SignIn } from '@clerk/nextjs'
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* 返回主页按钮 */}
      <div className="absolute top-8 left-8">
        <Link 
          href="/"
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors duration-300"
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
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-6">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Welcome to Xknow
          </h1>
          <p className="text-gray-500 text-sm">
            Sign in to continue or create a new account
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
                colorPrimary: "#000000",
                colorBackground: "#ffffff",
                borderRadius: "12px",
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
              },
              elements: {
                // 只自定义最必要的样式，不隐藏任何元素
                card: "shadow-none border border-gray-200 rounded-2xl bg-white p-8",
                
                // 只隐藏头部，保留所有其他元素
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                
                // 保持输入框和按钮的基本样式
                formFieldInput: "border border-gray-200 rounded-xl px-4 py-3",
                formButtonPrimary: "bg-black text-white rounded-xl py-3 px-6 hover:bg-gray-800",
                
                // 不干扰底部链接的样式
                footerActionLink: "text-black hover:underline font-medium"
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
          <p className="text-xs text-gray-400">
            By continuing, you agree to our terms and privacy policy
          </p>
        </motion.div>
      </div>

      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent pointer-events-none" />
    </div>
  )
} 