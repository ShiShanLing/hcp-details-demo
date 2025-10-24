# Git 常用命令记录

## 📋 基本工作流程

### 1. 查看状态
```bash
git status                    # 查看当前文件状态
git log --oneline -3          # 查看最近3次提交记录
```

### 2. 添加文件到暂存区
```bash
git add .                     # 添加所有文件（最常用）
git add filename.txt          # 添加特定文件
git add *.js                  # 添加所有 .js 文件
```

### 3. 提交更改
```bash
git commit -m "提交说明"      # 提交暂存区的文件
```

### 4. 推送到远程仓库
```bash
git push origin dev           # 推送到 dev 分支（部署用）
git push origin master        # 推送到 master 分支
```

## 🚀 完整部署流程（最常用）

```bash
# 1. 查看状态
git status

# 2. 添加所有更改
git add .

# 3. 提交更改
git commit -m "修复图片路径问题"

# 4. 推送到 dev 分支（自动触发部署）
git push origin dev
```

## 🔄 分支操作

```bash
git checkout dev              # 切换到 dev 分支
git checkout master          # 切换到 master 分支
git branch                   # 查看所有分支
```

## 🛠️ 常用场景

### 场景1：开发新功能
```bash
git add .
git commit -m "添加新功能"
git push origin dev
```

### 场景2：修复问题
```bash
git add .
git commit -m "修复Safari兼容性问题"
git push origin dev
```

### 场景3：更新配置
```bash
git add .
git commit -m "更新Angular配置"
git push origin dev
```

## 📝 提交信息模板

- `修复图片路径问题`
- `添加新功能`
- `修复Safari兼容性问题`
- `更新Angular配置`
- `优化构建配置`

## ⚠️ 注意事项

1. **总是先 `git add .` 再 `git commit`**
2. **推送到 `dev` 分支会自动部署到 GitHub Pages**
3. **提交信息要简洁明了**
4. **推送前先检查 `git status`**

## 🎯 快速记忆

**最常用的4个命令：**
1. `git status` - 查看状态
2. `git add .` - 添加所有文件
3. `git commit -m "说明"` - 提交
4. `git push origin dev` - 推送并部署

---
*这个文件记录了项目开发中最常用的 Git 命令，方便快速查阅和使用。*
