# Atlax Notion 阶段文档同步稿（v4.9）

## 同步范围

- 开发阶段主页面（Phase 总览）
- Phase 2 执行页
- Phase 3 规划页
- 阶段验收页（如独立页面存在）

---

## 1）阶段总览需更新为

### Phase 2（当前）
目标：可上线 Demo 闭环。
范围：Classic/Chat 最小闭环 + Dock/Tag/Suggest/Archive/Browse + 登录系统 + 单页工作台稳定 + 核心指标埋点。
不做：复杂 Review、高级 Database、复杂动画、精细 Chat 策略、高级关系浏览。

### Phase 3
目标：产品化打磨与留存增强。
范围：Review 增强、Chat 策略优化、Browse/Database 体验优化、模式切换细化。

### Phase 4
目标：扩展能力验证。
范围：导入、搜索增强、关系增强、扩展输入。

### Phase 5
目标：同步与智能增强。
范围：多端同步、协作、AI provider。

---

## 2）Phase 2 页面需替换为以下 P0 清单

- Classic Mode 基础闭环
- Chat Mode 最小闭环
- 模式切换（同一知识库）
- Dock（统一待整理入口）
- Suggest 基础版（可解释可修正）
- Tag（用户优先）
- Archive（支持 reopen）
- Browse 基础版
- 首页极简入口
- 登录系统（注册/登录/退出/会话恢复）
- 单页工作台结构稳定
- 指标埋点可用

---

## 3）Phase 2 建议按 4 批执行

### 批次 A：壳层稳定 + 身份闭环
- 主布局稳定
- Auth 与会话恢复
- 首页极简入口

### 批次 B：双入口输入 + Dock
- Quick Input + Expanded Editor
- Chat 最小引导
- 统一写入 Dock

### 批次 C：Suggest/Tag/Archive
- Suggest 基础规则
- Tag 确认
- Archive 与 reopen

### 批次 D：Browse + 指标
- Browse 基础筛选
- 核心埋点
- Demo 路径与样例数据

---

## 4）验收口径（需写入 Notion）

### 功能验收
链路跑通：
Classic/Chat Capture -> Dock -> Suggest/Tag -> Archive -> Browse -> Re-organize

### 产品验收
- 用户理解 Classic/Chat 关系
- 两种模式都能完成整理
- 模式切换不造成内容割裂

### 指标验收
至少可追踪：
- DAU
- 每用户日均记录次数
- Chat 引导后归档率
- 7 日留存率
- Weekly Review 打开率

---

## 5）同步操作建议（连接恢复后）

1. 更新阶段总览页：替换 Phase 2-5 简述为上述口径。
2. 更新 Phase 2 页面：替换目标、范围、分批计划、验收口径。
3. 更新 Phase 3 页面：删除功能堆叠描述，改为“体验统一与留存增强”。
4. 在阶段页面补“指标口径”区块，便于研发和产品共同验收。
