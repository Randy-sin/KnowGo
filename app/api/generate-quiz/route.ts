import { NextRequest, NextResponse } from 'next/server'
import { 
  QuizQuestion, 
  QuizGenerationRequest, 
  QuizStreamEvent, 
  validateQuizQuestion
} from '@/lib/quiz-service'

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json()
    const { topic, guidedQuestion, userAnswer, category, userLevel = 'intermediate', stream } = body

    if (!topic || !category || !guidedQuestion) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, category, guidedQuestion' },
        { status: 400 }
      )
    }

    console.log('Generating quiz for:', { topic, guidedQuestion, userAnswer, category, userLevel, stream })

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(topic, guidedQuestion, userAnswer || null, category, userLevel)
    }

    // 非流式输出
    try {
      const quiz = await generateQuiz(topic, guidedQuestion, userAnswer || null, category, userLevel)
      return NextResponse.json({ quiz })
    } catch (error) {
      console.error('Quiz generation failed:', error)
      return NextResponse.json(
        { error: '题目生成失败，请重试' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { APIRetryService } from '@/lib/api-retry-service'

// 生成题目的核心函数
async function generateQuiz(topic: string, guidedQuestion: string, userAnswer: string | null, category: string, userLevel: string): Promise<QuizQuestion> {
  const prompt = buildQuizPrompt(topic, guidedQuestion, userAnswer, category, userLevel)

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
        ]
      })
    },
    APIRetryService.geminiRetryOptions
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates[0].content.parts[0].text

  // 清理和解析响应
  let cleanContent = content.trim()
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  try {
    const result = JSON.parse(cleanContent)
    
    // 使用类型验证函数
    if (!validateQuizQuestion(result)) {
      throw new Error('Invalid quiz format from AI response')
    }

    return result as QuizQuestion
  } catch (parseError) {
    console.error('Failed to parse quiz response:', parseError)
    console.error('Raw content:', cleanContent)
    
    // 不返回备用题目，直接抛出错误
    throw new Error('AI生成的题目格式无效，请重试')
  }
}

// 构建智能提示词
function buildQuizPrompt(topic: string, guidedQuestion: string, userAnswer: string | null, category: string, userLevel: string): string {
  const levelGuidance = {
    beginner: '基础入门级别，重点考查核心概念的理解',
    intermediate: '中等难度，考查概念应用和分析能力', 
    expert: '高级水平，考查深度理解和综合运用能力'
  }

  const categoryGuidance = {
    science: '理科知识点，注重逻辑推理和科学原理',
    history: '历史知识点，注重时间脉络和因果关系',
    others: '文科知识点，注重理解应用和综合分析'
  }

  const currentGuidance = levelGuidance[userLevel as keyof typeof levelGuidance] || levelGuidance.intermediate
  const categoryDesc = categoryGuidance[category as keyof typeof categoryGuidance] || categoryGuidance.others

  // 基于引导式问题的精准提示词
  return `你是一位资深的教育专家，专门为中学生设计优质的学习检测题目。现在需要你基于学生的具体学习内容生成一道有针对性的应试题目。

**学习背景：**
- **主题：** ${topic}
- **学科分类：** ${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
- **学生水平：** ${currentGuidance}

**学习情况分析：**
- **引导式问题：** ${guidedQuestion}
- **学生回答：** ${userAnswer || '学生跳过了这个问题'}

**题目生成要求：**
1. **紧密相关性**：题目必须与引导式问题"${guidedQuestion}"的内容高度相关
2. **知识检测性**：基于学生的学习过程，测试对核心概念的理解
3. **应试价值**：符合考试题目标准，有实际的检测意义
4. **层次递进**：比引导式问题更深入一层，检测理解程度
5. **针对性强**：结合学生的回答情况，设计有针对性的检测点

**具体要求：**
- **题目类型**：四选一单选题
- **题目长度**：简洁明了，40字以内
- **选项设计**：正确答案体现深度理解，错误选项反映常见误区
- **解析质量**：既要说明正确答案的原理，也要指出错误选项的问题

**学科特色：**
${categoryDesc}

**输出格式**（严格按照JSON格式）：
{
  "id": "quiz-${Date.now()}",
  "title": "${topic}概念检测",
  "question": "基于引导式问题设计的检测题目",
  "options": [
    "选项A",
    "选项B", 
    "选项C",
    "选项D"
  ],
  "correctAnswer": 正确答案索引(0-3),
  "explanation": "详细解析，结合引导式问题的内容进行说明",
  "topic": "${topic}"
}

请基于以上学习情况，为学生生成一道检测题目：`
}

