export interface GameDesignRequest {
  topic: string
  category: 'science' | 'history' | 'others'
  userLevel: 'beginner' | 'intermediate' | 'expert'
  learningObjective: string
}

export interface GameDesignConcept {
  gameTitle: string
  gameDescription: string
  coreGameplay: string
  winCondition: string
  designRationale: string
}

/**
 * 游戏设计师LLM - 专注于创意设计和玩法机制
 */
export async function designGameConcept(request: GameDesignRequest): Promise<GameDesignConcept> {
  const { topic, category, userLevel, learningObjective } = request
  
  const prompt = buildGameDesignPrompt(topic, category, userLevel, learningObjective)
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY!
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      // 重试机制
      if (response.status === 503) {
        console.log('Gemini API暂时不可用，等待3秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const retryResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': process.env.GEMINI_API_KEY!
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        })
        
        if (!retryResponse.ok) {
          throw new Error(`Gemini API重试后仍然失败: ${retryResponse.status}`)
        }
        
        const retryData = await retryResponse.json()
        const retryContent = retryData.candidates[0].content.parts[0].text
        
        // 输出重试的游戏设计师回复到后端日志
        console.log('🎨 游戏设计师LLM重试回复:')
        console.log('='.repeat(80))
        console.log(retryContent)
        console.log('='.repeat(80))
        
        return parseGameDesignResponse(retryContent, topic)
      } else {
        throw new Error(`Gemini API error: ${response.status}`)
      }
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    // 输出游戏设计师的完整回复到后端日志
    console.log('🎨 游戏设计师LLM原始回复:')
    console.log('='.repeat(80))
    console.log(content)
    console.log('='.repeat(80))

    return parseGameDesignResponse(content, topic)
  } catch (error) {
    console.error('Error in game design:', error)
    throw new Error('游戏设计失败，请重试')
  }
}

/**
 * 构建游戏设计师专用的提示词
 */
function buildGameDesignPrompt(topic: string, category: string, userLevel: string, learningObjective: string): string {
  return `你是一位教育游戏设计师，专门设计简单易实现的学习游戏。

**学习主题：** ${topic}
**学科分类：** ${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
**用户水平：** ${userLevel}

**设计原则：**
1. **简单直观**：选择最简单的交互方式（点击、拖拽、滑块调节）
2. **核心聚焦**：围绕一个核心知识点设计，不要贪多
3. **易于实现**：避免复杂动画和高级功能，确保代码工程师能够轻松实现

**常用游戏模式：**
- **参数探索型**：通过滑块调节参数，观察结果变化
- **匹配连线型**：将概念与实例进行匹配
- **模拟实验型**：简单的虚拟实验环境
- **问答闯关型**：逐步递进的知识问答

**⚠️ 必须包含的反馈机制：**
1. **明确的成功标准**：什么情况下算作成功（例如：误差小于0.1、匹配正确、达到目标值等）
2. **失败提示**：什么情况下需要重试（例如：误差过大、选择错误、超出范围等）
3. **即时反馈**：用户操作后立即显示结果（正确/错误提示、数值变化、视觉反馈等）
4. **进度引导**：成功后的下一步操作（重新开始、下一关卡、完成游戏等）

**请为"${topic}"设计一个游戏，要求：**
- 游戏名称简洁有趣
- 核心玩法描述清晰（2-3句话说明玩家具体操作）
- **胜利条件非常明确**（具体的数值标准或判定条件）
- **失败处理明确**（什么时候显示失败，如何重试）
- 避免过于复杂的机制和多层嵌套功能

**输出格式：**
\`\`\`json
{
  "gameTitle": "简洁的游戏名称",
  "gameDescription": "一句话描述游戏背景和目标",
  "coreGameplay": "核心玩法：玩家通过[具体操作]来[达成目标]，系统会[即时反馈]。成功时显示[成功提示]，失败时显示[失败提示]",
  "winCondition": "胜利条件：[具体的判定标准，如误差范围、正确率、达成目标等]。成功后显示[庆祝效果]和[下一步按钮]",
  "designRationale": "教育价值：帮助学生理解[具体知识点]，通过[反馈机制]加深理解"
}
\`\`\`

请设计一个包含完整反馈机制的"${topic}"学习游戏！`
}

/**
 * 解析游戏设计响应
 */
function parseGameDesignResponse(content: string, topic: string): GameDesignConcept {
  try {
    // 清理内容
    let cleanContent = content.trim()
    
    // 如果内容以中文开头，说明AI没有按要求返回JSON
    if (/^[好的谢对不起抱歉]/.test(cleanContent)) {
      console.error('AI returned conversational response instead of JSON:', cleanContent.substring(0, 100))
      throw new Error('AI返回了对话回复而不是JSON格式，请重试')
    }
    
    // 移除markdown代码块标记
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // 尝试找到JSON部分
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanContent = jsonMatch[0]
    }

    const result = JSON.parse(cleanContent) as GameDesignConcept
    
    // 验证必要字段
    if (!result.gameTitle || !result.gameDescription || !result.coreGameplay) {
      throw new Error('Invalid game design response format: missing required fields')
    }

    console.log('✅ 游戏设计概念解析成功:', result.gameTitle)

    return result
  } catch (error) {
    console.error('Failed to parse game design response:', error)
    console.error('Original content:', content.substring(0, 200))
    throw new Error('游戏设计解析错误，请重试')
  }
} 