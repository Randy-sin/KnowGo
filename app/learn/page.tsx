"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles, RefreshCw, Brain, Target, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LearnPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [config, setConfig] = useState<{level: string, style: string} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState("")
  const [loadingStep, setLoadingStep] = useState(0)

  const loadingSteps = [
    { icon: Brain, text: "Analyzing your question" },
    { icon: Target, text: "Adapting to your level" },
    { icon: Wand2, text: "Crafting personalized content" }
  ]

  useEffect(() => {
    // Load saved data
    const savedQuery = localStorage.getItem('knowgo-query')
    const savedConfig = localStorage.getItem('knowgo-config')
    
    if (savedQuery && savedConfig) {
      setQuery(savedQuery)
      setConfig(JSON.parse(savedConfig))
      
      // Simulate AI response generation with steps
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1
          } else {
            clearInterval(stepInterval)
            setTimeout(() => {
              setIsLoading(false)
              setContent(generateMockContent(savedQuery, JSON.parse(savedConfig)))
            }, 800)
            return prev
          }
        })
      }, 1000)
    } else {
      router.push('/')
    }
  }, [router])

  const generateMockContent = (query: string, config: {level: string, style: string}) => {
    const levelMap = {
      beginner: "Beginner",
      intermediate: "Intermediate", 
      expert: "Expert"
    }
    
    const styleMap = {
      structured: "Classroom style",
      story: "Storytelling",
      dialogue: "Dialogue style",
      mentor: "Mentor style",
      detailed: "In-depth style",
      quick: "Quick style",
      poetic: "Poetic style",
      casual: "Casual style",
      analytical: "Case study style",
      confucius: "Confucian style",
      novel: "Narrative style",
      einstein: "Einsteinian style"
    }

    return `# ${query}

## Learning Configuration
- **Knowledge Level**: ${levelMap[config.level as keyof typeof levelMap]}
- **Explanation Style**: ${styleMap[config.style as keyof typeof styleMap]}

## AI Response

Based on your configuration, I will explain "${query}" using ${styleMap[config.style as keyof typeof styleMap]} for ${levelMap[config.level as keyof typeof levelMap]} level learners.

### Core Concepts

This is a personalized explanation tailored to your learning preferences. The content is adjusted according to your knowledge level and preferred explanation style to ensure optimal learning outcomes.

### Deep Understanding

Through personalized learning paths, we ensure you receive the most suitable knowledge delivery method. Everyone learns differently, and KnowGo is committed to providing a tailored learning experience for each learner.

### Practical Applications

Based on your configuration, here are relevant practice suggestions and application scenarios to help you better understand and master the knowledge you've learned.

### Key Takeaways

- Personalized content based on your ${levelMap[config.level as keyof typeof levelMap]} level
- Delivered in ${styleMap[config.style as keyof typeof styleMap]} format
- Optimized for your learning preferences
- Practical examples and applications included

---

*This learning content was generated based on your personalized configuration. To adjust your learning preferences, click the "Reconfigure" button.*`
  }

  const handleNewQuery = () => {
    localStorage.removeItem('knowgo-query')
    localStorage.removeItem('knowgo-config')
    router.push('/')
  }

  if (!config) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleNewQuery}
        className="absolute top-8 left-8 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Content */}
      <div className="container-minimal py-12">
        <div className="max-w-3xl mx-auto">
          {/* Query Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h1 className="heading-lg">{query}</h1>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-minimal p-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-6">
                    <span className="font-medium text-sm">KnowGo AI</span>
                    <span className="text-xs text-gray-500">Personalizing your learning experience</span>
                  </div>
                  
                  {/* Loading Steps */}
                  <div className="space-y-4">
                    {loadingSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0.3 }}
                        animate={{ 
                          opacity: index <= loadingStep ? 1 : 0.3,
                          scale: index === loadingStep ? 1.02 : 1
                        }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                          index <= loadingStep ? 'bg-gray-50' : ''
                        }`}
                      >
                        <motion.div
                          animate={index === loadingStep ? { 
                            rotate: [0, 10, -10, 0],
                            transition: { repeat: Infinity, duration: 2 }
                          } : {}}
                          className={`w-5 h-5 flex items-center justify-center ${
                            index < loadingStep ? 'text-black' : 
                            index === loadingStep ? 'text-black' : 'text-gray-400'
                          }`}
                        >
                          <step.icon className="w-4 h-4" />
                        </motion.div>
                        <span className={`text-sm ${
                          index <= loadingStep ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.text}
                        </span>
                        {index < loadingStep && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-green-500 rounded-full ml-auto"
                          />
                        )}
                        {index === loadingStep && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2 h-2 bg-blue-500 rounded-full ml-auto"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Content Display */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="card-minimal p-8"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">KnowGo AI</div>
                  <div className="text-xs text-gray-500">Personalized for your learning style</div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-body leading-relaxed">
                  {content}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
} 