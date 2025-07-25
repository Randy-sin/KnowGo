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
  return `你是一位世界顶级的教育游戏设计师。你的核心使命是将复杂抽象的知识，转化为直观、有趣、且富有启发性的互动游戏体验。

当接收到用户想要学习的知识主题（例如"圆锥曲线"、"化学键"、"排序算法"等）时，你需要遵循以下步骤，为该主题设计一款创新且玩法完整的教育游戏。

**当前学习主题：** ${topic}
**学科分类：** ${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
**用户水平：** ${userLevel}
**学习目标：** ${learningObjective}

**设计步骤：**

1. **分析与解构:** 首先，深入分析用户提供的学习主题。识别出其最核心、最关键的知识点。例如，对于"抛物线"，核心是二次函数的参数如何影响曲线形状；对于"化学键"，核心是原子间电子的转移或共用。
2.  **构思核心互动机制:** 基于核心知识点，构思一个能让玩家"亲手操作"这些概念的游戏机制。这个机制必须是游戏的核心，并且与学习目标紧密相连。问问自己：玩家可以通过什么动作，直观地感受到知识原理？（例如：通过拖动滑块改变参数，通过拖拽原子形成分子等）。
3. **构建完整的游戏方案:** 将你的构思扩展成一个详细、结构化的游戏设计方案。
4. **设计游戏流程:** 将游戏设计方案扩展成一个完整、流畅的游戏流程。

**设计要求：**
- 游戏名称：为你的游戏起一个富有创意、能够吸引玩家的名字
- 核心学习目标：清晰地列出1-3个玩家在完成游戏后能够掌握的核心知识点  
- 游戏背景/故事：创造一个简单的背景故事或情境，让学习过程更具沉浸感和趣味性
- 核心玩法详述：详细、分步地描述游戏的玩法，说明玩家的具体操作、游戏界面呈现、即时反馈机制
- 进阶与挑战：描述游戏如何随着玩家的熟练度提升而增加难度
- 教育价值总结：阐述为什么这款游戏能够比传统学习方式更有效

**创新性要求（极其重要）：**
- **避免重复**：绝对不要重复使用相同的游戏概念，每次都要全新创意
- **多样化思考**：为"${topic}"思考多种不同的游戏机制可能性，选择最创新的一种
- **场景多样性**：避免总是使用相同场景，考虑：虚拟实验室、太空探索、城市建设、艺术创作、历史穿越等
- **交互创新**：探索多样化交互：拖拽组装、绘制创作、点击序列、策略选择、时间管理等

**示例（抛物线主题）：**

## 篮筐神投手

### 游戏概述
**游戏类型：** 弹道模拟类教育游戏
**核心目标：** 直观理解二次函数 y = ax² + bx + c 中，参数 a, b, c 对抛物线形状和位置的影响

### 游戏背景
玩家扮演一位想要成为投篮大师的球员，需要掌握物理学原理来完美控制篮球轨迹。每次投篮都是一次数学实验，通过调整函数参数来找到完美的弧线。

### 核心玩法
玩家通过三个滑块分别调整二次函数的参数：
- **参数a滑块**：控制抛物线开口大小，影响篮球弧度的陡峭程度
- **参数b滑块**：控制对称轴位置，影响篮球轨迹的左右偏移
- **参数c滑块**：控制起始高度，决定篮球的起跳点

玩家实时观察轨迹预览线的变化，当认为轨迹能够通过篮筐时点击投篮。篮球会严格按照设定的抛物线轨迹飞行，成功进球则完成挑战。

### 教育机制
游戏将抽象的函数参数调节转化为具象的投篮动作。玩家在反复尝试"如何让球进"的过程中，不知不觉地深刻理解了a、b、c每个参数的独立作用以及它们如何共同决定抛物线形态。

### 进阶挑战
- **新手模式**：固定篮筐位置，专注理解参数关系
- **移动挑战**：篮筐会左右移动，需要实时调整参数
- **障碍模式**：加入防守员干扰，需要设计巧妙弧线
- **精准大师**：要求球必须从篮筐正中央落入

**输出格式要求：**

请严格按照以下简化JSON格式输出，不要添加任何其他内容：

\`\`\`json
{
  "gameTitle": "创新游戏名称",
  "gameDescription": "游戏整体描述和背景故事",
  "coreGameplay": "详细的核心玩法描述，包括玩家具体操作、界面元素、交互机制、反馈系统等",
  "winCondition": "明确的胜利条件和失败处理机制",
  "designRationale": "设计理念和教育价值的详细阐述"
}
\`\`\`

**重要提醒：**
- 只输出JSON格式，不要任何其他文字、解释或对话
- 为"${topic}"设计一个创新且富有启发性的学习游戏
- 确保游戏有明确的成功/失败条件和创新的交互机制
- 学习概念必须成为游戏核心机制，而不是附加说明
- 考虑用户水平：${userLevel}，设计合适的挑战难度
- 游戏要有趣味性和重复游玩价值
- **核心目标**：每次生成都要是全新的创意体验，避免任何重复

现在请为主题"${topic}"设计一个创新的学习游戏概念！必须严格按照JSON格式输出！`
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