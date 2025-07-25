export interface FeedbackAnalysis {
  analysis: string;
  insights: string[];
}

export async function generateFeedbackAnalysis(
  question: string,
  userAnswer: string,
  topic: string,
  category: string
): Promise<FeedbackAnalysis> {
  try {
    console.log('Generating feedback analysis with Gemini:', { question, userAnswer, topic, category })
    
    const prompt = `你是一位优秀的学习引导者，你的任务是为学生的回答提供建设性的反馈分析。

**核心理念：**
1. **鼓励式反馈**：首先肯定学生的思考努力，即使答案不完整也要找到亮点
2. **知识建构**：从学生现有的理解出发，逐步引导到正确的概念理解
3. **生活联系**：将抽象的学科知识与具体的生活经验建立联系
4. **深度理解**：不仅给出标准答案，更要解释背后的原理和"为什么"

**学习主题：** ${topic}
**学科分类：** ${category === 'science' ? '理科' : category === 'history' ? '历史' : '文科'}
**引导问题：** ${question}
**学生回答：** ${userAnswer || '学生选择了跳过这个问题'}

**请你提供：**
1. **鼓励性分析**（25-50字）：先肯定学生的思考，然后基于他们的回答进行深入分析和引导，如果学生跳过了问题，就从问题本身的价值和意义开始分析
2. **关键洞察**（3个要点）：提炼出最重要的学习要点，每个要点简洁明了

**输出格式要求：**
请严格按照以下JSON格式输出，不要添加任何markdown标记或其他内容：

{
  "analysis": "你的鼓励性分析内容",
  "insights": [
    "第一个关键洞察",
    "第二个关键洞察", 
    "第三个关键洞察"
  ]
}

注意：
- analysis字段应该是温暖、鼓励性的语言
- 要体现出对学生思考过程的理解和尊重
- 即使学生答案不完整，也要找到可以肯定的地方
- 用生活化的例子帮助理解抽象概念
- insights要简洁有力，每个不超过15个字`;

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
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    const content = data.candidates[0].content.parts[0].text;
    console.log('Extracted content:', content);

    // 清理可能的markdown代码块格式
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      const result = JSON.parse(cleanContent) as FeedbackAnalysis;
      
      // 验证结果格式
      if (!result.analysis || !Array.isArray(result.insights)) {
        throw new Error('Invalid response format');
      }
      
      if (result.insights.length !== 3) {
        throw new Error('Expected exactly 3 insights');
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse feedback analysis response:', parseError);
      console.error('Raw content:', cleanContent);
      throw new Error('Failed to parse AI feedback analysis');
    }

  } catch (error) {
    console.error('Gemini feedback analysis API call failed:', error);
    throw error;
  }
} 