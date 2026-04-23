Atlax MindDock UI/UX 设计与动效规范 (Design System & Motion Guidelines)

本规范提炼自 Atlax MindDock Phase 2 的核心工作台设计，旨在确立产品的前端视觉美学与交互范式。我们在设计中深度融合了 Apple 的原生质感（光影、毛玻璃） 与 现代生产力工具的极简空间控制（如飞书、Trae、Codex），致力于打造一个既有专业统筹感，又有沉浸式情绪价值的“智能思考伙伴”。

1. 核心设计哲学 (Core Design Philosophy)

• 克制与留白 (Restraint & Negative Space): 减少不必要的分割线和实色背景，通过大圆角、充足的内边距（Padding）和阴影来构建视觉层级。

• 平行世界与空间感 (Parallel Worlds & Spatial Depth): 通过 Z 轴和透明度的变化来区分工作状态。让 Chat 模式成为沉浸的“焦点世界”，让 Classic 模式成为总览的“全局底座”。

• 拟物与光的隐喻 (Skeuomorphism & Light Metaphors): 在关键组件（如 Logo、AI 按钮、输入状态）引入微弱的渐变、流光和呼吸动画，暗示 AI 的存在感和系统的生命力。

• 物理阻尼与线性过渡 (Physical Damping & Linear Transitions): 拒绝生硬的显隐，所有状态切换必须具备符合物理直觉的动画曲线。

2. 视觉基础 (Visual Foundations)

2.1 色彩体系 (Color Palette)

系统全面适配 Light / Dark 双轨模式，采用无级平滑切换。

• 背景底色 (Canvas Background):

	• Light: #F5F5F7 (Apple 经典浅灰底色，极具温润感)

	• Dark: #0E0E11 (极深灰，避免纯黑带来的极高对比度疲劳)

• 卡片与面板 (Surfaces):

	• Light: #FFFFFF 配合 border-slate-100

	• Dark: #1C1C1E 配合 border-white/5

• 品牌主色调 (Primary Brand - Blue):

	• 使用 blue-500 到 blue-600 作为主行动点 (CTA)。

	• AI 相关功能加入紫/靛渐变 (from-blue-50 to-indigo-50)，增强科技感。

• 文字层级 (Typography Colors):

	• 主标题/重点文本: slate-800 (Light) / slate-100 (Dark)

	• 正文: slate-700 (Light) / slate-200 (Dark)

	• 辅助文本/占位符: slate-400 (Light) / slate-500 (Dark)

2.2 排版与字体 (Typography)

• 字距控制 (Tracking/Letter-spacing): 品牌级展示需极致控制字距。例如顶部 Logo 区域的 ATLAX 使用极宽字距 (tracking-[0.35em])，下方产品名使用紧凑字距 (tracking-[-0.04em])。

• 粗细对比 (Weight Contrast): 利用字重的极差构建视觉锚点。如 Logo 中的 Mind (Bold) 与 Dock (Light) 拼接，体现“核心与容器”的概念。

2.3 材质与深度 (Materials & Depth)

