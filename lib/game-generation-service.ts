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
  --warning: #f59e0b;
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

.header-bar {
  background: var(--bg-secondary);
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--fg-secondary);
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

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--fg-primary);
  border: 1px solid var(--border);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-warning {
  background: var(--warning);
  color: white;
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

.exit-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 1000;
}

.completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.completion-card {
  background: var(--bg-primary);
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

**🚨 核心要求 - 必须实现游戏完成机制：**

**1. 明确的完成退出机制（必须实现）：**
- 成功完成若干轮后（建议3-5轮），自动弹出完成提示
- 显示"学习完成"或"游戏完成"的明确消息
- 提供"结束游戏"按钮，点击后触发 \`window.parent?.postMessage({type: 'GAME_COMPLETED'}, '*')\`
- 避免无限循环，确保用户有明确的退出路径

**2. 用户逃生通道（必须实现）：**
- 右上角固定显示"跳过游戏"按钮，随时可点击
- 点击跳过按钮触发 \`window.parent?.postMessage({type: 'GAME_SKIPPED'}, '*')\`
- 进度指示器显示当前轮次/总轮次（如："第2轮/共5轮"）

**3. 渐进式难度和明确终点：**
- 设计3-5个渐进式关卡或轮次
- 每轮成功后询问用户："继续下一轮" 或 "完成学习"
- 完成所有轮次后强制结束，不允许继续

**🎯 必须实现的反馈机制：**
1. **成功判定**：严格按照胜利条件实现判定逻辑（如误差检查、正确率计算等）
2. **成功反馈**：成功时显示庆祝效果（绿色提示、"恭喜"消息等）
3. **失败提示**：失败时显示明确的错误信息（红色提示、具体错误原因等）
4. **操作按钮**：
   - 成功后：显示"下一轮"或"完成学习"按钮
   - 失败后：显示"重试"按钮
   - 游戏中：显示"提交答案"或"检查结果"按钮
   - 完成后：显示"结束游戏"按钮

**必须实现的界面元素：**

**头部栏（必须包含）：**
\`\`\`html
<div class="header-bar">
  <div class="progress-indicator">
    <span>第 <span id="currentRound">1</span> 轮 / 共 <span id="totalRounds">5</span> 轮</span>
  </div>
  <div class="exit-controls">
    <button class="btn btn-warning" onclick="skipGame()">跳过游戏</button>
  </div>
</div>
\`\`\`

**完成覆盖层（必须包含）：**
\`\`\`html
<div id="completionOverlay" class="completion-overlay" style="display: none;">
  <div class="completion-card">
    <h2>🎉 学习完成！</h2>
    <p>恭喜您完成了《${gameDesign.gameTitle}》的学习！</p>
    <p>您已经掌握了相关知识点。</p>
    <button class="btn btn-success" onclick="completeGame()">结束游戏</button>
  </div>
</div>
\`\`\`

**必须实现的JavaScript函数：**
\`\`\`javascript
let currentRound = 1;
const totalRounds = 5; // 或其他合理数字
let roundsCompleted = 0;

function nextRound() {
  currentRound++;
  roundsCompleted++;
  
  // 更新进度显示
  document.getElementById('currentRound').textContent = currentRound;
  
  // 检查是否完成所有轮次
  if (roundsCompleted >= totalRounds) {
    showCompletionOverlay();
    return;
  }
  
  // 继续下一轮或询问用户
  if (confirm('恭喜完成这一轮！是否继续下一轮？（点击取消结束游戏）')) {
    // 重置游戏状态开始新轮次
    resetRound();
  } else {
    showCompletionOverlay();
  }
}

function showCompletionOverlay() {
  document.getElementById('completionOverlay').style.display = 'flex';
}

function completeGame() {
  // 通知父页面游戏完成
  window.parent?.postMessage({type: 'GAME_COMPLETED'}, '*');
}

function skipGame() {
  if (confirm('确定要跳过这个游戏吗？')) {
    window.parent?.postMessage({type: 'GAME_SKIPPED'}, '*');
  }
}

function resetRound() {
  // 重置当前轮次的游戏状态
  // 根据具体游戏实现
}
\`\`\`

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
  "html": "<!DOCTYPE html><html><head><title>${gameDesign.gameTitle}</title><style>/* CSS */</style></head><body><!-- HTML包含头部栏、游戏区域、完成覆盖层 --><script>/* JavaScript包含必需的函数 */</script></body></html>",
  "title": "${gameDesign.gameTitle}"
}
\`\`\`

**关键要求总结：**
1. 🚨 **必须有明确的游戏结束条件**（3-5轮后强制结束）
2. 🚨 **必须有跳过按钮**（右上角固定位置）
3. 🚨 **必须有进度指示**（显示当前轮次）
4. 🚨 **必须有完成覆盖层**（防止无限循环）
5. 🚨 **必须实现postMessage通信**（通知父页面）

请实现"${gameDesign.gameTitle}"游戏，确保用户永远不会被困在游戏中！`
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
      // 预处理常见的JSON问题
      .replace(/,(\s*[}\]])/g, '$1') // 移除尾随逗号
      .replace(/(["\]])\s*(["\[])/g, '$1,$2') // 修复缺失的逗号
    
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
      
      // 改进的字段提取 - 支持复杂HTML内容
      let htmlMatch = content.match(/"html"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/)
      let titleMatch = content.match(/"title"\s*:\s*"([^"]*?)"/)
      
      // 如果严格匹配失败，尝试更宽松的匹配
      if (!htmlMatch) {
        console.log('Trying fallback HTML extraction...')
        // 匹配到下一个字段或JSON结束
        htmlMatch = content.match(/"html"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"|\s*})/)
      }
      if (!titleMatch) {
        console.log('Trying fallback title extraction...')
        titleMatch = content.match(/"title"\s*:\s*"([^"}]*?)"/)
      }
      
      if (htmlMatch && titleMatch) {
        console.log('Successfully extracted fields using regex')
        
        // 改进的字符串清理逻辑
        let htmlContent = htmlMatch[1]
        
        // 处理HTML内容中的转义序列
        htmlContent = htmlContent
          .replace(/\\"/g, '"')          // 转义的引号
          .replace(/\\n/g, '\n')         // 换行符
          .replace(/\\t/g, '\t')         // 制表符
          .replace(/\\r/g, '\r')         // 回车符
          .replace(/\\\\/g, '\\')        // 转义的反斜杠
          .replace(/\\'/g, "'")          // 转义的单引号
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16))) // Unicode
        
        const titleContent = titleMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        
        return {
          html: htmlContent,
          title: titleContent,
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