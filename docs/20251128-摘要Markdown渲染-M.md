# 摘要卡片 Markdown 渲染优化

## 📋 任务信息
- 类型：🟡 中等任务 (M)
- 预计时间：30 分钟
- 问题：摘要内容很长时，纯文本展示可读性差

## 🎯 方案
1. 修改 AI 提示词，要求使用 Markdown 格式输出摘要
2. 安装 react-markdown 库
3. 更新 SidePanel 组件，支持 Markdown 渲染

## 📋 清单
- [x] 修改提示词规则 (10min)
- [x] 安装 react-markdown 依赖 (2min)
- [x] 更新 SidePanel 摘要渲染 (15min)
- [ ] 验证效果 (3min)

## ✅ 验收
- [ ] 摘要支持 Markdown 格式（标题、列表、加粗等）
- [ ] 样式美观，与现有 UI 协调
- [ ] 无功能退化

