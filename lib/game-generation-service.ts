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
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
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
  width: 100%;
  min-height: 100vh;
}

.game-container {
  width: 100%;
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

  return `你是世界顶级的教育游戏设计师，专门为苹果、OpenAI等顶级科技公司设计真正的**闯关类学习游戏**。你必须创建一个有明确游戏目标、挑战机制和胜利条件的完整游戏。

**🎯 CRITICAL 游戏设计理念：**
这不是教学演示，而是**真正的游戏**！用户必须通过固定的玩法来完成挑战，成功后游戏结束，失败则继续尝试。

**学习背景：**
- 主题：${topic}
- 学科：${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
- 用户水平：${userLevel}
- 学习目标：${learningObjective}

**🎮 CRITICAL 游戏机制要求：**

${getGameMechanics(topic, category)}

**🏆 必须包含的游戏元素：**
1. **明确的挑战目标** - 用户知道要达成什么
2. **失败反馈机制** - 未达成目标时的提示和鼓励
3. **成功庆祝动画** - 达成目标时的胜利效果
4. **参数控制面板** - 让用户调节关键变量
5. **实时视觉反馈** - 参数变化立即显示效果
6. **尝试次数统计** - 增加游戏紧张感
7. **重置/重新开始** - 允许用户多次尝试

**🎨 硅谷极简美学 (强制要求)：**
- 纯白背景 (#ffffff) + 深灰文字 (#1a1a1a)
- 微妙阴影和12px圆角
- 无鲜艳色彩，只用灰度 + 单一强调色
- 系统字体：ui-sans-serif, system-ui, -apple-system

**⚡ 技术实现 (必须完整可运行)：**

**HTML结构要求：**
- 完整的 <!DOCTYPE html> 文档结构
- 包含 <head> 标签，设置 charset="UTF-8" 和 viewport
- 使用 <canvas> 或 <svg> 来绘制游戏画面
- 参数控制面板：滑块 <input type="range"> 用于调节参数
- 游戏状态显示：显示尝试次数、当前参数值
- 操作按钮：开始游戏、重置游戏的 <button> 元素

**CSS样式要求：**
- 所有样式必须内联在 <style> 标签中
- 严格使用提供的CSS变量系统
- 实现响应式布局，适配手机和桌面
- 添加微妙的动画和过渡效果

**JavaScript逻辑要求：**
- 纯Vanilla JavaScript，不依赖任何外部库
- 实现游戏主循环：参数更新 → 计算结果 → 绘制画面
- 处理用户交互：滑块变化、按钮点击
- 实现胜利检测逻辑和失败重试机制
- 添加动画效果：轨迹绘制、胜利庆祝、失败提示

**📝 通用HTML游戏结构模板：**
\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[根据主题生成标题]</title>
    <style>
        /* 使用提供的CSS变量系统 */
        :root { --bg-primary: #ffffff; --fg-primary: #1a1a1a; /* ... */ }
        body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
        .game-container { width: 100%; margin: 0 auto; }
        /* 根据游戏类型设计相应的交互界面样式 */
    </style>
</head>
<body>
    <div class="game-container">
        <!-- 游戏控制区域 - 根据主题设计不同的交互方式 -->
        <div class="control-area">
            <!-- 可能是：滑块、按钮、拖拽区域、输入框、选择器等 -->
        </div>
        
        <!-- 游戏显示区域 - Canvas、SVG或DOM元素 -->
        <div class="game-display">
            <!-- 根据主题选择：Canvas绘图、DOM动画、SVG图形等 -->
        </div>
        
        <!-- 游戏状态区域 -->
        <div class="game-status">
            <!-- 得分、尝试次数、提示信息、进度等 -->
        </div>
    </div>

    <script>
        // 根据主题实现完全不同的游戏逻辑和交互方式
    </script>
</body>
</html>
\`\`\`

**🎮 多样化交互方式示例：**
- **拖拽类**：拖拽元素到目标位置（如历史事件排序）
- **点击类**：点击正确选项或区域（如地理位置识别）
- **输入类**：输入答案或命令（如编程逻辑）
- **滑块类**：调节参数观察变化（如物理实验）
- **绘制类**：鼠标绘制图形或路径（如几何作图）
- **时序类**：按正确顺序执行操作（如化学实验步骤）
- **策略类**：做出决策选择（如经济模拟）

**🚨 CRITICAL 代码生成要求：**

你必须根据主题"${topic}"创造性地设计并生成一个**完整可运行的HTML学习游戏**：

**🎨 创意设计要求：**
- 深度分析"${topic}"的核心概念和学习难点
- 创造最适合该主题的独特游戏机制（不局限于参数调节）
- 设计符合该主题特点的交互方式和控制方法
- 选择最能体现概念的视觉呈现方式

**🛠️ 技术实现要求：**
- 完整的HTML5文档结构（<!DOCTYPE html>到</html>）
- 内联CSS样式（严格使用设计系统变量）
- 完整的JavaScript游戏逻辑（无外部依赖）
- 根据游戏类型选择：Canvas绘图/DOM操作/SVG图形
- 实现完整的用户交互系统
- 流畅的动画效果和即时反馈
- **重要：不要限制容器尺寸，使用100%宽度充分利用屏幕空间**

**🎮 游戏机制要求：**
- 明确的挑战目标和胜利条件
- 富有教育意义的失败反馈机制
- 鼓励探索和重复游玩的设计
- 概念理解与游戏乐趣的完美结合

**CRITICAL JSON输出格式：**
\`\`\`json
{
  "html": "<!DOCTYPE html><html lang=\\"zh-CN\\"><head><meta charset=\\"UTF-8\\"><meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\"><title>游戏标题</title><style>/* 完整CSS样式 */</style></head><body><!-- 完整HTML结构 --><script>/* 完整JavaScript逻辑 */</script></body></html>",
  "title": "简洁的游戏标题",
  "instructions": "清晰的游戏规则和目标",
  "gameType": "challenge-based-game"
}
\`\`\`

**⚠️ 重要提醒：**
- html字段必须是完整的、可直接运行的HTML代码
- 所有引号必须正确转义 (使用 \\")
- 代码必须压缩在一行中，但保持可读性
- 必须包含完整的游戏逻辑，不能有未实现的函数
- **关键：游戏容器使用100%宽度，不要设置max-width限制**

**强制设计系统 (CSS变量)：**
${designSystemCSS}

**🚀 成功标准检查清单：**
✅ 有明确的胜利条件 (如：篮球进筐)
✅ 有失败重试机制 (可以无限尝试)
✅ 参数调节直接影响游戏结果
✅ 包含视觉动画反馈
✅ 有尝试次数或得分统计
✅ 胜利时有庆祝效果
✅ 失败时有智能提示
✅ HTML完整可运行
✅ 严格遵循设计系统

**❌ 禁止创建的内容：**
- 静态的数学图表展示
- 纯教学性的参数演示
- 没有明确目标的"探索工具"
- 只有可视化没有游戏挑战

**🎯 创意游戏设计挑战：**

请为"${topic}"创造一个独特的学习游戏！

**💡 设计思路指导：**
不要被"参数调节"限制思维，要根据主题特点选择最合适的交互方式：
- 抛物线 → 投篮轨迹调节游戏
- 历史事件 → 时间线拖拽排序游戏  
- 化学反应 → 实验步骤操作游戏
- 地理知识 → 地图点击识别游戏
- 编程逻辑 → 代码拼图组合游戏
- 生物结构 → 器官拖拽组装游戏

**🚀 立即开始创造：**
1. 深入理解"${topic}"的本质和学习难点
2. 设计最能体现该概念的游戏玩法
3. 编写完整的HTML5游戏代码
4. 确保游戏既有趣又富有教育意义
5. 让用户在享受游戏的过程中自然掌握"${topic}"！

请严格按照JSON格式输出，html字段包含完整可运行的创意游戏代码。`

  function getGameMechanics(topic: string, category: string): string {
    if (category === 'science') {
      if (topic.includes('抛物线') || topic.includes('parabola')) {
        return `
**🏀 抛物线投篮挑战游戏：**
- **游戏目标**：通过调节二次函数 y = ax² + bx + c 的参数，让篮球准确投进篮筐
- **挑战机制**：每次投篮都会显示抛物线轨迹，进筐则胜利，不进则继续尝试
- **参数控制**：3个滑块分别控制 a(开口)、b(倾斜)、c(高度)
- **反馈系统**：实时显示轨迹预览，失败时给出参数调节建议
- **胜利条件**：篮球中心点进入篮筐范围即为成功
- **统计系统**：显示尝试次数，鼓励用户优化策略`
      } else if (topic.includes('机器学习') || topic.includes('machine learning')) {
        return `
**🧠 AI训练师挑战游戏：**
- **游戏目标**：调节机器学习参数，让AI成功分类散点数据
- **挑战机制**：给定训练数据集，用户调节参数直到分类准确率达到85%以上
- **参数控制**：学习率、迭代次数、模型复杂度滑块
- **反馈系统**：实时显示分类边界和准确率变化
- **胜利条件**：准确率 ≥ 85% 且过拟合指标正常
- **失败提示**：过拟合/欠拟合时的智能建议`
      } else if (topic.includes('物理') || topic.includes('physics')) {
        return `
**🚗 物理赛车挑战游戏：**
- **游戏目标**：调节物理参数让小车成功冲过终点线
- **挑战机制**：控制重力、摩擦力、初速度等参数
- **参数控制**：力学参数滑块，实时影响小车运动
- **反馈系统**：显示速度曲线、能量转换过程
- **胜利条件**：小车到达终点且速度在安全范围内
- **统计系统**：最佳时间记录和尝试次数`
      } else {
        return `
**🎯 科学实验挑战游戏：**
- **游戏目标**：通过调节实验参数达到预期结果
- **挑战机制**：模拟真实实验环境，参数影响实验结果
- **参数控制**：相关科学变量的精确调节
- **反馈系统**：实时数据图表和结果预测
- **胜利条件**：实验结果在目标范围内
- **教育价值**：在游戏中理解科学原理`
      }
    } else if (category === 'history') {
      return `
**⚔️ 历史决策挑战游戏：**
- **游戏目标**：做出正确的历史决策，改变历史进程
- **挑战机制**：面临关键历史节点，选择不同策略
- **参数控制**：资源分配、政策选择、时机把握
- **反馈系统**：决策结果的即时历史影响展示
- **胜利条件**：成功达成历史目标或避免历史悲剧
- **多线结局**：不同选择导向不同的历史结果`
    } else {
      return `
**🌍 地理探险挑战游戏：**
- **游戏目标**：通过调节地理参数完成探险任务
- **挑战机制**：模拟地理环境，参数影响探险成功率
- **参数控制**：气候、地形、资源等地理要素
- **反馈系统**：环境变化的实时可视化
- **胜利条件**：成功完成地理探险或解决环境问题
- **知识应用**：在游戏中掌握地理概念`
    }
    
    return `
**🎮 通用学习挑战游戏：**
- **游戏目标**：通过参数调节完成学习挑战
- **挑战机制**：明确的成功/失败标准
- **参数控制**：核心概念的可调节变量
- **反馈系统**：即时的视觉和数值反馈
- **胜利条件**：达到预设的学习目标
- **重试机制**：失败后的智能提示和重新挑战`
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