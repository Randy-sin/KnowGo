interface LearningStage {
  type: "life_connection" | "observation" | "concept_building";
  question: string;
  followUp: string;
}

interface LearningConfig {
  level: string;
  style: string;
}

export async function generateLearningQuestions(
  topic: string, 
  config?: LearningConfig
): Promise<LearningStage[]> {
  console.log('generateLearningQuestions called with:', { topic, config })
  try {
    const systemPrompt = `<instruction>
你将扮演一位擅长理科知识的中学生引导者。你的核心任务是根据用户提出的中学知识点，设计一套引导性的对话，旨在通过生活化的例子激发用户的学习兴趣，并引导他们逐步深入思考，最终复习和巩固知识点。

请遵循以下步骤完成任务：

1. **识别核心概念**：首先，仔细分析用户提出的核心理科知识点。例如，如果用户问"抛物线"，核心概念就是二次函数的图像及其性质。

2. **构思生活化场景**：围绕这个核心概念，构思一个与中学生日常生活紧密相关、生动有趣的真实世界例子。这个例子应该是激发好奇心的切入点。
   - 对于"抛物线"，可以是投篮球、喷泉的水柱、扔石子。
   - 对于"浮力"，可以是游泳、轮船、热气球。
   - 对于"光合作用"，可以是种植物、树叶为什么是绿色的。

3. **设计三步引导式提问**：你需要创建三个连续且层层递进的问题，来引导用户完成从"生活观察"到"概念建立"再到"深入探究"的思考过程。
   - **问题1：引入与观察**。从你构思的生活化场景出发，提出一个开放性问题，引导用户观察和回忆这个现象。这个问题应该非常直观，不涉及任何专业术语。
   - **问题2：联想与概念**。在问题1的基础上，引导用户将观察到的现象与一个更抽象的规律或概念联系起来。你可以开始引入知识点的核心词汇或其关键特征，促使用户思考现象背后的"是什么"。
   - **问题3：深化与应用**。提出一个更深入的问题，鼓励用户思考该知识点的原理、影响因素、或在不同情境下的应用。这个问题旨在考察用户对知识点的理解深度和迁移能力，即"为什么"和"怎么办"。

4. **格式化输出**：
   - 将你精心设计的三个问题，以一个JSON数组的格式进行输出。
   - 数组中应包含三个字符串，每个字符串对应一个问题。
   - 每个问题都应该是一句简洁明了的话。
   - **非常重要**：最终的输出内容必须是纯粹的JSON格式，不应包含任何解释性文字、代码块标记或任何XML标签。

请确保你的提问方式友好、充满启发性，像一位亲切的学长或老师在与学生轻松地交流。

**示例1：**
用户输入：抛物线是什么？
输出：
["你有没有想过，为什么不论是投篮球还是喷泉的水柱，它们在空中划出的轨迹都是一条漂亮的弧线？", "我们该如何用数学语言精确地描述这条弧线，并给它取一个名字呢？", "你认为是什么因素决定了这条弧线的胖瘦和高低呢？"]

**示例2：**
用户输入：帮我复习一下浮力
输出：
["为什么巨大的钢铁轮船能浮在水面上，而一个小铁钉却会沉入水底呢？", "物体在水中受到的那个向上的托力，也就是浮力，它的大小和什么因素有关呢？", "如果我们把同一艘轮船从海里开到河里，它会上浮一些还是下沉一些，这又是为什么？"]

**示例3：**
用户输入：光合作用是怎么回事
输出：
["你有没有好奇过，为什么我们种的植物只要有阳光和水就能长大，它们吃的食物究竟是什么？", "植物是如何利用阳光，把我们呼出的二氧化碳和喝的水，变成自己生长所需的养料和我们呼吸的氧气的呢？", "如果把一盆绿植长时间放在完全黑暗的房间里，它会发生什么变化，这背后的原理是什么？"]`;

    const userPrompt = `${topic}`;

    console.log('Making request to Kimi API...')
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY || 'sk-b9AUnRcxQ6dVCjiilRE3dppSRJBXM9pMrvAFzzcFNBcmhLmG'}`
      },
      body: JSON.stringify({
        model: 'kimi-k2-0711-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    console.log('Kimi API response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kimi API error response:', errorText)
      throw new Error(`Kimi API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Kimi API response data:', data)
    const content = data.choices[0].message.content;
    console.log('Extracted content:', content)

    // 解析 JSON 响应
    try {
      const questions = JSON.parse(content) as string[];
      
      // 验证格式
      if (!Array.isArray(questions) || questions.length !== 3) {
        throw new Error('Invalid response format');
      }

      // 将字符串数组转换为 LearningStage 对象数组
      const stages: LearningStage[] = [
        {
          type: "life_connection",
          question: questions[0],
          followUp: "想想你的生活经历..."
        },
        {
          type: "observation",
          question: questions[1],
          followUp: "观察现象背后的规律..."
        },
        {
          type: "concept_building",
          question: questions[2],
          followUp: "深入理解核心概念..."
        }
      ];

      return stages;
    } catch (parseError) {
      console.error('Failed to parse Kimi response:', parseError);
      throw new Error('Failed to parse AI response');
    }

  } catch (error) {
    console.error('Kimi API call failed:', error);
    throw error;
  }
}