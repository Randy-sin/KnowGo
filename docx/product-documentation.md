# Xknow 产品文档

## 📋 概述

Xknow 是一个基于 Next.js 15 构建的个性化 AI 学习平台，采用硅谷风格的极简设计。应用引导用户完成完整的学习旅程：**搜索 → 认证 → 配置 → 引导问题 → 互动模拟器**，通过 Clerk 提供安全的用户认证和个性化学习体验。

---

## 🗂 文件结构与页面映射

### **核心应用文件**

| 页面/组件 | 文件路径 | 路由 | 描述 |
|---|---|---|---|
| **主页** | `app/page.tsx` | `/` | 带搜索界面和认证状态的主要着陆页 |
| **登录页** | `app/sign-in/[[...sign-in]]/page.tsx` | `/sign-in` | Clerk 认证登录页面 |
| **配置页** | `app/configure/page.tsx` | `/configure` | 学习偏好设置（需认证） |
| **引导学习页** | `app/learn/page.tsx` | `/learn` | 三阶段AI引导问题（需认证） |
| **互动模拟器** | `app/simulate/page.tsx` | `/simulate` | 游戏化学习体验（需认证） |
| **根布局** | `app/layout.tsx` | - | Clerk Provider + 全局样式 |
| **中间件** | `middleware.ts` | - | 路由保护和认证控制 |
| **全局样式** | `app/globals.css` | - | 设计系统与样式 |

### **支持文件**

| 文件 | 路径 | 用途 |
|---|---|---|
| **设计系统** | `docx/design-system.md` | 设计原则和指导方针 |
| **UI组件** | `components/ui/` | 可复用的UI组件 |
| **工具函数** | `lib/utils.ts` | 辅助函数 |
| **类型定义** | `types/index.ts` | TypeScript 类型定义 |
| **忽略配置** | `.cursorignore` / `.cursorindexingignore` | Cursor AI功能优化 |

---

## 🚀 页面详情

### **0. 认证系统概述**

**Clerk 集成：** 完整的用户认证解决方案

**核心特性：**
- **无缝登录体验**：社交登录 + 邮箱注册
- **会话管理**：自动处理登录状态和会话刷新
- **路由保护**：中间件级别的页面访问控制
- **用户信息**：firstName、email 等个人信息获取

**认证流程：**
1. 未登录用户访问受保护页面自动跳转到 `/sign-in`
2. 登录成功后返回原始目标页面
3. 已登录用户在右上角显示用户头像和信息

---

### **1. 主页 (`app/page.tsx`)**

**路由：** `/` （无需认证）

**用途：** 用户查询的入口点 + 认证状态展示

**主要功能：**
- 极简搜索界面
- 快速建议按钮
- **认证状态显示**：右上角登录按钮或用户头像
- **智能跳转**：已登录用户直接到配置页，未登录用户先到登录页
- 硅谷风格设计

**认证集成：**
```typescript
// Clerk Hooks 集成
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

// 认证状态渲染
<SignedOut>
  <Link href="/sign-in">
    <button className="btn-ghost-minimal">Sign in</button>
  </Link>
</SignedOut>
<SignedIn>
  <UserButton appearance={{...}} />
</SignedIn>
```

**用户流程：**
1. 用户输入学习查询
2. 点击提交检查登录状态
3. **已登录**：直接到配置页面
4. **未登录**：跳转到登录页面

---

### **2. 登录页 (`app/sign-in/[[...sign-in]]/page.tsx`)**

**路由：** `/sign-in/*` （Clerk 动态路由）

**用途：** 用户认证入口，集成 Clerk 登录组件

**主要功能：**
- **Clerk SignIn 组件**：完整的登录/注册表单
- **品牌一致性**：与 Xknow 设计系统保持一致
- **返回导航**：可返回主页的清晰导航
- **自动重定向**：登录成功后返回原始页面

