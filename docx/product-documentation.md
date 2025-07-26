# Xknow 产品文档

## 📋 概述

Xknow 是一个基于 Next.js 15 构建的**个性化 AI 学习平台**，采用硅谷风格的极简设计。应用引导用户完成完整的学习旅程：**搜索 → 认证 → 配置 → 分类 → 引导学习 → 反馈分析 → 深度学习**，通过 Clerk 提供安全的用户认证和个性化学习体验。

### **核心特色**
- 🌐 **完整国际化支持**：中英文无缝切换，200+ 翻译键值
- 🎮 **AI双阶段游戏生成**：设计师+工程师协作，简洁高效
- 📊 **智能学习跟踪**：Supabase数据库，AI生成摘要
- 🎨 **极简品牌设计**：Logo中心化布局，渐进式交互
- ⚡ **性能优化架构**：并行预生成，混合存储策略

---

## 🗂 文件结构与页面映射

### **核心应用文件**

| 页面/组件 | 文件路径 | 路由 | 描述 |
|---|---|---|---|
| **主页** | `app/page.tsx` | `/` | 带搜索界面和认证状态的主要着陆页 |
| **登录页** | `app/sign-in/[[...sign-in]]/page.tsx` | `/sign-in` | Clerk 认证登录页面 |
| **配置页** | `app/configure/page.tsx` | `/configure` | 学习偏好设置（需认证） |
| **分类页** | `app/classify/page.tsx` | `/classify` | AI智能问题分类（需认证） |
| **引导学习页** | `app/learn/page.tsx` | `/learn` | 三阶段AI引导问题（需认证） |
| **反馈分析页** | `app/feedback/page.tsx` | `/feedback` | 学习反馈与知识检测（需认证） |
| **理科模拟器** | `app/simulate/page.tsx` | `/simulate` | 游戏化学习体验（需认证） |
| **历史学习** | `app/history/page.tsx` | `/history` | 历史主题视频学习（需认证） |
| **地理学习** | `app/geography/page.tsx` | `/geography` | 地理文科学习（需认证） |
| **深度反思页** | `app/reflect/page.tsx` | `/reflect` | 等待期间深度反思（需认证） |
| **个人资料页** | `app/profile/page.tsx` | `/profile` | 学习统计和历史查看（需认证） |
| **学习总结页** | `app/summary/page.tsx` | `/summary` | 学习旅程完成总结（需认证） |
| **根布局** | `app/layout.tsx` | - | Clerk Provider + 国际化 + 全局样式 |
| **中间件** | `middleware.ts` | - | 路由保护和认证控制 |
| **全局样式** | `app/globals.css` | - | 设计系统与样式 |

### **API服务层**

| API端点 | 文件路径 | 功能描述 |
|---|---|---|
| **问题分类** | `app/api/classify-question/route.ts` | AI智能问题分类 |
| **生成问题** | `app/api/generate-questions/route.ts` | 个性化引导问题生成 |
| **分析反馈** | `app/api/analyze-feedback/route.ts` | 学习反馈AI分析 |
| **生成测验** | `app/api/generate-quiz/route.ts` | 动态测验题目生成 |
| **设计游戏** | `app/api/design-game/route.ts` | 游戏概念设计（第一阶段） |
| **生成游戏** | `app/api/generate-game/route.ts` | 游戏代码实现（第二阶段） |
| **深度反思** | `app/api/generate-reflection/route.ts` | 等待期间反思问题生成 |
| **视频生成** | `app/api/generate-video/route.ts` | 历史主题视频内容生成 |
| **视频提示** | `app/api/generate-video-prompt/route.ts` | 视频生成提示词优化 |

### **支持文件**

| 文件 | 路径 | 用途 |
|---|---|---|
| **设计系统** | `docx/design-system.md` | 设计原则和指导方针 |
| **AI集成文档** | `docx/gemini-api-integration.md` | Gemini API集成规范 |
| **工作流架构** | `docx/dify-workflow-architecture.md` | AI工作流设计文档 |
| **UI组件** | `components/ui/` | 可复用的UI组件 |
| **业务逻辑** | `lib/` | AI服务和工具函数 |
| **类型定义** | `types/index.ts` | TypeScript 类型定义 |
| **国际化翻译** | `messages/` | 中英文翻译文件 (200+ 键值) |
| **数据库架构** | `database-schema.sql` | Supabase PostgreSQL 数据表设计 |

