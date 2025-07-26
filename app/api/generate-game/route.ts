import { NextRequest, NextResponse } from 'next/server'
import { 
  generateInteractiveGame, 
  GameGenerationRequest
} from '@/lib/game-generation-service'
import {
  designGameConcept,
  GameDesignRequest
} from '@/lib/game-designer-service'

export async function POST(request: NextRequest) {
  try {
    const body: GameGenerationRequest & { stream?: boolean } = await request.json()
    const { topic, category, userLevel = 'intermediate', learningObjective, gameDesign, stream } = body

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, category' },
        { status: 400 }
      )
    }

    console.log(`🎮 生成游戏请求: ${topic} (${category}, ${userLevel})`)

    // 如果请求流式输出
    if (stream) {
      return handleStreamRequest(topic, category, userLevel, learningObjective || `通过互动游戏深度理解${topic}的核心概念`)
    }

    // 非流式输出 - 智能两阶段流程
    try {
      let finalGameDesign = gameDesign
      
      // 只有在没有传入设计方案时才调用设计师
      if (!gameDesign) {
      console.log('🎨 第一阶段：开始游戏设计...')
      
      const designRequest: GameDesignRequest = {
        topic,
        category,
        userLevel,
        learningObjective: learningObjective || `通过创新游戏深度理解${topic}的核心概念`
      }
      
        finalGameDesign = await designGameConcept(designRequest)
        console.log('✅ 第一阶段完成，游戏设计:', finalGameDesign.gameTitle)
      } else {
        console.log('🎨 使用已有游戏设计:', gameDesign.gameTitle)
      }
      
      // 第二阶段：基于设计生成代码
      console.log('🛠️ 第二阶段：开始代码实现...')
      const gameRequest: GameGenerationRequest = {
        topic,
        category,
        userLevel,
        learningObjective: learningObjective || `通过互动游戏深度理解${topic}的核心概念`,
        gameDesign: finalGameDesign // 传入设计方案
      }
      
      const game = await generateInteractiveGame(gameRequest)
              console.log('🎉 第二阶段完成，游戏生成:', game.title)
      
      return NextResponse.json({ game })
    } catch (error) {
      console.error('两阶段游戏开发失败:', error)
      throw error
    }
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
        // 第一阶段：游戏设计
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start', 
          message: '🎨 游戏设计师正在分析学习主题...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 800))
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '🎮 正在构思创新的游戏机制和交互方式...' 
        })}\n\n`))
        
        // 执行游戏设计
        const designRequest: GameDesignRequest = {
          topic,
          category: category as 'science' | 'history' | 'others',
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
          learningObjective
        }
        
        const gameDesign = await designGameConcept(designRequest)
        console.log('🎨 流式处理 - 游戏设计完成:', gameDesign.gameTitle)
        
        // 第二阶段：代码实现
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '🚀 代码工程师正在实现游戏设计...' 
        })}\n\n`))
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: '⚡ 正在生成完整的HTML5游戏代码...' 
        })}\n\n`))
        
        // 基于设计生成游戏代码
        const gameRequest: GameGenerationRequest = {
          topic,
          category: category as 'science' | 'history' | 'others',
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
          learningObjective,
          gameDesign // 传入设计方案
        }
        
        const game = await generateInteractiveGame(gameRequest)
        console.log('🛠️ 流式处理 - 游戏代码生成完成:', game.title)
        
        // 发送完成事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          game: game,
          message: '🎉 游戏开发完成！准备开始学习体验' 
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