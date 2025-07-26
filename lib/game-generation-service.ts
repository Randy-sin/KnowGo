export interface GameGenerationRequest {
  topic: string
  category: 'science' | 'history' | 'others'
  userLevel: 'beginner' | 'intermediate' | 'expert'
  learningObjective: string
  gameDesign?: import('./game-designer-service').GameDesignConcept // 可选的设计方案
}

export interface GameResponse {
  html: string
  title: string
  instructions: string
  gameType: string
  topic?: string  // 添加topic字段用于匹配检查
}

/**
 * 为不同学科生成互动HTML游戏
 * 现在支持基于设计方案的代码生成
 */
export async function generateInteractiveGame(request: GameGenerationRequest): Promise<GameResponse> {
  const { topic, category, userLevel, learningObjective, gameDesign } = request
  
  // 强制要求必须有游戏设计方案
  if (!gameDesign) {
    throw new Error('gameDesign is required. All games must go through the two-stage design process.')
  }
  
  const prompt = buildCodeImplementationPrompt(topic, category, userLevel, learningObjective, gameDesign)
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
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
      // 503错误表示服务暂时不可用，稍后重试
      if (response.status === 503) {
        console.log('Gemini API暂时不可用，等待3秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // 重试一次
        const retryResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
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
          console.error(`游戏生成重试失败: ${retryResponse.status}`)
          throw new Error(`Gemini API重试后仍然失败: ${retryResponse.status}`)
        }
        
        const retryData = await retryResponse.json()
        const retryContent = retryData.candidates[0].content.parts[0].text
        console.log('游戏生成重试成功')
        
        // 使用重试的内容继续处理
        return parseGameResponse(retryContent, topic)
      } else {
        throw new Error(`Gemini API error: ${response.status}`)
      }
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    // 解析AI生成的内容
    return parseGameResponse(content, topic)
  } catch (error) {
    console.error('Error generating game:', error)
    // 不返回备用游戏，直接抛出错误
    throw new Error('游戏生成失败，请重试')
  }
}

/**
 * 基于设计方案构建代码实现提示词
 */
function buildCodeImplementationPrompt(topic: string, category: string, userLevel: string, learningObjective: string, gameDesign: import('./game-designer-service').GameDesignConcept): string {
  const designSystemCSS = `
/* 硅谷极简设计系统 - 与主应用保持一致 */
:root {
  --bg-primary: #ffffff;
  --fg-primary: #1a1a1a;
  --bg-secondary: #f9fafb;
  --fg-secondary: #6b7280;
  --border: #e5e7eb;
  --accent: #374151;
  --success: #10b981;
  --danger: #ef4444;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--fg-primary);
  margin: 0;
  padding: 0;
  line-height: 1.6;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.game-container {
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  background: var(--bg-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.control-panel {
  background: var(--bg-secondary);
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.parameter-group {
  margin-bottom: 16px;
}

.parameter-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--fg-primary);
  margin-bottom: 8px;
}

.parameter-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  outline: none;
  -webkit-appearance: none;
}

.parameter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--fg-primary);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
  box-shadow: var(--shadow);
}

.game-canvas {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.stats {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  font-size: 14px;
  color: var(--fg-secondary);
}

.btn {
  background: var(--fg-primary);
  color: var(--bg-primary);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.equation-display {
  font-family: 'SF Mono', Monaco, monospace;
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 6px;
  margin: 16px 0;
  font-size: 16px;
  text-align: center;
}
`

  return `你是一位前端工程师，专门将游戏设计实现为简洁的HTML5游戏。

**游戏设计方案：**
- **游戏名称：** ${gameDesign.gameTitle}
- **游戏描述：** ${gameDesign.gameDescription}
- **核心玩法：** ${gameDesign.coreGameplay}
- **胜利条件：** ${gameDesign.winCondition}

**实现要求：**
1. **简洁实现**：按照设计方案实现核心功能，保持代码简单易懂
2. **完整游戏**：包含游戏逻辑、胜利判定、重试功能
3. **全屏设计**：游戏占满整个屏幕，使用提供的CSS样式
4. **无外部依赖**：所有代码都在一个HTML文件中

**🎯 必须实现的反馈机制：**
1. **成功判定**：严格按照胜利条件实现判定逻辑（如误差检查、正确率计算等）
2. **成功反馈**：成功时显示庆祝效果（绿色提示、"恭喜"消息等）
3. **失败提示**：失败时显示明确的错误信息（红色提示、具体错误原因等）
4. **操作按钮**：
   - 成功后：显示"下一轮"或"重新开始"按钮
   - 失败后：显示"重试"按钮
   - 游戏中：显示"提交答案"或"检查结果"按钮

**必须实现的功能：**
- 按照核心玩法设计交互界面
- 实现胜利条件的精确判定逻辑
- 失败时显示具体错误原因和重试按钮
- 成功时显示庆祝效果和继续按钮
- 提供清晰的操作指导和即时反馈

**CSS样式系统（必须使用）：**
${designSystemCSS}

**反馈样式示例：**
\`\`\`css
.success-message {
  background: #10b981;
  color: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin: 16px 0;
}

.error-message {
  background: #ef4444;
  color: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  margin: 16px 0;
}

.action-button {
  background: var(--fg-primary);
  color: var(--bg-primary);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin: 8px;
}
\`\`\`

**输出格式：**
\`\`\`json
{
  "html": "<!DOCTYPE html><html><head><title>${gameDesign.gameTitle}</title><style>/* CSS */</style></head><body><!-- HTML --><script>/* JavaScript */</script></body></html>",
  "title": "${gameDesign.gameTitle}"
}
\`\`\`

请实现"${gameDesign.gameTitle}"游戏，确保包含完整的成功/失败反馈和操作引导！`
}