---

## 🚀 完整学习流程

### **七步学习旅程**
```
1. 主页搜索 (/) - 无需认证
   ↓ 输入学习主题
   ↓ 后台开始问题分类

2. 用户认证 (/sign-in) - 如果未登录
   ↓ Clerk 登录/注册
   ↓ 会话建立和状态管理

3. 个性化配置 (/configure) - 需要认证
   ↓ 选择知识水平 (beginner/intermediate/expert)
   ↓ 选择学习风格 (12种风格)
   ↓ 后台并行生成：问题 + 游戏

4. 智能分类确认 (/classify) - 需要认证
   ↓ AI分类结果展示
   ↓ 用户确认或调整分类
   ↓ 确定学习路径

5. 引导式学习 (/learn) - 需要认证
   ↓ 生活化引入问题
   ↓ 观察与发现问题  
   ↓ 概念建立问题
   ↓ 用户深度思考和回答

6. 反馈与检测 (/feedback) - 需要认证 **[关键节点]**
   ↓ AI分析用户回答（流式输出）
   ↓ 个性化洞察提取
   ↓ 基于学习内容的知识检测
   ↓ 立即反馈和解析
   ↓ **完成后检查游戏状态**

7A. 游戏已生成 → 深度学习分流 - 需要认证
    ↓ 理科 → /simulate （交互游戏）
    ↓ 历史 → /history （视频内容）
    ↓ 其他 → /geography （系统学习）

7B. 游戏未生成 → 深度思考等待 (/reflect) - 需要认证
    ↓ 个性化反思问题生成
    ↓ 用户深度写作 2-3分钟
    ↓ 游戏生成完成后自动跳转到对应学习页面

8. 学习旅程完成 (/summary) - 需要认证
   ↓ 展示完整学习统计和数据
   ↓ AI生成的学习总结报告
   ↓ 个性化学习建议
   ↓ 历史记录自动保存到个人中心 (/profile)
```

---

## 📱 页面详细说明

### **3. 配置页 (`app/configure/page.tsx`) - 升级版**

**路由：** `/configure` （**需要认证**）

**用途：** 个性化学习体验 + 智能预生成

**核心功能：**
- **个性化配置**：知识水平 + 学习风格选择
- **后台预生成**：问题和游戏并行生成，不阻塞用户
- **数据清理**：每次新流程自动清除旧数据
- **用户信息展示**：显示用户名和当前学习主题

**预生成机制：**
```typescript
// 立即跳转 + 后台生成
router.push('/classify');
generateQuestionsInBackground(config)  // 异步执行
generateGameWithTwoStages(config)      // 异步执行
```

**数据清理策略：**
```typescript
// 确保新学习流程的纯净性
localStorage.removeItem('xknow-pregenerated-game');
localStorage.removeItem('xknow-pregenerated-questions');
```

### **4. 分类页 (`app/classify/page.tsx`) - 新增**

**路由：** `/classify` （**需要认证**）

**用途：** AI智能分类确认 + 用户最终决定

**主要功能：**
- **AI分类展示**：显示后台分类结果和置信度
- **三大学科选择**：理科/历史/其他的详细说明
- **用户最终决定**：可确认AI建议或自主选择
- **学习路径确定**：为后续内容生成提供准确分类

**设计特色：**
- **AI推荐指示器**：显示AI建议的分类
- **置信度展示**：显示分类的准确度百分比
- **分类理由说明**：AI的分类逻辑透明化

### **5. 引导学习页 (`app/learn/page.tsx`) - 重新设计**

**路由：** `/learn` （**需要认证**）

**用途：** 基于教育理念的渐进式AI引导学习

**设计理念：** OpenAI/苹果极简美学，专注于引发思考和知识引入

