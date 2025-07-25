import { NextRequest, NextResponse } from 'next/server'
import { 
  designGameConcept, 
  GameDesignRequest
} from '@/lib/game-designer-service'

export async function POST(request: NextRequest) {
  try {
    const body: GameDesignRequest & { stream?: boolean } = await request.json()
    const { topic, category, userLevel = 'intermediate', learningObjective, stream } = body

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, category' },
        { status: 400 }
      )
    }

    console.log('Designing game concept for:', { topic, category, userLevel })

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(topic, category, userLevel, learningObjective || `通过创新游戏深度理解${topic}的核心概念`)
    }

    // 非流式输出
    const designRequest: GameDesignRequest = {
      topic,
      category,
      userLevel,
      learningObjective: learningObjective || `通过创新游戏深度理解${topic}的核心概念`
    }
    
    const gameDesign = await designGameConcept(designRequest)
    return NextResponse.json({ gameDesign })
  } catch (error) {
    console.error('Error designing game:', error)
    return NextResponse.json(
      { error: 'Failed to design game', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 处理流式请求
async function handleStreamRequest(
  topic: string, 
  category: string, 
  userLevel: string, 
  learningObjective: string
) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 发送开始事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start', 
          message: '🎨 游戏设计师正在分析学习主题...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 发送设计阶段提示
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '🎮 正在构思创新的游戏机制和交互方式...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 生成游戏设计
        const designRequest: GameDesignRequest = {
          topic,
          category: category as 'science' | 'history' | 'others',
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
          learningObjective
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '🧠 正在设计教育价值和学习路径...' 
        })}\n\n`))
        
        const gameDesign = await designGameConcept(designRequest)
        
        // 发送完成事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          design: gameDesign,
          message: '✨ 游戏概念设计完成！准备开始代码实现' 
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