/**
 * 解析AI生成的游戏内容
 */
function parseGameResponse(content: string, topic: string): GameResponse {
  let cleanContent = ''
  
  try {
    cleanContent = content.trim()
    
    // 提取JSON内容
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanContent = jsonMatch[0]
    }

    // 强化的JSON清理逻辑
    cleanContent = cleanContent
      // 移除控制字符
      .replace(/[\x00-\x1F\x7F]/g, '')
    
    // 尝试修复JSON结构
    if (!cleanContent.endsWith('}')) {
      cleanContent += '}'
    }

    console.log('Attempting to parse cleaned JSON...')
    const result = JSON.parse(cleanContent)
    
    // 验证必要字段
    if (!result.html || !result.title) {
      throw new Error('Invalid game response format: missing html or title field')
    }

    return {
      html: result.html,
      title: result.title || `${topic} 互动学习`,
      instructions: result.instructions || '通过调节参数来探索和学习概念！',
      gameType: result.gameType || 'interactive-learning',
      topic: topic
    }
  } catch (error) {
    console.error('Failed to parse game response:', error)
    console.error('Original content (first 500 chars):', content.substring(0, 500))
    console.error('Cleaned content (first 500 chars):', cleanContent?.substring(0, 500))
    
    // 尝试更激进的修复方法
    try {
      console.log('Attempting aggressive JSON repair...')
      
      // 寻找html和title字段 - 修复regex以正确处理HTML内容
      const htmlMatch = content.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/)
      const titleMatch = content.match(/"title"\s*:\s*"([^"]*?)"/)
      
      if (htmlMatch && titleMatch) {
        console.log('Successfully extracted fields using regex')
        return {
          html: htmlMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\'),
          title: titleMatch[1].replace(/\\"/g, '"'),
          instructions: '通过调节参数来探索和学习概念！',
          gameType: 'interactive-learning',
          topic: topic
        }
      }
    } catch (repairError) {
      console.error('Aggressive repair also failed:', repairError)
    }
    
    throw new Error('游戏生成格式错误，请重试')
  }
}

// 备用游戏函数已移除，因为用户要求不使用任何备用内容 