**三阶段学习流程：**

#### **阶段1：生活化引入 (Life Connection)**
- **目标**：激发用户的生活经验连接
- **示例**：抛物线 → "你观察过篮球的运动轨迹吗？"
- **交互**：用户必须输入思考才能继续

#### **阶段2：观察与发现 (Observation)**  
- **目标**：引导用户观察和思考现象特点
- **示例**：抛物线 → "如果我们追踪这个轨迹，会是什么形状？"
- **深化**：从具体观察转向抽象思考

#### **阶段3：概念建立 (Concept Building)**
- **目标**：自然引出学术概念
- **示例**：抛物线 → "这种曲线在数学和物理中有什么重要性？"
- **完成**：建立完整的概念理解框架

**智能等待机制：**
```typescript
// 先等待后台生成，超时后自己生成
waitForQuestionsOrGenerate() // 3秒轮询 + 实时回退
```

### **6. 反馈分析页 (`app/feedback/page.tsx`) - 流程关键节点**

**路由：** `/feedback` （**需要认证**）

**用途：** 学习反馈AI分析 + 知识检测 + **流程分发中心**

**关键作用：** 
- **学习总结**：对引导学习阶段的完整分析和检测
- **流程分发**：根据游戏生成状态决定下一步路径
- **智能等待**：为游戏生成争取时间的教育价值最大化

**双阶段设计：**

#### **反思阶段**
- **AI流式分析**：实时生成学习反馈和洞察
- **鼓励性语言**：温暖、肯定的反馈方式
- **关键洞察提取**：3个核心学习要点

#### **检测阶段**  
- **智能题目生成**：基于用户学习内容和回答
- **即时检测**：四选一选择题 + 详细解析
- **个性化出题**：题目与引导问题高度相关

#### **流程分发逻辑** 🆕
```typescript
// feedback完成后的智能分发
if (游戏已生成) {
  → 直接跳转到对应学习页面 (/simulate, /history, /geography)
} else {
  → 跳转到深度思考页面 (/reflect)
  → 用户写作反思 2-3分钟
  → 游戏生成完成后跳转到学习页面
}
```

**流式体验：**
```typescript
// Server-Sent Events 实时更新
type: 'start' | 'progress' | 'content' | 'complete'
// 用户看到AI思考和生成过程
```

### **7. 理科模拟器 (`app/simulate/page.tsx`) - 大升级**

**路由：** `/simulate` （**需要认证**）

**用途：** 游戏化学习 + 深度反思等待机制

## 🎮 游戏设计与生成系统

### **两阶段简化设计理念** 🎯

AdventureX采用**简洁高效**的两阶段游戏设计模式：

#### **第一阶段：游戏设计师 (简洁创意)**
- **设计原则**：简单直观、核心聚焦、易于实现
- **常用模式**：参数探索、匹配连线、模拟实验、问答闯关
- **输出内容**：游戏名称、核心玩法、胜利条件、教育价值
- **⚠️ 反馈机制要求**：
  - 明确的成功标准（误差范围、正确率等）
  - 失败提示和重试机制
  - 即时反馈和进度引导
  - 成功后的下一步操作

#### **第二阶段：代码工程师 (高效实现)**
- **实现原则**：简洁实现、完整功能、全屏设计、无外部依赖
- **核心功能**：交互界面、胜利判定、重试机制、庆祝效果
- **技术标准**：HTML5单文件、内联CSS/JS、硅谷极简设计
- **🎯 必须实现的反馈机制**：
  - 成功判定逻辑（精确的数值检查、条件判断）
  - 成功反馈（绿色提示、庆祝效果、下一轮按钮）
  - 失败提示（红色提示、具体错误原因、重试按钮）
  - 操作引导（提交答案、检查结果等按钮）

### **反馈机制标准** 🎯
每个游戏必须包含以下四个关键元素：

1. **成功判定**：具体的数值标准或条件
2. **失败处理**：明确的错误提示和重试机制
3. **即时反馈**：用户操作后的立即响应
4. **进度引导**：清晰的下一步操作提示

