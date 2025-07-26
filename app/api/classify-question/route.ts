import { NextRequest, NextResponse } from 'next/server'
import { classifyQuestion } from '@/lib/classifier-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // 分类问题
    const classification = await classifyQuestion(query)

    return NextResponse.json(classification)
  } catch (error) {
    console.error('Error classifying question:', error)
    return NextResponse.json(
      { error: 'Failed to classify question' },
      { status: 500 }
    )
  }
} 