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

  return `你是世界顶级的前端游戏开发工程师，专门将创意游戏设计转化为高质量的HTML5互动游戏代码。游戏设计师已经为你提供了完整的设计方案，你的任务是将这个设计方案完美实现为可运行的代码。

**📋 游戏设计师提供的完整设计方案：**

**🎮 游戏设计方案：**

**游戏标题：** ${gameDesign.gameTitle}

**游戏描述：** ${gameDesign.gameDescription}

**核心玩法：** ${gameDesign.coreGameplay}

**胜利条件：** ${gameDesign.winCondition}

**设计理念：** ${gameDesign.designRationale}

**🚀 代码实现任务说明：**

游戏设计师已经为你提供了完整的设计蓝图，你必须将这个设计**逐一实现**为可运行的HTML5游戏代码。

**⚡ 核心实现要求：**

1. **100%遵循设计方案**：严格按照上述设计方案实现，不得遗漏任何功能点
2. **完整的HTML5游戏**：生成完整的<!DOCTYPE html>到</html>的单文件游戏
3. **无外部依赖**：所有CSS和JavaScript必须内联，确保游戏可独立运行
4. **设计系统统一**：严格使用提供的CSS变量，保持视觉一致性
5. **全屏游戏体验**：游戏占满整个屏幕，无边框无padding，提供沉浸式体验
6. **流畅交互**：实现所有设计方案中的反馈机制和动画效果
7. **完整游戏循环**：包含状态管理、事件处理、胜负判定等完整逻辑

**🏆 核心功能实现清单（必须全部完成）：**

1. **严格按照核心玩法实现**：${gameDesign.coreGameplay}
2. **实现胜利条件**：${gameDesign.winCondition}
3. **完整游戏循环**：包含开始、游戏中、成功、失败等状态
4. **即时反馈系统**：用户操作的实时视觉反馈
5. **重试机制**：失败后可以重新开始游戏
6. **成功庆祝动画和失败提示**

**CRITICAL JSON输出格式：**

请严格按照以下格式输出，不要任何其他内容：

\`\`\`json
{
  "html": "<!DOCTYPE html><html lang=\\"zh-CN\\"><head><meta charset=\\"UTF-8\\"><meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\"><title>${gameDesign.gameTitle}</title><style>/* 完整CSS实现 */</style></head><body><!-- 完整HTML结构和游戏逻辑 --><script>/* 完整JavaScript实现 */</script></body></html>",
  "title": "${gameDesign.gameTitle}",
  "instructions": "${gameDesign.gameDescription}",
  "gameType": "design-based-implementation"
}
\`\`\`

**⚠️ 最终代码质量要求：**
- html字段必须是完整可运行的HTML代码（从<!DOCTYPE html>到</html>）
- 严格按照设计方案实现所有功能，不得遗漏
- 确保游戏逻辑完整，所有函数都有完整实现
- 正确转义所有引号，代码在一行中但保持逻辑清晰
- 游戏使用全屏设计，无边框无边距，提供完全沉浸的学习体验
- 必须包含设计方案中的所有视觉元素和交互功能

**硅谷极简设计系统（强制使用）：**
${designSystemCSS}

**🎯 最终任务：**
现在请将游戏设计师的"${gameDesign.gameTitle}"设计方案完美实现为可运行的HTML5游戏代码！

**重要：只输出严格的JSON格式，不要任何解释或对话！**

**JSON格式要求：**
- 确保所有引号都正确转义（在HTML字符串中使用 \\" 而不是 "）
- 所有反斜杠必须双重转义（\\\\ 而不是 \\）
- 不要在JSON中包含换行符，保持所有代码在单行内
- 严格遵循 {"html": "...", "title": "..."} 格式
- HTML代码必须正确转义，避免JSON解析错误

**输出格式示例：**
{"html": "<!DOCTYPE html><html><head><title>Game</title></head><body><h1>Hello</h1></body></html>", "title": "游戏标题"}

**严格按照设计方案实现所有功能！**`
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