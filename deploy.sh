#!/bin/bash

# 部署到 GitHub Pages 的脚本

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是 git 仓库"
    exit 1
fi

# 构建项目
echo "📦 构建项目..."
yarn build

# 检查构建是否成功
if [ ! -d "dist-gzip" ]; then
    echo "❌ 错误: 构建失败，dist-gzip 目录不存在"
    exit 1
fi

# 切换到 gh-pages 分支
echo "🌿 切换到 gh-pages 分支..."
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# 删除所有文件（除了 .git）
echo "🗑️  清理旧文件..."
find . -maxdepth 1 -not -name '.git' -not -name '.' -exec rm -rf {} +

# 复制构建文件
echo "📋 复制构建文件..."
cp -r dist-gzip/* .

# 添加所有文件
echo "➕ 添加文件到 git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy to GitHub Pages - $(date)"

# 推送到远程
echo "🚀 推送到 GitHub..."
git push origin gh-pages

# 切换回主分支
echo "🔄 切换回主分支..."
git checkout main 2>/dev/null || git checkout master

echo "✅ 部署完成！"
echo "🌐 您的网站将在以下地址可用："
echo "   https://[您的用户名].github.io/hcp-details-demo"
