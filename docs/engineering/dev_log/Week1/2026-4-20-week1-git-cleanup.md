### 1️⃣ 更新后的 .gitignore 内容

**文件路径**：[.gitignore](file:///Users/qilong.lu/WorkDir/MacDummyDis/Project_Lib/Atlax/.gitignore)

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
dist/
build/
out/
.turbo/

# Test coverage
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment files
.env
.env.*
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS files
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# TypeScript
*.tsbuildinfo

# Cache
.cache/
.parcel-cache/

# Misc
*.bak
*.tmp
*.temp
```

---

### 2️⃣ 检测到的 Git 跟踪状态

**好消息**：`node_modules` **未被 Git 跟踪**，只是未跟踪状态（??）。

| 检测项 | 状态 | 处理方式 |
| --- | --- | --- |
| `node_modules/` | ❌ 未跟踪（??） | ✅ 已被 .gitignore 忽略 |
| `.next/` | ❌ 不存在 | 无需处理 |
| `dist/` | ❌ 已删除（apps/server/dist） | ✅ 随 apps/server 删除 |
| `build/` | ❌ 不存在 | 无需处理 |
| `coverage/` | ❌ 不存在 | 无需处理 |
| `pnpm-lock.yaml` | ⚠️ 未跟踪（??） | ✅ **应提交**（依赖锁定文件） |

**结论**：无需执行 `git rm --cached`，因为 node_modules 从未被 Git 跟踪。

---

### 3️⃣ 建议执行的 Git 命令

**当前 Git 状态**：

```
 D apps/server/README.md                              [已删除]
 D "docs/product/Atlax 产品说明书与技术规格书.md"      [已删除]
?? .gitignore                                         [新增]
?? docs/engineering/archive/                          [新增]
?? docs/engineering/dev_log/                          [新增]
?? docs/engineering/dev_plan/                         [新增]
?? pnpm-lock.yaml                                     [新增]
```

**建议执行顺序**：

```bash
# Step 1: 添加 .gitignore（仓库清理）
git add .gitignore
git commit -m "chore: add .gitignore to exclude node_modules and build outputs"

# Step 2: 确认删除 apps/server 相关文件
git add -u  # 添加所有删除的文件
# 或者单独添加
git add apps/server/README.md
git add "docs/product/Atlax 产品说明书与技术规格书.md"

# Step 3: 添加归档和日志文件
git add docs/engineering/archive/
git add docs/engineering/dev_log/
git add docs/engineering/dev_plan/

# Step 4: 添加依赖锁定文件
git add pnpm-lock.yaml

# Step 5: 按之前规划的 commit 分组提交
```

**推荐的 Commit 分组**（结合之前的收敛计划）：

| Commit | 内容 | 命令 |
| --- | --- | --- |
| **Commit 1** | 添加 .gitignore | `git add .gitignore && git commit -m "chore: add .gitignore"` |
| **Commit 2** | 归档可复用参考资产 | `git add docs/engineering/archive/ && git commit -m "chore(archive): preserve reusable backend references"` |
| **Commit 3** | 删除 apps/server | `git add -u && git commit -m "chore(cleanup): remove out-of-scope backend implementation"` |
| **Commit 4** | 添加开发日志和计划 | `git add docs/engineering/dev_log/ docs/engineering/dev_plan/ && git commit -m "docs: add convergence log and dev plan"` |
| **Commit 5** | 添加依赖锁定文件 | `git add pnpm-lock.yaml && git commit -m "chore: add pnpm-lock.yaml"` |

---

### 4️⃣ 清理后预计保留的有效改动类型

| 改动类型 | 文件/目录 | 说明 |
| --- | --- | --- |
| **新增** | `.gitignore` | 仓库清理配置 |
| **新增** | `docs/engineering/archive/week2-backend-reference/` | 归档参考资产（8 个文件） |
| **新增** | `docs/engineering/dev_log/2026-4-20-week1-convergence.md` | 收敛日志 |
| **新增** | `docs/engineering/dev_plan/2026-4-20-18-00-00_DEV_PLAN.md` | 后端开发计划 |
| **新增** | `pnpm-lock.yaml` | 依赖锁定文件 |
| **删除** | `apps/server/README.md` | 后端说明（已删除整个目录） |
| **删除** | `docs/product/Atlax 产品说明书与技术规格书.md` | 旧文档（可能是重复文件） |

**清理效果**：

| 指标 | 结果 |
| --- | --- |
| node_modules 文件数 | ~10000+ |
| Git 跟踪的 node_modules | **0**（已被忽略） |
| 有效改动文件数 | ~12 个 |
| 仓库状态 | ✅ 干净，可正常提交 |

---

### 5️⃣ 补充说明

**pnpm-lock.yaml 处理**：

- ✅ 这是正常的依赖锁定文件，**应该提交**
- ✅ 不应删除，用于保证依赖版本一致性
- ✅ 已被正确识别为未跟踪文件，需要 `git add`

**已删除的 apps/server 目录**：

- ✅ 整个目录已物理删除
- ✅ Git 显示 `apps/server/README.md` 为删除状态
- ✅ 其他 apps/server 文件可能未被 Git 跟踪（因为之前可能未提交）

**下一步建议**：

1. 先提交 `.gitignore`（确保 node_modules 永不进入 Git）
2. 再按之前规划的 commit 分组提交收敛内容
3. 最后添加 `pnpm-lock.yaml`

---

仓库清理完成。是否需要我帮你执行这些 git commit？