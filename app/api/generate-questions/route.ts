import { NextRequest, NextResponse } from 'next/server'
import { generateScienceQuestions, generateHistoryQuestions, generateOthersQuestions } from '@/lib/guided-questions-service'
import { classifyQuestion } from '@/lib/classifier-service'

export async function POST(request: NextRequest) {
  try {
    console.log('Generate questions API called')
    const body = await request.json()
    const { topic, config, category, stream } = body
    console.log('Request body:', { topic, config, category, stream })

    if (!topic || typeof topic !== 'string') {
      console.log('Invalid topic provided:', topic)
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(topic, category, config)
    }

    let questions
    let questionCategory = category

    // 如果没有提供分类，先进行分类
    if (!questionCategory) {
      console.log('No category provided, classifying question...')
      const classification = await classifyQuestion(topic)
      questionCategory = classification.category
      console.log('Classified as:', questionCategory)
    }

    // 根据分类生成对应的引导问题
    switch (questionCategory) {
      case 'science':
        console.log('Generating science questions with Gemini')
        questions = await generateScienceQuestions(topic, config)
        break
      
      case 'history':
        console.log('Generating history questions with Gemini')
        questions = await generateHistoryQuestions(topic, config) // 添加config参数
        break
      
      case 'others':
        console.log('Generating others questions with Gemini')
        questions = await generateOthersQuestions(topic, config)
        break
      
      default:
        // 默认使用理科问题生成逻辑
        console.log('Using default science questions generation with Gemini')
        questions = await generateScienceQuestions(topic, config)
    }

    console.log('Generated questions:', questions)
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to generate questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 处理流式请求
async function handleStreamRequest(topic: string, category: string, config?: any) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: '开始生成学习问题...' })}\n\n`))
        
        // 根据分类生成问题
        let questions
        switch (category) {
          case 'science':
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: '正在生成理科引导问题...' })}\n\n`))
            questions = await generateScienceQuestions(topic, config)
            break
          
          case 'history':
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: '正在生成历史引导问题...' })}\n\n`))
            questions = await generateHistoryQuestions(topic, config)
            break
          
          case 'others':
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: '正在生成文科引导问题...' })}\n\n`))
            questions = await generateOthersQuestions(topic, config)
            break
          
          default:
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: '正在生成引导问题...' })}\n\n`))
            questions = await generateScienceQuestions(topic, config)
        }

        // 逐个发送问题
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i]
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'question', 
            index: i, 
            question: question,
            message: `问题 ${i + 1} 生成完成` 
          })}\n\n`))
          
          // 添加一点延迟让用户看到流式效果
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 发送完成事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          questions: questions,
          message: '所有问题生成完成！' 
        })}\n\n`))
        
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