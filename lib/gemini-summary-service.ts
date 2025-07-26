/**
 * Gemini AI 摘要生成服务
 * 基于用户学习数据生成个性化智能摘要
 */

import { APIRetryService } from './api-retry-service'
import { LearningSession, LearningInteraction, QuizRecord } from './supabase'

export interface ReflectionData {
  question: string
  userResponse: string
  timestamp: string
}

export interface GameSessionData {
  gameTitle: string
  gameType: string
  completedLevels: number
  totalLevels: number
  learningGoals: string[]
  completedAt?: string
}

export interface VideoSessionData {
  videoTitle: string
  duration: number
  watched: boolean
  keyTopics: string[]
  generatedAt: string
}

export interface SummaryRequest {
  session: LearningSession
  interactions: LearningInteraction[]
  quizRecords: QuizRecord[]
  reflections?: ReflectionData[]
  gameSession?: GameSessionData
  videoSession?: VideoSessionData
}

export interface SummaryResponse {
  summary: string
  tone: 'encouraging' | 'neutral' | 'inspiring'
  confidence: number
}

/**
 * 构建摘要生成提示词 - 基于用户问答内容
 */
function buildSummaryPrompt(data: SummaryRequest): string {
  const { session, interactions } = data
  
  // 基础学习信息
  const topic = session.original_query
  const category = session.user_confirmed_category || 'unknown'
  
  // 分类中文映射
  const categoryMap = {
    'science': '理科',
    'history': '历史', 
    'others': '文科'
  }
  const categoryName = categoryMap[category as keyof typeof categoryMap] || '学科'
  
  // 整理用户的问答内容
  let questionAnswerPairs = ''
  if (interactions && interactions.length > 0) {
    questionAnswerPairs = interactions.map((interaction, index) => {
      const stageNames = {
        'life_connection': '生活联系阶段',
        'observation': '观察思考阶段',
        'concept_building': '概念建立阶段'
      }
      const stageName = stageNames[interaction.stage_type as keyof typeof stageNames] || `第${index + 1}阶段`
      
      return `**${stageName}**
问题：${interaction.ai_question}
用户回答：${interaction.user_answer || '未回答'}`
    }).join('\n\n')
  }

  return `你是一位专业的学习分析师，需要为学生的学习过程生成一句客观、准确的内容总结。

**学习主题：** "${topic}" (${categoryName})

**学生的学习过程和思考：**
${questionAnswerPairs || '学生正在探索这个主题'}

**任务要求：**
基于学生的实际回答内容，客观地总结他们学习了什么知识和概念。重点描述：

1. **学习内容**：具体涉及了哪些知识点或概念
2. **思考角度**：从什么角度理解了这个主题  
3. **认知过程**：思维是如何从一个点连接到另一个点的
4. **知识应用**：是否将理论与实际情况建立了联系

**语气要求：**
- 客观、准确、专业
- 不使用"你真棒"、"很厉害"等评价性语言
- 重点描述学习内容而非学习态度
- 像是在做学习档案记录

**长度：** 25-40字

**示例风格：**
- "通过生活中的推荐算法现象，理解了机器学习的基本概念和应用原理"
- "从抛物线的生活实例出发，建立了二次函数的几何意义认识"  
- "通过分析法国大革命的多重因素，理解了历史事件的复杂性"

请直接输出一句客观的学习内容总结：`
}

/**
 * 调用Gemini API生成摘要
 */
export async function generateSummaryWithGemini(data: SummaryRequest): Promise<SummaryResponse> {
  try {
    console.log('🤖 开始调用Gemini生成智能摘要...')
    
    const prompt = buildSummaryPrompt(data)
    console.log('📝 摘要生成提示词:', prompt.substring(0, 200) + '...')
    
    const response = await APIRetryService.fetchWithRetry(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY!
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,  // 适中的创造性
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100  // 限制为短摘要
          }
        })
      },
      APIRetryService.geminiRetryOptions
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const apiData = await response.json()
    const generatedText = apiData.candidates[0].content.parts[0].text.trim()
    
    console.log('✅ Gemini摘要生成成功:', generatedText)
    
    // 分析摘要语调
    const tone = analyzeTone(generatedText)
    
    return {
      summary: generatedText,
      tone,
      confidence: 0.9
    }
    
  } catch (error) {
    console.error('❌ Gemini摘要生成失败:', error)
    throw error
  }
}

/**
 * 分析摘要语调
 */
function analyzeTone(text: string): 'encouraging' | 'neutral' | 'inspiring' {
  const encouragingWords = ['优秀', '赞赏', '值得', '出色', '棒', '好']
  const inspiringWords = ['探索', '旅程', '深度', '热情', '生动', '精彩']
  
  const hasEncouraging = encouragingWords.some(word => text.includes(word))
  const hasInspiring = inspiringWords.some(word => text.includes(word))
  
  if (hasEncouraging) return 'encouraging'
  if (hasInspiring) return 'inspiring'
  return 'neutral'
}

/**
 * 回退到静态摘要生成
 */
export function generateFallbackSummary(data: SummaryRequest): string {
  const { session, interactions, quizRecords } = data
  const topic = session.original_query
  const categoryMap = {
    'science': '理科',
    'history': '历史',
    'others': '文科'
  }
  const category = categoryMap[session.user_confirmed_category as keyof typeof categoryMap] || '学科'
  const level = session.learning_config?.level === 'beginner' ? '初级' : 
               session.learning_config?.level === 'expert' ? '高级' : '中级'
  
  if (session.status === 'completed' && interactions.length > 0) {
    const accuracy = quizRecords.length > 0 ? 
      Math.round((quizRecords.filter(q => q.is_correct).length / quizRecords.length) * 100) : null
    
    if (accuracy !== null && accuracy > 0) {
      return `通过${interactions.length}个阶段深度探索了"${topic}"，完成${level}难度的${category}学习，测验正确率${accuracy}%`
    } else {
      return `完成了关于"${topic}"的${level}难度${category}学习，经历了${interactions.length}个深度思考阶段`
    }
  } else if (session.status === 'in_progress') {
    if (interactions.length > 0) {
      return `正在学习"${topic}"(${category})，已完成${interactions.length}/3个引导阶段，${level}难度设定`
    } else {
      return `开始探索"${topic}"的${category}知识，${level}难度，准备进入引导学习阶段`
    }
  }
  
  return `${category}主题："${topic}"，${level}难度学习`
} 