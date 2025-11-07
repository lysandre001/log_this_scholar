# Log this scholar - Google Scholar信息采集扩展

一个Chrome浏览器扩展，用于一键复制Google Scholar研究者主页的标准化信息。

## 功能特性

- ✅ 一键复制研究者信息（姓名、机构、被引次数、canonical URL、个人主页、研究主题）
- ✅ 支持右键菜单快速操作
- ✅ 支持插件弹窗操作
- ✅ 优雅的错误处理和状态提示
- ✅ 简约的蓝灰色UI设计

## 安装方法

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本项目目录
5. 扩展安装完成！

## 使用方法

### 方法1：右键菜单
1. 打开任意Google Scholar研究者主页（URL格式：`https://scholar.google.com/citations?user=...`）
2. 右键点击页面
3. 选择"Copy Scholar Info"
4. 信息已复制到剪贴板

### 方法2：插件弹窗
1. 打开任意Google Scholar研究者主页
2. 点击浏览器工具栏中的扩展图标
3. 点击"Copy Scholar Info"按钮
4. 信息已复制到剪贴板

## 输出格式

复制的信息格式为逗号分隔的一行文本：
```
姓名,机构,被引次数,canonical URL,个人主页,研究主题1|研究主题2|研究主题3
```

示例：
```
Ilia Sucholutsky,New York University,2,349,https://scholar.google.com/citations?user=6MfHyuMAAAAJ&hl=en,https://ilia.sucholutsky.com,deep learning|representation learning|small data
```

## 提取的字段说明

- **name**: 研究者姓名
- **affiliation**: 所属机构
- **cited_by**: 总被引次数（右侧指标表格中"Citations"行的"ALL"列）
- **canonical**: `<link rel="canonical">` 的URL
- **homepage**: 研究者个人主页链接（Homepage按钮）
- **topics**: 研究主题标签（用竖线 `|` 分隔）

## 项目结构

```
.
├── manifest.json          # Chrome扩展清单文件
├── background.js          # Service Worker（处理右键菜单）
├── content.js            # Content Script（提取页面信息）
├── popup.html            # 弹窗界面HTML
├── popup.css             # 弹窗样式
├── popup.js              # 弹窗逻辑
├── icons/                # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── README.md             # 本文件
```

## 开发说明

### 修改图标
如果需要修改图标，编辑 `icons/icon.svg`，然后运行：
```bash
cd icons
python3 create_icons.py
```

### 调试
1. 打开 `chrome://extensions/`
2. 找到"Log this scholar"扩展
3. 点击"检查视图"下的"service worker"或"popup"进行调试

## 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript（无框架依赖）
- CSS3（简约蓝灰色主题）

## 许可证

MIT License

