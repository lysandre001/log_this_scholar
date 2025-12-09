#!/usr/bin/env python3
"""
从 logo.jpeg 生成 Chrome 扩展所需的 PNG 图标
需要安装: pip install pillow
"""

from PIL import Image
import os

def convert_logo_to_icons():
    logo_path = os.path.join(os.path.dirname(__file__), 'logo.jpeg')
    sizes = [16, 48, 128]
    
    if not os.path.exists(logo_path):
        print(f"错误: 找不到 {logo_path}")
        return False
    
    try:
        # 打开原始图片
        img = Image.open(logo_path)
        
        # 转换为 RGB（如果是 RGBA 或其他格式）
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        for size in sizes:
            # 调整大小并保持比例（使用高质量重采样）
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # 保存为 PNG
            png_path = os.path.join(os.path.dirname(__file__), f'icon{size}.png')
            resized.save(png_path, 'PNG', optimize=True)
            print(f"✓ 生成 {png_path} ({size}x{size})")
        
        return True
    except Exception as e:
        print(f"✗ 转换失败: {e}")
        return False

if __name__ == '__main__':
    print("正在从 logo.jpeg 生成图标...")
    if convert_logo_to_icons():
        print("\n所有图标生成完成！")
        print("请重新加载 Chrome 扩展以查看新图标。")
    else:
        print("\n图标生成失败，请检查错误信息。")

