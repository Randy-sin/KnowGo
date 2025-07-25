import { NextRequest, NextResponse } from 'next/server'
import { generateLearningQuestions } from '@/lib/kimi-service'

export async function POST(request: NextRequest) {
  try {
    console.log('Generate questions API called')
    const body = await request.json()
    const { topic, config } = body
    console.log('Request body:', { topic, config })

    if (!topic || typeof topic !== 'string') {
      console.log('Invalid topic provided:', topic)
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Calling generateLearningQuestions with:', { topic, config })
    // 生成学习问题
    const questions = await generateLearningQuestions(topic, config)
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