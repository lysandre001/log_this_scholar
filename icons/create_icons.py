#!/usr/bin/env python3
"""
生成简单的占位PNG图标（使用PIL，如果没有cairosvg）
"""

try:
    from PIL import Image, ImageDraw
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("警告: 未安装PIL，将尝试使用cairosvg")

if not HAS_PIL:
    try:
        import cairosvg
        import os
        svg_path = os.path.join(os.path.dirname(__file__), 'icon.svg')
        sizes = [16, 48, 128]
        for size in sizes:
            png_path = os.path.join(os.path.dirname(__file__), f'icon{size}.png')
            cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
            print(f"✓ 生成 {png_path}")
        exit(0)
    except ImportError:
        print("错误: 需要安装 PIL 或 cairosvg")
        print("运行: pip install pillow 或 pip install cairosvg")
        exit(1)

def create_placeholder_icon(size):
    """创建简单的占位图标"""
    img = Image.new('RGB', (size, size), color=(90, 127, 184))  # 蓝灰色
    draw = ImageDraw.Draw(img)
    
    # 绘制简单的"S"字母
    try:
        from PIL import ImageFont
        # 尝试使用系统字体
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # 计算文本位置（居中）
    text = "S"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    return img

if __name__ == '__main__':
    sizes = [16, 48, 128]
    for size in sizes:
        img = create_placeholder_icon(size)
        png_path = f'icon{size}.png'
        img.save(png_path)
        print(f"✓ 生成 {png_path} ({size}x{size})")
    print("\n所有图标生成完成！")

