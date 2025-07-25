import type { QuestionCategory } from './classifier-service'

export interface ScienceContent {
  type: 'science';
  questions: Array<{
    type: "life_connection" | "observation" | "concept_building";
    question: string;
    followUp: string;
  }>;
  gameDesign?: string;
}

export interface HistoryContent {
  type: 'history';
  videoPrompt: string;
  videoDescription: string;
}

export interface GeographyContent {
  type: 'geography';
  questions: Array<{
    type: "life_connection" | "observation" | "concept_building";
    question: string;
    followUp: string;
  }>;
}

export type GeneratedContent = ScienceContent | HistoryContent | GeographyContent;

// 生成理科学习内容
export async function generateScienceContent(topic: string, config?: any): Promise<ScienceContent> {
  // 复用现有的问题生成逻辑
  const questionsResponse = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, config })
  });

  if (!questionsResponse.ok) {
    throw new Error('Failed to generate science questions');
  }

  const questionsData = await questionsResponse.json();

  return {
    type: 'science',
    questions: questionsData.questions
  };
}

// 生成历史学习内容
export async function generateHistoryContent(topic: string): Promise<HistoryContent> {
  const systemPrompt = `你是一位历史教育专家，专门为中学生设计历史学习内容。

请为给定的历史主题生成：
1. 一个详细的视频生成prompt，用于创建教育视频
2. 一个简短的视频描述，说明视频将包含什么内容

输出格式（JSON）：
{
  "videoPrompt": "详细的视频生成描述，包括场景、人物、事件等",
  "videoDescription": "简短的视频内容介绍"
}

要求：
- 内容要适合中学生理解
- 重点突出历史事件的重要性和影响
- 视频prompt要具体、生动、有教育价值`;

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-b9AUnRcxQ6dVCjiilRE3dppSRJBXM9pMrvAFzzcFNBcmhLmG'
    },
    body: JSON.stringify({
      model: 'kimi-k2-0711-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请为历史主题"${topic}"生成学习内容` }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate history content');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const result = JSON.parse(content);
    return {
      type: 'history',
      videoPrompt: result.videoPrompt,
      videoDescription: result.videoDescription
    };
  } catch (parseError) {
    throw new Error('Failed to parse history content');
  }
}

// 生成地理等文科内容
export async function generateGeographyContent(topic: string, config?: any): Promise<GeographyContent> {
  // 使用与理科相似的问题生成逻辑，但针对文科特点调整
  const systemPrompt = `你将扮演一位擅长文科知识的中学生引导者。你的核心任务是根据用户提出的文科知识点，设计一套引导性的对话，旨在通过生活化的例子激发用户的学习兴趣，并引导他们逐步深入思考。

请遵循以下步骤完成任务：

1. **识别核心概念**：首先，仔细分析用户提出的核心文科知识点（地理、语言、社会、艺术等）。

2. **构思生活化场景**：围绕这个核心概念，构思一个与中学生日常生活紧密相关、生动有趣的真实世界例子。

3. **设计三步引导式提问**：创建三个连续且层层递进的问题。
   - **问题1：引入与观察**。从生活化场景出发，引导用户观察和回忆现象。
   - **问题2：联想与概念**。引导用户将现象与抽象概念联系。
   - **问题3：深化与应用**。考察理解深度和应用能力。

4. **格式化输出**：以JSON数组格式输出三个问题字符串。

请确保提问方式友好、充满启发性。`;

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-b9AUnRcxQ6dVCjiilRE3dppSRJBXM9pMrvAFzzcFNBcmhLmG'
    },
    body: JSON.stringify({
      model: 'kimi-k2-0711-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: topic }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate geography content');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const questionsArray = JSON.parse(content) as string[];
    
    if (!Array.isArray(questionsArray) || questionsArray.length !== 3) {
      throw new Error('Invalid geography questions format');
    }

    const questions = [
      {
        type: "life_connection" as const,
        question: questionsArray[0],
        followUp: "想想你的生活经历..."
      },
      {
        type: "observation" as const,
        question: questionsArray[1],
        followUp: "观察现象背后的规律..."
      },
      {
        type: "concept_building" as const,
        question: questionsArray[2],
        followUp: "深入理解核心概念..."
      }
    ];

    return {
      type: 'geography',
      questions
    };
  } catch (parseError) {
    throw new Error('Failed to parse geography content');
  }
}

// 根据分类生成对应内容
export async function generateContentByCategory(
  category: QuestionCategory, 
  topic: string, 
  config?: any
): Promise<GeneratedContent> {
  switch (category) {
    case 'science':
      return generateScienceContent(topic, config);
    case 'history':
      return generateHistoryContent(topic);
    case 'geography':
      return generateGeographyContent(topic, config);
    default:
      throw new Error(`Unsupported category: ${category}`);
  }
} 