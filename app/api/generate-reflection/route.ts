import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, category, userLevel = 'intermediate' } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    console.log('生成深度反思问题:', { topic, category, userLevel })

    const reflection = await generateReflectionQuestion(topic, category, userLevel)
    return NextResponse.json(reflection)
  } catch (error) {
    console.error('Error generating reflection:', error)
    return NextResponse.json(
      { error: 'Failed to generate reflection question', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateReflectionQuestion(topic: string, category: string, userLevel: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // 根据学科和水平生成个性化的深度反思问题
  const levelDescriptions = {
    beginner: '初学者',
    intermediate: '中级学习者', 
    expert: '高级学习者'
  }

  const prompt = `作为一位经验丰富的教育家，为一位${levelDescriptions[userLevel as keyof typeof levelDescriptions] || '学习者'}生成一个关于"${topic}"的深度反思问题。

要求：
1. 问题要引发深度思考，而非简单的知识回顾
2. 鼓励个人化理解和感悟，而非标准答案
3. 问题应该简洁有力，一句话表达
4. 适合在2-3分钟内深度思考和书面回答

请只返回一个JSON对象：
{
  "question": "一句简洁而深刻的反思问题",
  "placeholder": "简短的写作提示"
}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    
    // 解析JSON响应
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        question: parsed.question,
        placeholder: parsed.placeholder || "分享你的思考..."
      }
    }
    
    // 如果解析失败，返回默认问题
    return {
      question: `你对"${topic}"最深刻的一个理解是什么？`,
      placeholder: "写下你的感悟..."
    }
    
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    
    // 回退到预设问题
    const fallbackQuestions = {
      science: `学习"${topic}"后，你觉得它改变了你对世界的哪种看法？`,
      history: `如果你能对"${topic}"中的某个人物说一句话，你会说什么？`,
      others: `"${topic}"对你个人意味着什么？`
    }
    
    return {
      question: fallbackQuestions[category as keyof typeof fallbackQuestions] || `你从"${topic}"中得到的最重要启发是什么？`,
      placeholder: "写下你的感悟..."
    }
  }
} 