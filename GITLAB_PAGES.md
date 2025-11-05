# GitLab Pages 部署指南

## 📋 配置说明

本项目已配置 GitLab CI/CD 用于自动部署到 GitLab Pages。

## 🚀 部署步骤

### 1. GitLab 项目设置

1. 进入您的 GitLab 项目页面
2. 点击左侧菜单 **Settings** → **Pages**
3. 确保 Pages 功能已启用（通常默认启用）

### 2. 配置项目路径（重要！）

GitLab Pages 的访问路径取决于您的项目路径结构：

- **如果项目路径是：** `group-name/hcp-details-demo`
  - 访问地址：`https://username.gitlab.io/group-name/hcp-details-demo/`
  - `baseHref` 应该是：`/group-name/hcp-details-demo/`

- **如果项目路径是：** `hcp-details-demo`（在根组下）
  - 访问地址：`https://username.gitlab.io/hcp-details-demo/`
  - `baseHref` 应该是：`/hcp-details-demo/`

**需要修改的地方：**

1. **修改 `angular.json`** 中的 `gitlab` 配置：
   ```json
   "baseHref": "/您的实际项目路径/"
   ```

2. **修改 `.gitlab-ci.yml`** 中的 `BASE_HREF` 变量（可选，主要用于文档说明）

### 3. 推送代码触发部署

```bash
# 确保所有更改已提交
git add .
git commit -m "配置 GitLab Pages 部署"
git push origin dev  # 或 main/master
```

### 4. 监控部署状态

1. 在 GitLab 项目页面，点击左侧菜单 **CI/CD** → **Pipelines**
2. 查看构建和部署状态
3. 等待部署完成（通常需要 3-8 分钟）

### 5. 访问您的网站

部署成功后，您的网站将在以下地址可用：

```
https://[您的用户名].gitlab.io/[项目路径]/
```

例如：
- `https://username.gitlab.io/hcp-details-demo/`
- `https://username.gitlab.io/group-name/hcp-details-demo/`

## ⚙️ 配置说明

### GitLab CI/CD 配置

- **触发分支：** `main`、`master`、`dev`
- **构建工具：** Node.js 20 + Yarn
- **构建配置：** 使用 `gitlab` 配置（`baseHref: "/hcp-details-demo/"`）
- **输出目录：** `dist-gzip` → `public/`（GitLab Pages 要求）

### 构建配置对比

| 配置 | baseHref | 用途 |
|------|----------|------|
| `production` | `/` | 本地测试、其他部署 |
| `github` | `/hcp-details-demo/` | GitHub Pages |
| `gitlab` | `/hcp-details-demo/` | GitLab Pages |

## 🔧 自定义配置

### 修改触发分支

编辑 `.gitlab-ci.yml`，修改 `rules` 部分：

```yaml
rules:
  - if: $CI_COMMIT_BRANCH == "your-branch-name"
    when: on_success
```

### 修改 Node.js 版本

编辑 `.gitlab-ci.yml`，修改 `NODE_VERSION` 变量：

```yaml
variables:
  NODE_VERSION: "18"  # 或其他版本
```

### 修改 baseHref

1. **方式一：** 修改 `angular.json` 中的 `gitlab` 配置
2. **方式二：** 使用环境变量（需要修改构建脚本）

## 🐛 故障排除

### 常见问题

1. **404 错误**
   - 检查 `baseHref` 是否与项目路径匹配
   - 确保 GitLab Pages 已启用
   - 检查构建产物是否在 `public/` 目录

2. **构建失败**
   - 检查 Node.js 版本（项目要求 >=18.0.0）
   - 查看 CI/CD Pipeline 日志
   - 确保 `yarn.lock` 已提交

3. **资源加载失败**
   - 检查 `dist-gzip` 目录结构
   - 确认所有静态资源路径正确
   - 查看浏览器控制台错误信息

### 调试步骤

1. 查看 **CI/CD** → **Pipelines** 中的构建日志
2. 检查 **Settings** → **Pages** 中的部署状态
3. 验证 `dist-gzip` 目录内容
4. 检查浏览器控制台和网络请求

## 📝 注意事项

1. **首次部署**：可能需要手动触发 Pipeline 或等待首次推送
2. **缓存**：GitLab CI 会缓存 `node_modules`，加快后续构建速度
3. **部署时间**：首次部署可能需要较长时间，后续部署会更快
4. **HTTPS**：GitLab Pages 默认使用 HTTPS，无需额外配置

## 🔄 更新部署

每次推送代码到配置的分支（`main`/`master`/`dev`）时，GitLab CI/CD 会自动：

1. ✅ 安装依赖
2. ✅ 构建项目（使用 `gitlab` 配置）
3. ✅ 处理文件（Gulp）
4. ✅ 部署到 GitLab Pages

**无需手动操作！**

## 📚 相关文档

- [GitLab Pages 文档](https://docs.gitlab.com/ee/user/project/pages/)
- [GitLab CI/CD 文档](https://docs.gitlab.com/ee/ci/)
- [Angular 部署文档](https://angular.io/guide/deployment)

