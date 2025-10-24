# 项目脚本使用说明

## 🚀 启动项目

### 开发环境启动
```bash
# 默认启动（开发模式）
npm start
# 或
yarn start

# 明确指定开发环境
npm run start:dev
# 或
yarn start:dev
```

### 生产环境启动（本地测试）
```bash
npm run start:prod
# 或
yarn start:prod
```

## 📦 项目打包

### 开发环境打包
```bash
npm run build:dev
# 或
yarn build:dev
```

### 生产环境打包
```bash
npm run build:prod
# 或
yarn build:prod
```

### 监听模式打包（开发时使用）
```bash
npm run build:watch
# 或
yarn build:watch
```

## 🔍 项目分析

### 打包分析
```bash
npm run build:analyze
# 或
yarn build:analyze
```
这会生成打包分析报告，帮助优化项目大小。

### 本地预览打包结果
```bash
npm run serve:dist
# 或
yarn serve:dist
```
在本地服务器上预览打包后的项目。

## 🧪 测试

### 运行测试
```bash
npm test
# 或
yarn test
```

### 监听模式测试
```bash
npm run test:watch
# 或
yarn test:watch
```

### 测试覆盖率
```bash
npm run test:coverage
# 或
yarn test:coverage
```

## 🔧 代码质量

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

## 📋 常用命令组合

### 完整开发流程
```bash
# 1. 安装依赖
npm install
# 或
yarn install

# 2. 启动开发服务器
npm start

# 3. 在另一个终端运行测试
npm run test:watch
```

### 生产部署流程
```bash
# 1. 生产环境打包
npm run build:prod

# 2. 本地预览
npm run serve:dist

# 3. 分析打包结果
npm run build:analyze
```

## 🌐 端口说明

- **开发服务器**: http://localhost:4200
- **打包预览服务器**: http://localhost:8080

## 📁 输出目录

- **开发打包**: `dist/hcp-details-demo/`
- **生产打包**: `dist/hcp-details-demo/`