**设计特色：**
```typescript
// Clerk 外观自定义
appearance={{
  variables: {
    colorPrimary: "#000000",
    colorBackground: "#ffffff",
    borderRadius: "12px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
  },
  elements: {
    card: "shadow-none border border-gray-200 rounded-2xl bg-white p-8",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    formFieldInput: "border border-gray-200 rounded-xl px-4 py-3",
    formButtonPrimary: "bg-black text-white rounded-xl py-3 px-6 hover:bg-gray-800"
  }
}}
```

**认证特性：**
- **多种登录方式**：邮箱/密码、社交登录（GitHub、Google 等）
- **注册功能**：新用户可直接创建账户
- **密码重置**：忘记密码自助重置
- **会话持久化**：记住登录状态，减少重复登录

**用户体验：**
1. 极简的 Xknow 品牌展示
2. 清晰的登录/注册选项
3. 即时错误反馈和验证
4. 登录成功后平滑跳转

---

### **3. 配置页 (`app/configure/page.tsx`)**

**路由：** `/configure` （**需要认证**）

**用途：** 个性化学习体验 + 用户信息展示

**主要功能：**
- 知识水平选择（初学者/中级/专家）
- 学习风格选择（12种不同风格）
- **个性化欢迎**：显示用户名称和当前主题
- **认证状态检查**：未登录自动重定向到登录页
- 带返回按钮的极简导航
- 实时进度指示器

**认证集成：**
```typescript
// Clerk 认证检查
const { isLoaded, isSignedIn, user } = useUser()

// 未登录重定向
if (isLoaded && !isSignedIn) {
  return <RedirectToSignIn />
}

// 用户信息展示
<div className="text-xs text-gray-500">
  Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
</div>
```

**用户流程：**
1. **认证检查**：确认用户已登录
2. **个性化展示**：显示用户名和学习主题
3. 选择知识水平
4. 选择学习风格
5. 进入引导学习页面

**可选学习风格：**
- 课堂式、讲故事、对话式、导师式
- 深度式、快速式、诗意式、轻松式
- 案例式、孔子式、叙述式、爱因斯坦式

---

### **4. 引导学习页 (`app/learn/page.tsx`) - 全新设计**

**路由：** `/learn` （**需要认证**）

**用途：** 基于README教育理念的渐进式AI引导学习

**设计理念：** 完全重新设计为OpenAI/苹果极简美学，专注于引发思考和知识引入

**核心特色：**
- **三阶段渐进式引导**：生活化引入 → 观察与发现 → 概念建立
- **垂直居中布局**：大量留白，营造呼吸感和专注力
- **纯灰度配色**：无任何鲜艳色彩，保持专业感
- **智能问题生成**：根据不同主题生成个性化引导问题

**三阶段学习流程：**

#### **阶段1：生活化引入 (Life Connection)**
- **目标**：激发用户的生活经验连接
- **示例**：抛物线 → "Have you ever watched a basketball shot? What did you notice about the ball's path?"
- **交互**：用户必须输入思考才能继续，确保主动参与

#### **阶段2：观察与发现 (Observation)**
- **目标**：引导用户观察和思考现象特点
- **示例**：抛物线 → "If we could trace that path, what shape would we see? How is it different from a straight line or circle?"
- **深化**：从具体观察转向抽象思考

#### **阶段3：概念建立 (Concept Building)**
- **目标**：自然引出学术概念
- **示例**：抛物线 → "This special curve has a name and mathematical properties. What do you think makes it so important in physics and math?"
- **完成**：建立完整的概念理解框架

**技术实现亮点：**
```typescript
- AnimatePresence 实现平滑阶段切换
- 渐进式动画时序：0.8s → 1.5s → 1.8s → 2.0s
- 智能问题匹配系统
- 用户回答历史追踪
- 无边框输入设计配合底部细线
- 微妙的hover/tap交互反馈
```

**多主题支持：**
- **抛物线/Parabola**：篮球投射相关问题
- **机器学习**：推荐系统相关问题
- **React**：网页交互相关问题
- **通用模板**：自动生成适配问题

---