• 毛玻璃特效 (Glassmorphism): 大量使用 backdrop-blur (通常范围在 md 到 3xl，即 12px - 64px 的模糊半径) 配合半透明白色/深色背景 (bg-white/60 或 bg-[#1C1C1E]/60)。主要应用于 Sidebar、顶部 Header 和悬浮输入框。

• 弥散阴影 (Diffuse Shadows): 摒弃生硬的短阴影，采用大范围、低透明度的柔和阴影。

	• 默认卡片: shadow-[0_2px_10px_rgba(0,0,0,0.02)]

	• 悬浮卡片 (Hover): shadow-[0_8px_30px_rgba(0,0,0,0.04)]

	• 浮动输入框 (Chat Mode): shadow-[0_20px_60px_rgba(0,0,0,0.12)]

3. 核心交互模式与动效 (Interaction & Motion)

所有的动效都应遵循物理世界的惯性，禁止使用线性的 ease (除纯图形裁剪外)。

3.1 缓动函数标准 (Easing Standard)

• 通用交互 (Hover/Active/Focus): transition-all duration-300 ease-out

• 空间穿越/模式切换 (Spatial Transitions): 使用特定的贝塞尔曲线实现强烈的弹性和阻尼感：ease-[cubic-bezier(0.175,0.885,0.32,1.15)] (带回弹) 或 ease-[cubic-bezier(0.23,1,0.32,1)] (顺滑减速)。持续时间拉长至 700ms - 800ms。

• 日夜主题切换 (Theme Toggle): duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]，确保背景色、边框、文字颜色的切换如电影般平滑。

3.2 模式切换：空间折叠 (The "Parallel Worlds" Effect)

这是 Atlax MindDock 最核心的 UX 特性之一，通过空间布局和背景模糊，物理化地隔离两种心流状态：

• Classic 模式 (全局管理):

	• 输入组件：沉底 (bottom-0)，缩放正常 (scale-100)。

	• 背景环境：全透 (opacity-0)，无模糊。

	• 心理暗示：用户是旁观者、管理者，掌控整个 Dock 的全局信息。

• Chat 模式 (焦点沉浸):

	• 输入组件：克服重力浮空至中央 (bottom-[50%] translate-y-[50%])，并微放大 (scale-[1.03])。

	• 背景环境：生成强力毛玻璃结界 (backdrop-blur-[12px] opacity-100)。

	• 心理暗示：剥离干扰，建立与 AI 助手的 1V1 沉浸式对话空间（灵感捕获状态）。

3.3 输入体验：渐进式展开 (Progressive Disclosure)

借鉴飞书的输入体验，保持界面的极简，同时不损失功能的丰富度。

• 最小化状态 (Collapsed):

	• 采用单行胶囊/药丸状设计。

	• 次要功能（如附件、标签、图片）图标默认降低透明度 (opacity-60)，仅在输入框 focus-within 或整体 hover 时完全显现。

	• 发送按钮为动态状态：空文本时置灰 (bg-slate-100)；有文本时激活 (bg-blue-500 配合轻微的上浮动画 -translate-y-0.5)。

• 富文本展开态 (Expanded):

	• 点击展开按钮或新建记录后，以抽屉展开动画变为大型卡片编辑器。

	• 底部承载标准的富文本工具栏和 AI 操作区。

3.4 AI 元素：光晕与拟物 (AI Metaphors)

对于涉及 Gemini API 或 AI 自动处理的部分，增加特殊的视觉提示：

• 呼吸光晕: 在 AI 输入框底层或 AI 洞察区域使用缓慢渐变的背景 (bg-gradient-to-r from-blue-400/5 to-purple-400/5)，传递“思考中”的生命力。

• 闪烁反馈: AI 按钮在处理中 (isAiProcessing) 应添加 animate-pulse 效果。

• 专属高光: 提取的 AI 内容 (如 Action Items) 使用独立的带微边框的毛玻璃卡片承载，并带有标志性的 ✨ 图标前缀。

3.5 主题切换：无缝几何过渡 (Geometric Theme Toggle)

• 弃用传统的“图标淡出淡入”替换，采用极客且优雅的 clip-path 多边形裁剪技术。

• 在系统模式下，太阳和月亮被精确裁剪至一半进行拼接；在单独模式下，通过线性的 ease-linear 让另一半滑出/滑入。保证了动效的连贯性，极具观赏价值。

4. 前端开发实现规范 (Implementation Rules)

1. Tailwind 优先: 所有样式必须通过 Tailwind CSS utility classes 实现，避免编写自定义 CSS 文件。

2. 组件内聚: 对于强交互的微动效（如 ThemeToggle 太阳月亮拼接、胶囊状 ModeSwitch 的滑动指示器），将其封装为独立的、状态自治的 React 组件。

3. 动态类名管理: 对于复杂的条件动画类名（如由于模式切换引起的位移），使用模板字符串 (`class ${condition ? 'A' : 'B'}`) 或 clsx / tailwind-merge 库进行安全拼接。

4. Dark Mode 原则: 必须在最外层容器级控权 dark 类名。内部组件通过添加 dark:bg-xxx、dark:text-xxx 响应，禁止在 JS 层面通过状态 if-else 强行写死颜色色值。
