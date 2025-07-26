import { NextRequest, NextResponse } from 'next/server'
import { 
  generateHistoryVideoPrompt,
  VideoPromptRequest,
  VideoPromptResponse
} from '@/lib/video-prompt-service'
import {
  createVideoGenerationTask,
  queryVideoGenerationStatus,
  getVideoDownloadInfo,
  VideoGenerationRequest
} from '@/lib/minimax-video-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, userLevel = 'intermediate', stream, action } = body

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Video generation request:', { topic, userLevel, stream, action })

    // 如果是流式请求
    if (stream) {
      return handleStreamRequest(topic, userLevel)
    }

    // 根据不同的action处理请求
    switch (action) {
      case 'generate-prompt':
        return await handleGeneratePrompt(topic, userLevel)
      case 'create-task':
        return await handleCreateTask(topic, userLevel)
      case 'complete':
      default:
        return await handleCompleteGeneration(topic, userLevel)
    }

  } catch (error) {
    console.error('Error in video generation API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process video generation request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * 处理仅生成视频提示词的请求
 */
async function handleGeneratePrompt(topic: string, userLevel: string) {
  try {
    const promptRequest: VideoPromptRequest = {
      topic,
      userLevel: userLevel as 'beginner' | 'intermediate' | 'expert'
    }
    
    const result = await generateHistoryVideoPrompt(promptRequest)
    
    return NextResponse.json({
      success: true,
      promptOnly: true,
      ...result
    })
  } catch (error) {
    console.error('Error generating video prompt:', error)
    return NextResponse.json(
      { error: '视频提示词生成失败，请重试' },
      { status: 500 }
    )
  }
}

/**
 * 处理创建视频生成任务的请求
 */
async function handleCreateTask(topic: string, userLevel: string) {
  let promptResult: VideoPromptResponse | null = null;
  
  try {
    // 第一步：生成视频提示词
    const promptRequest: VideoPromptRequest = {
      topic,
      userLevel: userLevel as 'beginner' | 'intermediate' | 'expert'
    }
    
    promptResult = await generateHistoryVideoPrompt(promptRequest)
    console.log('Generated video prompt for:', topic)

    // 第二步：创建视频生成任务
    const videoRequest: VideoGenerationRequest = {
      prompt: promptResult.videoPrompt,
      userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
      duration: 6,
      resolution: '1080P'
    }

    const taskResult = await createVideoGenerationTask(videoRequest)
    console.log('Created video generation task:', taskResult.taskId)

    return NextResponse.json({
      success: true,
      taskCreated: true,
      taskId: taskResult.taskId,
      videoPrompt: promptResult.videoPrompt,
      topic: promptResult.topic,
      userLevel: promptResult.userLevel
    })
  } catch (error) {
    console.error('Error creating video task:', error)
    
    // 如果是MiniMax余额不足，返回特殊错误信息
    if (error instanceof Error && error.message.includes('账户余额不足')) {
      return NextResponse.json(
        { 
          error: 'MiniMax视频生成服务暂时不可用',
          reason: 'balance_insufficient',
          videoPrompt: promptResult?.videoPrompt,
          suggestion: '视频提示词已生成，请联系管理员充值后重试'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: '视频任务创建失败，请重试' },
      { status: 500 }
    )
  }
}

/**
 * 处理完整视频生成流程的请求（提示词 + 生成 + 轮询）
 */
async function handleCompleteGeneration(topic: string, userLevel: string) {
  try {
    // 第一步：生成视频提示词
    const promptRequest: VideoPromptRequest = {
      topic,
      userLevel: userLevel as 'beginner' | 'intermediate' | 'expert'
    }
    
    const promptResult = await generateHistoryVideoPrompt(promptRequest)
    console.log('Generated video prompt for:', topic)

    // 第二步：创建并等待视频生成完成
    const videoRequest: VideoGenerationRequest = {
      prompt: promptResult.videoPrompt,
      userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
      duration: 6,
      resolution: '1080P'
    }

    const taskResult = await createVideoGenerationTask(videoRequest)
    console.log('Created video generation task:', taskResult.taskId)

    // 第三步：轮询等待完成（简单版本，最多等待5分钟）
    let attempts = 0
    const maxAttempts = 30 // 30次 * 10秒 = 5分钟
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)) // 等待10秒
      
      const statusResult = await queryVideoGenerationStatus(taskResult.taskId)
      console.log(`Attempt ${attempts + 1}: Status = ${statusResult.status}`)
      
      if (statusResult.status === 'Success' && statusResult.fileId) {
        const downloadInfo = await getVideoDownloadInfo(statusResult.fileId)
        
        return NextResponse.json({
          success: true,
          completed: true,
          taskId: taskResult.taskId,
          videoPrompt: promptResult.videoPrompt,
          topic: promptResult.topic,
          userLevel: promptResult.userLevel,
          downloadInfo
        })
      } else if (statusResult.status === 'Fail') {
        throw new Error('Video generation failed')
      }
      
      attempts++
    }

    // 超时但任务可能仍在进行
    return NextResponse.json({
      success: true,
      timeout: true,
      taskId: taskResult.taskId,
      videoPrompt: promptResult.videoPrompt,
      topic: promptResult.topic,
      userLevel: promptResult.userLevel,
      message: '视频生成时间较长，请稍后查询任务状态'
    })

  } catch (error) {
    console.error('Error in complete video generation:', error)
    return NextResponse.json(
      { error: '完整视频生成失败，请重试' },
      { status: 500 }
    )
  }
}

