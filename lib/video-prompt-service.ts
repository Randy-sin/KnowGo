export interface VideoPromptRequest {
  topic: string
  userLevel: 'beginner' | 'intermediate' | 'expert'
}

export interface VideoPromptResponse {
  videoPrompt: string
  topic: string
  userLevel: string
}

/**
 * 为历史主题生成沉浸式视频提示词
 */
export async function generateHistoryVideoPrompt(request: VideoPromptRequest): Promise<VideoPromptResponse> {
  const { topic, userLevel } = request
  
  const prompt = buildVideoPromptTemplate(topic, userLevel)
  
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
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    return {
      videoPrompt: content.trim(),
      topic,
      userLevel
    }
  } catch (error) {
    console.error('Error generating video prompt:', error)
    throw new Error('视频提示词生成失败，请重试')
  }
}

/**
 * 构建沉浸式历史场景提示词模板
 */
function buildVideoPromptTemplate(topic: string, userLevel: string): string {
  const levelGuidance = {
    beginner: '基础入门级别，重点展示直观的历史场景和关键事件',
    intermediate: '中等难度，展示历史背景和人物互动', 
    expert: '高级水平，展示复杂的历史脉络和深层影响'
  }

  const currentGuidance = levelGuidance[userLevel as keyof typeof levelGuidance] || levelGuidance.intermediate

  return `你是一位专业的历史教育视频制作专家，擅长创造沉浸式的历史学习体验。现在需要你为"${topic}"这个历史主题创作一个视频提示词，让观看者能够身临其境地体验历史。

**核心要求：**
1. **沉浸式体验**：将观看者置身于历史场景中，仿佛亲身经历
2. **视觉化叙述**：详细描述场景、人物、环境、氛围
3. **教育价值**：在沉浸体验中自然融入历史知识点
4. **情感共鸣**：通过生动的场景激发学习兴趣

**历史主题：** ${topic}
**观看者水平：** ${currentGuidance}

**视频提示词结构要求：**
1. **开场场景设定**（30-50字）：描述历史时空背景
2. **核心历史场景**（100-150字）：详细展现关键历史时刻
3. **人物与对话**（50-80字）：重要历史人物的互动
4. **教育要点融入**（50-80字）：自然融入学习要点
5. **结尾升华**（30-50字）：历史意义和现代启发

**写作风格：**
- 使用第二人称"你"，增强沉浸感
- 丰富的感官细节描述（视觉、听觉、触觉）
- 戏剧化但准确的历史重现
- 适合视频制作的镜头语言

**示例参考：**
如果主题是"工业革命"：
"你站在18世纪末的英国曼彻斯特街头，浓烟从高耸的烟囱中滚滚而出，机器的轰鸣声震耳欲聋。你走进一座纺织工厂，看到无数工人在巨大的蒸汽机旁挥汗如雨..."

请为"${topic}"创作一个完整的沉浸式历史视频提示词：`
} 