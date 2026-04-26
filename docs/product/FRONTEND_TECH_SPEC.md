# 前端技术规格说明书（Frontend Technical Specification）

## 1. 文档基础信息
### 1.1 项目名称
Atlax MindDock (Nebula Tree 重构版)
### 1.2 模块名称
核心工作区 (Mind / Editor / Dock)
### 1.3 版本记录
* v1.0.0 - 初始草案，确立 Nebula Tree 视觉与交互规范，对标 Cerebro / Obsidian 融合体验。

---

## 2. 项目概述
### 2.1 项目背景
Atlax MindDock旨在从“大杂烩笔记软件”转型为“以结构化知识生长为核心的编辑器”。本次重构废弃了传统的左侧重导航和 Entry 模块，确立了“星云树 (Nebula Tree)”的产品灵魂。
### 2.2 建设目标
打造具备顶级 SaaS 质感（对标 Cerebro/Linear）的前端视图。实现极简输入(Dock) -> 沉浸编辑(Editor) -> 星云生长(Mind) 的无缝体验闭环，配合本地物理算法引擎渲染海量知识节点。
### 2.3 用户角色说明
* **个人知识工作者**：主打单机/云同步模式下的高密度信息处理者。
### 2.4 使用场景
碎片灵感速记、长文深度结构化沉淀、全局知识脉络探索与复盘、多源信息（微信/Notion/网页）整理。
### 2.5 范围说明（本期 / 非本期）
* **本期范围**：三大核心模块 (Mind 视图、Editor 编辑器、Dock 管理区)、本地力导向图引擎、深浅色主题、基础响应式。
* **非本期范围**：Chat、Review看板、Widget小组件、多人实时协作。

---

## 3. 技术架构
### 3.1 前端技术栈
* **核心框架**：React 18 + TypeScript 5.x
* **构建工具**：Vite
* **状态管理**：Zustand (轻量级，适合复杂交互) + RxJS (用于极高频物理引擎状态流)
* **样式方案**：TailwindCSS + CSS Modules (复杂滤镜及动效)
* **可视化引擎**：HTML5 Canvas API (自主定制力导向物理引擎) / D3-force (辅助物理计算)
* **编辑器内核**：ProseMirror / Tiptap (支持 Block与Classic Markdown 统一模型)
* **本地存储**：Dexie.js (IndexedDB 封装，承载本地结构算法索引)
### 3.2 项目目录结构
```text
src/
 ├── assets/        # 静态资源与独立图标
 ├── components/    # 共享组件 (SquircleLogo, MinimalPanel)
 ├── features/      # 按业务模块划分 (mind, editor, dock)
 ├── engine/        # 自研星云树力导向渲染引擎
 ├── store/         # Zustand 全局状态
 ├── types/         # TS 接口定义 (AUD, Node, Edge)
 └── utils/         # 本地化算法辅助函数, 节流防抖
```
### 3.3 环境说明
* 开发环境：Localhost (Vite HMR)
* 测试/生产环境：Vercel / 自建 Node 静态托管，配合 Electron 客户端打包。
### 3.4 构建部署流程
ESLint + Prettier 代码格式化 -> TypeScript 静态检查 -> Vite Build -> 静态资源 CDN 部署。
### 3.5 浏览器兼容要求
* Chrome 90+, Edge 90+, Safari 14+, Firefox 15+ (需支持 HTML5 Canvas 与 CSS Backdrop-filter)。

---

## 4. 路由与导航设计
### 4.1 路由总表
* `/` -> 默认重定向至 `/mind`
* `/mind` -> 星云树脑域视图 (Atlas)
* `/editor/:id` -> 知识凝聚器 (Editor)
* `/dock` -> 星尘管理区 (Dock)
### 4.2 页面访问路径
全应用采用 **SPA (单页应用)** 模式，保持背景 Canvas 引擎不卸载，通过路由控制 DOM 层面板的显隐，实现无缝切换。
### 4.3 菜单结构
全局顶部居中轻导航：`Editor | Mind | Dock`。
### 4.4 面包屑规则
本期产品追求极简，全局无面包屑。层级通过 Dock 的 Finder Column 视图或 Editor 右侧 Inspector 展现。
### 4.5 页面跳转逻辑
路由切换时，背景星云树执行淡化/聚焦动效（例如从 Mind 切换至 Editor 时，背景网络透明度降至 0.1，Editor 浮层淡入）。

---

