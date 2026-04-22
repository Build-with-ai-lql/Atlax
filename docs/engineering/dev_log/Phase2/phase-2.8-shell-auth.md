# M2-02｜壳层稳定与身份闭环

| 项目 | 内容 |
|------|------|
| 模块 | M2-02 |
| 状态 | DONE |
| 日期 | 2026-04-23 |
| 执行者 | Agent |

---

## 1. 模块目标（DoD）

- 新用户可注册并进入工作区。
- 已登录用户刷新后会话仍可恢复。
- 首页不承担复杂分发，只保留最小入口动作（进入/继续工作）。

---

## 2. 改动摘要

1. **首页极简入口实现**：将 `app/page.tsx` 从纯重定向改为极简首页，根据登录状态显示"进入工作区"或"继续整理"，均指向 `/workspace`。
2. **身份闭环复核**：确认注册/登录/退出/刷新恢复四条路径完整可用，无需补齐缺口。
3. **空目录清理**：删除 legacy 空目录 `apps/web/app/inbox/`（含空子目录 `_components/`，无文件、无 git 跟踪、无代码引用）。
4. **工程验证**：`pnpm lint` 和 `pnpm typecheck` 均通过。

---

## 3. 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/web/app/page.tsx` | 修改 | 从纯重定向改为极简首页组件 |

---

## 4. 详细变更说明

### 4.1 首页极简入口（`app/page.tsx`）

**变更前**：
```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/workspace')
}
```

**变更后**：
- 客户端组件，使用 `getCurrentUser()` 检测登录状态
- 已登录用户：显示"继续整理"按钮
- 未登录用户：显示"进入工作区"按钮 + 引导提示
- 两种状态均通过 `Link` 指向 `/workspace`，由 AuthGate 处理认证
- 页面风格：安静启动面板，不堆复杂卡片，不做多页面分发
- 底部标注"本地优先 · 结构化优先 · 知识整理工作台"

### 4.2 身份闭环复核

| 路径 | 验证结果 | 说明 |
|------|---------|------|
| 注册 | PASS | `registerUser(name)` → 创建用户 → `setCurrentUser` → AuthGate `onAuthenticated` → workspace 加载数据 |
| 登录 | PASS | `loginUser(name)` / `loginByUserId(userId)` → 从目录查找 → `setCurrentUser` → AuthGate `onAuthenticated` |
| 退出 | PASS | `logoutUser()` → 清除 `atlax_current_user` → workspace 设 `user=null` → 显示 AuthGate |
| 刷新恢复 | PASS | `getCurrentUser()` 从 `localStorage` 读取 `atlax_current_user` → workspace `useEffect` 恢复会话 |

### 4.3 空目录清理

**实际处理结果**：`apps/web/app/inbox/` 目录存在于文件系统中（含空子目录 `_components/`），但未被 git 跟踪且无任何代码引用。

复核命令与输出：
```bash
# 文件系统检查
$ ls -la apps/web/app/inbox/
drwxr-xr-x  3 qilong.lu  staff   96 Apr 22 12:54 .
drwxr-xr-x  10 qilong.lu  staff  320 Apr 22 12:51 ..
drwxr-xr-x  2 qilong.lu  staff  64 Apr 22 12:54 _components

$ ls -la apps/web/app/inbox/_components/
# 空目录，无文件

$ find apps/web/app/inbox/ -type f
# 无输出，确认无文件

# git 跟踪检查
$ git ls-tree -r HEAD --name-only | grep "inbox"
# 无输出，未被 git 跟踪

# 代码引用检查
$ grep -r "inbox" apps/web/app/ --include="*.ts" --include="*.tsx" -l
# 无输出，无代码引用
```

处理动作：`rm -rf apps/web/app/inbox/`

结论：该目录为 legacy 残留空目录，已安全删除。

---

## 5. 验证结果

| 命令 | 结果 | 说明 |
|------|------|------|
| `pnpm lint` | PASS | 无 lint 错误 |
| `pnpm typecheck` | PASS | 无类型错误 |

---

## 6. 手工验证步骤

### 6.1 新用户注册并进入工作区

1. 清除浏览器 localStorage（或使用无痕模式）
2. 访问 `/`，应看到"进入工作区"按钮和引导提示
3. 点击"进入工作区"，跳转到 `/workspace`
4. AuthGate 显示注册表单（无已有用户时自动切到注册模式）
5. 输入用户名，点击"创建账号"
6. 进入工作区，Sidebar 显示用户名

### 6.2 已登录用户刷新后会话恢复

1. 在已登录状态下，按 F5 刷新页面
2. 页面应直接显示工作区内容，不出现 AuthGate
3. 返回首页 `/`，应显示"继续整理"按钮

### 6.3 退出登录

1. 在工作区点击 Sidebar 底部退出按钮
2. 应显示 AuthGate 登录界面
3. 可选择已有账号快速登录或输入用户名登录

### 6.4 首页入口

1. 访问 `/`
2. 已登录：显示"继续整理"
3. 未登录：显示"进入工作区" + "首次使用将引导你创建身份并进入工作区"
4. 点击后均跳转到 `/workspace`

---

## 7. 风险与遗留问题

| 风险/遗留 | 说明 | 影响 |
|-----------|------|------|
| 首页 SSR 不渲染用户状态 | 首页为客户端组件，首次加载会短暂显示"加载中…" | 低影响，本地 auth 无法做 SSR |
| Node.js 版本警告 | 当前 Node v24 与 package.json 要求 v20 不匹配 | 不影响功能，仅 WARN |
| AuthGate 无返回首页入口 | 退出登录后停留在 workspace 的 AuthGate，无法直接回到首页 | 低影响，用户可直接访问 `/` |

---

## 8. Gap Matrix 更新建议

| P0 项 | 原结论 | 建议更新 |
|-------|--------|---------|
| 首页极简入口 | PARTIAL | PASS |
| 账号登录闭环 | PASS | PASS（维持） |
| 单页工作台稳定 | PASS | PASS（维持） |
