# GitHub Pages 部署指南

## 项目配置完成情况

✅ **已完成配置：**
- GitHub Actions 工作流已配置
- Angular 项目已设置正确的 base href
- 构建输出目录已配置为 `dist-gzip`

## 部署步骤

### 1. GitHub 仓库设置

1. 进入您的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**

### 2. 推送代码触发部署

```bash
# 确保所有更改已提交
git add .
git commit -m "更新功能"
git push origin dev
```

### 3. 监控部署状态

1. 在 GitHub 仓库页面，点击 **Actions** 标签
2. 查看 "Deploy to GitHub Pages" 工作流
3. 等待部署完成（通常需要 2-5 分钟）

### 4. 访问您的网站

部署成功后，您的网站将在以下地址可用：
```
https://shishanling.github.io/hcp-details-demo/
```

## 配置说明

### Angular 配置
- **base href**: 设置为 `/hcp-details-demo/` 以匹配 GitHub Pages 的路径结构
- **构建输出**: 使用 `dist-gzip` 目录，包含压缩后的文件

### GitHub Actions 配置
- **触发条件**: 推送到 `dev` 分支时自动部署
- **构建工具**: 使用 Yarn 进行依赖管理和构建
- **部署工具**: 使用 `peaceiris/actions-gh-pages@v3`

## 故障排除

### 常见问题

1. **404 错误**
   - 检查 `baseHref` 配置是否正确
   - 确保仓库名称与 `baseHref` 匹配

2. **构建失败**
   - 检查 Node.js 版本（项目要求 >=18.0.0）
   - 确保所有依赖已正确安装

3. **样式或资源加载失败**
   - 检查 `dist-gzip` 目录中的文件结构
   - 确保所有静态资源路径正确

### 调试步骤

1. 查看 GitHub Actions 日志
2. 检查构建输出目录结构
3. 验证 `dist-gzip` 目录内容

## 自定义域名（可选）

如果您有自己的域名，可以：

1. 在 `dist-gzip` 目录创建 `CNAME` 文件
2. 在文件中写入您的域名
3. 在 GitHub 仓库设置中配置自定义域名

## 更新部署

每次推送代码到 `dev` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

无需手动操作！

## 分支策略

- **master**: 主分支，用于稳定版本
- **dev**: 开发分支，用于开发和部署到 GitHub Pages
- 所有新功能和更新都在 `dev` 分支进行