## 5. 页面清单
### 5.1 页面列表
1. **Mind (Atlas) 视图**：全局知识星空与快速输入入口。
2. **Editor 视图**：沉浸式块级/Markdown编辑器。
3. **Dock 视图**：List / Card / Finder 三态知识库管理。
### 5.2 页面优先级
Mind (P0) > Editor (P0) > Dock (P1)。
### 5.3 页面依赖关系
Mind 依赖本地 IndexedDB 数据生成的图结构；Editor 依赖传入的 Document ID；Dock 依赖全局数据索引。

---

## 6. 页面详细设计

### 6.1 Mind (星云树脑域) 页面
#### 6.1.1 页面目标
全屏展示知识生长结构，支持交互式拖拽探索与碎片（星尘）极速输入。
#### 6.1.2 页面入口
默认首页，或通过顶部导航空态点击。
#### 6.1.4 页面布局设计
* **底层**：全屏 Canvas (`z-index: 0`)。
* **顶部区域**：绝对定位 Global Bar (`z-index: 50`)，含 Squircle Logo。
* **内容区域**：居中大字标题（聚焦时隐退左上角）。
* **底部区域**：居中悬浮输入坞 (Dock Input Box)。
#### 6.1.5 页面模块拆分
* **交互引擎区**：Canvas 监听 Pan/Zoom/Drag。
* **信息抽屉区**：右侧滑出的 Node Detail Inspector。
* **状态卡片区**：右上角可折叠为“北极星”的 Atlas Status 面板。
#### 6.1.6 UI规格
* **色值**：深空背景 `#030508`，节点高亮 `#10B981` (Cerebro 绿)，星核发光 `#6366f1`。
#### 6.1.7 交互设计
* **Hover**：相关线加粗提亮，无关星群褪色至 `opacity: 0.1`。
* **Drag**：触发物理引擎弹性形变。
* **Click**：触发 Focus 模式，弹出节点详情面板。
#### 6.1.8 状态设计
* 包含“全局巡航态”、“节点聚焦态 (Focus Mode)”、“星尘录入态”。

### 6.2 Editor (知识凝聚器) 页面
#### 6.2.1 页面目标
完成长文写作、Block 整理与元数据标记。
#### 6.2.4 页面布局设计
* **单栏沉浸布局**：最大宽度 `800px` 居中。
* **右侧抽屉**：Properties / Links 元数据浮层。
#### 6.2.7 交互设计
* 支持 `/` 唤出 Slash Command，`[[` 唤出双链推荐。打字时隐藏鼠标指针。
#### 6.2.9 表单设计
* 标题输入框 (H1) + 自动扩展高度的 Block 内容区。无显式“保存”按钮，执行防抖自动落库。

### 6.3 Dock (星尘管理区) 页面
#### 6.3.1 页面目标
结构化管理所有实体（包括外部导入和未整理星尘）。
#### 6.3.10 表格/视图设计
* **Finder 分栏**：左侧项目/主题 -> 中间文档 -> 右侧元数据预览。
* **批量操作**：多选后支持批量指定 Cluster 或归档。

---

## 7. 组件设计
### 7.1 公共组件清单
* `SquircleLogo`: 支持点击放大与北极星缩放微动效。
* `MinimalPanel`: 全局通用的毛玻璃面板 (12px 模糊，微弱白边)。
* `PulseStar`: 状态栏折叠后的呼吸指示灯。
### 7.2 业务组件清单
* `NebulaCanvas`: 封装了物理计算引擎和 D3/自定义渲染逻辑的 React 组件。
* `OmniInput`: 底部支持快捷键唤醒的智能输入框。
### 7.3 Props设计
`NebulaCanvas` props: `nodes: MindNode[]`, `edges: MindEdge[]`, `onNodeClick: (id) => void`.
### 7.5 组件复用规则
杜绝业务代码耦合 UI 组件。所有 CSS 变量通过 `:root` 统一分发，支持深浅色切换。

---

## 8. 数据模型设计
严格遵循本地化结构算法的实体定义。
### 8.1 TypeScript类型定义
```typescript
interface AUD { // Atlax Universal Document
  id: string;
  source: SourceMeta;
  content: ContentMeta;
  metadata: Metadata;
}

interface MindNode {
  id: string;
  type: 'hub' | 'trunk' | 'leaf' | 'fragment';
  label: string;
  group: number;
  weight: number;
  x?: number; y?: number; z?: number;
}

interface MindEdge {
  source: string;
  target: string;
  type: 'tree' | 'net' | 'suggested';
  strength: number;
}
```
### 8.3 ViewModel定义
`GraphLayoutVM`: 附加了 `vx, vy, targetX, targetY` 等动画过渡属性的渲染层数据结构。

