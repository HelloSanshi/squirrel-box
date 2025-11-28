# 松鼠收藏夹 🐿️

一款智能浏览器插件，帮助你高效收集 Twitter 和小红书的优质内容，并借助 AI 快速创作多语言内容。

## ✨ 功能特性

### 🗂️ 多平台支持
- **Twitter/X**：收集推文，AI 辅助创作
- **小红书**：收集笔记，智能整理

### 📚 智能收集
- 🔖 **一键收藏**：快速保存优质内容到本地
- 🤖 **AI 智能总结**：自动提取核心观点和关键信息
- 💾 **本地存储**：所有数据安全存储在浏览器本地
- 🏷️ **自动标签**：AI 自动分类和打标签
- 🔍 **内容搜索**：快速查找历史收藏

### ✍️ AI 创作助手
- 📝 **智能创作**：基于收集的内容生成新创意
- 🌍 **多语言支持**：中文、英文、日文、韩文等
- 🎨 **风格定制**：专业、幽默、简洁、详细等多种风格
- 📏 **长度控制**：短文、标准、长文，满足不同需求
- 🔄 **多版本生成**：一次生成多个版本供选择
- 📋 **一键复制**：快速复制使用

### ⚙️ 灵活配置
- 🤖 **AI 模型选择**：支持任何兼容 OpenAI API 的服务
- 🔧 **自定义设置**：默认语言、模型参数等
- 🧪 **连接测试**：验证 API 配置是否正确
- 🎯 **个性化偏好**：保存常用设置

## 🚀 快速开始

### 📦 安装插件

#### 方式一：从源码构建（开发者）

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/creator-plugin.git
   cd creator-plugin
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建插件**
   ```bash
   # 开发模式（热更新）
   npm run dev
   
   # 生产构建
   npm run build
   ```

4. **加载到浏览器**
   - 打开 Chrome 浏览器
   - 地址栏输入 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录下的 `dist` 文件夹

#### 方式二：从 Chrome 应用商店安装（即将上线）
- 🚧 正在准备中...

### ⚙️ 配置 AI API

首次使用需要配置 AI 服务：

1. **打开设置页面**
   - 点击浏览器工具栏中的插件图标
   - 选择"设置"或右键点击图标选择"选项"

2. **填写 API 配置**
   - **API Key**：你的 AI 服务 API 密钥
   - **Base URL**：API 接口地址
     - OpenAI: `https://api.openai.com/v1`
     - 其他服务：按服务商提供的地址填写
   - **模型名称**：要使用的模型
     - OpenAI: `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`
     - Claude: `claude-sonnet-4-20250514`, `claude-3-opus-20240229`
     - 其他: 按服务商提供的模型名称填写

3. **测试连接**
   - 点击"测试连接"按钮
   - 确认配置正确后点击"保存"

> 💡 **提示**：API Key 会加密存储在本地，不会上传到任何服务器

### 📖 使用指南

#### 在 Twitter 上收集推文

