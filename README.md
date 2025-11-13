# HCP Details Demo

一个基于 Angular 20 的医疗专业详情展示应用，支持响应式设计，适配桌面端和移动端。

## 🚀 项目简介

本项目是一个医疗专业详情展示系统，具有以下特性：
- 📱 响应式设计，支持桌面端和移动端
- 🎨 使用 ng-zorro-antd 组件库
- 📊 集成 ECharts 图表展示
- 🎯 智能标签和AI分析功能
- 📋 医生能力评估和项目展示

## 🛠️ 运行环境

### 系统要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 开发环境
- **Angular CLI**: ^20.3.7
- **Angular**: ^20.3.0
- **TypeScript**: ~5.9.2
- **SCSS**: 支持

### 浏览器兼容性
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 📦 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

## 🚀 启动项目

### 开发环境
```bash
# 默认启动（开发模式）
npm start

# 明确指定开发环境
npm run start:dev

# 使用 yarn
yarn start
```

### 生产环境预览
```bash
# 生产环境启动（本地测试）
npm run start:prod
```

## 📦 项目打包

### 开发环境打包
```bash
npm run build:dev
```

### 生产环境打包
```bash
npm run build:prod
```

### 监听模式打包
```bash
npm run build:watch
```

### 打包分析
```bash
npm run build:analyze
```

## 🧪 测试

```bash
# 运行测试
npm test

# 监听模式测试
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## 🔧 开发工具

### 代码质量
```bash
# 代码检查
npm run lint
```

### 本地预览打包结果
```bash
npm run serve:dist
```
怎么停止了
## 📁 项目结构

```
src/
├── app/
│   ├── hcp-details/           # 主功能模块
│   │   ├── components/        # 子组件
│   │   │   ├── mobile-details/   # 移动端组件
│   │   │   └── web-details/      # 桌面端组件
│   │   └── hcp-details.component.*
│   ├── services/             # 服务
│   └── environments/         # 环境配置
├── assets/                   # 静态资源
│   ├── img/                  # 图片资源
│   └── font/                 # 字体文件
│       └── iconfont/         # 图标字体
└── styles.scss              # 全局样式
```

## 🎨 技术栈

- **前端框架**: Angular 20
- **UI组件库**: ng-zorro-antd
- **图表库**: ECharts + ngx-echarts
- **样式**: SCSS
- **图标**: iconfont
- **构建工具**: Angular CLI
- **包管理**: npm/yarn

## 🌐 访问地址

- **开发服务器**: http://localhost:4200
- **打包预览**: http://localhost:8080

## 📋 环境配置

### 开发环境
- 图片路径: `/assets/img/`
- 图标字体: 已配置
- 热重载: 启用

### 生产环境
- 代码压缩: 启用
- 资源优化: 启用
- 缓存策略: 启用

## 🔍 故障排除

### 常见问题

1. **图片无法加载**
   - 检查 `src/assets/img/` 目录是否存在
   - 确认 Angular 配置中的 assets 设置

2. **图标不显示**
   - 确认 iconfont.css 已正确导入
   - 检查字体文件是否存在

3. **样式问题**
   - 确认 ng-zorro-antd 样式已导入
   - 检查 SCSS 编译是否正常

### 调试工具

访问测试页面进行调试：
```
http://localhost:4200/test-assets
```

## 📞 支持

如有问题，请检查：
1. Node.js 和 npm 版本是否符合要求
2. 依赖是否正确安装
3. 开发服务器是否正常启动

## 📄 许可证

MIT License
