interface LearningStage {
  type: "life_connection" | "observation" | "concept_building";
  question: string;
  followUp: string;
}

interface LearningConfig {
  level: string;
  style: string;
}

// 理科引导问题生成
export async function generateScienceQuestions(
  topic: string, 
  config?: LearningConfig
): Promise<LearningStage[]> {
  console.log('generateScienceQuestions called with:', { topic, config })
  
  const systemPrompt = `你将扮演一位擅长理科知识的中学生引导者。你的核心任务是根据用户提出的中学知识点，设计一套引导性的对话，旨在通过生活化的例子激发用户的学习兴趣，并引导他们逐步深入思考，最终复习和巩固知识点。

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

  return await generateQuestionsWithGemini(systemPrompt, topic, 'science')
}

// 历史引导问题生成
export async function generateHistoryQuestions(topic: string, config?: LearningConfig): Promise<LearningStage[]> {
  console.log('generateHistoryQuestions called with:', { topic, config })
  
  const systemPrompt = `你将扮演一位擅长历史知识的中学生引导者。你的核心任务是根据用户提出的历史主题，设计一套引导性的对话，旨在通过生活化的例子激发用户的学习兴趣，并引导他们逐步深入思考历史问题，最终理解历史的深层脉络和意义。

请遵循以下步骤完成任务：

1. **识别核心历史概念**：首先，仔细分析用户提出的历史主题。例如，如果用户问"丝绸之路"，核心概念就是古代东西方贸易路线及其文化交流意义。

2. **构思生活化场景**：围绕这个历史概念，构思与现代生活相关的例子或现象，帮助学生理解历史与现在的联系。这个例子应该是激发好奇心的切入点。
   - 对于"丝绸之路"，可以是现在的网购全球化、一带一路倡议、中外文化交流。
   - 对于"工业革命"，可以是现在的自动化工厂、城市发展、环境问题。
   - 对于"文艺复兴"，可以是现代艺术创新、科学发展、人文精神。

3. **设计三步引导式提问**：你需要创建三个连续且层层递进的问题，来引导用户完成从"现代联系"到"历史理解"再到"深度思考"的思考过程。
   - **问题1：生活联系**。从现代生活或熟悉经验出发，提出一个开放性问题，引导用户思考历史与现在的联系。这个问题应该让学生感到历史并不遥远。
   - **问题2：历史观察**。在问题1的基础上，引导用户将现代现象与历史事件联系起来，开始引入历史的核心概念和关键特征，促使用户思考"历史是怎样的"。
   - **问题3：深度理解**。提出一个更深入的问题，鼓励用户思考历史事件的深层原因、影响和意义，以及对后世的启发。这个问题旨在考察用户对历史的理解深度和反思能力。

4. **格式化输出**：
   - 将你精心设计的三个问题，以一个JSON数组的格式进行输出。
   - 数组中应包含三个字符串，每个字符串对应一个问题。
   - 每个问题都应该是一句简洁明了的话。
   - **非常重要**：最终的输出内容必须是纯粹的JSON格式，不应包含任何解释性文字、代码块标记或任何XML标签。

请确保你的提问方式友好、充满启发性，像一位亲切的学长或老师在与学生轻松地交流。

**示例1：**
用户输入：古代丝绸之路
输出：
["你有没有想过，为什么现在我们能在网上买到世界各地的商品，而在古代没有飞机轮船的时候，中国的丝绸是如何传到遥远的欧洲的？", "这条连接东西方的古代贸易通道被称为丝绸之路，你知道除了丝绸之外，还有哪些商品和文化在这条路上传播交流？", "丝绸之路不仅仅是一条贸易路线，更是文明交流的桥梁，你认为这种跨文化的交流对古代各国的发展产生了什么深远影响？"]

**示例2：**
用户输入：工业革命
输出：
["当你看到现代化的工厂里机器人自动生产汽车，你有没有想过人类历史上第一次用机器大规模生产是什么时候开始的？", "18世纪的英国发生了一场彻底改变人类生产方式的工业革命，你觉得是什么发明和条件推动了这场变革的发生？", "工业革命在带来巨大生产力进步的同时，也改变了人们的生活方式，甚至产生了一些社会问题，你认为我们今天应该如何看待技术进步与社会发展的关系？"]

**示例3：**
用户输入：文艺复兴
输出：
["你有没有注意到，现在有很多艺术家、科学家都在追求创新和突破，这种对知识和美的追求让你想到历史上哪个充满创造力的时代？", "14-16世纪的欧洲文艺复兴时期，出现了达芬奇、米开朗基罗这样的天才，你知道是什么社会条件和思想变化促成了这个人才辈出的时代吗？", "文艺复兴不仅复兴了古典文化，更重要的是确立了人文主义精神，你认为这种'以人为本'的思想对现代社会产生了什么深远影响？"]`;

  return await generateQuestionsWithGemini(systemPrompt, topic, 'history')
}

// 文科引导问题生成
export async function generateOthersQuestions(topic: string, config?: LearningConfig): Promise<LearningStage[]> {
  console.log('generateOthersQuestions called with:', { topic, config })
  
  const systemPrompt = `你将扮演一位擅长文科知识的中学生引导者。你的核心任务是根据用户提出的文科知识点，设计一套引导性的对话，旨在通过生活化的例子激发用户的学习兴趣，并引导他们逐步深入思考，最终掌握和应用文科知识。

请遵循以下步骤完成任务：

1. **识别核心概念**：首先，仔细分析用户提出的核心文科知识点（地理、语言、社会、艺术等）。例如，如果用户问"季风气候"，核心概念就是季风的形成机制及其对气候的影响。

2. **构思生活化场景**：围绕这个核心概念，构思一个与中学生日常生活紧密相关、生动有趣的真实世界例子。这个例子应该是激发好奇心的切入点。
   - 对于"季风气候"，可以是夏天的雷雨、梅雨季节、台风天气。
   - 对于"城市化"，可以是家乡的变化、交通拥堵、高楼大厦。
   - 对于"语言变迁"，可以是网络用语、方言差异、古诗词用字。

3. **设计三步引导式提问**：你需要创建三个连续且层层递进的问题，来引导用户完成从"生活观察"到"概念理解"再到"应用分析"的思考过程。
   - **问题1：引入与观察**。从你构思的生活化场景出发，提出一个开放性问题，引导用户观察和回忆身边的现象。这个问题应该非常直观，贴近生活经验。
   - **问题2：联想与概念**。在问题1的基础上，引导用户将观察到的现象与更广泛的规律或概念联系起来。你可以开始引入知识点的核心词汇，促使用户思考现象背后的"是什么"和"为什么"。
   - **问题3：深化与应用**。提出一个更深入的问题，鼓励用户思考该知识点在不同地区、不同时代、或不同情境下的表现和应用。这个问题旨在考察用户对知识点的理解深度和分析能力。

4. **格式化输出**：
   - 将你精心设计的三个问题，以一个JSON数组的格式进行输出。
   - 数组中应包含三个字符串，每个字符串对应一个问题。
   - 每个问题都应该是一句简洁明了的话。
   - **非常重要**：最终的输出内容必须是纯粹的JSON格式，不应包含任何解释性文字、代码块标记或任何XML标签。

请确保你的提问方式友好、充满启发性，像一位亲切的学长或老师在与学生轻松地交流。

**示例1：**
用户输入：季风气候
输出：
["你有没有注意到，为什么夏天总是又热又湿，经常下大雨，而冬天却比较干燥少雨？", "这种季节性的降水和风向变化，我们称之为季风气候，你知道是什么原因造成了这种规律性的变化吗？", "为什么中国南方和北方的季风特点不太一样，这对当地的农业和生活方式产生了什么影响？"]

**示例2：**
用户输入：城市化进程
输出：
["回想一下你家乡这些年的变化，是不是高楼越来越多，人口越来越密集，交通也越来越繁忙？", "这种农村人口向城市集中、城市规模不断扩大的过程，我们称为城市化，你觉得推动这个过程的主要原因是什么？", "城市化在带来便利和机遇的同时，也产生了哪些问题，我们应该如何平衡发展与环境保护？"]

**示例3：**
用户输入：汉语言文字的演变
输出：
["你有没有发现，现在网上聊天时大家经常用'yyds'、'绝绝子'这样的词，而你的爷爷奶奶可能完全听不懂？", "语言文字总是在不断变化发展的，从甲骨文到现代汉字，从古诗词到现代白话文，你觉得是什么因素推动了这些变化？", "在全球化的今天，汉语中出现了很多外来词汇，同时汉语也在影响其他语言，你认为语言的这种交流融合会带来什么样的结果？"]`;

  return await generateQuestionsWithGemini(systemPrompt, topic, 'others')
}

// 使用Gemini API生成问题的通用函数
async function generateQuestionsWithGemini(
  systemPrompt: string, 
  topic: string, 
  category: string
): Promise<LearningStage[]> {
  try {
    console.log(`Generating ${category} questions with Gemini for topic:`, topic)
    
    const prompt = `${systemPrompt}\n\n用户输入：${topic}`
    
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

    console.log(`Gemini API response status for ${category}:`, response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error response for ${category}:`, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`Gemini API response data for ${category}:`, data)
    const content = data.candidates[0].content.parts[0].text
    console.log(`Extracted content for ${category}:`, content)

    // 清理可能的markdown代码块格式
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // 解析 JSON 响应
    try {
      const questions = JSON.parse(cleanContent) as string[]
      
      // 验证格式
      if (!Array.isArray(questions) || questions.length !== 3) {
        throw new Error('Invalid response format: expected array of 3 strings')
      }

      // 统一转换为 LearningStage 对象数组
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
      ]

      console.log(`Successfully generated ${category} questions:`, stages)
      return stages

    } catch (parseError) {
      console.error(`Failed to parse ${category} response:`, parseError)
      console.error(`Raw content:`, cleanContent)
      throw new Error(`Failed to parse AI response for ${category}`)
    }

  } catch (error) {
    console.error(`Gemini ${category} API call failed:`, error)
    throw error
  }
} 