### **设计优势**
1. **降低复杂度**：避免过于复杂的游戏机制，确保代码工程师能够轻松实现
2. **提高成功率**：简化的设计要求减少了生成失败的可能性
3. **保持质量**：在简洁的基础上仍然保证教育价值和用户体验
4. **快速迭代**：简洁的提示词让AI能够更快生成高质量的游戏
5. **完整体验**：强化的反馈机制确保用户有清晰的游戏目标和进度感知

### **技术架构**
```
用户主题 → 游戏设计师LLM → 简洁设计方案 → 代码工程师LLM → 完整HTML5游戏
              ↓                    ↓                      ↓
        包含反馈机制要求      传递反馈标准        实现完整反馈系统
```

这种简化设计确保了**既有创意又易实现，既简洁又功能完整**的游戏生成体验！

**反思功能特色：**
- **个性化问题**：基于学习主题、学科、用户水平
- **深度引导**：促进知识整合和个人化理解  
- **极简UI**：灰度设计 + 淡蓝色点缀
- **教育价值**：让等待时间变成学习时间

**反思问题API：**
```typescript
POST /api/generate-reflection
{
  "topic": "Machine Learning",
  "category": "science",
  "userLevel": "intermediate"
}
```

**三种界面状态：**
1. **反思写作**：深度思考问题 + 大型文本区域
2. **生成完成**：游戏立即显示
3. **超时处理**：友好提示 + 继续等待选项

### **8. 历史学习 (`app/history/page.tsx`)**

**路由：** `/history` （**需要认证**）

**用途：** 历史主题的视频化学习体验

**主要功能：**
- **视频教学区域**：沉浸式历史内容
- **时间脉络梳理**：按时间顺序的事件展示
- **核心概念提取**：历史背景和重要意义

### **9. 地理学习 (`app/geography/page.tsx`)**

**路由：** `/geography` （**需要认证**）

**用途：** 文科主题的系统性学习

**学习模块：**
- **地理空间**：位置、地形、气候理解
- **社会文化**：人文、社会、文化背景
- **综合分析**：批判性思维培养

---

## 🌍 国际化架构

### **完整的中英文支持系统**

#### **翻译系统实现**
- **框架集成**：基于 `next-intl` 的国际化解决方案
- **翻译文件**：`messages/zh.json` 和 `messages/en.json`
- **键值覆盖**：200+ 翻译键值，涵盖所有功能模块
- **动态切换**：实时语言切换，无需页面刷新

#### **支持的页面**
```typescript
✅ 主页 (app/page.tsx) - 25+ 键值
✅ 配置页 (app/configure/page.tsx) - 30+ 键值  
✅ 分类页 (app/classify/page.tsx) - 15+ 键值
✅ 学习页 (app/learn/page.tsx) - 20+ 键值
✅ 反馈页 (app/feedback/page.tsx) - 25+ 键值
✅ 模拟器页 (app/simulate/page.tsx) - 20+ 键值
✅ 反思页 (app/reflect/page.tsx) - 15+ 键值
✅ 个人资料页 (app/profile/page.tsx) - 35+ 键值
✅ 登录页 (app/sign-in/[[...sign-in]]/page.tsx) - 10+ 键值
✅ 总结页 (app/summary/page.tsx) - 22+ 键值
```

#### **翻译键值结构**
```typescript
{
  "common": "通用组件文本",
  "home": "主页内容", 
  "configure": "配置页面",
  "learn": "学习流程",
  "classify": "分类确认",
  "feedback": "反馈分析",
  "simulate": "模拟器游戏",
  "reflect": "深度反思",
  "profile": "个人中心",
  "signin": "登录认证",
  "summary": "学习总结"
}
```

#### **语言切换机制**
```typescript
// 语言状态管理
const { language, setLanguage, toggleLanguage } = useLanguage()

// 持久化存储
localStorage.setItem('xknow-language', lang)

// 实时切换
document.documentElement.lang = lang
```

---

## 🏠 主页设计架构

### **品牌Logo布局系统**

