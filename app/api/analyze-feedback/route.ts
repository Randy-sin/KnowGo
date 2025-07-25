import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, userAnswer, topic, category, stream } = body

    if (!question || !topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: question, topic, category' },
        { status: 400 }
      )
    }

    console.log('Analyzing feedback for:', { question, userAnswer, topic, category, stream })

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(question, userAnswer || '', topic, category)
    }

    // 非流式输出的原有逻辑
    const { generateFeedbackAnalysis } = await import('@/lib/feedback-analysis-service')
    const analysis = await generateFeedbackAnalysis(question, userAnswer || '', topic, category)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to analyze feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 处理流式请求 - 按照 gemini-api-integration.md 实现
async function handleStreamRequest(question: string, userAnswer: string, topic: string, category: string) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'AI正在分析你的回答...' })}\n\n`))
        
        // 构建提示词
        const prompt = `你是一位优秀的学习引导者，你的任务是为学生的回答提供建设性的反馈分析。

**核心理念：**
1. **鼓励式反馈**：首先肯定学生的思考努力，即使答案不完整也要找到亮点
2. **知识建构**：从学生现有的理解出发，逐步引导到正确的概念理解
3. **生活联系**：将抽象的学科知识与具体的生活经验建立联系
4. **深度理解**：不仅给出标准答案，更要解释背后的原理和"为什么"

**学习主题：** ${topic}
**学科分类：** ${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
**引导问题：** ${question}
**学生回答：** ${userAnswer || '学生选择了跳过这个问题'}

**请你提供：**
1. **鼓励性分析**（150-200字）：先肯定学生的思考，然后基于他们的回答进行深入分析和引导，如果学生跳过了问题，就从问题本身的价值和意义开始分析
2. **关键洞察**（3个要点）：提炼出最重要的学习要点，每个要点简洁明了

**输出格式要求：**
请严格按照以下JSON格式输出，不要添加任何markdown标记或其他内容：

{
  "analysis": "你的鼓励性分析内容",
  "insights": [
    "第一个关键洞察",
    "第二个关键洞察", 
    "第三个关键洞察"
  ]
}

注意：
- analysis字段应该是温暖、鼓励性的语言
- 要体现出对学生思考过程的理解和尊重
- 即使学生答案不完整，也要找到可以肯定的地方
- 用生活化的例子帮助理解抽象概念
- insights要简洁有力，每个不超过15个字`

        // 使用 @google/genai 实现流式输出
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBxZ2fsjm-laE__4ELPZDbRLzzbTPY7ARU'
        })
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: '正在生成分析内容...' })}\n\n`))

        const response = await ai.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: prompt,
        })

        let accumulatedContent = ''

        for await (const chunk of response) {
          if (chunk.text) {
            accumulatedContent += chunk.text
            
            // 发送实时内容更新
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'content', 
              chunk: chunk.text,
              accumulated: accumulatedContent,
              message: '正在生成...' 
            })}\n\n`))
          }
        }

        // 处理完整的内容并解析
        let cleanContent = accumulatedContent.trim()
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        try {
          const result = JSON.parse(cleanContent)
          
          // 发送完成事件
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            analysis: result.analysis,
            insights: result.insights,
            message: 'AI分析完成！' 
          })}\n\n`))
        } catch (parseError) {
          console.error('Failed to parse final result:', parseError)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: 'Failed to parse AI response' 
          })}\n\n`))
        }
        
        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`))
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