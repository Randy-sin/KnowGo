import { NextRequest, NextResponse } from 'next/server'
import { 
  generateInteractiveGame, 
  GameGenerationRequest, 
  GameResponse 
} from '@/lib/game-generation-service'

export async function POST(request: NextRequest) {
  try {
    const body: GameGenerationRequest & { stream?: boolean } = await request.json()
    const { topic, category, userLevel = 'intermediate', learningObjective, stream } = body

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, category' },
        { status: 400 }
      )
    }

    console.log('Generating interactive game for:', { topic, category, userLevel, stream })

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(topic, category, userLevel, learningObjective || `通过互动游戏深度理解${topic}的核心概念`)
    }

    // 非流式输出
    const gameRequest: GameGenerationRequest = {
      topic,
      category,
      userLevel,
      learningObjective: learningObjective || `通过互动游戏深度理解${topic}的核心概念`
    }
    
    const game = await generateInteractiveGame(gameRequest)
    return NextResponse.json({ game })
  } catch (error) {
    console.error('Error generating game:', error)
    return NextResponse.json(
      { error: 'Failed to generate game', details: error instanceof Error ? error.message : 'Unknown error' },
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
          message: 'AI正在为您设计专属互动游戏...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 发送设计阶段提示
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '正在分析学习目标和游戏机制...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 生成游戏
        const gameRequest: GameGenerationRequest = {
          topic,
          category: category as 'science' | 'history' | 'others',
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
          learningObjective
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '正在生成游戏代码和界面...' 
        })}\n\n`))
        
        const game = await generateInteractiveGame(gameRequest)
        
        // 发送完成事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          game: game,
          message: '游戏生成完成！准备开始学习' 
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