#### **Logo展示策略**
- **位置**：页面中心，绝对定位背景层
- **尺寸**：192px高度，完全不透明
- **替代关系**：完全替代原"Xknow"文字标题
- **响应式**：支持明暗主题切换

#### **渐进式滚动交互**
```typescript
// 两阶段滚动机制
Stage 0: 初始状态 - 主要内容展示
Stage 1: 第一次滚动 - 锁定并显示前6个历史记录
Stage 2: 第二次滚动 - 解锁并显示所有内容
```

#### **智能历史记录系统**
- **数据来源**：Supabase数据库实时查询
- **智能摘要**：AI生成的个性化学习概述
- **状态管理**：三种显示状态（未登录/空状态/有数据）
- **布局优化**：响应式网格，错开动画效果

### **历史记录卡片设计**
```typescript
interface HistoryItem {
  id: string           // 唯一标识
  title: string        // 学习主题
  excerpt: string      // AI智能摘要
  category: string     // 学科分类（国际化）
  readTime: string     // 学习时长或"--"
  timestamp: string    // 相对时间
  status: string       // 完成状态
}
```

---

## 📊 数据架构

### **Supabase数据库设计**

#### **核心数据表**
```sql
learning_sessions       -- 学习会话主表
learning_interactions   -- 学习交互记录
quiz_records           -- 知识检测记录
reflection_records     -- 深度反思记录
game_sessions          -- 游戏学习记录
video_sessions         -- 视频学习记录
user_stats            -- 用户统计数据
```

#### **智能摘要生成**
```typescript
// 基于学习数据的AI摘要算法
static generateSessionSummary(session, interactions, quizRecords) {
  if (status === 'completed' && interactions.length > 0) {
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100)
    return `通过${stageCount}个阶段深度探索了"${topic}"，完成${level}难度的${category}学习，测验正确率${accuracy}%`
  }
  // 其他状态的智能描述逻辑...
}
```

### **混合存储策略**
```typescript
// 客户端状态管理
localStorage 键值:
'xknow-query'                    // 用户查询主题
'xknow-classification'           // AI分类结果
'xknow-category'                 // 用户确认的分类
'xknow-config'                   // 学习配置
'xknow-session-id'               // 当前会话ID
'xknow-language'                 // 用户语言偏好

// 数据库持久化
- 完整的学习会话记录
- 用户交互详情
- 测验和反思数据
- 学习统计和进度跟踪
```

---

## 🤖 AI集成架构

### **多模型协作设计**

#### **问题生成流水线**
```
分类器 → 学科专门问题生成器 → 个性化适配
science: generateScienceQuestions()
history: generateHistoryQuestions()  
others: generateOthersQuestions()
```

#### **游戏生成两阶段**
```
第一阶段：游戏设计师 (design-game)
  ↓ 概念设计、机制设计、教育价值
第二阶段：代码工程师 (generate-game)  
  ↓ 基于设计实现完整HTML5游戏
```

#### **反馈分析系统**
```
用户回答 → AI流式分析 → 鼓励性反馈 + 关键洞察
```

#### **深度反思生成**
```
主题 + 学科 + 用户水平 → 个性化反思问题
```

### **流式响应标准化**
```typescript
// 统一的事件类型
type: 'start' | 'progress' | 'content' | 'complete' | 'error'
// Server-Sent Events 实现
Content-Type: text/event-stream
```

---

## 📊 数据流管理

### **localStorage 数据策略**
```typescript
'xknow-query'                    // 用户查询主题
'xknow-classification'           // AI分类结果
'xknow-category'                 // 用户确认的分类
'xknow-config'                   // 学习配置
'xknow-pregenerated-questions'   // 预生成问题
'xknow-pregenerated-game'        // 预生成游戏
'xknow-responses'                // 用户学习回答
'xknow-analyses'                 // AI分析结果
'xknow-quiz'                     // 检测题目
```

### **数据清理机制**
```typescript
// 新学习流程开始时清理
localStorage.removeItem('xknow-pregenerated-game');
localStorage.removeItem('xknow-pregenerated-questions');

// 游戏加载完成后清理反思数据
setReflectionData(null);
setReflectionText("");
```