1. **打开 Twitter/X**
   - 访问 [twitter.com](https://twitter.com) 或 [x.com](https://x.com)

2. **收藏推文**
   - 浏览时看到喜欢的推文
   - 点击推文下方的"书签"图标（如果你已经书签过，插件会自动识别）
   - 插件会自动保存并调用 AI 进行智能总结

3. **查看收藏**
   - 点击插件图标打开侧边栏
   - 在"收藏库"标签查看所有收集的推文
   - 可以搜索、筛选、删除

#### 在小红书上收集笔记

1. **打开小红书**
   - 访问 [xiaohongshu.com](https://www.xiaohongshu.com)

2. **收藏笔记**
   - 浏览笔记时点击收藏按钮
   - 插件自动保存并智能分析内容

3. **查看收藏**
   - 在插件侧边栏查看所有收集的笔记

#### AI 辅助创作

1. **打开创作面板**
   - 点击插件图标
   - 选择"创作"标签

2. **选择素材（可选）**
   - 从收藏库中选择 1-5 条内容作为参考
   - 或者直接输入主题

3. **设置创作参数**
   - **主题**：输入你想创作的内容主题
   - **语言**：选择目标语言（中文/英文/日文/韩文等）
   - **风格**：选择创作风格
     - 专业严肃：适合行业观点
     - 轻松幽默：适合日常分享
     - 简洁精炼：适合快速传达
     - 详细解释：适合教程类内容
   - **长度**：选择内容长度
     - 短文（<140字）：快速观点
     - 标准（140-280字）：完整表达
     - 长文：需要展开说明的内容

4. **生成内容**
   - 点击"生成"按钮
   - AI 会生成 2-3 个不同版本
   - 选择喜欢的版本，点击"复制"
   - 可以点击"重新生成"获取更多版本

5. **编辑和发布**
   - 复制后可以在原平台粘贴发布
   - 或者在插件中继续编辑优化

## 🛠️ 开发指南

### 技术栈

- **框架**：React 19 + TypeScript
- **构建工具**：Vite 7 + CRXJS (Chrome Extension Plugin)
- **样式方案**：Tailwind CSS
- **图标库**：Lucide React
- **浏览器 API**：Chrome Extension Manifest V3

### 项目结构

```
creator-plugin/
├── src/
│   ├── background/           # 后台服务脚本
│   │   └── index.ts         # Service Worker
│   ├── content/             # 内容脚本（注入到页面）
│   │   ├── index.ts         # Twitter/X 平台
│   │   └── xiaohongshu.ts   # 小红书平台
│   ├── popup/               # 弹出窗口（点击图标）
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Popup.tsx
│   ├── sidepanel/           # 侧边栏面板
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── SidePanel.tsx
│   ├── options/             # 设置页面
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Options.tsx
│   ├── lib/                 # 公共库
│   │   ├── types.ts        # TypeScript 类型定义
│   │   ├── storage.ts      # Chrome Storage 封装
│   │   ├── ai.ts           # AI 服务调用
│   │   └── utils.ts        # 工具函数
│   └── index.css           # 全局样式
├── public/                  # 静态资源
│   └── icons/              # 插件图标
├── manifest.json           # 扩展配置文件
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
└── package.json
```

### 开发环境设置

1. **环境要求**
   - Node.js >= 18
   - npm >= 9
   - Chrome 浏览器

2. **启动开发服务器**
   ```bash
   npm run dev
   ```
   - Vite 会自动监听文件变化
   - 修改代码后自动重新构建
   - 需要在浏览器中手动刷新扩展

3. **构建生产版本**
   ```bash
   npm run build
   ```
   - 输出到 `dist/` 目录
   - 代码会被压缩优化

4. **代码检查**
   ```bash
   npm run lint
   ```

### 开发技巧

#### 调试插件

1. **查看日志**
   - Service Worker 日志：`chrome://extensions/` → 找到插件 → 点击"Service Worker"
   - Content Script 日志：在目标网站按 F12，查看 Console
   - Popup/Options 日志：在对应页面右键 → "检查"

2. **重新加载插件**
   - 代码修改后，在 `chrome://extensions/` 点击刷新图标
   - 或使用快捷键（通常是点击扩展，然后刷新）

3. **调试技巧**
   - 使用 `console.log()` 输出调试信息
   - 在 Chrome DevTools 中设置断点
   - 查看 Storage：DevTools → Application → Storage

#### 常见问题

**Q: 修改代码后没有生效？**
- A: 需要在 `chrome://extensions/` 手动刷新插件

**Q: Content Script 无法访问页面元素？**
- A: 检查 `manifest.json` 中的 `content_scripts.matches` 配置是否正确

**Q: API 调用失败？**
- A: 检查 CORS 配置，确保 API 服务允许浏览器扩展访问

**Q: 如何添加新平台支持？**
- A: 
  1. 在 `src/content/` 创建新的平台脚本
  2. 在 `manifest.json` 的 `content_scripts` 添加匹配规则
  3. 实现内容收集和页面注入逻辑

### 贡献指南

欢迎贡献代码！请遵循以下流程：

1. **Fork 项目**
   ```bash
   git clone https://github.com/yourusername/creator-plugin.git
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```
   
   提交信息规范：
   - `feat`: 新功能
   - `fix`: 修复 Bug
   - `docs`: 文档更新
   - `style`: 代码格式调整
   - `refactor`: 代码重构
   - `test`: 测试相关
   - `chore`: 构建/工具相关

4. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

### 发布流程

1. **更新版本号**
   - 修改 `package.json` 和 `manifest.json` 中的版本号

2. **构建生产版本**
   ```bash
   npm run build
   ```

3. **测试构建产物**
   - 加载 `dist/` 目录到浏览器测试
   - 确保所有功能正常

4. **打包发布**
   - 压缩 `dist/` 目录为 zip 文件
   - 上传到 Chrome Web Store

## 🔐 隐私与安全

我们非常重视用户隐私和数据安全：

### 数据存储
- ✅ **本地优先**：所有收集的内容都存储在浏览器本地
- ✅ **不上传服务器**：插件不会将你的数据上传到任何第三方服务器
- ✅ **完全可控**：你可以随时查看、导出或删除所有数据

### API 安全
- 🔒 **加密存储**：API Key 使用浏览器的加密存储
- 🔒 **直连服务**：AI 调用直接发送到你配置的服务商，插件不经手数据
- 🔒 **无日志记录**：插件不记录或分析你的 API 调用内容

### 权限说明
插件需要以下权限：

| 权限 | 用途 | 说明 |
|------|------|------|
| `storage` | 存储数据 | 保存收集的内容、用户设置等 |
| `sidePanel` | 侧边栏 | 显示收藏库和创作面板 |
| `activeTab` | 当前标签页 | 在当前页面注入收集功能 |
| `scripting` | 脚本注入 | 在 Twitter/小红书页面添加收藏按钮 |
| `host_permissions` | 访问网站 | 仅限 Twitter/X 和小红书官方域名 |

### 数据导出
你可以随时导出所有数据：
1. 打开设置页面
2. 点击"数据管理" → "导出数据"
3. 选择导出格式（JSON/CSV）
4. 下载到本地

## 🌟 支持的 AI 服务

插件支持任何兼容 OpenAI API 格式的服务：

### 国际服务
- **OpenAI**
  - Models: GPT-4o, GPT-4, GPT-3.5-turbo
  - Base URL: `https://api.openai.com/v1`
  
- **Anthropic Claude**（需要兼容代理）
  - Models: claude-sonnet-4, claude-3-opus, claude-3-sonnet
  - 推荐使用兼容服务如：OpenRouter, Claude API Proxy
  
- **Google Gemini**（需要兼容代理）
  - Models: gemini-pro, gemini-1.5-pro
  - 推荐使用兼容服务

### 国内服务
- **阿里云通义千问**
  - Models: qwen-max, qwen-plus, qwen-turbo
  - 支持 OpenAI 兼容模式
  
- **百度文心一言**
  - Models: ERNIE-4.0, ERNIE-3.5
  - 需要配置兼容接口
  
- **字节跳动豆包**
  - Models: doubao-pro, doubao-lite
  - 支持 OpenAI 兼容模式
  
- **讯飞星火**
  - Models: spark-max, spark-pro
  - 需要配置兼容接口

### 中转服务
如果你不想直接调用官方 API，也可以使用中转服务：
- OpenRouter
- API2D
- OpenAI-SB
- 其他提供 OpenAI 兼容接口的服务

### 配置示例

**OpenAI 官方**
```
API Key: sk-xxxxxxxxxxxxxxxxxxxxx
Base URL: https://api.openai.com/v1
Model: gpt-4o
```

**通义千问**
```
API Key: sk-xxxxxxxxxxxxxxxxxxxxx
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-max
```

**使用中转服务**
```
API Key: 中转服务提供的 Key
Base URL: 中转服务提供的地址
Model: 按中转服务要求填写
```

## 💡 使用技巧

### 提高收集效率
- 浏览时看到好内容立即收藏，不要等
- 定期整理收藏库，删除不需要的内容
- 善用搜索和标签功能快速定位

### 提升创作质量
- 选择 3-5 条相关内容作为参考效果最好
- 尝试不同的风格和长度找到最适合你的
- 生成后可以手动微调，不必完全依赖 AI
- 同一主题可以多生成几次，选择最满意的版本

### 节省 API 成本
- 选择性收集真正有价值的内容，减少无效总结
- 创作时先明确主题和要求，避免反复生成
- 对于简单内容，可以选择更便宜的模型
- 使用支持缓存的 API 服务商

## ❓ 常见问题 (FAQ)

### 安装与配置

**Q: 插件图标变灰色/不可用？**
- A: 只有在 Twitter/X 或小红书页面才会激活，其他网站不可用

**Q: 如何获取 API Key？**
- A: 
  - OpenAI: 访问 [platform.openai.com](https://platform.openai.com)
  - 国内服务: 访问对应服务商官网注册
  - 中转服务: 联系服务商客服

**Q: 测试连接失败？**
- A: 检查以下几点：
  1. API Key 是否正确（注意不要有多余空格）
  2. Base URL 是否正确（要包含 `/v1`）
  3. 网络是否能访问该服务
  4. API Key 是否有余额/权限

### 使用功能

**Q: 收藏后看不到内容？**
- A: 
  1. 打开侧边栏查看（点击插件图标）
  2. 检查是否被 AI 总结（可能需要几秒钟）
  3. 查看浏览器 Console 是否有错误

**Q: AI 生成的内容不满意？**
- A: 
  1. 尝试调整创作参数（风格、长度）
  2. 更换不同的 AI 模型
  3. 提供更多参考内容
  4. 在生成结果基础上手动修改

**Q: 收藏库太大，影响性能？**
- A: 
  1. 定期清理不需要的内容
  2. 导出并删除旧内容
  3. 浏览器存储限额约 10MB

**Q: 可以同时收藏多个平台的内容吗？**
- A: 可以！Twitter 和小红书的内容会分别标记，可以在侧边栏筛选查看

### 高级使用

**Q: 可以在移动端使用吗？**
- A: 目前仅支持桌面版 Chrome/Edge 浏览器

**Q: 数据可以在多个设备同步吗？**
- A: 暂不支持，数据存储在本地浏览器

**Q: 可以批量导出收藏吗？**
- A: 可以！在设置页面选择"导出数据"

**Q: 支持自定义 AI 提示词吗？**
- A: 未来版本会支持，当前使用内置优化的提示词

## 🗺️ 开发路线图

### 当前版本 v1.0 ✅
- [x] 基础收藏功能
- [x] AI 智能总结
- [x] AI 辅助创作
- [x] Twitter/X 平台支持
- [x] 小红书平台支持
- [x] 多语言生成
- [x] 本地存储

### 计划中 v1.1 🚧
- [ ] 收藏库高级搜索和筛选
- [ ] 自定义 AI 提示词
- [ ] 内容标签管理
- [ ] 批量操作（删除、导出、标记）
- [ ] 数据统计和分析

### 未来版本 v2.0 💭
- [ ] 更多平台支持（Instagram, LinkedIn）
- [ ] 云同步功能（可选）
- [ ] 定时发布
- [ ] 团队协作
- [ ] 浏览器历史智能回顾
- [ ] AI 自动分类和整理

## 📝 更新日志

### v1.0.0 (2025-11-28)
- 🎉 首个正式版本发布
- ✨ 支持 Twitter/X 和小红书平台
- ✨ AI 智能收集和总结
- ✨ AI 辅助创作功能
- ✨ 多语言、多风格支持
- ✨ 本地数据存储

## 📄 许可证

MIT License

Copyright (c) 2025 松鼠收藏夹

本项目采用 MIT 许可证，你可以自由使用、修改和分发。

## 🤝 贡献者

感谢所有贡献者的付出！

如果你也想为项目做贡献，请查看[贡献指南](#贡献指南)。

## 💬 反馈与支持

### 问题反馈
- 🐛 发现 Bug？请[提交 Issue](https://github.com/yourusername/creator-plugin/issues)
- 💡 有新想法？欢迎[提交 Feature Request](https://github.com/yourusername/creator-plugin/issues)

### 联系方式
- 📧 Email: your.email@example.com
- 💬 讨论群：[加入讨论]

### 支持项目
如果这个项目对你有帮助：
- ⭐ 给项目点个 Star
- 🐦 分享给更多朋友
- ☕ [请我喝杯咖啡](https://buymeacoffee.com/yourusername)

---

<div align="center">

**用 AI 让内容收集和创作更简单 🚀**

[开始使用](#-快速开始) • [查看文档](#-使用指南) • [参与贡献](#贡献指南)

Made with ❤️ by 松鼠收藏夹团队

</div>
