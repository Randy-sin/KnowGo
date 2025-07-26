import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, userAnswer, topic, category } = body

    if (!question || !topic || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: question, topic, category' },
        { status: 400 }
      )
    }

    console.log('Analyzing feedback for:', { question, userAnswer, topic, category })

    // 使用非流式输出
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