---

## 9. 状态管理设计
### 9.1 全局状态
Zustand Store 划分：
* `useAppStore`: 主题 (Dark/Light)，当前活动模块 (Mind/Editor/Dock)。
* `useGraphStore`: 当前视口 (Camera x/y/zoom)，高亮节点 (hovered/selected id)，折叠态。
### 9.3 缓存策略
图布局坐标存入 `graph_layouts` 表中，每次拖拽 `onMouseUp` 后防抖持久化。
### 9.4 状态更新流程
输入框回车 -> Zustand Action 生成乐观更新 (Optimistic UI) 碎片节点飞入动画 -> IndexedDB 异步落库 -> 重新拉取计算边 -> 刷新图谱。

---

## 10. 接口设计
本期核心为本地算法，API 指向本地 IndexedDB 封装的 Dexie Services。
### 10.1 接口清单
* `POST /local/captures` : 极速录入碎片
* `GET /local/mind/graph` : 获取图谱快照
* `PUT /local/documents/:id` : 更新文档
### 10.4 返回结构
```json
{
  "code": 200,
  "data": { ... },
  "message": "success",
  "algo_metadata": { "confidence": 0.85, "reason": "..." }
}
```
### 10.7 Mock策略
开发期提供 JSON 静态数据，模拟具备 3 个 Hub、上千节点的复杂结构进行 Canvas 性能压测。

---

## 11. 权限设计
### 11.1 页面权限
当前为单机本地化设计，校验 Local Storage 中的 `workspace_id` 与 `user_id`。

---

## 12. 异常处理设计
### 12.1 页面崩溃兜底
为 `NebulaCanvas` 包裹 React `ErrorBoundary`。当物理引擎 NaN 溢出（如引力奇点计算错误）时，重置所有 `vx, vy` 为 0 并展示“重新对齐星轨”的降级按钮。
### 12.5 日志上报
记录用户拒绝/撤销的结构化推荐，存入本地 `user_behavior_events` 供算法动态降低该权重的推荐概率。

---

## 13. 性能优化设计
### 13.1 首屏优化
首屏仅加载框架与 Canvas，节点数据走 Web Worker 后台反序列化。
### 13.4 虚拟列表 / LOD渲染
**LOD 策略 (核心)**：
* 全局缩放 `< 0.5` 时：隐藏所有 net 弱边，隐藏叶子节点文字，使用纯色圆代替。
* 计算阶段：使用屏幕视口四叉树/剔除视野外节点 (Culling) 进行 `fillRect` 渲染加速。
### 13.5 请求防抖节流
Editor 自动保存使用 `1000ms` 防抖。物理引擎 `requestAnimationFrame` 中禁发 DB 请求。

---

## 14. 安全设计
### 14.1 XSS防护
Editor 转译 Markdown 或 HTML 时，必须经由 `DOMPurify` 消毒。不允许直接执行外部块代码。
### 14.4 敏感信息处理
本地存储密钥。外部图谱数据导出采用加密混淆打包。

---

## 15. 国际化设计
### 15.1 多语言结构
默认支持 `zh-CN` 与 `en-US`。UI 文案（如"记录星尘", "Nebula Tree"）提取至 i18n JSON。

---

## 16. 埋点与数据分析
### 16.2 点击埋点
重点监测算法反馈闭环：
* `algo_suggestion_accepted`
* `algo_suggestion_rejected`
* `node_dragged_manual_link`
用于喂给本地 Graph Intelligence Layer 更新权重。

---

## 17. 测试方案
### 17.1 单元测试
Jest + Vitest 测试核心物理计算纯函数（如 `applyForces` 是否会产生速度暴走）。
### 17.3 E2E测试
Cypress 模拟：打开页面 -> Dock 键入 "Test Input" -> 验证 Canvas 中是否新生一个叶子节点。

---

## 18. 发布方案
### 18.1 发布流程
Main 分支合并触发 GitHub Actions/Vercel 自动化构建。
### 18.3 灰度策略
本地 Web 版即开即用，后续 Electron 客户端通过 `electron-updater` 分发。

---

