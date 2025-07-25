export type QuestionCategory = "science" | "history" | "others";

export interface ClassificationResult {
  category: QuestionCategory;
  confidence: number;
  reasoning: string;
}

export async function classifyQuestion(topic: string): Promise<ClassificationResult> {
  console.log('Classifying question with Gemini:', topic)
  try {
    const prompt = `你是一个智能的学科分类器。你需要将用户输入的学习主题准确分类到以下三个类别之一：

**分类标准：**
1. **science（理科）**：数学、物理、化学、生物等理科知识点
   - 例如：抛物线、浮力、化学反应、细胞分裂、函数、力学、机器学习、代码、算法等
   
2. **history（历史）**：历史事件、历史人物、历史时期等
   - 例如：第二次世界大战、唐朝、拿破仑、工业革命等
   
3. **others（其他）**：地理、语言、社会、艺术等文科知识点
   - 例如：地形地貌、气候、国家地区、文学作品、语法等

**输出要求：**
请严格按照以下JSON格式输出，不要添加任何其他内容：

{
  "category": "science|history|others",
  "confidence": 0.95,
  "reasoning": "简短的分类理由"
}

注意：
- category 必须是 "science"、"history" 或 "others" 之一
- confidence 是 0-1 之间的数值，表示分类的置信度
- reasoning 用一句话说明分类理由

请对以下学习主题进行分类：${topic}`;

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
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    const content = data.candidates[0].content.parts[0].text;
    console.log('Extracted content:', content);

    try {
      // 清理可能的markdown代码块格式
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanContent) as ClassificationResult;
      
      // 验证结果格式
      if (!result.category || !['science', 'history', 'others'].includes(result.category)) {
        throw new Error('Invalid category in response');
      }
      
      if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
        throw new Error('Invalid confidence score');
      }

      return result;
    } catch (parseError) {
      console.error('Failed to parse classification response:', parseError);
      throw new Error('Failed to parse classification result');
    }

  } catch (error) {
    console.error('Gemini classification API call failed:', error);
    throw error;
  }
} 