// 处理流式请求
async function handleStreamRequest(topic: string, guidedQuestion: string, userAnswer: string | null, category: string, userLevel: string) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 发送开始事件
        const startEvent: QuizStreamEvent = { 
          type: 'start', 
          message: 'AI正在为你生成专属检测题目...' 
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`))
        
        const prompt = buildQuizPrompt(topic, guidedQuestion, userAnswer, category, userLevel)
        
        // 使用 Gemini API 生成
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
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
            ]
          })
        })

        if (!response.ok) {
          // 503错误表示服务暂时不可用，稍后重试
          if (response.status === 503) {
            console.log('Gemini API暂时不可用，等待2秒后重试...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 重试一次
            const retryResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
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
                        text: buildQuizPrompt(topic, guidedQuestion, userAnswer, category, userLevel)
                      }
                    ]
                  }
                ]
              })
            })
            
            if (!retryResponse.ok) {
              throw new Error(`Gemini API重试后仍然失败: ${retryResponse.status}`)
            }
            
            // 使用重试的响应
            const retryData = await retryResponse.json()
            const retryContent = retryData.candidates[0].content.parts[0].text
            
            const progressEvent: QuizStreamEvent = { 
              type: 'progress', 
              message: '重试成功，正在生成题目内容...' 
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressEvent)}\n\n`))
            
                         // 使用重试的内容继续处理
            let cleanRetryContent = retryContent.trim()
            if (cleanRetryContent.startsWith('```json')) {
              cleanRetryContent = cleanRetryContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (cleanRetryContent.startsWith('```')) {
              cleanRetryContent = cleanRetryContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }
            
            try {
              const quiz = JSON.parse(cleanRetryContent)
              
              // 验证格式
              if (!validateQuizQuestion(quiz)) {
                throw new Error('Invalid quiz format from AI response')
              }
              
              const completeEvent: QuizStreamEvent = { 
                type: 'complete', 
                quiz: quiz as QuizQuestion,
                message: '重试成功！题目生成完成' 
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
              controller.close()
              return
            } catch (retryParseError) {
              console.error('重试后仍然解析失败:', retryParseError)
              throw new Error('重试后仍然无法生成有效题目')
            }
          } else {
            throw new Error(`Gemini API error: ${response.status}`)
          }
        }

        const progressEvent: QuizStreamEvent = { 
          type: 'progress', 
          message: '正在生成题目内容...' 
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressEvent)}\n\n`))

        const data = await response.json()
        const content = data.candidates[0].content.parts[0].text

        // 清理内容
        let cleanContent = content.trim()
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        try {
          const quiz = JSON.parse(cleanContent)
          
          // 验证格式
          if (!validateQuizQuestion(quiz)) {
            throw new Error('Invalid quiz format from AI response')
          }

          // 发送完成事件
          const completeEvent: QuizStreamEvent = { 
            type: 'complete', 
            quiz: quiz as QuizQuestion,
            message: '题目生成完成！准备开始检测' 
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`))
        } catch (parseError) {
          console.error('Failed to parse quiz response:', parseError)
          
          // 发送错误信息，不使用备用题目
          const errorEvent: QuizStreamEvent = { 
            type: 'error', 
            error: 'AI生成的题目格式无效，请重试'
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
        }
        
        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        const errorEvent: QuizStreamEvent = { 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 