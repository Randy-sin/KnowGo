"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Save search query and redirect to configuration immediately
    localStorage.setItem('xknow-query', input.trim())
    router.push('/configure')
  }

  return (
    <div className="hero-minimal container-minimal">
      {/* 右上角登录状态 */}
      <div className="absolute top-8 right-8">
        <SignedOut>
          <Link href="/sign-in">
            <button className="btn-ghost-minimal">
              Sign in
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
          Xknow
        </h1>
        <p className="text-body-large max-w-lg mx-auto">
          Your AI learning companion. Ask anything, learn everything.
        </p>
      </motion.div>

      {/* Search interface */}
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
            placeholder="What would you like to learn today?"
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
            "Machine Learning",
            "React Hooks",
            "Design Systems",
            "Data Science"
          ].map((suggestion, index) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              onClick={() => setInput(suggestion)}
              className="btn-ghost-minimal"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <p className="text-xs text-gray-400">
          Built for curious minds
        </p>
      </motion.div>
    </div>
  )
}