---

## 🎨 设计系统升级

### **新增组件样式**
```css
/* 反思写作区域 */
.reflection-textarea: 大型无边框输入区域
.reflection-hint: 淡蓝色提示框设计

/* 等待状态动画 */
.animate-gentle-glow: 优雅的脉动效果
.animate-soft-pulse: 微妙的呼吸动画

/* 流式内容显示 */
.streaming-content: 实时内容更新样式
```

### **颜色系统扩展**
```css
/* 保持极简，新增教育元素 */
blue-50, blue-600: 反思和学习元素
amber-400, amber-50: 等待和处理状态
```

---

## ⚡ 性能优化策略

### **并行处理架构**
```typescript
// configure页面同时执行
generateQuestionsInBackground()  // 问题预生成
generateGameWithTwoStages()      // 游戏预生成
// 用户在其他页面时，后台已准备就绪
```

### **智能等待机制**
```typescript
// learn页面
3秒轮询 + 超时实时生成  // 最佳+回退策略

// simulate页面  
2分钟等待 + 反思填充  // 教育价值最大化
```

### **错误处理优雅降级**
- **API失败**：使用默认内容而非空白
- **数据损坏**：自动清理并重新生成
- **超时处理**：友好提示而非错误页面

---

## 🔮 教育价值实现

### **个性化学习路径**
1. **主题输入** → AI智能分类确认
2. **配置偏好** → 后台并行预生成  
3. **引导学习** → 三阶段渐进式思考
4. **反馈分析** → 流式AI分析 + 知识检测
5. **深度学习** → 游戏化体验 + 反思等待

### **核心教育理念**
- ✅ **时间无浪费**：等待期间的深度反思
- ✅ **个性化引导**：基于用户水平的适配内容
- ✅ **知识整合**：从零散问答到系统理解
- ✅ **学习闭环**：学习 → 反馈 → 检测 → 深化

### **创新突破点**
- **反思等待机制**：业界首创的教育价值等待设计
- **两阶段游戏生成**：设计师+工程师的AI协作
- **流式学习体验**：实时AI思考过程可视化
- **智能数据管理**：预生成+清理的优雅策略

---

## 📈 技术架构总结

### **前端架构**
- **Next.js 15 App Router**：现代化路由和渲染系统
- **TypeScript 全覆盖**：100%类型安全，完整的类型定义
- **Framer Motion 12**：流畅的页面过渡和微交互动画
- **国际化系统**：完整的中英文支持，200+ 翻译键值
- **极简设计系统**：硅谷风格的CSS变量系统和组件库
- **响应式布局**：渐进式滚动交互和自适应网格

### **AI集成架构**  
- **Gemini 2.0-flash**：9个专业化API端点
- **流式响应**：Server-Sent Events实时体验
- **智能提示词**：分学科、分水平的精准工程
- **两阶段游戏生成**：设计师+工程师AI协作模式
- **智能摘要生成**：基于学习数据的个性化描述
- **错误恢复**：多层降级和重试机制

### **数据架构**
- **Supabase PostgreSQL**：7张核心数据表，完整的学习记录
- **混合存储策略**：localStorage + 数据库的智能组合
- **行级安全**：基于Clerk的用户数据隔离
- **智能统计**：学习时长、准确率、连续学习等指标
- **Clerk认证**：完整的用户会话和权限管理
- **预生成策略**：并行处理优化用户体验
- **数据清理**：智能清理确保学习流程纯净性

### **用户体验架构**
- **品牌一致性**：Logo中心化布局，替代文字标题
- **历史记录系统**：智能摘要+实时查询的学习追踪
- **渐进式交互**：两阶段滚动，错开动画时序
- **状态管理优化**：简化显示，去除冗余状态信息

---

**Xknow 代表了AI教育产品的新标准：技术先进、体验优雅、教育有效。**

*最后更新：2024年12月*  
*版本：4.0.0 - 完整国际化支持、品牌Logo中心化、智能历史记录系统、数据库架构优化* 