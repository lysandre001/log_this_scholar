# 图标生成说明

本扩展需要以下尺寸的PNG图标：
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

## 方法1：使用在线工具转换
1. 打开 `icon.svg`
2. 使用在线SVG转PNG工具（如 https://cloudconvert.com/svg-to-png）
3. 生成所需尺寸的PNG文件并保存到 `icons/` 目录

## 方法2：使用ImageMagick（如果已安装）
```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## 方法3：使用Python脚本
运行以下Python脚本生成图标：

```python
from PIL import Image
import cairosvg

# 生成不同尺寸的图标
sizes = [16, 48, 128]
for size in sizes:
    cairosvg.svg2png(url='icon.svg', write_to=f'icon{size}.png', output_width=size, output_height=size)
```

## 临时方案
如果暂时没有图标，可以：
1. 使用Chrome扩展的默认图标
2. 或者创建简单的纯色PNG文件作为占位符