/**
 * 处理流式请求
 */
async function handleStreamRequest(topic: string, userLevel: string) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 步骤1：生成视频提示词
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          stage: 'prompt',
          message: '🎬 正在为您创作沉浸式历史视频场景...',
          progress: 10
        })}\n\n`))
        
        const promptRequest: VideoPromptRequest = {
          topic,
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert'
        }
        
        const promptResult = await generateHistoryVideoPrompt(promptRequest)
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          stage: 'prompt-complete',
          message: '✅ 视频提示词创作完成',
          progress: 25,
          videoPrompt: promptResult.videoPrompt
        })}\n\n`))

        // 步骤2：创建视频生成任务
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          stage: 'task-creation',
          message: '🎥 正在提交视频生成任务...',
          progress: 30
        })}\n\n`))

        const videoRequest: VideoGenerationRequest = {
          prompt: promptResult.videoPrompt,
          userLevel: userLevel as 'beginner' | 'intermediate' | 'expert',
          duration: 6,
          resolution: '1080P'
        }

        const taskResult = await createVideoGenerationTask(videoRequest)
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          stage: 'task-created',
          message: '✅ 视频生成任务已提交',
          progress: 40,
          taskId: taskResult.taskId
        })}\n\n`))

        // 步骤3：轮询状态直到完成
        let attempts = 0
        const maxAttempts = 60 // 10分钟
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000))
          
          const statusResult = await queryVideoGenerationStatus(taskResult.taskId)
          const progress = Math.min(40 + (attempts / maxAttempts) * 50, 90)
          
          let statusMessage = ''
          switch (statusResult.status) {
            case 'Preparing':
              statusMessage = '⏳ 准备中...'
              break
            case 'Queueing':
              statusMessage = '🚶 队列中...'
              break
            case 'Processing':
              statusMessage = '🎬 生成中...'
              break
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            stage: 'generating',
            message: statusMessage,
            progress,
            status: statusResult.status,
            attempts: attempts + 1
          })}\n\n`))
          
          if (statusResult.status === 'Success' && statusResult.fileId) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              stage: 'downloading',
              message: '📥 获取下载链接...',
              progress: 95
            })}\n\n`))
            
            const downloadInfo = await getVideoDownloadInfo(statusResult.fileId)
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete',
              stage: 'completed',
              message: '🎉 视频生成完成！',
              progress: 100,
              taskId: taskResult.taskId,
              videoPrompt: promptResult.videoPrompt,
              topic: promptResult.topic,
              userLevel: promptResult.userLevel,
              downloadInfo
            })}\n\n`))
            
            controller.close()
            return
          } else if (statusResult.status === 'Fail') {
            throw new Error('Video generation failed')
          }
          
          attempts++
        }
        
        // 超时
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'timeout',
          message: '⏰ 视频生成时间较长，任务仍在进行中',
          taskId: taskResult.taskId,
          videoPrompt: promptResult.videoPrompt
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

/**
 * 查询视频生成任务状态的GET接口
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const statusResult = await queryVideoGenerationStatus(taskId)
    
    if (statusResult.status === 'Success' && statusResult.fileId) {
      const downloadInfo = await getVideoDownloadInfo(statusResult.fileId)
      return NextResponse.json({
        ...statusResult,
        downloadInfo
      })
    }
    
    return NextResponse.json(statusResult)
    
  } catch (error) {
    console.error('Error querying video status:', error)
    return NextResponse.json(
      { error: 'Failed to query video status' },
      { status: 500 }
    )
  }
} 