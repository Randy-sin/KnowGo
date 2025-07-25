export interface GameGenerationRequest {
  topic: string
  category: 'science' | 'history' | 'others'
  userLevel: 'beginner' | 'intermediate' | 'expert'
  learningObjective: string
}

export interface GameResponse {
  html: string
  title: string
  instructions: string
  gameType: string
}

/**
 * 为不同学科生成互动HTML游戏
 */
export async function generateInteractiveGame(request: GameGenerationRequest): Promise<GameResponse> {
  const { topic, category, userLevel, learningObjective } = request
  
  const prompt = buildGamePrompt(topic, category, userLevel, learningObjective)
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY || 'AIzaSyBxZ2fsjm-laE__4ELPZDbRLzzbTPY7ARU'
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
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    // 解析AI生成的内容
    return parseGameResponse(content, topic)
  } catch (error) {
    console.error('Error generating game:', error)
    // 返回备用游戏
    return createFallbackGame(topic, category)
  }
}

/**
 * 构建游戏生成的智能提示词
 */
function buildGamePrompt(topic: string, category: string, userLevel: string, learningObjective: string): string {
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
  padding: 20px;
  line-height: 1.6;
}

.game-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
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

  const gameTypes = {
    science: {
      parabola: 'Basketball Shooter - 抛物线投篮游戏',
      physics: 'Force Simulator - 物理力学模拟器', 
      chemistry: 'Reaction Lab - 化学反应实验室',
      biology: 'Cell Division - 细胞分裂可视化',
      ml: 'Neural Network - 神经网络训练器'
    },
    history: {
      timeline: 'Time Navigator - 历史时间导航器',
      decisions: 'Historical Choices - 历史决策模拟器',
      geography: 'Empire Builder - 帝国扩张模拟'
    },
    others: {
      geography: 'Climate Controller - 气候控制器',
      language: 'Word Evolution - 语言演化器',
      economics: 'Market Simulator - 市场模拟器'
    }
  }

  return `你是世界顶级的教育游戏设计师和前端工程师，专门为苹果、OpenAI等顶级科技公司设计极简优雅的学习游戏。

**核心任务：** 为"${topic}"创建一个完美的互动HTML学习游戏。

**学习背景：**
- 主题：${topic}
- 学科：${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
- 用户水平：${userLevel}
- 学习目标：${learningObjective}

**CRITICAL 设计要求：**

🎨 **硅谷极简美学 (必须严格遵循)：**
- 纯白背景 (#ffffff) + 深灰文字 (#1a1a1a)
- 使用提供的CSS变量系统
- 微妙阴影和12px圆角
- 绝对禁止鲜艳色彩和渐变
- 系统字体：ui-sans-serif, system-ui, -apple-system

🎮 **游戏机制 (根据主题智能适配)：**
${getGameMechanics(topic, category)}

⚡ **技术实现 (必须完整可运行)：**
- 完整的HTML5文档结构
- 内联CSS样式 (使用设计系统变量)
- JavaScript交互逻辑 (纯Vanilla JS，无外部依赖)
- Canvas 2D渲染或DOM操作
- 实时参数响应和可视化反馈

📚 **教育价值 (核心要求)：**
- 抽象概念可视化
- 参数调节 → 即时效果反馈
- 失败是学习的一部分
- 成就感和探索欲望

**CRITICAL JSON输出格式：**
\`\`\`json
{
  "html": "<!DOCTYPE html><html><head>...</head><body>...</body></html>",
  "title": "简洁的游戏标题",
  "instructions": "清晰的操作说明",
  "gameType": "具体的游戏类型"
}
\`\`\`

**强制设计系统 (CSS变量)：**
${designSystemCSS}

**生成检查清单：**
✅ HTML文档完整且可独立运行
✅ 严格使用设计系统CSS变量
✅ 游戏机制简单直观但有深度
✅ 参数调节有即时视觉反馈
✅ 包含明确的学习目标提示
✅ 代码注释清晰，结构优雅
✅ 适配移动端设备

**示例质量标准 (参考)：**
- 苹果官网的设计精度
- OpenAI产品的交互体验
- 可汗学院的教育价值

现在创建这个完美的学习游戏：`

  function getGameMechanics(topic: string, category: string): string {
    if (category === 'science') {
      if (topic.includes('抛物线') || topic.includes('parabola')) {
        return `
**投篮模拟器：**
- 调节二次函数 y = ax² + bx + c 参数
- 实时显示篮球轨迹
- 击中篮筐获得分数反馈
- 参数变化的物理意义解释`
      } else if (topic.includes('机器学习') || topic.includes('machine learning')) {
        return `
**神经网络训练器：**
- 调节学习率、隐藏层数等参数
- 可视化训练过程和损失函数
- 数据点分类可视化
- 观察过拟合/欠拟合现象`
      } else if (topic.includes('物理') || topic.includes('physics')) {
        return `
**物理模拟器：**
- 调节重力、摩擦力等物理参数
- 实时物体运动可视化
- 能量转换动画展示
- 物理定律的直观验证`
      }
    } else if (category === 'history') {
      return `
**历史时间线探索器：**
- 拖拽时间轴查看历史事件
- 点击事件查看详细信息
- 因果关系可视化连线
- "如果改变X会怎样"的假设模拟`
    } else {
      return `
**概念可视化器：**
- 核心概念参数化展示
- 交互式图表和图形
- 实时数据变化反馈
- 理论与实践结合的演示`
    }
    
    return `
**通用互动模拟器：**
- 关键参数滑块调节
- 实时可视化反馈
- 多层次概念解释
- 实验验证学习循环`
  }
}

/**
 * 解析AI生成的游戏内容
 */
function parseGameResponse(content: string, topic: string): GameResponse {
  try {
    // 清理内容
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const result = JSON.parse(cleanContent)
    
    // 验证必要字段
    if (!result.html || !result.title) {
      throw new Error('Invalid game response format')
    }

    return {
      html: result.html,
      title: result.title || `${topic} 互动学习`,
      instructions: result.instructions || '通过调节参数来探索和学习概念！',
      gameType: result.gameType || 'interactive-learning'
    }
  } catch (error) {
    console.error('Failed to parse game response:', error)
    throw new Error('Failed to generate game')
  }
}

/**
 * 创建备用游戏（当AI生成失败时）
 */
function createFallbackGame(topic: string, category: string): GameResponse {
  const fallbackHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic} 学习游戏</title>
    <style>
        :root {
            --bg-primary: #ffffff;
            --fg-primary: #1a1a1a;
            --bg-secondary: #f9fafb;
            --border: #e5e7eb;
        }
        
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--fg-primary);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .container {
            text-align: center;
            max-width: 400px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .message {
            color: #6b7280;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">${topic} 学习游戏</h1>
        <p class="message">正在为您准备个性化的学习体验...</p>
        <p class="message">请稍后重试或联系支持团队。</p>
    </div>
</body>
</html>`

  return {
    html: fallbackHTML,
    title: `${topic} 互动学习`,
    instructions: '正在准备学习内容，请稍后重试',
    gameType: 'fallback'
  }
} 