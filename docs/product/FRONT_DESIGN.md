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

5. Phase 3 MindDock Editor 设计规范

Phase 3 的核心界面不是输入框或列表，而是 MindDock Editor。任何 DockItem / Entry 详情页都必须呈现为可长期工作的知识工作台。

5.1 Editor Shell

• 主结构：左侧为内容列表或 Browse 上下文，中间为 Markdown Editor / Preview，右侧为 Context Panel。

• 中间内容区必须使用响应式约束，不能写死固定宽度。桌面端优先保证正文阅读宽度，右侧面板在空间不足时折叠为抽屉。

• Editor 外层可以使用毛玻璃与柔和阴影，但正文阅读区必须干净、稳定、少装饰，避免干扰长文阅读。

• 不允许 UI 控件遮挡正文、预览、底部操作区；所有滚动必须落在明确的滚动容器内。

5.2 Edit / Preview / Split

• 使用 segmented control 展示 `Edit` / `Preview` / `Split`，放在编辑器 header 的稳定位置。

• Edit 模式显示 Markdown 源码，工具栏只放常用动作：保存、预览切换、复制 Markdown、重新建议。

• Preview 模式隐藏源码符号，使用正式文档排版。

• Split 模式左编辑右预览，两侧都必须 `min-h-0`，滚动互不抢占外层页面。

• 模式切换必须保留未保存内容，不得因为切换造成文本丢失或建议状态错乱。

5.3 Document Reading Layout

• Preview 正文版心建议控制在 `720px - 860px`，窄屏下使用 `max-width: 100%` 与安全 padding。

• 标题层级要清晰：H1/H2/H3 有明确字号、间距和锚点感；不要让所有文本像同一段日志。

• 列表、任务列表、引用、代码块、表格、链接必须有独立样式。

• 代码块使用等宽字体、柔和背景、边框、语言标签和横向滚动；表格使用清晰边界和横向滚动。

• Dark Mode 下正文、代码块、表格和引用的对比度要舒适，避免纯黑纯白的刺眼组合。

5.4 Context Panel

• Context Panel 是结构感的主入口，不是附属信息堆叠区。

• Panel 分组顺序：Status / Type、Tags、Project、Source、Created / Updated、Suggestions、Actions。

• Tags 与 Project 使用可编辑 chip / select，不允许只显示静态文本。

• Suggestions 使用解释卡片：推荐值、reason、confidence、操作按钮必须同时可见。

• Actions 使用状态驱动按钮组。DockItem pending 与 Entry archived 的主操作不同，不能复用同一套“保存变更”按钮。

5.5 Explainable Suggestion UI

• Suggestion 卡片必须回答三个问题：推荐什么、为什么推荐、用户能怎么改。

• confidence 以低干扰方式展示，例如百分比、短进度条或置信度标签，不做夸张 AI 特效。

• 支持接受全部、部分接受、修改、忽略。部分接受时用户能单独选择 Type / Tags / Project。

• 用户修改后要显示“已按你的选择更新”，并记录 decision，避免错误建议反复出现。

5.6 Review 与 Browse 视觉原则

• Review 不得展示假图表。空数据必须显示真实空状态和下一步建议。

• Review 指标卡片只保留真实可解释指标：本周记录、本周归档、高频 Tag、待整理、整理完成率、建议回看。

• Browse / Entries 需要列表与表格两种基础视图。筛选、排序、分组控件应贴近数据表，而不是营销式卡片堆叠。

• 条目打开方式优先侧边详情或同页 Editor，避免频繁路由跳转打断整理流程。

5.7 Responsive Rules

• 禁止为核心编辑器写死不可适配的宽高。使用 `min()`, `max()`, `clamp()`, `grid-template-columns`, `minmax()`, `container` 约束。

• 当宽度不足时，历史/列表/Context Panel 应折叠，正文编辑区优先保留可用宽度。

• 当高度不足时，header、footer/action area 固定，正文滚动区自适应压缩，不允许底部操作区被裁切。

• 所有 Phase 3 编辑器变更必须在常见桌面宽度、窄浏览器窗口和 Dark Mode 下手测。

5.8 从 Obsidian / Notion 吸收但不照搬

• 吸收 Obsidian 的 Markdown-first、阅读/编辑模式、可读行宽、属性侧栏、任务列表、代码高亮。

• 吸收 Notion 的页面即工作台、属性与内容并存、低摩擦操作、数据库筛选排序分组。

• 不照搬完整 Block Editor、复杂双链图谱、多人协作评论或重型数据库。Atlax 的重点是智能归档与低负担结构化。

6. Phase 3 Widgets / Graph Tree / Review 设计规范

6.1 Widget Button 与 Sidebar Gap

• 右上角增加小组件按钮，视觉上与 Search / Theme Toggle 同级，不抢占主导航。

• 点击后弹出小组件视图，使用轻量浮层或 popover，展示 built-in widgets。

• Phase 3 首个 built-in widget 为 Calendar Widget。用户可拖动组件到 Sidebar 的 gap 区域生效。

• Phase 3 只支持一个生效小组件；生效后小组件不常显关闭按钮，只有 hover/focus 或进入模块管理态时左上角显示关闭按钮。

• Calendar Widget 风格参考系统级小组件：深浅色适配、圆角矩形、信息密度高、不要做营销卡片。

• 点击日期后需要给用户明确反馈：Entries 日期筛选生效、当天归档条目数量可见、无内容时显示真实空状态。

6.2 Entries Graph Tree

• Entries 视图切换包含 List / Table / Graph Tree。Graph Tree 是结构化主线视图，不是彩蛋。

• 节点代表文档，线代表链式关系。节点点击进入 MindDock Editor。

• 未归档或未关联内容以散点分布展示，视觉上低权重，提示用户继续整理。

• 已归档且有关联的内容按 Project / Tag / Chain 聚类，整体应像一棵有主干和枝叶的树，而不是随机星图。

• 画布支持缩放、拖拽、局部聚焦、回到中心。拖动枝叶进行连接时，连线预览必须清晰，释放后有成功或失败反馈。

• 动效参考 Obsidian Graph 的顺滑拖拽，但 Atlax 要更有序、更利于判断结构归属。

• 数据量增大时使用聚合节点、缩放层级和搜索定位，避免节点文字重叠成噪声。

6.3 Review 主动模块

• Review 新增模块必须像运营工作台一样务实，不做花架子。

• 推荐提问模块使用“像联系人发来消息”的语气，但内容必须来自真实知识库指标。

• 周报模块按项目/Tag/时间线呈现本周做了什么、哪里卡住、哪个方向停滞。语气要像助理复盘，不像营销报告。

• 健康检查模块优先展示可操作问题：30 天未看、缺少关联、主题重复但未深入、pending 堆积、项目停滞。

• 图表优先使用折线、饼图、柱状、甘特图。每个图表必须回答一个用户问题，避免无意义统计。

• 图表点击后应能跳转或过滤到对应条目，不做不可交互的装饰图。
