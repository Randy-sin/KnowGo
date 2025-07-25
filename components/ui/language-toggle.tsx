"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <motion.button
      onClick={toggleLanguage}
      className="relative flex items-center justify-center w-12 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group"
      whileTap={{ scale: 0.95 }}
      title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
    >
      {/* Background pill */}
      <motion.div
        className="absolute w-6 h-6 bg-white rounded-full shadow-sm"
        animate={{
          x: language === 'en' ? -8 : 8,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
      />
      
      {/* Language indicators */}
      <div className="relative flex items-center justify-between w-full px-1 text-xs font-medium">
        <span className={`transition-colors ${language === 'en' ? 'text-gray-600' : 'text-gray-400'}`}>
          EN
        </span>
        <span className={`transition-colors ${language === 'zh' ? 'text-gray-600' : 'text-gray-400'}`}>
          中
        </span>
      </div>
    </motion.button>
  )
} 