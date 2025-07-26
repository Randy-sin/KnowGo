import { NextRequest, NextResponse } from 'next/server'
import { 
  generateSummaryWithGemini, 
  generateFallbackSummary, 
  SummaryRequest 
} from '@/lib/gemini-summary-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionData } = body

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session data is required' },
        { status: 400 }
      )
    }

    console.log('📊 收到摘要生成请求:', {
      sessionId: sessionData.session?.id,
      topic: sessionData.session?.original_query,
      hasInteractions: !!sessionData.interactions?.length,
      hasQuizRecords: !!sessionData.quizRecords?.length
    })

    // 验证必要数据
    if (!sessionData.session || !sessionData.session.original_query) {
      return NextResponse.json(
        { error: 'Invalid session data: missing session or topic' },
        { status: 400 }
      )
    }

    try {
      // 优先使用 Gemini AI 生成智能摘要
      console.log('🤖 尝试使用Gemini生成智能摘要...')
      
      const summaryRequest: SummaryRequest = {
        session: sessionData.session,
        interactions: sessionData.interactions || [],
        quizRecords: sessionData.quizRecords || [],
        reflections: sessionData.reflections || [],
        gameSession: sessionData.gameSession,
        videoSession: sessionData.videoSession
      }

      const aiSummary = await generateSummaryWithGemini(summaryRequest)
      
      console.log('✅ Gemini智能摘要生成成功')
      
      return NextResponse.json({
        success: true,
        summary: aiSummary.summary,
        tone: aiSummary.tone,
        confidence: aiSummary.confidence,
        source: 'gemini',
        fallback: false
      })

    } catch (geminiError) {
      console.warn('⚠️ Gemini摘要生成失败，使用静态回退:', geminiError)
      
      // Gemini 失败时回退到静态摘要
      const fallbackSummary = generateFallbackSummary({
        session: sessionData.session,
        interactions: sessionData.interactions || [],
        quizRecords: sessionData.quizRecords || [],
        reflections: sessionData.reflections || [],
        gameSession: sessionData.gameSession,
        videoSession: sessionData.videoSession
      })
      
      console.log('📝 静态摘要生成完成')
      
      return NextResponse.json({
        success: true,
        summary: fallbackSummary,
        tone: 'neutral',
        confidence: 0.7,
        source: 'fallback',
        fallback: true
      })
    }

  } catch (error) {
    console.error('❌ 摘要生成API错误:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate summary', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 