### **5. 互动模拟器 (`app/simulate/page.tsx`) - 游戏化学习**

**路由：** `/simulate` （**需要认证**）

**用途：** 基于README"互动式模拟器"理念的游戏化学习体验

**设计理念：** 实现"投不中？这不是你的问题，而是抛物线的方程没调对"的教育理念

**核心功能：**
- **二次函数探索器**：y = ax² + bx + c 参数实时调节
- **Canvas实时渲染**：平滑的抛物线动画和轨迹追踪
- **智能AI教练**：基于表现的个性化提示系统
- **统计追踪**：尝试次数、命中率、准确度分析

**左右分栏布局：**
- **左侧**：800x500 Canvas可视化区域
- **右侧**：参数控制面板 + AI提示系统

**参数控制系统：**
```typescript
// 三个核心参数
- a (曲率): -0.05 ~ 0.05，控制开口方向和陡峭程度
- b (倾斜): -2 ~ 2，控制线性分量和倾斜度  
- c (高度): 0 ~ 150，控制y轴截距和起始高度

// 实时方程显示
y = {a.toFixed(3)}x² + {b.toFixed(2)}x + {c.toFixed(0)}
```

**AI教练系统：**
```typescript
// 自适应提示算法
const getCurrentHint = () => {
  const hintIndex = Math.min(attempts - hits - 1, failureHints.length - 1)
  return failureHints[Math.max(0, hintIndex)]
}

// 渐进式提示内容
failureHints: [
  "Try making 'a' more negative to create a steeper curve downward.",
  "Adjust 'b' to change the tilt and direction of the parabola.",
  "The parameter 'c' controls where your parabola starts vertically."
]
```

**可视化特色：**
- **实时轨迹绘制**：requestAnimationFrame 平滑动画
- **坐标参考系统**：虚线网格辅助理解
- **物理模拟**：真实的二次函数计算
- **目标挑战**：命中特定区域获得成就感

**多主题适配能力：**
- **抛物线**：二次函数参数调节器
- **机器学习**：推荐引擎可视化（预留）
- **React**：组件交互模拟器（预留）
- **通用框架**：支持扩展到任意学科

**技术亮点：**
```typescript
- Canvas 2D渲染引擎
- 物理计算算法
- 防御性编程（错误处理）
- 响应式设计
- 自定义滑块样式
- 状态管理优化
```

---

## 🔄 完整用户旅程 (含认证流程)

### **五步学习流程**
```
1. 搜索发现 (/) - 无需认证
   ↓ 输入学习主题
   ↓ 选择快速建议或自定义输入
   ↓ 检查登录状态

2. 用户认证 (/sign-in) - 如果未登录
   ↓ Clerk 登录/注册表单
   ↓ 社交登录或邮箱注册
   ↓ 会话建立和状态管理
   ↓ 自动返回原始流程

3. 个性化配置 (/configure) - 需要认证
   ↓ 显示用户欢迎信息
   ↓ 选择知识水平 (3个选项)
   ↓ 选择学习风格 (12个选项)
   ↓ 实时进度指示

4. 引导问题 (/learn) - 需要认证
   ↓ 生活化引入问题
   ↓ 观察与发现问题
   ↓ 概念建立问题
   ↓ 每阶段必须输入思考

5. 互动模拟器 (/simulate) - 需要认证
   ↓ 基于概念的游戏化体验
   ↓ 参数调节 + 实时反馈
   ↓ AI智能指导
   ↓ 掌握核心概念
```

### **数据流管理**
```typescript
// localStorage 数据持久化
'xknow-query': 用户搜索的学习主题
'xknow-config': 用户选择的学习配置
'xknow-responses': 用户在引导阶段的所有回答

// Clerk 认证状态管理
- 用户会话：自动持久化，无需手动管理
- 用户信息：通过 useUser() hook 获取
- 认证状态：isLoaded, isSignedIn, user 对象

// 跨页面状态传递
主页 → 登录页: 如果未认证
登录页 → 配置页: 认证成功后 + query
配置页 → 学习页: query + config + user info
学习页 → 模拟器: query + config + responses + user info

// 路由保护机制
中间件检查 → 未认证重定向 → 登录后返回原页面
```

