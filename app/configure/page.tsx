"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Trophy, Star, Award, Check, Sparkles, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ConfigurePage() {
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    // Load the saved query to display context
    const savedQuery = localStorage.getItem('knowgo-query')
    if (savedQuery) {
      setQuery(savedQuery)
    } else {
      // If no query, redirect back to home
      router.push('/')
    }
  }, [router])

  const levels = [
    {
      id: "beginner",
      title: "Beginner",
      description: "Start from basics with detailed explanations",
      icon: Trophy,
      recommended: false
    },
    {
      id: "intermediate", 
      title: "Intermediate",
      description: "Have some knowledge, focus on key concepts",
      icon: Star,
      recommended: false
    },
    {
      id: "expert",
      title: "Expert",
      description: "Deep analysis with advanced concepts and applications",
      icon: Award,
      recommended: true
    }
  ]

  const styles = [
    { id: "structured", title: "Classroom", description: "Systematic teaching" },
    { id: "story", title: "Storytelling", description: "Vivid and engaging" },
    { id: "dialogue", title: "Dialogue", description: "Interactive Q&A" },
    { id: "mentor", title: "Mentor", description: "Professional guidance" },
    { id: "detailed", title: "In-depth", description: "Comprehensive analysis" },
    { id: "quick", title: "Quick", description: "Key points overview" },
    { id: "poetic", title: "Poetic", description: "Elegant expression" },
    { id: "casual", title: "Casual", description: "Relaxed and humorous" },
    { id: "analytical", title: "Case Study", description: "Example-based analysis" },
    { id: "confucius", title: "Confucian", description: "Classical wisdom" },
    { id: "novel", title: "Narrative", description: "Story-based explanation" },
    { id: "einstein", title: "Einsteinian", description: "Scientific thinking" }
  ]

  const handleContinue = () => {
    if (selectedLevel && selectedStyle) {
      // Store configuration and proceed
      localStorage.setItem('knowgo-config', JSON.stringify({
        level: selectedLevel,
        style: selectedStyle
      }))
      router.push('/learn')
    }
  }

  const handleBack = () => {
    // Clear any saved data and go back to home
    localStorage.removeItem('knowgo-query')
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

      {/* Context indicator - subtle and top-right */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="absolute top-8 right-8"
      >
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Topic:</span>
          <span className="text-gray-600 font-medium">{query}</span>
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
          Configure
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
            <h2 className="text-xl font-semibold mb-2">Knowledge level</h2>
            <p className="text-body text-sm">Choose your understanding level</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {levels.map((level, index) => (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.4 + index * 0.1,
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
                    transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 500 }}
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
            <h2 className="text-xl font-semibold mb-2">Learning style</h2>
            <p className="text-body text-sm">Select your preferred approach</p>
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
            {styles.map((style, index) => (
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
            Start Learning
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