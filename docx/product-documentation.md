# Xknow 产品文档

## 📋 概述

Xknow 是一个基于 Next.js 15 构建的个性化 AI 学习平台，采用硅谷风格的极简设计。应用引导用户完成完整的学习旅程：**搜索 → 认证 → 配置 → 分类 → 引导学习 → 反馈分析 → 深度学习**，通过 Clerk 提供安全的用户认证和个性化学习体验。

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
| **根布局** | `app/layout.tsx` | - | Clerk Provider + 全局样式 |
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

### **支持文件**

| 文件 | 路径 | 用途 |
|---|---|---|
| **设计系统** | `docx/design-system.md` | 设计原则和指导方针 |
| **AI集成文档** | `docx/gemini-api-integration.md` | Gemini API集成规范 |
| **工作流架构** | `docx/dify-workflow-architecture.md` | AI工作流设计文档 |
| **UI组件** | `components/ui/` | 可复用的UI组件 |
| **业务逻辑** | `lib/` | AI服务和工具函数 |
| **类型定义** | `types/index.ts` | TypeScript 类型定义 |

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

#### **🎮 核心游戏功能**
- **两阶段AI生成**：游戏设计 + 代码实现
- **HTML5游戏**：完整的交互式学习游戏
- **全屏支持**：沉浸式学习体验
- **实时参数调节**：通过操作理解概念

#### **⏳ 革命性等待体验**
**问题：** 游戏生成需要时间，用户可能看到旧游戏

**解决方案：** 深度反思等待机制

**流程设计：**
```
检测游戏未生成 → 生成个性化反思问题 → 
用户深度写作 2-3分钟 → 游戏生成完成 → 
平滑过渡到游戏界面
```

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
- **Next.js 15 App Router**：现代化路由和渲染
- **TypeScript 全覆盖**：100%类型安全
- **Framer Motion**：流畅的页面和状态过渡
- **极简设计系统**：硅谷风格的一致性体验

### **AI集成架构**  
- **Gemini 2.0-flash**：7个专业化API端点
- **流式响应**：Server-Sent Events实时体验
- **智能提示词**：分学科、分水平的精准工程
- **错误恢复**：多层降级和重试机制

### **数据架构**
- **localStorage**：客户端状态持久化
- **Clerk认证**：用户会话和权限管理
- **预生成策略**：并行处理优化用户体验
- **数据清理**：智能清理确保内容匹配

---

**Xknow 代表了AI教育产品的新标准：技术先进、体验优雅、教育有效。**

*最后更新：2024年12月*  
*版本：3.0.0 - 新增深度反思等待机制、完整反馈分析流程* 