---

## 🎨 设计系统升级

### **新增样式组件**
```css
/* 滑块控件样式 */
.slider: 自定义range input样式
.slider::-webkit-slider-thumb: 圆形滑块手柄
.slider:disabled: 禁用状态样式

/* 模拟器专用样式 */  
.simulator-canvas: 画布渐变背景
.animate-soft-pulse: 微妙脉动动画

/* 交互状态增强 */
.micro-bounce: 微交互反馈
.interactive: 通用交互样式
```

### **动画系统扩展**
- **渐进式展示**：多层次延迟动画
- **平滑过渡**：AnimatePresence页面切换
- **微交互**：hover、tap、focus状态
- **物理动画**：Canvas实时渲染

---

## 💾 技术架构升级

### **认证系统架构**
- **Clerk Provider**：全应用认证状态管理
- **中间件保护**：路由级别访问控制
- **会话持久化**：跨设备登录状态同步
- **用户信息集成**：个性化用户体验

### **状态管理策略**
- **Clerk hooks**：认证状态管理 (useUser, useAuth)
- **React hooks**：组件级状态管理
- **localStorage**：跨页面数据持久化
- **Context传递**：复杂状态共享
- **错误边界**：优雅的错误处理

### **性能优化**
- **代码分割**：页面级动态导入
- **动画优化**：requestAnimationFrame
- **内存管理**：Canvas清理机制
- **响应式设计**：移动端适配

### **AI集成准备**
- **Dify Workflow**：预留AI接口
- **游戏内容生成**：动态配置支持
- **智能提示系统**：个性化反馈机制
- **学习分析**：用户行为追踪

---

## 🎯 教育价值实现

### **个性化学习路径**
1. **身份认证**：建立个人学习档案和持续追踪
2. **生活场景连接**：引导阶段建立直观理解
3. **概念逐步抽象**：从现象到理论的平滑过渡
4. **参数化操作**：模拟器阶段的动手实践
5. **反馈驱动学习**：AI教练的个性化指导

### **核心教育理念实现**
- ✅ **个性化学习体验**：基于用户认证的定制化内容
- ✅ **"投不中不是你的问题"**：友好的AI提示语言
- ✅ **"抛物线方程没调对"**：参数调节的直观理解
- ✅ **游戏化降低门槛**：通过玩耍自然学习
- ✅ **可视化抽象概念**：数学公式的图形化表示

### **认证系统价值**
- **学习连续性**：跨设备、跨会话的学习进度保存
- **个人化推荐**：基于用户历史的智能内容推荐
- **社交学习**：未来可扩展的学习社区功能
- **学习分析**：长期学习行为分析和优化建议

### **学习效果评估**
- **用户留存**：认证用户的长期参与度分析
- **参与度指标**：完成率、停留时间、交互次数
- **理解程度**：参数调节的合理性、目标达成情况
- **概念迁移**：从具体到抽象的理解转换
- **兴趣激发**：重复访问、主动探索行为

---

## 🔮 未来扩展计划

### **AI功能集成**
- **智能游戏生成**：基于主题自动创建互动体验
- **个性化提示**：基于学习历史的智能建议
- **自适应难度**：根据表现动态调整挑战
- **学习路径优化**：AI驱动的个性化学习序列

### **多学科支持**
- **数学类**：函数、几何、统计、微积分
- **物理类**：力学、光学、电磁、热力学
- **编程类**：算法、数据结构、框架原理
- **通用框架**：支持任意学科的快速适配

### **社交化功能**
- **学习小组**：协作式问题解决
- **教师工具**：课堂管理和进度追踪
- **成就系统**：激励机制和认证体系
- **内容共享**：用户生成的学习材料

---

*最后更新：2024年12月*
*版本：2.0.0 - 新增引导学习页面和互动模拟器* 