## 19. 维护规范
### 19.1 代码规范
强制 ESLint Config Standard + TypeScript Strict。禁止在 Canvas 渲染循环中 `new` 对象以防 GC 卡顿。
### 19.3 Commit规范
Angular 规范：`feat(mind): implement force-directed culling`, `fix(dock): layout shift`.

---

## 20. 附录
### 20.1 术语表
* **Nebula Tree (星云树)**：融合 Cerebro 脑图、Obsidian 关系网与层级树状结构的混合数据可视化表现形式。
* **Hub**：星云核心节点，代表领域或主要聚类。
* **AUD (Atlax Universal Document)**：跨平台导入归一化的底层内容数据结构。

---

## 21. 实施补全规范（新增）

### 21.1 最终技术栈决议
- React 18 + TypeScript 保持不变
- Vite 保持当前 Demo 开发效率方案
- 后续桌面端通过 Electron 包装
- Zustand 负责业务状态，RxJS 仅用于高频图谱事件流
- Dexie 作为本地主数据层

### 21.2 前端目录补强

```text
src/
  app/
  components/
  features/
    mind/
    editor/
    dock/
  engine/
    graph/
    physics/
    worker/
  stores/
  repositories/
  services/
  hooks/
  types/
  styles/
```

### 21.3 Graph Engine 分层

```text
RawData(Document/Node/Edge)
 -> GraphProjection
 -> LayoutWorker
 -> RenderViewModel
 -> Canvas Renderer
```

规则：
1. 业务实体禁止直接进入 Canvas。
2. Worker 负责布局计算。
3. 主线程仅负责交互与绘制。
4. 节点拖拽后局部重算，不全量重排。

### 21.4 NebulaCanvas 组件补强 Props

```ts
interface NebulaCanvasProps {
  nodes: MindNode[]
  edges: MindEdge[]
  clusters: ClusterVM[]
  camera: CameraState
  selection?: string
  onNodeClick(id:string): void
  onNodeDrag(id:string,x:number,y:number): void
  onCreateLink(sourceId:string,targetId:string): void
}
```

### 21.5 Zustand 状态机补全

```ts
type ActiveModule = 'mind' | 'editor' | 'dock'

interface AppState {
  activeModule: ActiveModule
  selectedNodeId?: string
  selectedDocumentId?: string
  hoveredNodeId?: string
  focusedClusterId?: string
}
```

### 21.6 Editor 双模式统一规范

- Classic Mode：纯 Markdown 编辑视图
- Block Mode：Tiptap Block 编辑视图
- 二者底层统一存储为 Block JSON + Markdown Snapshot

```text
Block JSON <-> Markdown <-> HTML Preview
```

### 21.7 Editor 自动补全

触发：
- `/` Slash Command
- `[[` 双链推荐
- `# ` 标题转换
- `- [ ]` 任务列表
- ``` 代码块

响应目标：
- 本地提示 < 16ms
- 知识库候选 < 120ms

### 21.8 Dock 联动补强

P0 必做：
1. List View
2. 定位至 Mind 节点
3. 打开 Editor
4. 状态筛选（已结构化/待整理/草稿）
5. 搜索

P1：
- Card View
- Finder Column View

### 21.9 数据模型补强

```ts
interface MindNode {
  id:string
  type:'root'|'domain'|'project'|'topic'|'document'|'fragment'
  label:string
  weight:number
  clusterId?:string
  x?:number
  y?:number
}

interface MindEdge {
  id:string
  source:string
  target:string
  type:'tree'|'reference'|'suggested'
  strength:number
}
```

### 21.10 性能红线

1. 首屏 < 2.5s
2. 1000 节点图谱保持 55fps+
3. 输入保存 < 100ms
4. Dock 搜索 < 200ms
5. 节点拖拽无明显掉帧

### 21.11 开发排期

#### P0
- 顶栏三模块切换
- Mind Canvas 基础交互
- Dock List View
- Editor 双模式基础版
- Dexie 持久化
- Node/Doc 双向打开

#### P1
- 自动补全
- Finder View
- 图谱聚类
- Worker 布局优化
- 推荐提示

#### P2
- Electron
- 多端同步
- 高级 Review

### 21.12 验收标准

1. Dock 新建内容 -> Mind 出现节点
2. 点击节点 -> 打开 Editor
3. 编辑保存 -> Dock 列表更新
4. 节点拖动刷新后位置保留
5. 搜索可定位文档与节点
6. 1000 节点下仍可交互
